#!/bin/bash

# VPN Enterprise Quick Start Script
# This script helps you get started quickly

echo "╔════════════════════════════════════════════════════════╗"
echo "║       🔐 VPN ENTERPRISE - QUICK START SCRIPT         ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "❌ .env file not found!"
    echo "📝 Creating .env from template..."
    cp .env.example .env
    echo "✅ .env created!"
    echo ""
    echo "⚠️  IMPORTANT: Edit .env with your Supabase credentials:"
    echo "   nano .env"
    echo ""
    echo "You need to add:"
    echo "  - SUPABASE_URL"
    echo "  - SUPABASE_ANON_KEY"
    echo "  - SUPABASE_SERVICE_ROLE_KEY"
    echo ""
    read -p "Press Enter when you've updated .env..."
fi

# Check if Supabase credentials are set
if grep -q "your-project.supabase.co" .env; then
    echo "⚠️  WARNING: You haven't updated your Supabase credentials in .env"
    echo "Please update the following in .env:"
    echo "  - SUPABASE_URL"
    echo "  - SUPABASE_ANON_KEY"
    echo "  - SUPABASE_SERVICE_ROLE_KEY"
    echo ""
    read -p "Press Enter to continue anyway or Ctrl+C to exit..."
fi

echo "📦 Installing dependencies..."
npm install

echo ""
echo "✅ Dependencies installed!"
echo ""
echo "════════════════════════════════════════════════════════"
echo "Next steps:"
echo "════════════════════════════════════════════════════════"
echo ""
echo "1. Set up your Supabase database:"
echo "   - Go to https://supabase.com"
echo "   - Create a project"
echo "   - Run packages/database/schema.sql in SQL Editor"
echo ""
echo "2. Update .env with your Supabase credentials"
echo ""
echo "3. Start the API server:"
echo "   cd packages/api"
echo "   npm run dev"
echo ""
echo "4. Test the API:"
echo "   curl http://localhost:3000/health"
echo ""
echo "════════════════════════════════════════════════════════"
echo "📚 Documentation:"
echo "════════════════════════════════════════════════════════"
echo "   - README.md - Project overview"
echo "   - SETUP_GUIDE.md - Detailed setup instructions"
echo "   - docs/api/API_DOCUMENTATION.md - API reference"
echo "   - IMPLEMENTATION_SUMMARY.md - What was built"
echo ""
echo "🎉 Ready to build your VPN enterprise!"
echo ""
