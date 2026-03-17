const express = require('express');
const { Task, Patient, Household, User, Visit } = require('../models');
const { auth, authorize } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');
const logger = require('../utils/logger');
const { apiLimiter } = require('../middleware/rateLimiter');

const TaskService = require('../services/TaskService');

const router = express.Router();

// Apply rate limiting to all task routes
router.use(apiLimiter);

// GET /api/tasks - Get tasks
router.get('/', auth, authorize('chw', 'supervisor', 'district_officer'), async (req, res) => {
  try {
    const result = await TaskService.getAll(req.query, req.user);
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error({ err: error, userId: req.userId }, 'Get tasks error');
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/tasks/today - Get today's tasks
router.get('/today', auth, authorize('chw', 'supervisor', 'district_officer'), async (req, res) => {
  try {
    const result = await TaskService.getToday(req.userId, req.user.role);
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error({ err: error, userId: req.userId }, 'Get today tasks error');
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/tasks/overdue - Get overdue tasks
router.get('/overdue', auth, async (req, res) => {
  try {
    const result = await TaskService.getOverdue(req.userId, req.user.role);
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error({ err: error, userId: req.userId }, 'Get overdue tasks error');
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/tasks/stats/summary - Get task statistics
router.get('/stats/summary', auth, async (req, res) => {
  try {
    const result = await TaskService.getSummary(req.userId, req.user.role);
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error({ err: error, userId: req.userId }, 'Get task stats error');
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/tasks - Create task
router.post('/', auth, [
  body('task_type').optional().isIn(['visit', 'follow_up', 'immunization', 'nutrition', 'delivery', 'referral', 'supply']),
  body('title').notEmpty().trim().escape(),
  body('due_date').isISO8601()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const task = await TaskService.create(req.body, req.userId);

    res.status(201).json({
      success: true,
      message: 'Task created',
      data: task
    });
  } catch (error) {
    logger.error({ err: error, userId: req.userId }, 'Create task error');
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
});

// PUT /api/tasks/:id - Update task
router.put('/:id', auth, async (req, res) => {
  try {
    const task = await TaskService.update(req.params.id, req.body, req.userId, req.user.role);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    res.json({
      success: true,
      message: 'Task updated',
      data: task
    });
  } catch (error) {
    logger.error({ err: error, userId: req.userId }, 'Update task error');
    const status = error.message === 'Not authorized to update this task' ? 403 : 500;
    res.status(status).json({ success: false, message: error.message || 'Server error' });
  }
});

module.exports = router;