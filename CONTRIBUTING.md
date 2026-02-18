# Contributing to MedField

Welcome to MedField! We are excited to have you join our community and help improve the platform for Community Health Workers.

## Code of Conduct

Please read our [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) before contributing to ensure a welcoming and inclusive environment.

## Getting Started

1. **Fork the Repository**: Create your own copy of the repository on GitHub.
2. **Clone the Fork**: `git clone https://github.com/[YOUR-USERNAME]/MedField_CHW_Platform.git`
3. **Set Up Development Environment**:
   - **Docker (Recommended)**: Follow the Docker setup in the [README.md](README.md).
   - **Manual Setup**: Follow the manual setup instructions in the [README.md](README.md).

## Development Workflow

- **Branch Naming**:
  - `feature/` for new features
  - `bugfix/` for bug fixes
  - `docs/` for documentation changes
  - `test/` for testing improvements
- **Commit Message Format**: `type(scope): description` (e.g., `feat(mobile): add offline queue retry`).
- **Pull Request Template**: Ensure all tests pass, the code is linted, and changes are documented.

## Architecture Overview

MedField consists of three main components:
1. **Backend**: Node.js/Express API providing data services and integration with DHIS2/FHIR.
2. **Dashboard**: React supervisor web application for real-time monitoring and reporting.
3. **Mobile App**: React Native offline-first application for CHWs in the field.

These components interact via a RESTful API and synchronized data using PouchDB.

## Testing Requirements

All pull requests must include tests. We aim for high test coverage, especially for business logic and data processing.
- Run tests: `cd backend && npm test`
- Clinical decision support changes require **100% test coverage** on modified code.

## Health-Critical Code Guidelines

Extra care must be taken when modifying health-critical modules. These require additional review:
- Clinical decision support protocols (`backend/src/services/clinicalDecisionSupport.js`)
- Danger sign detection logic
- Drug dosage or treatment recommendations
- Any WHO protocol modifications

## Reporting Security Vulnerabilities

Please do not report security vulnerabilities via public GitHub issues. Instead, email us at [dickson.ab@northeastern.edu] for responsible disclosure.

## Localization

We welcome contributions to add new language translations. Please check the `mobile-app/src/i18n` (or equivalent) directory for language files.

## Areas Where Help is Needed

- **Testing**: Expanding the test suite for edge cases.
- **Localization**: Adding support for local dialects and languages.
- **Low-bandwidth Optimization**: Improving performance in areas with poor internet connectivity.
- **Android Performance**: Optimizing the React Native app for budget Android devices.
