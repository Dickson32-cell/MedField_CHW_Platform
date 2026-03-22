/**
 * AnomalyDetection.js
 * Flag unusual visit patterns using statistical analysis
 */

const db = require('../models');
const { Op, Sequelize } = require('sequelize');

class AnomalyDetection {
  constructor() {
    // Standard deviations for anomaly thresholds
    this.thresholds = {
      visitsPerDay: { warning: 2, critical: 3 },
      visitDuration: { warning: 2, critical: 3 },
      patientsPerCHW: { warning: 2, critical: 3 },
      referralRate: { warning: 2, critical: 3 },
      noShowRate: { warning: 2, critical: 3 }
    };

    // Time windows for analysis
    this.windows = {
      daily: 24 * 60 * 60 * 1000,
      weekly: 7 * 24 * 60 * 60 * 1000,
      monthly: 30 * 24 * 60 * 60 * 1000
    };

    // Known anomaly patterns
    this.anomalyPatterns = {
      'rapid_cluster': 'Unusual clustering of visits in small area/time',
      'unusual_diagnosis': 'Diagnosis frequency deviates significantly from norm',
      'high_referral': 'Referral rate outside normal parameters',
      'data_quality': 'Missing or inconsistent data patterns',
      'visit_skipping': 'Suspicious visit scheduling patterns',
      'duplicate_entry': 'Potential duplicate patient records',
      'performance_spike': 'Unusual performance metrics'
    };
  }

  /**
   * Run all anomaly detection checks
   */
  async runAllDetections(facilityId = null) {
    const results = {
      timestamp: new Date(),
      facilityId,
      anomalies: [],
      summary: { critical: 0, warning: 0, info: 0 }
    };

    // Run individual detectors
    const detectors = [
      () => this.detectVisitAnomalies(facilityId),
      () => this.detectCHWPerformanceAnomalies(facilityId),
      () => this.detectPatientAnomalies(facilityId),
      () => this.detectDataQualityIssues(facilityId),
      () => this.detectDuplicateRecords(facilityId),
      () => this.detectReferralAnomalies(facilityId),
      () => this.detectGeographicAnomalies(facilityId)
    ];

    const detectorResults = await Promise.allSettled(detectors.map(d => d()));
    
    detectorResults.forEach((result, index) => {
      if (result.status === 'fulfilled' && result.value) {
        if (Array.isArray(result.value)) {
          results.anomalies.push(...result.value);
        } else {
          results.anomalies.push(result.value);
        }
      }
    });

    // Classify anomalies
    results.anomalies.forEach(anomaly => {
      if (anomaly.severity === 'CRITICAL') results.summary.critical++;
      else if (anomaly.severity === 'WARNING') results.summary.warning++;
      else results.summary.info++;
    });

    // Sort by severity and timestamp
    results.anomalies.sort((a, b) => {
      const severityOrder = { CRITICAL: 0, WARNING: 1, INFO: 2 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    });

    return results;
  }

  /**
   * Detect visit pattern anomalies
   */
  async detectVisitAnomalies(facilityId) {
    const anomalies = [];
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const where = { scheduledDate: { [Op.gte]: thirtyDaysAgo } };
    if (facilityId) where.facilityId = facilityId;

    const visits = await db.Visit.findAll({
      where,
      include: [
        { model: db.Patient, as: 'patient' },
        { model: db.CommunityHealthWorker, as: 'chw' }
      ]
    });

    // Group by CHW
    const chwVisits = this.groupBy(visits, 'chwId');
    
    for (const [chwId, chwVisitList] of Object.entries(chwVisits)) {
      const stats = this.calculateVisitStats(chwVisitList);
      
      // Check for unusual visit count
      if (stats.dailyVisits > this.thresholds.visitsPerDay.critical * stats.dailyVisitsStdDev + stats.dailyVisitsMean) {
        anomalies.push({
          type: 'high_visit_volume',
          severity: 'CRITICAL',
          chwId,
          chwName: chwVisitList[0]?.chw?.name,
          pattern: stats,
          message: `CHW reporting ${Math.round(stats.dailyVisits)} visits/day, expected ${Math.round(stats.dailyVisitsMean)}`,
          detectedAt: new Date()
        });
      } else if (stats.dailyVisits > this.thresholds.visitsPerDay.warning * stats.dailyVisitsStdDev + stats.dailyVisitsMean) {
        anomalies.push({
          type: 'elevated_visit_volume',
          severity: 'WARNING',
          chwId,
          chwName: chwVisitList[0]?.chw?.name,
          pattern: stats,
          message: `CHW visit count above average: ${Math.round(stats.dailyVisits)} vs ${Math.round(stats.dailyVisitsMean)} expected`,
          detectedAt: new Date()
        });
      }

      // Check for unusual visit duration (if recorded)
      if (stats.avgDuration && stats.avgDuration > 60) {
        anomalies.push({
          type: 'long_visit_duration',
          severity: 'INFO',
          chwId,
          chwName: chwVisitList[0]?.chw?.name,
          pattern: { avgDuration: stats.avgDuration },
          message: `Average visit duration is ${Math.round(stats.avgDuration)} minutes`,
          detectedAt: new Date()
        });
      }

      // Check for no-show clustering
      const noShows = chwVisitList.filter(v => v.status === 'missed' || v.status === 'no_show');
      const noShowRate = noShows.length / chwVisitList.length;
      
      if (noShowRate > 0.5) {
        anomalies.push({
          type: 'high_no_show_rate',
          severity: 'WARNING',
          chwId,
          chwName: chwVisitList[0]?.chw?.name,
          pattern: { noShowRate: Math.round(noShowRate * 100) + '%' },
          message: `${Math.round(noShowRate * 100)}% no-show rate for CHW's patients`,
          detectedAt: new Date()
        });
      }
    }

    return anomalies;
  }

  /**
   * Detect CHW performance anomalies
   */
  async detectCHWPerformanceAnomalies(facilityId) {
    const anomalies = [];
    const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);

    const where = { lastActivity: { [Op.gte]: sixtyDaysAgo } };
    if (facilityId) where.facilityId = facilityId;

    const chws = await db.CommunityHealthWorker.findAll({ where });

    if (chws.length === 0) return anomalies;

    // Calculate mean and std dev for key metrics
    const metrics = chws.map(chw => ({
      id: chw.id,
      name: chw.name,
      visitsCompleted: chw.visitsCompleted || 0,
      visitsPerDay: (chw.visitsCompleted || 0) / 60,
      patientLoad: chw.patientLoad || 0,
      referralRate: chw.referralsCount / (chw.visitsCompleted || 1)
    }));

    const meanVisits = this.mean(metrics.map(m => m.visitsPerDay));
    const stdVisits = this.stdDev(metrics.map(m => m.visitsPerDay));

    for (const metric of metrics) {
      const zScore = (metric.visitsPerDay - meanVisits) / (stdVisits || 1);

      if (zScore > this.thresholds.visitsPerCHW.critical) {
        anomalies.push({
          type: 'performance_spike',
          severity: 'CRITICAL',
          chwId: metric.id,
          chwName: metric.name,
          pattern: metric,
          message: `Performance significantly above average (z-score: ${zScore.toFixed(2)})`,
          detectedAt: new Date()
        });
      } else if (zScore < -this.thresholds.visitsPerCHW.warning) {
        anomalies.push({
          type: 'low_performance',
          severity: 'WARNING',
          chwId: metric.id,
          chwName: metric.name,
          pattern: metric,
          message: `Performance below average - may need support (z-score: ${zScore.toFixed(2)})`,
          detectedAt: new Date()
        });
      }

      // Check for inactivity
      if (metric.visitsPerDay === 0) {
        anomalies.push({
          type: 'inactive_chw',
          severity: 'WARNING',
          chwId: metric.id,
          chwName: metric.name,
          message: 'No recorded activity in the past 60 days',
          detectedAt: new Date()
        });
      }
    }

    return anomalies;
  }

  /**
   * Detect patient-level anomalies
   */
  async detectPatientAnomalies(facilityId) {
    const anomalies = [];
    
    const where = {};
    if (facilityId) where.facilityId = facilityId;

    const patients = await db.Patient.findAll({
      where,
      include: [{ model: db.Visit, as: 'visits' }]
    });

    for (const patient of patients) {
      const visits = patient.visits || [];

      // Check for rapid re-admission (multiple visits in short period)
      const recentVisits = visits.filter(v => {
        const daysSince = (Date.now() - new Date(v.scheduledDate).getTime()) / (1000 * 60 * 60 * 24);
        return daysSince <= 7;
      });

      if (recentVisits.length >= 5) {
        anomalies.push({
          type: 'rapid_revisit',
          severity: 'WARNING',
          patientId: patient.id,
          patientName: patient.fullName,
          pattern: { visitCount: recentVisits.length, days: 7 },
          message: `Patient visited ${recentVisits.length} times in 7 days - may need referral`,
          detectedAt: new Date()
        });
      }

      // Check for unusual diagnosis pattern
      const diagnoses = visits.map(v => v.diagnosis).filter(Boolean);
      const diagnosisCounts = this.countOccurrences(diagnoses);
      
      for (const [diagnosis, count] of Object.entries(diagnosisCounts)) {
        if (count >= 10 && this.isUnusualDiagnosis(diagnosis)) {
          anomalies.push({
            type: 'unusual_diagnosis_frequency',
            severity: 'INFO',
            patientId: patient.id,
            patientName: patient.fullName,
            pattern: { diagnosis, count },
            message: `Unusual number of "${diagnosis}" diagnoses: ${count}`,
            detectedAt: new Date()
          });
        }
      }

      // Check for conflicting medications
      if (patient.conditions && patient.conditions.includes('hypertension') && 
          this.hasConflictingMedications(patient)) {
        anomalies.push({
          type: 'medication_conflict',
          severity: 'CRITICAL',
          patientId: patient.id,
          patientName: patient.fullName,
          message: 'Potential medication interaction detected',
          detectedAt: new Date()
        });
      }
    }

    return anomalies;
  }

  /**
   * Detect data quality issues
   */
  async detectDataQualityIssues(facilityId) {
    const anomalies = [];

    const where = {};
    if (facilityId) where.facilityId = facilityId;

    // Check for missing vital signs
    const encountersWithoutVitals = await db.Encounter.findAll({
      where: {
        ...where,
        createdAt: { [Op.gte]: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
      },
      include: [{ model: db.Vital, as: 'vitals' }],
      having: Sequelize.literal('COUNT(`vitals`.`id`) = 0')
    });

    if (encountersWithoutVitals.length > 10) {
      anomalies.push({
        type: 'missing_vitals',
        severity: 'WARNING',
        count: encountersWithoutVitals.length,
        message: `${encountersWithoutVitals.length} encounters without vital signs recorded`,
        detectedAt: new Date()
      });
    }

    // Check for incomplete records
    const incompletePatients = await db.Patient.findAll({
      where: {
        ...where,
        [Op.or]: [
          { dateOfBirth: null },
          { gender: null },
          { phone: null }
        ]
      },
      attributes: ['id', 'fullName', 'dateOfBirth', 'gender', 'phone']
    });

    if (incompletePatients.length > 0) {
      anomalies.push({
        type: 'incomplete_records',
        severity: 'INFO',
        count: incompletePatients.length,
        details: incompletePatients.slice(0, 5).map(p => ({
          id: p.id,
          missing: ['dateOfBirth', 'gender', 'phone'].filter(f => !p[f])
        })),
        message: `${incompletePatients.length} patients with incomplete demographic data`,
        detectedAt: new Date()
      });
    }

    // Check for future dates (data entry errors)
    const futureVisits = await db.Visit.findAll({
      where: {
        scheduledDate: { [Op.gt]: new Date() }
      }
    });

    if (futureVisits.length > 0) {
      anomalies.push({
        type: 'future_dates',
        severity: 'WARNING',
        count: futureVisits.length,
        message: `${futureVisits.length} visits scheduled in the future - possible data entry error`,
        detectedAt: new Date()
      });
    }

    return anomalies;
  }

  /**
   * Detect duplicate records
   */
  async detectDuplicateRecords(facilityId) {
    const anomalies = [];

    const where = {};
    if (facilityId) where.facilityId = facilityId;

    // Find patients with similar names
    const patients = await db.Patient.findAll({ where });

    const nameGroups = {};
    patients.forEach(p => {
      const normalizedName = this.normalizeName(p.fullName);
      if (!nameGroups[normalizedName]) nameGroups[normalizedName] = [];
      nameGroups[normalizedName].push(p);
    });

    for (const [name, group] of Object.entries(nameGroups)) {
      if (group.length > 1) {
        // Check if they also have similar demographics
        const potentialDuplicates = group.filter(p1 => 
          group.some(p2 => p1.id !== p2.id && this.areSimilar(p1, p2))
        );

        if (potentialDuplicates.length > 0) {
          anomalies.push({
            type: 'potential_duplicate',
            severity: 'WARNING',
            patients: potentialDuplicates.map(p => ({ id: p.id, name: p.fullName })),
            matchCriteria: 'similar name and demographics',
            message: `Potential duplicate patients found with name: ${name}`,
            detectedAt: new Date()
          });
        }
      }
    }

    return anomalies;
  }

  /**
   * Detect referral anomalies
   */
  async detectReferralAnomalies(facilityId) {
    const anomalies = [];

    const where = { status: 'completed' };
    if (facilityId) where.facilityId = facilityId;

    const visits = await db.Visit.findAll({
      where,
      include: [{ model: db.Referral, as: 'referrals' }]
    });

    // Group by CHW
    const chwVisits = this.groupBy(visits, 'chwId');

    for (const [chwId, visitList] of Object.entries(chwVisits)) {
      const referrals = visitList.filter(v => v.referrals && v.referrals.length > 0);
      const referralRate = referrals.length / visitList.length;

      // Calculate expected referral rate
      const expectedRate = 0.1; // 10% baseline
      const chwName = visitList[0]?.chw?.name;

      if (referralRate > 0.5) {
        anomalies.push({
          type: 'very_high_referral_rate',
          severity: 'WARNING',
          chwId,
          chwName,
          pattern: { referralRate: Math.round(referralRate * 100) + '%' },
          message: `Abnormally high referral rate: ${Math.round(referralRate * 100)}% - verify need for referrals`,
          detectedAt: new Date()
        });
      } else if (referralRate < 0.02) {
        anomalies.push({
          type: 'very_low_referral_rate',
          severity: 'INFO',
          chwId,
          chwName,
          pattern: { referralRate: Math.round(referralRate * 100) + '%' },
          message: `Abnormally low referral rate: ${Math.round(referralRate * 100)}% - may be undertreating`,
          detectedAt: new Date()
        });
      }

      // Check for failed referrals (no follow-up)
      const failedReferrals = await db.Referral.findAll({
        where: {
          chwId,
          status: 'completed',
          followUpDate: { [Op.lt]: new Date() },
          followUpCompleted: false
        }
      });

      if (failedReferrals.length > 3) {
        anomalies.push({
          type: 'uncompleted_referrals',
          severity: 'WARNING',
          chwId,
          chwName,
          pattern: { count: failedReferrals.length },
          message: `${failedReferrals.length} referrals without follow-up - may indicate access issues`,
          detectedAt: new Date()
        });
      }
    }

    return anomalies;
  }

  /**
   * Detect geographic anomalies
   */
  async detectGeographicAnomalies(facilityId) {
    const anomalies = [];

    const where = { status: 'completed' };
    if (facilityId) where.facilityId = facilityId;

    const visits = await db.Visit.findAll({
      where,
      include: [{ model: db.Patient, as: 'patient' }]
    });

    // Group by location
    const byLocation = {};
    visits.forEach(v => {
      const location = v.patient?.village || v.patient?.zone || 'unknown';
      if (!byLocation[location]) byLocation[location] = [];
      byLocation[location].push(v);
    });

    for (const [location, locationVisits] of Object.entries(byLocation)) {
      // Detect unusual clustering (too many visits in same location)
      const recentVisits = locationVisits.filter(v => {
        const daysSince = (Date.now() - new Date(v.scheduledDate).getTime()) / (1000 * 60 * 60 * 24);
        return daysSince <= 3;
      });

      if (recentVisits.length > 20) {
        anomalies.push({
          type: 'visit_cluster',
          severity: 'INFO',
          location,
          pattern: { visitCount: recentVisits.length, days: 3 },
          message: `High concentration of visits in ${location}: ${recentVisits.length} in 3 days`,
          detectedAt: new Date()
        });
      }
    }

    return anomalies;
  }

  // Helper methods

  calculateVisitStats(visits) {
    const counts = visits.map(v => v.visitCount || 1);
    const durations = visits.map(v => v.duration || 0).filter(d => d > 0);

    return {
      totalVisits: counts.reduce((a, b) => a + b, 0),
      dailyVisitsMean: this.mean(counts),
      dailyVisitsStdDev: this.stdDev(counts),
      avgDuration: durations.length > 0 ? this.mean(durations) : null
    };
  }

  mean(values) {
    if (!values || values.length === 0) return 0;
    return values.reduce((a, b) => a + b, 0) / values.length;
  }

  stdDev(values) {
    if (!values || values.length < 2) return 0;
    const avg = this.mean(values);
    const squareDiffs = values.map(v => (v - avg) ** 2);
    return Math.sqrt(squareDiffs.reduce((a, b) => a + b, 0) / values.length);
  }

  groupBy(array, key) {
    return array.reduce((groups, item) => {
      const value = item[key];
      if (!groups[value]) groups[value] = [];
      groups[value].push(item);
      return groups;
    }, {});
  }

  countOccurrences(array) {
    return array.reduce((counts, item) => {
      counts[item] = (counts[item] || 0) + 1;
      return counts;
    }, {});
  }

  normalizeName(name) {
    return (name || '').toLowerCase().replace(/[^\w]/g, '').trim();
  }

  areSimilar(p1, p2) {
    const sameDOB = p1.dateOfBirth && p2.dateOfBirth && 
      new Date(p1.dateOfBirth).toDateString() === new Date(p2.dateOfBirth).toDateString();
    const sameGender = p1.gender && p2.gender && p1.gender === p2.gender;
    const sameVillage = p1.village && p2.village && p1.village === p2.village;
    
    return (sameDOB ? 1 : 0) + (sameGender ? 1 : 0) + (sameVillage ? 1 : 0) >= 2;
  }

  isUnusualDiagnosis(diagnosis) {
    const unusual = ['sudden_death', 'unknown', 'undiagnosed', 'pending'];
    return unusual.some(u => diagnosis.toLowerCase().includes(u));
  }

  hasConflictingMedications(patient) {
    // Simplified check - in reality would check actual medications
    return false;
  }

  /**
   * Get anomaly history
   */
  async getAnomalyHistory(facilityId, days = 30) {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    
    return db.AnomalyLog.findAll({
      where: {
        facilityId,
        detectedAt: { [Op.gte]: since }
      },
      order: [['detectedAt', 'DESC']]
    });
  }

  /**
   * Acknowledge and resolve anomaly
   */
  async resolveAnomaly(anomalyId, resolution, resolvedBy) {
    return db.AnomalyLog.create({
      id: anomalyId,
      resolution,
      resolvedBy,
      resolvedAt: new Date()
    });
  }
}

module.exports = new AnomalyDetection();
