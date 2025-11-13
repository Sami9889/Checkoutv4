# PayLinkBridge Checkout Setup Guide

## Bank Account Information
**Account Owner:** SAMRATH SINGH  
**Bank:** Commonwealth Bank (Australia)  
**Account Address:** 2 ZUCCOTTI CRES, POINT COOK VIC 3030  
**BSB:** 062948  
**Account Number:** 4760652  
**BIC/SWIFT Code:** CTBAAU2S  

---

## Getting the Checkout System Working

### Step 1: Get PayPal Credentials

1. Go to https://developer.paypal.com
2. Sign in or create an account (Business account recommended)
3. Navigate to "Apps & Credentials"
4. Copy your **Client ID** and **Secret**

### Step 2: Update .env File

Edit `.env` and replace:

```env
PAYPAL_CLIENT_ID=YOUR_PAYPAL_CLIENT_ID_HERE
PAYPAL_SECRET=YOUR_PAYPAL_SECRET_HERE
PAYPAL_PAYOUT_EMAIL=your_paypal_business_email@example.com
```

With your actual credentials:

```env
PAYPAL_CLIENT_ID=AcfYvR-KUAqzLDz8N_oKhkq2wMf4PGm4hJFEfnvOLfx2L...
PAYPAL_SECRET=EMPPSFQRqBHPLF8vKZ6Z_q...
PAYPAL_PAYOUT_EMAIL=your-business@paypal.com
```

### Step 3: Configure Email (for license delivery)

Gmail users must use an **App Password** (not your regular password):

1. Go to https://myaccount.google.com/apppasswords
2. Generate a 16-character app password
3. Update `.env`:

```env
SMTP_USER=your_gmail@gmail.com
SMTP_PASS=your_16_char_app_password
SMTP_FROM=noreply@yourdomain.com
```

### Step 4: Set Admin Password & Email

```env
ADMIN_PASS=create_a_strong_password
ADMIN_EMAIL=your_email@example.com
```

### Step 5: Restart the Server

```bash
npm install
npm start
```

Or if using nodemon:
```bash
npm run dev
```

---

## Testing the Checkout

### Using Sandbox (Testing)

1. Visit: http://localhost:4000/checkout.html
2. Select a plan (Starter, Basic, or Pro)
3. Enter test details:
   - Name: `Test User`
   - Email: `test@example.com`
4. Click "Pay with PayPal"
5. Use PayPal sandbox test account credentials
6. Confirm payment
7. Should be redirected to success page with license key

### Using Live (Production)

Change in `.env`:
```env
PAYPAL_ENV=live
```

⚠️ **WARNING:** Live mode will process real payments. Only use after testing thoroughly.

---

## What Happens After Payment

✅ License key is generated (`LIC-XXXXXX` format)  
✅ Customer record created (`CUST-XXXXXX` format)  
✅ License sent via email  
✅ GitHub issue auto-created with customer details  
✅ Admin notified of new payment  
✅ Payout initiated to bank account  

---

## Checkout Flow

```
User visits /checkout.html
    ↓
Selects plan + enters details (name, email)
    ↓
Clicks "Pay with PayPal"
    ↓
Server creates PayPal order (/server/create-order)
    ↓
PayPal approval page
    ↓
User approves payment
    ↓
Server captures order (/server/capture-order)
    ↓
Backend:
  • Generates license key
  • Records customer
  • Creates GitHub issue
  • Sends license email
  • Initiates bank payout
    ↓
Redirects to /success.html with license details
```

---

## Payment Plans

| Plan | Price | Duration | Features |
|------|-------|----------|----------|
| **Starter** | $10.00 AUD | 30 days | Basic features, Email support |
| **Basic** | $25.00 AUD | 90 days | All Starter + Priority support, Analytics |
| **Pro** | $99.00 AUD | 1 year | All Basic + 24/7 support, API access |

---

## Troubleshooting

### "PayPal Not Configured" Error
- ✅ Check PAYPAL_CLIENT_ID is set in `.env`
- ✅ Make sure it doesn't contain `YOUR_` placeholder
- ✅ Restart the server after changing `.env`

### Checkout Page Shows "example.com"
- ✅ Server config endpoint `/server/config` is not returning client ID
- ✅ Check logs for errors
- ✅ Verify PAYPAL_CLIENT_ID is set properly in `.env`

### License Email Not Received
- ✅ Check SMTP_USER and SMTP_PASS in `.env`
- ✅ For Gmail, ensure you used 16-character **app password**
- ✅ Check spam/junk folder
- ✅ Verify SMTP_FROM is set

### Payout Not Processing
- ✅ Check PAYPAL_PAYOUT_EMAIL is set to your business PayPal email
- ✅ Verify PayPal API credentials are correct
- ✅ Check server logs for payout errors

### Payment Menu Not Appearing in GitHub
- ✅ GitHub token might be missing or invalid
- ✅ Set GITHUB_TOKEN in `.env` (generate at https://github.com/settings/tokens)
- ✅ Ensure issue contains "payment", "checkout", or "plan" keyword

---

## API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/server/config` | GET | Returns PayPal client ID |
| `/server/health` | GET | System health check |
| `/server/create-order` | POST | Create PayPal order |
| `/server/capture-order` | POST | Capture and process payment |
| `/server/customers` | GET | List all customers (admin) |
| `/server/customers/:id` | GET | Get single customer (admin) |

---

## File Structure

```
/web
  └── checkout.html      # Main checkout page
  └── success.html       # Success page after payment
  └── script.js         # Global utilities
  └── style.css         # Global styles

/server
  ├── payments.js       # Payment processing
  ├── paypal.js         # PayPal API integration
  ├── customers.js      # Customer tracking
  ├── email-service.js  # Email sending
  ├── webhooks.js       # PayPal webhooks
  ├── payouts.js        # Payout handling
  └── server.js         # Express app

/.github
  └── ISSUE_TEMPLATE
      ├── payment_request.yml        # Payment request form
      └── paypal-plan-request.yml    # PayPal plan request form
```

---

## Support

For issues, questions, or feature requests:
1. Check GitHub Issues: https://github.com/Sami9889/Checkoutv4/issues
2. Create a new issue with "payment" tag
3. Include error logs from server console

---

**Last Updated:** November 13, 2025  
**System Version:** 1.0.0  
**Account Owner:** SAMRATH SINGH  
