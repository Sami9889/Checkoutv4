import express from 'express';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { createAuditLog } from './customers.js';

const router = express.Router();
const DATA = path.resolve('./server/issue_requests.json');

if (!fs.existsSync(DATA)) fs.writeFileSync(DATA, '[]');

function readDB() {
  return JSON.parse(fs.readFileSync(DATA, 'utf8'));
}

function saveDB(a) {
  fs.writeFileSync(DATA, JSON.stringify(a, null, 2));
}

router.post('/server/issue', async (req, res) => {
  const { issue_number, issue_url, plan, amount, currency, paypal_email, fullName, date_of_birth, note } = req.body;

  if (!paypal_email || !plan || !amount || !date_of_birth) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const rec = {
      id: 'ISS-' + crypto.randomBytes(6).toString('hex').toUpperCase(),
      issue_number,
      issue_url,
      plan,
      amount: Number(amount),
      currency,
      paypal_email,
      fullName,
      date_of_birth,
      note,
      status: 'received',
      created_at: new Date().toISOString()
    };

    const arr = readDB();
    arr.push(rec);
    saveDB(arr);

    // Log to audit trail
    createAuditLog('issue_created', {
      issueId: rec.id,
      email: rec.paypal_email,
      plan: rec.plan,
      amount: rec.amount
    });

    res.status(201).json({
      message: 'Issue recorded in internal system',
      request: rec,
      note: 'No external APIs used. Record stored internally.'
    });
  } catch (e) {
    console.error('Issue recording failed:', e.message);
    createAuditLog('issue_creation_failed', { error: e.message });
    res.status(500).json({ error: 'Failed to record issue', detail: e.message });
  }
});

export default router;
