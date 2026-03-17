const { Task, Patient, Household, User, Visit } = require('../models');
const { Op } = require('sequelize');

class TaskService {
    // Whitelist of allowed fields for create
    static get ALLOWED_CREATE_FIELDS() {
        return [
            'patient_id', 'household_id', 'chw_id', 'task_type',
            'title', 'description', 'due_date', 'priority', 'visit_id'
        ];
    }

    // Whitelist of allowed fields for update
    static get ALLOWED_UPDATE_FIELDS() {
        return ['status', 'notes', 'priority', 'due_date'];
    }

    // Sanitize input data (whitelist approach)
    _sanitize(data, allowedFields) {
        const sanitized = {};
        for (const field of allowedFields) {
            if (data[field] !== undefined) {
                sanitized[field] = data[field];
            }
        }
        return sanitized;
    }

    async getAll(query, user) {
        const {
            page = 1,
            limit = 20,
            status,
            priority,
            task_type,
            due_date,
            chw_id
        } = query;

        const where = {};

        // Role-based filtering
        if (user.role === 'chw') {
            where.chw_id = user.id;
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

        return {
            tasks: rows,
            pagination: {
                total: count,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(count / limit)
            }
        };
    }

    async getById(id) {
        return await Task.findByPk(id, {
            include: [
                { model: Patient, as: 'patient', attributes: ['id', 'patient_id', 'first_name', 'last_name'] },
                { model: Household, as: 'household', attributes: ['id', 'household_number', 'head_of_household'] },
                { model: User, as: 'chw', attributes: ['id', 'first_name', 'last_name'] }
            ]
        });
    }

    async create(data, userId) {
        // Prevent mass assignment
        const sanitizedData = this._sanitize(data, TaskService.ALLOWED_CREATE_FIELDS);

        // Validate required fields
        if (!sanitizedData.title || !sanitizedData.due_date) {
            throw new Error('Missing required fields: title, due_date');
        }

        // Validate task_type if provided
        const validTypes = ['visit', 'follow_up', 'immunization', 'nutrition', 'delivery', 'referral', 'supply'];
        if (sanitizedData.task_type && !validTypes.includes(sanitizedData.task_type)) {
            throw new Error('Invalid task_type');
        }

        // Validate priority if provided
        const validPriorities = ['low', 'medium', 'high', 'urgent'];
        if (sanitizedData.priority && !validPriorities.includes(sanitizedData.priority)) {
            throw new Error('Invalid priority');
        }

        return await Task.create({
            ...sanitizedData,
            chw_id: sanitizedData.chw_id || userId,
            assigned_date: new Date()
        });
    }

    async update(id, data, userId = null, userRole = null) {
        const task = await Task.findByPk(id);
        if (!task) return null;

        // Authorization: CHWs can only update their own tasks
        if (userRole === 'chw' && task.chw_id !== userId) {
            throw new Error('Not authorized to update this task');
        }

        // Prevent mass assignment
        const sanitizedData = this._sanitize(data, TaskService.ALLOWED_UPDATE_FIELDS);

        // Handle status changes
        if (sanitizedData.status) {
            if (sanitizedData.status === 'completed') {
                sanitizedData.completed_date = new Date();
            }
        }

        return await task.update(sanitizedData);
    }

    async getToday(userId, userRole) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const where = {};

        if (userRole === 'chw') {
            where.chw_id = userId;
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

        return {
            date: today.toISOString().split('T')[0],
            tasks
        };
    }

    async getOverdue(userId, userRole) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const where = {};

        if (userRole === 'chw') {
            where.chw_id = userId;
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

        return {
            count: tasks.length,
            tasks
        };
    }

    async getSummary(userId, userRole) {
        const where = {};

        if (userRole === 'chw') {
            where.chw_id = userId;
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

        return {
            total,
            pending,
            completed,
            overdue,
            completion_rate: total > 0 ? ((completed / total) * 100).toFixed(2) : 0
        };
    }
}

module.exports = new TaskService();