const AuditLog = require('../models/AuditLog');
const logger = require('../utils/logger');
const { scrub } = require('../utils/scrubber');

/**
 * Middleware to record data mutations to AuditLog
 */
const auditLog = async (req, res, next) => {
    const originalJson = res.json;
    const userId = req.userId;
    const ip = req.ip;
    const ua = req.headers['user-agent'];

    // Monkey-patch res.json to capture successful mutations
    res.json = function (data) {
        if (data.success && ['POST', 'PUT', 'DELETE'].includes(req.method)) {
            // Background the audit logging to avoid blocking the response
            try {
                const action = req.method === 'POST' ? 'CREATE' : (req.method === 'PUT' ? 'UPDATE' : 'DELETE');
                const pathParts = req.baseUrl.split('/');
                const entityType = pathParts[pathParts.length - 1]; // e.g., 'patients', 'visits'

                AuditLog.create({
                    user_id: userId,
                    action,
                    entity_type: entityType,
                    entity_id: req.params.id || (data.data && data.data.id) || null,
                    changes: scrub(req.body),
                    ip_address: ip,
                    user_agent: ua
                }).catch(err => logger.error({ err }, 'Failed to write audit log'));

            } catch (err) {
                logger.error({ err }, 'Audit logging error');
            }
        }
        return originalJson.call(this, data);
    };

    next();
};

module.exports = { auditLog };
