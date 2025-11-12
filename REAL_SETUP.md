# Real Production Setup Guide

## Step 1: PayPal Credentials (REQUIRED)

Go to [PayPal Developer Dashboard](https://developer.paypal.com):
1. Create a business account if you don't have one
2. Go to **Apps & Credentials** 
3. Copy your **Client ID** and **Secret** from the Sandbox app
4. Update `.env`:
   ```
   PAYPAL_CLIENT_ID=your_actual_client_id
   PAYPAL_SECRET=your_actual_secret
   PAYPAL_ENV=sandbox
   ```

## Step 2: Email Configuration (REQUIRED for license delivery)

Add to `.env`:
```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
SMTP_FROM=noreply@yourdomain.com
```

## Step 3: Admin Configuration

Update `.env`:
```
ADMIN_PASS=your_secure_password
ADMIN_EMAIL=your_email@example.com
```

## Step 4: GitHub Workflow Configuration

Add these secrets to your GitHub repo (Settings → Secrets and variables → Actions):
```
PAYPAL_CLIENT_ID = (same as .env)
PAYPAL_SECRET = (same as .env)
SMTP_HOST = smtp.gmail.com
SMTP_PORT = 587
SMTP_USER = your_email@gmail.com
SMTP_PASS = your_app_password
```

## Step 5: Test the Checkout

1. Start server: `npm start`
2. Visit: `http://localhost:4000/web/checkout.html`
3. Select a plan and click "Pay Now"
4. Use PayPal sandbox credentials to complete payment
5. Check license is generated in `server/db.json`

## Step 6: Deploy to Production

When ready to use real PayPal:
- Update `.env`: `PAYPAL_ENV=live`
- Add real PayPal credentials
- Deploy with these env vars set

---

**STATUS**: ✅ Real PayPal ready | ⏳ Email sending (needs config) | ❌ Production deployment (needs hosting)
