import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { rateLimit } from 'express-rate-limit';
import { logger } from './utils/logger';
import { errorHandler } from './middleware/errorHandler';
import { vettedMERouter } from './routes/vettedme.routes';
import { vettedPayRouter } from './routes/vettedpay.routes';
import { webhookRouter } from './routes/webhook.routes';
import { authRouter } from './routes/auth.routes';
import { assessmentRouter } from './routes/assessment.routes';
import { gtmRouter } from './routes/gtm.routes';
import milestoneRouter from './routes/milestone.routes';
import disputeRouter from './routes/dispute.routes';
import complianceRouter from './routes/compliance.routes';
import auditRouter from './routes/audit.routes';
import leadRouter from './routes/lead.routes';

dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 3000;

// ============================================================================
// SECURITY MIDDLEWARE
// ============================================================================

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
}));

app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3001',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Rate Limiting
const limiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);

// Body Parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ============================================================================
// ROUTES
// ============================================================================

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'VETTED Backend',
    version: process.env.API_VERSION || 'v1',
  });
});

app.use('/api/v1/auth', authRouter);
app.use('/api/v1/vettedme', vettedMERouter);
app.use('/api/v1/vettedpay', vettedPayRouter);
app.use('/api/v1/webhooks', webhookRouter);
app.use('/api/v1/assessment', assessmentRouter);
app.use('/api/v1/gtm', gtmRouter);
app.use('/api/v1/milestones', milestoneRouter);
app.use('/api/v1/disputes', disputeRouter);
app.use('/api/v1/compliance', complianceRouter);
app.use('/api/v1/audit', auditRouter);
app.use('/api/v1/leads', leadRouter);

// ============================================================================
// ERROR HANDLING
// ============================================================================

app.use(errorHandler);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.path,
  });
});

// ============================================================================
// SERVER STARTUP
// ============================================================================

const server = app.listen(PORT, () => {
  logger.info(`🚀 VETTED Backend running on port ${PORT}`);
  logger.info(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`🔐 Security headers: ENABLED`);
  logger.info(`⚡ VettedME Engine: READY`);
  logger.info(`💰 VettedPay Engine: READY`);
});

// Graceful Shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT signal received: closing HTTP server');
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

export default app;
