const express = require('express');
const bcrypt = require('bcryptjs');
const { User } = require('../models');
const { auth, authorize } = require('../middleware/auth');
const router = express.Router();

// GET /api/users - List users (Filtered by hierarchy if supervisor)
router.get('/', auth, authorize('admin', 'district_officer', 'supervisor'), async (req, res) => {
    try {
        const { role, is_active, is_approved } = req.query;
        const where = {};

        // Hierarchy Logic: Supervisors only see staff they manage
        if (req.user.role === 'supervisor') {
            where.managed_by = req.userId;
        }

        if (role) where.role = role;
        if (is_active !== undefined) where.is_active = is_active === 'true';
        if (is_approved !== undefined) where.is_approved = is_approved === 'true';

        const users = await User.findAll({
            where,
            attributes: { exclude: ['password', 'refresh_token'] },
            order: [['is_approved', 'ASC'], ['last_name', 'ASC']]
        });

        res.json({
            success: true,
            data: users
        });
    } catch (error) {
        console.error('List users error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// GET /api/users/:id - Get specific user
router.get('/:id', auth, authorize('admin', 'district_officer'), async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id, {
            attributes: { exclude: ['password', 'refresh_token'] }
        });

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        res.json({
            success: true,
            data: user
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// PUT /api/users/:id - Update user (Admin only)
router.put('/:id', auth, authorize('admin'), async (req, res) => {
    try {
        const { first_name, last_name, email, role, is_active, phone } = req.body;
        const user = await User.findByPk(req.params.id);

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        await user.update({
            first_name: first_name || user.first_name,
            last_name: last_name || user.last_name,
            email: email || user.email,
            role: role || user.role,
            phone: phone || user.phone,
            is_active: is_active !== undefined ? is_active : user.is_active
        });

        res.json({
            success: true,
            message: 'User updated successfully',
            data: user
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// DELETE /api/users/:id - Deactivate user
router.delete('/:id', auth, authorize('admin'), async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Instead of deleting, we deactivate
        await user.update({ is_active: false });

        res.json({
            success: true,
            message: 'User deactivated successfully'
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// POST /api/users/:id/approve - Approve a user (Admin only)
router.post('/:id/approve', auth, authorize('admin'), async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        await user.update({ is_approved: true });

        res.json({
            success: true,
            message: 'User account approved successfully'
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// POST /api/users/:id/reset-password - Reset user password (Admin only)
router.post('/:id/reset-password', auth, authorize('admin'), async (req, res) => {
    try {
        const { new_password } = req.body;
        if (!new_password || new_password.length < 6) {
            return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
        }

        const user = await User.findByPk(req.params.id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const hashedPassword = await bcrypt.hash(new_password, 10);
        await user.update({
            password: hashedPassword,
            refresh_token: null // Force logout from all devices
        });

        res.json({
            success: true,
            message: 'Password reset successfully'
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;
