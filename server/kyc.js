import express from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
const router = express.Router();
const UP_DIR = path.resolve('./server/uploads');
if (!fs.existsSync(UP_DIR)) fs.mkdirSync(UP_DIR, { recursive:true });
const upload = multer({ dest: UP_DIR });

router.post('/server/kyc/upload', upload.fields([{ name:'file' },{ name:'selfie' }]), (req,res)=>{
  const license = req.body.license || req.body.email || 'unknown';
  const files = [];
  for (const k of ['file','selfie']) {
    const f = req.files && req.files[k] && req.files[k][0];
    if (!f) continue;
    files.push({ field:k, path:f.path, originalName:f.originalname });
  }
  const rec = { id: 'KYC-' + crypto.randomBytes(6).toString('hex').toUpperCase(), license, files, status:'pending', created_at:new Date().toISOString() };
  const DB = './server/db.json';
  let vault = { clients_encrypted:null, licenses:[], kyc:[], payouts:[] };
  if (fs.existsSync(DB)) vault = JSON.parse(fs.readFileSync(DB,'utf8'));
  vault.kyc = vault.kyc || [];
  vault.kyc.push(rec);
  fs.writeFileSync(DB, JSON.stringify(vault,null,2));
  res.json({ success:true, id:rec.id });
});

router.post('/server/kyc/admin/verify', (req,res)=>{
  const admin = req.body.admin_pass;
  if (!admin || admin !== process.env.ADMIN_PASS) return res.status(401).json({ error:'unauthorized' });
  const { id, action, dob } = req.body;
  if (!id || !action) return res.status(400).json({ error:'missing' });
  const DB = './server/db.json';
  if (!fs.existsSync(DB)) return res.status(404).json({ error:'no db' });
  const vault = JSON.parse(fs.readFileSync(DB,'utf8'));
  const rec = (vault.kyc||[]).find(x=>x.id===id);
  if (!rec) return res.status(404).json({ error:'not found' });
  if (action === 'approve') {
    if (!dob) return res.status(400).json({ error:'dob required' });
    const birth = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    if (age < 16) return res.status(403).json({ error:'underage' });
    rec.status = 'approved'; rec.verified_at = new Date().toISOString(); rec.verified_by = 'admin';
  } else {
    rec.status = 'rejected';
  }
  fs.writeFileSync(DB, JSON.stringify(vault,null,2));
  res.json({ success:true, id:rec.id, status:rec.status });
});

export default router;
