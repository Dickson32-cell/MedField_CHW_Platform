/**
 * Database Seed Script
 * Run with: node src/db/seed.js
 */

const { sequelize, User, Patient, Household, Task } = require('../models');
const bcrypt = require('bcryptjs');

async function seed() {
  console.log('Starting database seeding...');

  try {
    // Connect to database
    await sequelize.authenticate();
    console.log('Database connected');

    // Sync models
    await sequelize.sync({ force: true });
    console.log('Tables created');

    // Create admin user
    const adminPassword = await bcrypt.hash('admin123', 10);
    const admin = await User.create({
      username: 'admin',
      email: 'admin@medfield.org',
      password: adminPassword,
      first_name: 'System',
      last_name: 'Administrator',
      phone: '+254700000000',
      role: 'admin'
    });
    console.log('Admin user created');

    // Create supervisor
    const supervisorPassword = await bcrypt.hash('supervisor123', 10);
    const supervisor = await User.create({
      username: 'supervisor',
      email: 'supervisor@medfield.org',
      password: supervisorPassword,
      first_name: 'Mary',
      last_name: 'Johnson',
      phone: '+254700000001',
      role: 'supervisor'
    });
    console.log('Supervisor created');

    // Create CHWs
    const chwPassword = await bcrypt.hash('password123', 10);
    const chw1 = await User.create({
      username: 'chw001',
      email: 'chw001@medfield.org',
      password: chwPassword,
      first_name: 'John',
      last_name: 'Doe',
      phone: '+254700000010',
      role: 'chw',
      location: { lat: 0.3476, lng: 32.5825 }
    });

    const chw2 = await User.create({
      username: 'chw002',
      email: 'chw002@medfield.org',
      password: chwPassword,
      first_name: 'Jane',
      last_name: 'Smith',
      phone: '+254700000011',
      role: 'chw',
      location: { lat: 0.3576, lng: 32.5925 }
    });

    const chw3 = await User.create({
      username: 'chw003',
      email: 'chw003@medfield.org',
      password: chwPassword,
      first_name: 'Peter',
      last_name: 'Ochieng',
      phone: '+254700000012',
      role: 'chw',
      location: { lat: 0.3376, lng: 32.5725 }
    });
    console.log('CHWs created');

    // Create households
    const households = await Promise.all([
      Household.create({
        household_number: 'HH001',
        head_of_household: 'Robert Otieno',
        address: 'Kampala Road',
        community: 'Kanyanya',
        village: 'Kanyanya A',
        ward: 'Kanyanya',
        catchment_area: 'Kanyanya Health Center',
        created_by: chw1.id,
        location: { lat: 0.3476, lng: 32.5825 }
      }),
      Household.create({
        household_number: 'HH002',
        head_of_household: 'Grace Akello',
        address: 'Market Street',
        community: 'Kanyanya',
        village: 'Kanyanya B',
        ward: 'Kanyanya',
        catchment_area: 'Kanyanya Health Center',
        created_by: chw1.id,
        location: { lat: 0.3490, lng: 32.5840 }
      }),
      Household.create({
        household_number: 'HH003',
        head_of_household: 'James Okoth',
        address: 'Church Road',
        community: 'Lungujja',
        village: 'Lungujja',
        ward: 'Lungujja',
        catchment_area: 'Lungujja Health Center',
        created_by: chw2.id,
        location: { lat: 0.3576, lng: 32.5925 }
      })
    ]);
    console.log('Households created');

    // Create patients
    const patients = await Promise.all([
      Patient.create({
        patient_id: 'P00001',
        first_name: 'Mary',
        last_name: 'Otieno',
        date_of_birth: '1990-05-15',
        gender: 'female',
        phone: '+254700000100',
        household_id: households[0].id,
        chw_id: chw1.id,
        is_pregnant: true,
        due_date: '2026-06-15',
        risk_score: 5,
        risk_factors: ['pregnant'],
        emergency_contact: { name: 'Robert Otieno', phone: '+254700000020' }
      }),
      Patient.create({
        patient_id: 'P00002',
        first_name: 'Sam',
        last_name: 'Otieno',
        date_of_birth: '2019-03-10',
        gender: 'male',
        phone: '',
        household_id: households[0].id,
        chw_id: chw1.id,
        risk_score: 3,
        risk_factors: ['under5'],
        chronic_conditions: []
      }),
      Patient.create({
        patient_id: 'P00003',
        first_name: 'Grace',
        last_name: 'Okoth',
        date_of_birth: '1985-08-20',
        gender: 'female',
        phone: '+254700000101',
        household_id: households[2].id,
        chw_id: chw2.id,
        risk_score: 2,
        chronic_conditions: ['diabetes'],
        is_pregnant: false
      }),
      Patient.create({
        patient_id: 'P00004',
        first_name: 'Paul',
        last_name: 'Okoth',
        date_of_birth: '2020-11-25',
        gender: 'male',
        household_id: households[2].id,
        chw_id: chw2.id,
        risk_score: 2,
        risk_factors: ['under5'],
        chronic_conditions: []
      }),
      Patient.create({
        patient_id: 'P00005',
        first_name: 'Sarah',
        last_name: 'Akello',
        date_of_birth: '1975-02-28',
        gender: 'female',
        phone: '+254700000102',
        household_id: households[1].id,
        chw_id: chw1.id,
        risk_score: 6,
        chronic_conditions: ['hypertension', 'diabetes'],
        is_pregnant: false
      })
    ]);
    console.log('Patients created');

    // Create tasks
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    await Promise.all([
      Task.create({
        patient_id: patients[0].id,
        household_id: households[0].id,
        chw_id: chw1.id,
        task_type: 'visit',
        title: 'ANC Visit - Mary Otieno',
        description: 'Follow-up visit for pregnant patient',
        due_date: today,
        priority: 'high',
        status: 'pending'
      }),
      Task.create({
        patient_id: patients[1].id,
        household_id: households[0].id,
        chw_id: chw1.id,
        task_type: 'immunization',
        title: 'Immunization - Sam Otieno',
        description: 'Vaccination due',
        due_date: today,
        priority: 'medium',
        status: 'pending'
      }),
      Task.create({
        patient_id: patients[4].id,
        household_id: households[1].id,
        chw_id: chw1.id,
        task_type: 'visit',
        title: 'Chronic Disease Follow-up - Sarah Akello',
        description: 'Diabetes and hypertension monitoring',
        due_date: tomorrow,
        priority: 'medium',
        status: 'pending'
      })
    ]);
    console.log('Tasks created');

    console.log('\n========================================');
    console.log('Database seeded successfully!');
    console.log('========================================');
    console.log('\nTest Accounts:');
    console.log('  Admin: admin / admin123');
    console.log('  Supervisor: supervisor / supervisor123');
    console.log('  CHW: chw001 / chw123');
    console.log('========================================\n');

    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
}

seed();
