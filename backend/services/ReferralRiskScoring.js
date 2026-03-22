/**
 * ReferralRiskScoring.js
 * ML-based prediction of high-risk patients for hospital referral
 */

const db = require('../models');
const { Op } = require('sequelize');

class ReferralRiskScoring {
  constructor() {
    // Risk thresholds
    this.thresholds = {
      critical: 75,
      high: 60,
      moderate: 45,
      low: 30
    };

    // Warning signs that increase referral risk
    this.warningSigns = {
      'chest_pain': 25,
      'difficulty_breathing': 20,
      'severe_dehydration': 25,
      'uncontrolled_pain': 15,
      'high_fever': 15,
      'altered_consciousness': 30,
      'severe_bleeding': 30,
      'seizure': 25,
      'inability_to_feed': 20,
      'convulsions': 25
    };

    // Vital sign thresholds
    this.vitalThresholds = {
      heartRate: { low: 40, high: 120, criticalLow: 30, criticalHigh: 150 },
      respiratoryRate: { low: 8, high: 25, criticalLow: 5, criticalHigh: 35 },
      temperature: { low: 35, high: 39.5, criticalLow: 32, criticalHigh: 41 },
      bloodPressureSystolic: { low: 70, high: 160, criticalLow: 60, criticalHigh: 180 },
      bloodPressureDiastolic: { low: 40, high: 100, criticalLow: 30, criticalHigh: 110 },
      oxygenSaturation: { low: 90, criticalLow: 85 },
      bloodGlucose: { low: 3, high: 16.5, criticalLow: 2.2, criticalHigh: 22 }
    };
  }

  /**
   * Score referral risk for a patient
   */
  async scorePatient(patientId) {
    const patient = await db.Patient.findByPk(patientId, {
      include: [
        { model: db.Visit, as: 'visits' },
        { model: db.Encounter, as: 'encounters' },
        { model: db.Vital, as: 'vitals' }
      ]
    });

    if (!patient) {
      throw new Error('Patient not found');
    }

    const riskFactors = await this.assessRiskFactors(patient);
    const vitalScore = this.assessVitals(patient.vitals?.slice(-5) || []);
    const clinicalScore = this.assessClinicalIndicators(patient);
    const socialScore = this.assessSocialFactors(patient);

    // Weighted combination
    const totalScore = 
      (riskFactors.score * 0.35) +
      (vitalScore * 0.30) +
      (clinicalScore * 0.25) +
      (socialScore * 0.10);

    const referralRecommendation = this.getRecommendation(totalScore, patient);
    const urgencyLevel = this.getUrgencyLevel(totalScore);

    return {
      patientId,
      riskScore: Math.round(totalScore * 100) / 100,
      riskLevel: this.getRiskLevel(totalScore),
      urgencyLevel,
      recommendation: referralRecommendation,
      factors: {
        riskFactors: riskFactors.details,
        vitalSigns: vitalScore,
        clinicalIndicators: clinicalScore,
        socialFactors: socialScore
      },
      suggestedReferralType: this.suggestReferralType(totalScore, patient),
      estimatedReadmissionRisk: await this.predictReadmissionRisk(patient),
      notes: this.generateClinicalNotes(riskFactors, vitalScore, clinicalScore),
      assessedAt: new Date()
    };
  }

  /**
   * Assess patient risk factors
   */
  async assessRiskFactors(patient) {
    let score = 0;
    const details = [];

    // Age-based risk
    const age = this.calculateAge(patient.dateOfBirth);
    if (age < 5) {
      score += 15;
      details.push({ factor: 'age_infant', contribution: 15 });
    } else if (age > 65) {
      score += 20;
      details.push({ factor: 'age_elderly', contribution: 20 });
    } else if (age > 80) {
      score += 30;
      details.push({ factor: 'age_very_elderly', contribution: 30 });
    }

    // Comorbidities count
    const conditions = patient.conditions || [];
    const comorbidityScore = Math.min(conditions.length * 10, 40);
    if (comorbidityScore > 0) {
      score += comorbidityScore;
      details.push({ factor: 'comorbidities', contribution: comorbidityScore, count: conditions.length });
    }

    // Previous hospitalizations (last 6 months)
    const recentHospitalizations = patient.hospitalizations || 0;
    if (recentHospitalizations > 0) {
      const hospScore = Math.min(recentHospitalizations * 8, 30);
      score += hospScore;
      details.push({ factor: 'recent_hospitalizations', contribution: hospScore, count: recentHospitalizations });
    }

    // Previous ED visits
    const edVisits = patient.emergencyVisits || 0;
    if (edVisits > 0) {
      const edScore = Math.min(edVisits * 5, 25);
      score += edScore;
      details.push({ factor: 'emergency_visits', contribution: edScore, count: edVisits });
    }

    // Recent deterioration
    const recentDeterioration = await this.checkRecentDeterioration(patient);
    if (recentDeterioration) {
      score += 20;
      details.push({ factor: 'recent_deterioration', contribution: 20 });
    }

    // Medication non-adherence
    if (patient.medicationAdherence && patient.medicationAdherence < 0.7) {
      score += 15;
      details.push({ factor: 'medication_non_adherence', contribution: 15 });
    }

    return { score: Math.min(score, 100), details };
  }

  /**
   * Assess vital signs
   */
  assessVitals(vitals) {
    let score = 0;
    const abnormalVitals = [];

    if (!vitals || vitals.length === 0) return 0;

    const latestVitals = vitals[vitals.length - 1];

    // Heart rate
    if (latestVitals.heartRate) {
      const hr = latestVitals.heartRate;
      if (hr < this.vitalThresholds.heartRate.criticalLow || hr > this.vitalThresholds.heartRate.criticalHigh) {
        score += 30;
        abnormalVitals.push({ vital: 'heartRate', value: hr, status: 'critical' });
      } else if (hr < this.vitalThresholds.heartRate.low || hr > this.vitalThresholds.heartRate.high) {
        score += 15;
        abnormalVitals.push({ vital: 'heartRate', value: hr, status: 'abnormal' });
      }
    }

    // Respiratory rate
    if (latestVitals.respiratoryRate) {
      const rr = latestVitals.respiratoryRate;
      if (rr < this.vitalThresholds.respiratoryRate.criticalLow || rr > this.vitalThresholds.respiratoryRate.criticalHigh) {
        score += 30;
        abnormalVitals.push({ vital: 'respiratoryRate', value: rr, status: 'critical' });
      } else if (rr < this.vitalThresholds.respiratoryRate.low || rr > this.vitalThresholds.respiratoryRate.high) {
        score += 15;
        abnormalVitals.push({ vital: 'respiratoryRate', value: rr, status: 'abnormal' });
      }
    }

    // Temperature
    if (latestVitals.temperature) {
      const temp = latestVitals.temperature;
      if (temp < this.vitalThresholds.temperature.criticalLow || temp > this.vitalThresholds.temperature.criticalHigh) {
        score += 25;
        abnormalVitals.push({ vital: 'temperature', value: temp, status: 'critical' });
      } else if (temp < this.vitalThresholds.temperature.low || temp > this.vitalThresholds.temperature.high) {
        score += 10;
        abnormalVitals.push({ vital: 'temperature', value: temp, status: 'abnormal' });
      }
    }

    // Blood pressure
    if (latestVitals.bloodPressureSystolic) {
      const sys = latestVitals.bloodPressureSystolic;
      if (sys < this.vitalThresholds.bloodPressureSystolic.criticalLow || sys > this.vitalThresholds.bloodPressureSystolic.criticalHigh) {
        score += 30;
        abnormalVitals.push({ vital: 'bloodPressureSystolic', value: sys, status: 'critical' });
      } else if (sys < this.vitalThresholds.bloodPressureSystolic.low || sys > this.vitalThresholds.bloodPressureSystolic.high) {
        score += 15;
        abnormalVitals.push({ vital: 'bloodPressureSystolic', value: sys, status: 'abnormal' });
      }
    }

    // Oxygen saturation
    if (latestVitals.oxygenSaturation) {
      const o2 = latestVitals.oxygenSaturation;
      if (o2 < this.vitalThresholds.oxygenSaturation.criticalLow) {
        score += 35;
        abnormalVitals.push({ vital: 'oxygenSaturation', value: o2, status: 'critical' });
      } else if (o2 < this.vitalThresholds.oxygenSaturation.low) {
        score += 20;
        abnormalVitals.push({ vital: 'oxygenSaturation', value: o2, status: 'abnormal' });
      }
    }

    return { score: Math.min(score, 100), abnormalVitals };
  }

  /**
   * Assess clinical indicators
   */
  assessClinicalIndicators(patient) {
    let score = 0;
    const indicators = [];

    // Check for warning symptoms
    if (patient.symptoms && Array.isArray(patient.symptoms)) {
      patient.symptoms.forEach(symptom => {
        const normalized = symptom.toLowerCase();
        if (this.warningSigns[normalized]) {
          score += this.warningSigns[normalized];
          indicators.push({ symptom, score: this.warningSigns[normalized] });
        }
      });
    }

    // Mental status
    if (patient.mentalStatus === 'altered' || patient.mentalStatus === 'unconscious') {
      score += 30;
      indicators.push({ symptom: 'altered_consciousness', score: 30 });
    }

    // Functional status decline
    if (patient.functionalStatus === 'declining') {
      score += 20;
      indicators.push({ symptom: 'functional_decline', score: 20 });
    }

    // Weight loss
    if (patient.unintentionalWeightLoss) {
      score += 15;
      indicators.push({ symptom: 'unintentional_weight_loss', score: 15 });
    }

    // Falls (recent)
    if (patient.recentFalls && patient.recentFalls > 0) {
      score += Math.min(patient.recentFalls * 5, 20);
      indicators.push({ symptom: 'recent_falls', score: Math.min(patient.recentFalls * 5, 20) });
    }

    return { score: Math.min(score, 100), indicators };
  }

  /**
   * Assess social factors
   */
  assessSocialFactors(patient) {
    let score = 0;
    const factors = [];

    // Living situation
    if (patient.livesAlone) {
      score += 10;
      factors.push({ factor: 'lives_alone', contribution: 10 });
    }

    // Caregiver availability
    if (!patient.hasCaregiver) {
      score += 15;
      factors.push({ factor: 'no_caregiver', contribution: 15 });
    }

    // Access to care
    if (!patient.hasTransport) {
      score += 10;
      factors.push({ factor: 'no_transport', contribution: 10 });
    }

    // Health literacy
    if (patient.healthLiteracy === 'low') {
      score += 10;
      factors.push({ factor: 'low_health_literacy', contribution: 10 });
    }

    // Social isolation
    if (patient.socialIsolation) {
      score += 10;
      factors.push({ factor: 'social_isolation', contribution: 10 });
    }

    return { score: Math.min(score, 100), factors };
  }

  /**
   * Get risk level category
   */
  getRiskLevel(score) {
    if (score >= this.thresholds.critical) return 'CRITICAL';
    if (score >= this.thresholds.high) return 'HIGH';
    if (score >= this.thresholds.moderate) return 'MODERATE';
    if (score >= this.thresholds.low) return 'LOW';
    return 'MINIMAL';
  }

  /**
   * Get urgency level
   */
  getUrgencyLevel(score) {
    if (score >= this.thresholds.critical) return 'IMMEDIATE';
    if (score >= this.thresholds.high) return 'URGENT';
    if (score >= this.thresholds.moderate) return 'SOON';
    return 'ROUTINE';
  }

  /**
   * Get referral recommendation
   */
  getRecommendation(score, patient) {
    if (score >= this.thresholds.critical) {
      return 'URGENT: Immediate hospital referral recommended - patient presents with life-threatening condition';
    }
    if (score >= this.thresholds.high) {
      return 'Hospital referral strongly recommended within 24-48 hours';
    }
    if (score >= this.thresholds.moderate) {
      return 'Consider specialist referral or enhanced monitoring';
    }
    return 'Continue community-based care with routine follow-up';
  }

  /**
   * Suggest referral type
   */
  suggestReferralType(score, patient) {
    if (score >= this.thresholds.critical) return 'EMERGENCY';
    if (score >= this.thresholds.high) return 'URGENT';
    if (score >= this.thresholds.moderate) return 'ELECTIVE';
    return 'NONE_REQUIRED';
  }

  /**
   * Predict readmission risk
   */
  async predictReadmissionRisk(patient) {
    let risk = 0;

    // Previous readmissions
    if (patient.readmissions && patient.readmissions > 0) {
      risk += Math.min(patient.readmissions * 15, 45);
    }

    // Chronic conditions count
    const conditions = patient.conditions || [];
    risk += Math.min(conditions.length * 5, 25);

    // Social factors
    if (!patient.hasCaregiver) risk += 20;
    if (!patient.medicationAdherence || patient.medicationAdherence < 0.8) risk += 15;

    return {
      score: Math.min(risk, 100),
      level: risk > 60 ? 'HIGH' : risk > 30 ? 'MODERATE' : 'LOW',
      factors: this.getReadmissionFactors(patient)
    };
  }

  /**
   * Get readmission risk factors
   */
  getReadmissionFactors(patient) {
    const factors = [];
    if (patient.readmissions > 0) factors.push('Previous readmissions');
    if (patient.conditions?.length > 2) factors.push('Multiple comorbidities');
    if (!patient.hasCaregiver) factors.push('No caregiver support');
    return factors;
  }

  /**
   * Check recent deterioration
   */
  async checkRecentDeterioration(patient) {
    const recentVisits = await db.Visit.findAll({
      where: {
        patientId: patient.id,
        scheduledDate: { [Op.gte]: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) }
      },
      order: [['scheduledDate', 'DESC']],
      limit: 3
    });

    if (recentVisits.length >= 2) {
      // Check if condition is worsening
      const notes = recentVisits.map(v => (v.notes || '').toLowerCase());
      const deteriorationKeywords = ['worsening', 'deteriorating', 'not improving', 'getting worse', 'new symptoms'];
      return notes.some(note => deteriorationKeywords.some(kw => note.includes(kw)));
    }
    return false;
  }

  /**
   * Calculate age from date of birth
   */
  calculateAge(dateOfBirth) {
    if (!dateOfBirth) return 30; // Default
    return Math.floor((Date.now() - new Date(dateOfBirth).getTime()) / (1000 * 60 * 60 * 24 * 365));
  }

  /**
   * Generate clinical notes
   */
  generateClinicalNotes(riskFactors, vitalScore, clinicalScore) {
    const notes = [];

    if (riskFactors.score > 50) {
      notes.push('Multiple risk factors identified requiring attention');
    }
    if (vitalScore.score > 40) {
      notes.push('Abnormal vital signs documented - monitor closely');
    }
    if (clinicalScore.score > 40) {
      notes.push('Clinical indicators suggest potential deterioration');
    }

    return notes.length > 0 ? notes : ['No acute concerns identified'];
  }

  /**
   * Batch score patients for a CHW's panel
   */
  async batchScorePatients(chwId) {
    const patients = await db.Patient.findAll({
      where: { chwId, status: 'active' }
    });

    const results = await Promise.all(
      patients.map(p => this.scorePatient(p.id))
    );

    // Sort by risk score descending
    results.sort((a, b) => b.riskScore - a.riskScore);

    return {
      totalPatients: results.length,
      riskDistribution: {
        critical: results.filter(r => r.riskLevel === 'CRITICAL').length,
        high: results.filter(r => r.riskLevel === 'HIGH').length,
        moderate: results.filter(r => r.riskLevel === 'MODERATE').length,
        low: results.filter(r => r.riskLevel === 'LOW').length
      },
      patients: results
    };
  }

  /**
   * Flag high-risk patients needing immediate attention
   */
  async flagHighRiskPatients() {
    const patients = await db.Patient.findAll({
      where: { status: 'active' }
    });

    const scored = await Promise.all(
      patients.map(p => this.scorePatient(p.id))
    );

    return scored.filter(p => 
      p.riskLevel === 'CRITICAL' || p.riskLevel === 'HIGH'
    ).map(p => ({
      patientId: p.patientId,
      riskLevel: p.riskLevel,
      urgencyLevel: p.urgencyLevel,
      recommendation: p.recommendation
    }));
  }
}

module.exports = new ReferralRiskScoring();
