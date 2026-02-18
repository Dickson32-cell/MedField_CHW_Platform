const express = require('express');
const { Task, Patient, Household, User, Visit } = require('../models');
const { auth, authorize } = require('../middleware/auth');
const { body, validationResult, query } = require('express-validator');
const { Op } = require('sequelize');

const router = express.Router();

// GET /api/tasks - Get tasks
router.get('/', auth, authorize('chw', 'supervisor', 'district_officer'), async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      priority,
      task_type,
      due_date,
      chw_id
    } = req.query;

    const where = {};

    // Role-based filtering
    if (req.user.role === 'chw') {
      where.chw_id = req.userId;
    } else if (chw_id) {
      where.chw_id = chw_id;
    }

    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (task_type) where.task_type = task_type;
    if (due_date) where.due_date = { [Op.lte]: new Date(due_date) };

    const offset = (page - 1) * limit;
    const { count, rows } = await Task.findAndCountAll({
      where,
      include: [
        { model: Patient, as: 'patient', attributes: ['id', 'patient_id', 'first_name', 'last_name'] },
        { model: Household, as: 'household', attributes: ['id', 'household_number', 'head_of_household'] },
        { model: User, as: 'chw', attributes: ['id', 'first_name', 'last_name'] }
      ],
      limit: parseInt(limit),
      offset,
      order: [
        ['priority', 'DESC'],
        ['due_date', 'ASC']
      ]
    });

    res.json({
      success: true,
      data: {
        tasks: rows,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(count / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/tasks/today - Get today's tasks
router.get('/today', auth, authorize('chw', 'supervisor', 'district_officer'), async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const where = {};

    if (req.user.role === 'chw') {
      where.chw_id = req.userId;
    }

    const tasks = await Task.findAll({
      where: {
        ...where,
        due_date: {
          [Op.gte]: today,
          [Op.lt]: tomorrow
        },
        status: { [Op.ne]: 'completed' }
      },
      include: [
        { model: Patient, as: 'patient', attributes: ['id', 'patient_id', 'first_name', 'last_name'] },
        { model: Household, as: 'household', attributes: ['id', 'household_number', 'head_of_household', 'location'] }
      ],
      order: [
        ['priority', 'DESC'],
        ['due_date', 'ASC']
      ]
    });

    res.json({
      success: true,
      data: {
        date: today.toISOString().split('T')[0],
        tasks
      }
    });
  } catch (error) {
    console.error('Get today tasks error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/tasks/overdue - Get overdue tasks
router.get('/overdue', auth, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const where = {};

    if (req.user.role === 'chw') {
      where.chw_id = req.userId;
    }

    const tasks = await Task.findAll({
      where: {
        ...where,
        due_date: { [Op.lt]: today },
        status: { [Op.ne]: 'completed' }
      },
      include: [
        { model: Patient, as: 'patient', attributes: ['id', 'patient_id', 'first_name', 'last_name'] },
        { model: Household, as: 'household', attributes: ['id', 'household_number', 'head_of_household'] }
      ],
      order: [['due_date', 'ASC']]
    });

    res.json({
      success: true,
      data: {
        count: tasks.length,
        tasks
      }
    });
  } catch (error) {
    console.error('Get overdue tasks error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/tasks - Create task
router.post('/', auth, [
  body('task_type').isIn(['visit', 'follow_up', 'immunization', 'nutrition', 'delivery', 'referral', 'supply']),
  body('title').notEmpty(),
  body('due_date').isISO8601()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const {
      patient_id,
      household_id,
      chw_id,
      task_type,
      title,
      description,
      due_date,
      priority,
      visit_id
    } = req.body;

    const task = await Task.create({
      patient_id,
      household_id,
      chw_id: chw_id || req.userId,
      task_type,
      title,
      description,
      due_date,
      priority: priority || 'medium',
      visit_id,
      assigned_date: new Date()
    });

    res.status(201).json({
      success: true,
      message: 'Task created',
      data: task
    });
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// PUT /api/tasks/:id - Update task
router.put('/:id', auth, async (req, res) => {
  try {
    const task = await Task.findByPk(req.params.id);

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    const { status, notes, completed_date } = req.body;

    const updateData = {};
    if (status) {
      updateData.status = status;
      if (status === 'completed') {
        updateData.completed_date = completed_date || new Date();
      }
    }
    if (notes) updateData.notes = notes;

    await task.update(updateData);

    res.json({
      success: true,
      message: 'Task updated',
      data: task
    });
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/tasks/stats/summary - Get task statistics
router.get('/stats/summary', auth, async (req, res) => {
  try {
    const where = {};

    if (req.user.role === 'chw') {
      where.chw_id = req.userId;
    }

    const [total, pending, completed, overdue] = await Promise.all([
      Task.count({ where }),
      Task.count({ where: { ...where, status: 'pending' } }),
      Task.count({ where: { ...where, status: 'completed' } }),
      Task.count({
        where: {
          ...where,
          due_date: { [Op.lt]: new Date() },
          status: { [Op.ne]: 'completed' }
        }
      })
    ]);

    res.json({
      success: true,
      data: {
        total,
        pending,
        completed,
        overdue,
        completion_rate: total > 0 ? ((completed / total) * 100).toFixed(2) : 0
      }
    });
  } catch (error) {
    console.error('Get task stats error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
