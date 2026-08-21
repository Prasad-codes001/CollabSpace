import express from 'express';
import { join } from 'node:path';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env.js';
import { errorHandler } from './middleware/errorHandler.js';
import { ApiError } from './utils/ApiError.js';
import authRoutes from './routes/auth.routes.js';
import workspaceRoutes from './routes/workspace.routes.js';
import invitationRoutes from './routes/invitation.routes.js';
import documentRoutes from './routes/document.routes.js';
import activityRoutes from './routes/activity.routes.js';
import uploadRoutes from './routes/upload.routes.js';
import chatRoutes from './routes/chat.routes.js';

const app = express();

// --- Middleware ---
app.use(helmet());
app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use('/uploads', express.static(join(process.cwd(), 'uploads')));

// --- Health Check ---
app.get('/api/v1/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// --- Routes ---
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/workspaces', workspaceRoutes);
app.use('/api/v1/invitations', invitationRoutes);
app.use('/api/v1/documents', documentRoutes);
app.use('/api/v1/activities', activityRoutes);
app.use('/api/v1/upload', uploadRoutes);
app.use('/api/v1/documents', chatRoutes);

// --- 404 Handler ---
app.use((_req, _res, next) => {
  next(new ApiError(404, 'Route not found'));
});

// --- Global Error Handler ---
app.use(errorHandler);

export default app;
