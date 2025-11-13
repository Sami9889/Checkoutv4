# PayLink - Professional Checkout

> Secure, production-ready PayPal payment checkout system with GitHub integration

## 🚀 Features

- **Real PayPal Integration** - Accept payments directly via PayPal
- **GitHub Issues Menu** - Feature requests and support via GitHub
- **Professional UI** - Modern, responsive checkout interface
- **License Management** - Automatic license generation after payment
- **Admin Panel** - Manage transactions and users
- **Webhook Support** - Real-time payment confirmations
- **Multiple Plans** - Flexible pricing tiers

## Quick Start

### 1. Prerequisites
- Node.js 16+
- PayPal business account
- GitHub repository (optional, for issue tracking)

### 2. Complete Setup Guide

⭐ **[See CHECKOUT_SETUP.md for detailed instructions](./CHECKOUT_SETUP.md)**

This includes:
- Getting PayPal credentials
- Configuring .env file
- Setting up email delivery
- Testing the checkout
- Bank account details for payouts

### 3. Quick Setup (30 seconds)

```bash
# Install dependencies
npm install

# Edit .env with your PayPal credentials
nano .env

# Start the server
npm start
```

Visit: http://localhost:4000/checkout.html

### 3. Configure

Edit `.env`:
```env
PAYPAL_CLIENT_ID=your_client_id
PAYPAL_SECRET=your_secret
PAYPAL_ENV=sandbox
MODE=paypal
PORT=4000
```

Edit `web/script.js` (lines 1-4):
```javascript
const CONFIG = {
  github_owner: 'your-github-username',
  github_repo: 'your-repo-name'
};
```

Update `web/index.html` (line 7) with PayPal Client ID:
```html
<script src="https://www.paypal.com/sdk/js?client-id=YOUR_ID&currency=AUD"></script>
```

### 4. Run

```bash
npm start
# Visit http://localhost:4000
```

## Deployment

### Docker
```bash
docker build -t paylink .
docker run -p 4000:4000 --env-file .env paylink
```

### Cloud Platforms

**Heroku**:
```bash
git push heroku main
```

**AWS/Azure/DigitalOcean**:
- Set environment variables in platform
- Deploy from GitHub

## API Endpoints

### Payment Processing
- `POST /server/create-order` - Create PayPal order
- `POST /server/capture-order` - Capture payment
- `POST /server/webhooks/paypal` - PayPal webhook

### Admin
- `GET /server/admin` - View all data
- `GET /server/health` - Health check

### File Uploads
- `POST /server/kyc/upload` - Upload documents

## Configuration

### Environment Variables
- `PAYPAL_CLIENT_ID` - PayPal client ID
- `PAYPAL_SECRET` - PayPal secret
- `PAYPAL_ENV` - Environment (sandbox/live)
- `MODE` - Mode (paypal/mock)
- `PORT` - Server port
- `ADMIN_PASS` - Admin password

### Pricing Plans
Modify in `web/script.js` PLANS object:
```javascript
const PLANS = {
  pro: { price: 99.00, name: 'Professional' },
  basic: { price: 25.00, name: 'Basic' },
  starter: { price: 10.00, name: 'Starter' }
};
```

## GitHub Integration

### Setup Issues Template
Create `.github/ISSUE_TEMPLATE/payment-request.md`:
```markdown
---
name: Payment Request
about: Submit a payment request
title: '[PAYMENT] Your Title'
labels: 'paylink-request'
---

## Plan
- [ ] Starter ($10)
- [ ] Basic ($25)
- [ ] Pro ($99)

## Details
...
```

### GitHub Actions
Webhook automatically triggers when issues labeled `paylink-request` are opened.

## Production Checklist

- [ ] Update PayPal credentials (live)
- [ ] Change `PAYPAL_ENV` to `live`
- [ ] Set `MODE=paypal`
- [ ] Enable HTTPS
- [ ] Configure webhook URL in PayPal
- [ ] Set strong `ADMIN_PASS`
- [ ] Remove `.env` from git
- [ ] Test payment flow
- [ ] Set up email notifications (optional)
- [ ] Configure GitHub repository

## Security

- ✅ Webhook signature verification
- ✅ Admin authentication
- ✅ Input validation
- ✅ Secure credential storage
- ✅ HTTPS ready

## Troubleshooting

### "PayPal button not showing"
- Check CLIENT_ID in HTML
- Clear browser cache
- Check browser console (F12)

### "Payment failed"
- Verify credentials
- Check internet connection
- Review server logs

### "Database not created"
```bash
cat > server/db.json << 'EOF'
{
  "licenses": [],
  "kyc": [],
  "payouts": [],
  "webhookEvents": []
}
EOF
```

## File Structure

```
paylink-checkout/
├── server/
│   ├── server.js           Main application
│   ├── payments.js         Payment routes
│   ├── paypal.js          PayPal API
│   ├── webhooks.js        Webhook handlers
│   └── db.json            Database
├── web/
│   ├── index.html         Checkout page
│   ├── script.js          Frontend logic
│   └── style.css          Styling
├── .env                   Configuration
└── package.json           Dependencies
```

## Support

- GitHub Issues: Feature requests and support
- Documentation: See docs/ folder
- Email: support@example.com

## License

MIT - See LICENSE file

---

**Ready for production use** ✅

Last updated: November 12, 2025