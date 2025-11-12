import express from 'express';
import fs from 'fs';
import { BANK_DETAILS, FEES, calculatePayout, recordPayout, generatePayoutReport } from './bank-config.js';

const router = express.Router();
const DB = './server/db.json';

function readDB() { return JSON.parse(fs.readFileSync(DB, 'utf8')); }
function saveDB(d) { fs.writeFileSync(DB, JSON.stringify(d, null, 2)); }

// Get payout report for your bank account
router.get('/server/admin/payouts-report', (req, res) => {
  const pass = req.query.admin_pass || req.headers['x-admin-pass'];
  if (!pass || pass !== process.env.ADMIN_PASS) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const db = readDB();
    const payouts = db.payouts || [];
    
    // Filter for processed payouts to your account
    const processedPayouts = payouts.filter(p => 
      p.status === 'processed' || p.status === 'transferred'
    );
    
    const report = generatePayoutReport(processedPayouts);
    
    return res.json({
      success: true,
      ...report,
      lastUpdated: new Date().toISOString()
    });
  } catch (e) {
    console.error('Payout report error:', e.message);
    res.status(500).json({ error: 'Failed to generate report' });
  }
});

// Get your bank details
router.get('/server/admin/bank-details', (req, res) => {
  const pass = req.query.admin_pass || req.headers['x-admin-pass'];
  if (!pass || pass !== process.env.ADMIN_PASS) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  return res.json({
    success: true,
    bankDetails: BANK_DETAILS,
    feeStructure: FEES
  });
});

// Track payment to payout conversion
router.post('/server/admin/track-payment', (req, res) => {
  const pass = req.query.admin_pass || req.headers['x-admin-pass'];
  if (!pass || pass !== process.env.ADMIN_PASS) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const { orderId, amount, email, plan } = req.body;
    
    if (!orderId || !amount) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const db = readDB();
    db.payouts = db.payouts || [];
    
    const payout = recordPayout({ orderId, amount, email, plan });
    db.payouts.push(payout);
    saveDB(db);

    return res.json({
      success: true,
      payout: payout,
      message: `Payment recorded. Will be transferred to ${BANK_DETAILS.accountName} (${BANK_DETAILS.accountNumber})`
    });
  } catch (e) {
    console.error('Track payment error:', e.message);
    res.status(500).json({ error: 'Failed to track payment' });
  }
});

// Get all payouts to your account
router.get('/server/admin/all-payouts', (req, res) => {
  const pass = req.query.admin_pass || req.headers['x-admin-pass'];
  if (!pass || pass !== process.env.ADMIN_PASS) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const db = readDB();
    const payouts = db.payouts || [];
    
    const summary = {
      total: payouts.length,
      pending: payouts.filter(p => p.status === 'pending_transfer').length,
      processed: payouts.filter(p => p.status === 'processed').length,
      transferred: payouts.filter(p => p.status === 'transferred').length,
      payouts: payouts,
      bankAccount: BANK_DETAILS
    };

    return res.json(summary);
  } catch (e) {
    console.error('Get payouts error:', e.message);
    res.status(500).json({ error: 'Failed to retrieve payouts' });
  }
});

// Mark payout as transferred to bank
router.post('/server/admin/mark-transferred', (req, res) => {
  const pass = req.query.admin_pass || req.headers['x-admin-pass'];
  if (!pass || pass !== process.env.ADMIN_PASS) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const { payoutId } = req.body;
    if (!payoutId) {
      return res.status(400).json({ error: 'Missing payoutId' });
    }

    const db = readDB();
    const payout = db.payouts.find(p => p.id === payoutId);
    
    if (!payout) {
      return res.status(404).json({ error: 'Payout not found' });
    }

    payout.status = 'transferred';
    payout.transferredAt = new Date().toISOString();
    payout.transferReference = 'REF-' + Date.now();
    
    saveDB(db);

    return res.json({
      success: true,
      payout: payout,
      message: `Payout marked as transferred to ${BANK_DETAILS.accountName}`
    });
  } catch (e) {
    console.error('Mark transferred error:', e.message);
    res.status(500).json({ error: 'Failed to mark payout' });
  }
});

// Get fee breakdown for a payment amount
router.post('/server/fees', (req, res) => {
  try {
    const { amount } = req.body;
    
    if (!amount) {
      return res.status(400).json({ error: 'Missing amount' });
    }

    const breakdown = calculatePayout(amount);
    
    return res.json({
      success: true,
      amount: breakdown.originalAmount,
      breakdown: {
        paypalPercentageFee: breakdown.paypalPercentageFee,
        paypalFixedFee: breakdown.paypalFixedFee,
        totalFees: breakdown.totalFees
      },
      youReceive: breakdown.payoutAmount,
      bankAccount: BANK_DETAILS.accountNumber
    });
  } catch (e) {
    console.error('Fee calculation error:', e.message);
    res.status(500).json({ error: 'Failed to calculate fees' });
  }
});

export default router;
