const { Citation, sequelize } = require('../models');
const { Op } = require('sequelize');

/**
 * Track citations and academic impact of MedField
 */
async function recordCitation(citation) {
  return Citation.create({
    citedBy: citation.citedBy,
    citationSource: citation.source,
    citationUrl: citation.url,
    paperTitle: citation.paperTitle,
    authors: citation.authors,
    publishedDate: citation.publishedDate,
    notes: citation.notes
  });
}

/**
 * Get total impact metrics
 */
async function getImpactMetrics() {
  const totalCitations = await Citation.count();
  const uniquePapers = await Citation.findAll({
    attributes: ['paperTitle', 'authors', 'publishedDate'],
    group: ['paperTitle']
  });

  // Simulated download count (in real implementation, would track from Zenodo API)
  const estimatedDownloads = totalCitations * 150; // Rough estimate

  return {
    citations: totalCitations,
    citingPapers: uniquePapers.length,
    estimatedDownloads,
    hIndex: calculateHIndex(await Citation.findAll({ order: [['createdAt', 'DESC']] }))
  };
}

/**
 * Calculate h-index (number of papers with at least h citations)
 */
function calculateHIndex(citations) {
  // Sort by citation count
  const sorted = citations.sort((a, b) => b.citationCount - a.citationCount);
  let h = 0;
  for (let i = 0; i < sorted.length; i++) {
    if (sorted[i].citationCount >= i + 1) {
      h = i + 1;
    } else {
      break;
    }
  }
  return h;
}

/**
 * Get citation trends over time
 */
async function getCitationTrends(months = 12) {
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - months);

  const citations = await Citation.findAll({
    where: {
      createdAt: { [Op.gte]: startDate }
    },
    attributes: [
      [sequelize.fn('DATE_TRUNC', 'month', sequelize.col('createdAt')), 'month'],
      [sequelize.fn('COUNT', sequelize.col('id')), 'count']
    ],
    group: [sequelize.fn('DATE_TRUNC', 'month', sequelize.col('createdAt'))],
    order: [[sequelize.fn('DATE_TRUNC', 'month', sequelize.col('createdAt')), 'ASC']]
  });

  return citations.map(c => ({
    month: c.get('month'),
    count: c.get('count')
  }));
}

/**
 * Generate impact report
 */
async function generateImpactReport() {
  const metrics = await getImpactMetrics();
  const trends = await getCitationTrends();
  const recentCitations = await Citation.findAll({
    limit: 10,
    order: [['createdAt', 'DESC']]
  });

  return {
    summary: metrics,
    trends,
    recentCitations,
    generatedAt: new Date(),
    reportVersion: '1.0'
  };
}

/**
 * Track institutional adoption
 */
async function recordAdoption(adoption) {
  const { Organization } = require('../models');
  return Organization.create({
    name: adoption.name,
    type: adoption.type, // hospital, clinic, NGO, research
    country: adoption.country,
    region: adoption.region,
    deploymentSize: adoption.deploymentSize,
    deploymentDate: adoption.deploymentDate,
    contactName: adoption.contactName,
    contactEmail: adoption.contactEmail
  });
}

/**
 * Get adoption metrics
 */
async function getAdoptionMetrics() {
  const { Organization } = require('../models');
  const total = await Organization.count();
  const byType = await Organization.findAll({
    attributes: ['type', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
    group: ['type']
  });
  const byCountry = await Organization.findAll({
    attributes: ['country', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
    group: ['country'],
    order: [[sequelize.fn('COUNT', sequelize.col('id')), 'DESC']],
    limit: 10
  });

  return {
    totalOrganizations: total,
    estimatedCHWs: total * 50, // Estimate 50 CHWs per organization
    byType,
    topCountries: byCountry
  };
}

module.exports = {
  recordCitation,
  getImpactMetrics,
  getCitationTrends,
  generateImpactReport,
  recordAdoption,
  getAdoptionMetrics
};
