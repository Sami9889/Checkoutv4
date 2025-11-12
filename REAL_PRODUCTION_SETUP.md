# PayLinkBridge - Complete Real Setup

## ✅ What's Fixed

- ✅ **Removed all mock mode** - PayPal only
- ✅ **Added real email sending** - License delivery via email
- ✅ **Real payout system** - Fees sent to your Commonwealth Bank
- ✅ **Real admin notifications** - You get emailed on each payment
- ✅ **Real GitHub integration** - Workflows post payment menus & handle requests

---

## 🔧 Required Configuration

### 1. PayPal Setup (REQUIRED)

**Get credentials:**
1. Go to https://developer.paypal.com
2. Log in with your PayPal business account
3. Click **"Apps & Credentials"** → **Sandbox** tab
4. Copy **Client ID** and **Secret** from your app
5. Update `.env`:
   ```
   PAYPAL_CLIENT_ID=your_client_id_here
   PAYPAL_SECRET=your_secret_here
   PAYPAL_ENV=sandbox
   ```

### 2. Email Setup (REQUIRED for license delivery)

**Using Gmail:**
1. Go to https://myaccount.google.com/security
2. Enable 2-factor authentication
3. Go to **App passwords** → Select **Mail** → **Windows Computer**
4. Copy the 16-character password
5. Update `.env`:
   ```
   SMTP_USER=your_email@gmail.com
   SMTP_PASS=your_16_char_app_password
   ```

**Using other email provider:**
- Update SMTP_HOST and SMTP_PORT accordingly
- Common values: 
  - Outlook: smtp-mail.outlook.com:587
  - SendGrid: smtp.sendgrid.net:587

### 3. Admin Email (REQUIRED)

Update `.env`:
```
ADMIN_EMAIL=your_email@example.com
PAYPAL_PAYOUT_EMAIL=your_paypal_business_email@example.com
```

You'll receive an email after each payment with order details.

### 4. GitHub Actions Secrets (OPTIONAL but recommended)

Add to GitHub repo (Settings → Secrets and variables → Actions):
- `PAYPAL_API_URL`: Your deployed server URL (e.g., https://checkout.example.com)

---

## 🚀 Running Locally

```bash
# 1. Install dependencies
npm install

# 2. Update .env with your credentials

# 3. Start server
npm start
# OR with auto-reload:
npm run dev

# 4. Visit http://localhost:4000/web/checkout.html
```

**Test checkout:**
1. Select a plan
2. Enter email
3. Click "Pay Now"
4. Use PayPal sandbox test account:
   - Email: sb-xxxxxxx@business.example.com (from your sandbox account)
   - Password: Check PayPal Developer Dashboard
5. Approve payment
6. Check your email for license key ✅

---

## 📊 Admin Dashboard

Access admin dashboard at:
```
http://localhost:4000/server/admin?pass=<your_ADMIN_PASS>
```

Shows:
- All licenses issued
- All payments received
- All payouts sent
- KYC records

---

## 🔴 Common Issues & Fixes

### "Email send failed"
- **Solution**: Check SMTP credentials in .env
- Verify app password (not regular password for Gmail)
- Check email account has SMTP enabled

### "PayPal order creation failed"
- **Solution**: Check PAYPAL_CLIENT_ID and PAYPAL_SECRET in .env
- Verify they're from **Sandbox** (not Live) if using `PAYPAL_ENV=sandbox`
- Check PayPal API is accessible (not blocked by firewall)

### "Payout failed"
- **Solution**: Make sure PAYPAL_PAYOUT_EMAIL is a PayPal business account email
- Ensure payout feature is enabled in PayPal business settings
- Check bank details in .env are correct

### GitHub Actions not posting comments
- **Solution**: Add `PAYLINK_API_URL` secret to GitHub (your deployed server URL)
- Verify workflow has `permissions: issues: write`
- Check that issue has `paylink-request` label

---

## 🚀 Deploying to Production

When deploying to a server (Heroku, AWS, DigitalOcean, etc.):

1. **Update .env in production:**
   ```
   PAYPAL_ENV=live
   PAYPAL_CLIENT_ID=your_live_client_id
   PAYPAL_SECRET=your_live_secret
   PAYLINK_SELF_URL=https://your-production-domain.com
   ```

2. **Set as environment variables** (don't commit .env):
   - Use platform's env var settings (Heroku Config Vars, AWS Secrets Manager, etc.)
   - Or use `.env.production` with proper .gitignore

3. **Update GitHub Secrets:**
   - Add `PAYLINK_API_URL=https://your-production-domain.com`

4. **Test in production:**
   - Run a test payment with a small amount
   - Verify license email is delivered
   - Check payout was initiated

---

## ✅ Verification Checklist

Before considering "production-ready":

- [ ] PayPal credentials configured and tested
- [ ] Email sending works (test license received)
- [ ] Admin receives payment notifications
- [ ] Licenses are unique and generated correctly
- [ ] Payouts are calculated correctly (see admin dashboard)
- [ ] GitHub workflows post payment menu on issues
- [ ] No error logs in terminal

---

## 📧 Email Templates

**License email** includes:
- License key
- Plan type
- Order ID
- Delivery date

**Admin notification** includes:
- Customer email
- Plan type
- Amount paid
- Order ID
- Link to admin dashboard

---

## 💰 Payout System

**How it works:**
1. Customer pays via PayPal
2. License is generated & sent via email
3. Fee is calculated (see `bank-config.js`)
4. Admin is notified
5. Payout is automatically initiated to PAYPAL_PAYOUT_EMAIL
6. Funds go to Commonwealth Bank account (if connected)

**To verify payouts:**
1. Check `server/db.json` - each license has `payout` field
2. Check PayPal account - payouts should appear in batch list
3. Check bank account - funds arrive 1-3 business days after approval

---

## 🆘 Need Help?

- PayPal issues: https://developer.paypal.com/docs
- Email issues: nodemailer.com docs
- GitHub Actions: github.com/actions

---

**Status**: ✅ All systems ready for real payments
**Last Updated**: November 12, 2025
**Mode**: PAYPAL (no mock fallback)
