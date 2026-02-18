const request = require('supertest');
const { app } = require('../../src/index');
const { User, Patient, sequelize } = require('../../src/models');
const jwt = require('jsonwebtoken');

describe('Patients Integration Tests', () => {
    let token, chw;

    beforeEach(async () => {
        await sequelize.sync({ force: true });
        chw = await User.create({
            username: 'chw_test',
            password: 'password123',
            role: 'chw'
        });
        token = jwt.sign({ userId: chw.id }, process.env.JWT_SECRET || 'testsecret');
    });

    it('should list patients for the CHW', async () => {
        await Patient.create({ first_name: 'John', last_name: 'Doe', chw_id: chw.id });

        const res = await request(app)
            .get('/api/patients')
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.patients.length).toBe(1);
    });

    it('should create a new patient', async () => {
        const res = await request(app)
            .post('/api/patients')
            .set('Authorization', `Bearer ${token}`)
            .send({
                first_name: 'Jane',
                last_name: 'Smith',
                gender: 'female',
                date_of_birth: '1995-05-15'
            });

        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.data.first_name).toBe('Jane');
    });

    it('should get patient details', async () => {
        const patient = await Patient.create({ first_name: 'Bob', last_name: 'Detail', chw_id: chw.id });

        const res = await request(app)
            .get(`/api/patients/${patient.id}`)
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.first_name).toBe('Bob');
    });

    it('should update a patient', async () => {
        const patient = await Patient.create({ first_name: 'Old', last_name: 'Name', chw_id: chw.id });

        const res = await request(app)
            .put(`/api/patients/${patient.id}`)
            .set('Authorization', `Bearer ${token}`)
            .send({ first_name: 'Updated' });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.first_name).toBe('Updated');
    });

    it('should deny access to patients if not authenticated', async () => {
        const res = await request(app).get('/api/patients');
        expect(res.status).toBe(401);
    });
});
