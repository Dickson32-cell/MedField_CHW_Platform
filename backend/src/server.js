const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const http = require('http');
const { Server } = require('socket.io');
const swaggerUi = require('swagger-ui-express');
const { swaggerSpec } = require('./swagger');

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
const corsOptions = {
    origin: function (origin, callback) {
        // Allow requests with no origin (mobile apps, postman)
        const allowedOrigins = [
            process.env.CLIENT_URL,
            'http://localhost:3000',
            'http://localhost:8081',
            'exp://localhost:8081'
        ].filter(Boolean);
        
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    credentials: true
};

const io = new Server(server, {
    cors: corsOptions
});

// Rate limiting Specialized Handlers
const { authLimiter, syncLimiter, apiLimiter } = require('./middleware/rateLimiter');

// Request tracking middleware
const { requestIdMiddleware, requestLogger } = require('./middleware/requestId');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

// Enable GZIP compression
app.use(compression());
app.use(helmet());
app.use(cors(corsOptions));
app.use(morgan('combined'));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Add request ID and logging
app.use(requestIdMiddleware);
app.use(requestLogger);

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

// Health check routes
const healthRoutes = require('./routes/health');
app.use('/api/health', healthRoutes);

// Swagger API documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get('/api-docs.json', (req, res) => {
    res.json(swaggerSpec);
});

// Stats endpoint - Role-based dashboard stats
app.get('/api/dashboard/stats', auth, async (req, res) => {
    const { User, Patient, Visit, Task, Referral, Household } = require('./models');
    const Op = require('sequelize').Op;
    
    try {
        let stats = {};
        
        if (req.user.role === 'chw') {
            // CHW-specific stats - only their assigned patients/visits
            const [
                todayVisits, pendingTasks, pendingReferrals, completedVisitsThisMonth,
                assignedPatients, assignedHouseholds
            ] = await Promise.all([
                Visit.count({ where: { chw_id: req.userId, visit_date: { [Op.gte]: new Date().setHours(0, 0, 0, 0) } } }),
                Task.count({ where: { assigned_to: req.userId, status: 'pending' } }),
                Referral.count({ where: { chw_id: req.userId, status: 'pending' } }),
                Visit.count({ where: { chw_id: req.userId, visit_status: 'completed', visit_date: { [Op.gte]: new Date(new Date().setDate(1)) } } }),
                Patient.count({ where: { chw_id: req.userId, is_active: true } }),
                Household.count({ where: { chw_id: req.userId, is_active: true } })
            ]);
            
            stats = {
                today_visits: todayVisits,
                pending_tasks: pendingTasks,
                pending_referrals: pendingReferrals,
                completed_visits_month: completedVisitsThisMonth,
                assigned_patients: assignedPatients,
                assigned_households: assignedHouseholds,
                role: 'chw'
            };
        } else {
            // Supervisor/Admin stats - full dashboard
            const [
                totalCHWs, totalPatients, totalHouseholds, todayVisits, pendingTasks, pendingReferrals, completedVisitsThisMonth
            ] = await Promise.all([
                req.user.role === 'admin' || req.user.role === 'district_officer' ? User.count({ where: { role: 'chw', is_active: true } }) : 0,
                Patient.count({ where: { is_active: true } }),
                Household.count({ where: { is_active: true } }),
                Visit.count({ where: { visit_date: { [Op.gte]: new Date().setHours(0, 0, 0, 0) } } }),
                Task.count({ where: { status: 'pending' } }),
                Referral.count({ where: { status: 'pending' } }),
                Visit.count({ where: { visit_status: 'completed', visit_date: { [Op.gte]: new Date(new Date().setDate(1)) } } })
            ]);

            stats = {
                total_chws: totalCHWs,
                total_patients: totalPatients,
                total_households: totalHouseholds,
                today_visits: todayVisits,
                pending_tasks: pendingTasks,
                pending_referrals: pendingReferrals,
                completed_visits_month: completedVisitsThisMonth,
                role: req.user.role
            };
        }

        res.json({
            success: true,
            data: stats
        });
    } catch (e) {
        console.error('Dashboard stats error:', e);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// CHW-specific endpoints
app.get('/api/dashboard/chw/assigned-patients', auth, async (req, res) => {
    if (req.user.role !== 'chw') {
        return res.status(403).json({ success: false, message: 'Access denied' });
    }
    
    const { Patient } = require('./models');
    try {
        const patients = await Patient.findAll({
            where: { chw_id: req.userId, is_active: true },
            order: [['last_name', 'ASC']]
        });
        
        res.json({ success: true, data: { patients } });
    } catch (e) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

app.get('/api/dashboard/chw/today-tasks', auth, async (req, res) => {
    if (req.user.role !== 'chw') {
        return res.status(403).json({ success: false, message: 'Access denied' });
    }
    
    const { Task } = require('./models');
    const Op = require('sequelize').Op;
    const today = new Date().setHours(0, 0, 0, 0);
    const tomorrow = new Date(today + 24 * 60 * 60 * 1000);
    
    try {
        const tasks = await Task.findAll({
            where: {
                assigned_to: req.userId,
                due_date: { [Op.gte]: new Date(today), [Op.lt]: new Date(tomorrow) },
                status: { [Op.ne]: 'cancelled' }
            },
            order: [['priority', 'DESC'], ['due_date', 'ASC']]
        });
        
        res.json({ success: true, data: { tasks } });
    } catch (e) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

app.get('/api/dashboard/chw/quick-patient-search', auth, async (req, res) => {
    if (req.user.role !== 'chw') {
        return res.status(403).json({ success: false, message: 'Access denied' });
    }
    
    const { Patient } = require('./models');
    const { query } = req.query;
    
    if (!query || query.length < 2) {
        return res.status(400).json({ success: false, message: 'Search query must be at least 2 characters' });
    }
    
    try {
        const patients = await Patient.findAll({
            where: {
                chw_id: req.userId,
                is_active: true,
                [Op.or]: [
                    { first_name: { [Op.iLike]: `%${query}%` } },
                    { last_name: { [Op.iLike]: `%${query}%` } },
                    { patient_id: { [Op.iLike]: `%${query}%` } }
                ]
            },
            limit: 10,
            order: [['last_name', 'ASC']]
        });
        
        res.json({ success: true, data: { patients } });
    } catch (e) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Error handling (must be after all routes)
app.use(notFoundHandler);
app.use(errorHandler);

app.set('io', io);

module.exports = { app, server, io };
