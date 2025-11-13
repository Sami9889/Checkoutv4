# Bank Transfer Checkout - Quick Start

## Your Account
- **Owner:** SAMRATH SINGH
- **Bank:** Commonwealth Bank (Australia)
- **Account:** 4760652 | BSB: 062948
- **Address:** 2 ZUCCOTTI CRES, POINT COOK VIC 3030

---

## What You Get

### Two Payment Methods

**1. Bank Transfer** (`/bank-checkout.html`)
- Customer selects plan
- Gets unique payment code
- Transfers directly to your bank
- You verify manually in admin panel
- Takes 2-4 hours after verification

**2. PayPal** (`/checkout.html`)
- PayPal button integration
- Instant processing
- Automatic license delivery
- Requires PayPal credentials

---

## Files Created

### Frontend
- `web/bank-checkout.html` - Customer bank transfer checkout
- `web/bank-admin.html` - Admin verification panel
- `web/index.html` - Updated with payment method selection

### Backend
- `server/bank-transfers.js` - Complete bank transfer system
- `server/server.js` - Updated with bank transfer routes

### Documentation
- `BANK_TRANSFER_GUIDE.md` - Complete reference guide
- `.env` - Updated configuration

---

## How To Use

### 1. First Time Setup

**Start the server:**
```bash
npm install
npm start
```

Visit: `http://localhost:4000`

### 2. Customer Makes Payment

1. Customer goes to `/bank-checkout.html`
2. Selects plan (Starter/Basic/Pro)
3. Enters name and email
4. Clicks "Get Payment Code"
5. Receives payment code (e.g., `PAY7K4M9`)
6. Transfers money to your bank with that code in reference

### 3. Admin Verifies Payment

1. Visit `/bank-admin.html`
2. Enter admin password (from `.env`)
3. Pending transfers appear
4. Click "Verify Payment" for matching code
5. System sends license to customer automatically

---

## Payment Codes Explained

Each customer gets a unique code like: **`PAY7K4M9`**

- 8 characters total
- Customers include this in their bank transfer reference
- Admin uses code to match the transfer
- System tracks everything automatically

**Example Bank Transfer:**
- To: Commonwealth Bank
- Account: 4760652
- BSB: 062948
- Amount: $25.00
- Reference: `PAY7K4M9`

---

## Configuration

### Required (.env)
```env
MODE=bank
ADMIN_PASS=create_strong_password
SMTP_USER=your_gmail@gmail.com
SMTP_PASS=your_16_char_app_password
```

### Optional (.env)
```env
GITHUB_TOKEN=your_github_token  # For auto-creating issues
GITHUB_OWNER=Sami9889
GITHUB_REPO=Checkoutv4
```

---

## Daily Workflow

### Morning (Check transfers)
1. Check bank account for payments
2. Note which payment codes matched
3. Log into `/bank-admin.html`

### As transfers arrive
1. Find payment code in pending list
2. Click "Verify Payment"
3. Confirm verification
4. Done! License email is sent automatically

### Evening (Summary)
- Review all verified transfers
- Check emails were delivered
- Reconcile with bank statement

---

## What Happens Automatically

When you click "Verify Payment":

✅ License key generated  
✅ Email sent to customer  
✅ Customer record created  
✅ GitHub issue created (if token set)  
✅ Transfer marked as completed  

---

## API Endpoints

### Public (No password needed)
```
GET  /server/bank-account        → Bank details
GET  /server/plans               → Available plans
GET  /server/transfer/PAY7K4M9   → Transfer status
POST /server/create-bank-transfer → Generate code
```

### Admin (Requires password)
```
GET  /server/bank-transfers              → All transfers
POST /server/verify-bank-transfer        → Verify payment
```

---

## Database Structure

Everything is stored in `server/db.json`:

```json
{
  "bankTransfers": [
    {
      "paymentCode": "PAY7K4M9",
      "email": "customer@example.com",
      "fullName": "John Doe",
      "plan": "basic",
      "amount": 25.00,
      "status": "pending",
      "createdAt": "2025-11-13T12:34:56.789Z"
    }
  ],
  "licenses": [
    {
      "license": "LIC-ABC123",
      "paymentCode": "PAY7K4M9",
      "email": "customer@example.com",
      "status": "active"
    }
  ],
  "customers": [
    {
      "id": "CUST-XYZ789",
      "email": "customer@example.com",
      "fullName": "John Doe",
      "plan": "basic",
      "license": "LIC-ABC123",
      "paymentCode": "PAY7K4M9"
    }
  ]
}
```

---

## Security Notes

🔒 **Secure by design:**
- Admin panel password protected
- Manual verification (no auto-processing)
- Each code is unique
- Customer emails verified
- Transfer history preserved

⚠️ **In production:**
- Use HTTPS (required for PayPal if enabled)
- Strong admin password (20+ chars)
- Regular database backups
- Monitor email delivery
- Log all verification actions

---

## Email Setup (Required)

### Gmail Users
1. Go to https://myaccount.google.com/apppasswords
2. Generate 16-character app password
3. Update `.env`:
   ```env
   SMTP_USER=your_email@gmail.com
   SMTP_PASS=16_char_password_here
   ```
4. Restart server

### Other SMTP Providers
Update `.env` with your provider's settings:
```env
SMTP_HOST=smtp.provider.com
SMTP_PORT=587
SMTP_USER=your_username
SMTP_PASS=your_password
```

---

## Monitoring

### Check Transfer Status
```bash
curl "http://localhost:4000/server/bank-transfers?pass=YOUR_PASSWORD"
```

### View Bank Account Details
```bash
curl http://localhost:4000/server/bank-account
```

### See Available Plans
```bash
curl http://localhost:4000/server/plans
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Admin login fails | Check ADMIN_PASS in .env matches |
| Email not received | Verify SMTP settings, check spam folder |
| Code not generated | Check server logs, restart server |
| Payment code wrong format | Database might be corrupted, restart server |
| Admin can't see transfers | Refresh page, check database.json file |

---

## Payment Plans

| Plan | Price | Duration | Access |
|------|-------|----------|--------|
| Starter | $10.00 | 30 days | Basic |
| Basic | $25.00 | 90 days | Standard |
| Pro | $99.00 | 1 year | Full |

---

## Next Steps

1. ✅ Install npm packages: `npm install`
2. ✅ Start server: `npm start`
3. ✅ Visit home page: `http://localhost:4000`
4. ✅ Test bank checkout: Click "Bank Transfer" button
5. ✅ Try admin panel: `/bank-admin.html` (password in .env)
6. ✅ Configure email (SMTP settings in .env)
7. ✅ Go live and start accepting payments!

---

## Support

- 📖 Full guide: `BANK_TRANSFER_GUIDE.md`
- 🚀 PayPal guide: `CHECKOUT_SETUP.md`
- 💻 GitHub: https://github.com/Sami9889/Checkoutv4

---

**Ready to accept payments!** 🎉

Your bank transfer system is fully configured and ready to use.

**Account Owner:** SAMRATH SINGH  
**Last Updated:** November 13, 2025  
**Status:** Production Ready ✅
