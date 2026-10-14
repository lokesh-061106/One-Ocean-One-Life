# O3L Hostinger Deployment Guide

## Prerequisites

### Hostinger VPS Plan Required
- **VPS KVM 2** or higher (4GB RAM, 2 vCPU, 50GB storage minimum)
- Ubuntu 22.04 or 24.04 LTS
- Root access via SSH

### Domain Setup
1. Purchase a domain from Hostinger or use an existing one
2. Point the domain to your VPS IP address:
   - A Record: `@` → `YOUR_VPS_IP`
   - A Record: `www` → `YOUR_VPS_IP`

## Step 1: Initial VPS Setup

1. SSH into your VPS:
```bash
ssh root@YOUR_VPS_IP
```

2. Upload the setup script:
```bash
scp -r deploy/hostinger/ root@YOUR_VPS_IP:/tmp/
```

3. Run the setup script:
```bash
cd /tmp/hostinger
chmod +x setup.sh
bash setup.sh
```

4. Enter your domain and email when prompted.

## Step 2: Upload Application Code

1. From your local machine, upload the code:
```bash
# Option 1: Using rsync
rsync -avz --exclude 'node_modules' --exclude '.next' --exclude '__pycache__' \
  /path/to/oneoceanonelife/ root@YOUR_VPS_IP:/var/www/o3l/

# Option 2: Using git
ssh root@YOUR_VPS_IP
cd /var/www/o3l
git clone https://github.com/your-org/o3l.git .
```

## Step 3: Configure Environment

1. SSH as o3l user:
```bash
ssh o3l@YOUR_VPS_IP
```

2. Edit the .env file:
```bash
nano /var/www/o3l/.env
```

3. Add your API keys:
```env
# Django
DEBUG=False
SECRET_KEY=your-secret-key-here
ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com

# Database
DATABASE_URL=postgres://o3l_user:your-password@localhost:5432/o3l_prod
REDIS_URL=redis://localhost:6379/0

# Twilio (SMS OTP)
TWILIO_ACCOUNT_SID=your-account-sid
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_PHONE_NUMBER=+1234567890

# Google OAuth
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret

# Apple Sign-In
APPLE_CLIENT_ID=your-client-id
APPLE_TEAM_ID=your-team-id
APPLE_KEY_ID=your-key-id

# Firebase (Push Notifications)
FIREBASE_CREDENTIALS_PATH=/var/www/o3l/firebase-credentials.json

# Razorpay (India Payments)
RAZORPAY_KEY_ID=your-key-id
RAZORPAY_KEY_SECRET=your-key-secret

# Stripe (International Payments)
STRIPE_SECRET_KEY=your-secret-key
STRIPE_WEBHOOK_SECRET=your-webhook-secret

# Cloudflare R2 (Media Storage)
R2_ACCOUNT_ID=your-account-id
R2_ACCESS_KEY_ID=your-access-key
R2_SECRET_ACCESS_KEY=your-secret-key
R2_BUCKET_NAME=your-bucket-name
```

## Step 4: Run Deployment

1. Run the deployment script:
```bash
cd /var/www/o3l
sudo bash deploy/hostinger/deploy.sh
```

2. Enter your domain, database name, user, and password when prompted.

3. The script will:
   - Create the database
   - Set up Python virtual environment
   - Install dependencies
   - Run migrations
   - Configure Gunicorn
   - Configure Celery
   - Build Next.js
   - Configure Nginx
   - Set up SSL
   - Configure backups

## Step 5: Post-Deployment

### Create Superuser
```bash
cd /var/www/o3l/apps/api
source /var/www/o3l/venv/bin/activate
python manage.py createsuperuser
```

### Seed Data
```bash
python manage.py seed_zones
python manage.py seed_cms
python manage.py seed_data
```

### Check Services
```bash
o3l-status
```

## Useful Commands

### Service Management
```bash
# Check status
o3l-status

# Restart services
sudo systemctl restart o3l-api.socket
sudo systemctl restart o3l-celery
sudo systemctl restart o3l-celerybeat
pm2 restart o3l-web
sudo systemctl restart nginx

# View logs
journalctl -u o3l-celery -f
pm2 logs o3l-web
sudo tail -f /var/log/o3l/error.log
```

### Database
```bash
# Backup
o3l-backup

# Restore
sudo -u postgres psql o3l_prod < /var/backups/o3l/db_YYYYMMDD_HHMMSS.sql
```

### Updates
```bash
cd /var/www/o3l
git pull

# Update Python dependencies
source venv/bin/activate
pip install -r apps/api/requirements.txt

# Run migrations
cd apps/api
python manage.py migrate

# Collect static files
python manage.py collectstatic --noinput

# Rebuild Next.js
cd ../web
npm ci
npm run build

# Restart services
pm2 restart o3l-web
sudo systemctl restart o3l-celery
```

## Troubleshooting

### Check Service Status
```bash
systemctl status nginx
systemctl status postgresql
systemctl status redis-server
systemctl status o3l-api.socket
systemctl status o3l-celery
pm2 status
```

### View Logs
```bash
# Nginx
sudo tail -f /var/log/nginx/error.log

# Django
sudo tail -f /var/log/o3l/error.log

# Celery
journalctl -u o3l-celery -f

# Next.js
pm2 logs o3l-web
```

### Common Issues

#### 502 Bad Gateway
- Check if Gunicorn is running: `systemctl status o3l-api.socket`
- Check if socket exists: `ls -la /run/gunicorn/o3l.sock`

#### Database Connection Error
- Check PostgreSQL: `systemctl status postgresql`
- Check credentials in .env

#### Static Files Not Loading
- Run: `python manage.py collectstatic --noinput`
- Check permissions: `chown -R o3l:o3l /var/www/o3l/apps/api/staticfiles`

#### SSL Issues
- Check certificate: `certbot certificates`
- Renew: `certbot renew`
- Check Nginx config: `nginx -t`

## Backup Strategy

### Automatic Backups
- Daily database backup at 2:00 AM
- Daily media backup at 2:00 AM
- 7-day retention

### Manual Backup
```bash
o3l-backup
```

### Restore from Backup
```bash
# Database
sudo -u postgres psql o3l_prod < /var/backups/o3l/db_20260831_020000.sql

# Media
tar -xzf /var/www/o3l/apps/api/media/ /var/backups/o3l/media_20260831_020000.tar.gz
```

## Security Checklist

- [ ] SSH key authentication enabled
- [ ] Root login disabled
- [ ] Firewall configured (UFW)
- [ ] Fail2Ban configured
- [ ] SSL certificate installed
- [ ] Security headers configured
- [ ] Rate limiting enabled
- [ ] Database credentials strong
- [ ] API keys secured in .env
- [ ] Backups configured
- [ ] Monitoring in place

## Performance Optimization

### Caching
- Redis for session and query caching
- Nginx browser caching for static files
- CDN for media files (Cloudflare)

### Database
- PostgreSQL connection pooling
- Spatial indexes for PostGIS queries
- Regular VACUUM and ANALYZE

### Application
- Gunicorn with 3 workers + threads
- Celery with 2 concurrent workers
- PM2 cluster mode for Next.js

## Support

For issues, check:
1. Service status: `o3l-status`
2. Logs: `journalctl -u o3l-celery -f`
3. Nginx config: `nginx -t`
4. Django checks: `python manage.py check`

## Hostinger Specific Notes

### SSH Access
- Use port 22 (default)
- Enable root login for initial setup
- Disable after setup for security

### Database
- PostgreSQL is not included by default
- Must be installed manually (done in setup.sh)
- Consider using Hostinger's managed database for production

### Storage
- VPS storage is limited
- Use Cloudflare R2 for media files
- Regular backups to external storage

### Bandwidth
- Monitor bandwidth usage
- Use CDN for static assets
- Compress images and videos

### SSL
- Free SSL via Let's Encrypt
- Auto-renewal configured
- SSL enforced via Nginx

### Backups
- Hostinger provides daily backups
- Our custom backup script adds more control
- Store backups externally for safety
