# GitHub Actions Deployment Setup

## ✅ Fixed Issues

### 1. Environment Configuration Errors

**Issue:** GitHub Actions was failing validation on `environment:` blocks for development, staging, and production.

**Solution:** Removed environment blocks from jobs. You can re-add them once you configure environments in GitHub repository settings.

**To re-enable environment protection (optional):**

1. Go to: `Settings` → `Environments` in your GitHub repository
2. Create environments: `development`, `staging`, `production`
3. Configure protection rules, reviewers, and secrets per environment
4. Uncomment the environment blocks in the workflow file

### 2. Slack Webhook Parameter

**Issue:** The Slack notification action was using `webhook_url` instead of `webhook`.

**Solution:** Changed all Slack notification steps to use the correct `webhook` parameter.

### 3. Secret Warnings

**Issue:** GitHub Actions validator warns about potentially missing secrets.

**Solution:** These are just warnings. You need to ensure these secrets exist in your repository settings.

---

## 🔐 Required Secrets

Add these secrets in: `Settings` → `Secrets and variables` → `Actions` → `New repository secret`

### Development Environment

- `DEV_DEPLOY_HOST` - Hetzner server IP/hostname for dev environment
- `DEV_DEPLOY_USER` - SSH username for dev server
- `DEV_DEPLOY_SSH_KEY` - Private SSH key for dev server authentication

### Staging Environment

- `STAGING_DEPLOY_HOST` - Hetzner server IP/hostname for staging
- `STAGING_DEPLOY_USER` - SSH username for staging server
- `STAGING_DEPLOY_SSH_KEY` - Private SSH key for staging server

### Production Environment

- `PROD_DEPLOY_HOST` - Your Hetzner production server IP/hostname
- `PROD_DEPLOY_USER` - SSH username for production server
- `PROD_DEPLOY_SSH_KEY` - Private SSH key for production server

### General Secrets

- `SLACK_WEBHOOK` - Slack webhook URL for deployment notifications (optional, remove Slack steps if not needed)

---

## 📋 How to Get Secret Values

### SSH Credentials for Hetzner

1. **Get Server IP:**

   ```bash
   # From your Hetzner Cloud console or CLI
   hcloud server list
   ```

2. **Create SSH Key (if not exists):**

   ```bash
   ssh-keygen -t ed25519 -C "github-actions-deployment" -f ~/.ssh/github_deploy
   ```

3. **Add Public Key to Server:**

   ```bash
   ssh-copy-id -i ~/.ssh/github_deploy.pub root@your-server-ip
   ```

4. **Get Private Key for GitHub Secret:**
   ```bash
   cat ~/.ssh/github_deploy
   ```
   Copy the entire output (including `-----BEGIN OPENSSH PRIVATE KEY-----` and `-----END OPENSSH PRIVATE KEY-----`)

### Slack Webhook (Optional)

1. Go to: https://api.slack.com/apps
2. Create a new app or select existing
3. Navigate to: `Incoming Webhooks`
4. Activate incoming webhooks
5. Add webhook to workspace
6. Copy the webhook URL

---

## 🚀 Usage

### Deploy to Development

```bash
# Via GitHub UI: Actions → Deploy to Environment → Run workflow
# Select: development, services: all, version: latest
```

### Deploy to Staging

```bash
# Select: staging, services: all, version: latest
```

### Deploy to Production

```bash
# Select: production, services: all, version: latest
```

### Rollback

```bash
# Select environment, check "rollback" option
```

---

## 🔧 Current Server Paths

Based on the workflow configuration:

- **Development:** `/opt/vpn-enterprise-dev`
- **Staging:** `/opt/vpn-enterprise-staging`
- **Production:** `/opt/vpn-enterprise`

Ensure these directories exist on your Hetzner servers and contain the repository code.

---

## ✅ Validation Checklist

Before running the workflow:

- [ ] All required secrets are added to GitHub repository
- [ ] SSH access works from local machine to all servers
- [ ] Repository is cloned on all target servers at correct paths
- [ ] Docker and Docker Compose are installed on all servers
- [ ] Slack webhook is configured (or remove Slack notification steps)
- [ ] Firewall allows GitHub Actions IPs (or use self-hosted runners)

---

## 🐛 Troubleshooting

### "Permission denied (publickey)"

- Verify SSH key is added as a GitHub secret correctly
- Ensure public key is in `~/.ssh/authorized_keys` on server
- Check SSH user has correct permissions

### "Connection timeout"

- Verify server IP/hostname is correct
- Check firewall rules allow incoming SSH
- Consider using self-hosted GitHub Actions runner on your network

### "Image not found"

- Ensure Docker images are built and pushed to `ghcr.io`
- Check image tags match the version specified
- Verify GitHub Container Registry authentication

### Slack notifications not working

- Verify webhook URL is correct
- Test webhook manually: `curl -X POST -H 'Content-type: application/json' --data '{"text":"Test"}' YOUR_WEBHOOK_URL`
- Or remove Slack notification steps if not needed

---

## 📚 Additional Resources

- [GitHub Actions Environments](https://docs.github.com/en/actions/deployment/targeting-different-environments/using-environments-for-deployment)
- [GitHub Actions Secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [SSH Action Documentation](https://github.com/appleboy/ssh-action)
- [Slack Incoming Webhooks](https://api.slack.com/messaging/webhooks)
