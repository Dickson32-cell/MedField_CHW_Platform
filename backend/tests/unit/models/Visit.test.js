const { Visit, Patient, User } = require('../../src/models');

describe('Visit Model', () => {
    let chw, patient;

    beforeEach(async () => {
        chw = await User.create({ username: 'chw', password: 'p', role: 'chw' });
        patient = await Patient.create({ first_name: 'P', last_name: '1', chw_id: chw.id });
    });

    it('should create a visit with valid data', async () => {
        const visit = await Visit.create({
            patient_id: patient.id,
            chw_id: chw.id,
            visit_date: new Date(),
            visit_type: 'routine',
            visit_status: 'completed'
        });
        expect(visit.patient_id).toBe(patient.id);
        expect(visit.visit_type).toBe('routine');
    });

    it('should store clinical data in JSON fields', async () => {
        const clinicalData = { temp: 38.5, cough: true, danger_signs: ['none'] };
        const visit = await Visit.create({
            patient_id: patient.id,
            chw_id: chw.id,
            visit_date: new Date(),
            clinical_data: clinicalData
        });
        expect(visit.clinical_data.temp).toBe(38.5);
    });

    it('should relate to a patient', async () => {
        const visit = await Visit.create({ patient_id: patient.id, chw_id: chw.id });
        const foundVisit = await Visit.findByPk(visit.id, { include: 'patient' });
        expect(foundVisit.patient.first_name).toBe('P');
    });

    it('should relate to a CHW', async () => {
        const visit = await Visit.create({ patient_id: patient.id, chw_id: chw.id });
        const foundVisit = await Visit.findByPk(visit.id, { include: 'chw' });
        expect(foundVisit.chw.username).toBe('chw');
    });

    it('should default visit_status to scheduled', async () => {
        const visit = await Visit.create({ patient_id: patient.id, chw_id: chw.id });
        expect(visit.visit_status).toBe('scheduled');
    });
});
