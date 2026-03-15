/**
 * Patient Model Tests
 * Tests database queries that benefit from indexes
 */

// Mock sequelize
const mockSequelize = {
  define: jest.fn((name, schema, options) => {
    return { name, ...schema, ...options };
  }),
  DataTypes: {
    UUID: 'UUID',
    STRING: 'STRING',
    DATEONLY: 'DATEONLY',
    ENUM: () => 'ENUM',
    BOOLEAN: 'BOOLEAN',
    INTEGER: 'INTEGER',
    JSONB: 'JSONB',
    TEXT: 'TEXT'
  }
};

jest.mock('../../src/config/database', () => mockSequelize);

const Patient = require('../../src/models/Patient');

describe('Patient Model', () => {
  test('should have required fields defined', () => {
    expect(Patient.fields).toHaveProperty('id');
    expect(Patient.fields).toHaveProperty('patient_id');
    expect(Patient.fields).toHaveProperty('first_name');
    expect(Patient.fields).toHaveProperty('date_of_birth');
    expect(Patient.fields).toHaveProperty('gender');
  });

  test('should have indexes defined for query optimization', () => {
    // Check that indexes are defined
    const indexFields = Patient.indexes?.map(idx => idx.fields).flat() || [];
    
    // These indexes should exist for optimal query performance
    expect(indexFields).toContain('patient_id');
    expect(indexFields).toContain('household_id');
    expect(indexFields).toContain('is_active');
    expect(indexFields).toContain('risk_score');
  });

  test('should have gender enum validation', () => {
    // Gender should be restricted to specific values
    expect(Patient.fields.gender.type).toBe('ENUM');
  });

  test('should support risk scoring', () => {
    expect(Patient.fields).toHaveProperty('risk_score');
    expect(Patient.fields.risk_score.defaultValue).toBe(0);
  });

  test('should have location support', () => {
    expect(Patient.fields).toHaveProperty('location');
    expect(Patient.fields.location.type).toBe('JSONB');
  });
});

describe('Patient Query Optimization', () => {
  test('indexes support common query patterns', () => {
    // Common queries from the codebase:
    // 1. Find patients by household: WHERE household_id = ?
    // 2. Find active patients: WHERE is_active = true
    // 3. Find high-risk patients: WHERE risk_score > ?
    // 4. Find patients by last visit: WHERE last_visit_date > ?
    
    const indexFields = Patient.indexes?.map(idx => idx.fields).flat() || [];
    
    expect(indexFields).toContain('household_id');    // Query by household
    expect(indexFields).toContain('is_active');        // Filter active patients
    expect(indexFields).toContain('risk_score');       // Sort/filter by risk
    expect(indexFields).toContain('last_visit_date');  // Find patients needing follow-up
  });
});