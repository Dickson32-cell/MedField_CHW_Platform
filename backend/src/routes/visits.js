const express = require('express');
const { Visit, Patient, Household, User, Task, Referral } = require('../models');
const { auth, authorize } = require('../middleware/auth');
const { body, validationResult, param, query } = require('express-validator');
const { Op } = require('sequelize');
const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');

const VisitService = require('../services/VisitService');

const router = express.Router();

// GET /api/visits - Get visits
router.get('/', auth, authorize('chw', 'supervisor', 'district_officer'), async (req, res) => {
  try {
    const result = await VisitService.getAll(req.query, req.user);
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error({ err: error, userId: req.userId }, 'Get visits error');
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/visits/:id - Get single visit
router.get('/:id', auth, authorize('chw', 'supervisor', 'district_officer'), async (req, res) => {
  try {
    const visit = await VisitService.getById(req.params.id);

    if (!visit) {
      return res.status(404).json({ success: false, message: 'Visit not found' });
    }

    res.json({ success: true, data: visit });
  } catch (error) {
    logger.error({ err: error, userId: req.userId }, 'Get visit error');
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/visits - Create visit
router.post('/', auth, [
  body('patient_id').isUUID(),
  body('visit_type').isIn(['scheduled', 'follow_up', 'emergency', 'referral_follow', 'outreach']),
  body('visit_date').isISO8601()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const visit = await VisitService.create(req.body, req.userId);

    res.status(201).json({
      success: true,
      message: 'Visit recorded successfully',
      data: visit
    });
  } catch (error) {
    logger.error({ err: error, userId: req.userId }, 'Create visit error');
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// PUT /api/visits/:id - Update visit
router.put('/:id', auth, async (req, res) => {
  try {
    const visit = await VisitService.update(req.params.id, req.body);
    if (!visit) {
      return res.status(404).json({ success: false, message: 'Visit not found' });
    }

    res.json({
      success: true,
      message: 'Visit updated',
      data: visit
    });
  } catch (error) {
    logger.error({ err: error, userId: req.userId }, 'Update visit error');
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/visits/stats/summary - Get visit statistics
router.get('/stats/summary', auth, async (req, res) => {
  try {
    const result = await VisitService.getSummary(req.query, req.user);
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error({ err: error, userId: req.userId }, 'Get visit stats error');
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
