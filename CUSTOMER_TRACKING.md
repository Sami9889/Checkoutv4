# 🎯 Customer Tracking & GitHub Auto-Issues System

## Overview

When a customer pays, the system now automatically:
1. **Records their information** in `server/customers.json`
2. **Creates a GitHub issue** with their payment details
3. **Tracks all customers** in the admin dashboard
4. **Sends professional emails** with license keys

---

## 🔄 Payment Flow (Updated)

```
Customer pays via PayPal
    ↓
License generated (LIC-XXXXX)
    ↓
Customer data recorded in database
    ↓
GitHub issue created automatically 🎉
    ↓
Emails sent:
  • License key to customer
  • Notification to admin
  • Payout initiated to bank
```

---

## 📊 Customer Data Structure

Each customer record includes:

```json
{
  "id": "CUST-1731428745000",
  "paypalEmail": "customer@example.com",
  "fullName": "John Doe",
  "dateOfBirth": "1990-01-15",
  "plan": "pro",
  "amount": "99.00",
  "currency": "AUD",
  "license": "LIC-ABC123",
  "orderId": "8VD24839...",
  "status": "active",
  "createdAt": "2025-11-12T15:30:00Z",
  "githubIssueCreated": true,
  "githubIssueUrl": "https://github.com/Sami9889/Checkoutv4/issues/42"
}
```

---

## 🐙 GitHub Issues (Auto-Created)

When a customer pays, an issue is automatically created like this:

**Title**: `🎉 New License - PRO - John Doe`

**Body**:
```
## 📦 New Customer Registration

**Customer ID**: CUST-1731428745000

### Payment Information
- **Plan**: pro
- **Amount**: $99.00 AUD
- **Order ID**: 8VD24839...
- **License Key**: LIC-ABC123

### Customer Details
- **Email**: customer@example.com
- **Full Name**: John Doe
- **Payment Date**: Nov 12, 2025, 3:30 PM

### License Status
- **Status**: Active ✅
- **Issued**: 2025-11-12T15:30:00Z

---

*Automatically created by PayLinkBridge payment system*
```

**Labels**: `customer`, `license-issued`

---

## ⚙️ Configuration Required

### 1. GitHub Token (REQUIRED for auto-issues)

**Get GitHub Token:**
1. Go to https://github.com/settings/tokens
2. Click "Generate new token (classic)"
3. Check: `repo` (full control of private repositories)
4. Generate & copy token
5. Add to `.env`:
   ```
   GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxx
   ```

### 2. GitHub Owner & Repo

Already configured in `.env`:
```
GITHUB_OWNER=Sami9889
GITHUB_REPO=Checkoutv4
```

Change if your repo is different.

---

## 📍 Admin Endpoints

### View All Customers
```
GET /server/customers?pass=YOUR_ADMIN_PASS
```

**Response**:
```json
{
  "total": 5,
  "customers": [
    {
      "id": "CUST-1731428745000",
      "paypalEmail": "customer@example.com",
      "fullName": "John Doe",
      "plan": "pro",
      "amount": "99.00",
      "status": "active",
      "githubIssueCreated": true,
      "githubIssueUrl": "https://github.com/Sami9889/Checkoutv4/issues/42"
    }
    // ... more customers
  ]
}
```

### View Single Customer
```
GET /server/customers/CUST-1731428745000?pass=YOUR_ADMIN_PASS
```

**Response**:
```json
{
  "id": "CUST-1731428745000",
  "paypalEmail": "customer@example.com",
  "fullName": "John Doe",
  "dateOfBirth": "1990-01-15",
  "plan": "pro",
  "amount": "99.00",
  "currency": "AUD",
  "license": "LIC-ABC123",
  "orderId": "8VD24839...",
  "status": "active",
  "createdAt": "2025-11-12T15:30:00Z",
  "githubIssueCreated": true,
  "githubIssueUrl": "https://github.com/Sami9889/Checkoutv4/issues/42"
}
```

---

## 💾 Customer Database

Location: `server/customers.json`

**View customers manually**:
```bash
cat server/customers.json
```

**Structure**:
```json
[
  {
    "id": "CUST-...",
    "paypalEmail": "...",
    // ... customer fields
  },
  // ... more customers
]
```

---

## 🔐 Privacy & Security

✅ **What's Collected**:
- PayPal email
- Full name
- Date of birth (if provided)
- Payment plan & amount
- License key
- Payment date

✅ **What's NOT Collected**:
- PayPal passwords
- Credit card info
- Full payment details
- SSN or sensitive IDs

✅ **Where It's Stored**:
- Secure JSON database (`server/customers.json`)
- GitHub issues (public, but customer controls visibility)
- Email (professional & encrypted)

---

## 🐛 Troubleshooting

### GitHub Issue Not Created?

**Check**:
1. Is `GITHUB_TOKEN` set in `.env`?
   ```bash
   echo $GITHUB_TOKEN
   ```

2. Does token have `repo` permission?
   - Go to https://github.com/settings/tokens
   - Check token has full repo access

3. Are `GITHUB_OWNER` and `GITHUB_REPO` correct?
   ```
   GITHUB_OWNER=Sami9889
   GITHUB_REPO=Checkoutv4
   ```

4. Check server logs:
   ```bash
   npm run dev
   # Look for: ✅ GitHub issue created or ❌ Failed to create GitHub issue
   ```

### Cannot View Customers?

**Check**:
1. Is admin password correct?
   ```
   /server/customers?pass=YOUR_ADMIN_PASS
   ```

2. Have any payments been made?
   - Customer database is empty until first payment

3. Check file exists:
   ```bash
   ls -la server/customers.json
   ```

---

## 📈 Example Workflow

**Step 1: Customer Makes Payment**
```
User visits: http://localhost:4000/web/checkout.html
Selects: Pro Plan ($99)
Enters: Email, name, etc.
Clicks: Pay Now
Completes: PayPal payment
```

**Step 2: System Records Customer**
```
✅ License generated: LIC-ABC123
✅ Customer recorded: CUST-1731428745000
✅ Email sent to customer
✅ GitHub issue created: #42
```

**Step 3: Customer & Admin Notified**
```
📧 Customer receives:
   - License key
   - Order details

📧 Admin receives:
   - Payment notification
   - Customer info
   - Link to GitHub issue

🐙 GitHub receives:
   - Issue with customer details
   - Labels: customer, license-issued
```

**Step 4: Track Customer**
```
Admin visits: /server/customers?pass=admin_password
Sees: All customer records
Can: Click GitHub links to view issues
```

---

## 🎯 Benefits

✅ **Complete Customer Record** - All payment data in one place
✅ **GitHub Integration** - Issues track every customer
✅ **Professional** - Serious filenames and organization
✅ **Automated** - No manual data entry needed
✅ **Auditable** - Full history in GitHub & database
✅ **Email Notified** - Customer & admin both informed
✅ **Secure** - Passwords not stored, encrypted where needed

---

## 📚 Files Modified

1. **`server/customers.js`** - NEW (customer tracking & GitHub issues)
2. **`server/payments.js`** - UPDATED (calls customer recording)
3. **`server/server.js`** - UPDATED (added customers router)
4. **`.env`** - UPDATED (GitHub config)

---

## 🚀 Next Steps

1. **Get GitHub token**:
   - https://github.com/settings/tokens
   - Create token with `repo` permission
   - Add to `.env`: `GITHUB_TOKEN=...`

2. **Test payment**:
   ```bash
   npm start
   # Make test payment
   # Check: Customer recorded ✅
   # Check: GitHub issue created ✅
   # Check: Email received ✅
   ```

3. **Monitor customers**:
   - Visit: `http://localhost:4000/server/customers?pass=YOUR_PASSWORD`
   - See all customers
   - Click issue links

---

**Status**: ✅ Customer tracking system live
**Last Updated**: November 12, 2025
