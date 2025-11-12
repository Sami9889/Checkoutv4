#!/bin/bash
# PayLinkBridge Setup Verification Script

echo "================================================"
echo "  PayLinkBridge Real PayPal Integration Check"
echo "================================================"
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

check_count=0
pass_count=0

check() {
  check_count=$((check_count + 1))
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓${NC} $1"
    pass_count=$((pass_count + 1))
  else
    echo -e "${RED}✗${NC} $1"
  fi
}

# Check Node.js
echo "1. Checking Node.js installation..."
node --version > /dev/null 2>&1
check "Node.js installed"

# Check npm
echo ""
echo "2. Checking npm..."
npm --version > /dev/null 2>&1
check "npm installed"

# Check dependencies
echo ""
echo "3. Checking Node modules..."
test -d "node_modules" > /dev/null 2>&1
check "node_modules directory exists"
test -f "node_modules/express/package.json" > /dev/null 2>&1
check "express module installed"
test -f "node_modules/dotenv/package.json" > /dev/null 2>&1
check "dotenv module installed"

# Check key files
echo ""
echo "4. Checking required files..."
test -f "server/server.js"
check "server/server.js exists"
test -f "server/payments.js"
check "server/payments.js (with PayPal integration)"
test -f "server/paypal.js"
check "server/paypal.js (PayPal API helpers)"
test -f "server/webhooks.js"
check "server/webhooks.js (NEW - Webhook handlers)"
test -f "web/index.html"
check "web/index.html (with PayPal UI)"
test -f "web/script.js"
check "web/script.js (with PayPal integration)"
test -f "web/style.css"
check "web/style.css (professional styling)"

# Check configuration
echo ""
echo "5. Checking configuration files..."
test -f ".env"
check ".env file exists"
test -f "package.json"
check "package.json exists"

# Check environment
echo ""
echo "6. Checking environment setup..."
if [ -f ".env" ]; then
  grep -q "MODE=paypal" .env
  check "MODE set to 'paypal' (real integration)"
  grep -q "PAYPAL_CLIENT_ID" .env
  check "PAYPAL_CLIENT_ID configured"
  grep -q "PAYPAL_SECRET" .env
  check "PAYPAL_SECRET configured"
fi

# Check documentation
echo ""
echo "7. Checking documentation..."
test -f "SETUP.md"
check "SETUP.md (detailed guide)"
test -f "REAL_PAYPAL_SETUP.md"
check "REAL_PAYPAL_SETUP.md (quick reference)"
test -f "IMPLEMENTATION_COMPLETE.md"
check "IMPLEMENTATION_COMPLETE.md (full docs)"
test -f "TROUBLESHOOTING.md"
check "TROUBLESHOOTING.md (help guide)"
test -f "README_PAYPAL.md"
check "README_PAYPAL.md (overview)"

# Check for PayPal SDK in HTML
echo ""
echo "8. Checking PayPal integration..."
grep -q "paypal.com/sdk/js" web/index.html
check "PayPal SDK script tag in HTML"
grep -q "paypal.Buttons" web/script.js
check "PayPal.Buttons integration in script"
grep -q "getAccessToken" server/paypal.js
check "PayPal API authentication method"

# Check payment processing
echo ""
echo "9. Checking payment endpoints..."
grep -q "/server/create-order" server/payments.js
check "POST /server/create-order endpoint"
grep -q "/server/capture-order" server/payments.js
check "POST /server/capture-order endpoint"
grep -q "import { getAccessToken, createOrder, captureOrder }" server/payments.js
check "PayPal API imports in payments.js"

# Check webhooks
echo ""
echo "10. Checking webhook support..."
grep -q "/server/webhooks/paypal" server/webhooks.js
check "Webhook endpoint configured"
grep -q "verifyWebhookWithPayPal" server/webhooks.js
check "PayPal webhook verification"

echo ""
echo "================================================"
echo "  Summary"
echo "================================================"
echo -e "Checks passed: ${GREEN}$pass_count/$check_count${NC}"
echo ""

if [ $pass_count -eq $check_count ]; then
  echo -e "${GREEN}✓ All checks passed! System is ready.${NC}"
  echo ""
  echo "Next steps:"
  echo "1. Get PayPal Sandbox credentials:"
  echo "   https://developer.paypal.com/dashboard"
  echo ""
  echo "2. Update .env with credentials:"
  echo "   PAYPAL_CLIENT_ID=your_id"
  echo "   PAYPAL_SECRET=your_secret"
  echo ""
  echo "3. Update web/index.html line 7 with CLIENT_ID"
  echo ""
  echo "4. Run: npm start"
  echo ""
  echo "5. Visit: http://localhost:4000"
else
  echo -e "${RED}✗ Some checks failed. Please review errors above.${NC}"
  echo ""
  echo "Common fixes:"
  echo "- Run: npm install"
  echo "- Check .env file exists"
  echo "- Verify all files in server/ and web/ directories"
fi

echo ""
