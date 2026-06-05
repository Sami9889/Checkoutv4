import fs from 'fs';
import path from 'path';
import { encryptJSON, decryptJSON } from './crypto-utils.js';

const AUDIT_LOG_FILE = path.resolve('./server/audit-log.json');

function initAuditLog() {
  if (!fs.existsSync(AUDIT_LOG_FILE)) {
    fs.writeFileSync(AUDIT_LOG_FILE, JSON.stringify({ logs_encrypted: null }, null, 2));
  }
}

function readAuditLog() {
  initAuditLog();
  const data = JSON.parse(fs.readFileSync(AUDIT_LOG_FILE, 'utf8'));
  return data.logs_encrypted ? decryptJSON(data.logs_encrypted) : [];
}

function saveAuditLog(logs) {
  const encrypted = encryptJSON(logs);
  fs.writeFileSync(AUDIT_LOG_FILE, JSON.stringify({ logs_encrypted: encrypted }, null, 2));
}

export function logAuditEvent(event) {
  const logs = readAuditLog();

  const auditEntry = {
    id: `AUDIT-${Date.now()}`,
    timestamp: new Date().toISOString(),
    action: event.action,
    userId: event.userId || 'system',
    ipAddress: event.ipAddress || 'unknown',
    userAgent: event.userAgent || 'unknown',
    resource: event.resource || null,
    details: event.details || {},
    success: event.success !== false,
    errorMessage: event.errorMessage || null
  };

  logs.push(auditEntry);

  if (logs.length > 10000) {
    logs.shift();
  }

  saveAuditLog(logs);

  console.log(`[AUDIT] ${auditEntry.action} by ${auditEntry.userId} - ${auditEntry.success ? 'SUCCESS' : 'FAILED'}`);

  return auditEntry;
}

export function getAuditLogs(options = {}) {
  const logs = readAuditLog();

  let filtered = logs;

  if (options.action) {
    filtered = filtered.filter(log => log.action === options.action);
  }

  if (options.userId) {
    filtered = filtered.filter(log => log.userId === options.userId);
  }

  if (options.startDate) {
    filtered = filtered.filter(log => new Date(log.timestamp) >= new Date(options.startDate));
  }

  if (options.endDate) {
    filtered = filtered.filter(log => new Date(log.timestamp) <= new Date(options.endDate));
  }

  if (options.success !== undefined) {
    filtered = filtered.filter(log => log.success === options.success);
  }

  const limit = options.limit || 100;
  const offset = options.offset || 0;

  return {
    total: filtered.length,
    logs: filtered.slice(offset, offset + limit)
  };
}

export function clearOldAuditLogs(daysToKeep = 90) {
  const logs = readAuditLog();
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

  const filtered = logs.filter(log => new Date(log.timestamp) >= cutoffDate);

  const removedCount = logs.length - filtered.length;

  if (removedCount > 0) {
    saveAuditLog(filtered);
    console.log(`[AUDIT] Cleared ${removedCount} old audit logs`);
  }

  return removedCount;
}
