# Embed PayLinkBridge Checkout on Your Website

## Quick Start - 2 Minute Setup

### Option 1: Embedded Widget (Recommended)

Add this single line to your website:

```html
<script src="https://your-domain.com/checkout-widget.js"></script>
<div id="paylink-checkout"></div>
```

That's it! A professional checkout form will appear.

### Option 2: Direct Link

Direct customers to your checkout page:

```html
<a href="https://your-domain.com/checkout.html" class="btn-checkout">
  Buy Now
</a>
```

### Option 3: Custom Integration

For custom styling, use the PayPal SDK directly:

```html
<script src="https://www.paypal.com/sdk/js?client-id=YOUR_CLIENT_ID&currency=AUD"></script>
<div id="paypal-button-container"></div>

<script>
  paypal.Buttons({
    createOrder: async () => {
      const response = await fetch('https://your-domain.com/server/create-order', {
        method: 'POST',
        body: JSON.stringify({ amount: 25.00, currency: 'AUD' })
      });
      return (await response.json()).id;
    },
    onApprove: async (data) => {
      const response = await fetch('https://your-domain.com/server/capture-order', {
        method: 'POST',
        body: JSON.stringify({ orderId: data.orderID })
      });
      alert('Payment successful! License: ' + (await response.json()).license);
    }
  }).render('#paypal-button-container');
</script>
```

---

## Configuration

### Update these settings in .env:

```env
PAYPAL_CLIENT_ID=your_sandbox_client_id
PAYPAL_SECRET=your_sandbox_secret
PAYPAL_PAYOUT_EMAIL=your_paypal_email@example.com
MODE=paypal
```

### Update HTML checkout pages:

Replace `YOUR_CLIENT_ID` in:
- `web/checkout.html` (line with PayPal SDK)
- `web/index.html` (line 7)

---

## Hosted Checkout Pages

### Page: `/checkout.html`
Professional standalone checkout page
- Plan selection
- Email/name entry
- PayPal payment button
- Success/failure handling

### Page: `/success.html`
Success page after payment
- License key display
- Copy to clipboard
- Next steps
- Confirmation email notification

### Page: `/` (index.html)
Demo page with all features
- Legacy payment request form
- KYC upload
- Multiple sections

---

## API Endpoints for Custom Integration

### Create Order
```
POST /server/create-order
Body: {amount, currency, plan, email}
Returns: {id, status, links}
```

### Capture Order
```
POST /server/capture-order
Body: {orderId, payerEmail, plan}
Returns: {success, license, fees, payout}
```

---

## Webhook Setup (For Payment Confirmations)

1. Log in to PayPal Developer Dashboard
2. Navigate to Webhooks in your app settings
3. Add webhook URL: `https://your-domain.com/server/webhooks/paypal`
4. Subscribe to:
   - PAYMENT.CAPTURE.COMPLETED
   - PAYMENT.CAPTURE.DECLINED
   - CHECKOUT.ORDER.COMPLETED

---

## Example Embed Scenarios

### Scenario 1: Simple Button on Your Site

```html
<button onclick="window.location.href='/checkout.html'">
  Buy Now - $25
</button>
```

### Scenario 2: Embedded Modal

```html
<script src="https://your-domain.com/checkout-widget.js"></script>

<button onclick="showCheckout()">Open Checkout</button>

<div id="paylink-checkout" style="display:none;"></div>

<script>
  function showCheckout() {
    document.getElementById('paylink-checkout').style.display = 'block';
  }
</script>
```

### Scenario 3: Multiple Plans on One Page

```html
<script src="https://www.paypal.com/sdk/js?client-id=YOUR_ID"></script>

<div>
  <h2>Select Your Plan</h2>
  
  <div class="plan">
    <h3>Starter - $10</h3>
    <button onclick="checkout('starter', 10.00)">Buy</button>
  </div>
  
  <div class="plan">
    <h3>Basic - $25</h3>
    <button onclick="checkout('basic', 25.00)">Buy</button>
  </div>
  
  <div class="plan">
    <h3>Pro - $99</h3>
    <button onclick="checkout('pro', 99.00)">Buy</button>
  </div>
</div>

<script>
  function checkout(plan, amount) {
    // Create order and redirect
    fetch('/server/create-order', {
      method: 'POST',
      body: JSON.stringify({amount, plan})
    })
    .then(r => r.json())
    .then(data => window.location.href = '/checkout.html?plan=' + plan);
  }
</script>
```

---

## Customization

### Change Colors

Edit `web/checkout-widget.js`:
```javascript
const COLORS = {
  primary: '#0070ba',    // PayPal blue
  secondary: '#003087',
  success: '#10b981'
};
```

### Change Plans

Edit `web/checkout-widget.js` or `web/checkout.html`:
```javascript
const PLANS = {
  starter: { price: 10.00, name: 'Starter', features: [...] },
  basic: { price: 25.00, name: 'Basic', features: [...] },
  pro: { price: 99.00, name: 'Pro', features: [...] }
};
```

### Change Currency

In PayPal SDK script:
```html
<!-- AUD -->
<script src="https://www.paypal.com/sdk/js?client-id=YOUR_ID&currency=AUD"></script>

<!-- USD -->
<script src="https://www.paypal.com/sdk/js?client-id=YOUR_ID&currency=USD"></script>

<!-- EUR -->
<script src="https://www.paypal.com/sdk/js?client-id=YOUR_ID&currency=EUR"></script>
```

---

## Payment Flow

```
1. Customer clicks "Buy Now"
   ↓
2. Frontend: Create order via /server/create-order
   ↓
3. Backend: Call PayPal API to create order
   ↓
4. Frontend: Show PayPal approval window
   ↓
5. Customer: Log in & approve payment
   ↓
6. Frontend: Call /server/capture-order
   ↓
7. Backend: Capture payment & calculate fees
   ↓
8. Backend: Auto-initiate payout to your bank
   ↓
9. Frontend: Show success page with license
   ↓
10. Customer: Receives confirmation email
```

---

## Fees & Payouts

**Fee Structure:**
- Platform Fee: 2.5%
- PayPal Fee: ~1.5%
- Total: ~4% (varies by payment method)

**Example:**
- Customer pays: $25.00
- Platform fee (2.5%): $0.63
- PayPal fee (1.5%): $0.38
- **You receive: $23.99**

Payouts go directly to your Commonwealth Bank account:
- Account: SAMRATH SINGH
- BSB: 062948
- Account: 47606522

---

## Testing

### Test Credentials:
- Mode: Sandbox
- Client ID: Your sandbox ID
- No real money charged

### Test Buyer Account:
Get from PayPal Developer Dashboard → Accounts

### Test Steps:
1. Visit checkout page
2. Enter test email
3. Click PayPal button
4. Approve payment
5. Receive test license
6. Check db.json for transaction

---

## Production Deployment

### Before Going Live:

1. Get LIVE PayPal credentials
2. Update PAYPAL_ENV to 'live'
3. Enable HTTPS certificate
4. Update PAYPAL_CLIENT_ID in HTML
5. Set PAYPAL_PAYOUT_EMAIL to real account
6. Backup database
7. Test one payment manually
8. Monitor webhook events

### Update .env for Production:
```env
PAYPAL_ENV=live
MODE=paypal
PAYPAL_CLIENT_ID=your_live_client_id
PAYPAL_SECRET=your_live_secret
PAYLINK_SELF_URL=https://your-domain.com
```

---

## Support & Monitoring

### View All Transactions:
```
http://localhost:4000/server/admin?pass=change_me
```

### Check Payment Logs:
```
cat server/db.json | grep -A5 "licenses"
```

### Webhook Events:
```
http://localhost:4000/server/admin/webhooks?admin_pass=change_me
```

---

## Troubleshooting

### Widget Not Showing?
- Check browser console (F12)
- Verify CLIENT_ID is correct
- Clear browser cache
- Check CORS settings

### Payment Fails?
- Verify PayPal credentials in .env
- Check internet connection
- Review PayPal status
- Check server logs

### No Payout?
- Verify PAYPAL_PAYOUT_EMAIL in .env
- Check PayPal account is in good standing
- Verify bank account details
- Check webhook events

---

## Next Steps

1. **Test**: Use sandbox mode first
2. **Customize**: Update colors, plans, features
3. **Embed**: Add widget to your website
4. **Go Live**: Switch to production credentials
5. **Monitor**: Track payments and payouts

---

**PayLinkBridge v1.0.0** - Ready for Production
