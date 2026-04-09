"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const mongoose_1 = __importDefault(require("mongoose"));
const cors_1 = __importDefault(require("cors"));
const http_1 = __importDefault(require("http"));
const socket_io_1 = require("socket.io");
const dotenv_1 = __importDefault(require("dotenv"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const compression_1 = __importDefault(require("compression"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
// Load environment variables
dotenv_1.default.config();
// Import all your route files
const auth_1 = __importDefault(require("./routes/auth"));
const kyc_1 = __importDefault(require("./routes/kyc"));
const sos_1 = __importDefault(require("./routes/sos"));
const location_1 = __importDefault(require("./routes/location"));
const tourist_1 = __importDefault(require("./routes/tourist")); // ✅ 1. ADD THIS IMPORT
const app = (0, express_1.default)();
const server = http_1.default.createServer(app);
const io = new socket_io_1.Server(server, {
    cors: {
        origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
        methods: ["GET", "POST"],
        credentials: true
    }
});
// Middleware to make 'io' accessible in routes
app.use((req, res, next) => {
    req.io = io;
    next();
});
// Security middleware
app.use((0, helmet_1.default)({
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use((0, compression_1.default)());
// Rate limiting
const limiter = (0, express_rate_limit_1.default)({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'), // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
});
app.use('/api/', limiter);
// Middlewares
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Root route
app.get('/', (req, res) => {
    res.json({
        message: 'Ziro Backend API Server',
        status: 'running',
        endpoints: {
            auth: '/api/auth',
            kyc: '/api/kyc',
            sos: '/api/sos',
            location: '/api/location',
            tourist: '/api/tourist'
        }
    });
});
// Routes
app.use('/api/auth', auth_1.default);
app.use('/api/kyc', kyc_1.default);
app.use('/api/sos', sos_1.default);
app.use('/api/location', location_1.default);
app.use('/api/tourist', tourist_1.default); // ✅ 2. ADD THIS LINE TO ACTIVATE THE ROUTE
// 404 handler for undefined routes
app.use((req, res) => {
    res.status(404).json({
        error: 'Route not found',
        message: `Cannot ${req.method} ${req.path}`,
        availableRoutes: [
            'POST /api/auth/signup',
            'POST /api/auth/login',
            'GET /api/auth/profile',
            'POST /api/kyc',
            'POST /api/sos/trigger',
            'GET /api/sos/active',
            'POST /api/location/check',
            'POST /api/location/update',
            'GET /api/tourist/:touristId'
        ]
    });
});
// Socket.IO connection logic
io.on('connection', (socket) => {
    console.log('✅ A client connected to sockets');
    // Authenticate dashboard connections
    socket.on('authenticate', (data) => {
        try {
            const decoded = jsonwebtoken_1.default.verify(data.token, process.env.JWT_SECRET || "fallback_secret_change_in_production");
            socket.data.userId = decoded.id;
            socket.emit('authenticated');
            console.log('✅ Dashboard authenticated');
        }
        catch (err) {
            socket.emit('unauthorized', { message: 'Invalid token' });
            socket.disconnect();
        }
    });
    // Only allow authenticated clients to join dashboard
    socket.on('joinDashboard', () => {
        if (!socket.data.userId) {
            socket.emit('unauthorized', { message: 'Authentication required' });
            return;
        }
        console.log('Dashboard joined by authenticated user');
        socket.join('dashboard-room');
    });
    socket.on('disconnect', () => {
        console.log('Client disconnected');
    });
});
// DB Connection and Server Start
const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/authDB";
mongoose_1.default
    .connect(MONGO_URI)
    .then(() => console.log("✅ MongoDB Connected"))
    .catch((err) => console.error("❌ MongoDB Connection Error:", err));
const PORT = parseInt(process.env.PORT || '5000');
server.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
