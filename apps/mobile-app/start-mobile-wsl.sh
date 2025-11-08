#!/bin/bash

# VPN Enterprise Mobile - WSL2-Friendly Startup Script
# This uses tunnel mode to bypass WSL2 networking issues

echo "╔════════════════════════════════════════════════════════════╗"
echo "║  🚀 VPN Enterprise Mobile - WSL2 Tunnel Mode Startup     ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

cd /home/mukulah/vpn-enterprise/apps/mobile-app

echo "📍 Current directory: $(pwd)"
echo ""

echo "🔧 Checking dependencies..."
if [ ! -d "node_modules" ]; then
    echo "⚠️  node_modules not found. Installing dependencies..."
    npm install
else
    echo "✅ Dependencies found"
fi

echo ""
echo "🌐 Starting Expo with TUNNEL mode (WSL2-friendly)..."
echo ""
echo "📱 This will create a public URL that works from anywhere!"
echo "⏱️  Initial tunnel connection may take 30-60 seconds..."
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "After 'Tunnel ready' appears:"
echo "  • Press 'a' to open in Android emulator"
echo "  • OR scan QR code with Expo Go on your phone"
echo "  • Wait for app to load (may take a few seconds)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

npx expo start --tunnel --clear
