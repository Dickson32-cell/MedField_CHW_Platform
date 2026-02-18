const { Visit, Patient, User, Task, Referral } = require('../models');
const { Op } = require('sequelize');

class VisitService {
    async getAll(query, user) {
        const {
            page = 1,
            limit = 20,
            patient_id,
            chw_id,
            visit_status,
            visit_type,
            start_date,
            end_date
        } = query;

        const where = {};

        // Role-based filtering
        if (user.role === 'chw') {
            where.chw_id = user.id;
        } else if (chw_id) {
            where.chw_id = chw_id;
        }

        if (patient_id) where.patient_id = patient_id;
        if (visit_status) where.visit_status = visit_status;
        if (visit_type) where.visit_type = visit_type;
        if (start_date || end_date) {
            where.visit_date = {};
            if (start_date) where.visit_date[Op.gte] = new Date(start_date);
            if (end_date) where.visit_date[Op.lte] = new Date(end_date);
        }

        const offset = (page - 1) * limit;
        const { count, rows } = await Visit.findAndCountAll({
            where,
            include: [
                { model: Patient, as: 'patient', attributes: ['id', 'patient_id', 'first_name', 'last_name'] },
                { model: User, as: 'chw', attributes: ['id', 'first_name', 'last_name'] }
            ],
            limit: parseInt(limit),
            offset,
            order: [['visit_date', 'DESC']]
        });

        return {
            visits: rows,
            pagination: {
                total: count,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(count / limit)
            }
        };
    }

    async getById(id) {
        const visit = await Visit.findByPk(id, {
            include: [
                { model: Patient, as: 'patient' },
                { model: User, as: 'chw' },
                { model: Referral, as: 'referral_record' }
            ]
        });
        return visit;
    }

    async create(data, userId) {
        // Generate visit number
        const count = await Visit.count() + 1;
        const visitNumber = `V${Date.now().toString().slice(-6)}${count.toString().padStart(4, '0')}`;

        const visit = await Visit.create({
            ...data,
            visit_number: visitNumber,
            chw_id: userId,
            visit_status: 'completed',
            synced: true,
            synced_at: new Date()
        });

        // Update patient's last visit date
        await Patient.update(
            { last_visit_date: new Date() },
            { where: { id: data.patient_id } }
        );

        // Create tasks based on visit outcome
        await this.createTasks(visit, userId);

        return visit;
    }

    async update(id, data) {
        const visit = await Visit.findByPk(id);
        if (!visit) return null;
        return await visit.update(data);
    }

    async createTasks(visit, chwId) {
        // Create task for next visit if scheduled
        if (visit.next_visit_date) {
            await Task.create({
                patient_id: visit.patient_id,
                chw_id: chwId,
                task_type: 'visit',
                title: `Follow-up visit for patient`,
                description: visit.notes,
                due_date: visit.next_visit_date,
                priority: 'medium',
                visit_id: visit.id
            });
        }

        // If danger signs detected, create urgent task
        if (visit.danger_signs_detected) {
            await Task.create({
                patient_id: visit.patient_id,
                chw_id: chwId,
                task_type: 'referral',
                title: 'URGENT: Danger signs detected',
                description: `Danger signs: ${visit.danger_signs.join(', ')}`,
                due_date: new Date(),
                priority: 'urgent'
            });
        }
    }

    async getSummary(query, user) {
        const { start_date, end_date, chw_id } = query;

        const where = {};
        const dateWhere = {};

        if (chw_id || user.role === 'chw') {
            where.chw_id = chw_id || user.id;
        }

        if (start_date || end_date) {
            if (start_date) dateWhere[Op.gte] = new Date(start_date);
            if (end_date) dateWhere[Op.lte] = new Date(end_date);
            where.visit_date = dateWhere;
        }

        const [
            totalVisits,
            completedVisits,
            missedVisits,
            emergencyVisits,
            referralsMade
        ] = await Promise.all([
            Visit.count({ where }),
            Visit.count({ where: { ...where, visit_status: 'completed' } }),
            Visit.count({ where: { ...where, visit_status: 'missed' } }),
            Visit.count({ where: { ...where, visit_type: 'emergency' } }),
            Referral.count({ where: { chw_id: where.chw_id || user.id } })
        ]);

        return {
            total: totalVisits,
            completed: completedVisits,
            missed: missedVisits,
            emergency: emergencyVisits,
            referrals: referralsMade,
            completion_rate: totalVisits > 0 ? ((completedVisits / totalVisits) * 100).toFixed(2) : 0
        };
    }
}

module.exports = new VisitService();
