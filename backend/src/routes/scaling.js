const express = require('express');
const router = express.Router();
const systemHealthMonitor = require('../services/systemHealthMonitor');
const metricsCollector = require('../services/scaling/metricsCollector');
const { auth, authorize } = require('../middleware/auth');

// Get current scaling status (Admin only)
router.get('/status', auth, authorize('admin'), (req, res) => {
    res.json({
        success: true,
        data: systemHealthMonitor.getStatus()
    });
});

// Get historical metrics (Admin only)
router.get('/metrics', auth, authorize('admin'), (req, res) => {
    res.json({
        success: true,
        data: metricsCollector.getMetricsHistory()
    });
});

// Trigger manual scaling action (Admin only)
router.post('/trigger', auth, authorize('admin'), async (req, res) => {
    const { action, target } = req.body;

    try {
        if (action === 'scale-up') {
            const horizontalScalingManager = require('../services/scaling/horizontalScalingManager');
            await horizontalScalingManager.scaleUp();
        } else if (action === 'scale-down') {
            const horizontalScalingManager = require('../services/scaling/horizontalScalingManager');
            await horizontalScalingManager.scaleDown();
        } else if (action === 'vertical' && target) {
            const verticalScalingManager = require('../services/scaling/verticalScalingManager');
            await verticalScalingManager.scaleTo(target);
        }

        res.json({ success: true, message: `Scaling action ${action} triggered` });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
