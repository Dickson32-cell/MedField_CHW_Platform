const express = require('express');
const FHIRMapper = require('../utils/fhir');
const PatientService = require('../services/PatientService');
const VisitService = require('../services/VisitService');
const { auth } = require('../middleware/auth');
const router = express.Router();

// GET /api/fhir/Patient/:id - Export patient in FHIR format
router.get('/Patient/:id', auth, async (req, res) => {
    try {
        const patient = await PatientService.getById(req.params.id);
        if (!patient) {
            return res.status(404).json({ success: false, message: 'Patient not found' });
        }
        const fhirPatient = FHIRMapper.toFHIRPatient(patient);
        res.json(fhirPatient);
    } catch (error) {
        console.error('FHIR export error:', error);
        res.status(500).json({ success: false, message: 'Server error during FHIR export' });
    }
});

module.exports = router;
