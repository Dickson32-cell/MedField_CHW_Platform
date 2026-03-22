const { Log, User, sequelize } = require('../models');

/**
 * Log user actions for audit trail
 */
async function logAction(req, action, details = {}) {
  try {
    await Log.create({
      userId: req.user?.id || null,
      action,
      details: JSON.stringify(details),
      ipAddress: req.ip || req.connection?.remoteAddress,
      userAgent: req.headers['user-agent'],
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Audit log error:', error);
    // Don't throw - logging should not break operations
  }
}

/**
 * Get audit logs with filters
 */
async function getAuditLogs(filters = {}) {
  const { userId, action, startDate, endDate, limit = 100, offset = 0 } = filters;

  const where = {};
  if (userId) where.userId = userId;
  if (action) where.action = action;
  if (startDate || endDate) {
    where.timestamp = {};
    if (startDate) where.timestamp[require('sequelize').Op.gte] = startDate;
    if (endDate) where.timestamp[require('sequelize').Op.lte] = endDate;
  }

  return Log.findAndCountAll({
    where,
    include: [{ model: User, as: 'user', attributes: ['id', 'username', 'role'] }],
    order: [['timestamp', 'DESC']],
    limit,
    offset
  });
}

/**
 * Export audit logs
 */
async function exportAuditLogs(startDate, endDate, format = 'json') {
  const { Op } = require('sequelize');
  
  const logs = await Log.findAll({
    where: {
      timestamp: { [Op.between]: [startDate, endDate] }
    },
    include: [{ model: User, as: 'user', attributes: ['id', 'username', 'role'] }],
    order: [['timestamp', 'DESC']]
  });

  if (format === 'csv') {
    // Convert to CSV format
    const headers = 'Timestamp,User,Action,Details,IP Address\n';
    const rows = logs.map(log => 
      `"${log.timestamp}","${log.user?.username || 'System'}","${log.action}","${log.details}","${log.ipAddress}"`
    ).join('\n');
    return headers + rows;
  }

  return logs;
}

module.exports = {
  logAction,
  getAuditLogs,
  exportAuditLogs
};
