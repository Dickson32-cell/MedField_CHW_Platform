const PatientService = require('../../src/services/PatientService');

// Mock the Patient model
jest.mock('../../src/models', () => ({
  Patient: {
    findAndCountAll: jest.fn(),
    findByPk: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    count: jest.fn()
  },
  Household: {
    findByPk: jest.fn()
  },
  User: {
    findByPk: jest.fn()
  }
}));

const { Patient, Household, User } = require('../../src/models');

describe('PatientService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('ALLOWED_CREATE_FIELDS', () => {
    it('should have whitelist of allowed fields', () => {
      const allowedFields = PatientService.ALLOWED_CREATE_FIELDS;
      
      expect(allowedFields).toBeInstanceOf(Array);
      expect(allowedFields).toContain('first_name');
      expect(allowedFields).toContain('last_name');
      expect(allowedFields).toContain('date_of_birth');
      expect(allowedFields).toContain('gender');
      // Should NOT contain sensitive fields
      expect(allowedFields).not.toContain('chw_id');
      expect(allowedFields).not.toContain('risk_score');
    });
  });

  describe('ALLOWED_UPDATE_FIELDS', () => {
    it('should have whitelist of allowed fields for update', () => {
      const allowedFields = PatientService.ALLOWED_UPDATE_FIELDS;
      
      expect(allowedFields).toBeInstanceOf(Array);
      // CHWs should not be able to assign themselves to patients
      expect(allowedFields).not.toContain('chw_id');
    });
  });

  describe('_sanitize', () => {
    it('should filter input to only allowed fields', () => {
      const input = {
        first_name: 'John',
        last_name: 'Doe',
        // Attempted mass assignment
        chw_id: ' attacker-injected',
        risk_score: 100,
        is_active: false
      };
      
      const allowed = ['first_name', 'last_name'];
      const sanitized = PatientService._sanitize(input, allowed);
      
      expect(sanitized).toEqual({ first_name: 'John', last_name: 'Doe' });
      expect(sanitized.chw_id).toBeUndefined();
      expect(sanitized.risk_score).toBeUndefined();
    });

    it('should ignore fields not in input', () => {
      const input = { first_name: 'John' };
      const allowed = ['first_name', 'last_name'];
      
      const sanitized = PatientService._sanitize(input, allowed);
      
      expect(sanitized).toEqual({ first_name: 'John' });
    });
  });

  describe('create', () => {
    it('should reject invalid gender values', async () => {
      const input = {
        first_name: 'John',
        last_name: 'Doe',
        date_of_birth: '1990-01-01',
        gender: 'invalid_gender'
      };

      await expect(PatientService.create(input))
        .rejects.toThrow('Invalid gender');
    });

    it('should reject missing required fields', async () => {
      const input = {
        first_name: 'John'
        // missing date_of_birth, gender
      };

      await expect(PatientService.create(input))
        .rejects.toThrow('Missing required fields');
    });
  });

  describe('update with authorization', () => {
    it('should prevent CHW from updating other CHW patients', async () => {
      const mockPatient = {
        id: 'patient-1',
        chw_id: 'chw-1',
        update: jest.fn().mockResolvedValue(true)
      };
      
      Patient.findByPk.mockResolvedValue(mockPatient);

      // User is CHW but patient belongs to different CHW
      await expect(PatientService.update('patient-1', { phone: '+123' }, 'chw-2', 'chw'))
        .rejects.toThrow('Not authorized');

      expect(mockPatient.update).not.toHaveBeenCalled();
    });

    it('should allow supervisor to update any patient', async () => {
      const mockPatient = {
        id: 'patient-1',
        chw_id: 'chw-1',
        update: jest.fn().mockResolvedValue(true)
      };
      
      Patient.findByPk.mockResolvedValue(mockPatient);

      // Supervisor updates any patient
      const result = await PatientService.update('patient-1', { phone: '+123' }, 'supervisor-1', 'supervisor');

      expect(mockPatient.update).toHaveBeenCalled();
    });
  });
});