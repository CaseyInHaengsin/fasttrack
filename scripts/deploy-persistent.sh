#!/bin/bash

# FastTrack Persistent Deployment Script
set -e

echo "🚀 Starting FastTrack persistent deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
APP_NAME="fasttrack-persistent"
IMAGE_NAME="fasttrack-persistent"
CONTAINER_NAME="fasttrack-persistent"
PORT=${PORT:-3004}
DATA_VOLUME="fasttrack-data"

# Get the project root directory (parent of scripts directory)
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

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

# Create data volume if it doesn't exist
create_volume() {
    if ! docker volume inspect $DATA_VOLUME > /dev/null 2>&1; then
        log_info "Creating data volume: $DATA_VOLUME"
        docker volume create $DATA_VOLUME
        log_success "Data volume created"
    else
        log_info "Data volume already exists: $DATA_VOLUME"
    fi
}

# Build the Docker image
build_image() {
    log_info "Building Docker image..."
    log_info "Project root: $PROJECT_ROOT"
    
    # Change to project root directory
    cd "$PROJECT_ROOT"
    
    # Verify Dockerfile exists
    if [ ! -f "Dockerfile.fullstack" ]; then
        log_error "Dockerfile.fullstack not found in $PROJECT_ROOT"
        exit 1
    fi
    
    docker build -f Dockerfile.fullstack -t $IMAGE_NAME:latest .
    log_success "Docker image built successfully"
}

# Stop and remove existing container
cleanup_container() {
    if docker ps -a --format 'table {{.Names}}' | grep -q $CONTAINER_NAME; then
        log_info "Stopping existing container..."
        docker stop $CONTAINER_NAME || true
        log_info "Removing existing container..."
        docker rm $CONTAINER_NAME || true
        log_success "Cleanup completed"
    fi
}

# Run the container with persistent storage
run_container() {
    log_info "Starting new container with persistent storage on port $PORT..."
    docker run -d \
        --name $CONTAINER_NAME \
        --restart unless-stopped \
        -p $PORT:80 \
        -v $DATA_VOLUME:/data \
        -e NODE_ENV=production \
        -e DATA_DIR=/data \
        -e PORT=3001 \
        --health-cmd="wget --no-verbose --tries=1 --spider http://localhost/health || exit 1" \
        --health-interval=30s \
        --health-timeout=10s \
        --health-retries=3 \
        $IMAGE_NAME:latest
    
    log_success "Container started successfully"
}

# Wait for container to be healthy
wait_for_health() {
    log_info "Waiting for application to be healthy..."
    local max_attempts=60
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if docker inspect --format='{{.State.Health.Status}}' $CONTAINER_NAME 2>/dev/null | grep -q "healthy"; then
            log_success "Application is healthy!"
            return 0
        fi
        
        if [ $((attempt % 10)) -eq 0 ]; then
            log_info "Attempt $attempt/$max_attempts - checking logs..."
            docker logs --tail 10 $CONTAINER_NAME
        fi
        
        log_info "Attempt $attempt/$max_attempts - waiting for health check..."
        sleep 2
        ((attempt++))
    done
    
    log_warning "Health check timeout, checking container status..."
    docker logs --tail 20 $CONTAINER_NAME
    return 0
}

# Show deployment info
show_info() {
    echo ""
    echo "🎉 FastTrack has been deployed with persistent data!"
    echo ""
    echo "📋 Deployment Information:"
    echo "   • Application URL: http://localhost:$PORT"
    echo "   • Container Name: $CONTAINER_NAME"
    echo "   • Image: $IMAGE_NAME:latest"
    echo "   • Data Volume: $DATA_VOLUME"
    echo "   • Data Path: /data (inside container)"
    echo "   • Health Check: http://localhost:$PORT/health"
    echo ""
    echo "💾 Data Persistence:"
    echo "   • User fasting data: Stored in $DATA_VOLUME"
    echo "   • Weight history: Stored in $DATA_VOLUME"
    echo "   • Health profiles: Stored in $DATA_VOLUME"
    echo "   • Data survives container restarts and updates"
    echo ""
    echo "🔧 Useful Commands:"
    echo "   • View logs: docker logs $CONTAINER_NAME"
    echo "   • Follow logs: docker logs -f $CONTAINER_NAME"
    echo "   • Stop app: docker stop $CONTAINER_NAME"
    echo "   • Start app: docker start $CONTAINER_NAME"
    echo "   • Restart app: docker restart $CONTAINER_NAME"
    echo "   • Remove app: docker rm -f $CONTAINER_NAME"
    echo "   • Backup data: docker run --rm -v $DATA_VOLUME:/data -v \$(pwd):/backup alpine tar czf /backup/fasttrack-backup.tar.gz /data"
    echo "   • Restore data: docker run --rm -v $DATA_VOLUME:/data -v \$(pwd):/backup alpine tar xzf /backup/fasttrack-backup.tar.gz -C /"
    echo ""
    echo "🌐 Access from other devices:"
    echo "   • Find your server IP: ip addr show | grep 'inet '"
    echo "   • Access from network: http://YOUR_SERVER_IP:$PORT"
    echo ""
    echo "🔍 Troubleshooting:"
    echo "   • Check logs: docker logs $CONTAINER_NAME"
    echo "   • Check health: docker inspect $CONTAINER_NAME | grep Health -A 10"
    echo "   • Test backend: curl http://localhost:$PORT/health"
    echo ""
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

# Main deployment process
main() {
    log_info "FastTrack Persistent Deployment Script v1.0"
    echo ""
    
    check_docker
    create_volume
    backup_data
    build_image
    cleanup_container
    run_container
    wait_for_health
    show_info
    
    log_success "Persistent deployment completed! 🎉"
    log_info "Access your application at: http://localhost:$PORT"
}

# Handle script arguments
case "${1:-}" in
    "build")
        check_docker
        build_image
        ;;
    "run")
        check_docker
        create_volume
        cleanup_container
        run_container
        wait_for_health
        show_info
        ;;
    "stop")
        docker stop $CONTAINER_NAME || true
        log_success "Application stopped"
        ;;
    "start")
        docker start $CONTAINER_NAME || true
        log_success "Application started"
        ;;
    "restart")
        docker restart $CONTAINER_NAME || true
        log_success "Application restarted"
        ;;
    "logs")
        docker logs -f $CONTAINER_NAME
        ;;
    "status")
        echo "Container Status:"
        docker ps -a --filter name=$CONTAINER_NAME
        echo ""
        echo "Health Status:"
        docker inspect $CONTAINER_NAME | grep -A 10 '"Health"' || echo "No health info available"
        echo ""
        echo "Recent Logs:"
        docker logs --tail 20 $CONTAINER_NAME
        ;;
    "backup")
        backup_data
        ;;
    "clean")
        cleanup_container
        docker rmi $IMAGE_NAME:latest || true
        log_warning "Note: Data volume $DATA_VOLUME was preserved"
        log_success "Cleanup completed"
        ;;
    "volume-clean")
        cleanup_container
        docker volume rm $DATA_VOLUME || true
        log_warning "Data volume removed - all data lost!"
        log_success "Complete cleanup completed"
        ;;
    *)
        main
        ;;
esac