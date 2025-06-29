#!/bin/bash

# FastTrack Simplified Deployment Script
set -e

echo "🚀 Starting FastTrack deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
APP_NAME="fasttrack-app"
IMAGE_NAME="fasttrack"
CONTAINER_NAME="fasttrack-app"
PORT=${PORT:-3004}
DATA_VOLUME="fasttrack-data"

# Functions
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
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

# Check if Docker is running
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        log_error "Docker is not running. Please start Docker and try again."
        exit 1
    fi
    log_success "Docker is running"
}

# Check if docker-compose is available
check_compose() {
    if command -v docker-compose > /dev/null 2>&1; then
        COMPOSE_CMD="docker-compose"
    elif docker compose version > /dev/null 2>&1; then
        COMPOSE_CMD="docker compose"
    else
        log_error "Docker Compose is not available. Please install Docker Compose."
        exit 1
    fi
    log_success "Docker Compose is available: $COMPOSE_CMD"
}

# Backup existing data
backup_data() {
    if docker volume inspect $DATA_VOLUME > /dev/null 2>&1; then
        log_info "Creating backup of existing data..."
        local backup_file="fasttrack-backup-$(date +%Y%m%d-%H%M%S).tar.gz"
        docker run --rm -v $DATA_VOLUME:/data -v $(pwd):/backup alpine tar czf /backup/$backup_file /data 2>/dev/null || true
        if [ -f "$backup_file" ]; then
            log_success "Backup created: $backup_file"
        else
            log_info "No existing data to backup"
        fi
    fi
}

# Deploy using docker-compose
deploy() {
    log_info "Deploying FastTrack with persistent data..."
    
    # Stop existing containers
    $COMPOSE_CMD down || true
    
    # Build and start services
    $COMPOSE_CMD up -d --build
    
    log_success "Deployment completed"
}

# Wait for application to be healthy
wait_for_health() {
    log_info "Waiting for application to be healthy..."
    local max_attempts=60
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if curl -f http://localhost:$PORT/health > /dev/null 2>&1; then
            log_success "Application is healthy!"
            return 0
        fi
        
        if [ $((attempt % 10)) -eq 0 ]; then
            log_info "Attempt $attempt/$max_attempts - checking logs..."
            $COMPOSE_CMD logs --tail 10 fasttrack
        fi
        
        log_info "Attempt $attempt/$max_attempts - waiting for health check..."
        sleep 2
        ((attempt++))
    done
    
    log_warning "Health check timeout, checking container status..."
    $COMPOSE_CMD logs --tail 20 fasttrack
    return 0
}

# Show deployment info
show_info() {
    echo ""
    echo "🎉 FastTrack has been deployed successfully!"
    echo ""
    echo "📋 Deployment Information:"
    echo "   • Application URL: http://localhost:$PORT"
    echo "   • Container Name: $CONTAINER_NAME"
    echo "   • Data Volume: $DATA_VOLUME"
    echo "   • Health Check: http://localhost:$PORT/health"
    echo ""
    echo "💾 Data Persistence:"
    echo "   • All user data is stored in Docker volume: $DATA_VOLUME"
    echo "   • Data survives container restarts and updates"
    echo "   • Automatic backups created before deployments"
    echo ""
    echo "🔧 Management Commands:"
    echo "   • View logs: $COMPOSE_CMD logs -f fasttrack"
    echo "   • Stop app: $COMPOSE_CMD down"
    echo "   • Start app: $COMPOSE_CMD up -d"
    echo "   • Restart app: $COMPOSE_CMD restart fasttrack"
    echo "   • Update app: $COMPOSE_CMD up -d --build"
    echo ""
    echo "📊 Container Status:"
    $COMPOSE_CMD ps
    echo ""
    echo "🌐 Access from other devices:"
    echo "   • Find your server IP: hostname -I | awk '{print \$1}'"
    echo "   • Access from network: http://YOUR_SERVER_IP:$PORT"
    echo ""
    echo "🔍 Troubleshooting:"
    echo "   • Check logs: $COMPOSE_CMD logs fasttrack"
    echo "   • Check health: curl http://localhost:$PORT/health"
    echo "   • Restart services: $COMPOSE_CMD restart"
    echo ""
}

# Main deployment process
main() {
    log_info "FastTrack Simplified Deployment Script v2.0"
    echo ""
    
    check_docker
    check_compose
    backup_data
    deploy
    wait_for_health
    show_info
    
    log_success "Deployment completed! 🎉"
    log_info "Access your application at: http://localhost:$PORT"
}

# Handle script arguments
case "${1:-}" in
    "up"|"start")
        check_docker
        check_compose
        $COMPOSE_CMD up -d
        wait_for_health
        show_info
        ;;
    "down"|"stop")
        check_compose
        $COMPOSE_CMD down
        log_success "Application stopped"
        ;;
    "restart")
        check_compose
        $COMPOSE_CMD restart
        wait_for_health
        log_success "Application restarted"
        ;;
    "logs")
        check_compose
        $COMPOSE_CMD logs -f fasttrack
        ;;
    "status")
        check_compose
        echo "Container Status:"
        $COMPOSE_CMD ps
        echo ""
        echo "Recent Logs:"
        $COMPOSE_CMD logs --tail 20 fasttrack
        ;;
    "update")
        check_docker
        check_compose
        backup_data
        $COMPOSE_CMD up -d --build
        wait_for_health
        log_success "Application updated"
        ;;
    "backup")
        backup_data
        ;;
    "clean")
        check_compose
        $COMPOSE_CMD down
        docker system prune -f
        log_warning "Note: Data volume $DATA_VOLUME was preserved"
        log_success "Cleanup completed"
        ;;
    "reset")
        check_compose
        read -p "⚠️  This will delete ALL data. Are you sure? (yes/no): " confirm
        if [ "$confirm" = "yes" ]; then
            $COMPOSE_CMD down -v
            docker system prune -f
            log_warning "All data has been deleted!"
            log_success "Complete reset completed"
        else
            log_info "Reset cancelled"
        fi
        ;;
    "help")
        echo "FastTrack Deployment Commands:"
        echo ""
        echo "  ./deploy.sh              - Full deployment (default)"
        echo "  ./deploy.sh up           - Start services"
        echo "  ./deploy.sh down         - Stop services"
        echo "  ./deploy.sh restart      - Restart services"
        echo "  ./deploy.sh logs         - View logs"
        echo "  ./deploy.sh status       - Show status"
        echo "  ./deploy.sh update       - Update application"
        echo "  ./deploy.sh backup       - Backup data"
        echo "  ./deploy.sh clean        - Clean up (keep data)"
        echo "  ./deploy.sh reset        - Reset everything (delete data)"
        echo "  ./deploy.sh help         - Show this help"
        echo ""
        ;;
    *)
        main
        ;;
esac