/**
 * API Routes for DHIS2 Integration
 */

const express = require('express');
const router = express.Router();
const dhis2Service = require('../services/dhis2Service');
const { auth, authorize } = require('../middleware/auth');

// POST /api/dhis2/test - Test DHIS2 connection
router.post('/test', auth, authorize('admin', 'district_officer'), async (req, res) => {
  try {
    const result = await dhis2Service.testConnection();
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/dhis2/sync - Sync data to DHIS2
router.post('/sync', auth, authorize('admin', 'district_officer'), async (req, res) => {
  try {
    const { dataSetId, orgUnitId, period, data } = req.body;

    if (!dataSetId || !orgUnitId || !period || !data) {
      return res.status(400).json({
        success: false,
        message: 'Missing required parameters: dataSetId, orgUnitId, period, data'
      });
    }

    const result = await dhis2Service.sendAggregateData(dataSetId, orgUnitId, data, period);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/dhis2/org-units - Get DHIS2 organization units
router.get('/org-units', auth, authorize('admin', 'district_officer'), async (req, res) => {
  try {
    const result = await dhis2Service.getOrganizationUnits();
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/dhis2/data-elements - Get DHIS2 data elements
router.get('/data-elements', auth, authorize('admin', 'district_officer'), async (req, res) => {
  try {
    const result = await dhis2Service.getDataElements();
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/dhis2/events - Create DHIS2 event
router.post('/events', auth, async (req, res) => {
  try {
    const { patientData, visitData } = req.body;

    const result = await dhis2Service.createEvent(patientData, visitData);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/dhis2/tracked-entities - Sync patients to DHIS2 tracked entities
router.post('/patients/sync', auth, authorize('admin', 'district_officer'), async (req, res) => {
  try {
    const { patients } = req.body;

    if (!patients || !Array.isArray(patients)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid patients array'
      });
    }

    const result = await dhis2Service.syncPatientsToDHIS2(patients);
    res.json({
      success: true,
      data: result,
      summary: {
        total: result.length,
        successful: result.filter(r => r.success).length,
        failed: result.filter(r => !r.success).length
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
