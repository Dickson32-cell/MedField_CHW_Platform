const request = require('supertest');
const { app } = require('../../src/index');
const { User, Patient, Referral, sequelize } = require('../../src/models');
const jwt = require('jsonwebtoken');

describe('Referrals Integration Tests', () => {
    let token, chw, patient;

    beforeEach(async () => {
        await sequelize.sync({ force: true });
        chw = await User.create({ username: 'chw', password: 'p', role: 'chw' });
        patient = await Patient.create({ first_name: 'P', last_name: 'L', chw_id: chw.id });
        token = jwt.sign({ userId: chw.id }, process.env.JWT_SECRET || 'testsecret');
    });

    it('should list referrals', async () => {
        await Referral.create({ patient_id: patient.id, chw_id: chw.id, reason: 'Test' });

        const res = await request(app)
            .get('/api/referrals')
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.length).toBe(1);
    });

    it('should create a referral', async () => {
        const res = await request(app)
            .post('/api/referrals')
            .set('Authorization', `Bearer ${token}`)
            .send({
                patient_id: patient.id,
                reason: 'Severe illness',
                facility_name: 'St. Mary\'s',
                urgency: 'high'
            });

        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.data.urgency).toBe('high');
    });

    it('should update referral status', async () => {
        const referral = await Referral.create({ patient_id: patient.id, chw_id: chw.id, reason: 'Test' });

        const res = await request(app)
            .put(`/api/referrals/${referral.id}`)
            .set('Authorization', `Bearer ${token}`)
            .send({ status: 'completed' });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.status).toBe('completed');
    });
});
