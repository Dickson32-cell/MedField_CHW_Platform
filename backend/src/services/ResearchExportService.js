const { anonymizeData } = require('../middleware/hipaaCompliance');
const { Patient, Visit, User, Task, sequelize } = require('../models');
const { Op } = require('sequelize');

/**
 * Export anonymized research data
 * Supports CSV and JSON formats
 */
async function exportResearchData(filters = {}) {
  const {
    startDate,
    endDate,
    format = 'json',
    includePatients = true,
    includeVisits = true,
    includeTasks = true
  } = filters;

  const where = {};
  if (startDate || endDate) {
    where.visitDate = {};
    if (startDate) where.visitDate[Op.gte] = new Date(startDate);
    if (endDate) where.visitDate[Op.lte] = new Date(endDate);
  }

  const data = {};

  if (includePatients) {
    const patients = await Patient.findAll({
      where: filters.patientWhere || {},
      attributes: ['id', 'age', 'gender', 'village', 'district', 'healthCondition', 'enrollmentDate']
    });
    data.patients = anonymizeData(patients.map(p => p.toJSON()));
  }

  if (includeVisits) {
    const visits = await Visit.findAll({
      where,
      include: [
        { model: Patient, as: 'patient', attributes: ['id', 'village', 'healthCondition'] },
        { model: User, as: 'chw', attributes: ['id', 'username', 'region'] }
      ]
    });
    data.visits = anonymizeData(visits.map(v => ({
      id: v.id,
      patientId: v.patient?.id,
      chwId: v.chw?.id,
      visitDate: v.visitDate,
      visitType: v.visitType,
      duration: v.duration,
      outcome: v.outcome,
      village: v.patient?.village,
      healthCondition: v.patient?.healthCondition
    })));
  }

  if (includeTasks) {
    const tasks = await Task.findAll({
      where: filters.taskWhere || {},
      include: [
        { model: User, as: 'assignedTo', attributes: ['id', 'username', 'region'] }
      ]
    });
    data.tasks = anonymizeData(tasks.map(t => ({
      id: t.id,
      title: t.title,
      priority: t.priority,
      status: t.status,
      dueDate: t.dueDate,
      assignedTo: t.assignedTo?.username
    })));
  }

  // Generate summary statistics
  data.summary = await generateSummaryStats(data);

  if (format === 'csv') {
    return convertToCSV(data);
  }

  return data;
}

/**
 * Generate summary statistics for research
 */
async function generateSummaryStats(data) {
  const stats = {
    totalPatients: data.patients?.length || 0,
    totalVisits: data.visits?.length || 0,
    totalTasks: data.tasks?.length || 0,
    dateRange: {
      earliest: data.visits?.length > 0 ? 
        Math.min(...data.visits.map(v => new Date(v.visitDate))) : null,
      latest: data.visits?.length > 0 ?
        Math.max(...data.visits.map(v => new Date(v.visitDate))) : null
    }
  };

  if (data.patients) {
    stats.demographics = {
      male: data.patients.filter(p => p.gender === 'male').length,
      female: data.patients.filter(p => p.gender === 'female').length,
      ageGroups: groupByAge(data.patients)
    };
  }

  if (data.visits) {
    stats.visitOutcomes = {};
    data.visits.forEach(v => {
      stats.visitOutcomes[v.outcome] = (stats.visitOutcomes[v.outcome] || 0) + 1;
    });
    
    stats.healthConditions = {};
    data.visits.forEach(v => {
      if (v.healthCondition) {
        stats.healthConditions[v.healthCondition] = (stats.healthConditions[v.healthCondition] || 0) + 1;
      }
    });
  }

  return stats;
}

/**
 * Group patients by age groups
 */
function groupByAge(patients) {
  const groups = { '0-4': 0, '5-14': 0, '15-24': 0, '25-34': 0, '35-44': 0, '45-54': 0, '55-64': 0, '65+': 0 };
  patients.forEach(p => {
    if (p.age !== null) {
      if (p.age < 5) groups['0-4']++;
      else if (p.age < 15) groups['5-14']++;
      else if (p.age < 25) groups['15-24']++;
      else if (p.age < 35) groups['25-34']++;
      else if (p.age < 45) groups['35-44']++;
      else if (p.age < 55) groups['45-54']++;
      else if (p.age < 65) groups['55-64']++;
      else groups['65+']++;
    }
  });
  return groups;
}

/**
 * Convert data to CSV format
 */
function convertToCSV(data) {
  let csv = '';

  if (data.patients && data.patients.length > 0) {
    csv += '=== PATIENTS ===\n';
    csv += Object.keys(data.patients[0]).join(',') + '\n';
    data.patients.forEach(p => {
      csv += Object.values(p).join(',') + '\n';
    });
    csv += '\n';
  }

  if (data.visits && data.visits.length > 0) {
    csv += '=== VISITS ===\n';
    csv += Object.keys(data.visits[0]).join(',') + '\n';
    data.visits.forEach(v => {
      csv += Object.values(v).join(',') + '\n';
    });
    csv += '\n';
  }

  if (data.summary) {
    csv += '=== SUMMARY ===\n';
    csv += JSON.stringify(data.summary);
  }

  return csv;
}

/**
 * Export specific dataset for publication
 */
async function exportForPublication(datasetType, options = {}) {
  const exportFilters = {
    startDate: options.startDate || '2020-01-01',
    endDate: options.endDate || new Date().toISOString().split('T')[0],
    format: 'json'
  };

  switch (datasetType) {
    case 'demographics':
      exportFilters.includeVisits = false;
      exportFilters.includeTasks = false;
      break;
    case 'visitOutcomes':
      exportFilters.includePatients = false;
      exportFilters.includeTasks = false;
      break;
    case 'chwPerformance':
      exportFilters.includePatients = false;
      exportFilters.includeVisits = true;
      exportFilters.includeTasks = true;
      break;
    default:
      // Export all
  }

  return exportResearchData(exportFilters);
}

module.exports = {
  exportResearchData,
  exportForPublication,
  generateSummaryStats
};
