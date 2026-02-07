#!/bin/bash
# Demo: How to use the new deployment workflow

echo "🎯 Deployment Workflow Demo"
echo "=============================="
echo ""

echo "📝 Scenario 1: Deploy a new feature"
echo "-----------------------------------"
echo "$ npm run deploy \"feat: add user analytics dashboard\""
echo ""
echo "What happens:"
echo "  ✓ Commits all your changes"
echo "  ✓ Pushes to GitHub"
echo "  ✓ Watches CI pipeline (lint → test → build)"
echo "  ✓ Watches deployment to production"
echo "  ✓ Runs health checks"
echo "  ✓ Shows live URL"
echo ""
echo "Time: ~5-7 minutes total"
echo ""

echo "⚡ Scenario 2: Quick fix (auto mode)"
echo "------------------------------------"
echo "$ npm run deploy:auto \"fix: correct API timeout\""
echo ""
echo "What happens:"
echo "  ✓ Same as above, but NO prompts!"
echo "  ✓ Perfect for fast iterations"
echo "  ✓ Fully automated"
echo ""
echo "Time: ~5-7 minutes (no waiting for input)"
echo ""

echo "🔧 Scenario 3: Interactive mode"
echo "--------------------------------"
echo "$ npm run deploy"
echo ""
echo "What happens:"
echo "  ? Enter commit message: _"
echo "  ? Watch CI progress? (Y/n): y"
echo "  ? Watch deployment? (Y/n): y"
echo "  ? Run health checks? (Y/n): y"
echo ""

echo "📊 Example Output:"
echo "------------------"
cat << 'DEMO'

╔══════════════════════════════════════════════╗
║   VPN Enterprise - Production Deployment    ║
╚══════════════════════════════════════════════╝

🔍 Step 1/5: Pre-flight Checks
✅ Pre-flight checks passed

🔄 Step 2/5: Commit & Push Changes
📝 Uncommitted changes detected:
 M apps/web-dashboard/app/admin/page.tsx
 M packages/api/src/routes/admin/users.ts

Using commit message: feat: add user analytics dashboard
✅ Changes committed: feat: add user analytics dashboard
⬆️  Pushing to GitHub...
✅ Code pushed to GitHub

🚀 Step 3/5: Monitor CI/CD Pipeline
✅ CI workflow detected
🔗 https://github.com/Mucrypt/vpn-enterprise/actions/runs/123456
👀 Watching CI pipeline...
✓ lint (api) in 48s
✓ lint (web) in 1m6s
✓ test (api) in 53s
✓ test (web) in 44s
✓ build (api) in 1m23s
✓ build (web) in 16s
✅ CI passed successfully!

🚀 Step 4/5: Monitor Production Deployment
✅ Deployment workflow detected
🔗 https://github.com/Mucrypt/vpn-enterprise/actions/runs/123457
👀 Watching deployment to 157.180.123.240...
✅ Deployment completed successfully!

🔍 Step 5/5: Verify Deployment
⏳ Waiting for services to stabilize...
🏥 Running health checks...

  API:           ✅ Healthy
  Web:           ✅ Healthy
  NexusAI:       ✅ Healthy

✅ All critical services are healthy!

═══════════════════════════════════════════════
🎉 Deployment Workflow Complete!
═══════════════════════════════════════════════

📊 Summary:
   • Branch:    main
   • Server:    157.180.123.240
   • Live Site: https://chatbuilds.com
   • Changes:   feat: add user analytics dashboard

🔧 Quick Commands:
   • Logs:     npm run hetzner:logs
   • Status:   npm run hetzner:status
   • Actions:  https://github.com/Mucrypt/vpn-enterprise/actions

✨ Your feature is now live!

DEMO

echo ""
echo "✅ That's how simple it is!"
echo ""
echo "Try it now:"
echo "  1. Make some changes to your code"
echo "  2. Run: npm run deploy \"feat: your new feature\""
echo "  3. Watch it deploy automatically!"
echo ""
