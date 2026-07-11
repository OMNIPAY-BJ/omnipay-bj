import express from 'express';
import morgan from 'morgan';
import apiRoutes from './routes';
import { apiLimiter, corsPolicy, securityHeaders } from './middlewares/security';
import { errorHandler, notFound } from './middlewares/errorHandler';

export function createApp() {
  const app = express();

  app.disable('x-powered-by');
  app.use(securityHeaders);
  app.use(corsPolicy);
  app.use(apiLimiter);
  app.use(express.json({ limit: '1mb' }));
  app.use(morgan('combined'));

  app.use('/api/v1', apiRoutes);
  app.use(notFound);
  app.use(errorHandler);

  return app;
}
