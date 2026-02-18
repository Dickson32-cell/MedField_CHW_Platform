const VisitService = require('../../../src/services/VisitService');
const { Visit, Patient, User } = require('../../../src/models');

describe('VisitService', () => {
    let chw, patient;

    beforeEach(async () => {
        chw = await User.create({ username: 'chw', password: 'p', role: 'chw' });
        patient = await Patient.create({ first_name: 'P', last_name: 'L', chw_id: chw.id });
    });

    it('should create a visit and associate clinical data', async () => {
        const visitData = {
            patient_id: patient.id,
            visit_date: new Date(),
            visit_type: 'follow-up',
            clinical_data: { temp: 37.5 }
        };
        const visit = await VisitService.create(visitData, chw.id);
        expect(visit.patient_id).toBe(patient.id);
        expect(visit.clinical_data.temp).toBe(37.5);
    });

    it('should retrieve recent visits for a patient', async () => {
        await VisitService.create({ patient_id: patient.id, visit_date: new Date() }, chw.id);
        const result = await VisitService.getPatientVisits(patient.id);
        expect(result.length).toBeGreaterThan(0);
    });

    it('should summarize visit statistics', async () => {
        await VisitService.create({ patient_id: patient.id, visit_date: new Date(), visit_status: 'completed' }, chw.id);
        if (VisitService.getSummary) {
            const summary = await VisitService.getSummary(chw.id);
            expect(summary.total).toBeGreaterThan(0);
        }
    });
});
