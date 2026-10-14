#!/bin/bash
# O3L Local Deployment Script for Hostinger
# Run this from your local machine to deploy to Hostinger VPS

set -e

echo "=========================================="
echo "  O3L Local Deployment to Hostinger"
echo "=========================================="

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_status() { echo -e "${GREEN}[✓]${NC} $1"; }
print_warning() { echo -e "${YELLOW}[!]${NC} $1"; }
print_error() { echo -e "${RED}[✗]${NC} $1"; }

# Configuration
read -p "Enter VPS IP address: " VPS_IP
read -p "Enter VPS user [root]: " VPS_USER
VPS_USER=${VPS_USER:-root}
read -p "Enter domain (e.g., o3l.org): " DOMAIN

APP_DIR="/var/www/o3l"

print_status "Deploying to $VPS_IP"

# ===========================================
# 1. TEST SSH CONNECTION
# ===========================================
print_status "Testing SSH connection..."
if ! ssh -q $VPS_USER@$VPS_IP exit; then
    print_error "Cannot connect to VPS. Check IP and credentials."
    exit 1
fi
print_status "SSH connection successful"

# ===========================================
# 2. UPLOAD SETUP SCRIPTS
# ===========================================
print_status "Uploading deployment scripts..."
scp -r deploy/hostinger/ $VPS_USER@$VPS_IP:/tmp/

# ===========================================
# 3. RUN SETUP (if first time)
# ===========================================
read -p "Is this first deployment? (y/n): " FIRST_TIME
if [ "$FIRST_TIME" = "y" ]; then
    print_status "Running initial setup..."
    ssh $VPS_USER@$VPS_IP "chmod +x /tmp/hostinger/setup.sh && bash /tmp/hostinger/setup.sh" <<< "$DOMAIN"
fi

# ===========================================
# 4. UPLOAD APPLICATION CODE
# ===========================================
print_status "Uploading application code..."
rsync -avz --progress \
    --exclude 'node_modules' \
    --exclude '.next' \
    --exclude '__pycache__' \
    --exclude '*.pyc' \
    --exclude '.git' \
    --exclude 'venv' \
    --exclude '.env' \
    . $VPS_USER@$VPS_IP:$APP_DIR/

# ===========================================
# 5. UPLOAD ENV FILE
# ===========================================
if [ -f ".env" ]; then
    print_status "Uploading .env file..."
    scp .env $VPS_USER@$VPS_IP:$APP_DIR/.env
else
    print_warning "No .env file found. Create one on the server."
fi

# ===========================================
# 6. RUN DEPLOYMENT
# ===========================================
print_status "Running deployment..."
ssh $VPS_USER@$VPS_IP "cd $APP_DIR && bash deploy/hostinger/deploy.sh" <<< "$DOMAIN"

# ===========================================
# 7. VERIFY DEPLOYMENT
# ===========================================
print_status "Verifying deployment..."
sleep 10

if curl -s -o /dev/null -w "%{http_code}" https://$DOMAIN | grep -q "200"; then
    print_status "Deployment successful!"
    echo ""
    echo "=========================================="
    echo "  Deployment Complete!"
    echo "=========================================="
    echo ""
    print_status "Your application is live at:"
    echo "  https://$DOMAIN"
    echo ""
    print_status "Admin panel:"
    echo "  https://$DOMAIN/admin/"
    echo ""
else
    print_warning "Application might still be starting up."
    echo "  Check: https://$DOMAIN"
    echo "  Logs: ssh $VPS_USER@$VPS_IP 'pm2 logs o3l-web'"
fi
