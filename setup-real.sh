#!/bin/bash
set -e

echo "🚀 PayLinkBridge - Real Setup Script"
echo "===================================="

# Check Node.js
if ! command -v node &> /dev/null; then
  echo "❌ Node.js not found. Please install Node.js 16+"
  exit 1
fi

echo "✅ Node.js found: $(node --version)"

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
npm install

echo ""
echo "✅ Setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Edit .env with your PayPal and email credentials"
echo "2. Run: npm start"
echo "3. Visit: http://localhost:4000/web/checkout.html"
echo ""
echo "📚 Full setup guide: REAL_PRODUCTION_SETUP.md"
