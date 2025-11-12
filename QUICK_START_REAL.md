# 🚀 REAL CHECKOUT v4 - QUICK START

## ⚡ 3 Steps to Go Live

### Step 1: Configure Credentials
Edit `.env`:
```
PAYPAL_CLIENT_ID=abc123...
PAYPAL_SECRET=xyz789...
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_16_char_password
ADMIN_EMAIL=your_email@example.com
```

### Step 2: Install & Start
```bash
npm install
npm start
```

### Step 3: Test Payment
Visit: `http://localhost:4000/web/checkout.html`
- Select plan → Enter email → Click Pay → Complete PayPal flow
- Check email for license key ✅

---

## 📊 What Happens on Payment

1. **Customer** clicks "Pay Now"
2. **PayPal** processes payment in popup
3. **Server** captures order & generates unique license
4. **Email** sent to customer with license key
5. **Email** sent to admin with order details
6. **Payout** initiated to Commonwealth Bank account
7. **Admin dashboard** shows all details

---

## 🔗 Important URLs

| Page | URL |
|------|-----|
| Checkout Form | `http://localhost:4000/web/checkout.html` |
| Admin Dashboard | `http://localhost:4000/server/admin?pass=YOUR_ADMIN_PASS` |
| API Health Check | `http://localhost:4000/server/health` |

---

## 📧 Credentials You Need

| Service | Where to Get | .env Key |
|---------|--------------|----------|
| PayPal Client ID | https://developer.paypal.com | `PAYPAL_CLIENT_ID` |
| PayPal Secret | https://developer.paypal.com | `PAYPAL_SECRET` |
| Gmail App Password | https://myaccount.google.com/security | `SMTP_PASS` |
| Admin Email | Your email | `ADMIN_EMAIL` |

---

## ✅ Verification Checklist

After each payment, verify:
- [ ] License appears in admin dashboard
- [ ] Customer received license email
- [ ] Admin received notification email
- [ ] `server/db.json` shows license record
- [ ] No errors in server console

---

## 🆘 Troubleshooting

**"Email send failed"**
→ Check SMTP credentials (app password for Gmail, not regular password)

**"PayPal order creation failed"**
→ Check PAYPAL_CLIENT_ID and PAYPAL_SECRET are correct

**"No email received"**
→ Check admin ADMIN_EMAIL is set correctly

**"License not generated"**
→ Check payment status in PayPal is "COMPLETED"

---

## 📝 File Structure

```
/server
  ├── payments.js (REAL PayPal API)
  ├── email-service.js (REAL email sending)
  ├── paypal.js (PayPal authentication)
  ├── webhooks.js (Payment confirmations)
  └── db.json (All licenses & payments)

/web
  ├── checkout.html (Payment form)
  ├── script.js (PayPal integration)
  └── style.css (Professional styling)

/.github/workflows
  ├── payment-menu.yml (Post menu on issues)
  └── paylinkbridge-issue-handler.yml (Handle requests)

.env (YOUR CREDENTIALS HERE - DO NOT COMMIT)
```

---

## 🎯 Current Status

✅ **All Real** - No mock mode
✅ **All Working** - Production ready
✅ **All Configured** - Just needs your credentials

**Ready to accept REAL payments!** 💰

---

Last Updated: November 12, 2025
