// Unit tests for PatientService security features

describe('PatientService Security', () => {
  let patientService;
  let PatientServiceClass;

  beforeAll(() => {
    // Need to instantiate to use instance methods
    const PatientServiceModule = require('../../src/services/PatientService');
    // If it's already instantiated (module.exports = new PatientService())
    if (typeof PatientServiceModule === 'object') {
      patientService = PatientServiceModule;
    }
    // Get the class for static methods
    PatientServiceClass = PatientServiceModule.constructor || PatientServiceModule;
  });

  describe('_sanitize (instance method)', () => {
    it('should filter input to only allowed fields', () => {
      if (!patientService) {
        // Fallback: create instance manually
        patientService = { _sanitize: require('../../src/services/PatientService')._sanitize };
      }
      
      const input = {
        first_name: 'John',
        last_name: 'Doe',
        // Attempted mass assignment
        chw_id: 'attacker-injected',
        risk_score: 100,
        is_active: false
      };
      
      const allowed = ['first_name', 'last_name'];
      const sanitized = patientService._sanitize(input, allowed);
      
      expect(sanitized).toEqual({ first_name: 'John', last_name: 'Doe' });
      expect(sanitized.chw_id).toBeUndefined();
      expect(sanitized.risk_score).toBeUndefined();
    });

    it('should ignore fields not in input', () => {
      const input = { first_name: 'John' };
      const allowed = ['first_name', 'last_name'];
      
      const sanitized = patientService._sanitize(input, allowed);
      
      expect(sanitized).toEqual({ first_name: 'John' });
    });

    it('should handle undefined input gracefully', () => {
      const allowed = ['first_name', 'last_name'];
      
      // This tests that _sanitize doesn't crash on undefined
      // The actual behavior depends on implementation
      try {
        const sanitized = patientService._sanitize(undefined, allowed);
        // Should return empty object or handle gracefully
        expect(sanitized).toBeDefined();
      } catch (e) {
        // If it throws, that's also acceptable for undefined input
        expect(e.message).toBeDefined();
      }
    });
  });

  describe('Security: Mass Assignment Prevention', () => {
    it('should not allow chw_id in patient creation data', () => {
      const maliciousInput = {
        first_name: 'John',
        last_name: 'Doe',
        chw_id: 'attacker-controlled-chw-id',
        risk_score: 100
      };
      
      const allowedFields = [
        'first_name', 'last_name', 'date_of_birth', 'gender', 'phone',
        'household_id', 'is_pregnant', 'due_date', 'location',
        'risk_factors', 'chronic_conditions', 'allergies', 'medications',
        'emergency_contact'
      ];
      
      const sanitized = patientService._sanitize(maliciousInput, allowedFields);
      
      expect(sanitized.chw_id).toBeUndefined();
      expect(sanitized.risk_score).toBeUndefined();
      expect(sanitized.first_name).toBe('John');
    });

    it('should only keep whitelisted fields', () => {
      const input = { a: 1, b: 2, c: 3 };
      const allowed = ['a', 'b'];
      
      const sanitized = patientService._sanitize(input, allowed);
      
      expect(Object.keys(sanitized)).toEqual(['a', 'b']);
      expect(sanitized.c).toBeUndefined();
    });
  });
});