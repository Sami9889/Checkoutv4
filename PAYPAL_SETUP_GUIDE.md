# PayPal Sandbox Setup Guide

## Step 1: Create PayPal Developer Account

1. Go to https://developer.paypal.com
2. Sign in or create a PayPal account
3. Click **Sign Up** to create a developer account

## Step 2: Create Sandbox Business Account

1. In the Dashboard, go to **Accounts** (left sidebar)
2. You should see a **Sandbox** business account already created
3. If not, create one with email like: `sbxxxxxxx-business@personal.example.com`

## Step 3: Get Your Client ID and Secret

1. In Dashboard, click **Apps & Credentials** (left sidebar)
2. Make sure **Sandbox** is selected at the top
3. Under the **Business** account section, you'll see:
   - **Client ID** (starts with `Acf...` or `ASxxxxxx...`)
   - **Secret** (click "Show" to reveal)

## Step 4: Update .env File

Edit `.env` and replace:

```env
PAYPAL_CLIENT_ID=your_actual_client_id_here
PAYPAL_SECRET=your_actual_secret_here
PAYPAL_ENV=sandbox
```

**Example:**
```env
PAYPAL_CLIENT_ID=AcfYvR-KUAqzLDz8N_oKhkq2wMf4PGm4hJFEfnvOLfx2L-LSNNhZUm0EuL5-VnQ1R3bLEkqL8Z-nP5Ij
PAYPAL_SECRET=EGXxYZABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnop
```

## Step 5: Create Sandbox Test Accounts

To test payments, you need buyer and seller accounts:

1. In Dashboard, click **Accounts** (left sidebar)
2. You should see:
   - **Business Account** (for receiving payments)
   - **Personal Account** (for making test purchases)

If not visible, create them:
- **Business**: Use as your merchant account (receives money)
- **Personal**: Use for test purchases (buyer account)

## Step 6: Test the Checkout

1. Restart the server: `npm start`
2. Visit: `http://localhost:4000/checkout.html`
3. Fill in test details:
   - Name: Any name
   - Email: Your email or test account email
4. Click PayPal button
5. Log in with **Personal account** credentials (the buyer account)
6. Approve and complete payment

## Step 7: Verify Payment Completed

After payment:
- ✅ License key should display
- ✅ Confirmation email should arrive
- ✅ Check `/server/admin?pass=your_admin_password` to see records

## Troubleshooting

### "Invalid Client ID" Error
- Make sure you copied the **FULL** Client ID
- Restart your server after updating .env
- Check that PAYPAL_ENV=sandbox (not live)

### SDK Won't Load
- Check browser console for errors
- Verify Client ID doesn't contain "YOUR_" or "your_"
- Try clearing browser cache

### Test Account Issues
- Make sure you're using **Sandbox** accounts, not production
- Both buyer and seller must be in Sandbox
- Password must be correct in Sandbox environment

## For Production Later

When ready to go live:
1. Apply for PayPal Business Account
2. Get LIVE Client ID and Secret
3. Change `PAYPAL_ENV=sandbox` to `PAYPAL_ENV=live`
4. Update credentials in .env
5. Update to real PayPal account emails

## Getting Help

- PayPal Docs: https://developer.paypal.com/docs/checkout/
- PayPal Support: https://www.paypal.com/support/
- Sandbox Troubleshooting: https://developer.paypal.com/docs/platforms/sandboxing/
