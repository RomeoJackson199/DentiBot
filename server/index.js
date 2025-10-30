import 'dotenv/config';
import express from 'express';
import cors from 'cors';

import authRouter from './routes/auth.js';
import businessRouter from './routes/business.js';
import appointmentsRouter from './routes/appointments.js';
import paymentsRouter, { paymentsWebhook } from './routes/payments.js';
import messagesRouter from './routes/messages.js';
import chatRouter from './routes/chat.js';
import analyticsRouter from './routes/analytics.js';
import notificationsRouter from './routes/notifications.js';

const app = express();

const allowedOriginsRaw = process.env.CORS_ORIGINS;
const allowedOrigins = allowedOriginsRaw
  ? allowedOriginsRaw.split(',').map((origin) => origin.trim()).filter(Boolean)
  : null;

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) {
        return callback(null, true);
      }

      if (!allowedOrigins || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      console.warn(`Blocked CORS origin: ${origin}`);
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  })
);
app.post('/api/payments/webhook', express.raw({ type: 'application/json' }), paymentsWebhook);
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'Caberu API' });
});

app.use('/api/auth', authRouter);
app.use('/api/businesses', businessRouter);
app.use('/api/appointments', appointmentsRouter);
app.use('/api/payments', paymentsRouter);
app.use('/api/messages', messagesRouter);
app.use('/api/chat', chatRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/notifications', notificationsRouter);

app.use((err, _req, res, _next) => {
  console.error('Unhandled error', err);
  res.status(500).json({ message: 'Unexpected server error' });
});

const port = process.env.PORT || 4000;

app.listen(port, () => {
  console.log(`Caberu API listening on port ${port}`);
});
