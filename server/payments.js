import express from 'express';
import fs from 'fs';
import { randomToken } from './crypto-utils.js';
import { calculatePayout } from './bank-config.js';
import { sendLicenseEmail, sendPaymentConfirmation, sendAdminNotification } from './email-service.js';
import { recordCustomer, createInternalIssue } from './customers.js';

const router = express.Router();
const DB = './server/db.json';

function readDB() {
  return JSON.parse(fs.readFileSync(DB, 'utf8'));
}

function saveDB(d) {
  fs.writeFileSync(DB, JSON.stringify(d, null, 2));
}

router.post('/server/create-order', async (req, res) => {
  return res.status(410).json({
    error: 'PayPal integration removed',
    message: 'PayPal payment processing has been disabled',
    redirectTo: '/bank-transfer.html'
  });
});

router.post('/server/capture-order', async (req, res) => {
  return res.status(410).json({
    error: 'PayPal integration removed',
    message: 'PayPal payment processing has been disabled',
    redirectTo: '/bank-transfer.html'
  });
});

router.post('/server/confirm-bank-transfer', async (req, res) => {
  const { transferReference, payerEmail, plan, amount, fullName, dateOfBirth } = req.body;

  if (!transferReference || !payerEmail || !amount) {
    return res.status(400).json({
      error: 'Missing required fields',
      required: ['transferReference', 'payerEmail', 'amount']
    });
  }

  try {
    const db = readDB();
    db.licenses = db.licenses || [];

    const license = 'LIC-' + randomToken(6).toUpperCase();
    const payoutCalc = calculatePayout(amount);

    const licenseRecord = {
      license,
      transferReference,
      plan: plan || 'one-time',
      email: payerEmail,
      amount,
      status: 'pending_verification',
      payment_method: 'bank_transfer',
      created_at: new Date().toISOString(),
      fees: payoutCalc
    };

    db.licenses.push(licenseRecord);
    saveDB(db);

    await sendLicenseEmail(payerEmail, license, plan, transferReference);
    await sendAdminNotification(plan, amount, payerEmail, transferReference);

    const customerRecord = await recordCustomer({
      email: payerEmail,
      fullName: fullName || 'Unknown',
      dateOfBirth: dateOfBirth || null,
      plan,
      amount,
      currency: 'AUD',
      license,
      orderId: transferReference
    });

    console.log(`Bank transfer recorded: ${customerRecord.id}`);

    // Create internal issue for tracking (no external APIs)
    createInternalIssue(customerRecord).catch(err =>
      console.error('Internal issue creation failed:', err.message)
    );

    return res.json({
      success: true,
      license,
      transferReference,
      customerId: customerRecord.id,
      status: 'pending_verification',
      message: 'Transfer recorded. License will be activated once payment is verified.',
      fees: payoutCalc
    });
  } catch (e) {
    console.error('Bank transfer confirmation error:', e.message);
    res.status(500).json({
      error: 'Failed to process bank transfer',
      detail: e.message
    });
  }
});

export default router;
