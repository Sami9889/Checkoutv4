# 💰 Payment Distribution & Embedded Checkout Guide

## Payment Flow to Your Bank Account

Every payment automatically tracks and calculates the net amount that goes to your Commonwealth Bank account.

### Your Bank Details (Automatic Payouts)
- **Account Name**: SAMRATH SINGH
- **Bank**: Commonwealth Bank of Australia
- **BSB**: 062948
- **Account Number**: 4760 6522
- **BIC/SWIFT**: CTBAAU2S
- **Address**: 2 ZUCCOTTI CRES, POINT COOK VIC 3030

### Fee Structure
- **PayPal Fee**: 2.9% + $0.30 per transaction
- **Your Net**: Amount after PayPal fees

### Example Payment Breakdown
```
Customer pays: $25.00 AUD
├─ PayPal fee (2.9% + $0.30): -$1.03
└─ You receive: $23.97 → Transferred to your bank account
```

## Payout Tracking API Endpoints

### Check Fee Breakdown
```bash
curl -X POST http://localhost:4000/server/fees \
  -H "Content-Type: application/json" \
  -d '{"amount": "25.00"}'
```

Response:
```json
{
  "success": true,
  "amount": 25.00,
  "breakdown": {
    "paypalPercentageFee": 0.73,
    "paypalFixedFee": 0.30,
    "totalFees": 1.03
  },
  "youReceive": 23.97,
  "bankAccount": "4760 6522"
}
```

### Get Payout Report (Admin)
```bash
curl "http://localhost:4000/server/admin/payouts-report?admin_pass=change_me"
```

Response shows:
- Total payments received
- Total fees paid
- Total amount transferred to your account
- List of all transactions

### View Your Bank Details (Admin)
```bash
curl "http://localhost:4000/server/admin/bank-details?admin_pass=change_me"
```

### Get All Payouts (Admin)
```bash
curl "http://localhost:4000/server/admin/all-payouts?admin_pass=change_me"
```

### Mark Payment as Transferred (Admin)
```bash
curl -X POST "http://localhost:4000/server/admin/mark-transferred?admin_pass=change_me" \
  -H "Content-Type: application/json" \
  -d '{"payoutId": "PO-1234567890"}'
```

---

## 🌐 Embed Checkout on Your Website

### Option 1: iframe Embed (Recommended)

Add this to your website HTML:

```html
<!-- Add PayPal SDK script -->
<script src="https://www.paypal.com/sdk/js?client-id=YOUR_CLIENT_ID&currency=AUD"></script>

<!-- Add checkout container -->
<div id="paypal-checkout-container"></div>

<!-- Add initialization script -->
<script src="https://yourserver.com/checkout-embed.js"></script>
```

### Option 2: Checkout Link

Direct users to your checkout page:
```
https://yourserver.com?plan=basic&email=customer@example.com
```

### Option 3: Standalone Widget

```html
<script>
  async function startCheckout(plan) {
    const response = await fetch('/server/create-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        amount: getPriceForPlan(plan), 
        plan: plan,
        email: document.getElementById('email').value,
        currency: 'AUD'
      })
    });
    const order = await response.json();
    // Redirect to PayPal
    window.location = order.links.find(l => l.rel === 'approve').href;
  }
</script>

<!-- Button on your website -->
<button onclick="startCheckout('basic')">Buy Basic Plan - $25 AUD</button>
```

---

## 📊 Payout Summary Dashboard

View your earnings in real-time:

```bash
# Get comprehensive summary
curl "http://localhost:4000/server/admin/all-payouts?admin_pass=change_me"
```

Output includes:
- Total pending transfers
- Total processed transfers
- Total transferred to bank
- Individual transaction details
- Your bank account info

---

## 🔄 Automatic Payout Process

1. **Customer Pays** → Payment recorded
2. **Fees Calculated** → PayPal charges applied
3. **Net Amount** → Calculated automatically
4. **Payout Recorded** → Logged in database
5. **Transfer to Bank** → Can be marked as transferred

---

## Configuration

### Environment Variables for Payouts

```env
# PayPal settings
PAYPAL_CLIENT_ID=your_sandbox_id
PAYPAL_SECRET=your_sandbox_secret
PAYPAL_ENV=sandbox
PAYPAL_PAYOUT_EMAIL=your-paypal-email@example.com

# Admin access
ADMIN_PASS=your_secure_password

# Server
PORT=4000
MODE=paypal
```

---

## Embedding Checkout Step by Step

### 1. Get Your PayPal Client ID
- Go to: https://developer.paypal.com/dashboard
- Copy your Sandbox or Live Client ID

### 2. Update Configuration
- Update your .env file with Client ID
- Set MODE=paypal for real payments
- Set PAYPAL_ENV=sandbox for testing

### 3. Add Checkout Button to Website

```html
<!DOCTYPE html>
<html>
<head>
    <title>My Product</title>
    <script src="https://www.paypal.com/sdk/js?client-id=YOUR_CLIENT_ID&currency=AUD"></script>
</head>
<body>
    <h1>Buy Our Product</h1>
    <p>Price: $25.00 AUD</p>
    
    <input type="email" id="email" placeholder="Your email" required>
    <div id="paypal-button-container"></div>

    <script>
        paypal.Buttons({
            createOrder: async (data, actions) => {
                const response = await fetch('/server/create-order', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        amount: '25.00',
                        currency: 'AUD',
                        plan: 'basic',
                        email: document.getElementById('email').value
                    })
                });
                const order = await response.json();
                return order.id;
            },
            onApprove: async (data, actions) => {
                const response = await fetch('/server/capture-order', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        orderId: data.orderID,
                        payerEmail: document.getElementById('email').value,
                        plan: 'basic'
                    })
                });
                const result = await response.json();
                if (result.success) {
                    alert('Success! Your license: ' + result.license);
                }
            }
        }).render('#paypal-button-container');
    </script>
</body>
</html>
```

### 4. Test with Sandbox

Use test buyer account from PayPal Sandbox:
- Email: sb-xxxxx@personal.example.com
- Password: See PayPal Dashboard

### 5. View Payouts

```bash
curl "http://localhost:4000/server/admin/all-payouts?admin_pass=change_me"
```

---

## Payment Plans Configuration

Edit pricing in web/script.js:

```javascript
const PLANS = {
  starter: { price: 10.00, name: 'Starter Plan' },
  basic: { price: 25.00, name: 'Basic Plan' },
  pro: { price: 99.00, name: 'Pro Plan' }
};
```

Each plan automatically tracks:
- Customer email
- Amount paid
- PayPal order ID
- Fees deducted
- Net amount to your account

---

## For Production

### Switch to Live Mode
```env
MODE=paypal
PAYPAL_ENV=live
PAYPAL_CLIENT_ID=your_live_client_id
PAYPAL_SECRET=your_live_secret
```

### Enable HTTPS
- Get SSL certificate
- Configure HTTPS on server
- Update PAYLINK_SELF_URL

### Set Admin Password
```env
ADMIN_PASS=secure_random_password_here
```

### Configure Webhook
Set in PayPal Dashboard:
```
https://yourdomain.com/server/webhooks/paypal
```

---

## Troubleshooting

### Payouts Not Appearing
- Check: `curl http://localhost:4000/server/admin/all-payouts?admin_pass=change_me`
- Verify: Payment actually captured in PayPal
- Check: Database (server/db.json) has payout records

### Wrong Amount to Bank
- Verify fees: `curl -X POST http://localhost:4000/server/fees -d '{"amount":"25"}'`
- Check PayPal rates (2.9% + $0.30)
- Confirm bank details are correct

### Email Not Received
- Check spam folder
- Verify email in database
- Check server logs for errors

---

## Summary

✅ All payments automatically calculate net payout to your bank
✅ Dashboard shows real-time earnings
✅ Can embed checkout on any website
✅ Automatic fee handling (PayPal standard rates)
✅ Complete transaction history
✅ Admin reporting tools

**Your Bank Account**: Commonwealth Bank
**Account**: 4760 6522 (BSB 062948)
**Automatic Payouts**: After each successful payment
