import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import { env } from './config/env';
import { swaggerSpec } from './config/swagger';
import apiRoutes from './routes';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler';

export function createApp(): Express {
  const app = express();

  // Behind a reverse proxy (nginx/Docker Compose setup, or any real host),
  // trust the X-Forwarded-* headers so req.secure and rate-limiting by IP
  // work correctly.
  app.set('trust proxy', 1);

  app.use(
    helmet({
      // HSTS only makes sense once you're actually serving over HTTPS —
      // enabling it in local dev would tell browsers to remember an
      // http://localhost "upgrade" that breaks the next visit.
      hsts: env.nodeEnv === 'production' ? { maxAge: 31536000, includeSubDomains: true, preload: true } : false,
    })
  );

  // Enforce HTTPS in production: if a request arrives over plain HTTP
  // (detected via the proxy's X-Forwarded-Proto header), redirect to the
  // HTTPS version instead of serving the request insecurely. No-op in
  // development so `npm run dev` over http://localhost keeps working.
  if (env.nodeEnv === 'production') {
    app.use((req, res, next) => {
      if (req.secure || req.headers['x-forwarded-proto'] === 'https') return next();
      return res.redirect(301, `https://${req.headers.host}${req.originalUrl}`);
    });
  }

  app.use(
    cors({
      origin: env.clientOrigin,
      credentials: true,
    })
  );
  app.use(express.json({ limit: '2mb' }));
  app.use(morgan(env.nodeEnv === 'production' ? 'combined' : 'dev'));

  const limiter = rateLimit({
    windowMs: env.rateLimitWindowMs,
    max: env.rateLimitMax,
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use('/api', limiter);

  app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'evsync-backend' }));
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  app.use('/api', apiRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
