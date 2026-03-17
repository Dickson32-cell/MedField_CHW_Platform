'use strict';

const bcrypt = require('bcryptjs');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const now = new Date();

    // Users (passwords: admin123, supervisor123, chw123)
    const users = [
      {
        id: '11111111-1111-1111-1111-111111111111',
        username: 'admin',
        password: await bcrypt.hash('admin123', 10),
        email: 'admin@medfield.org',
        first_name: 'System',
        last_name: 'Administrator',
        phone: '+255123456789',
        role: 'admin',
        is_active: true,
        is_approved: true,
        refresh_token: null,
        created_at: now,
        updated_at: now
      },
      {
        id: '22222222-2222-2222-2222-222222222222',
        username: 'supervisor',
        password: await bcrypt.hash('supervisor123', 10),
        email: 'supervisor@medfield.org',
        first_name: 'Jane',
        last_name: 'Smith',
        phone: '+255123456790',
        role: 'supervisor',
        is_active: true,
        is_approved: true,
        managed_by: '11111111-1111-1111-1111-111111111111',
        refresh_token: null,
        created_at: now,
        updated_at: now
      },
      {
        id: '33333333-3333-3333-3333-333333333333',
        username: 'chw001',
        password: await bcrypt.hash('chw123', 10),
        email: 'chw001@medfield.org',
        first_name: 'John',
        last_name: 'Doe',
        phone: '+255123456791',
        role: 'chw',
        is_active: true,
        is_approved: true,
        managed_by: '22222222-2222-2222-2222-222222222222',
        refresh_token: null,
        created_at: now,
        updated_at: now
      }
    ];

    await queryInterface.bulkInsert('users', users);

    // Households
    const households = [
      {
        id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        household_number: 'HH001',
        head_of_household: 'Mary Johnson',
        address: 'Village A, Street 12',
        community: 'Kibaha',
        village: 'Kibaha',
        location: { lat: -6.7735, lng: 38.9745 },
        created_by: '33333333-3333-3333-3333-333333333333',
        is_active: true,
        created_at: now,
        updated_at: now
      },
      {
        id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
        household_number: 'HH002',
        head_of_household: 'Peter Kahindi',
        address: 'Village B, Street 5',
        community: 'Kibaha',
        village: 'Kibaha',
        location: { lat: -6.7750, lng: 38.9760 },
        created_by: '33333333-3333-3333-3333-333333333333',
        is_active: true,
        created_at: now,
        updated_at: now
      }
    ];

    await queryInterface.bulkInsert('households', households);

    // Patients
    const patients = [
      {
        id: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
        patient_id: 'P000001',
        first_name: 'Alice',
        last_name: 'Johnson',
        date_of_birth: '2015-03-10',
        gender: 'female',
        phone: '+255123456792',
        household_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        chw_id: '33333333-3333-3333-3333-333333333333',
        risk_score: 0,
        risk_factors: [],
        is_pregnant: false,
        location: { lat: -6.7735, lng: 38.9745 },
        chronic_conditions: [],
        allergies: [],
        medications: [],
        emergency_contact: { name: 'Mary Johnson', phone: '+255123456789', relation: 'Mother' },
        is_active: true,
        created_at: now,
        updated_at: now
      },
      {
        id: 'dddddddd-dddd-dddd-dddd-dddddddddddd',
        patient_id: 'P000002',
        first_name: 'Robert',
        last_name: 'Kahindi',
        date_of_birth: '1985-07-22',
        gender: 'male',
        phone: '+255123456793',
        household_id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
        chw_id: '33333333-3333-3333-3333-333333333333',
        risk_score: 2,
        risk_factors: ['hypertension'],
        is_pregnant: false,
        location: { lat: -6.7750, lng: 38.9760 },
        chronic_conditions: ['hypertension'],
        allergies: ['penicillin'],
        medications: [],
        emergency_contact: { name: 'Mary Kahindi', phone: '+255123456794', relation: 'Wife' },
        is_active: true,
        created_at: now,
        updated_at: now
      }
    ];

    await queryInterface.bulkInsert('patients', patients);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('patients', null, {});
    await queryInterface.bulkDelete('households', null, {});
    await queryInterface.bulkDelete('users', null, {});
  }
};