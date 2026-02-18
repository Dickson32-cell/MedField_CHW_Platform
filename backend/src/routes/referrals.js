const express = require('express');
const { Referral, Patient, Visit, User } = require('../models');
const { auth, authorize } = require('../middleware/auth');
const { body, validationResult, query } = require('express-validator');
const { Op } = require('sequelize');

const router = express.Router();

// GET /api/referrals - Get referrals
router.get('/', auth, authorize('chw', 'supervisor', 'district_officer'), async (req, res) => {
  try {
    const { page = 1, limit = 20, status, chw_id, start_date, end_date } = req.query;

    const where = {};
    if (status) where.status = status;
    if (chw_id) where.chw_id = chw_id;

    if (start_date || end_date) {
      where.referral_date = {};
      if (start_date) where.referral_date[Op.gte] = new Date(start_date);
      if (end_date) where.referral_date[Op.lte] = new Date(end_date);
    }

    const offset = (page - 1) * limit;
    const { count, rows } = await Referral.findAndCountAll({
      where,
      include: [
        { model: Patient, as: 'patient', attributes: ['id', 'patient_id', 'first_name', 'last_name'] },
        { model: User, as: 'chw', attributes: ['id', 'first_name', 'last_name'] }
      ],
      limit: parseInt(limit),
      offset,
      order: [['referral_date', 'DESC']]
    });

    res.json({
      success: true,
      data: {
        referrals: rows,
        pagination: { total: count, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(count / limit) }
      }
    });
  } catch (error) {
    console.error('Get referrals error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/referrals/:id - Get single referral
router.get('/:id', auth, async (req, res) => {
  try {
    const referral = await Referral.findByPk(req.params.id, {
      include: [
        { model: Patient, as: 'patient' },
        { model: User, as: 'chw' },
        { model: Visit, as: 'visit' }
      ]
    });

    if (!referral) {
      return res.status(404).json({ success: false, message: 'Referral not found' });
    }

    res.json({ success: true, data: referral });
  } catch (error) {
    console.error('Get referral error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/referrals - Create referral
router.post('/', auth, [
  body('patient_id').isUUID(),
  body('referred_to_facility').notEmpty(),
  body('referral_reason').notEmpty(),
  body('referral_date').isISO8601()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { patient_id, visit_id, referral_date, referred_to_facility, referral_reason, clinical_notes, vital_signs, appointment_date } = req.body;

    const count = await Referral.count() + 1;
    const referralNumber = `R${Date.now().toString().slice(-6)}${count.toString().padStart(4, '0')}`;

    const referral = await Referral.create({
      referral_number: referralNumber,
      patient_id,
      chw_id: req.userId,
      visit_id,
      referral_date,
      referred_to_facility,
      referral_reason,
      clinical_notes,
      vital_signs: vital_signs || {},
      appointment_date,
      status: 'pending'
    });

    // TODO: Send SMS notification

    res.status(201).json({
      success: true,
      message: 'Referral created',
      data: referral
    });
  } catch (error) {
    console.error('Create referral error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// PUT /api/referrals/:id - Update referral (facility feedback)
router.put('/:id', auth, async (req, res) => {
  try {
    const referral = await Referral.findByPk(req.params.id);

    if (!referral) {
      return res.status(404).json({ success: false, message: 'Referral not found' });
    }

    const { status, facility_feedback, outcome, appointment_date, sms_confirmation } = req.body;

    await referral.update({
      status: status || referral.status,
      facility_feedback: facility_feedback || referral.facility_feedback,
      outcome: outcome || referral.outcome,
      appointment_date: appointment_date || referral.appointment_date,
      sms_confirmation
    });

    res.json({ success: true, message: 'Referral updated', data: referral });
  } catch (error) {
    console.error('Update referral error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/referrals/pending - Get pending referrals
router.get('/stats/pending', auth, async (req, res) => {
  try {
    const { chw_id } = req.query;
    const where = { status: 'pending' };
    if (chw_id) where.chw_id = chw_id;

    const pending = await Referral.count({ where });

    res.json({ success: true, data: { pending } });
  } catch (error) {
    console.error('Get pending referrals error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
