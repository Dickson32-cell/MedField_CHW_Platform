const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'MedField CHW Platform API',
      version: '2.0.0',
      description: 'API for Community Health Worker Coordination Platform',
      contact: {
        name: 'API Support',
        email: 'support@medfield.health'
      }
    },
    servers: [
      {
        url: 'http://localhost:3007',
        description: 'Development server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    },
    security: [{
      bearerAuth: []
    }],
    tags: [
      { name: 'Auth', description: 'Authentication endpoints' },
      { name: 'Patients', description: 'Patient management' },
      { name: 'Visits', description: 'Visit tracking' },
      { name: 'Tasks', description: 'Task management' },
      { name: 'Households', description: 'Household management' },
      { name: 'Referrals', description: 'Referral management' },
      { name: 'Sync', description: 'Data synchronization' }
    ]
  },
  apis: ['./src/routes/*.js'], // Path to API docs
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = { swaggerSpec };