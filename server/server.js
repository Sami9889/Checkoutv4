import express from 'express';
import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import dotenv from 'dotenv';
import { encryptJSON, decryptJSON, hashPassword, verifyPassword } from './crypto-utils.js';
import paymentsRouter from './payments.js';
import bankTransfersRouter from './bank-transfers.js';
import kycRouter from './kyc.js';
import issueRouter from './issue-handler.js';
import payoutsRouter from './payouts.js';
import webhooksRouter from './webhooks.js';
import payoutAdminRouter from './payout-admin.js';
import customersRouter from './customers.js';
import { getEmailHistory, getEmailStats } from './email-service.js';
import { createAuditLog } from './customers.js';
import { initializeABN, getABN, maskABN } from './abn-config.js';
import { getMaskedBusinessConfig } from './bank-config.js';

dotenv.config();
const app = express();
app.use(express.json());

// Session management
const SESSIONS_FILE = path.resolve('./server/sessions.json');
const ADMIN_ATTEMPTS_FILE = path.resolve('./server/admin-attempts.json');

const MAX_LOGIN_ATTEMPTS = 3;
const LOCKOUT_DURATION = 60 * 60 * 1000; // 1 hour
const SESSION_DURATION = 30 * 60 * 1000; // 30 minutes

function initSessionsFile() {
  if (!fs.existsSync(SESSIONS_FILE)) {
    fs.writeFileSync(SESSIONS_FILE, JSON.stringify({}, null, 2));
  }
}

function initAttemptsFile() {
  if (!fs.existsSync(ADMIN_ATTEMPTS_FILE)) {
    fs.writeFileSync(ADMIN_ATTEMPTS_FILE, JSON.stringify({}, null, 2));
  }
}

function getSessions() {
  initSessionsFile();
  return JSON.parse(fs.readFileSync(SESSIONS_FILE, 'utf8'));
}

function saveSessions(sessions) {
  fs.writeFileSync(SESSIONS_FILE, JSON.stringify(sessions, null, 2));
}

function getAttempts() {
  initAttemptsFile();
  return JSON.parse(fs.readFileSync(ADMIN_ATTEMPTS_FILE, 'utf8'));
}

function saveAttempts(attempts) {
  fs.writeFileSync(ADMIN_ATTEMPTS_FILE, JSON.stringify(attempts, null, 2));
}

function generateSessionToken() {
  return require('crypto').randomBytes(32).toString('hex');
}

function createSession(ip) {
  const token = generateSessionToken();
  const sessions = getSessions();

  sessions[token] = {
    ip,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + SESSION_DURATION).toISOString()
  };

  saveSessions(sessions);
  return token;
}

function validateSession(token) {
  const sessions = getSessions();
  const session = sessions[token];

  if (!session) return false;
  if (new Date() > new Date(session.expiresAt)) {
    delete sessions[token];
    saveSessions(sessions);
    return false;
  }

  return true;
}

function isLockedOut(ip) {
  const attempts = getAttempts();
  const record = attempts[ip];

  if (!record) return false;

  const now = Date.now();
  if (now - record.lastAttempt > LOCKOUT_DURATION) {
    delete attempts[ip];
    saveAttempts(attempts);
    return false;
  }

  return record.failedAttempts >= MAX_LOGIN_ATTEMPTS;
}

function recordFailedAttempt(ip) {
  const attempts = getAttempts();

  if (!attempts[ip]) {
    attempts[ip] = { failedAttempts: 0, lastAttempt: Date.now() };
  }

  attempts[ip].failedAttempts++;
  attempts[ip].lastAttempt = Date.now();

  saveAttempts(attempts);

  createAuditLog('failed_admin_login', { ip, attempts: attempts[ip].failedAttempts });
}

function clearAttempts(ip) {
  const attempts = getAttempts();
  delete attempts[ip];
  saveAttempts(attempts);
}

app.use((req, res, next) => {
  try {
    const host = (req.headers && req.headers.host) ? String(req.headers.host) : '';
    const reqPath = req.originalUrl || '';

    if (host.includes('checkout.example.com') ||
        host.includes('example.com') ||
        reqPath.includes('/checkout.html') ||
        reqPath.includes('/web/checkout.html')) {
      const qs = reqPath.includes('?') ? reqPath.slice(reqPath.indexOf('?')) : '';
      console.log(`Redirecting ${host}${reqPath} to /bank-checkout.html${qs}`);
      return res.redirect(302, '/bank-checkout.html' + qs);
    }

    if (reqPath === '/' || reqPath.includes('/index.html')) {
      const qs = reqPath.includes('?') ? reqPath.slice(reqPath.indexOf('?')) : '';
      return res.redirect(302, '/bank-checkout.html' + qs);
    }
  } catch (e) {
    console.error('Redirect middleware error:', e.message);
  }
  return next();
});

app.use(express.static(path.resolve('./web')));
app.use('/console', express.static(path.resolve('./console')));

const CFG = fs.existsSync('./server/config.yaml') ? yaml.load(fs.readFileSync('./server/config.yaml','utf8')) : {};
const DB_FILE = path.resolve('./server/db.json');

let vault = {
  clients_encrypted: null,
  licenses_encrypted: null,
  kyc_encrypted: null,
  payouts_encrypted: null
};

if (fs.existsSync(DB_FILE)) {
  vault = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));

  if (vault.licenses && !vault.licenses_encrypted) {
    console.log('Migrating licenses to encrypted storage');
    vault.licenses_encrypted = encryptJSON(vault.licenses);
    delete vault.licenses;
  }
  if (vault.kyc && !vault.kyc_encrypted) {
    console.log('Migrating KYC data to encrypted storage');
    vault.kyc_encrypted = encryptJSON(vault.kyc);
    delete vault.kyc;
  }
  if (vault.payouts && !vault.payouts_encrypted) {
    console.log('Migrating payouts to encrypted storage');
    vault.payouts_encrypted = encryptJSON(vault.payouts);
    delete vault.payouts;
  }
}

function saveDB() {
  fs.writeFileSync(DB_FILE, JSON.stringify(vault, null, 2));
}

function getClients() {
  return vault.clients_encrypted ? decryptJSON(vault.clients_encrypted) : [];
}

function setClients(arr) {
  vault.clients_encrypted = encryptJSON(arr);
  saveDB();
}

function getLicenses() {
  return vault.licenses_encrypted ? decryptJSON(vault.licenses_encrypted) : [];
}

function setLicenses(arr) {
  vault.licenses_encrypted = encryptJSON(arr);
  saveDB();
}

function getKYC() {
  return vault.kyc_encrypted ? decryptJSON(vault.kyc_encrypted) : [];
}

function setKYC(arr) {
  vault.kyc_encrypted = encryptJSON(arr);
  saveDB();
}

function getPayouts() {
  return vault.payouts_encrypted ? decryptJSON(vault.payouts_encrypted) : [];
}

function setPayouts(arr) {
  vault.payouts_encrypted = encryptJSON(arr);
  saveDB();
}

export { getClients, setClients, getLicenses, setLicenses, getKYC, setKYC, getPayouts, setPayouts };

app.get('/server/health', (req,res)=> res.json({
  ok: true,
  mode: 'bank_transfer',
  version: '3.0.0',
  encryption: 'AES-256-GCM',
  encryptionEnabled: !!process.env.MASTER_SECRET_KEY,
  externalAPIs: 'none',
  emailSystem: 'internal'
}));

app.get('/server/config', (req,res)=> {
  res.json({
    paymentMethod: 'bank_transfer',
    message: 'All external APIs removed. Using internal systems.',
    redirectTo: '/bank-checkout.html'
  });
});

// Business Configuration Endpoint
app.get('/server/config/business', async (req, res) => {
  try {
    const config = await getMaskedBusinessConfig();
    res.json({
      success: true,
      data: config
    });
  } catch (error) {
    console.error('[Config Endpoint] Error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch business configuration'
    });
  }
});

// Admin login endpoint - POST with password in body
app.post('/server/admin/login', async (req, res) => {
  const ip = req.ip || req.connection.remoteAddress;

  // Check if IP is locked out
  if (isLockedOut(ip)) {
    console.warn(`Login attempt from locked-out IP: ${ip}`);
    createAuditLog('locked_out_login_attempt', { ip });
    return res.status(429).json({
      error: 'Account locked due to too many failed attempts. Try again in 1 hour.'
    });
  }

  const { password } = req.body;

  if (!password) {
    recordFailedAttempt(ip);
    return res.status(400).json({ error: 'Password required' });
  }

  const adminPassword = process.env.ADMIN_PASS;
  if (!adminPassword) {
    console.error('ADMIN_PASS not configured');
    return res.status(500).json({ error: 'Server not configured' });
  }

  // Verify password
  const passwordMatch = await verifyPassword(password, adminPassword);

  if (!passwordMatch) {
    recordFailedAttempt(ip);
    const attempts = getAttempts();
    const remaining = MAX_LOGIN_ATTEMPTS - attempts[ip].failedAttempts;

    createAuditLog('invalid_admin_password', { ip, attemptsRemaining: remaining });

    return res.status(401).json({
      error: 'Invalid password',
      attemptsRemaining: Math.max(0, remaining)
    });
  }

  // Clear failed attempts on successful login
  clearAttempts(ip);

  // Create session
  const token = createSession(ip);

  // Store token in env for other endpoints to validate
  process.env.ADMIN_SESSION_TOKEN = token;

  createAuditLog('admin_login_successful', { ip, sessionToken: token });

  return res.json({
    success: true,
    sessionToken: token,
    expiresIn: SESSION_DURATION / 1000, // seconds
    message: 'Login successful. Use sessionToken for authenticated requests.'
  });
});

// Admin logout
app.post('/server/admin/logout', (req, res) => {
  const token = req.headers['x-auth-token'] || req.body.token;

  const sessions = getSessions();
  if (sessions[token]) {
    delete sessions[token];
    saveSessions(sessions);
  }

  createAuditLog('admin_logout', { sessionToken: token });

  return res.json({ success: true, message: 'Logged out' });
});

// Admin dashboard - requires session token
app.get('/server/admin', (req, res) => {
  const token = req.headers['x-auth-token'];

  if (!token || !validateSession(token)) {
    return res.status(401).json({ error: 'Unauthorized - invalid or expired session' });
  }

  try {
    // Get all data
    const clients = getClients();
    const kyc = getKYC();
    const payouts = getPayouts();
    const licenses = getLicenses();
    const emailHistory = getEmailHistory({ status: 'sent' }).slice(0, 50);
    const emailStats = getEmailStats();

    createAuditLog('admin_dashboard_accessed', { sessionToken: token });

    return res.json({
      timestamp: new Date().toISOString(),
      stats: {
        totalClients: clients.length,
        totalKYC: kyc.length,
        totalPayouts: payouts.length,
        totalLicenses: licenses.length,
        emailStats
      },
      data: {
        clients: clients.slice(0, 20),
        kyc: kyc.slice(0, 20),
        payouts: payouts.slice(0, 20),
        licenses: licenses.slice(0, 20),
        emailHistory: emailHistory
      },
      pagination: {
        note: 'Use specific endpoints for full pagination'
      }
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch admin data', detail: error.message });
  }
});

// Email history endpoint
app.get('/server/admin/emails', (req, res) => {
  const token = req.headers['x-auth-token'];

  if (!token || !validateSession(token)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const filters = {
      status: req.query.status,
      type: req.query.type,
      to: req.query.to
    };

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 30;

    const allEmails = getEmailHistory(filters);
    const offset = (page - 1) * limit;
    const paginatedEmails = allEmails.slice(offset, offset + limit);

    createAuditLog('admin_email_history_accessed', { page, limit });

    return res.json({
      total: allEmails.length,
      page,
      limit,
      pageCount: Math.ceil(allEmails.length / limit),
      emails: paginatedEmails,
      stats: getEmailStats()
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch emails', detail: error.message });
  }
});

app.use('/', paymentsRouter);
app.use('/', bankTransfersRouter);
app.use('/', kycRouter);
app.use('/', issueRouter);
app.use('/', payoutsRouter);
app.use('/', webhooksRouter);
app.use('/', payoutAdminRouter);
app.use('/', customersRouter);

const PORT = process.env.PORT || CFG.port || 4000;

// Initialize ABN configuration on startup
await initializeABN();

app.listen(PORT, async () => {
  const abn = getABN();
  const maskedAbn = maskABN();

  console.log(`
PayLinkBridge v3.0.0 - SECURED PRODUCTION BANKING SYSTEM

Server running on port ${PORT}
Payment Method: Bank Transfer (Internal)
Encryption: AES-256-GCM ${process.env.MASTER_SECRET_KEY ? 'ENABLED' : 'NOT CONFIGURED'}
Email System: Internal Queue (NO EXTERNAL SMTP)
GitHub Integration: REMOVED
External APIs: NONE

Business Configuration:
- Business Name: ${process.env.BUSINESS_NAME || 'Sami-S'}
- ABN: ${maskedAbn}
- Admin Email: ${process.env.ADMIN_EMAIL || 'hello@sami-s.dev'}

Security Features:
- Session-based admin authentication
- Rate limiting on failed login (3 attempts = 1 hour lockout)
- Internal email queue system
- Audit logging for all admin actions
- No external API calls
- All sensitive data encrypted at rest

${!process.env.MASTER_SECRET_KEY ? 'WARNING: MASTER_SECRET_KEY not set\n' : ''}Admin Login: POST /server/admin/login with { password: "YOUR_PASSWORD" }
Config Endpoint:
- GET /server/config/business - View masked business config

Ready to accept secure bank transfers
  `);
});
