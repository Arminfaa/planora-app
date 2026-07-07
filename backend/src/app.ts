import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import { env } from './config';
import { noCacheApi } from './middlewares/noCache.middleware';
import { errorHandler, notFoundHandler } from './middlewares/error.middleware';
import v1Routes from './routes/v1';

import { localeMiddleware } from './i18n/locale.middleware';

const app = express();

app.use(localeMiddleware);
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  }),
);
app.use(
  cors({
    origin: env.CORS_ORIGIN,
    credentials: true,
  }),
);
app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/v1', noCacheApi, v1Routes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
