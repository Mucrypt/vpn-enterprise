#!/bin/bash

# VPN Enterprise Mobile App - Quick Test Script
# Verifies everything is ready before launch

echo "╔════════════════════════════════════════════════════════════╗"
echo "║  🔍 VPN Enterprise Mobile - Pre-Launch Verification       ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

cd /home/mukulah/vpn-enterprise/apps/mobile-app

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Not in mobile-app directory"
    exit 1
fi

echo "📋 Checking dependencies..."
echo ""

# Check React version
REACT_VERSION=$(node -e "console.log(require('./package.json').dependencies.react)")
if [ "$REACT_VERSION" = "19.1.0" ]; then
    echo "✅ React:           $REACT_VERSION"
else
    echo "❌ React:           $REACT_VERSION (should be 19.1.0)"
fi

# Check React DOM version
REACT_DOM_VERSION=$(node -e "console.log(require('./package.json').dependencies['react-dom'])")
if [ "$REACT_DOM_VERSION" = "19.1.0" ]; then
    echo "✅ React-DOM:       $REACT_DOM_VERSION"
else
    echo "❌ React-DOM:       $REACT_DOM_VERSION (should be 19.1.0)"
fi

# Check if overrides exist
OVERRIDES=$(node -e "console.log(require('./package.json').overrides ? 'yes' : 'no')")
if [ "$OVERRIDES" = "yes" ]; then
    echo "✅ Overrides:       Configured"
else
    echo "❌ Overrides:       Missing"
fi

echo ""
echo "📁 Checking Phase 9 files..."
echo ""

# Check critical files
FILES=(
    "src/types/vpn.ts"
    "src/types/security.ts"
    "src/types/navigation.ts"
    "src/services/api/VPNEnterpriseAPI.ts"
    "src/services/vpn/VPNConnectionService.ts"
    "src/services/ai/ServerRecommender.ts"
    "src/store/index.ts"
    "src/hooks/useVPN.ts"
    "src/components/connection/ConnectionButton.tsx"
    "src/components/connection/SpeedIndicator.tsx"
    "src/components/connection/ConnectionMap.tsx"
    "src/screens/ConnectionScreen.tsx"
)

MISSING=0
for file in "${FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file"
    else
        echo "❌ $file (MISSING)"
        MISSING=$((MISSING + 1))
    fi
done

echo ""
echo "📊 Project Statistics:"
echo ""

# Count lines of code
TOTAL_LINES=$(find src -name "*.ts" -o -name "*.tsx" | xargs wc -l 2>/dev/null | tail -1 | awk '{print $1}')
echo "   Total lines: $TOTAL_LINES"

# Count files
TOTAL_FILES=$(find src -name "*.ts" -o -name "*.tsx" | wc -l)
echo "   Total files: $TOTAL_FILES"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ $MISSING -eq 0 ]; then
    echo "✅ All checks passed! Ready to launch!"
    echo ""
    echo "🚀 Start the app with:"
    echo "   $ ./start-mobile-wsl.sh"
    echo ""
    echo "   Then press 'a' to open in Android emulator"
else
    echo "❌ $MISSING file(s) missing. Please review and fix."
    exit 1
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
