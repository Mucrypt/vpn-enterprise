#!/bin/bash
# ==============================================
# NEXUSAI 422 FIX - QUICK DEPLOYMENT CHECKLIST
# ==============================================

echo "╔════════════════════════════════════════════════════╗"
echo "║  NexusAI 422 Error Fix - Deployment Checklist     ║"
echo "╚════════════════════════════════════════════════════╝"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

check_item() {
    local status=$1
    local message=$2
    
    if [ "$status" == "true" ]; then
        echo -e "${GREEN}✓${NC} $message"
    else
        echo -e "${RED}✗${NC} $message"
    fi
}

# Pre-deployment checks
echo "📋 PRE-DEPLOYMENT CHECKS"
echo "------------------------"

# Check 1: OpenAI API Key
if [ -n "$OPENAI_API_KEY" ]; then
    KEY_LENGTH=${#OPENAI_API_KEY}
    check_item "true" "OpenAI API key set ($KEY_LENGTH characters)"
else
    check_item "false" "OpenAI API key NOT set"
    echo -e "${YELLOW}⚠${NC}  Run: export OPENAI_API_KEY='sk-proj-...'"
    exit 1
fi

# Check 2: SSH Access
if ssh -q root@157.180.123.240 exit 2>/dev/null; then
    check_item "true" "SSH access to production server"
else
    check_item "false" "Cannot connect to production server"
    exit 1
fi

# Check 3: Fix script exists
if [ -f "./fix-nexusai-422-error.sh" ]; then
    check_item "true" "Fix script found"
else
    check_item "false" "Fix script not found"
    exit 1
fi

# Check 4: Updated Python API code
if grep -q "min_length=3" flask/app_production.py 2>/dev/null; then
    check_item "true" "Python API validation rules updated"
else
    check_item "false" "Python API code not updated"
    exit 1
fi

echo ""
echo "✅ All pre-deployment checks passed!"
echo ""

# Deployment steps
echo "🚀 DEPLOYMENT STEPS"
echo "-------------------"
echo ""
echo "1. Review changes:"
echo "   git diff flask/app_production.py"
echo ""
echo "2. Run deployment script:"
echo "   ./fix-nexusai-422-error.sh"
echo ""
echo "3. Monitor logs:"
echo "   ssh root@157.180.123.240 'docker logs -f vpn-python-api'"
echo ""
echo "4. Test via UI:"
echo "   https://chatbuilds.com/nexusai"
echo ""
echo "5. Verify fix:"
echo "   curl -X POST https://chatbuilds.com/api/ai/generate/app \\"
echo "     -H 'Content-Type: application/json' \\"
echo "     -H 'X-API-Key: vpn_test' \\"
echo "     -d '{\"description\":\"App\",\"framework\":\"react\"}'"
echo ""

# Ask for confirmation
read -p "Ready to deploy? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo ""
    echo "❌ Deployment cancelled"
    exit 0
fi

echo ""
echo "🚀 Starting deployment..."
echo ""

# Run the fix script
./fix-nexusai-422-error.sh

echo ""
echo "╔════════════════════════════════════════════════════╗"
echo "║  ✅ Deployment Complete!                           ║"
echo "╚════════════════════════════════════════════════════╝"
echo ""
echo "📝 Next Steps:"
echo ""
echo "1. Test app generation:"
echo "   https://chatbuilds.com/nexusai"
echo ""
echo "2. Monitor for errors:"
echo "   ssh root@157.180.123.240 'docker logs -f vpn-python-api'"
echo ""
echo "3. Check validation error details if issues occur:"
echo "   ssh root@157.180.123.240 'docker logs vpn-python-api | grep \"Validation Error\"'"
echo ""
echo "📚 Full documentation:"
echo "   cat NEXUSAI_422_FIX_GUIDE.md"
echo ""
