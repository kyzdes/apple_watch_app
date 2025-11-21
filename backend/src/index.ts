import express, { Application, Request, Response } from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import logger from './utils/logger';
import { connectRedis } from './config/redis';
import { pool } from './config/database';
import { initializeWebSocket } from './services/websocket';
import { initializeAPNS, shutdownAPNS } from './services/pushNotification';

// Routes
import authRoutes from './routes/auth';
import userRoutes from './routes/user';
import friendRoutes from './routes/friend';
import vibrationRoutes from './routes/vibration';

dotenv.config();

const app: Application = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3000;
const API_VERSION = process.env.API_VERSION || 'v1';

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || '*',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use((req: Request, res: Response, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info('HTTP Request', {
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
    });
  });
  next();
});

// Health check endpoint
app.get('/health', async (req: Request, res: Response) => {
  try {
    // Check database connection
    await pool.query('SELECT 1');

    res.status(200).json({
      success: true,
      message: 'Server is healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  } catch (error) {
    logger.error('Health check failed:', error);
    res.status(503).json({
      success: false,
      message: 'Service unavailable',
    });
  }
});

// API Routes
app.use(`/api/${API_VERSION}/auth`, authRoutes);
app.use(`/api/${API_VERSION}/users`, userRoutes);
app.use(`/api/${API_VERSION}/friends`, friendRoutes);
app.use(`/api/${API_VERSION}/vibrations`, vibrationRoutes);

// Root endpoint
app.get('/', (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Haptic Friends API',
    version: API_VERSION,
    documentation: '/api/docs',
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

// Global error handler
app.use((err: any, req: Request, res: Response, next: any) => {
  logger.error('Unhandled error:', err);

  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// Initialize services and start server
const startServer = async () => {
  try {
    logger.info('Starting Haptic Friends API Server...');

    // Connect to Redis
    logger.info('Connecting to Redis...');
    await connectRedis();
    logger.info('Redis connected successfully');

    // Test database connection
    logger.info('Testing database connection...');
    await pool.query('SELECT NOW()');
    logger.info('Database connected successfully');

    // Initialize WebSocket
    logger.info('Initializing WebSocket server...');
    initializeWebSocket(server);
    logger.info('WebSocket server initialized successfully');

    // Initialize APNS
    logger.info('Initializing Apple Push Notification Service...');
    initializeAPNS();
    logger.info('APNS initialized successfully');

    // Start HTTP server
    server.listen(PORT, () => {
      logger.info(`🚀 Server is running on port ${PORT}`);
      logger.info(`📱 API endpoint: http://localhost:${PORT}/api/${API_VERSION}`);
      logger.info(`🔌 WebSocket endpoint: ws://localhost:${PORT}`);
      logger.info(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Graceful shutdown
const shutdown = async () => {
  logger.info('Shutting down gracefully...');

  // Close HTTP server
  server.close(() => {
    logger.info('HTTP server closed');
  });

  // Close database pool
  await pool.end();
  logger.info('Database pool closed');

  // Shutdown APNS
  shutdownAPNS();

  process.exit(0);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start the server
startServer();

export default app;
