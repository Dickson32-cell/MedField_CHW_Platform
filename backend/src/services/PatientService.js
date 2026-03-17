const { Patient, Household, Visit, User } = require('../models');
const { Op } = require('sequelize');

class PatientService {
    async getAll(query, user) {
        const {
            page = 1,
            limit = 20,
            search,
            household_id,
            is_pregnant,
            risk_score_min,
            is_active = true,
            chw_id
        } = query;

        const where = {};
        const include = [
            {
                model: Household,
                as: 'household',
                attributes: ['id', 'household_number', 'head_of_household', 'community', 'village']
            }
        ];

        // Role-based filtering
        if (user.role === 'chw') {
            where.chw_id = user.id;
        } else if (chw_id) {
            where.chw_id = chw_id;
        }

        if (household_id) where.household_id = household_id;
        if (is_pregnant) where.is_pregnant = is_pregnant === 'true';
        if (risk_score_min) where.risk_score = { [Op.gte]: parseInt(risk_score_min) };
        if (is_active) where.is_active = is_active === 'true';

        if (search) {
            where[Op.or] = [
                { first_name: { [Op.iLike]: `%${search}%` } },
                { last_name: { [Op.iLike]: `%${search}%` } },
                { patient_id: { [Op.iLike]: `%${search}%` } }
            ];
        }

        const offset = (page - 1) * limit;
        const { count, rows } = await Patient.findAndCountAll({
            where,
            include,
            limit: parseInt(limit),
            offset,
            order: [['created_at', 'DESC']]
        });

        return {
            patients: rows,
            pagination: {
                total: count,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(count / limit)
            }
        };
    }

    async getById(id) {
        const patient = await Patient.findByPk(id, {
            include: [
                {
                    model: Household,
                    as: 'household',
                    attributes: ['id', 'household_number', 'head_of_household', 'address', 'community', 'village', 'location']
                },
                {
                    model: Visit,
                    as: 'visits',
                    limit: 10,
                    order: [['visit_date', 'DESC']],
                    include: [{ model: User, as: 'chw', attributes: ['id', 'first_name', 'last_name'] }]
                }
            ]
        });

        if (!patient) return null;
        return patient;
    }

    // Whitelist of allowed fields for create (prevents mass assignment)
    static get ALLOWED_CREATE_FIELDS() {
        return [
            'first_name', 'last_name', 'date_of_birth', 'gender', 'phone',
            'household_id', 'is_pregnant', 'due_date', 'location',
            'risk_factors', 'chronic_conditions', 'allergies', 'medications',
            'emergency_contact'
        ];
    }

    // Whitelist of allowed fields for update
    static get ALLOWED_UPDATE_FIELDS() {
        return [
            'first_name', 'last_name', 'phone', 'is_pregnant', 'due_date',
            'location', 'risk_factors', 'chronic_conditions', 'allergies',
            'medications', 'emergency_contact', 'is_active'
        ];
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

    async create(data, userId) {
        // Prevent mass assignment - only allow whitelisted fields
        const sanitizedData = this._sanitize(data, PatientService.ALLOWED_CREATE_FIELDS);

        // Validate required fields
        if (!sanitizedData.first_name || !sanitizedData.date_of_birth || !sanitizedData.gender) {
            throw new Error('Missing required fields: first_name, date_of_birth, gender');
        }

        // Validate gender
        if (!['male', 'female', 'other'].includes(sanitizedData.gender)) {
            throw new Error('Invalid gender value');
        }

        // Generate patient ID
        const count = await Patient.count() + 1;
        const patientId = `P${Date.now().toString().slice(-6)}${count.toString().padStart(4, '0')}`;

        const riskScore = this.calculateRiskScore(sanitizedData);

        return await Patient.create({
            ...sanitizedData,
            patient_id: patientId,
            chw_id: userId,
            risk_score: riskScore
        });
    }

    async update(id, data, userId = null, userRole = null) {
        const patient = await Patient.findByPk(id);
        if (!patient) return null;

        // Authorization: CHWs can only update their own patients
        if (userRole === 'chw' && patient.chw_id !== userId) {
            throw new Error('Not authorized to update this patient');
        }

        // Prevent mass assignment - only allow whitelisted fields
        const sanitizedData = this._sanitize(data, PatientService.ALLOWED_UPDATE_FIELDS);

        const riskScore = this.calculateRiskScore({ ...patient.toJSON(), ...sanitizedData });

        return await patient.update({
            ...sanitizedData,
            risk_score: riskScore
        });
    }

    calculateRiskScore(data) {
        let riskScore = 0;
        if (data.risk_factors && data.risk_factors.length > 0) riskScore += data.risk_factors.length;
        if (data.is_pregnant) riskScore += 2;
        if (data.chronic_conditions && data.chronic_conditions.length > 0) riskScore += data.chronic_conditions.length;
        return riskScore;
    }

    async getVisits(id, query) {
        const { page = 1, limit = 20 } = query;
        const offset = (page - 1) * limit;

        const { count, rows } = await Visit.findAndCountAll({
            where: { patient_id: id },
            include: [{ model: User, as: 'chw', attributes: ['id', 'first_name', 'last_name'] }],
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

    async getHighRisk(minScore = 5) {
        return await Patient.findAll({
            where: {
                risk_score: { [Op.gte]: parseInt(minScore) },
                is_active: true
            },
            include: [
                {
                    model: Household,
                    as: 'household',
                    attributes: ['id', 'household_number', 'community', 'village']
                }
            ],
            order: [['risk_score', 'DESC']],
            limit: 50
        });
    }
}

module.exports = new PatientService();
