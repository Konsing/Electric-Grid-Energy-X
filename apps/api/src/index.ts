import express from 'express';
import cors from 'cors';
import compression from 'compression';
import { config } from './lib/config';
import { errorHandler } from './middleware/errorHandler';
import { metricsMiddleware } from './middleware/metrics';
import { healthRouter, metricsRouter } from './modules/health/health.routes';

// Module routers — imported after infrastructure is loaded
import { authRouter, devAuthRouter } from './modules/auth/auth.routes';
import { accountsRouter } from './modules/accounts/accounts.routes';
import { metersRouter, accountMetersRouter } from './modules/meters/meters.routes';
import { readingsRouter } from './modules/readings/readings.routes';
import { billingRouter } from './modules/billing/billing.routes';
import { notificationsRouter } from './modules/notifications/notifications.routes';
import { outagesRouter } from './modules/outages/outages.routes';

export function createApp() {
  const app = express();

  // ─── Global Middleware ──────────────────────────────
  app.use(cors());
  app.use(compression());
  app.use(express.json());
  app.use(metricsMiddleware);

  // ─── Routes ─────────────────────────────────────────
  app.use('/api/health', healthRouter);
  app.use('/api/metrics', metricsRouter);

  // Dev-only auth routes (route literally doesn't exist in prod)
  if (config.isDev || config.isTest) {
    app.use('/api/auth', devAuthRouter);
  }

  app.use('/api/auth', authRouter);
  app.use('/api/accounts', accountsRouter);
  app.use('/api/accounts', accountMetersRouter); // /api/accounts/:id/meters
  app.use('/api/meters', metersRouter);
  app.use('/api/meters', readingsRouter);    // /api/meters/:id/readings
  app.use('/api/accounts', readingsRouter);  // /api/accounts/:id/usage/*
  app.use('/api/billing', billingRouter);
  app.use('/api/accounts', billingRouter);   // /api/accounts/:id/billing
  app.use('/api/notifications', notificationsRouter);
  app.use('/api/accounts', notificationsRouter); // /api/accounts/:id/notifications
  app.use('/api/outages', outagesRouter);

  // ─── Error Handler ──────────────────────────────────
  app.use(errorHandler);

  return app;
}

// Start server unless in test mode
if (!config.isTest) {
  const app = createApp();
  app.listen(config.PORT, () => {
    console.log(`⚡ Electric Grid Energy X API running on port ${config.PORT}`);
    console.log(`   Environment: ${config.NODE_ENV}`);
    console.log(`   Mock Auth: ${config.MOCK_AUTH}`);
  });
}
