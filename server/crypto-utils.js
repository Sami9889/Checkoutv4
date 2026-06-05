import crypto from 'crypto';
import bcrypt from 'bcrypt';

const MASTER_KEY = process.env.MASTER_SECRET_KEY || '';
const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32;
const IV_LENGTH = 16;
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;

function deriveKey(masterKey, salt) {
  if (!masterKey) {
    throw new Error('MASTER_SECRET_KEY not configured');
  }
  return crypto.scryptSync(masterKey, salt, KEY_LENGTH);
}

export function encryptJSON(obj) {
  try {
    const salt = crypto.randomBytes(SALT_LENGTH);
    const iv = crypto.randomBytes(IV_LENGTH);
    const key = deriveKey(MASTER_KEY, salt);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    const jsonString = JSON.stringify(obj);
    let encrypted = cipher.update(jsonString, 'utf8', 'base64');
    encrypted += cipher.final('base64');
    const authTag = cipher.getAuthTag();

    return {
      encrypted: encrypted,
      iv: iv.toString('base64'),
      salt: salt.toString('base64'),
      authTag: authTag.toString('base64'),
      version: '1'
    };
  } catch (error) {
    console.error('Encryption error:', error.message);
    throw new Error('Failed to encrypt data');
  }
}

export function decryptJSON(blob) {
  try {
    if (!blob || typeof blob !== 'object' || !blob.encrypted) {
      console.warn('Attempting to decrypt unencrypted data');
      return blob;
    }

    const { encrypted, iv, salt, authTag } = blob;
    const ivBuffer = Buffer.from(iv, 'base64');
    const saltBuffer = Buffer.from(salt, 'base64');
    const authTagBuffer = Buffer.from(authTag, 'base64');
    const key = deriveKey(MASTER_KEY, saltBuffer);
    const decipher = crypto.createDecipheriv(ALGORITHM, key, ivBuffer);
    decipher.setAuthTag(authTagBuffer);

    let decrypted = decipher.update(encrypted, 'base64', 'utf8');
    decrypted += decipher.final('utf8');

    return JSON.parse(decrypted);
  } catch (error) {
    console.error('Decryption error:', error.message);
    throw new Error('Failed to decrypt data');
  }
}

export function randomToken(len = 16) {
  return crypto.randomBytes(len).toString('hex');
}

export async function hashSecret(s) {
  return await bcrypt.hash(s, 10);
}

export async function hashPassword(password) {
  return await bcrypt.hash(password, 10);
}

export async function verifyPassword(password, hash) {
  try {
    return await bcrypt.compare(password, hash);
  } catch (error) {
    // If hash is plain text (fallback), do direct comparison
    return password === hash;
  }
}

export function maskSensitiveData(data, visibleChars = 4) {
  if (!data || data.length <= visibleChars) {
    return '****';
  }
  const masked = '*'.repeat(Math.max(4, data.length - visibleChars));
  return masked + data.slice(-visibleChars);
}
