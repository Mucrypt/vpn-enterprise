#!/bin/bash
# ==============================================
# VPN ENTERPRISE - SECURITY SETUP VERIFICATION
# ==============================================
# Verifies Docker secrets and configuration are properly set up

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

SECRETS_DIR="infrastructure/docker/secrets"
CONFIG_DIR="infrastructure/docker/config"
ERRORS=0
WARNINGS=0

echo -e "${BLUE}🔐 VPN Enterprise - Security Setup Verification${NC}"
echo "================================================"
echo ""

# Check if we're in the right directory
if [ ! -d "$SECRETS_DIR" ]; then
    echo -e "${RED}❌ Error: Must run from repository root${NC}"
    echo "   Current directory: $(pwd)"
    exit 1
fi

# Function to check file exists
check_file() {
    local file=$1
    local description=$2
    
    if [ -f "$file" ]; then
        echo -e "${GREEN}✅${NC} $description: $file"
        return 0
    else
        echo -e "${RED}❌${NC} $description: $file ${RED}NOT FOUND${NC}"
        ((ERRORS++))
        return 1
    fi
}

# Function to check file is git-ignored
check_gitignored() {
    local file=$1
    
    if git check-ignore -q "$file" 2>/dev/null; then
        echo -e "   ${GREEN}✅ Git-ignored${NC}"
        return 0
    else
        echo -e "   ${RED}⚠️  NOT git-ignored (should be!)${NC}"
        ((WARNINGS++))
        return 1
    fi
}

# Function to check file permissions
check_permissions() {
    local file=$1
    local perms=$(stat -c "%a" "$file" 2>/dev/null || stat -f "%p" "$file" 2>/dev/null | tail -c 4)
    
    if [ "$perms" = "600" ] || [ "$perms" = "0600" ]; then
        echo -e "   ${GREEN}✅ Permissions: 600 (secure)${NC}"
        return 0
    else
        echo -e "   ${YELLOW}⚠️  Permissions: $perms (should be 600)${NC}"
        echo -e "   ${YELLOW}   Fix with: chmod 600 $file${NC}"
        ((WARNINGS++))
        return 1
    fi
}

echo -e "${BLUE}📁 Checking Secrets Directory...${NC}"
echo "===================================="

# Check secrets directory exists
if [ ! -d "$SECRETS_DIR" ]; then
    echo -e "${RED}❌ Secrets directory not found: $SECRETS_DIR${NC}"
    ((ERRORS++))
else
    echo -e "${GREEN}✅ Secrets directory exists${NC}"
fi

echo ""

# Check each secret file
echo -e "${BLUE}🔑 Checking Secret Files...${NC}"
echo "============================"

secrets=("db_password" "redis_password" "n8n_encryption_key" "api_key")

for secret in "${secrets[@]}"; do
    echo ""
    echo -e "${BLUE}Checking: $secret${NC}"
    
    # Check if secret file exists
    if check_file "$SECRETS_DIR/$secret" "Secret file"; then
        check_gitignored "$SECRETS_DIR/$secret"
        check_permissions "$SECRETS_DIR/$secret"
        
        # Check if file is not empty
        if [ -s "$SECRETS_DIR/$secret" ]; then
            echo -e "   ${GREEN}✅ File has content${NC}"
        else
            echo -e "   ${YELLOW}⚠️  File is empty${NC}"
            ((WARNINGS++))
        fi
        
        # Check if it's different from example
        if [ -f "$SECRETS_DIR/${secret}.example" ]; then
            if ! diff -q "$SECRETS_DIR/$secret" "$SECRETS_DIR/${secret}.example" > /dev/null 2>&1; then
                echo -e "   ${GREEN}✅ Different from example (good!)${NC}"
            else
                echo -e "   ${YELLOW}⚠️  Same as example (change for production!)${NC}"
                ((WARNINGS++))
            fi
        fi
    fi
    
    # Check if example file exists
    check_file "$SECRETS_DIR/${secret}.example" "Example file" > /dev/null 2>&1 || true
done

echo ""
echo ""
echo -e "${BLUE}📄 Checking Configuration Files...${NC}"
echo "===================================="

# Check config files
configs=("app.dev.env" "app.prod.env")

for config in "${configs[@]}"; do
    echo ""
    check_file "$CONFIG_DIR/$config" "Config file"
done

echo ""
echo ""
echo -e "${BLUE}🐳 Checking Docker Compose Files...${NC}"
echo "======================================"

# Check docker compose files have secrets section
for compose_file in "infrastructure/docker/docker-compose.dev.yml" "docker-compose.db-dev.yml"; do
    echo ""
    echo -e "${BLUE}Checking: $compose_file${NC}"
    
    if [ -f "$compose_file" ]; then
        echo -e "${GREEN}✅ File exists${NC}"
        
        # Check if it has secrets section
        if grep -q "^secrets:" "$compose_file"; then
            echo -e "${GREEN}✅ Has secrets section${NC}"
        else
            echo -e "${YELLOW}⚠️  No secrets section found${NC}"
            ((WARNINGS++))
        fi
        
        # Check if it references config files
        if grep -q "env_file:" "$compose_file"; then
            echo -e "${GREEN}✅ Uses env_file${NC}"
        else
            echo -e "${YELLOW}⚠️  Doesn't use env_file${NC}"
            ((WARNINGS++))
        fi
    else
        echo -e "${RED}❌ File not found${NC}"
        ((ERRORS++))
    fi
done

echo ""
echo ""
echo -e "${BLUE}📚 Checking Documentation...${NC}"
echo "=============================="

docs=("docs/DOCKER_SECRETS_CONFIG.md" "docs/SECURITY_OVERHAUL.md" "infrastructure/docker/secrets/README.md")

for doc in "${docs[@]}"; do
    check_file "$doc" "Documentation"
done

echo ""
echo ""
echo "================================================"

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}✅ All checks passed! Security setup is complete.${NC}"
    echo ""
    echo "🚀 Ready to start services:"
    echo "   Development: cd infrastructure/docker && docker compose -f docker-compose.dev.yml up -d"
    echo "   Production:  cd infrastructure/docker && docker compose -f docker-compose.prod.yml up -d"
    exit 0
elif [ $ERRORS -eq 0 ]; then
    echo -e "${YELLOW}⚠️  Setup complete with $WARNINGS warning(s)${NC}"
    echo ""
    echo "Review warnings above. System will work but may not be fully secure."
    exit 0
else
    echo -e "${RED}❌ Found $ERRORS error(s) and $WARNINGS warning(s)${NC}"
    echo ""
    echo "Please fix errors before proceeding:"
    echo "1. Run: ./scripts/setup-secrets.sh"
    echo "2. Review: docs/DOCKER_SECRETS_CONFIG.md"
    exit 1
fi
