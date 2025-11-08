#!/bin/bash

# VPN Enterprise Mobile - React Version Fix Script
# This completely cleans and reinstalls dependencies with correct React version

echo "╔════════════════════════════════════════════════════════════╗"
echo "║     🔧 Fixing React Version Mismatch - Complete Clean     ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

cd /home/mukulah/vpn-enterprise/apps/mobile-app

echo "1️⃣  Stopping any running Metro bundler..."
pkill -f "expo start" || true
pkill -f "react-native start" || true
echo "✅ Processes stopped"
echo ""

echo "2️⃣  Removing node_modules..."
rm -rf node_modules
echo "✅ node_modules deleted"
echo ""

echo "3️⃣  Removing package-lock.json..."
rm -f package-lock.json
echo "✅ package-lock.json deleted"
echo ""

echo "4️⃣  Clearing npm cache..."
npm cache clean --force
echo "✅ npm cache cleared"
echo ""

echo "5️⃣  Clearing Metro bundler cache..."
rm -rf .expo
rm -rf $HOME/.expo
npx expo start --clear &
sleep 2
pkill -f "expo start" || true
echo "✅ Metro cache cleared"
echo ""

echo "6️⃣  Clearing watchman cache..."
watchman watch-del-all 2>/dev/null || echo "⚠️  Watchman not installed (optional)"
echo ""

echo "7️⃣  Installing dependencies with EXACT React 19.1.0..."
npm install
echo ""

echo "8️⃣  Verifying React versions..."
echo ""
echo "📦 Installed versions:"
npm list react react-dom react-native 2>/dev/null | grep -E "react@|react-dom@|react-native@" || true
echo ""

echo "╔════════════════════════════════════════════════════════════╗"
echo "║                  ✅ CLEANUP COMPLETE!                      ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo "🚀 Now you can start the app:"
echo ""
echo "   ./start-mobile-wsl.sh"
echo ""
echo "   OR"
echo ""
echo "   npm run start:wsl"
echo ""
