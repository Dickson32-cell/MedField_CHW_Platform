const { Task, Patient, User } = require('../../src/models');

describe('Task Model', () => {
    let chw, patient;

    beforeEach(async () => {
        chw = await User.create({ username: 'chw', password: 'p', role: 'chw' });
        patient = await Patient.create({ first_name: 'P', last_name: '1', chw_id: chw.id });
    });

    it('should create a task with valid data', async () => {
        const task = await Task.create({
            title: 'Follow-up',
            description: 'Check fever',
            due_date: new Date(),
            status: 'pending',
            chw_id: chw.id,
            patient_id: patient.id
        });
        expect(task.title).toBe('Follow-up');
        expect(task.status).toBe('pending');
    });

    it('should default status to pending', async () => {
        const task = await Task.create({ title: 'T', chw_id: chw.id });
        expect(task.status).toBe('pending');
    });

    it('should default priority to medium', async () => {
        const task = await Task.create({ title: 'T', chw_id: chw.id });
        expect(task.priority).toBe('medium');
    });

    it('should associate with a patient', async () => {
        const task = await Task.create({ title: 'T', chw_id: chw.id, patient_id: patient.id });
        const foundTask = await Task.findByPk(task.id, { include: 'patient' });
        expect(foundTask.patient.id).toBe(patient.id);
    });

    it('should associate with a CHW', async () => {
        const task = await Task.create({ title: 'T', chw_id: chw.id });
        const foundTask = await Task.findByPk(task.id, { include: 'chw' });
        expect(foundTask.chw.id).toBe(chw.id);
    });
});
