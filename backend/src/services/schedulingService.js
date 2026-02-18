/**
 * Scheduling Service
 * Smart visit scheduling based on patient risk scores, pregnancy milestones, etc.
 */

const { Op } = require('sequelize');
const { Task, Patient, Visit, Household } = require('../models');

class SchedulingService {
  /**
   * Calculate priority score for a patient
   */
  calculatePriorityScore(patient) {
    let score = 0;

    // Risk score from patient record
    score += (patient.risk_score || 0) * 2;

    // Pregnancy status
    if (patient.is_pregnant && patient.due_date) {
      const daysUntilDue = Math.ceil((new Date(patient.due_date) - new Date()) / (1000 * 60 * 60 * 24));
      if (daysUntilDue <= 7) score += 20; // Due very soon
      else if (daysUntilDue <= 30) score += 15;
      else if (daysUntilDue <= 90) score += 10;
    }

    // Chronic conditions
    if (patient.chronic_conditions && patient.chronic_conditions.length > 0) {
      score += patient.chronic_conditions.length * 3;
    }

    // Time since last visit
    if (patient.last_visit_date) {
      const daysSinceVisit = Math.ceil((new Date() - new Date(patient.last_visit_date)) / (1000 * 60 * 60 * 24));
      if (daysSinceVisit > 30) score += 10;
      else if (daysSinceVisit > 14) score += 5;
    }

    return score;
  }

  /**
   * Generate scheduled tasks for a CHW
   */
  async generateDailyTasks(chwId, date) {
    const patients = await Patient.findAll({
      where: {
        chw_id: chwId,
        is_active: true
      },
      include: [{ model: Household, as: 'household' }]
    });

    const tasks = [];

    for (const patient of patients) {
      const priorityScore = this.calculatePriorityScore(patient);

      // Determine visit frequency based on risk
      let visitInterval = 30; // days
      if (priorityScore >= 15) visitInterval = 7;
      else if (priorityScore >= 10) visitInterval = 14;
      else if (priorityScore >= 5) visitInterval = 21;

      // Check if visit is due
      const lastVisit = await Visit.findOne({
        where: { patient_id: patient.id },
        order: [['visit_date', 'DESC']]
      });

      const shouldVisit = !lastVisit ||
        (new Date() - new Date(lastVisit.visit_date)) / (1000 * 60 * 60 * 24) >= visitInterval;

      if (shouldVisit) {
        tasks.push({
          patient_id: patient.id,
          household_id: patient.household_id,
          chw_id: chwId,
          task_type: 'visit',
          title: `Visit ${patient.first_name} ${patient.last_name}`,
          description: `Priority score: ${priorityScore}`,
          due_date: date,
          priority: priorityScore >= 15 ? 'urgent' : priorityScore >= 10 ? 'high' : 'medium',
          risk_score: priorityScore
        });
      }

      // Add pregnancy-specific tasks
      if (patient.is_pregnant && patient.due_date) {
        const daysUntilDue = Math.ceil((new Date(patient.due_date) - new Date()) / (1000 * 60 * 60 * 24));

        // ANC visits at specific milestones
        if (daysUntilDue > 180) {
          const ancDue = await this.isANCDue(patient, 1);
          if (ancDue) {
            tasks.push({
              patient_id: patient.id,
              chw_id: chwId,
              task_type: 'visit',
              title: `ANC Visit 1 - ${patient.first_name}`,
              description: 'First Antenatal Care visit',
              due_date: date,
              priority: 'high'
            });
          }
        }
      }
    }

    // Sort by priority
    tasks.sort((a, b) => {
      const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });

    // Limit daily tasks
    return tasks.slice(0, 20);
  }

  /**
   * Check if ANC visit is due
   */
  async isANCDue(patient, visitNumber) {
    const existingVisits = await Visit.count({
      where: {
        patient_id: patient.id,
        visit_type: 'scheduled'
      }
    });
    return existingVisits < visitNumber;
  }

  /**
   * Optimize route for CHW visits
   */
  async optimizeRoute(chwId, date) {
    const tasks = await Task.findAll({
      where: {
        chw_id: chwId,
        due_date: date,
        status: 'pending',
        task_type: 'visit'
      },
      include: [
        {
          model: Patient,
          as: 'patient',
          include: [{ model: Household, as: 'household' }]
        }
      ]
    });

    // Simple nearest-neighbor algorithm
    const sorted = this.nearestNeighborSort(tasks);

    // Update task order
    for (let i = 0; i < sorted.length; i++) {
      await sorted[i].update({ notes: `Route order: ${i + 1}` });
    }

    return sorted;
  }

  /**
   * Nearest neighbor sorting for route optimization
   */
  nearestNeighborSort(tasks) {
    if (tasks.length <= 2) return tasks;

    const result = [tasks[0]];
    const remaining = tasks.slice(1);

    while (remaining.length > 0) {
      const last = result[result.length - 1];
      const lastLocation = last.patient?.household?.location || { lat: 0, lng: 0 };

      let nearestIndex = 0;
      let nearestDistance = Infinity;

      for (let i = 0; i < remaining.length; i++) {
        const task = remaining[i];
        const taskLocation = task.patient?.household?.location || { lat: 0, lng: 0 };
        const distance = this.calculateDistance(lastLocation, taskLocation);

        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearestIndex = i;
        }
      }

      result.push(remaining[nearestIndex]);
      remaining.splice(nearestIndex, 1);
    }

    return result;
  }

  /**
   * Calculate distance between two points (Haversine formula)
   */
  calculateDistance(loc1, loc2) {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(loc2.lat - loc1.lat);
    const dLon = this.toRad(loc2.lng - loc1.lng);
    const lat1 = this.toRad(loc1.lat);
    const lat2 = this.toRad(loc2.lat);

    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  toRad(deg) {
    return deg * (Math.PI / 180);
  }
}

module.exports = new SchedulingService();
