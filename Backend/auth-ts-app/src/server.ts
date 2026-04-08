import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import http from 'http';
import { Server } from 'socket.io';

// Import all your route files
import authRoutes from './routes/auth';
import kycRoutes from './routes/kyc';
import sosRoutes from './routes/sos';
import locationRoutes from './routes/location';
import touristRoutes from './routes/tourist'; // ✅ 1. ADD THIS IMPORT

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Middleware to make 'io' accessible in routes
app.use((req: any, res, next) => {
  req.io = io;
  next();
});

// Middlewares
app.use(cors());
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
  console.log('✅ A client connected to sockets');
  
  socket.on('joinDashboard', () => {
    console.log('Dashboard joined');
    socket.join('dashboard-room');
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

// DB Connection and Server Start
const MONGO_URI = "mongodb://127.0.0.1:27017/authDB"; // ✅ Port
mongoose
  .connect(MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("❌ MongoDB Connection Error:", err));

const PORT = 5000;
server.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));

// Extend Express Request type
declare global {
  namespace Express {
    export interface Request {
      io: Server;
    }
  }
}