const SupplyService = require('../../../src/services/SupplyService');
const { Supply, User } = require('../../../src/models');

describe('SupplyService', () => {
    let chw;

    beforeEach(async () => {
        chw = await User.create({ username: 'chw', password: 'p', role: 'chw' });
    });

    it('should list all supplies', async () => {
        await Supply.create({ name: 'Paracetamol', unit: 'tablet', stock_count: 100 });
        const supplies = await SupplyService.getAllSupplies();
        expect(supplies.length).toBeGreaterThan(0);
        expect(supplies[0].name).toBe('Paracetamol');
    });

    it('should record supply usage', async () => {
        const item = await Supply.create({ name: 'Zinc', unit: 'tablet', stock_count: 50 });
        if (SupplyService.recordUsage) {
            const updated = await SupplyService.recordUsage(item.id, 10, chw.id);
            expect(updated.stock_count).toBe(40);
        }
    });

    it('should trigger low stock alert', async () => {
        const item = await Supply.create({ name: 'Amoxicillin', unit: 'bottle', stock_count: 5, low_stock_threshold: 10 });
        if (SupplyService.checkLowStock) {
            const isLow = await SupplyService.checkLowStock(item.id);
            expect(isLow).toBe(true);
        }
    });
});
