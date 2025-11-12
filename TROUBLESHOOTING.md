# Troubleshooting & Common Issues

## ✅ Setup Verification

Before running, verify:

```bash
# Check Node.js installed
node --version

# Check npm packages installed
npm list express dotenv js-yaml

# Check environment file exists
cat .env

# Check all required files exist
ls server/server.js server/payments.js server/paypal.js
ls web/index.html web/script.js web/style.css
```

## 🚨 Common Issues & Solutions

### Issue 1: "Cannot find module 'express'"
**Error**: `Error: Cannot find module 'express'`

**Solution**:
```bash
npm install
# Wait for completion
npm start
```

### Issue 2: PayPal Button Not Showing
**Symptoms**: Page loads but no PayPal button visible

**Causes & Fixes**:
1. **Missing Client ID in HTML**
   - Edit `/web/index.html` line 7
   - Replace `YOUR_CLIENT_ID` with actual sandbox ID
   - Clear browser cache (Ctrl+Shift+Delete)
   - Refresh page

2. **Wrong SDK URL format**
   ```html
   <!-- ✅ CORRECT -->
   <script src="https://www.paypal.com/sdk/js?client-id=ABC123&currency=AUD"></script>
   
   <!-- ❌ WRONG -->
   <script src="https://www.paypal.com/sdk/js?client-id=YOUR_CLIENT_ID"></script>
   ```

3. **JavaScript error in console**
   - Open browser DevTools (F12)
   - Check Console tab for errors
   - Look for PayPal SDK loading errors

### Issue 3: "Failed to create PayPal order"
**Error**: `Order creation failed: ...`

**Causes & Fixes**:
1. **Wrong credentials in .env**
   ```bash
   # Check current values
   grep PAYPAL .env
   
   # Should show:
   # PAYPAL_CLIENT_ID=YOUR_ACTUAL_ID
   # PAYPAL_SECRET=YOUR_ACTUAL_SECRET
   ```

2. **Using sandbox credentials in live mode**
   ```env
   # Make sure this is correct:
   PAYPAL_ENV=sandbox  # ✅ Correct for testing
   MODE=paypal         # ✅ Use real API
   ```

3. **Credentials don't match account**
   - Go to https://developer.paypal.com/dashboard
   - Re-copy Client ID and Secret
   - Update .env and restart server

4. **No internet connection**
   - Test: `curl https://api-m.sandbox.paypal.com`
   - PayPal API requires internet access

### Issue 4: "Payment not completed"
**Error**: `Payment not completed`

**Causes & Fixes**:
1. **User didn't approve payment**
   - Make sure to click "Approve" on PayPal page
   - Don't close window before approving

2. **Test buyer account has no funds**
   - Go to PayPal Sandbox → Accounts
   - Check buyer account balance
   - Use different test account if needed

3. **PayPal API error**
   - Check server logs for error details
   - Look for 401/403/500 errors
   - Verify order ID is being passed correctly

### Issue 5: "Connection Refused" on localhost:4000
**Error**: `Failed to connect to http://localhost:4000`

**Solution**:
```bash
# Check if server is running
ps aux | grep node

# If not running, start it:
npm start

# If port 4000 is in use, change in .env:
PORT=4001
# Then restart server
```

### Issue 6: Database Errors
**Error**: `ENOENT: no such file or directory, open 'server/db.json'`

**Solution**:
```bash
# Create db.json manually
cat > server/db.json << 'EOF'
{
  "clients_encrypted": null,
  "licenses": [],
  "kyc": [],
  "payouts": []
}
EOF

# Or server creates it on first payment
```

### Issue 7: Admin Panel Not Working
**Error**: Unauthorized accessing `/server/admin`

**Solution**:
```bash
# Check admin password in .env
grep ADMIN_PASS .env

# Should be set to something like:
# ADMIN_PASS=change_me

# Then access with:
# http://localhost:4000/server/admin?pass=change_me
```

## 📋 Debugging Steps

### Step 1: Check Server Logs
```bash
# Watch logs while running
npm start

# You should see:
# PayLinkBridge v1.0.0 running on port 4000 (Mode: paypal)
```

### Step 2: Test Health Endpoint
```bash
curl http://localhost:4000/server/health

# Should return:
# {"ok":true,"mode":"paypal","version":"1.0.0"}
```

### Step 3: Test Create Order
```bash
curl -X POST http://localhost:4000/server/create-order \
  -H "Content-Type: application/json" \
  -d '{"amount":"25.00","currency":"AUD","plan":"basic","email":"test@example.com"}'

# Should return order with PayPal ID
```

### Step 4: Check Environment
```bash
# View all environment variables
env | grep PAYPAL

# Should show all PAYPAL_* variables set
```

### Step 5: Clear Cache & Restart
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules (optional)
rm -rf node_modules

# Reinstall
npm install

# Restart server
npm start
```

## 🧪 Testing with Different Modes

### Mock Mode (Testing without PayPal API)
```env
MODE=mock
```
- No real PayPal connection
- Generates fake order IDs
- Fast testing
- No credentials needed

### Real Mode (PayPal Sandbox)
```env
MODE=paypal
PAYPAL_ENV=sandbox
```
- Uses PayPal sandbox API
- Requires credentials
- Test with real payment flow
- Safe for testing

### Production Mode (Real PayPal)
```env
MODE=paypal
PAYPAL_ENV=live
HTTPS=true
```
- Uses real PayPal API
- Real transactions
- Requires live credentials
- ⚠️ WARNING: Charges real money

## 🔍 Browser DevTools Debugging

Press F12 to open DevTools:

### Console Tab
- Look for JavaScript errors
- Check PayPal SDK errors
- See fetch request errors

### Network Tab
- Monitor API calls
- Check request/response
- Look for failed requests
- Status 201/200 = Success
- Status 401/403 = Auth error
- Status 500 = Server error

### Example Network Request
```
POST /server/create-order
Status: 200 OK
Response: {
  "id": "8CP04343PU4568910",
  "status": "CREATED",
  "links": [...]
}
```

## 📊 Data Inspection

### View Database
```bash
# Show all licenses
cat server/db.json | grep -A5 licenses

# Pretty print with jq (if installed)
cat server/db.json | jq '.licenses'
```

### View Logs
```bash
# Check server output
npm start

# Or if running in background:
tail -f /path/to/server/output.log
```

## 🔐 Credentials Verification

```bash
# Verify credentials are set
echo "Client ID: $PAYPAL_CLIENT_ID"
echo "Secret: $PAYPAL_SECRET"
echo "Mode: $MODE"

# Test token generation manually
curl -X POST https://api-m.sandbox.paypal.com/v1/oauth2/token \
  -H "Authorization: Basic $(echo -n 'CLIENT_ID:SECRET' | base64)" \
  -d "grant_type=client_credentials"
```

## 🆘 When All Else Fails

### Complete Reset
```bash
# Stop server (Ctrl+C)

# Remove node_modules
rm -rf node_modules package-lock.json

# Reinstall
npm install

# Clear .env and reconfigure
rm .env
cp .env.example .env
# Edit .env with your credentials

# Start fresh
npm start
```

### Get Fresh Credentials
1. Go to https://developer.paypal.com/dashboard
2. Sign out, sign back in
3. Create a new Sandbox App
4. Copy new Client ID and Secret
5. Update .env
6. Restart server

### Contact Support
- PayPal Developer: https://developer.paypal.com/docs
- GitHub Issues: Check existing issues first
- Logs: Always check server logs first!

## ✅ Success Indicators

You'll know it's working when:

1. ✅ Server starts with version info
2. ✅ Health check returns `ok: true`
3. ✅ PayPal button visible on page
4. ✅ Can select plans and see amount update
5. ✅ PayPal approval window opens
6. ✅ Can approve payment
7. ✅ License generated
8. ✅ Data saved to db.json
9. ✅ No errors in console
10. ✅ Admin panel shows transactions

## 📝 Logging Checklist

Before asking for help, collect:
- [ ] Full error message
- [ ] Server logs (complete startup)
- [ ] Browser console errors (F12)
- [ ] Network tab failed request details
- [ ] .env contents (without secrets)
- [ ] OS and Node.js version
- [ ] Steps to reproduce

---

**Last Updated**: November 12, 2025
**Status**: Ready for Real PayPal Testing
