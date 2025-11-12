# PayLinkBridge - Real PayPal Integration Setup

## What's Implemented

✅ **Real PayPal Checkout Integration**
- PayPal SDK integration in the web interface
- Complete order creation & capture flow
- Proper error handling and status messages
- License generation on successful payment

✅ **Backend API Endpoints**
- `/server/create-order` - Creates PayPal orders
- `/server/capture-order` - Captures completed orders
- `/server/issue` - Processes payment requests
- `/server/kyc/upload` - KYC document uploads
- `/server/kyc/admin/verify` - Admin KYC verification
- `/server/request-payout` - Payout requests
- `/server/admin/process-payout` - Process payouts

✅ **Database & Storage**
- JSON-based vault system for licenses, KYC, payouts
- Encrypted client data support
- File upload support for KYC documents

## Setup Instructions

### 1. Get PayPal Sandbox Credentials

Visit: https://developer.paypal.com/dashboard

1. Sign in or create a business account
2. Go to **Apps & Credentials**
3. Select **Sandbox** environment
4. Create a new app or use the default
5. Copy:
   - **Client ID** (from Sandbox section)
   - **Secret** (from Sandbox section)

### 2. Update .env File

Edit `/workspaces/Checkoutv4/.env`:

```env
PAYPAL_CLIENT_ID=your_sandbox_client_id_here
PAYPAL_SECRET=your_sandbox_secret_here
PAYPAL_ENV=sandbox
MODE=paypal
```

### 3. Update HTML with PayPal Client ID

Edit `/workspaces/Checkoutv4/web/index.html` Line 7:

Change:
```html
<script src="https://www.paypal.com/sdk/js?client-id=YOUR_CLIENT_ID&currency=AUD"></script>
```

To (replace YOUR_CLIENT_ID):
```html
<script src="https://www.paypal.com/sdk/js?client-id=YOUR_SANDBOX_CLIENT_ID&currency=AUD"></script>
```

### 4. Start the Server

```bash
cd /workspaces/Checkoutv4
npm start
```

Server runs on: http://localhost:4000

### 5. Test the Checkout

1. Go to http://localhost:4000
2. Select a plan and enter your email
3. Click "PayPal" button
4. Use PayPal sandbox test buyer account:
   - Email: sb-xxxxx@personal.example.com (provided in sandbox setup)
   - Password: Check PayPal Developer Dashboard

### Test Accounts

Get test buyer/seller accounts from:
https://developer.paypal.com/dashboard/accounts

## API Usage Examples

### Create Order
```bash
curl -X POST http://localhost:4000/server/create-order \
  -H "Content-Type: application/json" \
  -d '{
    "amount": "25.00",
    "currency": "AUD",
    "plan": "basic",
    "email": "customer@example.com"
  }'
```

### Capture Order
```bash
curl -X POST http://localhost:4000/server/capture-order \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "PAYPAL_ORDER_ID",
    "payerEmail": "customer@example.com",
    "plan": "basic"
  }'
```

## Features

### Payment Plans
- **Starter**: $10.00
- **Basic**: $25.00
- **Pro**: $99.00

### Transaction Flow
1. User selects plan and enters email
2. Click PayPal button
3. Frontend calls `/server/create-order`
4. PayPal order created and returned
5. PayPal button triggers approval redirect
6. On return, frontend calls `/server/capture-order`
7. Payment captured, license generated
8. License displayed to user

### Admin Functions
- `/server/admin` - View all data (requires ADMIN_PASS)
- `/server/kyc/admin/verify` - Verify KYC documents
- `/server/admin/process-payout` - Handle payouts

### File Organization
```
server/
  ├── server.js - Main Express app
  ├── payments.js - Order & capture routes
  ├── paypal.js - PayPal API helpers
  ├── kyc.js - KYC upload & verification
  ├── payouts.js - Payout requests
  ├── payouts-util.js - PayPal payout API
  ├── issue-handler.js - Payment requests
  ├── crypto-utils.js - Encryption & tokens
  ├── db.json - Database file
  └── config.yaml - Configuration

web/
  ├── index.html - UI with PayPal button
  ├── script.js - PayPal integration & forms
  └── style.css - Styling

console/
  ├── dashboard.html - Admin dashboard
  └── dashboard.js - Admin panel logic
```

## Environment Variables

Required:
- `PAYPAL_CLIENT_ID` - PayPal sandbox client ID
- `PAYPAL_SECRET` - PayPal sandbox secret
- `MODE=paypal` - Switch from mock to real

Optional:
- `PAYPAL_ENV` - sandbox (default) or live
- `PORT` - Server port (default 4000)
- `ADMIN_PASS` - Admin authentication
- `PAYLINK_SELF_URL` - URL for redirects

## Troubleshooting

### "Failed to create PayPal order"
- Check PAYPAL_CLIENT_ID and PAYPAL_SECRET in .env
- Verify PAYPAL_ENV is set to 'sandbox'
- Check internet connection to PayPal API

### "Payment not completed"
- Ensure user approves payment in PayPal popup
- Check PayPal sandbox account is funded
- Verify order ID is correctly passed

### PayPal button not showing
- Update HTML with correct CLIENT_ID
- Clear browser cache
- Check browser console for errors

## Security Notes

- Store real credentials in production securely (.env not in git)
- Use HTTPS in production
- Validate all inputs server-side
- Implement webhook verification for production
- Keep ADMIN_PASS secure
- Encrypt sensitive data at rest

## Next Steps

1. ✅ Real PayPal integration working
2. Add webhook handlers for payment confirmations
3. Add email notifications
4. Set up production environment
5. Configure HTTPS certificates
6. Add audit logging
7. Implement proper encryption
