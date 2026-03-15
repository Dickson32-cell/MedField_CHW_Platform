# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [2.0.1] - 2026-03-14

### Added
- **CI/CD Pipeline**: GitHub Actions workflow for automated testing
- **Health Check Endpoint**: Comprehensive `/api/health` with DB & Redis status
- **Liveness/Readiness Probes**: `/api/health/live` and `/api/health/ready`
- **CONTRIBUTING.md**: Guidelines for contributors
- **Unit Tests**: Auth, password validation, JWT, bcrypt tests

### Changed
- **Security**: Increased bcrypt hash rounds from 10 to 12
- **Security**: Added strong password validation requirements
- **Security**: Fixed CORS to use whitelist instead of wildcard
- **Performance**: Added database indexes to Patient and Task models
- **API Docs**: Swagger documentation for auth endpoints

### Fixed
- Rate limiting on `/register` endpoint (5/hour)
- Rate limiting on `/login` endpoint (10/min)

---

## [2.0.0] - 2026-02-XX

### Added
- **Supervisor Dashboard**: React.js web interface
- **Mobile App**: React Native (Expo) offline-first app
- **Authentication**: JWT-based auth with role management
- **Patient Management**: Registration, household mapping, risk scoring
- **Visit Logging**: GPS tracking, vitals, clinical notes
- **Task Management**: Smart prioritization, follow-ups
- **Referral System**: Facility referrals with tracking
- **Supply Chain**: Inventory management for CHWs
- **DHIS2 Integration**: Data export to DHIS2
- **FHIR Support**: Healthcare interoperability
- **Auto-Scaling**: Dynamic worker scaling for high load
- **Clinical Decision Support**: IMCI-based protocols
- **SMS Notifications**: Bulk SMS capabilities
- **API Documentation**: Swagger/OpenAPI specs

### Security
- Rate limiting on all endpoints
- Audit logging
- Input sanitization

### Infrastructure
- Docker deployment
- PostgreSQL database
- Redis caching
- Socket.io real-time updates

---

## [1.0.0] - 2025-XX-XX

### Added
- Initial release
- Basic patient registration
- Simple visit logging
- Admin panel

---

## Upgrading

### 1.x → 2.0
- Update environment variables (see `.env.example`)
- Run database migrations
- Rebuild Docker images
- Update mobile app to v2.0.0

### 2.0.0 → 2.0.1
- No database changes required
- Just update code and restart services