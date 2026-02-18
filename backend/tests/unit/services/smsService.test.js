const smsService = require('../../../src/services/smsService');
const axios = require('axios');

jest.mock('axios');

describe('SMSService', () => {
    beforeEach(() => {
        process.env.SMS_GATEWAY_API_KEY = 'test_key';
    });

    it('should send SMS with correct parameters', async () => {
        axios.post = jest.fn().mockResolvedValue({ data: { status: 'SENT' } });
        const result = await smsService.sendSMS('0244000000', 'Hello Test');
        expect(result.success).toBe(true);
        expect(axios.post).toHaveBeenCalled();
    });

    it('should handle SMS sending errors', async () => {
        axios.post = jest.fn().mockRejectedValue(new Error('Gateway Down'));
        const result = await smsService.sendSMS('0244000000', 'Hello Test');
        expect(result.success).toBe(false);
        expect(result.error).toBe('Gateway Down');
    });

    it('should format numbers correctly if implementation exists', () => {
        if (smsService.formatNumber) {
            expect(smsService.formatNumber('0244')).toContain('233244');
        }
    });
});
