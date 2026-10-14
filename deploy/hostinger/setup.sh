#!/bin/bash
# O3L Hostinger VPS Setup Script
# Run this on a fresh Ubuntu 22.04/24.04 VPS from Hostinger

set -e

echo "=========================================="
echo "  O3L Hostinger VPS Setup"
echo "=========================================="

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_status() { echo -e "${GREEN}[✓]${NC} $1"; }
print_warning() { echo -e "${YELLOW}[!]${NC} $1"; }
print_error() { echo -e "${RED}[✗]${NC} $1"; }

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    print_error "Please run as root: sudo bash setup.sh"
    exit 1
fi

# Get domain from user
read -p "Enter your domain (e.g., o3l.org): " DOMAIN
read -p "Enter your email for SSL: " EMAIL

print_status "Starting setup for $DOMAIN"

# ===========================================
# 1. SYSTEM UPDATE
# ===========================================
print_status "Updating system packages..."
apt update && apt upgrade -y

# ===========================================
# 2. INSTALL DEPENDENCIES
# ===========================================
print_status "Installing system dependencies..."
apt install -y \
    curl \
    wget \
    git \
    unzip \
    software-properties-common \
    apt-transport-https \
    ca-certificates \
    gnupg \
    lsb-release \
    ufw \
    fail2ban \
    htop \
    net-tools

# ===========================================
# 3. INSTALL PYTHON 3.12
# ===========================================
print_status "Installing Python 3.12..."
add-apt-repository ppa:deadsnakes/ppa -y
apt update
apt install -y \
    python3.12 \
    python3.12-venv \
    python3.12-dev \
    python3-pip

# Set Python 3.12 as default
update-alternatives --install /usr/bin/python3 python3 /usr/bin/python3.12 1
update-alternatives --install /usr/bin/python python /usr/bin/python3.12 1

print_status "Python $(python3 --version) installed"

# ===========================================
# 4. INSTALL NODE.JS 20
# ===========================================
print_status "Installing Node.js 20..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

print_status "Node.js $(node --version) installed"

# ===========================================
# 5. INSTALL POSTGRESQL 17 + POSTGIS
# ===========================================
print_status "Installing PostgreSQL 17 with PostGIS..."
sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg apt.postgresql.org/pgdg'
wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | apt-key add -
apt update
apt install -y postgresql-17 postgresql-client-17 postgresql-17-postgis-3.6

print_status "PostgreSQL installed"

# ===========================================
# 6. INSTALL REDIS
# ===========================================
print_status "Installing Redis..."
apt install -y redis-server
systemctl enable redis-server
systemctl start redis-server

print_status "Redis installed"

# ===========================================
# 7. INSTALL NGINX
# ===========================================
print_status "Installing Nginx..."
apt install -y nginx
systemctl enable nginx

print_status "Nginx installed"

# ===========================================
# 8. INSTALL SYSTEMD DEPENDENCIES
# ===========================================
print_status "Installing Gunicorn and PM2..."
pip3 install gunicorn
npm install -g pm2

print_status "Gunicorn and PM2 installed"

# ===========================================
# 9. CONFIGURE FIREWALL
# ===========================================
print_status "Configuring firewall..."
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 8000/tcp
ufw --force enable

print_status "Firewall configured"

# ===========================================
# 10. CONFIGURE FAIL2BAN
# ===========================================
print_status "Configuring Fail2Ban..."
cat > /etc/fail2ban/jail.local << 'EOF'
[sshd]
enabled = true
port = ssh
filter = sshd
logpath = /var/log/auth.log
maxretry = 3
bantime = 3600

[nginx-http-auth]
enabled = true
filter = nginx-http-auth
port = http,https
logpath = /var/log/nginx/error.log
maxretry = 3
bantime = 3600
EOF

systemctl restart fail2ban

print_status "Fail2Ban configured"

# ===========================================
# 11. CREATE O3L USER
# ===========================================
print_status "Creating o3l user..."
if ! id -u o3l &>/dev/null; then
    adduser --disabled-password --gecos "" o3l
    usermod -aG sudo o3l
    echo "o3l ALL=(ALL) NOPASSWD:ALL" > /etc/sudoers.d/o3l
fi

# ===========================================
# 12. CREATE DIRECTORY STRUCTURE
# ===========================================
print_status "Creating directory structure..."
mkdir -p /var/www/o3l
mkdir -p /var/log/o3l
mkdir -p /var/backups/o3l
mkdir -p /etc/nginx/sites-available
mkdir -p /etc/nginx/sites-enabled
mkdir -p /etc/systemd/system

chown -R o3l:o3l /var/www/o3l
chown -R o3l:o3l /var/log/o3l
chown -R o3l:o3l /var/backups/o3l

print_status "Directory structure created"

# ===========================================
# 13. SETUP COMPLETE
# ===========================================
echo ""
echo "=========================================="
echo "  Setup Complete!"
echo "=========================================="
echo ""
print_status "Next steps:"
echo "  1. Upload your code to /var/www/o3l"
echo "  2. Run: cd /var/www/o3l && bash deploy/hostinger/deploy.sh"
echo "  3. Configure your domain DNS to point to this server"
echo ""
print_warning "Important:"
echo "  - Keep your SSH key safe"
echo "  - Configure .env file before deployment"
echo "  - Set up SSL after DNS is configured"
echo ""
