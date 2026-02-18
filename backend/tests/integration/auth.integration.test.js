const request = require('supertest');
const { app } = require('../../src/index');
const { User, sequelize } = require('../../src/models');
const bcrypt = require('bcryptjs');

describe('Auth Integration Tests', () => {
    beforeEach(async () => {
        await sequelize.sync({ force: true });
    });

    it('should register a new user', async () => {
        const res = await request(app)
            .post('/api/auth/register')
            .send({
                username: 'newuser',
                password: 'password123',
                role: 'chw',
                email: 'new@example.com',
                full_name: 'New CHW'
            });

        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.data.username).toBe('newuser');
    });

    it('should login an existing user', async () => {
        const hashedPassword = await bcrypt.hash('password123', 10);
        await User.create({
            username: 'loginuser',
            password: hashedPassword,
            role: 'chw',
            email: 'login@example.com'
        });

        const res = await request(app)
            .post('/api/auth/login')
            .send({
                username: 'loginuser',
                password: 'password123'
            });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.token).toBeDefined();
    });

    it('should fail login with wrong password', async () => {
        const hashedPassword = await bcrypt.hash('password123', 10);
        await User.create({
            username: 'wrongpass',
            password: hashedPassword,
            role: 'chw'
        });

        const res = await request(app)
            .post('/api/auth/login')
            .send({
                username: 'wrongpass',
                password: 'wrongpassword'
            });

        expect(res.status).toBe(401);
        expect(res.body.success).toBe(false);
    });

    it('should get current user info with valid token', async () => {
        const hashedPassword = await bcrypt.hash('password123', 10);
        const user = await User.create({
            username: 'me',
            password: hashedPassword,
            role: 'chw'
        });

        const loginRes = await request(app)
            .post('/api/auth/login')
            .send({ username: 'me', password: 'password123' });

        const token = loginRes.body.token;

        const res = await request(app)
            .get('/api/auth/me')
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.username).toBe('me');
    });

    it('should deny access to /me without token', async () => {
        const res = await request(app).get('/api/auth/me');
        expect(res.status).toBe(401);
    });
});
