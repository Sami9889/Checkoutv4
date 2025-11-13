# PayLinkBridge Checkout System - Complete Guide

## Account Information
- **Owner:** SAMRATH SINGH
- **Bank:** Commonwealth Bank (Australia)
- **Account:** 4760652
- **BSB:** 062948
- **Address:** 2 ZUCCOTTI CRES, POINT COOK VIC 3030
- **BIC/SWIFT:** CTBAAU2S

---

## System Overview

PayLinkBridge is a production-ready payment checkout system that:
- ✅ Accepts payments via real PayPal integration
- ✅ Generates automatic license keys
- ✅ Tracks customer data
- ✅ Creates GitHub issues with payment details
- ✅ Sends license delivery emails
- ✅ Initiates automatic payouts to your bank account

---

## Checkout Pages Available

### 1. Main Checkout (`/checkout.html`)
- Full checkout experience with plan selection
- PayPal payment integration
- License generation and email delivery
- Customer tracking
- Success page with license details

**URL:** `http://localhost:4000/checkout.html`

### 2. Setup Guide (`/setup-guide.html`)
- Visual setup instructions
- Bank account information
- Step-by-step configuration
- Troubleshooting tips
- Testing procedures

**URL:** `http://localhost:4000/setup-guide.html`

### 3. Success Page (`/success.html`)
- Shows license key after payment
- Copy-to-clipboard functionality
- Order and customer ID display
- Email confirmation notification

---

## Payment Plans

| Plan | Price | Duration | Access Level |
|------|-------|----------|--------------|
| Starter | $10.00 AUD | 30 days | Basic features |
| Basic | $25.00 AUD | 90 days | Standard features |
| Pro | $99.00 AUD | 1 year | Full features |

---

## Complete Payment Flow

```
1. User visits /checkout.html
   ↓
2. Selects plan (Starter/Basic/Pro)
   ↓
3. Enters name and email
   ↓
4. Clicks "Pay with PayPal"
   ↓
5. Frontend calls /server/create-order
   ↓
6. PayPal order created on server
   ↓
7. User redirected to PayPal for approval
   ↓
8. User approves payment
   ↓
9. Frontend calls /server/capture-order
   ↓
10. Backend processes:
    - License generation (LIC-XXXXXX)
    - Customer recording (CUST-XXXXXX)
    - Email sending (license)
    - GitHub issue creation
    - Payout initiation
   ↓
11. User redirected to /success.html
   ↓
12. Success page displays:
    - License key
    - Customer ID
    - Order ID
    - Confirmation message
```

---

## Configuration Required

### Essential Configuration (.env)

```env
# PayPal (REQUIRED)
PAYPAL_CLIENT_ID=your_actual_client_id
PAYPAL_SECRET=your_actual_secret
PAYPAL_ENV=sandbox
PAYPAL_PAYOUT_EMAIL=your_business@paypal.com

# Email (REQUIRED for license delivery)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_gmail@gmail.com
SMTP_PASS=your_16_char_app_password
SMTP_FROM=noreply@yourdomain.com

# Admin
ADMIN_PASS=your_strong_password
ADMIN_EMAIL=admin@example.com
```

### Optional Configuration

```env
# GitHub (for auto-issue creation)
GITHUB_TOKEN=your_github_token
GITHUB_OWNER=Sami9889
GITHUB_REPO=Checkoutv4

# Bank Auto-Payout
AUTO_PAYOUT_ENABLED=true
AUTO_PAYOUT_THRESHOLD=100.00
AUTO_PAYOUT_CURRENCY=AUD
```

---

## API Endpoints

### Configuration & Health

| Endpoint | Method | Response |
|----------|--------|----------|
| `/server/config` | GET | Returns PayPal client ID |
| `/server/health` | GET | System health status |

### Payment Processing

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/server/create-order` | POST | Create PayPal order |
| `/server/capture-order` | POST | Capture and process payment |

### Admin

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/server/customers` | GET | List all customers |
| `/server/customers/:id` | GET | Get single customer |
| `/server/admin` | GET | Admin dashboard (requires password) |

---

## What Happens After Payment

### Automatic Actions

1. **License Generation**
   - Format: `LIC-XXXXXX` (6 random chars)
   - Stored in database

2. **Customer Recording**
   - Format: `CUST-XXXXXX` (6 random chars)
   - Includes:
     - Customer name
     - Email address
     - Plan selected
     - Amount paid
     - Payment date
     - License key

3. **Email Delivery**
   - License key emailed to customer
   - HTML formatted email
   - Includes payment details and plan info

4. **GitHub Issue Creation** (if GitHub token configured)
   - Creates issue with customer details
   - Labels: `customer`, `license-issued`
   - Includes order ID and license key

5. **Payout Initiation**
   - Automatic transfer to your bank account
   - Amount: (Price × Payout Percentage)
   - Status tracked in database

---

## File Structure

```
/web
  ├── checkout.html        → Main checkout page
  ├── success.html         → Success page with license
  ├── setup-guide.html     → Visual setup guide
  ├── index.html          → Home page with links
  ├── script.js           → Global utilities
  └── style.css           → Global styles

/server
  ├── server.js           → Express app & routes
  ├── payments.js         → Payment processing
  ├── paypal.js          → PayPal API integration
  ├── customers.js       → Customer tracking
  ├── email-service.js   → Email delivery
  ├── webhooks.js        → PayPal webhooks
  ├── payouts.js         → Payout handling
  └── db.json            → Database (licenses, customers)

/.github/ISSUE_TEMPLATE
  ├── payment_request.yml       → Payment request form
  └── paypal-plan-request.yml  → PayPal plan request form
```

---

## Testing Checklist

- [ ] Server starts without errors
- [ ] Visit `/server/config` returns PayPal client ID
- [ ] Checkout page loads with no errors
- [ ] Can select different plans
- [ ] PayPal button appears correctly
- [ ] Can complete test payment with PayPal sandbox
- [ ] Success page shows license key
- [ ] License email is sent to test email
- [ ] Customer record appears in database
- [ ] (Optional) GitHub issue created automatically
- [ ] Admin panel shows new customer

---

## Troubleshooting

### Checkout Page Shows "PayPal Not Configured"

**Cause:** PAYPAL_CLIENT_ID is not set or is a placeholder

**Fix:**
1. Edit `.env` with real PayPal credentials
2. Restart the server
3. Verify `/server/config` returns a valid client ID

### PayPal Button Doesn't Appear

**Cause:** SDK failed to load or client ID is invalid

**Fix:**
1. Check browser console (F12) for errors
2. Verify PAYPAL_CLIENT_ID is valid
3. Check server logs for configuration issues

### Email Not Received

**Cause:** SMTP credentials incorrect or Gmail app password missing

**Fix:**
1. For Gmail users: Use 16-character app password (not regular password)
2. Verify SMTP_USER matches Gmail address
3. Check spam/junk folder
4. Review server logs for SMTP errors

### Payment Captured But No Email

**Cause:** Email service failed silently

**Fix:**
1. Check server logs for email errors
2. Verify SMTP configuration is correct
3. Test email manually via `/server/admin`

---

## Security Notes

⚠️ **Important Security Considerations:**

1. **Never commit .env to Git** - Contains sensitive credentials
2. **Use strong ADMIN_PASS** - Protects admin endpoints
3. **HTTPS in production** - PayPal requires HTTPS for live payments
4. **Validate webhook signatures** - PayPal webhooks are signature-verified
5. **Protect customer data** - Database contains personal information
6. **Rate limiting** - Consider adding rate limiting for production

---

## Production Deployment

When deploying to production:

1. **Get real PayPal credentials**
   ```env
   PAYPAL_ENV=live
   ```

2. **Use strong secrets**
   - ADMIN_PASS: 20+ character strong password
   - MASTER_SECRET_KEY: 32-byte base64 key

3. **Enable HTTPS**
   - Required by PayPal for live payments
   - Use SSL certificate (Let's Encrypt recommended)

4. **Configure proper email**
   - Use dedicated email service or SMTP
   - Set SMTP_FROM to professional email

5. **Database backups**
   - Regular backups of `server/db.json`
   - Contains customer and license data

6. **Monitor payouts**
   - Verify monthly bank transfers
   - Check for failed payouts

---

## Support & Maintenance

### Monitoring

- Check server logs regularly for errors
- Monitor email delivery failures
- Track payout status
- Review customer records for issues

### Common Issues

See `/setup-guide.html` for detailed troubleshooting

### Updates

- Keep Node.js dependencies updated
- Review PayPal API updates
- Check security advisories

---

## Quick Commands

```bash
# Install dependencies
npm install

# Start development server
npm start

# Start with nodemon (auto-reload)
npm run dev

# Check system health
curl http://localhost:4000/server/health

# View PayPal config
curl http://localhost:4000/server/config

# Access admin panel
curl "http://localhost:4000/server/admin?pass=YOUR_ADMIN_PASS"
```

---

## Contact & Support

- **Repository:** https://github.com/Sami9889/Checkoutv4
- **Issues:** https://github.com/Sami9889/Checkoutv4/issues
- **Account Owner:** SAMRATH SINGH

---

**Last Updated:** November 13, 2025  
**System Version:** 1.0.0  
**Status:** Production Ready ✅
