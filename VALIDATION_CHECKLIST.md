# ✅ VALIDATION CHECKLIST - REAL SYSTEM

Use this checklist to verify everything is working correctly.

## 🔧 Pre-Setup Checks

- [ ] Node.js installed (check: `node --version`)
- [ ] npm installed (check: `npm --version`)
- [ ] Git configured (check: `git config --list`)
- [ ] All files downloaded (check: `ls -la`)

## 📋 Configuration Checks

- [ ] `.env` file exists in project root
- [ ] `PAYPAL_CLIENT_ID` is set (not placeholder)
- [ ] `PAYPAL_SECRET` is set (not placeholder)
- [ ] `SMTP_USER` is set (your email)
- [ ] `SMTP_PASS` is set (16-char app password, not regular password)
- [ ] `ADMIN_EMAIL` is set
- [ ] `PAYPAL_ENV=sandbox` (not live yet)
- [ ] No `.env` file committed to git (in .gitignore)

## 📦 Dependency Checks

After running `npm install`:

- [ ] `nodemailer` installed (check: `npm list nodemailer`)
- [ ] `express` installed
- [ ] `dotenv` installed
- [ ] `node-fetch` installed
- [ ] No error messages during install

## 🚀 Server Startup Checks

After running `npm start`:

- [ ] Server starts without errors
- [ ] Console shows: "running on port 4000"
- [ ] Console shows: "Mode: paypal"
- [ ] No "undefined" errors in logs
- [ ] Ctrl+C stops the server gracefully

## 🌐 Frontend Checks

Visit `http://localhost:4000/web/checkout.html`:

- [ ] Page loads without 404
- [ ] Plan selector visible (Starter, Basic, Pro)
- [ ] Email input field present
- [ ] Amount display updates when plan changes
- [ ] "Pay Now" button visible
- [ ] No console errors (F12 → Console)

## 💳 Payment Flow Checks

**Create a test PayPal account:**

1. Go to https://developer.paypal.com
2. Create a Personal sandbox buyer account
3. Note the email and password

**Then test payment:**

- [ ] Click "Pay Now" button
- [ ] PayPal login popup appears
- [ ] Login with sandbox buyer account
- [ ] Review order details
- [ ] Click "Pay Now" button in PayPal
- [ ] Redirected back to checkout page
- [ ] Success message appears
- [ ] License key displayed on page
- [ ] No errors in server console

## 📧 Email Checks

After successful payment:

**Customer Email:**
- [ ] Check your email (the one you paid from) for license delivery
- [ ] Subject line: "Your License Key - [plan name] Plan"
- [ ] License key visible in email
- [ ] Order ID matches payment
- [ ] Email sent within 30 seconds of payment

**Admin Email:**
- [ ] Check admin email for payment notification
- [ ] Subject line: "🎉 New Payment - [plan name] Plan"
- [ ] Shows customer email, plan, amount
- [ ] Includes link to admin dashboard
- [ ] Email sent within 30 seconds of payment

## 📊 Admin Dashboard Checks

Visit `http://localhost:4000/server/admin?pass=YOUR_ADMIN_PASS`:

(Replace YOUR_ADMIN_PASS with value from .env)

- [ ] Page loads without 401 error
- [ ] Shows "Licenses" section
- [ ] Your test license appears in list
- [ ] Shows license key (matches email)
- [ ] Shows order ID
- [ ] Shows customer email
- [ ] Shows amount and plan
- [ ] Shows payment status

## 💾 Database Checks

Open `server/db.json` and verify:

- [ ] File exists
- [ ] Contains valid JSON (no syntax errors)
- [ ] Has `licenses` array
- [ ] Your test license is in the array
- [ ] License has all fields:
  - [ ] `license` key
  - [ ] `orderId`
  - [ ] `plan`
  - [ ] `email`
  - [ ] `amount`
  - [ ] `status: "active"`
  - [ ] `paypal_status: "COMPLETED"`
  - [ ] `created_at` timestamp
  - [ ] `fees` breakdown
  - [ ] `payout` information

## 🔗 GitHub Integration Checks

(Only if using GitHub Actions)

- [ ] GitHub repo has `paylink-request` label
- [ ] `.github/workflows/` folder exists
- [ ] `payment-menu.yml` file present
- [ ] `paylinkbridge-issue-handler.yml` file present
- [ ] `PAYLINK_API_URL` secret configured in GitHub (if needed)

**Create a test issue:**

- [ ] Title: "Test Payment"
- [ ] Body: "I want to pay for the pro plan"
- [ ] Add label: `paylink-request`
- [ ] Check that workflow triggers (see Actions tab)
- [ ] Check that payment menu comment is posted
- [ ] Menu shows payment links for each plan

## 🐛 Error Checks

Look for these errors and fix if found:

### Email Errors
```
❌ "Email send failed"
→ Check SMTP credentials
→ For Gmail: Use app password, not regular password
→ For other email: Check SMTP_HOST and SMTP_PORT
```

### PayPal Errors
```
❌ "Order creation failed"
→ Check PAYPAL_CLIENT_ID and PAYPAL_SECRET
→ Check PAYPAL_ENV is "sandbox"
→ Check PayPal API is not blocked by firewall

❌ "Payment not completed"
→ Check PayPal order status in sandbox
→ Verify payment was approved (not pending)
```

### Server Errors
```
❌ "Cannot find module 'nodemailer'"
→ Run: npm install nodemailer

❌ "PAYPAL_CLIENT_ID not configured"
→ Update .env file with real credentials

❌ "404 Not Found"
→ Check server is running on port 4000
→ Check URL is correct
```

## ✅ All Checks Pass?

Congratulations! Your system is working. Now you can:

### Option A: Keep Testing
- Create more test payments
- Test different plans
- Test error scenarios
- Check admin dashboard regularly

### Option B: Deploy to Production
1. Update `.env` with live PayPal credentials
2. Change `PAYPAL_ENV=live`
3. Deploy to production server
4. Update `PAYLINK_SELF_URL` to production domain
5. Run first real payment test with small amount

### Option C: Share Payment Links
1. Direct users to `http://your-domain:4000/web/checkout.html?plan=pro`
2. Or use GitHub issues with `paylink-request` label
3. Or add PayPal button to your website

---

## 🆘 Still Having Issues?

Check these in order:

1. **Server logs** - Run with: `npm run dev` to see detailed logs
2. **Browser console** - F12 → Console tab for JavaScript errors
3. **PayPal sandbox** - Check order status in Developer Dashboard
4. **Email delivery** - Check spam folder
5. **Credentials** - Verify .env values match PayPal/Email accounts

---

## 📝 Testing Notes

- Use sandbox credentials for testing (never use real money for testing)
- All test licenses are functional
- All test emails go to configured address
- All test payouts are recorded but not sent to bank
- Test data persists in `server/db.json`

---

**Status**: Use this checklist to validate your setup
**Last Updated**: November 12, 2025
**Help**: See REAL_PRODUCTION_SETUP.md for detailed guides
