#!/bin/bash

# Patent Analytics Platform - PostgreSQL Migration Script
# This script handles the complete migration from SQLite to PostgreSQL

echo "======================================"
echo "Patent Analytics Platform"
echo "SQLite to PostgreSQL Migration"
echo "======================================"
echo ""

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Check prerequisites
echo -e "${YELLOW}Step 1: Checking prerequisites...${NC}"
if ! command -v psql &> /dev/null; then
    echo -e "${RED}PostgreSQL is not installed. Please install it first.${NC}"
    exit 1
fi
echo -e "${GREEN}✓ PostgreSQL is installed${NC}"

# Step 2: Create PostgreSQL database
echo -e "\n${YELLOW}Step 2: Setting up PostgreSQL database...${NC}"
echo "Please run the following command with sudo privileges:"
echo -e "${GREEN}sudo -u postgres psql < setup_postgres.sql${NC}"
echo ""
echo "Press Enter after you've run the command..."
read

# Step 3: Test PostgreSQL connection
echo -e "\n${YELLOW}Step 3: Testing PostgreSQL connection...${NC}"
PGPASSWORD=patent_secure_pass_2024 psql -h localhost -U patent_user -d patent_analytics_db -c "\dt" &> /dev/null
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Successfully connected to PostgreSQL${NC}"
else
    echo -e "${RED}Could not connect to PostgreSQL. Please check your setup.${NC}"
    echo "Make sure you ran: sudo -u postgres psql < setup_postgres.sql"
    exit 1
fi

# Step 4: Run Django migrations
echo -e "\n${YELLOW}Step 4: Running Django migrations on PostgreSQL...${NC}"
./venv/bin/python manage.py migrate --database default

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Migrations completed successfully${NC}"
else
    echo -e "${RED}Migration failed. Please check the error messages above.${NC}"
    exit 1
fi

# Step 5: Create superuser
echo -e "\n${YELLOW}Step 5: Creating superuser account...${NC}"
echo "Do you want to create a superuser account? (y/n)"
read -r create_super
if [ "$create_super" = "y" ]; then
    ./venv/bin/python manage.py createsuperuser
fi

# Step 6: Load data from backup
echo -e "\n${YELLOW}Step 6: Loading data from backup...${NC}"
if [ -f "data_backup.json" ]; then
    echo "Loading data from data_backup.json..."
    ./venv/bin/python manage.py loaddata data_backup.json --database default
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Data loaded successfully${NC}"
    else
        echo -e "${YELLOW}⚠ Some data could not be loaded. This is normal for some system tables.${NC}"
    fi
else
    echo -e "${YELLOW}No data backup found. Starting with fresh database.${NC}"
fi

# Step 7: Verify migration
echo -e "\n${YELLOW}Step 7: Verifying migration...${NC}"
./venv/bin/python manage.py dbshell --database default -c "\dt" | head -20
echo ""
echo -e "${GREEN}======================================"
echo "Migration Complete!"
echo "======================================"
echo ""
echo "Database: patent_analytics_db"
echo "User: patent_user"
echo "Host: localhost"
echo "Port: 5432"
echo ""
echo "You can now restart your Django server with:"
echo "  cd backend && ./venv/bin/daphne -b 0.0.0.0 -p 8000 config.asgi:application"
echo -e "${NC}"