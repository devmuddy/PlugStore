import express from 'express';
import cors, { type CorsOptions } from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import connectDB from './src/config/database';
import { verifyCloudinaryConnection } from './src/config/cloudinary';
import { verifyEmailConnection } from './src/config/email';
import { startTelegramBotIfConfigured } from './src/services/telegramBot';
import { startKeepAlivePinger } from './src/services/keepAlive';

// Load environment variables
dotenv.config();

const app = express();
const httpServer = createServer(app);

const normalizeOrigin = (value: string): string => value.trim().replace(/\/+$/, '');

const readAllowedOrigins = (): string[] => {
  const raw = [
    process.env.CLIENT_URLS,
    process.env.CLIENT_URL,
  ]
    .filter(Boolean)
    .join(',');

  const parsed = raw
    .split(',')
    .map((origin) => normalizeOrigin(origin))
    .filter(Boolean);

  const defaults = ['http://localhost:5173', 'http://localhost:4173', 'http://localhost:3000'].map((o) =>
    normalizeOrigin(o)
  );

  return Array.from(new Set([...parsed, ...defaults]));
};

const allowedOrigins = readAllowedOrigins();

const isOriginAllowed = (origin: string | undefined): boolean => {
  if (!origin) return true;
  if (allowedOrigins.length === 0) return true;
  const normalized = normalizeOrigin(origin);
  return allowedOrigins.includes(normalized);
};

const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    if (isOriginAllowed(origin)) {
      callback(null, true);
      return;
    }
    callback(new Error(`CORS origin not allowed: ${origin}`));
  },
  credentials: true,
};

const io = new Server(httpServer, {
  cors: {
    origin: (origin, callback) => {
      if (isOriginAllowed(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error(`CORS origin not allowed: ${origin}`));
    },
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Initialize connections
const initializeConnections = async () => {
  console.log('\n🚀 Initializing server connections...\n');

  const connectionStatus = {
    mongodb: false,
    cloudinary: false,
    email: false,
  };

  // Connect to MongoDB (required - will exit if fails)
  try {
    await connectDB();
    connectionStatus.mongodb = true;
  } catch (error) {
    connectionStatus.mongodb = false;
    // connectDB already logs and exits on failure, but we catch here for status tracking
  }

  // Verify Cloudinary connection
  connectionStatus.cloudinary = await verifyCloudinaryConnection();

  // Verify Email connection
  connectionStatus.email = await verifyEmailConnection();

  // Summary
  console.log('\n📊 Connection Summary:');
  console.log(`   ${connectionStatus.mongodb ? '✅' : '❌'} MongoDB`);
  console.log(`   ${connectionStatus.cloudinary ? '✅' : '⚠️ '} Cloudinary`);
  console.log(`   ${connectionStatus.email ? '✅' : '⚠️ '} Email`);
  console.log('');
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check route
app.get('/health', (_req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// API Routes
import authRoutes from './src/routes/authRoutes';
import userRoutes from './src/routes/userRoutes';
import adminRoutes from './src/routes/adminRoutes';

app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/admin', adminRoutes);

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });

  // Join user room for personalized updates
  socket.on('join-user-room', (userId: string) => {
    socket.join(`user-${userId}`);
  });

  // Join admin room for admin updates
  socket.on('join-admin-room', () => {
    socket.join('admin-room');
  });
});

// Make io available to routes
app.set('io', io);

const PORT = process.env.PORT || 5000;

// Initialize all connections before starting server
initializeConnections().then(() => {
  httpServer.listen(PORT, () => {
    console.log('═══════════════════════════════════════════════════════');
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📦 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🌐 Client URL: ${process.env.CLIENT_URL || 'http://localhost:5173'}`);
    console.log('═══════════════════════════════════════════════════════\n');
    startTelegramBotIfConfigured();
    startKeepAlivePinger();
  });
}).catch((error) => {
  console.error('❌ Failed to initialize server:', error);
  process.exit(1);
});

export { io };
