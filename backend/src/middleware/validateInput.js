/**
 * Input Validation Middleware
 * Provides centralized validation for API endpoints
 */

const { body, param, query, validationResult } = require('express-validator');

/**
 * Handle validation errors
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(err => ({
        field: err.path,
        message: err.msg
      }))
    });
  }
  next();
};

/**
 * Sanitize string input - prevent XSS
 */
const sanitizeString = (field) => {
  return body(field)
    .optional()
    .trim()
    .escape()
    .notEmpty()
    .withMessage(`${field} cannot be empty`);
};

/**
 * Common validation rules
 */
const validationRules = {
  // Auth validations
  register: [
    body('username')
      .trim()
      .isLength({ min: 3, max: 50 })
      .withMessage('Username must be 3-50 characters')
      .matches(/^[a-zA-Z0-9_]+$/)
      .withMessage('Username can only contain letters, numbers, and underscores'),
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Valid email required'),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters'),
    body('first_name')
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage('First name required')
      .matches(/^[a-zA-Z\s'-]+$/)
      .withMessage('First name contains invalid characters'),
    body('last_name')
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage('Last name required')
      .matches(/^[a-zA-Z\s'-]+$/)
      .withMessage('Last name contains invalid characters'),
    body('phone')
      .optional()
      .matches(/^\+?[0-9]{10,15}$/)
      .withMessage('Invalid phone number format'),
    validate
  ],

  login: [
    body('username')
      .trim()
      .notEmpty()
      .withMessage('Username required'),
    body('password')
      .notEmpty()
      .withMessage('Password required'),
    validate
  ],

  // Patient validations
  createPatient: [
    body('first_name')
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage('First name required')
      .matches(/^[a-zA-Z\s'-]+$/)
      .withMessage('First name contains invalid characters'),
    body('last_name')
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage('Last name required')
      .matches(/^[a-zA-Z\s'-]+$/)
      .withMessage('Last name contains invalid characters'),
    body('date_of_birth')
      .isISO8601()
      .withMessage('Valid date of birth required'),
    body('gender')
      .isIn(['male', 'female', 'other'])
      .withMessage('Invalid gender'),
    body('household_id')
      .isUUID()
      .withMessage('Valid household ID required'),
    validate
  ],

  // Visit validations
  createVisit: [
    body('patient_id')
      .isUUID()
      .withMessage('Valid patient ID required'),
    body('visit_type')
      .isIn(['scheduled', 'unscheduled', 'follow_up', 'emergency'])
      .withMessage('Invalid visit type'),
    body('visit_date')
      .isISO8601()
      .withMessage('Valid visit date required'),
    body('symptoms')
      .optional()
      .isArray()
      .withMessage('Symptoms must be an array'),
    validate
  ],

  // Task validations
  createTask: [
    body('title')
      .trim()
      .isLength({ min: 1, max: 200 })
      .withMessage('Title required'),
    body('task_type')
      .isIn(['visit', 'follow_up', 'referral', 'assessment', 'other'])
      .withMessage('Invalid task type'),
    body('due_date')
      .isISO8601()
      .withMessage('Valid due date required'),
    body('priority')
      .isIn(['low', 'medium', 'high', 'urgent'])
      .withMessage('Invalid priority'),
    body('patient_id')
      .optional()
      .isUUID()
      .withMessage('Valid patient ID required'),
    body('assigned_to')
      .optional()
      .isUUID()
      .withMessage('Valid assignee ID required'),
    validate
  ],

  // UUID parameter validation
  uuidParam: [
    param('id')
      .isUUID()
      .withMessage('Invalid ID format'),
    validate
  ],

  // Pagination
  pagination: [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be 1-100'),
    validate
  ]
};

module.exports = {
  validate,
  validationRules,
  sanitizeString
};