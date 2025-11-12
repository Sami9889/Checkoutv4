import express from 'express';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import fetch from 'node-fetch';
const router = express.Router();
const DATA = path.resolve('./server/issue_requests.json');
if (!fs.existsSync(DATA)) fs.writeFileSync(DATA, '[]');

function readDB(){ return JSON.parse(fs.readFileSync(DATA,'utf8')); }
function saveDB(a){ fs.writeFileSync(DATA, JSON.stringify(a,null,2)); }

router.post('/server/issue', async (req,res)=>{
  const { issue_number, issue_url, plan, amount, currency, paypal_email, fullName, date_of_birth, note } = req.body;
  if (!paypal_email || !plan || !amount || !date_of_birth) return res.status(400).json({ error:'missing' });
  const rec = { id: 'ISS-'+crypto.randomBytes(6).toString('hex').toUpperCase(), issue_number, issue_url, plan, amount:Number(amount), currency, paypal_email, fullName, date_of_birth, note, status:'received', created_at:new Date().toISOString() };
  const arr = readDB(); arr.push(rec); saveDB(arr);
  try {
    const resp = await fetch((process.env.PAYLINK_SELF_URL || 'http://localhost:4000') + '/server/create-order', { method:'POST', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify({ amount: rec.amount, currency: rec.currency }) });
    const j = await resp.json();
    rec.order = j.id || null; rec.approval = (j.links || []).find(l=>l.rel==='approve')?.href || null;
    saveDB(arr);
  } catch(e){ console.error('order create failed', e.message); }
  res.status(201).json({ message:'recorded', request: rec });
});

export default router;
