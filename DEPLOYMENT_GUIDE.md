# PayLinkBridge v3.0.0 - Deployment Guide

## Quick Start

### 1. Prepare Environment
```bash
# Copy environment template
cp .env.example .env

# Generate secure encryption key
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
# Copy output to MASTER_SECRET_KEY in .env

# Set your admin password
# Set your bank account details
# Set admin email
```

### 2. Install Dependencies
```bash
npm install
```

**Expected Dependencies** (v3.0.0):
- express@^4.18.2
- dotenv@^16.0.3
- js-yaml@^4.1.0
- multer@^1.4.5-lts.1
- bcrypt@^5.1.0

**REMOVED** (No longer needed):
- ~~nodemailer~~ (Internal email queue)
- ~~node-fetch~~ (No GitHub API)

### 3. Configure Environment Variables

Create `.env` file with:

```bash
# Server Configuration
PORT=4000
ADMIN_PASS=your_secure_admin_password_here

# Encryption (REQUIRED - must be set)
MASTER_SECRET_KEY=your_base64_32byte_key_here
ENCRYPTION_KEY_VERSION=1
DATABASE_ENCRYPTION=enabled

# Bank Account Configuration (REQUIRED)
BANK_ACCOUNT_NAME=Your Business Name
BANK_ACCOUNT_ADDRESS=123 Main Street, City, State, ZIP
BANK_BSB=123456
BANK_ACCOUNT_NUMBER=12345678
BANK_BIC_SWIFT=YOURSWIFTCODE
BANK_NAME=Your Bank Name

# Email Configuration (Internal Queue - no SMTP needed)
ADMIN_EMAIL=admin@yourbusiness.com

# Application Configuration
PAYLINK_SELF_URL=http://localhost:4000
```

### 4. Test Locally
```bash
# Start server
npm start

# Server should output:
# PayLinkBridge v3.0.0 - SECURED PRODUCTION BANKING SYSTEM
# Ready to accept secure bank transfers

# Test in another terminal
curl http://localhost:4000/server/health

# Expected response:
# {
#   "ok": true,
#   "mode": "bank_transfer",
#   "version": "3.0.0",
#   "encryption": "AES-256-GCM",
#   "encryptionEnabled": true,
#   "externalAPIs": "none",
#   "emailSystem": "internal"
# }
```

### 5. Test Admin Login
```bash
# Login with your admin password
curl -X POST http://localhost:4000/server/admin/login \
  -H "Content-Type: application/json" \
  -d '{"password":"your_password_here"}'

# Expected response:
# {
#   "success": true,
#   "sessionToken": "64-character-hex-string",
#   "expiresIn": 1800,
#   "message": "Login successful. Use sessionToken for authenticated requests."
# }

# Save the sessionToken for use in other requests
```

### 6. View Dashboard
```bash
curl http://localhost:4000/server/admin \
  -H "x-auth-token: YOUR_SESSION_TOKEN_HERE"

# Returns summary of all customer data, payments, and emails
```

---

## Production Deployment

### Option A: Docker Deployment

#### Create Dockerfile
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 4000

CMD ["npm", "start"]
```

#### Create docker-compose.yml
```yaml
version: '3.8'
services:
  paylinkbridge:
    build: .
    ports:
      - "4000:4000"
    environment:
      - NODE_ENV=production
      - PORT=4000
      - ADMIN_PASS=${ADMIN_PASS}
      - MASTER_SECRET_KEY=${MASTER_SECRET_KEY}
      - BANK_ACCOUNT_NAME=${BANK_ACCOUNT_NAME}
      - BANK_ACCOUNT_ADDRESS=${BANK_ACCOUNT_ADDRESS}
      - BANK_BSB=${BANK_BSB}
      - BANK_ACCOUNT_NUMBER=${BANK_ACCOUNT_NUMBER}
      - BANK_BIC_SWIFT=${BANK_BIC_SWIFT}
      - BANK_NAME=${BANK_NAME}
      - ADMIN_EMAIL=${ADMIN_EMAIL}
      - PAYLINK_SELF_URL=${PAYLINK_SELF_URL}
    volumes:
      - ./server:/app/server
    restart: always
```

#### Deploy with Docker
```bash
# Build image
docker build -t paylinkbridge:3.0.0 .

# Run with environment file
docker run -d \
  --name paylinkbridge \
  --env-file .env \
  -p 4000:4000 \
  -v $(pwd)/server:/app/server \
  paylinkbridge:3.0.0

# Check logs
docker logs -f paylinkbridge

# Stop
docker stop paylinkbridge
```

### Option B: Node.js with PM2 (Production)

#### Install PM2
```bash
npm install -g pm2
```

#### Create ecosystem.config.js
```javascript
module.exports = {
  apps: [
    {
      name: 'paylinkbridge',
      script: './server/server.js',
      instances: 2,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 4000
      },
      error_file: './logs/error.log',
      out_file: './logs/out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      watch: false,
      max_memory_restart: '500M',
      node_args: '--max-old-space-size=4096'
    }
  ]
};
```

#### Start with PM2
```bash
# Load environment
export $(cat .env | xargs)

# Start application
pm2 start ecosystem.config.js

# Monitor
pm2 monit

# View logs
pm2 logs paylinkbridge

# Stop
pm2 stop paylinkbridge

# Restart
pm2 restart paylinkbridge
```

### Option C: Traditional Node.js Server (Systemd)

#### Create systemd service file
```bash
sudo nano /etc/systemd/system/paylinkbridge.service
```

```ini
[Unit]
Description=PayLinkBridge Banking System
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/paylinkbridge
EnvironmentFile=/var/www/paylinkbridge/.env
ExecStart=/usr/bin/node server/server.js
Restart=always
RestartSec=10
StandardOutput=append:/var/log/paylinkbridge/app.log
StandardError=append:/var/log/paylinkbridge/error.log

[Install]
WantedBy=multi-user.target
```

#### Enable and start service
```bash
sudo systemctl daemon-reload
sudo systemctl enable paylinkbridge
sudo systemctl start paylinkbridge
sudo systemctl status paylinkbridge
sudo journalctl -u paylinkbridge -f
```

---

## Security Hardening

### 1. Enable HTTPS/SSL
```bash
# Using Let's Encrypt and Certbot
sudo certbot certonly --standalone -d checkout.yourdomain.com

# Update PAYLINK_SELF_URL to use HTTPS
PAYLINK_SELF_URL=https://checkout.yourdomain.com
```

### 2. Configure Nginx Reverse Proxy
```nginx
server {
    listen 443 ssl http2;
    server_name checkout.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/checkout.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/checkout.yourdomain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    location / {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Rate limiting
        limit_req zone=admin 10r/m;
    }
}

# Rate limiting zone
limit_req_zone $binary_remote_addr zone=admin:10m rate=10r/m;

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name checkout.yourdomain.com;
    return 301 https://$server_name$request_uri;
}
```

### 3. Firewall Configuration
```bash
# Allow only necessary ports
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP (for ACME challenges)
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable
```

### 4. Database Backup Strategy
```bash
#!/bin/bash
# backup.sh - Daily backup script

BACKUP_DIR="/backups/paylinkbridge"
DATA_DIR="/var/www/paylinkbridge/server"
DATE=$(date +%Y-%m-%d_%H-%m-%S)

mkdir -p $BACKUP_DIR

# Backup sensitive files only
cp $DATA_DIR/db.json $BACKUP_DIR/db_$DATE.json
cp $DATA_DIR/customers.json $BACKUP_DIR/customers_$DATE.json
cp $DATA_DIR/audit-log.json $BACKUP_DIR/audit-log_$DATE.json

# Encrypt backups
gpg --symmetric --cipher-algo AES256 $BACKUP_DIR/db_$DATE.json
gpg --symmetric --cipher-algo AES256 $BACKUP_DIR/customers_$DATE.json
gpg --symmetric --cipher-algo AES256 $BACKUP_DIR/audit-log_$DATE.json

# Remove unencrypted copies
rm $BACKUP_DIR/db_$DATE.json
rm $BACKUP_DIR/customers_$DATE.json
rm $BACKUP_DIR/audit-log_$DATE.json

# Keep only last 30 days
find $BACKUP_DIR -name "*.gpg" -mtime +30 -delete

echo "Backup completed: $BACKUP_DIR"
```

#### Schedule with cron
```bash
crontab -e
# Add: 0 2 * * * /var/www/paylinkbridge/backup.sh
```

---

## Monitoring and Maintenance

### 1. Log Monitoring
```bash
# Watch real-time logs
tail -f /var/log/paylinkbridge/app.log

# Search for errors
grep "ERROR" /var/log/paylinkbridge/error.log

# Monitor for security issues
grep "failed_admin_login" /var/log/paylinkbridge/app.log
```

### 2. Check System Health
```bash
# Verify server is running
curl http://localhost:4000/server/health

# Check database integrity
ls -lh server/*.json

# Monitor disk usage
du -sh server/

# Check memory usage
ps aux | grep "node server/server.js"
```

### 3. Admin Dashboard Checks
```bash
# Login to dashboard
curl -X POST http://localhost:4000/server/admin/login \
  -H "Content-Type: application/json" \
  -d '{"password":"ADMIN_PASSWORD"}'

# View email statistics
curl http://localhost:4000/server/admin/emails?token=SESSION_TOKEN

# Check audit log for suspicious activity
curl http://localhost:4000/server/audit-log?token=SESSION_TOKEN
```

### 4. Regular Maintenance Tasks

#### Weekly
```bash
#!/bin/bash
# Verify database files
echo "Database files integrity check:"
ls -lh server/*.json
echo ""

# Check for locked-out IPs
echo "Failed login attempts (last 7 days):"
grep "failed_admin_login\|locked_out" server/audit-log.json | tail -20
```

#### Monthly
```bash
#!/bin/bash
# Rotate admin password
echo "Time to rotate admin password"

# Archive old logs
gzip /var/log/paylinkbridge/app.log.*

# Clean up old sessions
node -e "
const fs = require('fs');
const sessions = JSON.parse(fs.readFileSync('server/sessions.json'));
const now = Date.now();
const oneHourAgo = now - (60 * 60 * 1000);

Object.keys(sessions).forEach(token => {
  if (new Date(sessions[token].expiresAt) < now) {
    delete sessions[token];
  }
});

fs.writeFileSync('server/sessions.json', JSON.stringify(sessions, null, 2));
console.log('Expired sessions cleaned up');
"
```

---

## Troubleshooting

### Server Won't Start
```bash
# Check for port conflicts
lsof -i :4000

# Check environment variables
echo $MASTER_SECRET_KEY
echo $ADMIN_PASS

# Check file permissions
ls -la server/
chmod 755 server/
chmod 644 server/*.json
```

### Login Fails
```bash
# Check if admin password is set
grep "ADMIN_PASS" .env

# Check admin attempts file
cat server/admin-attempts.json

# Clear lockout if needed
echo '{}' > server/admin-attempts.json
```

### Email Queue Not Working
```bash
# Check email file
cat server/emails.json | head -50

# Verify email service is running
curl http://localhost:4000/server/admin/emails?token=SESSION_TOKEN

# Check server logs for errors
grep "email" /var/log/paylinkbridge/app.log
```

### Database Corruption
```bash
# Backup current db
cp server/db.json server/db.json.corrupted

# Restore from backup
cp /backups/paylinkbridge/db_latest.json server/db.json

# Restart server
sudo systemctl restart paylinkbridge
```

---

## Performance Tuning

### Node.js Optimization
```bash
# Increase file descriptor limit
ulimit -n 65536

# Set environment variable
export NODE_ENV=production

# Enable clustering (if using PM2)
pm2 start ecosystem.config.js -i max
```

### Database Optimization
```bash
# Periodically compact database files
node -e "
const fs = require('fs');

// Read and rewrite database file
const db = JSON.parse(fs.readFileSync('server/db.json'));
fs.writeFileSync('server/db.json', JSON.stringify(db, null, 2));

console.log('Database compacted');
"
```

---

## Version Upgrade Path

### From v2.0 to v3.0
1. Backup current installation: `cp -r . backup_v2`
2. Pull latest code: `git pull origin main`
3. Update dependencies: `npm install`
4. Update .env (remove SMTP, GitHub variables)
5. Test: `npm start`
6. Verify all features work
7. Deploy to production

---

## Post-Deployment Verification

```bash
#!/bin/bash
# deployment-test.sh

echo "=== PayLinkBridge v3.0.0 Deployment Verification ==="
echo ""

# 1. Check health
echo "1. Health Check:"
curl -s http://localhost:4000/server/health | jq .
echo ""

# 2. Check admin login
echo "2. Admin Login Test:"
curl -s -X POST http://localhost:4000/server/admin/login \
  -H "Content-Type: application/json" \
  -d "{\"password\":\"$ADMIN_PASS\"}" | jq .
echo ""

# 3. Check bank configuration
echo "3. Bank Configuration:"
curl -s http://localhost:4000/server/bank-account | jq .
echo ""

# 4. Check plans
echo "4. Available Plans:"
curl -s http://localhost:4000/server/plans | jq .
echo ""

echo "=== Deployment Verification Complete ==="
```

---

## Support and Documentation

- **Security Details**: See `SECURITY_HARDENING.md`
- **API Documentation**: See `API.md`
- **Troubleshooting**: See `TROUBLESHOOTING.md`
- **Configuration**: See `.env.example`

---

## Summary

PayLinkBridge v3.0.0 is now ready for production deployment with:
- Zero external API dependencies
- Enterprise-grade security
- Internal email queue system
- Session-based admin authentication
- Full audit logging
- Ready for scale

**Next Steps**:
1. Prepare production environment
2. Configure SSL/HTTPS
3. Set up monitoring and backups
4. Deploy using chosen method (Docker, PM2, or Systemd)
5. Verify all systems operational
6. Begin accepting payments
