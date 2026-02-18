const express = require('express');
const { Household, Patient, User } = require('../models');
const { auth, authorize } = require('../middleware/auth');
const { body, validationResult, query } = require('express-validator');

const router = express.Router();

// GET /api/households - Get households
router.get('/', auth, authorize('chw', 'supervisor', 'district_officer'), async (req, res) => {
  try {
    const { page = 1, limit = 20, search, community, village, is_active = true } = req.query;

    const where = {};
    if (community) where.community = community;
    if (village) where.village = village;
    if (is_active) where.is_active = is_active === 'true';

    if (search) {
      where[require('sequelize').Op.or] = [
        { household_number: { [require('sequelize').Op.iLike]: `%${search}%` } },
        { head_of_household: { [require('sequelize').Op.iLike]: `%${search}%` } }
      ];
    }

    const offset = (page - 1) * limit;
    const { count, rows } = await Household.findAndCountAll({
      where,
      include: [
        {
          model: Patient,
          as: 'members',
          attributes: ['id', 'patient_id', 'first_name', 'last_name', 'date_of_birth', 'gender'],
          where: { is_active: true },
          required: false
        },
        {
          model: User,
          as: 'createdBy',
          attributes: ['id', 'first_name', 'last_name']
        }
      ],
      limit: parseInt(limit),
      offset,
      order: [['created_at', 'DESC']]
    });

    res.json({
      success: true,
      data: {
        households: rows,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(count / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get households error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/households/:id - Get single household
router.get('/:id', auth, async (req, res) => {
  try {
    const household = await Household.findByPk(req.params.id, {
      include: [
        {
          model: Patient,
          as: 'members',
          where: { is_active: true },
          required: false
        },
        {
          model: User,
          as: 'createdBy',
          attributes: ['id', 'first_name', 'last_name']
        }
      ]
    });

    if (!household) {
      return res.status(404).json({ success: false, message: 'Household not found' });
    }

    res.json({ success: true, data: household });
  } catch (error) {
    console.error('Get household error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/households - Create household
router.post('/', auth, [
  body('head_of_household').notEmpty(),
  body('community').notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const {
      household_number,
      head_of_household,
      address,
      location,
      gps_coordinates,
      community,
      village,
      ward,
      catchment_area
    } = req.body;

    // Generate household number if not provided
    const finalHhNumber = household_number || `HH${Date.now().toString().slice(-6)}`;

    const household = await Household.create({
      household_number: finalHhNumber,
      head_of_household,
      address,
      location: location || {},
      gps_coordinates,
      community,
      village,
      ward,
      catchment_area,
      created_by: req.userId
    });

    res.status(201).json({
      success: true,
      message: 'Household registered',
      data: household
    });
  } catch (error) {
    console.error('Create household error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// PUT /api/households/:id - Update household
router.put('/:id', auth, async (req, res) => {
  try {
    const household = await Household.findByPk(req.params.id);

    if (!household) {
      return res.status(404).json({ success: false, message: 'Household not found' });
    }

    const {
      head_of_household,
      address,
      location,
      gps_coordinates,
      community,
      village,
      ward,
      catchment_area,
      is_active
    } = req.body;

    await household.update({
      head_of_household: head_of_household || household.head_of_household,
      address: address || household.address,
      location: location || household.location,
      gps_coordinates: gps_coordinates || household.gps_coordinates,
      community: community || household.community,
      village: village || household.village,
      ward: ward || household.ward,
      catchment_area: catchment_area || household.catchment_area,
      is_active: is_active !== undefined ? is_active : household.is_active
    });

    res.json({ success: true, message: 'Household updated', data: household });
  } catch (error) {
    console.error('Update household error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
