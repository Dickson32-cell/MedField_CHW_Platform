const express = require('express');
const ProtocolService = require('../services/ProtocolService');
const { auth } = require('../middleware/auth');
const router = express.Router();

// POST /api/protocols/assess - Clinical decision support
router.post('/assess', auth, async (req, res) => {
    try {
        const guidance = await ProtocolService.assess(req.body);
        res.json({ success: true, data: guidance });
    } catch (error) {
        console.error('Protocol assessment error:', error);
        res.status(500).json({ success: false, message: 'Server error during assessment' });
    }
});

module.exports = router;
