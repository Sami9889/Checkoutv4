import express from 'express';
import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import dotenv from 'dotenv';
import { encryptJSON, decryptJSON } from './crypto-utils.js';
import paymentsRouter from './payments.js';
import bankTransfersRouter from './bank-transfers.js';
import kycRouter from './kyc.js';
import issueRouter from './issue-handler.js';
import payoutsRouter from './payouts.js';
import webhooksRouter from './webhooks.js';
import payoutAdminRouter from './payout-admin.js';
import customersRouter from './customers.js';

dotenv.config();
const app = express();
app.use(express.json());

// Redirect any requests coming to the example domain or /checkout.html to the bank-transfer checkout
app.use((req, res, next) => {
  try {
    const host = (req.headers && req.headers.host) ? String(req.headers.host) : '';
    const path = req.originalUrl || '';
    
    // Intercept any request to checkout.example.com or requests for /checkout.html or /web/checkout.html
    if (host.includes('checkout.example.com') || 
        host.includes('example.com') ||
        path.includes('/checkout.html') ||
        path.includes('/web/checkout.html')) {
      // preserve query string when redirecting
      const qs = path.includes('?') ? path.slice(path.indexOf('?')) : '';
      return res.redirect(302, '/bank-checkout.html' + qs);
    }
  } catch (e) {
    // fall through to next middleware on error
  }
  return next();
});
app.use(express.static(path.resolve('./web')));
app.use('/console', express.static(path.resolve('./console')));

const CFG = fs.existsSync('./server/config.yaml') ? yaml.load(fs.readFileSync('./server/config.yaml','utf8')) : {};
const DB_FILE = path.resolve('./server/db.json');
let vault = { clients_encrypted: null, licenses: [], kyc: [], payouts: [] };
if (fs.existsSync(DB_FILE)) vault = JSON.parse(fs.readFileSync(DB_FILE,'utf8'));

function saveDB(){ fs.writeFileSync(DB_FILE, JSON.stringify(vault, null,2)); }
function getClients(){ return vault.clients_encrypted ? decryptJSON(vault.clients_encrypted) : []; }
function setClients(arr){ vault.clients_encrypted = encryptJSON(arr); vault.clients_encrypted = vault.clients_encrypted; saveDB(); }

app.get('/server/health', (req,res)=> res.json({ 
  ok: true, 
  mode: process.env.MODE || 'paypal', 
  version: '1.0.0',
  paypalReady: !!process.env.PAYPAL_CLIENT_ID
}));

app.get('/server/config', (req,res)=> {
  // Only return PayPal client ID (safe to expose to frontend)
  res.json({
    paypalClientId: process.env.PAYPAL_CLIENT_ID || null,
    paypalEnv: process.env.PAYPAL_ENV || 'sandbox'
  });
});

app.use('/', paymentsRouter);
app.use('/', bankTransfersRouter);
app.use('/', kycRouter);
app.use('/', issueRouter);
app.use('/', payoutsRouter);
app.use('/', webhooksRouter);
app.use('/', payoutAdminRouter);
app.use('/', customersRouter);

// admin simple route
app.get('/server/admin', (req,res)=>{
  const pass = req.query.pass;
  if (!pass || pass !== process.env.ADMIN_PASS) return res.status(401).send('Unauthorized');
  res.json({ clients: getClients(), kyc: vault.kyc || [], payouts: vault.payouts || [], licenses: vault.licenses || [] });
});

const PORT = process.env.PORT || CFG.port || 4000;
app.listen(PORT, ()=> console.log(`PayLinkBridge v1.0.0 running on port ${PORT} (Mode: ${process.env.MODE || 'paypal'})
💰 Payouts to: SAMRATH SINGH - Commonwealth Bank (BSB: 062948)`));
