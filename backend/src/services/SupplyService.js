const { Supply, SupplyReport, Task } = require('../models');
const logger = require('../utils/logger');

class SupplyService {
    /**
     * Record a new supply report and check for low stock
     * @param {Object} data report details
     * @param {string} userId CHW ID
     */
    async recordReport(data, userId) {
        const report = await SupplyReport.create({
            ...data,
            chw_id: userId
        });

        // Check if any reported item is below threshold
        // Threshold is hardcoded to 10 for now, but could be dynamic
        if (data.quantity < 10) {
            await this.generateRestockTask(report, userId);
        }

        return report;
    }

    /**
     * Generate a task for the supervisor to restock
     */
    async generateRestockTask(report, chwId) {
        try {
            const supply = await Supply.findByPk(report.supply_id);

            await Task.create({
                title: `Restock Required: ${supply ? supply.name : 'Unknown Item'}`,
                description: `CHW reported low stock (${report.quantity}). Prompt restock needed to avoid service interruption.`,
                task_type: 'supply',
                priority: 'high',
                status: 'pending',
                chw_id: chwId, // Assigned back to CHW to track their request? or to Supervisor? 
                // In this system, tasks are usually for CHWs. But a supervisor dashboard shows all. 
                due_date: new Date(Date.now() + 24 * 60 * 60 * 1000) // 1 day due
            });

            logger.info(`Low stock task generated for CHW ${chwId} for supply ${report.supply_id}`);
        } catch (error) {
            logger.error('Failed to generate restock task:', error);
        }
    }

    async getAllSupplies() {
        return await Supply.findAll();
    }
}

module.exports = new SupplyService();
