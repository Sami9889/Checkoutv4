import express from 'express';
import fs from 'fs';
import path from 'path';
import { encryptJSON, decryptJSON } from './crypto-utils.js';

const router = express.Router();
const EMAIL_QUEUE_FILE = path.resolve('./server/email-queue.json');

function initEmailQueue() {
  if (!fs.existsSync(EMAIL_QUEUE_FILE)) {
    fs.writeFileSync(EMAIL_QUEUE_FILE, JSON.stringify({ emails_encrypted: null }, null, 2));
  }
}

function readEmailQueue() {
  initEmailQueue();
  const data = JSON.parse(fs.readFileSync(EMAIL_QUEUE_FILE, 'utf8'));
  return data.emails_encrypted ? decryptJSON(data.emails_encrypted) : [];
}

function saveEmailQueue(emails) {
  const encrypted = encryptJSON(emails);
  fs.writeFileSync(EMAIL_QUEUE_FILE, JSON.stringify({ emails_encrypted: encrypted }, null, 2));
}

export function queueEmail(emailData) {
  const emails = readEmailQueue();

  const emailEntry = {
    id: `EMAIL-${Date.now()}`,
    to: emailData.to,
    subject: emailData.subject,
    html: emailData.html,
    from: emailData.from || process.env.SMTP_FROM || 'noreply@system.local',
    status: 'pending',
    queuedAt: new Date().toISOString(),
    sentAt: null,
    attempts: 0,
    lastError: null
  };

  emails.push(emailEntry);
  saveEmailQueue(emails);

  console.log(`Email queued: ${emailEntry.id} to ${emailEntry.to}`);

  return emailEntry;
}

export function getQueuedEmails(options = {}) {
  const emails = readEmailQueue();

  let filtered = emails;

  if (options.status) {
    filtered = filtered.filter(email => email.status === options.status);
  }

  if (options.to) {
    filtered = filtered.filter(email => email.to === options.to);
  }

  const limit = options.limit || 50;
  const offset = options.offset || 0;

  return {
    total: filtered.length,
    emails: filtered.slice(offset, offset + limit)
  };
}

export function markEmailAsSent(emailId) {
  const emails = readEmailQueue();
  const index = emails.findIndex(email => email.id === emailId);

  if (index === -1) {
    return null;
  }

  emails[index].status = 'sent';
  emails[index].sentAt = new Date().toISOString();

  saveEmailQueue(emails);

  return emails[index];
}

export function markEmailAsFailed(emailId, error) {
  const emails = readEmailQueue();
  const index = emails.findIndex(email => email.id === emailId);

  if (index === -1) {
    return null;
  }

  emails[index].status = 'failed';
  emails[index].attempts += 1;
  emails[index].lastError = error;

  saveEmailQueue(emails);

  return emails[index];
}

router.get('/server/email-queue', (req, res) => {
  const pass = req.query.pass;
  if (!pass || pass !== process.env.ADMIN_PASS) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const status = req.query.status;
  const limit = parseInt(req.query.limit) || 50;
  const offset = parseInt(req.query.offset) || 0;

  const result = getQueuedEmails({ status, limit, offset });

  res.json(result);
});

router.post('/server/email-queue/mark-sent', (req, res) => {
  const { emailId, adminPass } = req.body;

  if (!adminPass || adminPass !== process.env.ADMIN_PASS) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!emailId) {
    return res.status(400).json({ error: 'Email ID required' });
  }

  const email = markEmailAsSent(emailId);

  if (!email) {
    return res.status(404).json({ error: 'Email not found' });
  }

  res.json({ success: true, email });
});

router.post('/server/email-queue/mark-failed', (req, res) => {
  const { emailId, error, adminPass } = req.body;

  if (!adminPass || adminPass !== process.env.ADMIN_PASS) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!emailId) {
    return res.status(400).json({ error: 'Email ID required' });
  }

  const email = markEmailAsFailed(emailId, error);

  if (!email) {
    return res.status(404).json({ error: 'Email not found' });
  }

  res.json({ success: true, email });
});

export default router;
