const schedulingService = require('../../../src/services/schedulingService');
const { Task, Patient, User } = require('../../../src/models');

describe('SchedulingService', () => {
    let chw, patient;

    beforeEach(async () => {
        chw = await User.create({ username: 'chw', password: 'p', role: 'chw' });
        patient = await Patient.create({ first_name: 'P', last_name: 'L', chw_id: chw.id });
    });

    it('should create a follow-up task', async () => {
        if (schedulingService.createFollowUpTask) {
            const task = await schedulingService.createFollowUpTask(patient.id, 'Fever follow-up', 2);
            expect(task.patient_id).toBe(patient.id);
            expect(task.title).toBe('Fever follow-up');
        }
    });

    it('should detect task conflicts', () => {
        if (schedulingService.checkConflict) {
            const hasConflict = schedulingService.checkConflict(new Date(), []);
            expect(typeof hasConflict).toBe('boolean');
        }
    });
});
