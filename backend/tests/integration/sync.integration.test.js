const request = require('supertest');
const { app } = require('../../src/index');
const { User, sequelize } = require('../../src/models');
const jwt = require('jsonwebtoken');

describe('Sync Integration Tests', () => {
    let token, chw;

    beforeEach(async () => {
        await sequelize.sync({ force: true });
        chw = await User.create({ username: 'chw', password: 'p', role: 'chw' });
        token = jwt.sign({ userId: chw.id }, process.env.JWT_SECRET || 'testsecret');
    });

    it('should return sync status', async () => {
        const res = await request(app)
            .get('/api/sync/status')
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.last_sync).toBeDefined();
    });

    it('should accept a push of local data', async () => {
        const res = await request(app)
            .post('/api/sync/push')
            .set('Authorization', `Bearer ${token}`)
            .send({
                changes: [
                    { type: 'patient', action: 'create', data: { first_name: 'Sync', last_name: 'Patient' } }
                ]
            });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
    });

    it('should allow pulling server data', async () => {
        const res = await request(app)
            .post('/api/sync/pull')
            .set('Authorization', `Bearer ${token}`)
            .send({ last_sync_timestamp: new Date().toISOString() });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.changes).toBeDefined();
    });
});
