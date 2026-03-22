const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');

/**
 * GET /api/chw/stats
 * CHW dashboard stats
 */
router.get('/stats', auth, async (req, res) => {
    if (req.user.role !== 'chw') {
        return res.status(403).json({ success: false, message: 'Access denied' });
    }
    
    const { User, Patient, Visit, Task, Referral, Household } = require('../models');
    const { Op } = require('sequelize');
    
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        
        const [
            todayVisits,
            pendingTasks,
            pendingReferrals,
            completedVisitsThisMonth,
            assignedPatients,
            assignedHouseholds
        ] = await Promise.all([
            Visit.count({
                where: {
                    chw_id: req.userId,
                    visit_date: { [Op.gte]: today }
                }
            }),
            Task.count({
                where: {
                    assigned_to: req.userId,
                    status: 'pending'
                }
            }),
            Referral.count({
                where: {
                    chw_id: req.userId,
                    status: 'pending'
                }
            }),
            Visit.count({
                where: {
                    chw_id: req.userId,
                    visit_status: 'completed',
                    visit_date: { [Op.gte]: startOfMonth }
                }
            }),
            Patient.count({
                where: {
                    chw_id: req.userId,
                    is_active: true
                }
            }),
            Household.count({
                where: {
                    chw_id: req.userId,
                    is_active: true
                }
            })
        ]);
        
        res.json({
            success: true,
            data: {
                today_visits: todayVisits,
                pending_tasks: pendingTasks,
                pending_referrals: pendingReferrals,
                completed_visits_month: completedVisitsThisMonth,
                assigned_patients: assignedPatients,
                assigned_households: assignedHouseholds,
                role: 'chw'
            }
        });
    } catch (e) {
        console.error('CHW stats error:', e);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

/**
 * GET /api/chw/tasks
 * Get CHW's assigned tasks
 */
router.get('/tasks', auth, async (req, res) => {
    if (req.user.role !== 'chw') {
        return res.status(403).json({ success: false, message: 'Access denied' });
    }
    
    const { Task, Patient, Household } = require('../models');
    const { Op } = require('sequelize');
    
    try {
        const { status, limit = 20, offset = 0 } = req.query;
        
        const where = { assigned_to: req.userId };
        if (status) where.status = status;
        
        const { count, rows: tasks } = await Task.findAndCountAll({
            where,
            include: [
                { model: Patient, as: 'patient', attributes: ['id', 'first_name', 'last_name', 'phone'] },
                { model: Household, as: 'household', attributes: ['id', 'name', 'village'] }
            ],
            order: [['due_date', 'ASC']],
            limit: parseInt(limit),
            offset: parseInt(offset)
        });
        
        res.json({
            success: true,
            data: {
                tasks,
                total: count
            }
        });
    } catch (e) {
        console.error('CHW tasks error:', e);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

/**
 * GET /api/chw/patients
 * Get CHW's assigned patients
 */
router.get('/patients', auth, async (req, res) => {
    if (req.user.role !== 'chw') {
        return res.status(403).json({ success: false, message: 'Access denied' });
    }
    
    const { Patient, Household } = require('../models');
    
    try {
        const { search, limit = 50, offset = 0 } = req.query;
        
        const where = { chw_id: req.userId, is_active: true };
        if (search) {
            where[Op.or] = [
                { first_name: { [Op.iLike]: `%${search}%` } },
                { last_name: { [Op.iLike]: `%${search}%` } },
                { phone: { [Op.iLike]: `%${search}%` } },
                { national_id: { [Op.iLike]: `%${search}%` } }
            ];
        }
        
        const { count, rows: patients } = await Patient.findAndCountAll({
            where,
            include: [
                { model: Household, as: 'household', attributes: ['id', 'name', 'village'] }
            ],
            order: [['last_name', 'ASC']],
            limit: parseInt(limit),
            offset: parseInt(offset)
        });
        
        res.json({
            success: true,
            data: {
                patients,
                total: count
            }
        });
    } catch (e) {
        console.error('CHW patients error:', e);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

/**
 * GET /api/chw/patients/:id
 * Get single patient for CHW
 */
router.get('/patients/:id', auth, async (req, res) => {
    if (req.user.role !== 'chw') {
        return res.status(403).json({ success: false, message: 'Access denied' });
    }
    
    const { Patient, Visit, Household } = require('../models');
    
    try {
        const patient = await Patient.findOne({
            where: {
                id: req.params.id,
                chw_id: req.userId
            },
            include: [
                { model: Household, as: 'household', attributes: ['id', 'name', 'village'] },
                { model: Visit, as: 'visits', limit: 10, order: [['visit_date', 'DESC']] }
            ]
        });
        
        if (!patient) {
            return res.status(404).json({ success: false, message: 'Patient not found' });
        }
        
        res.json({ success: true, data: patient });
    } catch (e) {
        console.error('CHW patient error:', e);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

/**
 * GET /api/chw/visits
 * Get CHW's visit history
 */
router.get('/visits', auth, async (req, res) => {
    if (req.user.role !== 'chw') {
        return res.status(403).json({ success: false, message: 'Access denied' });
    }
    
    const { Visit, Patient } = require('../models');
    
    try {
        const { limit = 20, offset = 0 } = req.query;
        
        const { count, rows: visits } = await Visit.findAndCountAll({
            where: { chw_id: req.userId },
            include: [
                { model: Patient, as: 'patient', attributes: ['id', 'first_name', 'last_name'] }
            ],
            order: [['visit_date', 'DESC']],
            limit: parseInt(limit),
            offset: parseInt(offset)
        });
        
        res.json({
            success: true,
            data: {
                visits,
                total: count
            }
        });
    } catch (e) {
        console.error('CHW visits error:', e);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;
