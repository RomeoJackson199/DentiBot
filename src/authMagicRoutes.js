'use strict';

// Magic link authentication & migration claim skeleton
// Dependencies: express, express-rate-limit, helmet, cookie-parser, jsonwebtoken, nodemailer

const express = require('express');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const crypto = require('node:crypto');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

const router = express.Router();

// --- Config & constants ---
const MAGIC_TOKEN_TTL_MINUTES = parseInt(process.env.MAGIC_TOKEN_TTL_MINUTES || '15', 10);
const PUBLIC_BASE_URL = process.env.PUBLIC_BASE_URL || 'https://localhost:3000';
const DASHBOARD_URL = process.env.DASHBOARD_URL || 'https://app.localhost:3000/dashboard';
const SESSION_SECRET = process.env.SESSION_SECRET || 'change-me-in-prod';
const SESSION_TTL_DAYS = parseInt(process.env.SESSION_TTL_DAYS || '30', 10);
const COOKIE_NAME = '__Host-session';
const DEBUG_MAGIC = process.env.DEBUG_MAGIC_LINK === '1';

function logDebug(...args) {
  if (DEBUG_MAGIC) {
    // eslint-disable-next-line no-console
    console.log('[magic-debug]', ...args);
  }
}

// --- Security middleware ---
function requireHttps(req, res, next) {
  // Enforce HTTPS in production; respect reverse proxy headers
  if (process.env.NODE_ENV === 'production') {
    const isSecure = req.secure || req.headers['x-forwarded-proto'] === 'https';
    if (!isSecure) {
      return res.redirect(301, `https://${req.headers.host}${req.originalUrl}`);
    }
  }
  next();
}

// --- Rate limiters ---
const requestLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 5, // limit per IP
  standardHeaders: 'draft-7',
  legacyHeaders: false
});

const consumeLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 30, // generous but prevents brute force on token
  standardHeaders: 'draft-7',
  legacyHeaders: false
});

// --- Helpers: token generation & hashing ---
function toBase64Url(buffer) {
  return buffer.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function generateMagicToken() {
  // 32 bytes (~256 bits) for strong entropy
  const token = toBase64Url(crypto.randomBytes(32));
  const tokenHash = hashToken(token);
  return { token, tokenHash };
}

function hashToken(token) {
  // Store only the hash server-side to prevent token theft if DB leaks
  return crypto.createHash('sha256').update(token, 'utf8').digest('hex');
}

// --- Email (magic link) ---
function createMailer() {
  if (!process.env.SMTP_URL) {
    // Fallback: console log for local dev
    return {
      sendMail: async (opts) => {
        // eslint-disable-next-line no-console
        console.log('MAGIC LINK (dev):', opts.to, opts.subject, opts.text);
        return { messageId: 'dev' };
      }
    };
  }
  return nodemailer.createTransport(process.env.SMTP_URL);
}

const mailer = createMailer();

async function sendMagicLinkEmail(email, link) {
  const subject = 'Your secure sign-in link';
  const text = `Click to sign in: ${link}\n\nThis link expires in ${MAGIC_TOKEN_TTL_MINUTES} minutes. If you didn’t request this, ignore this email.`;
  await mailer.sendMail({
    from: 'no-reply@example.com',
    to: email,
    subject,
    text
  });
}

// --- Session helpers ---
function issueSessionJwt(userId) {
  const nowSeconds = Math.floor(Date.now() / 1000);
  const expiresInSeconds = SESSION_TTL_DAYS * 24 * 60 * 60;
  const payload = {
    sub: String(userId),
    iat: nowSeconds,
    exp: nowSeconds + expiresInSeconds,
    // Bind the session to a random session id to allow server-side invalidation lists if needed
    jti: toBase64Url(crypto.randomBytes(16))
  };
  return jwt.sign(payload, SESSION_SECRET, { algorithm: 'HS256' });
}

function setSessionCookie(res, token) {
  // __Host- prefix requires Secure, Path=/, and no Domain attribute
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    // Optional: set long-lived maxAge matching JWT exp
    maxAge: SESSION_TTL_DAYS * 24 * 60 * 60 * 1000
  });
}

// --- Minimal email validation (do not leak specifics) ---
function looksLikeEmail(value) {
  if (typeof value !== 'string' || value.length > 254) return false;
  // Basic pattern; rely on deeper validation in mailer bounce handling
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

// --- In-memory DB adapter (replace with your ORM/driver in production). ---
// This is process-memory only. Restarting the process will clear all data.
const tokenStoreByHash = new Map(); // tokenHash -> { id, email, expiresAt, createdAt, usedAt, ipAddress, userAgent }
const usersByEmail = new Map(); // email -> { id, email }
const migratedRecordsByEmail = new Map(); // email -> Array<{ id, email, claimed, userId|null }>
const migratedRecordsIndexById = new Map(); // id -> record reference

function generateId(prefix) {
  if (typeof crypto.randomUUID === 'function') return `${prefix}_${crypto.randomUUID()}`;
  return `${prefix}_${toBase64Url(crypto.randomBytes(12))}`;
}

const db = {
  insertMagicToken: async ({ email, tokenHash, expiresAt, ipAddress, userAgent }) => {
    const id = generateId('mt');
    const record = {
      id,
      email,
      tokenHash,
      expiresAt: new Date(expiresAt),
      createdAt: new Date(),
      usedAt: null,
      ipAddress: ipAddress || '',
      userAgent: userAgent || ''
    };
    // Store by hash; collisions are extremely unlikely, but if present we overwrite safely
    tokenStoreByHash.set(tokenHash, record);
    logDebug('inserted tokenHash', tokenHash, 'for', email, 'expiresAt', record.expiresAt.toISOString());
    return record;
  },
  consumeMagicTokenByHashIfValid: async (tokenHash, now) => {
    const record = tokenStoreByHash.get(tokenHash);
    logDebug('consume attempt tokenHash', tokenHash, 'found?', !!record);
    if (!record) return null;
    const nowDate = now instanceof Date ? now : new Date(now);
    if (record.usedAt) return null;
    if (record.expiresAt <= nowDate) return null;
    // Mark as used to prevent replay
    record.usedAt = nowDate;
    tokenStoreByHash.set(tokenHash, record);
    return { email: record.email, id: record.id };
  },
  getUserByEmail: async (email) => {
    return usersByEmail.get(email) || null;
  },
  createUser: async (email) => {
    const id = generateId('usr');
    const user = { id, email };
    usersByEmail.set(email, user);
    return user;
  },
  findUnclaimedMigratedRecordsByEmail: async (email) => {
    const list = migratedRecordsByEmail.get(email) || [];
    return list.filter(r => !r.claimed);
  },
  claimMigratedRecordsForUser: async (userId, recordIds) => {
    for (const recordId of recordIds) {
      const record = migratedRecordsIndexById.get(recordId);
      if (record && !record.claimed) {
        record.claimed = true;
        record.userId = userId;
      }
    }
  }
};

// --- POST /auth/magic/request ---
// Accepts { email }. Always returns a neutral response.
// Generates a one-time, short-lived token; emails the magic link.
router.post('/auth/magic/request', requestLimiter, async (req, res) => {
  // Always respond with neutral message to avoid email enumeration
  const NEUTRAL_MESSAGE = 'If that email is registered, we’ve sent a link.';
  try {
    const email = String(req.body?.email || '').trim().toLowerCase();

    // Skip processing if email is clearly malformed; but still return neutral response
    if (!looksLikeEmail(email)) {
      return res.status(200).json({ message: NEUTRAL_MESSAGE });
    }

    // Generate strong one-time token and store only the hash
    const { token, tokenHash } = generateMagicToken();
    const expiresAt = new Date(Date.now() + MAGIC_TOKEN_TTL_MINUTES * 60 * 1000);

    // Store token hash with expiry (no info leak). Including IP/User-Agent can help with abuse monitoring.
    await db.insertMagicToken({
      email,
      tokenHash,
      expiresAt,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'] || ''
    });

    // Compose magic link pointing to the consume endpoint. Do not include the email in the link.
    const link = `${PUBLIC_BASE_URL}/auth/magic/consume?token=${encodeURIComponent(token)}`;
    logDebug('magic link for', email, '=>', link);

    // Send email (errors are swallowed to avoid leaking existence)
    try {
      await sendMagicLinkEmail(email, link);
    } catch (mailErr) {
      // eslint-disable-next-line no-console
      console.error('sendMagicLinkEmail failed', mailErr);
      // Still log the link in debug for local testing
      logDebug('email send failed; link was', link);
    }

    return res.status(200).json({ message: NEUTRAL_MESSAGE });
  } catch (err) {
    // Keep response neutral on any error
    // eslint-disable-next-line no-console
    console.error('magic request error', err);
    return res.status(200).json({ message: 'If that email is registered, we’ve sent a link.' });
  }
});

// --- GET /auth/magic/consume ---
// Verifies/consumes the token (one-time use), creates user if missing,
// claims migrated records by email, creates a session, and redirects to dashboard.
router.get('/auth/magic/consume', consumeLimiter, async (req, res) => {
  try {
    const rawToken = String(req.query?.token || '');

    // Basic sanity checks to avoid absurd inputs; respond generic on failure
    if (!rawToken || rawToken.length > 512) {
      return res.status(400).send('This link is invalid or expired. Request a new one.');
    }

    const tokenHash = hashToken(rawToken);

    // Atomically mark as used and fetch associated email
    const consumed = await db.consumeMagicTokenByHashIfValid(tokenHash, new Date());
    if (!consumed || !consumed.email) {
      // Token invalid, expired, or already used (prevents replay)
      return res.status(400).send('This link is invalid or expired. Request a new one.');
    }

    const email = String(consumed.email).toLowerCase();

    // Get or create the user for this email (creation deferred to consumption to avoid enumeration)
    let user = await db.getUserByEmail(email);
    if (!user) {
      user = await db.createUser(email);
    }

    // If there are unclaimed migrated records for this email, attach them to the user atomically
    const unclaimed = await db.findUnclaimedMigratedRecordsByEmail(email);
    if (unclaimed.length > 0) {
      const recordIds = unclaimed.map(r => r.id);
      await db.claimMigratedRecordsForUser(user.id, recordIds);
    }

    // Create a session and set secure cookie
    const sessionJwt = issueSessionJwt(user.id);
    setSessionCookie(res, sessionJwt);

    // Redirect to the dashboard. Use 303 to be safe for GET.
    return res.redirect(303, DASHBOARD_URL);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('magic consume error', err);
    return res.status(400).send('This link is invalid or expired. Request a new one.');
  }
});

// --- Optional: mount on an app here or export the router ---
function createApp() {
  const app = express();
  app.set('trust proxy', 1); // required for secure cookies + HTTPS detection behind proxies
  app.use(helmet());
  app.use(requireHttps);
  app.use(express.json({ limit: '32kb' }));
  app.use(cookieParser());
  app.use(router);
  return app;
}

module.exports = { router, createApp };

