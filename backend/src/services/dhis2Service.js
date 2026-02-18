/**
 * DHIS2 Integration Service
 * Provides integration with DHIS2 (Health Information System used in 80+ countries)
 *
 * Supports:
 * - Data element mapping
 * - Aggregate data reporting
 * - Event capture
 * - Tracker data sync
 */

const axios = require('axios');

class DHIS2Service {
  constructor() {
    this.baseUrl = process.env.DHIS2_URL || 'https://dhis2.example.org';
    this.username = process.env.DHIS2_USER || 'admin';
    this.password = process.env.DHIS2_PASSWORD || 'district';
    this.api = null;
  }

  /**
   * Initialize DHIS2 API client
   */
  initialize() {
    this.api = axios.create({
      baseURL: `${this.baseUrl}/api`,
      auth: {
        username: this.username,
        password: this.password
      },
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  /**
   * Test connection to DHIS2
   */
  async testConnection() {
    try {
      const response = await this.api.get('/system/info');
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Map MedField data to DHIS2 data elements
   */
  mapToDHIS2Data(medfieldData) {
    const dataValues = [];

    // Map visits to DHIS2 data elements
    if (medfieldData.visits) {
      dataValues.push(
        { dataElement: 'CHW_VISITS_TOTAL', value: medfieldData.visits.total },
        { dataElement: 'CHW_VISITS_COMPLETED', value: medfieldData.visits.completed },
        { dataElement: 'CHW_VISITS_MISSED', value: medfieldData.visits.missed }
      );
    }

    // Map patients to DHIS2
    if (medfieldData.patients) {
      dataValues.push(
        { dataElement: 'CHW_PATIENTS_TOTAL', value: medfieldData.patients.total },
        { dataElement: 'CHW_PATIENTS_PREGNANT', value: medfieldData.patients.pregnant },
        { dataElement: 'CHW_PATIENTS_UNDER5', value: medfieldData.patients.under5 }
      );
    }

    // Map referrals to DHIS2
    if (medfieldData.referrals) {
      dataValues.push(
        { dataElement: 'CHW_REFERRALS_TOTAL', value: medfieldData.referrals.total },
        { dataElement: 'CHW_REFERRALS_COMPLETED', value: medfieldData.referrals.completed }
      );
    }

    return dataValues;
  }

  /**
   * Send aggregate data to DHIS2
   * @param {string} dataSetId - DHIS2 dataset ID
   * @param {string} orgUnitId - Organization unit ID
   * @param {object} data - Data to send
   * @param {string} period - Period (e.g., '202601')
   */
  async sendAggregateData(dataSetId, orgUnitId, data, period) {
    try {
      const payload = {
        dataSet: dataSetId,
        orgUnit: orgUnitId,
        period: period,
        dataValues: this.mapToDHIS2Data(data)
      };

      const response = await this.api.post('/dataValueSets', payload);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data || error.message };
    }
  }

  /**
   * Create DHIS2 event for patient visit
   */
  async createEvent(patientData, visitData) {
    try {
      const event = {
        program: 'CHW_PROGRAM', // DHIS2 program ID
        orgUnit: patientData.catchmentArea || 'DEFAULT_ORG',
        eventDate: visitData.visit_date,
        status: 'COMPLETED',
        dataValues: [
          { dataElement: 'PATIENT_ID', value: patientData.patient_id },
          { dataElement: 'VISIT_TYPE', value: visitData.visit_type },
          { dataElement: 'SYMPTOMS', value: visitData.symptoms?.join(', ') || '' },
          { dataElement: 'DIAGNOSIS', value: visitData.diagnosis?.join(', ') || '' },
          { dataElement: 'TREATMENT', value: JSON.stringify(visitData.treatment) },
          { dataElement: 'DANGER_SIGNS', value: visitData.danger_signs?.join(', ') || '' }
        ]
      };

      const response = await this.api.post('/events', event);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data || error.message };
    }
  }

  /**
   * Get tracked entities from DHIS2
   */
  async getTrackedEntities(programId, orgUnitId) {
    try {
      const response = await this.api.get('/trackedEntityInstances', {
        params: {
          program: programId,
          orgUnit: orgUnitId,
          fields: '*'
        }
      });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data || error.message };
    }
  }

  /**
   * Get organization units from DHIS2
   */
  async getOrganizationUnits() {
    try {
      const response = await this.api.get('/organisationUnits', {
        params: {
          fields: 'id,name,level,parent'
        }
      });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data || error.message };
    }
  }

  /**
   * Get data elements from DHIS2
   */
  async getDataElements() {
    try {
      const response = await this.api.get('/dataElements', {
        params: {
          fields: 'id,name,code,categoryCombo'
        }
      });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data || error.message };
    }
  }

  /**
   * Sync MedField patients to DHIS2 tracked entities
   */
  async syncPatientsToDHIS2(patients) {
    const results = [];

    for (const patient of patients) {
      try {
        const trackedEntity = {
          trackedEntityType: 'CHW_PERSON',
          orgUnit: patient.catchmentArea || 'DEFAULT_ORG',
          attributes: [
            { attribute: 'PERSON_NAME', value: `${patient.first_name} ${patient.last_name}` },
            { attribute: 'PERSON_DOB', value: patient.date_of_birth },
            { attribute: 'PERSON_GENDER', value: patient.gender },
            { attribute: 'MEDFIELD_ID', value: patient.patient_id }
          ]
        };

        const response = await this.api.post('/trackedEntityInstances', trackedEntity);
        results.push({ patient_id: patient.patient_id, success: true, dhis2_id: response.data.reference });
      } catch (error) {
        results.push({ patient_id: patient.patient_id, success: false, error: error.message });
      }
    }

    return results;
  }
}

module.exports = new DHIS2Service();
