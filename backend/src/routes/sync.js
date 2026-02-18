const express = require('express');
const { SyncLog, Visit, Patient, Household, Task, Referral, User, sequelize } = require('../models');
const { auth, authorize } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');
const { scrub } = require('../utils/scrubber');
const AuditLog = require('../models/AuditLog');
const logger = require('../utils/logger');

const router = express.Router();

// POST /api/sync/push - Push data from mobile
router.post('/push', auth, authorize('chw', 'supervisor', 'district_officer', 'admin'), [
  body('device_id').notEmpty(),
  body('data').isObject()
], async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      await t.rollback();
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { device_id, data, last_sync_timestamp } = req.body;
    const startTime = new Date();

    const syncLog = await SyncLog.create({
      device_id,
      user_id: req.userId,
      sync_type: 'push',
      started_at: startTime
    }, { transaction: t });

    const results = {
      visits: { created: 0, updated: 0, conflicts: [] },
      patients: { created: 0, updated: 0, conflicts: [] },
      households: { created: 0, updated: 0, conflicts: [] },
      tasks: { created: 0, updated: 0, conflicts: [] },
      referrals: { created: 0, updated: 0, conflicts: [] }
    };

    // Process patients first (dependencies)
    if (data.patients && Array.isArray(data.patients)) {
      for (const patient of data.patients) {
        const existing = await Patient.findOne({ where: { patient_id: patient.patient_id }, transaction: t });
        if (existing) {
          if (new Date(patient.updated_at) > new Date(existing.updated_at)) {
            await existing.update(patient, { transaction: t });
            results.patients.updated++;
          } else {
            results.patients.conflicts.push({ id: patient.patient_id, reason: 'older_version' });
          }
        } else {
          await Patient.create({ ...patient, chw_id: req.userId }, { transaction: t });
          results.patients.created++;
        }
      }
    }

    // Process households
    if (data.households && Array.isArray(data.households)) {
      for (const household of data.households) {
        const existing = await Household.findOne({ where: { household_number: household.household_number }, transaction: t });
        if (existing) {
          if (new Date(household.updated_at) > new Date(existing.updated_at)) {
            await existing.update(household, { transaction: t });
            results.households.updated++;
          } else {
            results.households.conflicts.push({ id: household.household_number, reason: 'older_version' });
          }
        } else {
          await Household.create({ ...household, created_by: req.userId }, { transaction: t });
          results.households.created++;
        }
      }
    }

    // Process visits
    if (data.visits && Array.isArray(data.visits)) {
      for (const visit of data.visits) {
        const existing = await Visit.findOne({ where: { visit_number: visit.visit_number }, transaction: t });
        if (existing) {
          if (new Date(visit.updated_at) > new Date(existing.updated_at)) {
            await existing.update(visit, { transaction: t });
            results.visits.updated++;
          } else {
            results.visits.conflicts.push({ id: visit.visit_number, reason: 'older_version' });
          }
        } else {
          await Visit.create({ ...visit, chw_id: req.userId, synced: true, synced_at: new Date() }, { transaction: t });
          results.visits.created++;
        }
      }
    }

    // Process tasks
    if (data.tasks && Array.isArray(data.tasks)) {
      for (const task of data.tasks) {
        const existing = await Task.findOne({ where: { id: task.id }, transaction: t });
        if (existing) {
          if (new Date(task.updated_at) > new Date(existing.updated_at)) {
            await existing.update(task, { transaction: t });
            results.tasks.updated++;
          }
        } else {
          await Task.create({ ...task, chw_id: req.userId }, { transaction: t });
          results.tasks.created++;
        }
      }
    }

    // Process referrals
    if (data.referrals && Array.isArray(data.referrals)) {
      for (const referral of data.referrals) {
        const existing = await Referral.findOne({ where: { referral_number: referral.referral_number }, transaction: t });
        if (existing) {
          if (new Date(referral.updated_at) > new Date(existing.updated_at)) {
            await existing.update(referral, { transaction: t });
            results.referrals.updated++;
          }
        } else {
          await Referral.create({ ...referral, chw_id: req.userId }, { transaction: t });
          results.referrals.created++;
        }
      }
    }

    const recordsPushed =
      results.visits.created + results.visits.updated +
      results.patients.created + results.patients.updated +
      results.households.created + results.households.updated +
      results.tasks.created + results.tasks.updated +
      results.referrals.created + results.referrals.updated;

    await syncLog.update({
      records_pushed: recordsPushed,
      status: results.conflicts?.length > 0 ? 'partial' : 'success',
      completed_at: new Date()
    }, { transaction: t });

    // Expert Review: Clinical Audit Trail for pushed records
    await AuditLog.create({
      user_id: req.userId,
      action: 'SYNC_PUSH',
      entity_type: 'SyncSession',
      entity_id: syncLog.id,
      changes: {
        summary: results,
        scrubbed_data: scrub(data)
      },
      ip_address: req.ip,
      user_agent: req.headers['user-agent']
    }, { transaction: t });

    await t.commit();

    res.json({
      success: true,
      message: 'Sync completed',
      data: {
        results,
        sync_log_id: syncLog.id,
        server_timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    if (t) await t.rollback();
    logger.error({ error: scrub(error), user_id: req.userId }, 'Sync push server error');
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/sync/pull - Pull data from server
router.post('/pull', auth, authorize('chw', 'supervisor', 'district_officer', 'admin'), async (req, res) => {
  try {
    const { device_id, last_sync_timestamp, filters } = req.body;
    const startTime = new Date();

    const syncLog = await SyncLog.create({
      device_id,
      user_id: req.userId,
      sync_type: 'pull',
      started_at: startTime
    });

    const data = {};

    // Get data modified since last sync
    const syncWhere = last_sync_timestamp
      ? { updated_at: { $gt: new Date(last_sync_timestamp) } }
      : {};

    // Role-based data filtering
    let chwFilter = {};
    if (req.user.role === 'chw') {
      chwFilter = { chw_id: req.userId };
    }

    // Pull visits
    if (!filters || filters.include_visits !== false) {
      data.visits = await Visit.findAll({
        where: { ...chwFilter },
        include: [
          { model: Patient, as: 'patient', attributes: ['id', 'patient_id', 'first_name', 'last_name'] }
        ],
        order: [['updated_at', 'ASC']],
        limit: 1000
      });
    }

    // Pull patients
    if (!filters || filters.include_patients !== false) {
      data.patients = await Patient.findAll({
        where: chwFilter,
        include: [{ model: Household, as: 'household' }],
        order: [['updated_at', 'ASC']],
        limit: 1000
      });
    }

    // Pull households
    if (!filters || filters.include_households !== false) {
      data.households = await Household.findAll({
        where: {},
        order: [['updated_at', 'ASC']],
        limit: 1000
      });
    }

    // Pull tasks
    if (!filters || filters.include_tasks !== false) {
      data.tasks = await Task.findAll({
        where: chwFilter,
        order: [['due_date', 'ASC']],
        limit: 500
      });
    }

    // Pull users (for CHW context)
    if (req.user.role !== 'chw') {
      data.users = await User.findAll({
        where: { is_active: true },
        attributes: ['id', 'username', 'first_name', 'last_name', 'role', 'phone'],
        limit: 100
      });
    }

    const recordsPulled =
      (data.visits?.length || 0) +
      (data.patients?.length || 0) +
      (data.households?.length || 0) +
      (data.tasks?.length || 0);

    await syncLog.update({
      records_pulled: recordsPulled,
      status: 'success',
      completed_at: new Date()
    });

    res.json({
      success: true,
      data: {
        ...data,
        sync_log_id: syncLog.id,
        server_timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Sync pull error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/sync/status - Get sync status
router.get('/status', auth, authorize('chw', 'supervisor', 'district_officer', 'admin'), async (req, res) => {
  try {
    const { device_id } = req.query;

    const where = {};
    if (req.user.role === 'chw') {
      where.user_id = req.userId;
    } else if (req.user.role === 'supervisor') {
      // Filter logs to only show staff managed by this supervisor
      const managedStaff = await User.findAll({ where: { managed_by: req.userId }, attributes: ['id'] });
      const staffIds = managedStaff.map(s => s.id);
      where.user_id = staffIds;
    }
    if (device_id) where.device_id = device_id;

    const recentSyncs = await SyncLog.findAll({
      where,
      include: [
        { model: User, as: 'user', attributes: ['first_name', 'last_name', 'role'] }
      ],
      order: [['started_at', 'DESC']],
      limit: 20
    });

    const lastSync = recentSyncs[0];

    res.json({
      success: true,
      data: {
        last_sync: lastSync ? {
          id: lastSync.id,
          type: lastSync.sync_type,
          status: lastSync.status,
          records_pushed: lastSync.records_pushed,
          records_pulled: lastSync.records_pulled,
          timestamp: lastSync.completed_at
        } : null,
        recent_syncs: recentSyncs.length
      }
    });
  } catch (error) {
    console.error('Get sync status error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
