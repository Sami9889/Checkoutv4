# 🎯 CUSTOMER TRACKING - QUICK REFERENCE

## What Happens When Customer Pays

```
Customer pays $99 (Pro plan)
    ↓ (immediately)
License: LIC-ABC123 ✅
Customer ID: CUST-1731428745000 ✅
    ↓ (async, non-blocking)
GitHub Issue Created
  Title: 🎉 New License - PRO - John Doe
  URL: Stored in customer record
    ↓ (immediately)
Emails Sent:
  📧 Customer: License key
  📧 Admin: Payment notification
```

---

## 🔧 Setup (1 Step)

**Get GitHub Token:**
1. Go to https://github.com/settings/tokens
2. "Generate new token (classic)"
3. Check: `repo` permission
4. Copy token
5. Add to `.env`:
   ```
   GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxx
   ```

Done! GitHub issues now auto-create on each payment.

---

## 📊 View Customers

### In Browser
```
http://localhost:4000/server/customers?pass=YOUR_ADMIN_PASSWORD
```

Shows JSON with all customers:
```json
{
  "total": 5,
  "customers": [
    {
      "id": "CUST-1731428745000",
      "paypalEmail": "john@example.com",
      "fullName": "John Doe",
      "plan": "pro",
      "amount": "99.00",
      "license": "LIC-ABC123",
      "githubIssueUrl": "https://github.com/Sami9889/Checkoutv4/issues/42"
    },
    // ... more customers
  ]
}
```

### In Terminal
```bash
cat server/customers.json | jq '.'
```

---

## 🐙 GitHub Issues

**Auto-created issues have:**
- Title: `🎉 New License - [PLAN] - [NAME]`
- Labels: `customer`, `license-issued`
- Body: Full payment & customer info
- Link: Stored in customer record

**Find them:**
1. https://github.com/Sami9889/Checkoutv4/issues
2. Filter by label: `customer` or `license-issued`

---

## 💾 Customer Data Stored

Per customer:
- ✅ PayPal email
- ✅ Full name
- ✅ Date of birth
- ✅ Plan purchased
- ✅ Amount paid
- ✅ License key
- ✅ Payment date
- ✅ GitHub issue link
- ❌ Password (never stored)
- ❌ Credit card (never stored)

---

## 📍 API Endpoints

### List All Customers
```
GET /server/customers?pass=YOUR_ADMIN_PASS
```
Response: `{ total: N, customers: [...] }`

### Get One Customer
```
GET /server/customers/CUST-1731428745000?pass=YOUR_ADMIN_PASS
```
Response: Full customer object

---

## 🔐 Security

✅ **Passwords**: Never stored
✅ **Credit cards**: Not handled (PayPal does)
✅ **Private data**: Encrypted where needed
✅ **Admin access**: Password protected
✅ **GitHub issues**: Can be private repo

---

## 🆘 Troubleshooting

**GitHub issue didn't create?**
- [ ] Is GITHUB_TOKEN set?
- [ ] Does token have `repo` permission?
- [ ] Are GITHUB_OWNER and GITHUB_REPO correct?
- Check server logs: `npm run dev`

**Can't view customers?**
- [ ] Correct admin password?
- [ ] Any payments made yet?
- [ ] Check file exists: `ls server/customers.json`

---

## 📈 Business Use

### Track Growth
```bash
curl "http://localhost:4000/server/customers?pass=pwd" | grep -c '"id"'
# Shows total customer count
```

### Export Customers
```bash
cat server/customers.json > backup-customers.json
```

### Find Repeat Customers
```bash
# Look in customers.json for multiple payments from same email
```

### Revenue Tracking
```bash
# Sum all "amount" fields to see total revenue
```

---

## 🎯 Example

**Payment Comes In:**
```json
{
  "email": "john@example.com",
  "fullName": "John Doe",
  "plan": "pro",
  "amount": "99.00"
}
```

**System Creates:**
1. **License**: `LIC-ABC123`
2. **Customer ID**: `CUST-1731428745000`
3. **GitHub Issue**: #42 with all details
4. **Email**: Sent to customer with license
5. **Record**: Stored in `server/customers.json`

**You See:**
- `/server/customers?pass=pwd` → Full list
- GitHub issue #42 → Full details with link
- Email from PayPal → Payment confirmation

---

## ✅ Files Modified

- `server/customers.js` - NEW (tracking system)
- `server/payments.js` - UPDATED (calls customer tracking)
- `server/server.js` - UPDATED (adds customers router)
- `.env` - UPDATED (GitHub config)
- `CUSTOMER_TRACKING.md` - NEW (full guide)

---

## 🚀 Start Using Now

1. **Configure GitHub token** in `.env`
2. **Test payment**: `npm start` → make test payment
3. **Check customers**: Visit `/server/customers?pass=pwd`
4. **View issue**: See auto-created GitHub issue
5. **Done!** System working end-to-end ✅

---

**Status**: ✅ Ready to use
**Config needed**: GitHub token only
**Files**: All updated and tested
