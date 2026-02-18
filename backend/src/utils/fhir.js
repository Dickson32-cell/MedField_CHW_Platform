/**
 * FHIR Utility
 * Maps MedField models to HL7 FHIR R4 resources
 */

class FHIRMapper {
    /**
     * Map local Patient model to FHIR Patient resource
     * @param {Object} patient MedField patient record
     * @returns {Object} FHIR Patient resource
     */
    toFHIRPatient(patient) {
        return {
            resourceType: 'Patient',
            id: patient.patient_id || patient.id,
            identifier: [
                {
                    use: 'official',
                    system: 'http://medfield.org/patients',
                    value: patient.patient_id
                }
            ],
            name: [
                {
                    family: patient.last_name,
                    given: [patient.first_name]
                }
            ],
            gender: patient.gender,
            birthDate: patient.date_of_birth,
            telecom: patient.phone ? [
                {
                    system: 'phone',
                    value: patient.phone,
                    use: 'mobile'
                }
            ] : [],
            extension: [
                {
                    url: 'http://medfield.org/fhir/StructureDefinition/risk-score',
                    valueInteger: patient.risk_score
                },
                {
                    url: 'http://medfield.org/fhir/StructureDefinition/is-pregnant',
                    valueBoolean: patient.is_pregnant
                }
            ]
        };
    }

    /**
     * Map local Visit model to FHIR Observation resources
     * @param {Object} visit MedField visit record
     * @returns {Array} List of FHIR Observation resources
     */
    toFHIRObservations(visit) {
        const observations = [];

        if (visit.temperature) {
            observations.push({
                resourceType: 'Observation',
                status: 'final',
                code: {
                    coding: [{ system: 'http://loinc.org', code: '8310-5', display: 'Body temperature' }]
                },
                subject: { reference: `Patient/${visit.patient_id}` },
                effectiveDateTime: visit.visit_date,
                valueQuantity: {
                    value: visit.temperature,
                    unit: 'C',
                    system: 'http://unitsofmeasure.org',
                    code: 'Cel'
                }
            });
        }

        // Add more mappings for weight, symptoms, etc.

        return observations;
    }
}

module.exports = new FHIRMapper();
