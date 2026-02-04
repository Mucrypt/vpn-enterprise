#!/bin/bash

##############################################################################
# STRIPE MODE TOGGLE SCRIPT
# 
# A world-class utility to seamlessly switch between Stripe test and live modes
# Handles local development, production deployments, and Docker secrets
#
# Usage:
#   ./stripe-mode-toggle.sh [test|live|status|help]
#
# Author: VPN Enterprise Team
# Version: 1.0.0
##############################################################################

set -e  # Exit on error

# Color codes for beautiful output
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly BLUE='\033[0;34m'
readonly MAGENTA='\033[0;35m'
readonly CYAN='\033[0;36m'
readonly NC='\033[0m' # No Color
readonly BOLD='\033[1m'

# Script configuration
readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
readonly ENV_FILE="$PROJECT_ROOT/.env"
readonly BACKUP_DIR="$PROJECT_ROOT/.stripe-backups"

# Production server configuration
readonly PROD_SERVER="root@157.180.123.240"
readonly PROD_PATH="/opt/vpn-enterprise"
readonly PROD_SECRETS_PATH="$PROD_PATH/infrastructure/docker/secrets"
readonly PROD_COMPOSE_PATH="$PROD_PATH/infrastructure/docker"

# Stripe Keys Configuration
# IMPORTANT: Keys are loaded from .env file, not stored in this script
# This ensures GitHub push protection doesn't block commits
declare -A TEST_KEYS=(
    [SECRET]=""
    [PUBLISHABLE]=""
    [WEBHOOK]="whsec_test_YOUR_TEST_WEBHOOK_SECRET"
)

declare -A LIVE_KEYS=(
    [SECRET]=""
    [PUBLISHABLE]=""
    [WEBHOOK]="whsec_live_YOUR_LIVE_WEBHOOK_SECRET"
)

# Load keys from .env file
load_keys_from_env() {
    if [[ ! -f "$ENV_FILE" ]]; then
        print_error ".env file not found at $ENV_FILE"
        return 1
    fi
    
    # Extract current test keys
    TEST_KEYS[SECRET]=$(grep "^STRIPE_SECRET_KEY.*sk_test" "$ENV_FILE" | head -1 | cut -d'=' -f2- | tr -d '"' | tr -d "'" | xargs)
    TEST_KEYS[PUBLISHABLE]=$(grep "^NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY.*pk_test" "$ENV_FILE" | head -1 | cut -d'=' -f2- | tr -d '"' | tr -d "'" | xargs)
    
    # Extract current live keys  
    LIVE_KEYS[SECRET]=$(grep "^#.*STRIPE_SECRET_KEY.*sk_live" "$ENV_FILE" | head -1 | sed 's/^#//' | cut -d'=' -f2- | tr -d '"' | tr -d "'" | xargs)
    LIVE_KEYS[PUBLISHABLE]=$(grep "^#.*NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY.*pk_live" "$ENV_FILE" | head -1 | sed 's/^#//' | cut -d'=' -f2- | tr -d '"' | tr -d "'" | xargs)
    
    # If live keys aren't found in comments, try active lines (in case already in live mode)
    if [[ -z "${LIVE_KEYS[SECRET]}" ]]; then
        LIVE_KEYS[SECRET]=$(grep "^STRIPE_SECRET_KEY.*sk_live" "$ENV_FILE" | head -1 | cut -d'=' -f2- | tr -d '"' | tr -d "'" | xargs)
        LIVE_KEYS[PUBLISHABLE]=$(grep "^NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY.*pk_live" "$ENV_FILE" | head -1 | cut -d'=' -f2- | tr -d '"' | tr -d "'" | xargs)
    fi
}


##############################################################################
# UTILITY FUNCTIONS
##############################################################################

print_header() {
    echo -e "\n${BOLD}${MAGENTA}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BOLD}${MAGENTA}║${NC}  ${CYAN}🔄 STRIPE MODE TOGGLE${NC} - Professional Edition        ${BOLD}${MAGENTA}║${NC}"
    echo -e "${BOLD}${MAGENTA}╚════════════════════════════════════════════════════════════╝${NC}\n"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ ERROR: $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  WARNING: $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_step() {
    echo -e "\n${BOLD}${CYAN}▶ $1${NC}"
}

print_separator() {
    echo -e "${MAGENTA}────────────────────────────────────────────────────────────${NC}"
}

create_backup() {
    local mode=$1
    mkdir -p "$BACKUP_DIR"
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local backup_file="$BACKUP_DIR/env_backup_${mode}_${timestamp}.env"
    
    if [ -f "$ENV_FILE" ]; then
        cp "$ENV_FILE" "$backup_file"
        print_success "Backup created: $(basename "$backup_file")"
        return 0
    fi
    return 1
}

check_ssh_connection() {
    print_step "Checking SSH connection to production server..."
    if ssh -o ConnectTimeout=5 -o BatchMode=yes "$PROD_SERVER" exit 2>/dev/null; then
        print_success "SSH connection established"
        return 0
    else
        print_error "Cannot connect to production server"
        print_warning "Production deployment will be skipped"
        return 1
    fi
}

detect_current_mode() {
    if [ ! -f "$ENV_FILE" ]; then
        echo "unknown"
        return
    fi
    
    local secret_key=$(grep "^STRIPE_SECRET_KEY=" "$ENV_FILE" | head -1 | cut -d'=' -f2)
    
    if [[ $secret_key == sk_test_* ]]; then
        echo "test"
    elif [[ $secret_key == sk_live_* ]]; then
        echo "live"
    else
        echo "unknown"
    fi
}

show_status() {
    print_header
    print_step "Current Configuration Status"
    
    local current_mode=$(detect_current_mode)
    
    echo ""
    if [ "$current_mode" = "test" ]; then
        echo -e "Mode: ${YELLOW}${BOLD}TEST MODE${NC} 🧪"
        echo -e "Secret Key: ${TEST_KEYS[SECRET]:0:20}...${TEST_KEYS[SECRET]: -10}"
        echo -e "Publishable Key: ${TEST_KEYS[PUBLISHABLE]:0:20}...${TEST_KEYS[PUBLISHABLE]: -10}"
    elif [ "$current_mode" = "live" ]; then
        echo -e "Mode: ${GREEN}${BOLD}LIVE MODE${NC} 💰"
        echo -e "Secret Key: ${LIVE_KEYS[SECRET]:0:20}...${LIVE_KEYS[SECRET]: -10}"
        echo -e "Publishable Key: ${LIVE_KEYS[PUBLISHABLE]:0:20}...${LIVE_KEYS[PUBLISHABLE]: -10}"
    else
        echo -e "Mode: ${RED}${BOLD}UNKNOWN${NC} ❓"
        print_warning "Stripe keys not properly configured"
    fi
    
    print_separator
    
    # Check production server status
    if check_ssh_connection; then
        echo ""
        print_info "Checking production server configuration..."
        local prod_key=$(ssh "$PROD_SERVER" "grep '^NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=' $PROD_PATH/.env 2>/dev/null | cut -d'=' -f2" 2>/dev/null || echo "")
        
        if [[ $prod_key == pk_test_* ]]; then
            echo -e "Production Mode: ${YELLOW}${BOLD}TEST MODE${NC} 🧪"
        elif [[ $prod_key == pk_live_* ]]; then
            echo -e "Production Mode: ${GREEN}${BOLD}LIVE MODE${NC} 💰"
        else
            echo -e "Production Mode: ${RED}${BOLD}UNKNOWN${NC}"
        fi
    fi
    
    echo ""
    print_separator
    echo -e "\n${BOLD}Test Cards (when in test mode):${NC}"
    echo "  • 4242 4242 4242 4242 - Success"
    echo "  • 4000 0000 0000 0002 - Declined"
    echo "  • 4000 0025 0000 3155 - 3DS Authentication"
    echo ""
}

update_local_env() {
    local mode=$1
    print_step "Updating local .env file to $mode mode..."
    
    # Create backup
    create_backup "$mode"
    
    # Determine which keys to use
    local secret_key
    local publishable_key
    local webhook_secret
    
    if [ "$mode" = "test" ]; then
        secret_key="${TEST_KEYS[SECRET]}"
        publishable_key="${TEST_KEYS[PUBLISHABLE]}"
        webhook_secret="${TEST_KEYS[WEBHOOK]}"
    else
        secret_key="${LIVE_KEYS[SECRET]}"
        publishable_key="${LIVE_KEYS[PUBLISHABLE]}"
        webhook_secret="${LIVE_KEYS[WEBHOOK]}"
    fi
    
    # Update .env file
    if [ -f "$ENV_FILE" ]; then
        # Update STRIPE_SECRET_KEY
        sed -i.bak "s|^STRIPE_SECRET_KEY=.*|STRIPE_SECRET_KEY=$secret_key|g" "$ENV_FILE"
        
        # Update STRIPE_PUBLISHABLE_KEY
        sed -i.bak "s|^STRIPE_PUBLISHABLE_KEY=.*|STRIPE_PUBLISHABLE_KEY=$publishable_key|g" "$ENV_FILE"
        
        # Update STRIPE_WEBHOOK_SECRET
        sed -i.bak "s|^STRIPE_WEBHOOK_SECRET=.*|STRIPE_WEBHOOK_SECRET=$webhook_secret|g" "$ENV_FILE"
        
        # Update NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
        sed -i.bak "s|^NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=.*|NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=$publishable_key|g" "$ENV_FILE"
        
        # Remove backup file
        rm -f "${ENV_FILE}.bak"
        
        print_success "Local .env file updated to $mode mode"
    else
        print_error ".env file not found at $ENV_FILE"
        return 1
    fi
}

update_production() {
    local mode=$1
    print_step "Updating production server to $mode mode..."
    
    # Determine which keys to use
    local secret_key
    local publishable_key
    
    if [ "$mode" = "test" ]; then
        secret_key="${TEST_KEYS[SECRET]}"
        publishable_key="${TEST_KEYS[PUBLISHABLE]}"
    else
        secret_key="${LIVE_KEYS[SECRET]}"
        publishable_key="${LIVE_KEYS[PUBLISHABLE]}"
    fi
    
    # Update Docker secret
    print_info "Updating Docker secret file..."
    ssh "$PROD_SERVER" "echo -n '$secret_key' > $PROD_SECRETS_PATH/stripe_secret_key && chmod 644 $PROD_SECRETS_PATH/stripe_secret_key"
    print_success "Docker secret updated"
    
    # Update production .env
    print_info "Updating production .env file..."
    ssh "$PROD_SERVER" "sed -i 's|^NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=.*|NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=$publishable_key|g' $PROD_PATH/.env"
    print_success "Production .env updated"
    
    # Restart containers
    print_info "Restarting Docker containers..."
    ssh "$PROD_SERVER" "cd $PROD_COMPOSE_PATH && docker compose -f docker-compose.prod.yml up -d --force-recreate --no-deps api web"
    print_success "Containers restarted successfully"
    
    # Verify deployment
    sleep 3
    print_info "Verifying deployment..."
    local api_health=$(ssh "$PROD_SERVER" "docker logs vpn-api 2>&1 | grep -i 'stripe initialized' | tail -1" || echo "")
    
    if [ -n "$api_health" ]; then
        print_success "API initialized with Stripe successfully"
    else
        print_warning "Could not verify API initialization. Check logs manually."
    fi
}

switch_mode() {
    local target_mode=$1
    local current_mode=$(detect_current_mode)
    
    print_header
    
    # Validate mode
    if [ "$target_mode" != "test" ] && [ "$target_mode" != "live" ]; then
        print_error "Invalid mode: $target_mode"
        echo "Usage: $0 [test|live|status|help]"
        exit 1
    fi
    
    # Check if already in target mode
    if [ "$current_mode" = "$target_mode" ]; then
        print_warning "Already in $target_mode mode. Nothing to do."
        show_status
        exit 0
    fi
    
    # Confirmation prompt for live mode
    if [ "$target_mode" = "live" ]; then
        echo -e "${BOLD}${RED}⚠️  SWITCHING TO LIVE MODE ⚠️${NC}"
        echo -e "${YELLOW}This will use REAL Stripe keys and charge REAL money!${NC}"
        echo -e "\nAre you sure you want to continue? (type 'LIVE' to confirm)"
        read -r confirmation
        
        if [ "$confirmation" != "LIVE" ]; then
            print_warning "Operation cancelled"
            exit 0
        fi
    fi
    
    print_step "Switching from $current_mode mode to $target_mode mode"
    print_separator
    
    # Update local environment
    if ! update_local_env "$target_mode"; then
        print_error "Failed to update local environment"
        exit 1
    fi
    
    # Update production if SSH available
    if check_ssh_connection; then
        if ! update_production "$target_mode"; then
            print_error "Failed to update production environment"
            print_warning "Local environment was updated, but production update failed"
            exit 1
        fi
    else
        print_warning "Skipping production update (SSH not available)"
    fi
    
    # Success summary
    echo ""
    print_separator
    print_success "Successfully switched to $target_mode mode!"
    print_separator
    
    # Show instructions
    echo ""
    if [ "$target_mode" = "test" ]; then
        echo -e "${BOLD}Test Mode Active 🧪${NC}"
        echo ""
        echo "You can now test with these cards:"
        echo "  • 4242 4242 4242 4242 - Success"
        echo "  • 4000 0000 0000 0002 - Declined"
        echo "  • 4000 0025 0000 3155 - 3DS Authentication"
        echo ""
        echo "Access your test dashboard at: https://dashboard.stripe.com/test"
    else
        echo -e "${BOLD}${GREEN}Live Mode Active 💰${NC}"
        echo ""
        echo -e "${YELLOW}${BOLD}⚠️  IMPORTANT:${NC}"
        echo "  • All transactions will be REAL"
        echo "  • Real money will be charged/transferred"
        echo "  • Monitor your live dashboard: https://dashboard.stripe.com"
        echo ""
    fi
    
    echo ""
    print_info "Run './scripts/stripe-mode-toggle.sh status' to check current mode"
    echo ""
}

show_help() {
    print_header
    cat << EOF
${BOLD}USAGE:${NC}
    ./stripe-mode-toggle.sh [COMMAND]

${BOLD}COMMANDS:${NC}
    ${CYAN}test${NC}      Switch to Stripe test mode (safe for development)
    ${CYAN}live${NC}      Switch to Stripe live mode (REAL transactions!)
    ${CYAN}status${NC}    Show current Stripe configuration status
    ${CYAN}help${NC}      Display this help message

${BOLD}EXAMPLES:${NC}
    # Switch to test mode for development
    ./stripe-mode-toggle.sh test

    # Switch to live mode for production (requires confirmation)
    ./stripe-mode-toggle.sh live

    # Check current configuration
    ./stripe-mode-toggle.sh status

${BOLD}FEATURES:${NC}
    ✓ Automatic backups before changes
    ✓ Updates local .env file
    ✓ Updates production Docker secrets
    ✓ Updates production .env file
    ✓ Restarts production containers
    ✓ Verifies deployment
    ✓ Safe confirmation for live mode

${BOLD}CONFIGURATION:${NC}
    Local:      $ENV_FILE
    Production: $PROD_SERVER:$PROD_PATH/.env
    Secrets:    $PROD_SERVER:$PROD_SECRETS_PATH/
    Backups:    $BACKUP_DIR/

${BOLD}NOTES:${NC}
    • Backups are stored in .stripe-backups/
    • Production updates require SSH access to $PROD_SERVER
    • Live mode requires explicit confirmation (type 'LIVE')
    • All operations are logged with detailed output

EOF
}

##############################################################################
# MAIN EXECUTION
##############################################################################

main() {
    local command="${1:-help}"
    
    # Load Stripe keys from .env file (except for help command)
    if [[ "$command" != "help" && "$command" != "--help" && "$command" != "-h" ]]; then
        load_keys_from_env || {
            print_error "Failed to load Stripe keys from .env file"
            exit 1
        }
    fi
    
    case "$command" in
        test)
            switch_mode "test"
            ;;
        live)
            switch_mode "live"
            ;;
        status)
            show_status
            ;;
        help|--help|-h)
            show_help
            ;;
        *)
            print_header
            print_error "Unknown command: $command"
            echo ""
            show_help
            exit 1
            ;;
    esac
}

# Run main function
main "$@"
