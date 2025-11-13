# Bank Transfer Payment System - Complete Guide

## Overview

Your payment system now supports **Bank Transfer** payments without using PayPal API. Customers receive a unique payment code and transfer funds directly to your Commonwealth Bank account.

---

## Your Bank Account

| Field | Value |
|-------|-------|
| **Account Owner** | SAMRATH SINGH |
| **Bank** | Commonwealth Bank (Australia) |
| **Account Number** | 4760652 |
| **BSB** | 062948 |
| **Address** | 2 ZUCCOTTI CRES, POINT COOK VIC 3030 |
| **BIC/SWIFT Code** | CTBAAU2S |
| **Currency** | AUD (Australian Dollars) |

---

## How It Works

### Customer Flow

1. **Customer visits `/bank-checkout.html`**
   - Selects payment plan (Starter $10, Basic $25, Pro $99)
   - Enters name and email

2. **Clicks "Get Payment Code"**
   - System generates unique payment code (e.g., `PAY7K4M9`)
   - Shows bank account details and transfer instructions

3. **Customer transfers funds**
   - Opens their banking app/portal
   - Uses the payment code as the reference/description
   - Transfers exact amount to your bank account

4. **Payment verification**
   - Admin logs into `/bank-admin.html`
   - Verifies transfer was received
   - Marks transfer as "completed"

5. **License delivery**
   - System automatically generates license key
   - Sends license via email
   - Creates GitHub issue (if configured)
   - Records customer information

---

## Payment Plans

| Plan | Amount | Duration | Features |
|------|--------|----------|----------|
| **Starter** | $10.00 AUD | 30 days | Basic features, Email support |
| **Basic** | $25.00 AUD | 90 days | All Starter + Priority support, Analytics |
| **Pro** | $99.00 AUD | 1 year | All Basic + 24/7 support, API access |

---

## Available Pages

### 1. Main Index (`/`)
- Payment method selection
- Links to both checkout systems
- Admin panel access

### 2. Bank Transfer Checkout (`/bank-checkout.html`)
- Select plan
- Enter customer details
- Get unique payment code
- Display bank account details
- Show transfer instructions

### 3. Bank Transfer Admin (`/bank-admin.html`)
- View all pending transfers
- View completed transfers
- Verify transfers (generate license)
- Summary statistics
- Download/export transfer data

### 4. PayPal Checkout (`/checkout.html`)
- Original PayPal API integration (if credentials configured)
- Instant payment processing
- Automatic license delivery

---

## Backend API Endpoints

### Create Bank Transfer Request
```
POST /server/create-bank-transfer
Body: {
  email: "customer@example.com",
  fullName: "John Doe",
  plan: "basic"  // starter, basic, or pro
}
```

**Response:**
```json
{
  "success": true,
  "paymentCode": "PAY7K4M9",
  "transferId": "TXFR-ABC123",
  "amount": 25.00,
  "bankAccount": {
    "name": "SAMRATH SINGH",
    "number": "4760652",
    "bsb": "062948",
    "swift": "CTBAAU2S",
    "bank": "Commonwealth Bank (Australia)"
  },
  "instructions": {...}
}
```

### Verify Bank Transfer (Admin)
```
POST /server/verify-bank-transfer
Body: {
  paymentCode: "PAY7K4M9",
  adminPass: "your_admin_password"
}
```

**Response:**
```json
{
  "success": true,
  "license": "LIC-ABC123",
  "customerId": "CUST-XYZ789",
  "message": "Transfer verified and license sent to customer email"
}
```

### Get Bank Transfers (Admin)
```
GET /server/bank-transfers?pass=your_admin_password
```

**Response:**
```json
{
  "summary": {
    "total": 5,
    "pending": 2,
    "completed": 3,
    "totalPending": 75.00
  },
  "pending": [...],
  "completed": [...]
}
```

### Get Transfer Details
```
GET /server/transfer/PAY7K4M9
```

### Get Bank Account Details
```
GET /server/bank-account
```

### Get Available Plans
```
GET /server/plans
```

---

## Admin Panel Usage

### Login
1. Visit `/bank-admin.html`
2. Enter admin password (from `.env` ADMIN_PASS)
3. Click "Login"

### Dashboard Features

**Summary Cards:**
- Total Transfers
- Pending Transfers
- Verified Transfers
- Total Pending Amount

**Pending Transfers Section:**
- Shows all unverified transfers
- "Verify Payment" button for each
- Payment code, customer name, email, amount, date

**Verified Transfers Section:**
- Shows all completed transfers
- Displays license keys issued
- Reference for records

### Verifying a Transfer

1. **Receive bank transfer notification** from your bank
2. **Open admin panel** (`/bank-admin.html`)
3. **Login** with admin password
4. **Find the payment code** in pending transfers list
5. **Click "Verify Payment"** button
6. **Confirm** the verification
7. System automatically:
   - Generates license key
   - Sends license email to customer
   - Creates GitHub issue (if configured)
   - Records customer data

---

## Payment Codes

### Format
- 8 characters: `PAY` + 5 random uppercase alphanumerics
- Example: `PAY7K4M9`, `PAYAB12X`, `PAYZZXW3`

### Uniqueness
- Each code is globally unique
- Never reused
- Stored in database for tracking

### Customer Usage
- Customer includes code in bank transfer reference
- Admin uses code to match transfer to payment request
- Code links everything together

---

## Data Storage

### Transfer Records
Located in `server/db.json` under `bankTransfers` array:

```json
{
  "id": "TXFR-ABC123",
  "paymentCode": "PAY7K4M9",
  "email": "customer@example.com",
  "fullName": "John Doe",
  "plan": "basic",
  "amount": 25.00,
  "currency": "AUD",
  "status": "pending",  // or "completed"
  "createdAt": "2025-11-13T12:34:56.789Z",
  "completedAt": null,
  "license": null,
  "customerId": null
}
```

### License Records
Located in `server/db.json` under `licenses` array:

```json
{
  "license": "LIC-ABC123",
  "paymentCode": "PAY7K4M9",
  "transferId": "TXFR-ABC123",
  "plan": "basic",
  "email": "customer@example.com",
  "amount": 25.00,
  "status": "active",
  "transfer_status": "completed",
  "created_at": "2025-11-13T12:35:10.789Z",
  "verified_at": "2025-11-13T12:35:10.789Z"
}
```

### Customer Records
Located in `server/db.json` under `customers` array:

```json
{
  "id": "CUST-XYZ789",
  "email": "customer@example.com",
  "fullName": "John Doe",
  "plan": "basic",
  "amount": 25.00,
  "currency": "AUD",
  "license": "LIC-ABC123",
  "orderId": "TXFR-ABC123",
  "paymentMethod": "bank-transfer",
  "paymentCode": "PAY7K4M9",
  "dateCreated": "2025-11-13T12:35:10.789Z"
}
```

---

## Email Notifications

### Sent to Customer (After Verification)
- **Subject:** Your License Key - PayLinkBridge
- **Contains:**
  - License key
  - Plan details
  - Expiration date
  - How to use the license
  - Support contact information

### Sent to Admin (After Verification)
- **Subject:** New Payment Verified - PayLinkBridge
- **Contains:**
  - Customer name and email
  - Plan and amount
  - Payment code
  - License issued
  - Timestamp

---

## GitHub Integration (Optional)

If `GITHUB_TOKEN` is configured, system automatically creates issues:

**Issue Title:** `Payment Received: {CUSTOMER_NAME} - {PLAN}`

**Issue Body:**
```
Payment verified and processed

- **Customer:** John Doe (john@example.com)
- **Plan:** Basic ($25.00 AUD)
- **License:** LIC-ABC123
- **Payment Code:** PAY7K4M9
- **Order ID:** TXFR-ABC123
- **Date:** 2025-11-13

License sent to customer email.
```

**Labels:** `customer`, `license-issued`, `bank-transfer`

---

## Security Features

1. **Unique Payment Codes** - Each transfer has unique code
2. **Admin Password Protected** - Admin panel requires password
3. **Manual Verification** - No automatic processing without admin confirmation
4. **Email Verification** - Customers receive verification emails
5. **Database Encryption** - Sensitive data can be encrypted (optional)
6. **HTTPS Ready** - Configure HTTPS for production

---

## Production Setup Checklist

- [ ] SMTP configured for email delivery (Gmail or other)
- [ ] ADMIN_PASS set to strong password
- [ ] GITHUB_TOKEN configured (if using GitHub issues)
- [ ] Bank account details verified in .env
- [ ] Database backups set up
- [ ] Monitoring setup for email delivery
- [ ] HTTPS certificate installed
- [ ] Domain configured and pointing to server

---

## Troubleshooting

### "Payment code generation failed"
- Check server logs for errors
- Verify database.json is writable
- Restart server

### Admin login fails
- Verify ADMIN_PASS is set in .env
- Check password matches exactly
- Restart server after changing .env

### License email not sent
- Verify SMTP configuration in .env
- Check email credentials
- Review server logs for SMTP errors
- Verify recipient email is correct

### Customer can't get payment code
- Check `/server/plans` returns valid data
- Verify form inputs are valid
- Review browser console for errors

---

## Monitoring Transfers

### Daily Routine
1. Check bank account for transfers
2. Log into admin panel
3. Find matching payment code
4. Click "Verify" to process
5. Confirm license email was sent

### Weekly Reporting
- Export pending transfers list
- Reconcile with bank statement
- Check for any unverified transfers
- Review customer list

### Monthly Reconciliation
- Compare total transfers to bank account
- Verify all payments have licenses
- Archive completed transfers
- Backup database

---

## API Reference Summary

| Endpoint | Method | Purpose | Auth |
|----------|--------|---------|------|
| `/bank-checkout.html` | GET | Bank transfer checkout page | Public |
| `/bank-admin.html` | GET | Admin verification panel | Password |
| `/server/create-bank-transfer` | POST | Generate payment code | Public |
| `/server/verify-bank-transfer` | POST | Verify & process transfer | Password |
| `/server/bank-transfers` | GET | List all transfers | Password |
| `/server/transfer/:code` | GET | Get transfer details | Public |
| `/server/bank-account` | GET | Get bank account details | Public |
| `/server/plans` | GET | Get available plans | Public |

---

## Quick Commands

```bash
# Start server
npm start

# Development with auto-reload
npm run dev

# Check bank transfers
curl "http://localhost:4000/server/bank-transfers?pass=YOUR_ADMIN_PASS"

# Get bank account details
curl http://localhost:4000/server/bank-account

# Get available plans
curl http://localhost:4000/server/plans
```

---

## Contact & Support

- **Repository:** https://github.com/Sami9889/Checkoutv4
- **Issues:** https://github.com/Sami9889/Checkoutv4/issues
- **Account Owner:** SAMRATH SINGH
- **Bank:** Commonwealth Bank (Australia)

---

**Last Updated:** November 13, 2025  
**System Version:** 1.0.0 - Bank Transfer Edition  
**Status:** Production Ready ✅
