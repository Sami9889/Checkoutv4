import express from 'express';
import fs from 'fs';
import path from 'path';

const router = express.Router();

const CUSTOMERS_DB = path.resolve('./server/customers.json');
const AUDIT_LOG_DB = path.resolve('./server/audit-log.json');

function initCustomersDB() {
  if (!fs.existsSync(CUSTOMERS_DB)) {
    fs.writeFileSync(CUSTOMERS_DB, JSON.stringify([], null, 2));
  }
}

function initAuditLog() {
  if (!fs.existsSync(AUDIT_LOG_DB)) {
    fs.writeFileSync(AUDIT_LOG_DB, JSON.stringify([], null, 2));
  }
}

function readCustomers() {
  initCustomersDB();
  return JSON.parse(fs.readFileSync(CUSTOMERS_DB, 'utf8'));
}

function saveCustomers(data) {
  fs.writeFileSync(CUSTOMERS_DB, JSON.stringify(data, null, 2));
}

function readAuditLog() {
  initAuditLog();
  return JSON.parse(fs.readFileSync(AUDIT_LOG_DB, 'utf8'));
}

function saveAuditLog(data) {
  fs.writeFileSync(AUDIT_LOG_DB, JSON.stringify(data, null, 2));
}

export async function recordCustomer(paymentData) {
  const customers = readCustomers();

  const customer = {
    id: `CUST-${Date.now()}`,
    paypalEmail: paymentData.email,
    fullName: paymentData.fullName || 'Unknown',
    dateOfBirth: paymentData.dateOfBirth || null,
    plan: paymentData.plan,
    amount: paymentData.amount,
    currency: paymentData.currency || 'AUD',
    license: paymentData.license,
    orderId: paymentData.orderId,
    status: 'active',
    createdAt: new Date().toISOString(),
    internalIssueCreated: false
  };

  customers.push(customer);
  saveCustomers(customers);

  // Log to audit trail
  createAuditLog('customer_recorded', {
    customerId: customer.id,
    email: customer.paypalEmail,
    plan: customer.plan,
    amount: customer.amount
  });

  return customer;
}

export async function createInternalIssue(customer) {
  try {
    const auditLog = readAuditLog();

    const issue = {
      id: `ISSUE-${Date.now()}`,
      customerId: customer.id,
      type: 'customer_registration',
      status: 'registered',
      title: `New License - ${customer.plan.toUpperCase()} - ${customer.fullName}`,
      data: {
        customerId: customer.id,
        plan: customer.plan,
        amount: customer.amount,
        currency: customer.currency,
        email: customer.paypalEmail,
        fullName: customer.fullName,
        license: customer.license,
        orderId: customer.orderId,
        registeredAt: customer.createdAt,
        status: 'active'
      },
      createdAt: new Date().toISOString(),
      internalTracking: true
    };

    auditLog.push(issue);
    saveAuditLog(auditLog);

    // Update customer record
    const customers = readCustomers();
    const custIdx = customers.findIndex(c => c.id === customer.id);
    if (custIdx >= 0) {
      customers[custIdx].internalIssueCreated = true;
    }
    saveCustomers(customers);

    console.log(`Internal issue created: ${issue.id} for customer ${customer.id}`);
    return issue;
  } catch (error) {
    console.error('Failed to create internal issue:', error.message);
    return null;
  }
}

export function createAuditLog(action, data = {}) {
  const log = readAuditLog();

  const entry = {
    id: `LOG-${Date.now()}`,
    action,
    data,
    timestamp: new Date().toISOString(),
    source: 'system'
  };

  log.push(entry);
  saveAuditLog(log);

  console.log(`Audit log: ${action}`, data);
  return entry;
}

router.get('/server/customers', (req, res) => {
  const token = req.query.token || req.headers['x-auth-token'];

  // Verify token is set and matches session
  if (!token || !process.env.ADMIN_SESSION_TOKEN || token !== process.env.ADMIN_SESSION_TOKEN) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const customers = readCustomers();
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const paginatedCustomers = customers.slice(offset, offset + limit);

    res.json({
      total: customers.length,
      page,
      limit,
      pageCount: Math.ceil(customers.length / limit),
      customers: paginatedCustomers
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch customers', detail: error.message });
  }
});

router.get('/server/customers/:id', (req, res) => {
  const token = req.query.token || req.headers['x-auth-token'];

  if (!token || !process.env.ADMIN_SESSION_TOKEN || token !== process.env.ADMIN_SESSION_TOKEN) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const customers = readCustomers();
    const customer = customers.find(c => c.id === req.params.id);

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    res.json(customer);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch customer', detail: error.message });
  }
});

router.get('/server/audit-log', (req, res) => {
  const token = req.query.token || req.headers['x-auth-token'];

  if (!token || !process.env.ADMIN_SESSION_TOKEN || token !== process.env.ADMIN_SESSION_TOKEN) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const logs = readAuditLog();
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;

    const paginatedLogs = logs
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(offset, offset + limit);

    res.json({
      total: logs.length,
      page,
      limit,
      pageCount: Math.ceil(logs.length / limit),
      logs: paginatedLogs
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch audit log', detail: error.message });
  }
});

export default router;
