# Changelog

All notable changes to MedField CHW Platform will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] - 2026-02-18

### Added
- **Advanced Auto-Scaling Architecture**:
  - Vertical Scaling Manager: Dynamic connection pool sizing and adaptive response caching.
  - Horizontal Scaling Manager: Node.js Cluster support with Redis-based session synchronization.
  - System Health Monitor: Real-time metrics collection and autonomous scaling decisions.
  - Circuit Breakers: Fault tolerance for external services and heavy database operations.
  - Scaling Dashboard API: Administrative endpoints for monitoring system health and manual scaling control.
- **Comprehensive Test Suite**:
  - Unit tests for all Sequelize models (User, Patient, Visit, Task, Household, Referral).
  - Unit tests for core services (Clinical Decision Support, DHIS2, PatientService, etc.).
  - Unit tests for Auth middleware and role-based access control.
  - Integration tests for Auth, Patients, Visits, Tasks, Sync, and Referral routes.
  - Integrated `supertest` for robust API testing.

### Changed
- Refactored backend entry point to a cluster-aware main process (`src/index.js`).
- Extracted Express application configuration to `src/server.js` for modularity and testability.
- Updated Docker configuration to include Redis for horizontal scaling support.
- Standardized README structure and fixed encoding issues in project diagrams.

## [1.0.0] - 2026-02-16

### Added
- CHW mobile application with offline-first architecture (React Native + PouchDB)
- Patient registration and household mapping with GPS coordinates
- Visit logging with offline storage and background sync
- Smart task scheduling with risk-based prioritization
- WHO iCCM clinical decision support protocols (fever, diarrhea, pneumonia, malnutrition)
- Automatic danger sign detection with urgent referral triggers
- Digital referral management with bidirectional tracking
- Supply chain reporting with threshold-based alerts
- Supervisor web dashboard with real-time activity monitoring (React.js)
- Performance analytics with individual and team metrics
- Map-based visualization using Leaflet.js
- RESTful API with Node.js/Express backend
- PostgreSQL database with Sequelize ORM
- JWT authentication with role-based access control (admin, supervisor, CHW, district_officer)
- DHIS2 integration for national health information system reporting
- HL7 FHIR interoperability layer
- Socket.io real-time event system
- Docker Compose deployment configuration
- Rate limiting, Helmet security headers, and CORS protection
- Comprehensive API documentation in README
- GPL v3 open source license

### Security
- bcrypt password hashing
- JWT token-based authentication with expiration
- Express rate limiting (100 requests/15 minutes per IP)
- Helmet HTTP security headers
- Input validation with express-validator
