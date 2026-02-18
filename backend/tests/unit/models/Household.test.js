const { Household, User } = require('../../src/models');

describe('Household Model', () => {
    let chw;

    beforeEach(async () => {
        chw = await User.create({ username: 'chw', password: 'p', role: 'chw' });
    });

    it('should create a household with valid data', async () => {
        const household = await Household.create({
            household_number: 'HH66',
            head_name: 'Papa',
            created_by: chw.id
        });
        expect(household.household_number).toBe('HH66');
    });

    it('should store coordinates', async () => {
        const household = await Household.create({
            household_number: 'HH67',
            location_lat: 5.6037,
            location_lng: -0.1870,
            created_by: chw.id
        });
        expect(household.location_lat).toBe(5.6037);
    });

    it('should default is_active to true', async () => {
        const household = await Household.create({ household_number: 'HH68', created_by: chw.id });
        expect(household.is_active).toBe(true);
    });

    it('should relate to the creator', async () => {
        const household = await Household.create({ household_number: 'HH69', created_by: chw.id });
        const found = await Household.findByPk(household.id, { include: 'createdBy' });
        expect(found.createdBy.username).toBe('chw');
    });

    it('should not allow duplicate household numbers', async () => {
        await Household.create({ household_number: 'DUP', created_by: chw.id });
        await expect(Household.create({ household_number: 'DUP', created_by: chw.id }))
            .rejects.toThrow();
    });
});
