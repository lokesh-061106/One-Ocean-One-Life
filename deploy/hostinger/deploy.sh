#!/bin/bash
# O3L Deployment Script for Hostinger VPS
# Run this after setup.sh

set -e

echo "=========================================="
echo "  O3L Deployment"
echo "=========================================="

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_status() { echo -e "${GREEN}[✓]${NC} $1"; }
print_warning() { echo -e "${YELLOW}[!]${NC} $1"; }
print_error() { echo -e "${RED}[✗]${NC} $1"; }

# Configuration
APP_DIR="/var/www/o3l"
VENV_DIR="$APP_DIR/venv"
LOG_DIR="/var/log/o3l"
BACKUP_DIR="/var/backups/o3l"

# Get configuration
read -p "Enter domain (e.g., o3l.org): " DOMAIN
read -p "Enter database name [o3l_prod]: " DB_NAME
DB_NAME=${DB_NAME:-o3l_prod}
read -p "Enter database user [o3l_user]: " DB_USER
DB_USER=${DB_USER:-o3l_user}
read -s -p "Enter database password: " DB_PASS
echo ""
read -p "Enter email for SSL certificate: " EMAIL

print_status "Starting deployment for $DOMAIN"

# ===========================================
# 1. DATABASE SETUP
# ===========================================
print_status "Setting up PostgreSQL database..."
sudo -u postgres psql -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASS';" 2>/dev/null || true
sudo -u postgres psql -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;" 2>/dev/null || true
sudo -u postgres psql -c "ALTER USER $DB_USER CREATEDB;" 2>/dev/null || true
sudo -u postgres psql -c "CREATE EXTENSION IF NOT EXISTS postgis;" -d $DB_NAME 2>/dev/null || true
sudo -u postgres psql -c "CREATE EXTENSION IF NOT EXISTS postgis_topology;" -d $DB_NAME 2>/dev/null || true

print_status "Database configured"

# ===========================================
# 2. PYTHON VIRTUAL ENVIRONMENT
# ===========================================
print_status "Setting up Python environment..."
cd $APP_DIR

if [ ! -d "$VENV_DIR" ]; then
    python3.12 -m venv $VENV_DIR
fi

source $VENV_DIR/bin/activate

# Install Python dependencies
pip install --upgrade pip
pip install -r apps/api/requirements.txt

print_status "Python environment ready"

# ===========================================
# 3. DJANGO CONFIGURATION
# ===========================================
print_status "Configuring Django..."

# Create .env file if it doesn't exist
if [ ! -f "$APP_DIR/.env" ]; then
    cat > $APP_DIR/.env << EOF
# Django
DEBUG=False
SECRET_KEY=$(python3 -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())")
ALLOWED_HOSTS=$DOMAIN,www.$DOMAIN
DATABASE_URL=postgres://$DB_USER:$DB_PASS@localhost:5432/$DB_NAME
REDIS_URL=redis://localhost:6379/0

# JWT
JWT_ACCESS_TOKEN_LIFETIME=60
JWT_REFRESH_TOKEN_LIFETIME=7

# CORS
CORS_ALLOWED_ORIGINS=https://$DOMAIN,https://www.$DOMAIN

# CSRF
CSRF_TRUSTED_ORIGINS=https://$DOMAIN,https://www.$DOMAIN

# Media
MEDIA_URL=https://$DOMAIN/media/
STATIC_URL=https://$DOMAIN/static/

# Add your API keys here:
# TWILIO_ACCOUNT_SID=
# TWILIO_AUTH_TOKEN=
# TWILIO_PHONE_NUMBER=
# GOOGLE_CLIENT_ID=
# GOOGLE_CLIENT_SECRET=
# FIREBASE_CREDENTIALS_PATH=
# RAZORPAY_KEY_ID=
# RAZORPAY_KEY_SECRET=
# STRIPE_SECRET_KEY=
# STRIPE_WEBHOOK_SECRET=
EOF
    print_warning "Created .env file - please add your API keys!"
fi

# Run migrations
cd apps/api
python manage.py migrate --noinput

# Collect static files
python manage.py collectstatic --noinput

# Create superuser (optional)
read -p "Create superuser? (y/n): " CREATE_SUPER
if [ "$CREATE_SUPER" = "y" ]; then
    python manage.py createsuperuser
fi

print_status "Django configured"

# ===========================================
# 4. GUNICORN CONFIGURATION
# ===========================================
print_status "Configuring Gunicorn..."

cat > /etc/systemd/system/o3l-api.service << EOF
[Unit]
Description=O3L API Server
After=network.target postgresql.service redis.service

[Service]
User=o3l
Group=o3l
WorkingDirectory=$APP_DIR/apps/api
ExecStart=$VENV_DIR/bin/gunicorn o3l.wsgi:application \\
    --bind unix:/run/gunicorn/o3l.sock \\
    --workers 3 \\
    --worker-class gthread \\
    --threads 2 \\
    --timeout 120 \\
    --access-logfile /var/log/o3l/access.log \\
    --error-logfile /var/log/o3l/error.log \\
    --capture-output
ExecReload=/bin/kill -s HUP \$MAINPID
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

# Create gunicorn socket
cat > /etc/systemd/system/o3l-api.socket << EOF
[Unit]
Description=O3L API Socket

[Socket]
ListenStream=/run/gunicorn/o3l.sock
SocketUser=o3l
SocketGroup=o3l
SocketMode=0660

[Install]
WantedBy=sockets.target
EOF

# Create run directory
mkdir -p /run/gunicorn
chown o3l:o3l /run/gunicorn

systemctl daemon-reload
systemctl enable o3l-api.socket
systemctl start o3l-api.socket

print_status "Gunicorn configured"

# ===========================================
# 5. CELERY CONFIGURATION
# ===========================================
print_status "Configuring Celery..."

cat > /etc/systemd/system/o3l-celery.service << EOF
[Unit]
Description=O3L Celery Worker
After=network.target redis.service postgresql.service

[Service]
User=o3l
Group=o3l
WorkingDirectory=$APP_DIR/apps/api
ExecStart=$VENV_DIR/bin/celery -A o3l worker \\
    --loglevel=info \\
    --concurrency=2 \\
    --max-tasks-per-child=1000 \\
    -f /var/log/o3l/celery.log
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

cat > /etc/systemd/system/o3l-celerybeat.service << EOF
[Unit]
Description=O3L Celery Beat
After=network.target redis.service

[Service]
User=o3l
Group=o3l
WorkingDirectory=$APP_DIR/apps/api
ExecStart=$VENV_DIR/bin/celery -A o3l beat \\
    --loglevel=info \\
    -f /var/log/o3l/celerybeat.log
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable o3l-celery
systemctl enable o3l-celerybeat
systemctl start o3l-celery
systemctl start o3l-celerybeat

print_status "Celery configured"

# ===========================================
# 6. NEXT.JS BUILD & PM2
# ===========================================
print_status "Building Next.js application..."

cd $APP_DIR/apps/web

# Install Node dependencies
npm ci

# Build for production
npm run build

# Create PM2 ecosystem file
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'o3l-web',
    script: 'node_modules/.bin/next',
    args: 'start -p 3000',
    cwd: '$APP_DIR/apps/web',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
      NEXT_PUBLIC_API_URL: 'https://$DOMAIN/api/v1'
    },
    instances: 2,
    exec_mode: 'cluster',
    max_memory_restart: '1G',
    error_file: '/var/log/o3l/web-error.log',
    out_file: '/var/log/o3l/web-out.log',
    time: true
  }]
};
EOF

# Start with PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup

print_status "Next.js configured"

# ===========================================
# 7. NGINX CONFIGURATION
# ===========================================
print_status "Configuring Nginx..."

cat > /etc/nginx/sites-available/o3l << EOF
# Rate limiting
limit_req_zone \$binary_remote_addr zone=api:10m rate=10r/s;
limit_req_zone \$binary_remote_addr zone=web:10m rate=30r/s;

# Upstream servers
upstream api_backend {
    server unix:/run/gunicorn/o3l.sock fail_timeout=0;
}

upstream web_backend {
    server 127.0.0.1:3000 fail_timeout=0;
}

# HTTP -> HTTPS redirect
server {
    listen 80;
    listen [::]:80;
    server_name $DOMAIN www.$DOMAIN;
    return 301 https://\$server_name\$request_uri;
}

# Main server block
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name $DOMAIN www.$DOMAIN;

    # SSL (will be configured by certbot)
    ssl_certificate /etc/letsencrypt/live/$DOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 1d;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # File upload limit
    client_max_body_size 100M;

    # API endpoints
    location /api/ {
        limit_req zone=api burst=20 nodelay;
        proxy_pass http://api_backend;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_redirect off;
        proxy_buffering off;
        proxy_read_timeout 120s;
    }

    # Django admin
    location /admin/ {
        proxy_pass http://api_backend;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # Media files
    location /media/ {
        alias $APP_DIR/apps/api/media/;
        expires 30d;
        add_header Cache-Control "public, immutable";
        add_header Access-Control-Allow-Origin "*";
    }

    # Static files
    location /static/ {
        alias $APP_DIR/apps/api/staticfiles/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # Favicon
    location = /favicon.ico {
        alias $APP_DIR/apps/web/public/favicon.ico;
        expires 365d;
        add_header Cache-Control "public, immutable";
    }

    # WebSocket for Next.js HMR (development only)
    location /_next/webpack-hmr {
        proxy_pass http://web_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    # Next.js static files
    location /_next/static/ {
        proxy_pass http://web_backend;
        expires 365d;
        add_header Cache-Control "public, immutable";
    }

    # Web app (catch-all)
    location / {
        limit_req zone=web burst=50 nodelay;
        proxy_pass http://web_backend;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_redirect off;
    }

    # Health check
    location /health {
        access_log off;
        return 200 "OK";
        add_header Content-Type text/plain;
    }
}
EOF

# Enable site
ln -sf /etc/nginx/sites-available/o3l /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test nginx config
nginx -t

systemctl restart nginx

print_status "Nginx configured"

# ===========================================
# 8. SSL SETUP
# ===========================================
print_status "Setting up SSL with Certbot..."

apt install -y certbot python3-certbot-nginx

# Get SSL certificate
certbot certonly --nginx -d $DOMAIN -d www.$DOMAIN --email $EMAIL --agree-tos --non-interactive

# Auto-renewal cron job
echo "0 12 * * * /usr/bin/certbot renew --quiet" | crontab -

systemctl restart nginx

print_status "SSL configured"

# ===========================================
# 9. BACKUP SCRIPT
# ===========================================
print_status "Setting up backups..."

cat > /usr/local/bin/o3l-backup << 'BACKUP_EOF'
#!/bin/bash
BACKUP_DIR="/var/backups/o3l"
DATE=$(date +%Y%m%d_%H%M%S)
APP_DIR="/var/www/o3l"

# Database backup
sudo -u postgres pg_dump o3l_prod > "$BACKUP_DIR/db_$DATE.sql"

# Media backup
tar -czf "$BACKUP_DIR/media_$DATE.tar.gz" -C "$APP_DIR/apps/api" media/

# Keep only last 7 days
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete

echo "Backup completed: $DATE"
BACKUP_EOF

chmod +x /usr/local/bin/o3l-backup

# Daily backup cron
echo "0 2 * * * /usr/local/bin/o3l-backup" | crontab -u o3l -

print_status "Backups configured"

# ===========================================
# 10. MONITORING
# ===========================================
print_status "Setting up basic monitoring..."

cat > /usr/local/bin/o3l-status << 'STATUS_EOF'
#!/bin/bash
echo "=== O3L Service Status ==="
echo ""
echo "Nginx: $(systemctl is-active nginx)"
echo "PostgreSQL: $(systemctl is-active postgresql)"
echo "Redis: $(systemctl is-active redis-server)"
echo "Gunicorn: $(systemctl is-active o3l-api.socket)"
echo "Celery: $(systemctl is-active o3l-celery)"
echo "Celery Beat: $(systemctl is-active o3l-celerybeat)"
echo "Next.js: $(pm2 jlist 2>/dev/null | grep -o '"name":"o3l-web"' | head -1 || echo 'not running')"
echo ""
echo "=== Disk Usage ==="
df -h / | tail -1
echo ""
echo "=== Memory Usage ==="
free -h | head -2
STATUS_EOF

chmod +x /usr/local/bin/o3l-status

print_status "Monitoring configured"

# ===========================================
# 11. LOG ROTATION
# ===========================================
print_status "Configuring log rotation..."

cat > /etc/logrotate.d/o3l << EOF
/var/log/o3l/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 o3l o3l
    sharedscripts
    postrotate
        systemctl reload o3l-celery > /dev/null 2>&1 || true
    endscript
}
EOF

print_status "Log rotation configured"

# ===========================================
# DEPLOYMENT COMPLETE
# ===========================================
echo ""
echo "=========================================="
echo "  Deployment Complete!"
echo "=========================================="
echo ""
print_status "Your application is now live at:"
echo "  https://$DOMAIN"
echo ""
print_status "Services running:"
echo "  - Nginx (reverse proxy)"
echo "  - PostgreSQL 17 + PostGIS"
echo "  - Redis"
echo "  - Gunicorn (Django API)"
echo "  - Celery Worker"
echo "  - Celery Beat"
echo "  - Next.js (PM2)"
echo ""
print_status "Useful commands:"
echo "  o3l-status          - Check service status"
echo "  o3l-backup          - Run manual backup"
echo "  pm2 logs o3l-web    - View Next.js logs"
echo "  journalctl -u o3l-celery -f  - View Celery logs"
echo ""
print_warning "Important:"
echo "  1. Add your API keys to /var/www/o3l/.env"
echo "  2. Create a superuser: cd /var/www/o3l/apps/api && source ../venv/bin/activate && python manage.py createsuperuser"
echo "  3. Test all services are working"
echo ""
