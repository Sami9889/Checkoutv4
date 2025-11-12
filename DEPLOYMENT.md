# Production Deployment Guide

## Pre-Deployment Checklist

### PayPal Setup
- [ ] Have live PayPal credentials ready
- [ ] Test webhook URL is publicly accessible
- [ ] Webhook signature key is saved
- [ ] IP whitelist configured (if applicable)

### GitHub Setup
- [ ] Repository created and public/private as needed
- [ ] GitHub Actions enabled
- [ ] Workflow file configured
- [ ] Webhook URL set in repository settings

### Security
- [ ] Generate strong ADMIN_PASS
- [ ] Create SSL/TLS certificates
- [ ] Database encryption keys generated
- [ ] No credentials in .env.example
- [ ] .env file NOT in git

### Testing
- [ ] Payment flow tested in sandbox
- [ ] All plans tested
- [ ] GitHub issue creation working
- [ ] Email notifications working (optional)
- [ ] Admin panel accessible
- [ ] Webhook events logged

## Deployment Options

### Option 1: Cloud Platform (Recommended)

#### Heroku
```bash
# Create app
heroku create paylink-checkout

# Set environment variables
heroku config:set PAYPAL_CLIENT_ID=your_live_id
heroku config:set PAYPAL_SECRET=your_live_secret
heroku config:set PAYPAL_ENV=live
heroku config:set MODE=paypal
heroku config:set ADMIN_PASS=strong_password

# Deploy
git push heroku main

# Check logs
heroku logs --tail
```

#### AWS Elastic Beanstalk
```bash
# Initialize
eb init -p node.js-18 paylink-checkout

# Create environment
eb create production

# Set environment variables
eb setenv \
  PAYPAL_CLIENT_ID=your_live_id \
  PAYPAL_SECRET=your_live_secret \
  PAYPAL_ENV=live \
  MODE=paypal \
  ADMIN_PASS=strong_password

# Deploy
git push && eb deploy
```

#### DigitalOcean App Platform
```
1. Push code to GitHub
2. Connect repository to DigitalOcean
3. Set environment variables in dashboard
4. Deploy
```

### Option 2: Docker

```bash
# Build image
docker build -t paylink:latest .

# Run container
docker run -d \
  -p 4000:4000 \
  -e PAYPAL_CLIENT_ID=your_live_id \
  -e PAYPAL_SECRET=your_live_secret \
  -e PAYPAL_ENV=live \
  -e MODE=paypal \
  -e ADMIN_PASS=strong_password \
  -v paylink-data:/app/server \
  --restart unless-stopped \
  --name paylink paylink:latest

# View logs
docker logs -f paylink
```

### Option 3: Manual Server

```bash
# SSH into server
ssh user@your-domain.com

# Clone repository
git clone https://github.com/your/repo.git
cd repo

# Install dependencies
npm install

# Create .env
cat > .env << EOF
PAYPAL_CLIENT_ID=your_live_id
PAYPAL_SECRET=your_live_secret
PAYPAL_ENV=live
MODE=paypal
ADMIN_PASS=strong_password
PORT=4000
EOF

# Use PM2 for process management
npm install -g pm2
pm2 start server/server.js --name paylink

# Setup SSL with Let's Encrypt
sudo apt-get install certbot
sudo certbot certonly --standalone -d your-domain.com

# Configure nginx (optional)
sudo apt-get install nginx
# Setup reverse proxy to localhost:4000

# Start services
pm2 startup
pm2 save
```

## Post-Deployment

### Verify Installation
```bash
# Health check
curl https://your-domain.com/server/health

# Admin panel
curl https://your-domain.com/server/admin?pass=YOUR_PASSWORD

# Test payment flow
1. Visit https://your-domain.com
2. Select plan
3. Enter email
4. Complete PayPal payment
5. Verify license generated
```

### Setup Webhook in PayPal
1. Log into PayPal Dashboard
2. Go to Apps & Credentials
3. Find your app and expand
4. Go to Webhooks
5. Add webhook URL: `https://your-domain.com/server/webhooks/paypal`
6. Select events:
   - CHECKOUT.ORDER.APPROVED
   - CHECKOUT.ORDER.COMPLETED
   - PAYMENT.CAPTURE.COMPLETED
   - PAYMENT.CAPTURE.DECLINED

### GitHub Webhook Setup (Optional)
1. Go to Repository → Settings → Webhooks
2. Add webhook with URL pointing to server
3. Select events to trigger on

### Monitoring

#### Log Files
```bash
# View application logs
tail -f /var/log/paylink/error.log
tail -f /var/log/paylink/access.log

# Docker logs
docker logs -f paylink

# PM2 logs
pm2 logs paylink
```

#### Uptime Monitoring
```bash
# Set up cron job to check health
*/5 * * * * curl -f https://your-domain.com/server/health || alert

# Or use services like:
# - UptimeRobot
# - Pingdom
# - New Relic
```

#### Database Backups
```bash
# Daily backup
0 2 * * * cp /app/server/db.json /backups/db-$(date +\%Y\%m\%d).json

# Keep last 30 days
find /backups -name "db-*.json" -mtime +30 -delete
```

## Scaling

### Load Balancing
```
nginx/HAProxy
    ↓
paylink:4000 (instance 1)
paylink:4001 (instance 2)
paylink:4002 (instance 3)
    ↓
Shared database (db.json or PostgreSQL)
```

### Database Migration
If scaling beyond single instance, migrate to:
- PostgreSQL
- MongoDB
- DynamoDB

Update `server/` modules to use new database.

## SSL/TLS Certificate

### Let's Encrypt (Free)
```bash
# Install certbot
sudo apt-get install certbot python3-certbot-nginx

# Get certificate
sudo certbot certonly --nginx -d your-domain.com

# Auto-renewal
sudo systemctl enable certbot.timer
```

### AWS Certificate Manager
```bash
# Request certificate in ACM
# Validate domain
# Use in load balancer/CloudFront
```

## Performance Optimization

### Caching
```javascript
// Add Redis caching for frequently accessed data
const redis = require('redis');
const client = redis.createClient();

// Cache payment lookups
client.setex(`order:${orderId}`, 3600, JSON.stringify(order));
```

### CDN
```
CloudFront / Cloudflare
    ↓
web/ (static assets)
    ↓
Origin: your-domain.com
```

### Database Optimization
```sql
-- Add indexes
CREATE INDEX idx_license_email ON licenses(email);
CREATE INDEX idx_payment_date ON licenses(created_at);
```

## Troubleshooting

### Application won't start
```bash
# Check Node.js
node --version

# Check dependencies
npm install

# Check environment
echo $PAYPAL_CLIENT_ID

# Check logs
npm start 2>&1 | tee debug.log
```

### Webhook not working
```bash
# Check webhook URL is public
curl https://your-domain.com/server/webhooks/paypal

# Check PayPal webhook logs
# Log in to PayPal Dashboard → Apps & Credentials → Webhooks

# Check firewall/security groups allow incoming traffic
```

### Payment failures
```bash
# Check PayPal credentials
# Verify PAYPAL_ENV is set to 'live'
# Check API limits
# Review PayPal error logs
```

### Database issues
```bash
# Check file permissions
ls -la server/db.json

# Check disk space
df -h

# Backup and restore
cp server/db.json server/db.json.backup
# Fix issues
cp server/db.json.backup server/db.json
```

## Maintenance

### Regular Tasks
- [ ] Monitor logs for errors
- [ ] Check PayPal transaction volume
- [ ] Review webhook events
- [ ] Update dependencies monthly
- [ ] Backup database daily
- [ ] Check disk space
- [ ] Monitor uptime

### Security Updates
```bash
# Check for vulnerable packages
npm audit

# Update packages
npm update

# Update Node.js
nvm install 18.latest
```

### Version Updates
```bash
# Test locally first
npm install new-version

# Commit and test
git add package.json
npm test

# Deploy to staging
git push staging

# Monitor for issues
# Then deploy to production
git push heroku/production
```

## Rollback Procedure

```bash
# If deployment fails:

# Option 1: Heroku
heroku rollback

# Option 2: Docker
docker stop paylink
docker run -d ... # Previous version

# Option 3: Git
git revert HEAD
git push heroku main

# Option 4: Manual
cd /app
git checkout previous-tag
npm install
pm2 restart paylink
```

---

## Support

- Documentation: README.md
- Issues: GitHub Issues
- Deployment Help: Cloud provider docs
- PayPal Help: developer.paypal.com

Last updated: November 12, 2025
