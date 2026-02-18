const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const http = require('http');
const { Server } = require('socket.io');

// Import routes
const authRoutes = require('./routes/auth');
const patientRoutes = require('./routes/patients');
const visitRoutes = require('./routes/visits');
const taskRoutes = require('./routes/tasks');
const householdRoutes = require('./routes/households');
const referralRoutes = require('./routes/referrals');
const syncRoutes = require('./routes/sync');
const dhis2Routes = require('./routes/dhis2');
const protocolRoutes = require('./routes/protocols');
const fhirRoutes = require('./routes/fhir');
const supplyRoutes = require('./routes/supplies');
const userRoutes = require('./routes/users');
const scalingRoutes = require('./routes/scaling');

// Import middleware
const { auth } = require('./middleware/auth');
const { auditLog } = require('./middleware/auditMiddleware');
const scalingMiddleware = require('./middleware/scalingMiddleware');
const requestTracker = require('./middleware/requestTracker');

const app = express();
const server = http.createServer(app);

// Socket.io
const io = new Server(server, {
    cors: {
        origin: process.env.CLIENT_URL || '*',
        methods: ['GET', 'POST']
    }
});

// Rate limiting Specialized Handlers
const { authLimiter, syncLimiter, apiLimiter } = require('./middleware/rateLimiter');

// Enable GZIP compression
app.use(compression());
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Scaling & Tracking middleware
app.use(requestTracker);
app.use(scalingMiddleware);

// API Routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/patients', auth, auditLog, patientRoutes);
app.use('/api/visits', auth, auditLog, visitRoutes);
app.use('/api/tasks', auth, auditLog, taskRoutes);
app.use('/api/households', auth, auditLog, householdRoutes);
app.use('/api/referrals', auth, auditLog, referralRoutes);
app.use('/api/sync', syncLimiter, syncRoutes);
app.use('/api/protocols', protocolRoutes);
app.use('/api/fhir', fhirRoutes);
app.use('/api/supplies', supplyRoutes);
app.use('/api/users', userRoutes);
app.use('/api/dhis2', apiLimiter, dhis2Routes);
app.use('/api/scaling', apiLimiter, scalingRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: 'MedField API is running',
        timestamp: new Date().toISOString(),
        version: '1.1.0',
        workerId: process.pid
    });
});

// Stats endpoint
app.get('/api/dashboard/stats', auth, async (req, res) => {
    // ... existing logic ...
    const { User, Patient, Visit, Task, Referral, Household } = require('./models');
    const where = req.user.role === 'chw' ? { chw_id: req.userId } : {};
    try {
        const [
            totalCHWs, totalPatients, totalHouseholds, todayVisits, pendingTasks, pendingReferrals, completedVisitsThisMonth
        ] = await Promise.all([
            req.user.role === 'admin' || req.user.role === 'district_officer' ? User.count({ where: { role: 'chw', is_active: true } }) : 0,
            Patient.count({ where: { is_active: true } }),
            Household.count({ where: { is_active: true } }),
            Visit.count({ where: { ...where, visit_date: { [require('sequelize').Op.gte]: new Date().setHours(0, 0, 0, 0) } } }),
            Task.count({ where: { ...where, status: 'pending' } }),
            Referral.count({ where: { status: 'pending' } }),
            Visit.count({ where: { ...where, visit_status: 'completed', visit_date: { [require('sequelize').Op.gte]: new Date(new Date().setDate(1)) } } })
        ]);

        res.json({
            success: true,
            data: {
                total_chws: totalCHWs,
                total_patients: totalPatients,
                total_households: totalHouseholds,
                today_visits: todayVisits,
                pending_tasks: pendingTasks,
                pending_referrals: pendingReferrals,
                completed_visits_month: completedVisitsThisMonth
            }
        });
    } catch (e) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

app.set('io', io);

module.exports = { app, server, io };
