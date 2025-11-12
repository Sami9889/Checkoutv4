import express from 'express';
import fs from 'fs';
import path from 'path';
import { randomToken } from './crypto-utils.js';
import fetch from 'node-fetch';
import { getAccessToken, createOrder, captureOrder } from './paypal.js';
import { calculatePayout } from './bank-config.js';
import { sendPayout } from './payouts-util.js';
import { sendLicenseEmail, sendPaymentConfirmation, sendAdminNotification } from './email-service.js';
import { recordCustomer, createGitHubIssue } from './customers.js';
const router = express.Router();

const MODE = process.env.MODE || 'paypal';  // REAL PAYPAL ONLY
const DB = './server/db.json';

function readDB(){ return JSON.parse(fs.readFileSync(DB,'utf8')); }
function saveDB(d){ fs.writeFileSync(DB, JSON.stringify(d,null,2)); }

router.post('/server/create-order', async (req,res)=>{
  const { amount, currency, plan, email } = req.body;
  if (!amount) return res.status(400).json({ error:'missing amount' });
  if (!process.env.PAYPAL_CLIENT_ID) return res.status(500).json({ error:'PayPal credentials not configured' });
  
  try {
    const token = await getAccessToken(process.env.PAYPAL_ENV || 'sandbox', process.env.PAYPAL_CLIENT_ID, process.env.PAYPAL_SECRET);
    const order = await createOrder(process.env.PAYPAL_ENV || 'sandbox', token, amount, currency || 'AUD');
    if (order.id) {
      return res.json({ id: order.id, status: order.status, links: order.links });
    } else {
      return res.status(400).json({ error: 'Failed to create PayPal order', details: order });
    }
  } catch(e) {
    console.error('Order creation error:', e.message);
    res.status(500).json({ error: 'Order creation failed', detail: e.message });
  }
});

router.post('/server/capture-order', async (req,res)=>{
  const { orderId, payerEmail, plan } = req.body;
  if (!orderId) return res.status(400).json({ error:'missing orderId' });
  if (!process.env.PAYPAL_CLIENT_ID) return res.status(500).json({ error:'PayPal credentials not configured' });
  if (!payerEmail) return res.status(400).json({ error:'missing payerEmail' });
  
  try {
    const db = readDB();
    db.licenses = db.licenses || [];
    
    const token = await getAccessToken(process.env.PAYPAL_ENV || 'sandbox', process.env.PAYPAL_CLIENT_ID, process.env.PAYPAL_SECRET);
    const captured = await captureOrder(process.env.PAYPAL_ENV || 'sandbox', token, orderId);
    
    if (captured.status === 'COMPLETED') {
      const license = 'LIC-' + randomToken(6).toUpperCase();
      const amount = captured.purchase_units?.[0]?.amount?.value || '0';
      const payoutCalc = calculatePayout(amount);
      
      // Create license record
      const licenseRecord = {
        license,
        orderId,
        plan: plan || 'one-time',
        email: payerEmail,
        amount,
        status: 'active',
        paypal_status: captured.status,
        created_at: new Date().toISOString(),
        fees: payoutCalc
      };
      
      db.licenses.push(licenseRecord);
      saveDB(db);
      
      // Send customer license email
      await sendLicenseEmail(payerEmail, license, plan, orderId);
      
      // Send admin notification
      await sendAdminNotification(plan, amount, payerEmail, orderId);
      
      // Automatically initiate payout to owner
      try {
        const payoutEmail = process.env.PAYPAL_PAYOUT_EMAIL || process.env.ADMIN_EMAIL;
        if (payoutEmail && payoutCalc.payoutAmount > 0) {
          const payoutResult = await sendPayout(
            payoutEmail,
            payoutCalc.payoutAmount,
            'AUD',
            `Payout for ${plan} plan - Order ${orderId}`
          );
          
          licenseRecord.payout = {
            status: 'initiated',
            amount: payoutCalc.payoutAmount,
            payoutId: payoutResult.batch_header?.payout_batch_id || null,
            requestDate: new Date().toISOString()
          };
          saveDB(db);
        }
      } catch(payoutErr) {
        console.error('Payout initiation failed:', payoutErr.message);
        licenseRecord.payout = {
          status: 'failed',
          error: payoutErr.message,
          requestDate: new Date().toISOString()
        };
        saveDB(db);
      }
      
      // Record customer in database
      const customerRecord = await recordCustomer({
        email: payerEmail,
        fullName: req.body.fullName || 'Unknown',
        dateOfBirth: req.body.dateOfBirth || null,
        plan,
        amount,
        currency: 'AUD',
        license,
        orderId
      });
      console.log(`✅ Customer recorded: ${customerRecord.id}`);
      
      // Create GitHub issue with customer info (async, don't wait)
      if (process.env.GITHUB_TOKEN) {
        createGitHubIssue(customerRecord).catch(err => 
          console.error('GitHub issue creation failed (non-blocking):', err.message)
        );
      }
      
      return res.json({ 
        success: true, 
        license, 
        orderId, 
        customerId: customerRecord.id,
        status: captured.status,
        fees: payoutCalc,
        payout: licenseRecord.payout,
        emailSent: true
      });
    } else {
      return res.status(400).json({ error: 'Payment not completed', status: captured.status });
    }
  } catch(e) {
    console.error('Capture error:', e.message);
    res.status(500).json({ error: 'Capture failed', detail: e.message });
  }
});

export default router;
