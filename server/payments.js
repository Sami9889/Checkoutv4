import express from 'express';
import fs from 'fs';
import path from 'path';
import { randomToken } from './crypto-utils.js';
import fetch from 'node-fetch';
import { getAccessToken, createOrder, captureOrder } from './paypal.js';
import { calculatePayout } from './bank-config.js';
import { sendPayout } from './payouts-util.js';
const router = express.Router();

const MODE = process.env.MODE || 'mock';
const DB = './server/db.json';

function readDB(){ return JSON.parse(fs.readFileSync(DB,'utf8')); }
function saveDB(d){ fs.writeFileSync(DB, JSON.stringify(d,null,2)); }

router.post('/server/create-order', async (req,res)=>{
  const { amount, currency, plan, email } = req.body;
  if (!amount) return res.status(400).json({ error:'missing amount' });
  
  try {
    if (MODE === 'paypal') {
      const token = await getAccessToken(process.env.PAYPAL_ENV || 'sandbox', process.env.PAYPAL_CLIENT_ID, process.env.PAYPAL_SECRET);
      const order = await createOrder(process.env.PAYPAL_ENV || 'sandbox', token, amount, currency || 'AUD');
      if (order.id) {
        return res.json({ id: order.id, status: order.status, links: order.links });
      } else {
        return res.status(400).json({ error: 'Failed to create PayPal order', details: order });
      }
    } else {
      const id = 'MOCK-' + randomToken(6).toUpperCase();
      const approve = `${process.env.PAYLINK_SELF_URL || 'http://localhost:4000'}/mock/approve?order=${id}`;
      return res.json({ id, status:'CREATED', links:[{ rel:'approve', href:approve }] });
    }
  } catch(e) {
    console.error('Order creation error:', e.message);
    res.status(500).json({ error: 'Order creation failed', detail: e.message });
  }
});

router.post('/server/capture-order', async (req,res)=>{
  const { orderId, payerEmail, plan } = req.body;
  if (!orderId) return res.status(400).json({ error:'missing orderId' });
  
  try {
    const db = readDB();
    db.licenses = db.licenses || [];
    
    if (MODE === 'paypal') {
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
          email: payerEmail || 'unknown',
          amount,
          status: 'active',
          paypal_status: captured.status,
          created_at: new Date().toISOString(),
          fees: payoutCalc
        };
        
        db.licenses.push(licenseRecord);
        
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
          }
        } catch(payoutErr) {
          console.error('Payout initiation failed:', payoutErr.message);
          licenseRecord.payout = {
            status: 'failed',
            error: payoutErr.message,
            requestDate: new Date().toISOString()
          };
        }
        
        saveDB(db);
        return res.json({ 
          success: true, 
          license, 
          orderId, 
          status: captured.status,
          fees: payoutCalc,
          payout: licenseRecord.payout
        });
      } else {
        return res.status(400).json({ error: 'Payment not completed', status: captured.status });
      }
    } else {
      const license = 'LIC-' + randomToken(6).toUpperCase();
      const amount = req.body.amount || '25.00';
      const payoutCalc = calculatePayout(amount);
      
      db.licenses.push({
        license,
        orderId,
        plan: plan || 'one-time',
        email: payerEmail || 'unknown',
        amount,
        status: 'active',
        paypal_status: 'MOCK',
        created_at: new Date().toISOString(),
        fees: payoutCalc
      });
      saveDB(db);
      return res.json({ 
        success: true, 
        license, 
        orderId,
        fees: payoutCalc
      });
    }
  } catch(e) {
    console.error('Capture error:', e.message);
    res.status(500).json({ error: 'Capture failed', detail: e.message });
  }
});

export default router;
