'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Users table
    await queryInterface.createTable('users', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      username: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true
      },
      password: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      email: {
        type: Sequelize.STRING(100),
        unique: true
      },
      first_name: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      last_name: {
        type: Sequelize.STRING(100)
      },
      phone: {
        type: Sequelize.STRING(20)
      },
      role: {
        type: Sequelize.ENUM('chw', 'supervisor', 'district_officer', 'admin'),
        allowNull: false,
        defaultValue: 'chw'
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      is_approved: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      managed_by: {
        type: Sequelize.UUID,
        references: { model: 'users', key: 'id' }
      },
      refresh_token: {
        type: Sequelize.TEXT
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });

    // Households table
    await queryInterface.createTable('households', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      household_number: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true
      },
      head_of_household: {
        type: Sequelize.STRING(100)
      },
      address: {
        type: Sequelize.STRING(255)
      },
      community: {
        type: Sequelize.STRING(100)
      },
      village: {
        type: Sequelize.STRING(100)
      },
      location: {
        type: Sequelize.JSONB,
        defaultValue: { lat: null, lng: null }
      },
      created_by: {
        type: Sequelize.UUID,
        references: { model: 'users', key: 'id' }
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });

    // Patients table
    await queryInterface.createTable('patients', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      patient_id: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true
      },
      first_name: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      last_name: {
        type: Sequelize.STRING(100)
      },
      date_of_birth: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      gender: {
        type: Sequelize.ENUM('male', 'female', 'other'),
        allowNull: false
      },
      phone: {
        type: Sequelize.STRING(20)
      },
      household_id: {
        type: Sequelize.UUID,
        references: { model: 'households', key: 'id' }
      },
      chw_id: {
        type: Sequelize.UUID,
        references: { model: 'users', key: 'id' }
      },
      risk_score: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      risk_factors: {
        type: Sequelize.JSONB,
        defaultValue: []
      },
      is_pregnant: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      due_date: {
        type: Sequelize.DATEONLY
      },
      last_visit_date: {
        type: Sequelize.DATE
      },
      location: {
        type: Sequelize.JSONB,
        defaultValue: { lat: null, lng: null }
      },
      chronic_conditions: {
        type: Sequelize.JSONB,
        defaultValue: []
      },
      allergies: {
        type: Sequelize.JSONB,
        defaultValue: []
      },
      medications: {
        type: Sequelize.JSONB,
        defaultValue: []
      },
      emergency_contact: {
        type: Sequelize.JSONB,
        defaultValue: {}
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });

    // Visits table
    await queryInterface.createTable('visits', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      visit_number: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true
      },
      patient_id: {
        type: Sequelize.UUID,
        references: { model: 'patients', key: 'id' },
        allowNull: false
      },
      chw_id: {
        type: Sequelize.UUID,
        references: { model: 'users', key: 'id' },
        allowNull: false
      },
      visit_type: {
        type: Sequelize.ENUM('scheduled', 'follow_up', 'emergency', 'referral_follow', 'outreach'),
        defaultValue: 'scheduled'
      },
      visit_date: {
        type: Sequelize.DATE,
        allowNull: false
      },
      visit_status: {
        type: Sequelize.ENUM('planned', 'in_progress', 'completed', 'missed', 'cancelled'),
        defaultValue: 'planned'
      },
      location: {
        type: Sequelize.JSONB,
        defaultValue: { lat: null, lng: null }
      },
      gps_coordinates: {
        type: Sequelize.STRING(100)
      },
      vitals: {
        type: Sequelize.JSONB,
        defaultValue: {}
      },
      symptoms: {
        type: Sequelize.JSONB,
        defaultValue: []
      },
      diagnosis: {
        type: Sequelize.JSONB,
        defaultValue: []
      },
      treatment: {
        type: Sequelize.JSONB,
        defaultValue: {}
      },
      referral: {
        type: Sequelize.JSONB,
        defaultValue: {}
      },
      notes: {
        type: Sequelize.TEXT
      },
      next_visit_date: {
        type: Sequelize.DATEONLY
      },
      danger_signs_detected: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      danger_signs: {
        type: Sequelize.JSONB,
        defaultValue: []
      },
      duration_minutes: {
        type: Sequelize.INTEGER
      },
      synced: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      synced_at: {
        type: Sequelize.DATE
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });

    // Tasks table
    await queryInterface.createTable('tasks', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      patient_id: {
        type: Sequelize.UUID,
        references: { model: 'patients', key: 'id' }
      },
      household_id: {
        type: Sequelize.UUID,
        references: { model: 'households', key: 'id' }
      },
      chw_id: {
        type: Sequelize.UUID,
        references: { model: 'users', key: 'id' }
      },
      task_type: {
        type: Sequelize.ENUM('visit', 'follow_up', 'immunization', 'nutrition', 'delivery', 'referral', 'supply'),
        allowNull: false
      },
      title: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT
      },
      status: {
        type: Sequelize.ENUM('pending', 'in_progress', 'completed', 'cancelled'),
        defaultValue: 'pending'
      },
      priority: {
        type: Sequelize.ENUM('low', 'medium', 'high', 'urgent'),
        defaultValue: 'medium'
      },
      due_date: {
        type: Sequelize.DATE
      },
      assigned_date: {
        type: Sequelize.DATE
      },
      completed_date: {
        type: Sequelize.DATE
      },
      visit_id: {
        type: Sequelize.UUID,
        references: { model: 'visits', key: 'id' }
      },
      notes: {
        type: Sequelize.TEXT
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });

    // Referrals table
    await queryInterface.createTable('referrals', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      referral_number: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true
      },
      patient_id: {
        type: Sequelize.UUID,
        references: { model: 'patients', key: 'id' },
        allowNull: false
      },
      chw_id: {
        type: Sequelize.UUID,
        references: { model: 'users', key: 'id' },
        allowNull: false
      },
      facility_from: {
        type: Sequelize.STRING(100)
      },
      facility_to: {
        type: Sequelize.STRING(100)
      },
      reason: {
        type: Sequelize.TEXT
      },
      status: {
        type: Sequelize.ENUM('pending', 'completed', 'cancelled'),
        defaultValue: 'pending'
      },
      referral_date: {
        type: Sequelize.DATE
      },
      completion_date: {
        type: Sequelize.DATE
      },
      notes: {
        type: Sequelize.TEXT
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });

    // Sync logs table
    await queryInterface.createTable('sync_logs', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      device_id: {
        type: Sequelize.STRING(100)
      },
      user_id: {
        type: Sequelize.UUID,
        references: { model: 'users', key: 'id' }
      },
      sync_type: {
        type: Sequelize.ENUM('push', 'pull'),
        allowNull: false
      },
      status: {
        type: Sequelize.ENUM('success', 'partial', 'failed'),
        defaultValue: 'success'
      },
      records_pushed: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      records_pulled: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      started_at: {
        type: Sequelize.DATE
      },
      completed_at: {
        type: Sequelize.DATE
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });

    // Audit logs table
    await queryInterface.createTable('audit_logs', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      user_id: {
        type: Sequelize.UUID,
        references: { model: 'users', key: 'id' }
      },
      action: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      entity_type: {
        type: Sequelize.STRING(100)
      },
      entity_id: {
        type: Sequelize.UUID
      },
      changes: {
        type: Sequelize.JSONB
      },
      ip_address: {
        type: Sequelize.STRING(45)
      },
      user_agent: {
        type: Sequelize.TEXT
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });

    // Create indexes
    await queryInterface.addIndex('users', ['username']);
    await queryInterface.addIndex('users', ['role']);
    await queryInterface.addIndex('households', ['household_number']);
    await queryInterface.addIndex('patients', ['patient_id']);
    await queryInterface.addIndex('patients', ['chw_id']);
    await queryInterface.addIndex('visits', ['visit_number']);
    await queryInterface.addIndex('visits', ['patient_id']);
    await queryInterface.addIndex('tasks', ['chw_id']);
    await queryInterface.addIndex('tasks', ['status']);
    await queryInterface.addIndex('referrals', ['referral_number']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('audit_logs');
    await queryInterface.dropTable('sync_logs');
    await queryInterface.dropTable('referrals');
    await queryInterface.dropTable('tasks');
    await queryInterface.dropTable('visits');
    await queryInterface.dropTable('patients');
    await queryInterface.dropTable('households');
    await queryInterface.dropTable('users');
  }
};