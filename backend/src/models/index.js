const sequelize = require('../config/database');
const User = require('./User');
const Household = require('./Household');
const Patient = require('./Patient');
const Visit = require('./Visit');
const Referral = require('./Referral');
const Task = require('./Task');
const Supply = require('./Supply');
const SupplyReport = require('./SupplyReport');
const SyncLog = require('./SyncLog');
const AuditLog = require('./AuditLog');

// User associations
User.hasMany(User, { as: 'subordinates', foreignKey: 'managed_by' });
User.belongsTo(User, { as: 'manager', foreignKey: 'managed_by' });
User.hasMany(AuditLog, { foreignKey: 'user_id', as: 'auditLogs' });
AuditLog.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// User associations
User.hasMany(Household, { foreignKey: 'created_by', as: 'households' });
Household.belongsTo(User, { foreignKey: 'created_by', as: 'createdBy' });

User.hasMany(Patient, { as: 'patients' });
Patient.belongsTo(User, { as: 'chw' });

User.hasMany(Visit, { foreignKey: 'chw_id', as: 'visits' });
Visit.belongsTo(User, { foreignKey: 'chw_id', as: 'chw' });

User.hasMany(Referral, { foreignKey: 'chw_id', as: 'referrals' });
Referral.belongsTo(User, { foreignKey: 'chw_id', as: 'chw' });

User.hasMany(Task, { foreignKey: 'chw_id', as: 'tasks' });
Task.belongsTo(User, { foreignKey: 'chw_id', as: 'chw' });

User.hasMany(SupplyReport, { foreignKey: 'chw_id', as: 'supplyReports' });
SupplyReport.belongsTo(User, { foreignKey: 'chw_id', as: 'chw' });

User.hasMany(SyncLog, { foreignKey: 'user_id', as: 'syncLogs' });
SyncLog.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// Household associations
Household.hasMany(Patient, { foreignKey: 'household_id', as: 'members' });
Patient.belongsTo(Household, { foreignKey: 'household_id', as: 'household' });

Household.hasMany(Task, { foreignKey: 'household_id', as: 'tasks' });
Task.belongsTo(Household, { foreignKey: 'household_id', as: 'household' });

// Patient associations
Patient.hasMany(Visit, { foreignKey: 'patient_id', as: 'visits' });
Visit.belongsTo(Patient, { foreignKey: 'patient_id', as: 'patient' });

Patient.hasMany(Referral, { foreignKey: 'patient_id', as: 'referrals' });
Referral.belongsTo(Patient, { foreignKey: 'patient_id', as: 'patient' });

Patient.hasMany(Task, { foreignKey: 'patient_id', as: 'tasks' });
Task.belongsTo(Patient, { foreignKey: 'patient_id', as: 'patient' });

// Visit associations
Visit.hasOne(Referral, { foreignKey: 'visit_id', as: 'referral_record' });
Referral.belongsTo(Visit, { foreignKey: 'visit_id', as: 'visit' });

Visit.hasOne(Task, { foreignKey: 'visit_id', as: 'task' });
Task.belongsTo(Visit, { foreignKey: 'visit_id', as: 'visit' });

// Supply associations
Supply.hasMany(SupplyReport, { foreignKey: 'supply_id', as: 'reports' });
SupplyReport.belongsTo(Supply, { foreignKey: 'supply_id', as: 'supply' });

module.exports = {
  sequelize,
  User,
  Household,
  Patient,
  Visit,
  Referral,
  Task,
  Supply,
  SupplyReport,
  SyncLog
};
