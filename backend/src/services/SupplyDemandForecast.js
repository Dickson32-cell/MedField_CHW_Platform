/**
 * SupplyDemandForecast.js
 * Seasonal prediction of medicine and supply needs
 */

const db = require('../models');
const { Op, Sequelize } = require('sequelize');

class SupplyDemandForecast {
  constructor() {
    // Season definitions (months)
    this.seasons = {
      rainy: [6, 7, 8, 9],      // June-September: malaria, waterborne diseases
      dry: [10, 11, 12, 1, 2],   // October-February: respiratory infections
      hot: [3, 4, 5],           // March-May: heat-related illness
    };

    // Disease outbreak patterns by season
    this.seasonalDiseases = {
      rainy: ['malaria', 'typhoid', 'cholera', 'dengue', 'leptospirosis'],
      dry: ['influenza', 'pneumonia', 'meningitis', 'measles'],
      hot: ['heat_stroke', 'dehydration', 'skin_infections']
    };

    // Essential medicines mapping
    this.medicineRequirements = {
      malaria: ['artemether', 'chloroquine', 'paracetamol', 'ORS'],
      typhoid: ['ciprofloxacin', 'amoxicillin', 'paracetamol'],
      cholera: ['ORS', 'zinc', 'antibiotics'],
      influenza: ['paracetamol', 'vitamin_c', 'decongestants'],
      pneumonia: ['amoxicillin', 'erythromycin', 'paracetamol'],
      diabetes: ['insulin', 'metformin', 'glibenclamide'],
      hypertension: ['amlodipine', 'lisinopril', 'hydrochlorothiazide'],
      hiv: ['antiretroviral']
    };

    // Stock levels that trigger alerts
    this.alertThresholds = {
      critical: 0.15,  // 15% remaining
      low: 0.30,       // 30% remaining
      adequate: 0.50   // 50% remaining
    };
  }

  /**
   * Get current season
   */
  getCurrentSeason() {
    const month = new Date().getMonth() + 1;
    for (const [season, months] of Object.entries(this.seasons)) {
      if (months.includes(month)) return season;
    }
    return 'dry';
  }

  /**
   * Generate supply forecast for upcoming period
   */
  async generateForecast(facilityId, months = 3) {
    const currentSeason = this.getCurrentSeason();
    const seasonData = await this.getSeasonalHistory(facilityId, currentSeason);
    const diseaseTrends = await this.analyzeDiseaseTrends(facilityId);
    const populationData = await this.getPopulationData(facilityId);

    const forecast = {
      facilityId,
      generatedAt: new Date(),
      forecastPeriod: {
        start: new Date(),
        end: new Date(Date.now() + months * 30 * 24 * 60 * 60 * 1000),
        months
      },
      currentSeason,
      predictedNeeds: [],
      urgentOrders: [],
      seasonalRecommendations: [],
      stockAlerts: []
    };

    // Predict needs by category
    const categories = ['medications', 'supplies', 'equipment', 'consumables'];
    
    for (const category of categories) {
      const categoryForecast = await this.forecastCategory(
        category,
        diseaseTrends,
        seasonData,
        populationData
      );
      forecast.predictedNeeds.push(...categoryForecast);
    }

    // Identify urgent orders
    forecast.urgentOrders = await this.identifyUrgentOrders(forecast.predictedNeeds);

    // Generate seasonal recommendations
    forecast.seasonalRecommendations = this.getSeasonalRecommendations(currentSeason);

    // Check current stock levels
    forecast.stockAlerts = await this.checkStockLevels(facilityId);

    return forecast;
  }

  /**
   * Get seasonal history data
   */
  async getSeasonalHistory(facilityId, season) {
    const months = this.seasons[season];
    const currentYear = new Date().getFullYear();
    
    const visits = await db.Visit.findAll({
      where: {
        facilityId,
        status: 'completed',
        scheduledDate: {
          [Op.and]: [
            { [Op.gte]: new Date(currentYear, months[0] - 1, 1) },
            { [Op.lte]: new Date(currentYear, months[months.length - 1], 28) }
          ]
        }
      },
      include: [{ model: db.Encounter, as: 'encounter' }]
    });

    return {
      totalVisits: visits.length,
      diseaseBreakdown: this.countDiseases(visits),
      season
    };
  }

  /**
   * Analyze disease trends over time
   */
  async analyzeDiseaseTrends(facilityId) {
    const twelveMonthsAgo = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
    
    const encounters = await db.Encounter.findAll({
      where: {
        facilityId,
        createdAt: { [Op.gte]: twelveMonthsAgo }
      },
      attributes: [
        'diagnosis',
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'count'],
        [Sequelize.fn('DATE_FORMAT', Sequelize.col('createdAt'), '%Y-%m'), 'month']
      ],
      group: ['diagnosis', 'month']
    });

    return this.calculateTrends(encounters);
  }

  /**
   * Calculate disease trends from encounter data
   */
  calculateTrends(encounters) {
    const byDisease = {};

    encounters.forEach(e => {
      const disease = e.diagnosis;
      if (!byDisease[disease]) byDisease[disease] = [];
      byDisease[disease].push({ month: e.getDataValue('month'), count: parseInt(e.getDataValue('count')) });
    });

    // Calculate trend direction
    const trends = {};
    for (const [disease, monthlyData] of Object.entries(byDisease)) {
      if (monthlyData.length >= 3) {
        const counts = monthlyData.map(d => d.count);
        const trend = this.linearTrend(counts);
        trends[disease] = {
          direction: trend > 0.1 ? 'increasing' : trend < -0.1 ? 'decreasing' : 'stable',
          magnitude: Math.abs(trend),
          avgMonthly: Math.round(counts.reduce((a, b) => a + b, 0) / counts.length)
        };
      }
    }

    return trends;
  }

  /**
   * Simple linear trend calculation
   */
  linearTrend(values) {
    if (values.length < 2) return 0;
    const n = values.length;
    const xMean = (n - 1) / 2;
    const yMean = values.reduce((a, b) => a + b, 0) / n;
    
    let numerator = 0;
    let denominator = 0;
    values.forEach((y, x) => {
      numerator += (x - xMean) * (y - yMean);
      denominator += (x - xMean) ** 2;
    });

    if (denominator === 0) return 0;
    return numerator / denominator / yMean; // Normalized trend
  }

  /**
   * Get population data for a facility
   */
  async getPopulationData(facilityId) {
    const facility = await db.Facility.findByPk(facilityId);
    const patientCount = await db.Patient.count({
      where: { facilityId, status: 'active' }
    });

    return {
      catchmentPopulation: facility?.catchmentPopulation || 5000,
      registeredPatients: patientCount,
      households: Math.ceil(patientCount / 5),
      chwCount: await db.CommunityHealthWorker.count({ where: { facilityId } })
    };
  }

  /**
   * Forecast supplies for a category
   */
  async forecastCategory(category, diseaseTrends, seasonData, populationData) {
    const forecasts = [];
    const seasonalDiseases = this.seasonalDiseases[this.getCurrentSeason()];

    // Get base consumption rates
    const baseConsumption = await this.getBaseConsumption(category);
    
    // Calculate seasonal multipliers
    const seasonalMultiplier = this.getSeasonalMultiplier(seasonData.season);

    for (const disease of seasonalDiseases) {
      const medicines = this.medicineRequirements[disease] || [];
      
      for (const medicine of medicines) {
        const baseAmount = baseConsumption[medicine] || 100;
        const trend = diseaseTrends[disease] || { avgMonthly: baseAmount };
        
        // Apply multipliers
        const predicted = Math.round(
          baseAmount * 
          seasonalMultiplier * 
          (1 + (populationData.registeredPatients / 1000))
        );

        const daysOfStock = await this.calculateDaysOfStock(medicine);
        
        forecasts.push({
          item: medicine,
          category,
          associatedDisease: disease,
          currentMonthlyConsumption: trend.avgMonthly,
          predictedMonthlyNeed: predicted,
          recommendedStockLevel: Math.round(predicted * 1.5),
          daysOfStock,
          status: this.getItemStatus(daysOfStock, predicted),
          trend: diseaseTrends[disease]?.direction || 'stable'
        });
      }
    }

    return forecasts;
  }

  /**
   * Get base consumption rates for items
   */
  async getBaseConsumption(category) {
    const inventory = await db.Inventory.findAll({
      where: { category },
      attributes: ['itemName', 'monthlyConsumption']
    });

    const consumption = {};
    inventory.forEach(item => {
      consumption[item.itemName] = item.monthlyConsumption || 50;
    });

    return consumption;
  }

  /**
   * Get seasonal consumption multiplier
   */
  getSeasonalMultiplier(season) {
    const multipliers = {
      rainy: 1.8,   // Disease outbreak season
      dry: 1.3,     // Respiratory infections
      hot: 1.1      // Heat-related issues
    };
    return multipliers[season] || 1.0;
  }

  /**
   * Calculate days of stock remaining
   */
  async calculateDaysOfStock(itemName) {
    const item = await db.Inventory.findOne({
      where: { itemName }
    });

    if (!item || !item.quantity || item.monthlyConsumption === 0) {
      return 30; // Default assumption
    }

    const dailyConsumption = item.monthlyConsumption / 30;
    return Math.round(item.quantity / dailyConsumption);
  }

  /**
   * Get item status based on stock
   */
  getItemStatus(daysOfStock, monthlyNeed) {
    const dailyNeed = monthlyNeed / 30;
    if (daysOfStock < dailyNeed * 7) return 'CRITICAL';
    if (daysOfStock < dailyNeed * 14) return 'LOW';
    if (daysOfStock < dailyNeed * 30) return 'ADEQUATE';
    return 'SURPLUS';
  }

  /**
   * Identify items needing urgent orders
   */
  async identifyUrgentOrders(forecastItems) {
    const urgent = forecastItems.filter(
      item => item.status === 'CRITICAL' || item.status === 'LOW'
    );

    return urgent.map(item => ({
      ...item,
      recommendedOrderQuantity: this.calculateOrderQuantity(item),
      suggestedSupplier: this.getPreferredSupplier(item.category),
      estimatedCost: this.estimateCost(item)
    }));
  }

  /**
   * Calculate order quantity
   */
  calculateOrderQuantity(item) {
    const monthsOfStock = 3; // Target 3 months stock
    const needed = item.predictedMonthlyNeed * monthsOfStock;
    return Math.ceil(needed - (item.daysOfStock * (item.predictedMonthlyNeed / 30)));
  }

  /**
   * Get preferred supplier based on category
   */
  getPreferredSupplier(category) {
    const suppliers = {
      medications: 'National Medical Stores',
      supplies: 'Medical Supplies Ltd',
      equipment: 'Healthcare Equipment Co',
      consumables: 'General Supplies Inc'
    };
    return suppliers[category] || 'Default Supplier';
  }

  /**
   * Estimate cost of order
   */
  estimateCost(item) {
    // Simplified estimation - in reality would use actual prices
    const unitPrices = {
      artemether: 2.50,
      chloroquine: 1.50,
      paracetamol: 0.50,
      ORS: 1.00,
      amoxicillin: 3.00,
      amlodipine: 4.00,
      metformin: 3.50
    };
    return (unitPrices[item.item] || 2.00) * item.recommendedOrderQuantity;
  }

  /**
   * Get seasonal recommendations
   */
  getSeasonalRecommendations(season) {
    const recommendations = {
      rainy: [
        'Increase malaria prophylaxis stock levels',
        'Pre-position ORS and rehydration salts',
        'Stock additional antibiotics for waterborne diseases',
        'Ensure mosquito net distribution is up to date'
      ],
      dry: [
        'Increase respiratory medication stock',
        'Stock up on influenza treatments',
        'Prepare for meningitis season in northern regions',
        'Ensure cold chain integrity for vaccines'
      ],
      hot: [
        'Increase hydration supplement stock',
        'Pre-position heat stroke treatments',
        'Stock burn and skin infection medications',
        'Ensure cooling equipment is functional'
      ]
    };
    return recommendations[season] || [];
  }

  /**
   * Check current stock levels
   */
  async checkStockLevels(facilityId) {
    const inventory = await db.Inventory.findAll({
      where: { facilityId }
    });

    const alerts = [];

    for (const item of inventory) {
      const daysOfStock = item.monthlyConsumption > 0 
        ? item.quantity / (item.monthlyConsumption / 30)
        : 999;

      if (daysOfStock < 7) {
        alerts.push({
          item: item.itemName,
          currentQuantity: item.quantity,
          daysRemaining: Math.round(daysOfStock),
          status: 'CRITICAL',
          action: 'Order immediately'
        });
      } else if (daysOfStock < 14) {
        alerts.push({
          item: item.itemName,
          currentQuantity: item.quantity,
          daysRemaining: Math.round(daysOfStock),
          status: 'LOW',
          action: 'Order soon'
        });
      }
    }

    return alerts;
  }

  /**
   * Generate weekly report
   */
  async generateWeeklyReport(facilityId) {
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const consumption = await db.InventoryLog.findAll({
      where: {
        facilityId,
        createdAt: { [Op.gte]: weekAgo }
      },
      attributes: [
        'itemName',
        [Sequelize.fn('SUM', Sequelize.col('quantity_used')), 'used'],
        [Sequelize.fn('SUM', Sequelize.col('quantity_received')), 'received']
      ],
      group: ['itemName']
    });

    return {
      facilityId,
      period: { start: weekAgo, end: new Date() },
      consumption,
      summary: {
        totalItemsUsed: consumption.reduce((sum, c) => sum + parseInt(c.getDataValue('used') || 0), 0),
        totalItemsReceived: consumption.reduce((sum, c) => sum + parseInt(c.getDataValue('received') || 0), 0)
      }
    };
  }

  /**
   * Predict disease outbreak
   */
  async predictOutbreak(facilityId) {
    const trends = await this.analyzeDiseaseTrends(facilityId);
    const season = this.getCurrentSeason();
    const seasonDiseases = this.seasonalDiseases[season];

    const predictions = [];

    for (const disease of seasonDiseases) {
      const trend = trends[disease];
      if (trend && trend.direction === 'increasing' && trend.magnitude > 0.2) {
        predictions.push({
          disease,
          risk: trend.magnitude > 0.5 ? 'HIGH' : 'MODERATE',
          currentTrend: trend.direction,
          avgCasesPerMonth: trend.avgMonthly,
          recommendation: `Prepare for potential ${disease} outbreak`,
          suggestedStockIncrease: Math.round(trend.avgMonthly * 1.5)
        });
      }
    }

    return {
      facilityId,
      season,
      predictions,
      alertLevel: predictions.filter(p => p.risk === 'HIGH').length > 0 ? 'HIGH' : 'MODERATE'
    };
  }
}

module.exports = new SupplyDemandForecast();
