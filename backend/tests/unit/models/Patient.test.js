const { Patient, User, Household } = require('../../src/models');

describe('Patient Model', () => {
    let chw, household;

    beforeEach(async () => {
        chw = await User.create({ username: 'chw', password: 'p', role: 'chw' });
        household = await Household.create({
            household_number: 'HH001',
            created_by: chw.id
        });
    });

    it('should create a patient with valid data', async () => {
        const patientData = {
            first_name: 'John',
            last_name: 'Doe',
            date_of_birth: '2020-01-01',
            gender: 'male',
            household_id: household.id,
            chw_id: chw.id
        };
        const patient = await Patient.create(patientData);
        expect(patient.first_name).toBe(patientData.first_name);
        expect(patient.household_id).toBe(household.id);
    });

    it('should require first_name and last_name', async () => {
        await expect(Patient.create({ gender: 'male' })).rejects.toThrow();
    });

    it('should belong to a household', async () => {
        const patient = await Patient.create({
            first_name: 'Jane',
            last_name: 'Doe',
            household_id: household.id,
            chw_id: chw.id
        });
        const foundPatient = await Patient.findByPk(patient.id, { include: 'household' });
        expect(foundPatient.household.household_number).toBe('HH001');
    });

    it('should have a CHW assigned', async () => {
        const patient = await Patient.create({
            first_name: 'Baby',
            last_name: 'Doe',
            chw_id: chw.id
        });
        const foundPatient = await Patient.findByPk(patient.id, { include: 'chw' });
        expect(foundPatient.chw.username).toBe('chw');
    });

    it('should default is_active to true', async () => {
        const patient = await Patient.create({ first_name: 'A', last_name: 'B', chw_id: chw.id });
        expect(patient.is_active).toBe(true);
    });
});
