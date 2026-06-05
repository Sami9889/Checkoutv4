import fs from 'fs';
import path from 'path';
import { encryptJSON, decryptJSON } from './crypto-utils.js';

const ISSUES_FILE = path.resolve('./server/issues-internal.json');

function initIssuesDB() {
  if (!fs.existsSync(ISSUES_FILE)) {
    fs.writeFileSync(ISSUES_FILE, JSON.stringify({ issues_encrypted: null }, null, 2));
  }
}

function readIssues() {
  initIssuesDB();
  const data = JSON.parse(fs.readFileSync(ISSUES_FILE, 'utf8'));
  return data.issues_encrypted ? decryptJSON(data.issues_encrypted) : [];
}

function saveIssues(issues) {
  const encrypted = encryptJSON(issues);
  fs.writeFileSync(ISSUES_FILE, JSON.stringify({ issues_encrypted: encrypted }, null, 2));
}

export async function createInternalIssue(customer) {
  const issues = readIssues();

  const issueBody = `
New Customer Registration

Customer ID: ${customer.id}

Payment Information
- Plan: ${customer.plan}
- Amount: $${customer.amount} ${customer.currency}
- Order ID: ${customer.orderId}
- License Key: ${customer.license}

Customer Details
- Email: ${customer.paypalEmail}
- Full Name: ${customer.fullName}
- Payment Date: ${new Date(customer.createdAt).toLocaleString()}

License Status
- Status: Active
- Issued: ${customer.createdAt}

Automatically created by PayLinkBridge payment system
`;

  const issue = {
    id: `ISSUE-${Date.now()}`,
    customerId: customer.id,
    title: `New License - ${customer.plan.toUpperCase()} - ${customer.fullName}`,
    body: issueBody,
    status: 'open',
    labels: ['customer', 'license-issued'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    metadata: {
      plan: customer.plan,
      amount: customer.amount,
      currency: customer.currency,
      email: customer.paypalEmail,
      license: customer.license,
      orderId: customer.orderId
    }
  };

  issues.push(issue);
  saveIssues(issues);

  console.log(`Internal issue created: ${issue.id} for customer ${customer.id}`);

  return issue;
}

export function getInternalIssues(options = {}) {
  const issues = readIssues();

  let filtered = issues;

  if (options.status) {
    filtered = filtered.filter(issue => issue.status === options.status);
  }

  if (options.customerId) {
    filtered = filtered.filter(issue => issue.customerId === options.customerId);
  }

  if (options.label) {
    filtered = filtered.filter(issue => issue.labels.includes(options.label));
  }

  const limit = options.limit || 50;
  const offset = options.offset || 0;

  return {
    total: filtered.length,
    issues: filtered.slice(offset, offset + limit)
  };
}

export function updateInternalIssue(issueId, updates) {
  const issues = readIssues();
  const index = issues.findIndex(issue => issue.id === issueId);

  if (index === -1) {
    return null;
  }

  issues[index] = {
    ...issues[index],
    ...updates,
    updatedAt: new Date().toISOString()
  };

  saveIssues(issues);

  return issues[index];
}

export function closeInternalIssue(issueId) {
  return updateInternalIssue(issueId, { status: 'closed' });
}

export function addCommentToIssue(issueId, comment) {
  const issues = readIssues();
  const index = issues.findIndex(issue => issue.id === issueId);

  if (index === -1) {
    return null;
  }

  if (!issues[index].comments) {
    issues[index].comments = [];
  }

  const newComment = {
    id: `COMMENT-${Date.now()}`,
    body: comment.body,
    author: comment.author || 'system',
    createdAt: new Date().toISOString()
  };

  issues[index].comments.push(newComment);
  issues[index].updatedAt = new Date().toISOString();

  saveIssues(issues);

  return newComment;
}
