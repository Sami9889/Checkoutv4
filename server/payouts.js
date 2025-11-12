import express from 'express';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { sendPayout } from './payouts-util.js';
const router = express.Router();
const DB = './server/db.json';
if (!fs.existsSync(DB)) fs.writeFileSync(DB, JSON.stringify({ clients_encrypted:null, licenses:[], kyc:[], payouts:[] }, null,2));

function readDB(){ return JSON.parse(fs.readFileSync(DB,'utf8')); }
function saveDB(d){ fs.writeFileSync(DB, JSON.stringify(d,null,2)); }

router.post('/server/request-payout', (req,res)=>{
  const { license, amount, receiver } = req.body;
  if (!license || !amount) return res.status(400).json({ error:'missing' });
  const db = readDB();
  db.payouts = db.payouts || [];
  const id = 'PO-' + crypto.randomBytes(6).toString('hex').toUpperCase();
  const rec = { id, license, amount:Number(amount), receiver: receiver || process.env.PAYPAL_PAYOUT_EMAIL, status:'pending', created_at:new Date().toISOString() };
  db.payouts.push(rec);
  saveDB(db);
  res.json({ success:true, request: rec });
});

router.post('/server/admin/process-payout', async (req,res)=>{
  const admin = req.body.admin_pass || req.query.admin_pass;
  if (!admin || admin !== process.env.ADMIN_PASS) return res.status(401).json({ error:'unauthorized' });
  const { payout_id, action } = req.body;
  if (!payout_id || !action) return res.status(400).json({ error:'missing' });
  const db = readDB();
  const p = db.payouts.find(x=>x.id===payout_id);
  if (!p) return res.status(404).json({ error:'not found' });
  if (action === 'cancel'){ p.status='cancelled'; saveDB(db); return res.json({ success:true, payout:p }); }
  if (action === 'process'){
    try {
      const resp = await sendPayout(p.receiver, p.amount, 'AUD', 'Payout ' + p.id);
      p.status='processed'; p.processed_at=new Date().toISOString(); p.response=resp; saveDB(db);
      return res.json({ success:true, payout:p, resp });
    } catch(e){ p.status='error'; p.error=String(e); saveDB(db); return res.status(500).json({ error:'payout failed', detail:p.error }); }
  }
  res.status(400).json({ error:'unknown action' });
});

router.get('/server/admin/payouts', (req,res)=>{
  const pass = req.query.admin_pass; if (!pass || pass !== process.env.ADMIN_PASS) return res.status(401).json({ error:'unauthorized' });
  const db = readDB(); res.json({ payouts: db.payouts || [] });
});

export default router;
