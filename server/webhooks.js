import express from 'express';
import crypto from 'crypto';
import fetch from 'node-fetch';
import fs from 'fs';
const router = express.Router();

const DB = './server/db.json';
function readDB(){ return JSON.parse(fs.readFileSync(DB,'utf8')); }
function saveDB(d){ fs.writeFileSync(DB, JSON.stringify(d,null,2)); }

// Verify PayPal webhook signature
async function verifyWebhookSignature(req, transmissionId, transmissionTime, certUrl, webhookBody, webhookSignature) {
  try {
    // Get PayPal certificate
    const certResp = await fetch(certUrl);
    const certPem = await certResp.text();
    
    // Construct the verification string
    const verificationString = `${transmissionId}|${transmissionTime}|paypal-webhook-id|${webhookBody}`;
    
    // Verify the signature
    const verifier = crypto.createVerify('sha256');
    verifier.update(verificationString);
    
    return verifier.verify(certPem, webhookSignature, 'base64');
  } catch(e) {
    console.error('Webhook signature verification failed:', e.message);
    return false;
  }
}

// Get PayPal access token for webhook verification
async function getWebhookAccessToken() {
  const base = process.env.PAYPAL_ENV === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';
  const resp = await fetch(base + '/v1/oauth2/token', {
    method: 'POST',
    headers: {
      'Authorization': 'Basic ' + Buffer.from(process.env.PAYPAL_CLIENT_ID + ':' + process.env.PAYPAL_SECRET).toString('base64'),
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: 'grant_type=client_credentials'
  });
  const j = await resp.json();
  return j.access_token;
}

// Verify webhook with PayPal API
async function verifyWebhookWithPayPal(webhookId, transmissionId, transmissionTime, certUrl, webhookSignature, webhookBody) {
  try {
    const token = await getWebhookAccessToken();
    const base = process.env.PAYPAL_ENV === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';
    
    const resp = await fetch(base + '/v1/notifications/verify-webhook-signature', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        transmission_id: transmissionId,
        transmission_time: transmissionTime,
        cert_url: certUrl,
        auth_algo: 'SHA256withRSA',
        webhook_id: webhookId,
        webhook_event: webhookBody,
        webhook_signature: webhookSignature
      })
    });
    
    const result = await resp.json();
    return result.verification_status === 'SUCCESS';
  } catch(e) {
    console.error('PayPal webhook verification error:', e.message);
    return false;
  }
}

// Webhook endpoint for PayPal payment confirmations
router.post('/server/webhooks/paypal', async (req, res) => {
  const transmissionId = req.headers['paypal-transmission-id'];
  const transmissionTime = req.headers['paypal-transmission-time'];
  const certUrl = req.headers['paypal-cert-url'];
  const webhookSignature = req.headers['paypal-auth-algo'];
  const webhookId = process.env.PAYPAL_WEBHOOK_ID;
  
  // Verify webhook is from PayPal
  const isValid = await verifyWebhookWithPayPal(webhookId, transmissionId, transmissionTime, certUrl, webhookSignature, JSON.stringify(req.body));
  
  if (!isValid) {
    console.warn('Invalid webhook signature');
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  const event = req.body;
  console.log('PayPal webhook event:', event.event_type);
  
  try {
    switch(event.event_type) {
      case 'CHECKOUT.ORDER.APPROVED':
        // Order approved by user
        handleOrderApproved(event);
        break;
      case 'CHECKOUT.ORDER.COMPLETED':
        // Order completed (payment captured)
        handleOrderCompleted(event);
        break;
      case 'PAYMENT.CAPTURE.COMPLETED':
        // Payment captured successfully
        handlePaymentCaptured(event);
        break;
      case 'PAYMENT.CAPTURE.DECLINED':
        // Payment failed
        handlePaymentDeclined(event);
        break;
      case 'CHECKOUT.ORDER.PROCESSED':
        // Order processed
        handleOrderProcessed(event);
        break;
      default:
        console.log('Unhandled event type:', event.event_type);
    }
    
    res.json({ received: true });
  } catch(e) {
    console.error('Webhook processing error:', e.message);
    res.status(500).json({ error: 'Processing failed' });
  }
});

function handleOrderApproved(event) {
  const orderId = event.resource.id;
  console.log(`Order ${orderId} approved by user`);
  // Update order status in database
  const db = readDB();
  db.webhookEvents = db.webhookEvents || [];
  db.webhookEvents.push({ event: 'APPROVED', orderId, timestamp: new Date().toISOString() });
  saveDB(db);
}

function handleOrderCompleted(event) {
  const orderId = event.resource.id;
  const status = event.resource.status;
  console.log(`Order ${orderId} completed with status ${status}`);
  const db = readDB();
  db.webhookEvents = db.webhookEvents || [];
  db.webhookEvents.push({ event: 'COMPLETED', orderId, status, timestamp: new Date().toISOString() });
  saveDB(db);
}

function handlePaymentCaptured(event) {
  const captureId = event.resource.id;
  const orderId = event.resource.supplementary_data?.related_ids?.order_id;
  const status = event.resource.status;
  const amount = event.resource.amount?.value;
  
  console.log(`Payment ${captureId} captured for order ${orderId}: ${amount}`);
  
  const db = readDB();
  db.webhookEvents = db.webhookEvents || [];
  db.webhookEvents.push({ 
    event: 'PAYMENT_CAPTURED', 
    captureId, 
    orderId, 
    status, 
    amount,
    timestamp: new Date().toISOString() 
  });
  
  // Update license status if exists
  if (db.licenses) {
    const license = db.licenses.find(l => l.orderId === orderId);
    if (license) {
      license.paypal_capture_id = captureId;
      license.paypal_capture_status = status;
      license.status = 'verified';
    }
  }
  
  saveDB(db);
}

function handlePaymentDeclined(event) {
  const captureId = event.resource.id;
  const orderId = event.resource.supplementary_data?.related_ids?.order_id;
  const reason = event.resource.status_details?.reason;
  
  console.error(`Payment ${captureId} declined: ${reason}`);
  
  const db = readDB();
  db.webhookEvents = db.webhookEvents || [];
  db.webhookEvents.push({ 
    event: 'PAYMENT_DECLINED', 
    captureId, 
    orderId, 
    reason,
    timestamp: new Date().toISOString() 
  });
  
  // Update license status
  if (db.licenses) {
    const license = db.licenses.find(l => l.orderId === orderId);
    if (license) {
      license.status = 'failed';
      license.failure_reason = reason;
    }
  }
  
  saveDB(db);
}

function handleOrderProcessed(event) {
  const orderId = event.resource.id;
  console.log(`Order ${orderId} processed`);
  // Handle any additional processing
}

// Admin endpoint to view webhook events
router.get('/server/admin/webhooks', (req, res) => {
  const pass = req.query.admin_pass;
  if (!pass || pass !== process.env.ADMIN_PASS) {
    return res.status(401).json({ error: 'unauthorized' });
  }
  const db = readDB();
  res.json({ webhookEvents: db.webhookEvents || [] });
});

export default router;
