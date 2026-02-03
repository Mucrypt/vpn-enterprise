#!/bin/bash
set -e

# Deploy NexusAI Billing System to Production
# This script runs the database migration and verifies the deployment

echo "🚀 Starting NexusAI Billing Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

PROD_SERVER="root@157.180.123.240"
PROD_PATH="/opt/vpn-enterprise"

echo -e "${YELLOW}Step 1: Copying migration file to production server...${NC}"
scp packages/database/migrations/005_nexusai_billing.sql \
  $PROD_SERVER:$PROD_PATH/packages/database/migrations/

echo -e "${YELLOW}Step 2: Running database migration on production...${NC}"
ssh $PROD_SERVER "cd $PROD_PATH && \
  docker compose -f infrastructure/docker/docker-compose.prod.yml exec -T postgres \
  psql -U platform_admin -d platform_db" < packages/database/migrations/005_nexusai_billing.sql

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Migration completed successfully${NC}"
else
    echo -e "${RED}❌ Migration failed${NC}"
    exit 1
fi

echo -e "${YELLOW}Step 3: Verifying billing tables...${NC}"
ssh $PROD_SERVER "cd $PROD_PATH && \
  docker compose -f infrastructure/docker/docker-compose.prod.yml exec -T postgres \
  psql -U platform_admin -d platform_db -c '\dt user_subscriptions'"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Billing tables exist${NC}"
else
    echo -e "${RED}❌ Billing tables not found${NC}"
    exit 1
fi

echo -e "${YELLOW}Step 4: Checking default subscriptions...${NC}"
ssh $PROD_SERVER "cd $PROD_PATH && \
  docker compose -f infrastructure/docker/docker-compose.prod.yml exec -T postgres \
  psql -U platform_admin -d platform_db -c 'SELECT COUNT(*) as total_subscriptions FROM user_subscriptions;'"

echo -e "${YELLOW}Step 5: Verifying API and NexusAI services...${NC}"
ssh $PROD_SERVER "cd $PROD_PATH && \
  docker compose -f infrastructure/docker/docker-compose.prod.yml ps api nexusai"

echo ""
echo -e "${GREEN}✅ Deployment Complete!${NC}"
echo ""
echo "📊 Next Steps:"
echo "  1. Visit https://chatbuilds.com/nexusai"
echo "  2. Try accessing without login (should redirect to login)"
echo "  3. Login and check credits display in navbar"
echo "  4. Generate an app and verify credit deduction"
echo ""
echo "📈 Monitor billing with:"
echo "  ssh $PROD_SERVER 'docker compose -f /opt/vpn-enterprise/infrastructure/docker/docker-compose.prod.yml exec postgres psql -U platform_admin -d platform_db'"
echo "  Then run: SELECT * FROM user_subscription_summary;"
