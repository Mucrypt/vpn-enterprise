# VPN Enterprise - Quick Deploy Aliases
# Add to your ~/.bashrc or ~/.zshrc

# Quick deploy script
alias vpn-deploy='/home/mukulah/vpn-enterprise/scripts/deploy.sh'

# Quick commit and push (auto-deploy via CI)
alias vpn-push='git add . && git commit && git push'

# Watch latest deployment
alias vpn-watch='gh run watch --repo Mucrypt/vpn-enterprise'

# View deployment status
alias vpn-status='gh run list --repo Mucrypt/vpn-enterprise --limit 5'

# Trigger manual deployment
alias vpn-trigger='gh workflow run "Deploy to Hetzner (Docker Compose)" --repo Mucrypt/vpn-enterprise --ref main -f ref=main -f rebuild=true'

# SSH to production server
alias vpn-ssh='ssh root@157.180.123.240'

# View logs on server
alias vpn-logs='ssh root@157.180.123.240 "cd /opt/vpn-enterprise/infrastructure/docker && docker compose -f docker-compose.prod.yml logs -f"'

# Check container status on server
alias vpn-ps='ssh root@157.180.123.240 "cd /opt/vpn-enterprise/infrastructure/docker && docker compose -f docker-compose.prod.yml ps"'
