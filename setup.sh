# O3L Development Setup - Windows
# Run this in Git Bash

echo "========================================="
echo " O3L - Development Environment Setup"
echo "========================================="
echo ""

# Step 1: Check Python
echo "[1/6] Checking Python..."
python --version
if [ $? -ne 0 ]; then
    echo "ERROR: Python not found. Install Python 3.12+ from python.org"
    exit 1
fi

# Step 2: Create virtual environment
echo ""
echo "[2/6] Creating virtual environment..."
cd apps/api
python -m venv --without-pip venv
venv/Scripts/python.exe -m ensurepip --upgrade
venv/Scripts/python.exe -m pip install --upgrade pip

# Step 3: Install Python packages
echo ""
echo "[3/6] Installing Python packages..."
venv/Scripts/pip.exe install -r requirements.txt

echo ""
echo "========================================="
echo " Python setup complete!"
echo "========================================="
echo ""
echo "NEXT STEPS - Install these manually:"
echo ""
echo "1. PostgreSQL 17 + PostGIS 3.6"
echo "   Download: https://www.enterprisedb.com/downloads/postgres-postgresql-downloads"
echo "   During install, select 'PostGIS' in Stack Builder"
echo ""
echo "2. After PostgreSQL install, create database:"
echo "   psql -U postgres"
echo "   CREATE USER o3l_user WITH PASSWORD 'o3l_password';"
echo "   CREATE DATABASE o3l_dev OWNER o3l_user;"
echo "   \\q"
echo ""
echo "3. Then run:"
echo "   source venv/Scripts/activate"
echo "   python manage.py migrate"
echo "   python manage.py seed_zones"
echo "   python manage.py createsuperuser"
echo "   python manage.py runserver"
echo ""
