const dhis2Service = require('../../../src/services/dhis2Service');
const axios = require('axios');

jest.mock('axios');

describe('DHIS2Service', () => {
    beforeEach(() => {
        dhis2Service.initialize();
        axios.create.mockReturnValue(dhis2Service.api);
    });

    it('should initialize with correct config', () => {
        expect(dhis2Service.baseUrl).toBeDefined();
        expect(dhis2Service.api).toBeDefined();
    });

    it('should map MedField data to DHIS2 data elements', () => {
        const medfieldData = {
            visits: { total: 10, completed: 8, missed: 2 },
            patients: { total: 100, pregnant: 5, under5: 20 }
        };
        const mapped = dhis2Service.mapToDHIS2Data(medfieldData);
        expect(mapped).toContainEqual({ dataElement: 'CHW_VISITS_TOTAL', value: 10 });
        expect(mapped).toContainEqual({ dataElement: 'CHW_PATIENTS_PREGNANT', value: 5 });
    });

    it('should test connection successfully', async () => {
        dhis2Service.api.get = jest.fn().mockResolvedValue({ data: { version: '2.40' } });
        const result = await dhis2Service.testConnection();
        expect(result.success).toBe(true);
        expect(result.data.version).toBe('2.40');
    });

    it('should handle connection errors', async () => {
        dhis2Service.api.get = jest.fn().mockRejectedValue(new Error('Network Error'));
        const result = await dhis2Service.testConnection();
        expect(result.success).toBe(false);
        expect(result.error).toBe('Network Error');
    });

    it('should send aggregate data', async () => {
        dhis2Service.api.post = jest.fn().mockResolvedValue({ data: { status: 'SUCCESS' } });
        const result = await dhis2Service.sendAggregateData('ds1', 'ou1', { visits: { total: 5 } }, '202601');
        expect(result.success).toBe(true);
        expect(dhis2Service.api.post).toHaveBeenCalledWith('/dataValueSets', expect.objectContaining({
            dataSet: 'ds1',
            period: '202601'
        }));
    });
});
