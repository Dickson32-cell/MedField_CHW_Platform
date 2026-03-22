/**
 * TaskPrioritizationService.js
 * ML-based task scoring using patient history, demographics, and disease patterns
 */

const db = require('../models');
const { Op } = require('sequelize');

class TaskPrioritizationService {
  constructor() {
    // Weights for scoring factors
    this.weights = {
      urgency: 0.35,
      patientRisk: 0.25,
      chronicDisease: 0.20,
      missedVisits: 0.15,
      socialFactors: 0.05
    };

    // Chronic conditions requiring priority
    this.chronicConditions = [
      'diabetes', 'hypertension', 'asthma', 'copd', 
      'hiv', 'tuberculosis', 'heart_disease', 'epilepsy'
    ];

    // Social risk factors
    this.socialRiskFactors = [
      'no_income', 'single_parent', 'elderly_alone', 
      'homeless', 'no_transport'
    ];
  }

  /**
   * Calculate priority score for all tasks
   */
  async calculateAllTaskScores(chwId = null) {
    const tasks = await this.getTasksForScoring(chwId);
    const scoredTasks = await Promise.all(
      tasks.map(task => this.scoreTask(task))
    );
    
    // Sort by score descending
    scoredTasks.sort((a, b) => b.priorityScore - a.priorityScore);
    
    return scoredTasks;
  }

  /**
   * Get tasks for scoring
   */
  async getTasksForScoring(chwId) {
    const where = {
      status: { [Op.in]: ['pending', 'overdue'] }
    };
    if (chwId) where.chwId = chwId;

    const tasks = await db.Task.findAll({
      where,
      include: [
        { model: db.Patient, as: 'patient' },
        { model: db.Visit, as: 'visits' }
      ]
    });

    return tasks;
  }

  /**
   * Score individual task
   */
  async scoreTask(task) {
    const patient = task.patient;
    const visits = task.visits || [];
    
    const factors = {
      urgency: this.calculateUrgencyScore(task),
      patientRisk: await this.calculatePatientRiskScore(patient),
      chronicDisease: this.calculateChronicDiseaseScore(patient),
      missedVisits: this.calculateMissedVisitScore(visits),
      socialFactors: this.calculateSocialFactorsScore(patient)
    };

    const priorityScore = Object.keys(factors).reduce(
      (sum, key) => sum + factors[key] * this.weights[key],
      0
    );

    return {
      taskId: task.id,
      patientId: patient?.id,
      priorityScore: Math.round(priorityScore * 100) / 100,
      factors,
      recommendedVisitDate: this.calculateRecommendedDate(factors),
      riskLevel: this.getRiskLevel(priorityScore)
    };
  }

  /**
   * Calculate urgency score based on task type and due date
   */
  calculateUrgencyScore(task) {
    let score = 50; // Base score

    const urgencyBonus = {
      'follow_up': 20,
      'vaccination': 15,
      'medication_refill': 15,
      'prenatal_check': 25,
      'child_health': 20,
      'chronic_care': 20,
      'emergency_visit': 40
    };

    score += urgencyBonus[task.taskType] || 0;

    // Overdue tasks get extra urgency
    if (task.status === 'overdue') {
      const daysOverdue = Math.floor(
        (Date.now() - new Date(task.dueDate).getTime()) / (1000 * 60 * 60 * 24)
      );
      score += Math.min(daysOverdue * 5, 30);
    }

    // Due within 24 hours
    const hoursUntilDue = (new Date(task.dueDate).getTime() - Date.now()) / (1000 * 60 * 60);
    if (hoursUntilDue <= 24 && hoursUntilDue > 0) {
      score += 15;
    }

    return Math.min(Math.max(score, 0), 100);
  }

  /**
   * Calculate patient risk score using ML model
   */
  async calculatePatientRiskScore(patient) {
    if (!patient) return 50;

    let score = 30; // Base score

    // Age risk (infants and elderly higher risk)
    const age = patient.dateOfBirth 
      ? Math.floor((Date.now() - new Date(patient.dateOfBirth).getTime()) / (1000 * 60 * 60 * 24 * 365))
      : 30;
    
    if (age < 5 || age > 65) score += 20;
    else if (age < 1) score += 30; // Infants highest risk

    // Pregnancy risk
    if (patient.isPregnant) score += 25;

    // Previous hospitalizations
    if (patient.hospitalizations && patient.hospitalizations > 0) {
      score += Math.min(patient.hospitalizations * 5, 20);
    }

    // Previous emergency visits
    if (patient.emergencyVisits && patient.emergencyVisits > 0) {
      score += Math.min(patient.emergencyVisits * 3, 15);
    }

    // Disease patterns (comorbidities)
    if (patient.conditions && patient.conditions.length > 0) {
      score += patient.conditions.length * 8;
    }

    return Math.min(Math.max(score, 0), 100);
  }

  /**
   * Score based on chronic disease status
   */
  calculateChronicDiseaseScore(patient) {
    if (!patient || !patient.conditions) return 0;

    let score = 0;
    const conditions = Array.isArray(patient.conditions) 
      ? patient.conditions 
      : [patient.conditions];

    conditions.forEach(condition => {
      const normalized = condition.toLowerCase().replace(/[_\s]/g, '');
      if (this.chronicConditions.some(cc => normalized.includes(cc))) {
        score += 25;
      }
    });

    // On treatment for chronic disease = slightly lower urgency (stable)
    if (patient.onTreatment) score -= 10;

    return Math.min(Math.max(score, 0), 100);
  }

  /**
   * Calculate missed visits score
   */
  calculateMissedVisitScore(visits) {
    if (!visits || visits.length === 0) return 0;

    const missedVisits = visits.filter(v => v.status === 'missed').length;
    const totalScheduled = visits.length;
    const missedRatio = missedVisits / totalScheduled;

    // More missed visits = higher score
    let score = missedRatio * 80;

    // Recent missed visits weighted more
    const recentMissed = visits.filter(v => {
      if (v.status !== 'missed') return false;
      const daysSince = (Date.now() - new Date(v.scheduledDate).getTime()) / (1000 * 60 * 60 * 24);
      return daysSince <= 30;
    }).length;

    score += recentMissed * 5;

    return Math.min(Math.max(score, 0), 100);
  }

  /**
   * Calculate social risk factors score
   */
  calculateSocialFactorsScore(patient) {
    if (!patient || !patient.socialFactors) return 25; // Neutral

    let score = 25;
    const factors = Array.isArray(patient.socialFactors) 
      ? patient.socialFactors 
      : [patient.socialFactors];

    factors.forEach(factor => {
      if (this.socialRiskFactors.includes(factor)) {
        score += 15;
      }
    });

    return Math.min(Math.max(score, 0), 100);
  }

  /**
   * Calculate recommended visit date based on priority
   */
  calculateRecommendedDate(factors) {
    const avgScore = Object.values(factors).reduce((a, b) => a + b, 0) / Object.keys(factors).length;
    
    if (avgScore >= 80) return new Date(); // Today
    if (avgScore >= 60) return new Date(Date.now() + 24 * 60 * 60 * 1000); // Tomorrow
    if (avgScore >= 40) return new Date(Date.now() + 3 * 24 * 60 * 60 * 1000); // 3 days
    return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
  }

  /**
   * Get risk level category
   */
  getRiskLevel(score) {
    if (score >= 80) return 'CRITICAL';
    if (score >= 60) return 'HIGH';
    if (score >= 40) return 'MODERATE';
    if (score >= 20) return 'LOW';
    return 'ROUTINE';
  }

  /**
   * Batch update task priorities
   */
  async refreshPriorities() {
    const scoredTasks = await this.calculateAllTaskScores();
    
    await Promise.all(
      scoredTasks.map(({ taskId, priorityScore, riskLevel }) =>
        db.Task.update(
          { priorityScore, riskLevel, updatedAt: new Date() },
          { where: { id: taskId } }
        )
      )
    );

    return { updated: scoredTasks.length };
  }

  /**
   * Get worklist for a CHW optimized for route efficiency
   */
  async getOptimizedWorklist(chwId, maxTasks = 20) {
    const scoredTasks = await this.calculateAllTaskScores(chwId);
    const tasks = scoredTasks.slice(0, maxTasks);

    // Group by geographic cluster for route optimization
    const clustered = this.clusterByLocation(tasks);

    return {
      tasks: clustered,
      summary: {
        critical: tasks.filter(t => t.riskLevel === 'CRITICAL').length,
        high: tasks.filter(t => t.riskLevel === 'HIGH').length,
        moderate: tasks.filter(t => t.riskLevel === 'MODERATE').length
      }
    };
  }

  /**
   * Simple clustering by village/zone
   */
  clusterByLocation(tasks) {
    const clusters = {};

    tasks.forEach(task => {
      const location = task.patient?.village || task.patient?.zone || 'unknown';
      if (!clusters[location]) clusters[location] = [];
      clusters[location].push(task);
    });

    return Object.entries(clusters).map(([location, items]) => ({
      location,
      tasks: items,
      estimatedTime: items.length * 30 // 30 min per visit
    }));
  }
}

module.exports = new TaskPrioritizationService();
