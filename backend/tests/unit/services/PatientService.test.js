const PatientService = require('../../../src/services/PatientService');
const { Patient, Household, User } = require('../../../src/models');

describe('PatientService', () => {
    let chw;

    beforeEach(async () => {
        chw = await User.create({ username: 'chw', password: 'p', role: 'chw' });
    });

    it('should create a patient with a generated ID and risk score', async () => {
        const data = {
            first_name: 'John',
            last_name: 'Doe',
            is_pregnant: true,
            risk_factors: ['fever', 'cough']
        };
        const patient = await PatientService.create(data, chw.id);
        expect(patient.patient_id).toMatch(/^P\d{6}\d{4}$/);
        expect(patient.risk_score).toBe(4); // 2 for pregnant + 2 for risk factors
    });

    it('should filter patients by role', async () => {
        await PatientService.create({ first_name: 'P1', last_name: 'L1' }, chw.id);
        const otherChw = await User.create({ username: 'other', password: 'p', role: 'chw' });
        await PatientService.create({ first_name: 'P2', last_name: 'L2' }, otherChw.id);

        const result = await PatientService.getAll({}, { id: chw.id, role: 'chw' });
        expect(result.patients.length).toBe(1);
        expect(result.patients[0].first_name).toBe('P1');
    });

    it('should return null if patient not found by ID', async () => {
        const patient = await PatientService.getById(999);
        expect(patient).toBeNull();
    });

    it('should update patient and recalculate risk score', async () => {
        const patient = await PatientService.create({ first_name: 'Old', last_name: 'Name' }, chw.id);
        const updated = await PatientService.update(patient.id, { first_name: 'New', is_pregnant: true });
        expect(updated.first_name).toBe('New');
        expect(updated.risk_score).toBe(2);
    });

    it('should find high risk patients', async () => {
        await PatientService.create({ first_name: 'Risk', last_name: 'High', is_pregnant: true, risk_factors: ['a', 'b', 'c'] }, chw.id); // score 5
        const highRisk = await PatientService.getHighRisk(5);
        expect(highRisk.length).toBe(1);
        expect(highRisk[0].first_name).toBe('Risk');
    });
});
