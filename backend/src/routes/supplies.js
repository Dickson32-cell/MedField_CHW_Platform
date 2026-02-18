const express = require('express');
const SupplyService = require('../services/SupplyService');
const { auth } = require('../middleware/auth');
const router = express.Router();

// GET /api/supplies - Get all supply items
router.get('/', auth, async (req, res) => {
    try {
        const supplies = await SupplyService.getAllSupplies();
        res.json({ success: true, data: supplies });
    } catch (error) {
        console.error('Get supplies error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// POST /api/supplies/report - CHW reports stock
router.post('/report', auth, async (req, res) => {
    try {
        const report = await SupplyService.recordReport(req.body, req.userId);
        res.json({ success: true, data: report });
    } catch (error) {
        console.error('Supply report error:', error);
        res.status(500).json({ success: false, message: 'Server error during reporting' });
    }
});

module.exports = router;
