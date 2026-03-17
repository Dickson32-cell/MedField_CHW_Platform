const express = require('express');
const { Patient, Household, Visit, User } = require('../models');
const { auth, authorize } = require('../middleware/auth');
const { body, validationResult, param, query } = require('express-validator');
const { Op } = require('sequelize');
const logger = require('../utils/logger');
const { apiLimiter } = require('../middleware/rateLimiter');

const PatientService = require('../services/PatientService');

const router = express.Router();

// Apply rate limiting to all patient routes
router.use(apiLimiter);

// GET /api/patients - Get all patients (with filters)
router.get('/', auth, authorize('chw', 'supervisor', 'district_officer'), async (req, res) => {
  try {
    const result = await PatientService.getAll(req.query, req.user);
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error({ err: error, userId: req.userId }, 'Get patients error');
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/patients/:id - Get single patient
router.get('/:id', auth, authorize('chw', 'supervisor', 'district_officer'), async (req, res) => {
  try {
    const patient = await PatientService.getById(req.params.id);
    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient not found' });
    }
    res.json({ success: true, data: patient });
  } catch (error) {
    logger.error({ err: error, userId: req.userId }, 'Get patient error');
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/patients - Create patient
router.post('/', auth, [
  body('first_name').notEmpty(),
  body('date_of_birth').isISO8601(),
  body('gender').isIn(['male', 'female', 'other']),
  body('household_id').isUUID()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const patient = await PatientService.create(req.body, req.userId);

    res.status(201).json({
      success: true,
      message: 'Patient registered successfully',
      data: patient
    });
  } catch (error) {
    logger.error({ err: error, userId: req.userId }, 'Create patient error');
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// PUT /api/patients/:id - Update patient
router.put('/:id', auth, async (req, res) => {
  try {
    const patient = await PatientService.update(req.params.id, req.body, req.userId, req.user.role);
    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient not found' });
    }

    res.json({
      success: true,
      message: 'Patient updated',
      data: patient
    });
  } catch (error) {
    logger.error({ err: error, userId: req.userId }, 'Update patient error');
    const status = error.message === 'Not authorized to update this patient' ? 403 : 500;
    res.status(status).json({ success: false, message: error.message || 'Server error' });
  }
});

// GET /api/patients/:id/visits - Get patient visit history
router.get('/:id/visits', auth, async (req, res) => {
  try {
    const result = await PatientService.getVisits(req.params.id, req.query);
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error({ err: error, userId: req.userId }, 'Get patient visits error');
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/patients/high-risk - Get high-risk patients
router.get('/stats/high-risk', auth, async (req, res) => {
  try {
    const patients = await PatientService.getHighRisk(req.query.min_score);
    res.json({
      success: true,
      data: {
        count: patients.length,
        patients
      }
    });
  } catch (error) {
    logger.error({ err: error, userId: req.userId }, 'Get high-risk patients error');
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
