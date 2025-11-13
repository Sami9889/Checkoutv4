import express from 'express';
import fs from 'fs';
import path from 'path';
import { randomToken } from './crypto-utils.js';
import { sendLicenseEmail, sendPaymentConfirmation, sendAdminNotification } from './email-service.js';
import { recordCustomer, createGitHubIssue } from './customers.js';

const router = express.Router();
const DB = './server/db.json';

function readDB() { return JSON.parse(fs.readFileSync(DB, 'utf8')); }
function saveDB(d) { fs.writeFileSync(DB, JSON.stringify(d, null, 2)); }

// Bank account details (from .env)
const BANK_ACCOUNT = {
  name: 'SAMRATH SINGH',
  number: '4760652',
  bsb: '062948',
  address: '2 ZUCCOTTI CRES, POINT COOK VIC 3030',
  swift: 'CTBAAU2S',
  bank: 'Commonwealth Bank (Australia)'
};

// Payment plans with bank transfer amounts
const PLANS = {
  starter: { price: 10.00, name: 'Starter Plan', currency: 'AUD', duration: '30 days' },
  basic: { price: 25.00, name: 'Basic Plan', currency: 'AUD', duration: '90 days' },
  pro: { price: 99.00, name: 'Pro Plan', currency: 'AUD', duration: '1 year' }
};

/**
 * Create a bank transfer request
 * Returns unique payment code that customer sends via bank transfer
 */
router.post('/server/create-bank-transfer', async (req, res) => {
  const { email, fullName, plan } = req.body;

  if (!email || !fullName || !plan) {
    return res.status(400).json({ error: 'Missing required fields: email, fullName, plan' });
  }

  if (!PLANS[plan]) {
    return res.status(400).json({ error: 'Invalid plan: ' + plan });
  }

  try {
    const db = readDB();
    db.bankTransfers = db.bankTransfers || [];

    // Generate unique payment code (8 chars)
    const paymentCode = 'PAY' + randomToken(5).toUpperCase();
    const amount = PLANS[plan].price;

    // Create transfer record
    const transfer = {
      id: 'TXFR-' + randomToken(6).toUpperCase(),
      paymentCode,
      email,
      fullName,
      plan,
      amount,
      currency: PLANS[plan].currency,
      bankAccount: BANK_ACCOUNT,
      status: 'pending', // pending, completed, verified
      createdAt: new Date().toISOString(),
      completedAt: null,
      license: null,
      customerId: null
    };

    db.bankTransfers.push(transfer);
    saveDB(db);

    console.log(`✅ Bank transfer request created: ${paymentCode} - ${fullName} ($${amount})`);

    return res.json({
      success: true,
      paymentCode,
      transferId: transfer.id,
      amount,
      bankAccount: BANK_ACCOUNT,
      instructions: {
        step1: `Use payment code: ${paymentCode}`,
        step2: `Transfer: $${amount.toFixed(2)} AUD`,
        step3: 'Include payment code in bank transfer reference',
        step4: 'Screenshot proof of transfer (we verify manually)'
      }
    });
  } catch (e) {
    console.error('Bank transfer creation error:', e.message);
    res.status(500).json({ error: 'Failed to create bank transfer', detail: e.message });
  }
});

/**
 * Verify and mark a bank transfer as completed
 * Admin verifies the transfer was received and marks as completed
 */
router.post('/server/verify-bank-transfer', async (req, res) => {
  const { paymentCode, adminPass } = req.body;

  if (!adminPass || adminPass !== process.env.ADMIN_PASS) {
    return res.status(401).json({ error: 'Invalid admin password' });
  }

  if (!paymentCode) {
    return res.status(400).json({ error: 'Missing payment code' });
  }

  try {
    const db = readDB();
    db.bankTransfers = db.bankTransfers || [];
    db.licenses = db.licenses || [];

    // Find the transfer
    const transfer = db.bankTransfers.find(t => t.paymentCode === paymentCode);
    if (!transfer) {
      return res.status(404).json({ error: 'Transfer not found: ' + paymentCode });
    }

    if (transfer.status === 'completed') {
      return res.status(400).json({ error: 'Transfer already completed' });
    }

    // Generate license
    const license = 'LIC-' + randomToken(6).toUpperCase();

    // Create license record
    const licenseRecord = {
      license,
      paymentCode,
      transferId: transfer.id,
      plan: transfer.plan,
      email: transfer.email,
      amount: transfer.amount,
      status: 'active',
      transfer_status: 'completed',
      created_at: new Date().toISOString(),
      verified_at: new Date().toISOString()
    };

    db.licenses.push(licenseRecord);

    // Mark transfer as completed
    transfer.status = 'completed';
    transfer.completedAt = new Date().toISOString();
    transfer.license = license;

    saveDB(db);

    // Send license email
    await sendLicenseEmail(transfer.email, license, transfer.plan, transfer.id);

    // Send admin notification
    await sendAdminNotification(transfer.plan, transfer.amount, transfer.email, transfer.id);

    // Record customer
    const customerRecord = await recordCustomer({
      email: transfer.email,
      fullName: transfer.fullName,
      plan: transfer.plan,
      amount: transfer.amount,
      currency: transfer.currency,
      license,
      orderId: transfer.id,
      paymentMethod: 'bank-transfer',
      paymentCode
    });

    transfer.customerId = customerRecord.id;
    saveDB(db);

    // Create GitHub issue (async)
    if (process.env.GITHUB_TOKEN) {
      createGitHubIssue(customerRecord).catch(err =>
        console.error('GitHub issue creation failed:', err.message)
      );
    }

    console.log(`✅ Bank transfer verified: ${paymentCode} - License: ${license}`);

    return res.json({
      success: true,
      license,
      customerId: customerRecord.id,
      message: 'Transfer verified and license sent to customer email'
    });
  } catch (e) {
    console.error('Verification error:', e.message);
    res.status(500).json({ error: 'Verification failed', detail: e.message });
  }
});

/**
 * Get all pending bank transfers (admin)
 */
router.get('/server/bank-transfers', (req, res) => {
  const pass = req.query.pass || req.headers['x-admin-pass'];
  if (!pass || pass !== process.env.ADMIN_PASS) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const db = readDB();
    const transfers = db.bankTransfers || [];

    // Group by status
    const pending = transfers.filter(t => t.status === 'pending');
    const completed = transfers.filter(t => t.status === 'completed');

    return res.json({
      summary: {
        total: transfers.length,
        pending: pending.length,
        completed: completed.length,
        totalPending: pending.reduce((sum, t) => sum + t.amount, 0)
      },
      pending,
      completed
    });
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch transfers', detail: e.message });
  }
});

/**
 * Get transfer details by payment code
 */
router.get('/server/transfer/:code', (req, res) => {
  const { code } = req.params;

  try {
    const db = readDB();
    const transfers = db.bankTransfers || [];
    const transfer = transfers.find(t => t.paymentCode === code);

    if (!transfer) {
      return res.status(404).json({ error: 'Transfer not found' });
    }

    // Don't expose email or full name publicly
    const safe = {
      paymentCode: transfer.paymentCode,
      plan: transfer.plan,
      amount: transfer.amount,
      status: transfer.status,
      createdAt: transfer.createdAt
    };

    return res.json(safe);
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch transfer', detail: e.message });
  }
});

/**
 * Get bank account details (public)
 */
router.get('/server/bank-account', (req, res) => {
  return res.json({
    name: BANK_ACCOUNT.name,
    number: BANK_ACCOUNT.number,
    bsb: BANK_ACCOUNT.bsb,
    address: BANK_ACCOUNT.address,
    swift: BANK_ACCOUNT.swift,
    bank: BANK_ACCOUNT.bank,
    currency: 'AUD'
  });
});

/**
 * Get available plans and prices
 */
router.get('/server/plans', (req, res) => {
  return res.json({
    plans: PLANS,
    currency: 'AUD',
    bankAccount: {
      name: BANK_ACCOUNT.name,
      bsb: BANK_ACCOUNT.bsb,
      number: BANK_ACCOUNT.number,
      bank: BANK_ACCOUNT.bank
    }
  });
});

export default router;
