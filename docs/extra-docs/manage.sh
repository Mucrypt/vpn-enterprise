#!/bin/bash
# VPN Enterprise Platform Manager
# Complete management script for your self-hosted cloud platform

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Configuration
COMPOSE_FILE="$SCRIPT_DIR/docker-compose.yml"
ENV_FILE="$SCRIPT_DIR/.env"

show_banner() {
    echo -e "${BLUE}"
    echo "██╗   ██╗██████╗ ███╗   ██╗    ███████╗███╗   ██╗████████╗███████╗██████╗ ██████╗ ██████╗ ██╗███████╗███████╗"
    echo "██║   ██║██╔══██╗████╗  ██║    ██╔════╝████╗  ██║╚══██╔══╝██╔════╝██╔══██╗██╔══██╗██╔══██╗██║██╔════╝██╔════╝"
    echo "██║   ██║██████╔╝██╔██╗ ██║    █████╗  ██╔██╗ ██║   ██║   █████╗  ██████╔╝██████╔╝██████╔╝██║███████╗█████╗  "
    echo "╚██╗ ██╔╝██╔═══╝ ██║╚██╗██║    ██╔══╝  ██║╚██╗██║   ██║   ██╔══╝  ██╔══██╗██╔═══╝ ██╔══██╗██║╚════██║██╔══╝  "
    echo " ╚████╔╝ ██║     ██║ ╚████║    ███████╗██║ ╚████║   ██║   ███████╗██║  ██║██║     ██║  ██║██║███████║███████╗"
    echo "  ╚═══╝  ╚═╝     ╚═╝  ╚═══╝    ╚══════╝╚═╝  ╚═══╝   ╚═╝   ╚══════╝╚═╝  ╚═╝╚═╝     ╚═╝  ╚═╝╚═╝╚══════╝╚══════╝"
    echo -e "${NC}"
    echo -e "${CYAN}Self-Hosted Cloud Infrastructure Platform${NC}"
    echo -e "${YELLOW}═══════════════════════════════════════════════════════════════════════════════════════════════════════════════${NC}"
    echo ""
}

show_usage() {
    echo -e "${BLUE}Usage: $0 [COMMAND]${NC}"
    echo ""
    echo -e "${YELLOW}Platform Management:${NC}"
    echo -e "  ${GREEN}start${NC}           Start the entire platform"
    echo -e "  ${GREEN}stop${NC}            Stop all services"
    echo -e "  ${GREEN}restart${NC}         Restart all services"
    echo -e "  ${GREEN}status${NC}          Show service status"
    echo -e "  ${GREEN}logs${NC}            Show platform logs"
    echo -e "  ${GREEN}health${NC}          Health check for all services"
    echo ""
    echo -e "${YELLOW}Development:${NC}"
    echo -e "  ${GREEN}dev${NC}             Start in development mode"
    echo -e "  ${GREEN}build${NC}           Build all services"
    echo -e "  ${GREEN}clean${NC}           Clean up containers and volumes"
    echo ""
    echo -e "${YELLOW}Database Management:${NC}"
    echo -e "  ${GREEN}db-backup${NC}       Create database backup"
    echo -e "  ${GREEN}db-restore${NC}      Restore database from backup"
    echo -e "  ${GREEN}db-migrate${NC}      Run database migrations"
    echo -e "  ${GREEN}db-shell${NC}        Open database shell"
    echo ""
    echo -e "${YELLOW}Monitoring:${NC}"
    echo -e "  ${GREEN}monitor${NC}         Open monitoring dashboard"
    echo -e "  ${GREEN}metrics${NC}         Show system metrics"
    echo -e "  ${GREEN}alerts${NC}          Check system alerts"
    echo ""
    echo -e "${YELLOW}Maintenance:${NC}"
    echo -e "  ${GREEN}update${NC}          Update all services"
    echo -e "  ${GREEN}scale${NC}           Scale services up/down"
    echo -e "  ${GREEN}setup${NC}           Initial platform setup"
    echo ""
}

log_step() {
    echo -e "${BLUE}[$(date +'%H:%M:%S')] $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

check_requirements() {
    log_step "Checking system requirements..."
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    # Check Docker Compose
    if ! docker compose version &> /dev/null; then
        log_error "Docker Compose is not installed or not the right version."
        exit 1
    fi
    
    # Check environment file
    if [ ! -f "$ENV_FILE" ]; then
        log_warning "Environment file not found. Creating from example..."
        cp "$SCRIPT_DIR/.env.example" "$ENV_FILE"
        log_error "Please edit $ENV_FILE with your configuration before continuing"
        exit 1
    fi
    
    log_success "Requirements check passed"
}

platform_start() {
    log_step "Starting VPN Enterprise Platform..."
    
    # Start services in dependency order
    docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d postgres redis minio
    
    # Wait for databases to be ready
    log_step "Waiting for databases to be ready..."
    sleep 10
    
    # Start application services
    docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d vpn-api worker
    
    # Wait for API to be ready
    log_step "Waiting for API to be ready..."
    sleep 15
    
    # Start web dashboard and other services
    docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d
    
    log_success "Platform started successfully!"
    
    # Show access information
    echo ""
    echo -e "${CYAN}🌐 Platform Access URLs:${NC}"
    echo -e "  Dashboard:    ${GREEN}http://localhost:3001${NC}"
    echo -e "  API:          ${GREEN}http://localhost:3000${NC}"
    echo -e "  MinIO:        ${GREEN}http://localhost:9001${NC}"
    echo -e "  Grafana:      ${GREEN}http://localhost:3003${NC}"
    echo -e "  Prometheus:   ${GREEN}http://localhost:9090${NC}"
    echo -e "  Kibana:       ${GREEN}http://localhost:5601${NC}"
    echo ""
}

platform_stop() {
    log_step "Stopping VPN Enterprise Platform..."
    docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" down
    log_success "Platform stopped"
}

platform_restart() {
    platform_stop
    platform_start
}

platform_status() {
    echo -e "${BLUE}🔍 Platform Status${NC}"
    echo "=================="
    docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" ps
    echo ""
    
    echo -e "${BLUE}📊 Resource Usage${NC}"
    echo "=================="
    docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}\t{{.BlockIO}}"
}

platform_logs() {
    service=${2:-}
    if [ -n "$service" ]; then
        docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" logs -f "$service"
    else
        docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" logs -f
    fi
}

platform_health() {
    log_step "Running platform health check..."
    
    services=("postgres" "redis" "minio" "vpn-api" "vpn-web" "prometheus" "grafana")
    
    for service in "${services[@]}"; do
        if docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" ps "$service" | grep -q "Up"; then
            log_success "$service is running"
        else
            log_error "$service is not running"
        fi
    done
    
    # Check API health endpoint
    if curl -sf http://localhost:3000/health > /dev/null; then
        log_success "API health check passed"
    else
        log_error "API health check failed"
    fi
    
    # Check web dashboard
    if curl -sf http://localhost:3001 > /dev/null; then
        log_success "Web dashboard accessible"
    else
        log_error "Web dashboard not accessible"
    fi
}

platform_dev() {
    log_step "Starting platform in development mode..."
    
    # Override with development compose file if it exists
    dev_compose="$SCRIPT_DIR/docker-compose.dev.yml"
    if [ -f "$dev_compose" ]; then
        docker compose -f "$COMPOSE_FILE" -f "$dev_compose" --env-file "$ENV_FILE" up -d
    else
        # Start with volume mounts for live development
        docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d
    fi
    
    log_success "Development environment started"
}

platform_build() {
    log_step "Building platform services..."
    docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" build --no-cache
    log_success "Build completed"
}

platform_clean() {
    log_warning "This will remove all containers, networks, and unnamed volumes."
    read -p "Are you sure? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        log_step "Cleaning up platform..."
        docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" down -v --remove-orphans
        docker system prune -f
        log_success "Cleanup completed"
    fi
}

db_backup() {
    log_step "Creating database backup..."
    backup_file="vpn-enterprise-backup-$(date +%Y%m%d-%H%M%S).sql"
    
    docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" exec postgres pg_dump -U vpn_enterprise_user vpn_enterprise > "$SCRIPT_DIR/backups/$backup_file"
    
    log_success "Backup created: $backup_file"
}

db_restore() {
    backup_file=$2
    if [ -z "$backup_file" ]; then
        log_error "Please specify backup file: $0 db-restore <backup_file>"
        exit 1
    fi
    
    if [ ! -f "$SCRIPT_DIR/backups/$backup_file" ]; then
        log_error "Backup file not found: $backup_file"
        exit 1
    fi
    
    log_warning "This will overwrite the current database."
    read -p "Continue? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        log_step "Restoring database from $backup_file..."
        docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" exec -T postgres psql -U vpn_enterprise_user -d vpn_enterprise < "$SCRIPT_DIR/backups/$backup_file"
        log_success "Database restored"
    fi
}

db_migrate() {
    log_step "Running database migrations..."
    
    # Check if migrations directory exists
    if [ -d "$PROJECT_ROOT/packages/database/migrations" ]; then
        for migration in "$PROJECT_ROOT/packages/database/migrations"/*.sql; do
            if [ -f "$migration" ]; then
                log_step "Running $(basename "$migration")..."
                docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" exec -T postgres psql -U vpn_enterprise_user -d vpn_enterprise < "$migration"
            fi
        done
        log_success "Migrations completed"
    else
        log_warning "No migrations directory found"
    fi
}

db_shell() {
    log_step "Opening database shell..."
    docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" exec postgres psql -U vpn_enterprise_user -d vpn_enterprise
}

platform_monitor() {
    echo -e "${BLUE}🖥️  Opening monitoring dashboards...${NC}"
    
    if command -v xdg-open &> /dev/null; then
        xdg-open "http://localhost:3003"  # Grafana
        xdg-open "http://localhost:9090"  # Prometheus
        xdg-open "http://localhost:5601"  # Kibana
    elif command -v open &> /dev/null; then
        open "http://localhost:3003"
        open "http://localhost:9090" 
        open "http://localhost:5601"
    else
        echo "Please open the following URLs in your browser:"
        echo "  Grafana:    http://localhost:3003"
        echo "  Prometheus: http://localhost:9090"
        echo "  Kibana:     http://localhost:5601"
    fi
}

platform_metrics() {
    echo -e "${BLUE}📊 System Metrics${NC}"
    echo "================"
    
    # Docker stats
    echo -e "${YELLOW}Container Resources:${NC}"
    docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}\t{{.BlockIO}}"
    
    echo ""
    echo -e "${YELLOW}System Resources:${NC}"
    
    # System CPU
    echo -n "CPU Usage: "
    top -bn1 | grep "Cpu(s)" | awk '{print $2}' | sed 's/%us,//'
    
    # System Memory
    echo -n "Memory Usage: "
    free -h | grep ^Mem | awk '{printf "%.1f%% (%s/%s)\n", $3/$2*100, $3, $2}'
    
    # Disk Usage
    echo -n "Disk Usage: "
    df -h / | tail -1 | awk '{printf "%s (%s available)\n", $5, $4}'
}

platform_update() {
    log_step "Updating platform services..."
    
    # Pull latest images
    docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" pull
    
    # Restart services with new images
    docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d
    
    log_success "Platform updated"
}

platform_scale() {
    service=$2
    replicas=$3
    
    if [ -z "$service" ] || [ -z "$replicas" ]; then
        log_error "Usage: $0 scale <service> <replicas>"
        exit 1
    fi
    
    log_step "Scaling $service to $replicas replicas..."
    docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d --scale "$service=$replicas"
    log_success "Service scaled"
}

platform_setup() {
    log_step "Running initial platform setup..."
    
    # Create necessary directories
    mkdir -p "$SCRIPT_DIR/backups"
    mkdir -p "$SCRIPT_DIR/ssl"
    mkdir -p "$SCRIPT_DIR/config"
    mkdir -p "$SCRIPT_DIR/monitoring"
    mkdir -p "$SCRIPT_DIR/nginx/sites"
    
    # Generate SSL certificates (self-signed for development)
    if [ ! -f "$SCRIPT_DIR/ssl/vpn-enterprise.crt" ]; then
        log_step "Generating SSL certificates..."
        openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
            -keyout "$SCRIPT_DIR/ssl/vpn-enterprise.key" \
            -out "$SCRIPT_DIR/ssl/vpn-enterprise.crt" \
            -subj "/C=US/ST=State/L=City/O=VPN-Enterprise/CN=vpn-enterprise.local"
        log_success "SSL certificates generated"
    fi
    
    # Create monitoring configuration
    if [ ! -f "$SCRIPT_DIR/monitoring/prometheus.yml" ]; then
        cat > "$SCRIPT_DIR/monitoring/prometheus.yml" << 'EOF'
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'vpn-enterprise-api'
    static_configs:
      - targets: ['vpn-api:3000']
  
  - job_name: 'postgres'
    static_configs:
      - targets: ['postgres:5432']
  
  - job_name: 'redis'
    static_configs:
      - targets: ['redis:6379']
EOF
        log_success "Monitoring configuration created"
    fi
    
    log_success "Initial setup completed"
}

# Main command handler
main() {
    show_banner
    
    if [ $# -eq 0 ]; then
        show_usage
        exit 0
    fi
    
    check_requirements
    
    case "$1" in
        start)          platform_start ;;
        stop)           platform_stop ;;
        restart)        platform_restart ;;
        status)         platform_status ;;
        logs)           platform_logs "$@" ;;
        health)         platform_health ;;
        dev)            platform_dev ;;
        build)          platform_build ;;
        clean)          platform_clean ;;
        db-backup)      db_backup ;;
        db-restore)     db_restore "$@" ;;
        db-migrate)     db_migrate ;;
        db-shell)       db_shell ;;
        monitor)        platform_monitor ;;
        metrics)        platform_metrics ;;
        update)         platform_update ;;
        scale)          platform_scale "$@" ;;
        setup)          platform_setup ;;
        *)
            log_error "Unknown command: $1"
            show_usage
            exit 1
            ;;
    esac
}

main "$@"