# MedField - Community Health Worker Coordination Platform

![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)
![Node.js](https://img.shields.io/badge/node-%3E%3D18-brightgreen)
![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)

An open-source digital platform designed to coordinate, manage, and empower Community Health Workers (CHWs) operating in low-resource settings.

## Features

### CHW Mobile Application (Offline-First)
- Patient registration and household mapping
- Visit logging with offline storage
- Task scheduling and smart prioritization
- GPS-enabled visit tracking
- Supply chain reporting

### Supervisor Dashboard
- Real-time activity monitoring
- Performance analytics
- Map-based visualization
- Referral management
- Reports and exports

### Technical Highlights
- Offline-first architecture with PouchDB
- PostgreSQL for server-side storage
- RESTful API with Node.js/Express
- React Native mobile app
- React.js dashboard
- Docker deployment

## Prerequisites

- Node.js 18+
- Docker and Docker Compose
- PostgreSQL 15+

## Quick Start

### Using Docker (Recommended)

```bash
# Clone the repository
cd MedField_CHW_Platform

# Start all services
cd docker
docker-compose up -d

# Access the application
# Dashboard: http://localhost:3001
# API: http://localhost:3005
```

### Manual Setup

#### Backend
```bash
cd backend
npm install
cp .env.example .env
# Configure .env file with your settings
npm run dev
```

#### Dashboard
```bash
cd dashboard
npm install
npm start
```

#### Mobile App
```bash
cd mobile-app
npm install
# For Android
npm run android
# For iOS
npm run ios
```

## Project Structure

```
MedField_CHW_Platform/
├── backend/               # Node.js Express API
│   └── src/
│       ├── config/        # Database configuration
│       ├── controllers/   # Route controllers
│       ├── middleware/     # Auth & rate limiting middleware
│       ├── models/        # Sequelize ORM models
│       ├── routes/        # API route definitions
│       ├── services/      # Business logic & integrations
│       └── utils/         # Helper utilities
│
├── mobile-app/            # React Native mobile app (Expo)
│   └── src/
│       ├── screens/       # App screens (19 screens)
│       ├── services/      # API & offline database services
│       ├── navigation/    # Navigation configuration
│       ├── store/         # State management
│       └── utils/         # Utility functions
│
├── dashboard/             # React supervisor dashboard
│   └── src/
│       ├── components/    # Reusable UI components
│       ├── pages/         # Dashboard pages
│       ├── services/      # API service layer
│       └── store/         # State management
│
├── docker/                # Docker configuration
│   ├── docker-compose.yml
│   ├── backend.Dockerfile
│   ├── dashboard.Dockerfile
│   └── dashboard/nginx.conf
│
├── CITATION.cff           # Academic citation metadata (CFF format)
├── CHANGELOG.md           # Semantic versioning history
├── CODE_OF_CONDUCT.md     # Community guidelines
├── CONTRIBUTING.md        # Contribution guide
├── LICENSE                # GPL v3
└── README.md              # Project documentation
```

## API Endpoints

### Authentication
- POST `/api/auth/register` - Register new user
- POST `/api/auth/login` - User login
- GET `/api/auth/me` - Get current user

### Patients
- GET `/api/patients` - List patients
- POST `/api/patients` - Create patient
- GET `/api/patients/:id` - Get patient details
- PUT `/api/patients/:id` - Update patient

### Visits
- GET `/api/visits` - List visits
- POST `/api/visits` - Create visit
- GET `/api/visits/stats/summary` - Get visit statistics

### Tasks
- GET `/api/tasks` - List tasks
- GET `/api/tasks/today` - Get today's tasks
- PUT `/api/tasks/:id` - Update task

### Sync
- POST `/api/sync/push` - Push local data to server
- POST `/api/sync/pull` - Pull server data
- GET `/api/sync/status` - Get sync status

## Environment Variables

### Backend (.env)
```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=medfield
DB_USER=medfield_user
DB_PASSWORD=medfield_password
JWT_SECRET=your_jwt_secret
PORT=3000
```

## Default Test Accounts

For testing and evaluation purposes, the following accounts are available (passwords assume the database has been seeded):

| Role | Username | Password | Access Level |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin` | `admin123` | System management, scaling control, user approvals. |
| **Supervisor** | `supervisor` | `supervisor123` | District monitoring and referral management. |
| **CHW / Staff** | `chw001` | `password123` | Clinical patient data registration and visit logs. |

> [!WARNING]
> **Security Notice:** These credentials are for **local development and evaluation only**.
> They are intentionally simple for testing purposes. Before any real-world or
> clinical deployment, you must change all default passwords, rotate the JWT secret,
> and disable or remove the database seed accounts. Never deploy this platform with
> default credentials in a production or clinical environment.

> [!TIP]
> **New Staff?** The mobile app now supports a "Request Account" feature. Registered accounts remain pending until approved by the Administrator in the System Management dashboard.

## Advanced Auto-Scaling Architecture

This version of MedField (v2.0.0) introduces a robust, medical-grade auto-scaling engine designed for high-availability nationwide deployments.

### Key Components:
- **System Health Monitor**: A centralized brain that monitors CPU, memory, and clinical request latency.
- **Dynamic Worker Cluster**: Automatically scales Node.js workers up/down based on real-time load.
- **Strategy Management**: Admins can choose between `High Performance`, `Balanced`, or `Efficiency` modes.
- **Clinical Priority Queue**: Ensures life-critical clinical decision support requests are never delayed by background sync tasks.

## Repository

The source code for this project is publicly available on GitHub:

**GitHub:** https://github.com/Dickson32-cell/MedField_CHW_Platform

To cite this software, please use the DOI provided on the Zenodo record or
refer to the CITATION.cff file in the root of this repository.

## Citation

If you use MedField in your research or clinical publication, please cite it as follows:

**APA:**
> Dickson, A. R. (2026). MedField CHW Platform: An Offline-First Coordination System for Community Health Workers (Version 2.0.0). Zenodo.

[See CITATION.cff for bibtex and other formats]

## License

GPL v3 - See LICENSE file for details

## Contributing

Contributions are welcome! Please read our contributing guidelines before submitting pull requests.
