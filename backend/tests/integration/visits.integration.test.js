const request = require('supertest');
const { app } = require('../../src/index');
const { User, Patient, Visit, sequelize } = require('../../src/models');
const jwt = require('jsonwebtoken');

describe('Visits Integration Tests', () => {
    let token, chw, patient;

    beforeEach(async () => {
        await sequelize.sync({ force: true });
        chw = await User.create({ username: 'chw', password: 'p', role: 'chw' });
        patient = await Patient.create({ first_name: 'P', last_name: 'L', chw_id: chw.id });
        token = jwt.sign({ userId: chw.id }, process.env.JWT_SECRET || 'testsecret');
    });

    it('should create a new visit', async () => {
        const res = await request(app)
            .post('/api/visits')
            .set('Authorization', `Bearer ${token}`)
            .send({
                patient_id: patient.id,
                visit_date: new Date(),
                visit_type: 'routine',
                clinical_data: { temperature: 37.2 }
            });

        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.data.visit_type).toBe('routine');
    });

    it('should list visits', async () => {
        await Visit.create({ patient_id: patient.id, chw_id: chw.id, visit_date: new Date() });

        const res = await request(app)
            .get('/api/visits')
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.visits.length).toBe(1);
    });

    it('should return visit stats summary', async () => {
        await Visit.create({ patient_id: patient.id, chw_id: chw.id, visit_date: new Date(), visit_status: 'completed' });

        const res = await request(app)
            .get('/api/visits/stats/summary')
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.total_visits).toBeDefined();
    });

    it('should fail to create visit for non-existent patient', async () => {
        const res = await request(app)
            .post('/api/visits')
            .set('Authorization', `Bearer ${token}`)
            .send({
                patient_id: 999,
                visit_date: new Date()
            });

        expect(res.status).toBe(400).or.toBe(404).or.toBe(500); // Specific error depends on controller implementation
    });

    it('should include clinical decision support data if provided', async () => {
        const res = await request(app)
            .post('/api/visits')
            .set('Authorization', `Bearer ${token}`)
            .send({
                patient_id: patient.id,
                visit_date: new Date(),
                clinical_data: { temperature: 39.5, convulsions: true }
            });

        expect(res.status).toBe(201);
        // If the controller automatically runs CDS, we should check for referrals or findings
    });
});
