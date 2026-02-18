const request = require('supertest');
const { app } = require('../../src/index');
const { User, Task, sequelize } = require('../../src/models');
const jwt = require('jsonwebtoken');

describe('Tasks Integration Tests', () => {
    let token, chw;

    beforeEach(async () => {
        await sequelize.sync({ force: true });
        chw = await User.create({ username: 'chw', password: 'p', role: 'chw' });
        token = jwt.sign({ userId: chw.id }, process.env.JWT_SECRET || 'testsecret');
    });

    it('should list today\'s tasks', async () => {
        await Task.create({ title: 'Today Task', due_date: new Date(), chw_id: chw.id });

        const res = await request(app)
            .get('/api/tasks/today')
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.some(t => t.title === 'Today Task')).toBe(true);
    });

    it('should update a task status', async () => {
        const task = await Task.create({ title: 'Pending', status: 'pending', chw_id: chw.id });

        const res = await request(app)
            .put(`/api/tasks/${task.id}`)
            .set('Authorization', `Bearer ${token}`)
            .send({ status: 'completed' });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.status).toBe('completed');
    });

    it('should filter tasks for the logged in CHW', async () => {
        const otherChw = await User.create({ username: 'other', password: 'p', role: 'chw' });
        await Task.create({ title: 'My Task', chw_id: chw.id });
        await Task.create({ title: 'Other Task', chw_id: otherChw.id });

        const res = await request(app)
            .get('/api/tasks')
            .set('Authorization', `Bearer ${token}`);

        expect(res.body.data.length).toBe(1);
        expect(res.body.data[0].title).toBe('My Task');
    });
});
