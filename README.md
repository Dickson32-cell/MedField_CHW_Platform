# MedField - Community Health Worker Coordination Platform

![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)
![Node.js](https://img.shields.io/badge/node-%3E%3D18-brightgreen)
![Docker](https://img.shields.io/badge/docker-ready-blue.svg)
![DOI](https://img.shields.io/badge/DOI-10.5281%2Fzenodo.19163228-green)

**Version 3.0.0** | **[Zenodo DOI](https://doi.org/10.5281/zenodo.19163228)**

An open-source digital platform designed to coordinate, manage, and empower Community Health Workers (CHWs) operating in low-resource settings.

---

## 🏥 Overview

MedField bridges the gap between community health workers and healthcare systems by providing:

- **Offline-capable** mobile app for field workers
- **Real-time dashboard** for supervisors and administrators
- **Secure API** for health data management
- **Role-based access** for Admin, Supervisor, and CHW roles

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        MedField Platform                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐     │
│  │   Mobile     │    │  Dashboard   │    │   External   │     │
│  │     App      │    │   (React)    │    │   Systems    │     │
│  │ (React Nat) │    │  localhost   │    │   (FHIR/DHIS2)│    │
│  └──────┬───────┘    └──────┬───────┘    └──────┬───────┘     │
│         │                    │                    │              │
│         └────────────────────┼────────────────────┘              │
│                              │                                   │
│                      ┌───────▼───────┐                          │
│                      │   Nginx       │                          │
│                      │   Proxy       │                          │
│                      └───────┬───────┘                          │
│                              │                                   │
│              ┌───────────────▼───────────────┐                   │
│              │        REST API               │                   │
│              │     (Express/Node.js)         │                   │
│              │      localhost:3005            │                   │
│              └───────────────┬───────────────┘                   │
│                              │                                   │
│         ┌────────────────────┼────────────────────┐              │
│         │                    │                    │              │
│  ┌──────▼──────┐    ┌────────▼────────┐   ┌──────▼──────┐      │
│  │ PostgreSQL  │    │     Redis       │   │   Socket.io │      │
│  │  Database   │    │   Rate Limit    │   │  Real-time  │      │
│  └─────────────┘    └─────────────────┘   └─────────────┘      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## 👥 User Roles

| Role | Username | Password | Access Level |
|------|----------|----------|--------------|
| Admin | `admin` | `admin123` | Full system access |
| Supervisor | `supervisor` | `supervisor123` | Team management, reports |
| CHW | `chw001` | `chw123` | Patient visits, tasks |

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Docker Desktop (or Docker Engine)
- Git

### 1. Clone the Repository

```bash
git clone https://github.com/Dickson32-cell/MedField_CHW_Platform.git
cd MedField_CHW_Platform
```

### 2. Start with Docker (Recommended)

```bash
cd docker
docker-compose up -d
```

Services will start:
- **API**: http://localhost:3005
- **Dashboard**: http://localhost:3006
- **PostgreSQL**: localhost:5434
- **Redis**: localhost:6380

### 3. Access the Dashboard

Open your browser: **http://localhost:3006**

Login with any account from the table above.

## 📁 Project Structure

```
MedField_CHW_Platform/
├── backend/                    # Express.js API server
│   ├── src/
│   │   ├── routes/            # API endpoints
│   │   │   ├── auth.js        # Authentication
│   │   │   ├── chw.js         # CHW-specific routes
│   │   │   ├── patients.js    # Patient management
│   │   │   ├── visits.js      # Visit logging
│   │   │   ├── tasks.js       # Task management
│   │   │   ├── households.js  # Household mapping
│   │   │   ├── referrals.js   # Referral system
│   │   │   └── ...
│   │   ├── middleware/        # Auth, rate limiting, etc.
│   │   ├── models/           # Database models
│   │   ├── services/          # Business logic
│   │   └── config/           # Database, Redis config
│   ├── package.json
│   └── .env.example
│
├── dashboard/                  # React Supervisor Dashboard
│   ├── src/
│   │   ├── pages/            # Dashboard pages
│   │   ├── components/       # Reusable components
│   │   ├── store/            # Auth state management
│   │   ├── hooks/            # Custom React hooks
│   │   └── services/         # API client
│   ├── package.json
│   └── vite.config.js
│
├── docker/                     # Docker deployment
│   ├── backend.Dockerfile
│   ├── dashboard.Dockerfile
│   ├── docker-compose.yml
│   ├── .env                   # Docker environment
│   └── dashboard/
│       └── nginx.conf         # Nginx configuration
│
├── .github/
│   └── workflows/
│       ├── ci.yml            # Continuous Integration
│       └── cd.yml            # Continuous Deployment
│
├── package.json               # Root package.json
├── README.md                  # This file
└── LICENSE                   # GPL v3 License
```

## ⚙️ Environment Variables

### Backend (.env)

Create `backend/.env` based on `.env.example`:

```env
# Server
NODE_ENV=production
PORT=3005

# Database
DB_HOST=localhost
DB_PORT=5434
DB_NAME=medfield
DB_USER=medfield_user
DB_PASSWORD=your_password_here

# Redis
REDIS_HOST=localhost
REDIS_PORT=6380

# JWT
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRES_IN=7d

# Client URL (for CORS)
CLIENT_URL=http://localhost:3006

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Docker (.env)

```env
# Database
POSTGRES_USER=medfield_user
POSTGRES_PASSWORD=medfield_password
POSTGRES_DB=medfield

# API
API_PORT=3005
API_IMAGE=medfield-backend:latest

# Dashboard
DASHBOARD_PORT=3006
DASHBOARD_IMAGE=medfield-dashboard:latest

# Redis
REDIS_PORT=6380
```

## 🌐 API Documentation

### Base URL

```
http://localhost:3005/api
```

### Authentication

**Login**
```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "admin123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": { "id": "...", "username": "admin", "role": "admin" },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### CHW Endpoints (requires auth)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/chw/stats` | Get CHW statistics |
| GET | `/api/chw/tasks` | List CHW tasks |
| GET | `/api/chw/patients` | List CHW patients |
| GET | `/api/chw/visits` | List CHW visits |

### Patient Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/patients` | List all patients |
| POST | `/api/patients` | Create patient |
| GET | `/api/patients/:id` | Get patient |
| PUT | `/api/patients/:id` | Update patient |

### Visit Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/visits` | List visits |
| POST | `/api/visits` | Log visit |
| GET | `/api/visits/:id` | Get visit details |

### Task Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tasks` | List tasks |
| POST | `/api/tasks` | Create task |
| PUT | `/api/tasks/:id` | Update task |
| PATCH | `/api/tasks/:id/status` | Update task status |

## 🐳 Docker Commands

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Rebuild after changes
docker-compose up -d --build

# Restart a specific service
docker restart medfield-api

# Access database
docker exec -it medfield-db psql -U medfield_user -d medfield
```

## 🔧 Local Development

### Backend

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your settings
npm run dev
```

### Dashboard

```bash
cd dashboard
npm install
npm run dev
```

### Run Tests

```bash
cd backend
npm test
```

## 📊 Features

### Admin Dashboard
- User management
- System configuration
- All data access
- Analytics overview

### Supervisor Dashboard
- CHW team management
- Performance monitoring
- Referral tracking
- Report generation

### CHW Mobile View
- Patient list
- Task management
- Visit logging
- GPS tracking
- Offline mode support

## 🔒 Security

- JWT-based authentication
- Password hashing with bcrypt
- Rate limiting (Redis-backed)
- CORS protection
- Input validation
- SQL injection prevention
- HIPAA compliance middleware

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the **GNU General Public License v3.0 (GPL-3.0)**.

See [LICENSE](LICENSE) for details.

## 👨‍💻 Authors

- **Abdul Rashid Dickson** - Initial work & development

## 📚 Cite This Project

If you use this software in academic research, please cite:

```bibtex
@software{medfield_chw_platform,
  title = {MedField - Community Health Worker Coordination Platform},
  author = {Abdul Rashid Dickson},
  version = {3.0.0},
  year = {2026},
  url = {https://github.com/Dickson32-cell/MedField_CHW_Platform},
  doi = {10.5281/zenodo.19163228}
}
```

## 🙏 Acknowledgments

- Community Health Worker programs worldwide
- Open source healthcare community
- All contributors

---

**Made with ❤️ for Community Health Workers**
