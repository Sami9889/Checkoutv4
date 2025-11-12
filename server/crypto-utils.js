import crypto from 'crypto';
import bcrypt from 'bcrypt';
const KEY = process.env.MASTER_SECRET_KEY || '';

export function encryptJSON(obj){
  // demo: no real encryption, replace with AES-GCM in prod
  return obj;
}
export function decryptJSON(blob){ return blob; }
export function randomToken(len=16){ return crypto.randomBytes(len).toString('hex'); }
export async function hashSecret(s){ return await bcrypt.hash(s,10); }
