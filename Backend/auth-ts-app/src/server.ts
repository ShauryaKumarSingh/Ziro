import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import http from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import compression from 'compression';
import jwt from 'jsonwebtoken';

// Load environment variables
dotenv.config();

// Import all your route files
import authRoutes from './routes/auth';
import kycRoutes from './routes/kyc';
import sosRoutes from './routes/sos';
import locationRoutes from './routes/location';
import touristRoutes from './routes/tourist'; // ✅ 1. ADD THIS IMPORT

const app = express();
app.set('trust proxy', 1);
const server = http.createServer(app);

const corsOptions = {
  origin: '*',
  methods: ["GET", "POST"]
};

const io = new Server(server, {
  cors: corsOptions,
  transports: ['websocket', 'polling']
});

// Middleware to make 'io' accessible in routes
app.use((req: any, res, next) => {
  req.io = io;
  next();
});

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(compression());

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'), // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Middlewares
app.use(cors(corsOptions));
app.use(express.json());

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

app.get('/health', (req, res) => res.send('OK'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/kyc', kycRoutes);
app.use('/api/sos', sosRoutes);
app.use('/api/location', locationRoutes);
app.use('/api/tourist', touristRoutes); // ✅ 2. ADD THIS LINE TO ACTIVATE THE ROUTE

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
  console.log('✅ A client connected to sockets:', socket.id);

  // Handle JWT authentication for police dashboard
  socket.on('authenticate', (data) => {
    const { token } = data;
    
    if (!token) {
      socket.emit('unauthorized', { message: 'No token provided' });
      return;
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || "fallback_secret_change_in_production") as { id: string };
      socket.data.userId = decoded.id;
      socket.data.authenticated = true;
      console.log('✅ Socket authenticated for user:', decoded.id);
      socket.emit('authenticated');
    } catch (err) {
      console.error('❌ Socket authentication failed:', err);
      socket.emit('unauthorized', { message: 'Invalid token' });
    }
  });

  // Only allow authenticated clients to join dashboard
  socket.on('joinDashboard', () => {
    if (!socket.data.authenticated) {
      socket.emit('unauthorized', { message: 'Authentication required' });
      return;
    }
    console.log('📢 Police Dashboard joined by authenticated user:', socket.data.userId);
    socket.join('dashboard-room');
    socket.emit('dashboard-joined');
  });

  socket.on('disconnect', () => {
    console.log('❌ Client disconnected:', socket.id);
  });
});

// DB Connection and Server Start
const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  throw new Error('MONGO_URI must be set in environment variables');
}
mongoose
  .connect(MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("❌ MongoDB Connection Error:", err));

const PORT = parseInt(process.env.PORT || '5001');
server.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));

// Extend Express Request type
declare global {
  namespace Express {
    export interface Request {
      io: Server;
    }
  }
}
