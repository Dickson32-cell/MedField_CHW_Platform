const { Referral, Patient, User, Visit } = require('../../src/models');

describe('Referral Model', () => {
    let chw, patient, visit;

    beforeEach(async () => {
        chw = await User.create({ username: 'chw', password: 'p', role: 'chw' });
        patient = await Patient.create({ first_name: 'P', last_name: '1', chw_id: chw.id });
        visit = await Visit.create({ patient_id: patient.id, chw_id: chw.id });
    });

    it('should create a referral with valid data', async () => {
        const referral = await Referral.create({
            patient_id: patient.id,
            chw_id: chw.id,
            visit_id: visit.id,
            reason: 'Pneumonia danger signs',
            facility_name: 'General Hospital',
            urgency: 'high'
        });
        expect(referral.urgency).toBe('high');
        expect(referral.status).toBe('pending');
    });

    it('should default status to pending', async () => {
        const referral = await Referral.create({ patient_id: patient.id, chw_id: chw.id });
        expect(referral.status).toBe('pending');
    });

    it('should associate with a patient', async () => {
        const referral = await Referral.create({ patient_id: patient.id, chw_id: chw.id });
        const found = await Referral.findByPk(referral.id, { include: 'patient' });
        expect(found.patient.id).toBe(patient.id);
    });

    it('should associate with a visit', async () => {
        const referral = await Referral.create({ patient_id: patient.id, chw_id: chw.id, visit_id: visit.id });
        const found = await Referral.findByPk(referral.id, { include: 'visit' });
        expect(found.visit.id).toBe(visit.id);
    });

    it('should default urgency to medium', async () => {
        const referral = await Referral.create({ patient_id: patient.id, chw_id: chw.id });
        expect(referral.urgency).toBe('medium');
    });
});
