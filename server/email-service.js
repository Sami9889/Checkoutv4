import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'crypto';

const EMAIL_QUEUE_FILE = path.resolve('./server/emails.json');
const EMAIL_TEMPLATES = {
  license: (data) => ({
    subject: `Your License Key - ${data.plan} Plan`,
    html: `
      <h2>Payment Successful</h2>
      <p>Thank you for your purchase.</p>

      <div style="background: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
        <p><strong>License Key:</strong></p>
        <p style="font-family: monospace; font-size: 14px; word-break: break-all;">
          ${data.licenseKey}
        </p>
      </div>

      <p><strong>Order Details:</strong></p>
      <ul>
        <li>Plan: ${data.plan}</li>
        <li>Order ID: ${data.orderId}</li>
        <li>Date: ${new Date().toISOString()}</li>
      </ul>

      <p>Keep your license key safe. You will need it for activation.</p>
      <p>If you have any questions, contact support.</p>
    `
  }),
  payment_confirmation: (data) => ({
    subject: 'Payment Confirmation',
    html: `
      <h2>Payment Confirmation</h2>
      <p>Thank you for your order.</p>

      <div style="background: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
        <p><strong>Plan:</strong> ${data.plan}</p>
        <p><strong>Amount:</strong> $${Number(data.amount).toFixed(2)} ${data.currency || 'AUD'}</p>
        <p><strong>Order ID:</strong> ${data.orderId}</p>
      </div>

      <p>Your license will be delivered shortly.</p>
    `
  }),
  admin_notification: (data) => ({
    subject: `New Payment - ${data.plan} Plan`,
    html: `
      <h2>New Payment Received</h2>

      <div style="background: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
        <p><strong>Customer Email:</strong> ${data.email}</p>
        <p><strong>Plan:</strong> ${data.plan}</p>
        <p><strong>Amount:</strong> $${Number(data.amount).toFixed(2)} ${data.currency || 'AUD'}</p>
        <p><strong>Order ID:</strong> ${data.orderId}</p>
        <p><strong>Date:</strong> ${new Date().toISOString()}</p>
      </div>

      <p><a href="${process.env.PAYLINK_SELF_URL || 'http://localhost:4000'}/server/admin">View Admin Dashboard</a></p>
    `
  })
};

function initEmailQueue() {
  if (!fs.existsSync(EMAIL_QUEUE_FILE)) {
    fs.writeFileSync(EMAIL_QUEUE_FILE, JSON.stringify([], null, 2));
  }
}

function readEmailQueue() {
  initEmailQueue();
  return JSON.parse(fs.readFileSync(EMAIL_QUEUE_FILE, 'utf8'));
}

function saveEmailQueue(emails) {
  fs.writeFileSync(EMAIL_QUEUE_FILE, JSON.stringify(emails, null, 2));
}

export async function queueEmail(to, subject, body, type = 'notification', data = {}) {
  const queue = readEmailQueue();

  const email = {
    id: uuidv4(),
    to,
    subject,
    body,
    type,
    status: 'pending',
    createdAt: new Date().toISOString(),
    sentAt: null,
    retries: 0,
    maxRetries: 3,
    metadata: data
  };

  queue.push(email);
  saveEmailQueue(queue);

  console.log(`Email queued: ${email.id} to ${to}`);
  return email;
}

export async function sendLicenseEmail(to, licenseKey, plan, orderId) {
  try {
    const template = EMAIL_TEMPLATES.license({ licenseKey, plan, orderId });
    const email = await queueEmail(to, template.subject, template.html, 'license', { plan, orderId });

    // Mark as sent immediately for internal system
    const queue = readEmailQueue();
    const idx = queue.findIndex(e => e.id === email.id);
    if (idx >= 0) {
      queue[idx].status = 'sent';
      queue[idx].sentAt = new Date().toISOString();
      saveEmailQueue(queue);
    }

    console.log('License email queued:', to);
    return { success: true, messageId: email.id };
  } catch (error) {
    console.error('Email queue failed:', error.message);
    return { success: false, error: error.message };
  }
}

export async function sendPaymentConfirmation(to, plan, amount, orderId) {
  try {
    const template = EMAIL_TEMPLATES.payment_confirmation({ plan, amount, orderId });
    const email = await queueEmail(to, template.subject, template.html, 'payment', { plan, amount, orderId });

    // Mark as sent immediately for internal system
    const queue = readEmailQueue();
    const idx = queue.findIndex(e => e.id === email.id);
    if (idx >= 0) {
      queue[idx].status = 'sent';
      queue[idx].sentAt = new Date().toISOString();
      saveEmailQueue(queue);
    }

    console.log('Confirmation email queued:', to);
    return { success: true, messageId: email.id };
  } catch (error) {
    console.error('Email queue failed:', error.message);
    return { success: false, error: error.message };
  }
}

export async function sendAdminNotification(plan, amount, email, orderId) {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) {
    console.warn('ADMIN_EMAIL not configured - skipping admin notification');
    return { success: false, error: 'Admin email not configured' };
  }

  try {
    const template = EMAIL_TEMPLATES.admin_notification({ plan, amount, email, orderId });
    const emailRecord = await queueEmail(adminEmail, template.subject, template.html, 'admin_notification', { plan, amount, email, orderId });

    // Mark as sent immediately for internal system
    const queue = readEmailQueue();
    const idx = queue.findIndex(e => e.id === emailRecord.id);
    if (idx >= 0) {
      queue[idx].status = 'sent';
      queue[idx].sentAt = new Date().toISOString();
      saveEmailQueue(queue);
    }

    console.log('Admin notification queued');
    return { success: true, messageId: emailRecord.id };
  } catch (error) {
    console.error('Admin email queue failed:', error.message);
    return { success: false, error: error.message };
  }
}

export function getEmailHistory(filters = {}) {
  const queue = readEmailQueue();

  let results = queue;

  if (filters.status) {
    results = results.filter(e => e.status === filters.status);
  }

  if (filters.type) {
    results = results.filter(e => e.type === filters.type);
  }

  if (filters.to) {
    results = results.filter(e => e.to === filters.to);
  }

  // Return latest first
  return results.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

export function renderEmailTemplate(type, data) {
  if (EMAIL_TEMPLATES[type]) {
    return EMAIL_TEMPLATES[type](data);
  }

  return {
    subject: 'Notification',
    html: '<p>Notification</p>'
  };
}

export function getEmailStats() {
  const queue = readEmailQueue();

  return {
    total: queue.length,
    pending: queue.filter(e => e.status === 'pending').length,
    sent: queue.filter(e => e.status === 'sent').length,
    failed: queue.filter(e => e.status === 'failed').length,
    byType: {
      license: queue.filter(e => e.type === 'license').length,
      payment: queue.filter(e => e.type === 'payment').length,
      admin_notification: queue.filter(e => e.type === 'admin_notification').length,
      notification: queue.filter(e => e.type === 'notification').length
    }
  };
}

export default {
  queueEmail,
  sendLicenseEmail,
  sendPaymentConfirmation,
  sendAdminNotification,
  getEmailHistory,
  renderEmailTemplate,
  getEmailStats
};
