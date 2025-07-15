#!/bin/bash

# FastTrack Deployment Script
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
CONTAINER_NAME="fasttrack-container"
PORT=${PORT:-3000}

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

# Build the Docker image
build_image() {
    log_info "Building Docker image..."
    docker build -t $IMAGE_NAME:latest .
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

# Run the container
run_container() {
    log_info "Starting new container on port $PORT..."
    docker run -d \
        --name $CONTAINER_NAME \
        --restart unless-stopped \
        -p $PORT:80 \
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
    local max_attempts=30
    local attempt=1
        docker run --rm -v $DATA_VOLUME:/data -v $(pwd):/backup alpine tar czf /backup/$backup_file -C /data . 2>/dev/null || true
    while [ $attempt -le $max_attempts ]; do
        if docker inspect --format='{{.State.Health.Status}}' $CONTAINER_NAME 2>/dev/null | grep -q "healthy"; then
            log_success "Application is healthy!"
            return 0
        fi
        
        log_info "Attempt $attempt/$max_attempts - waiting for health check..."
        sleep 2
        ((attempt++))
    done
    
    log_warning "Health check timeout, but container is running"
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
    echo "   • Image: $IMAGE_NAME:latest"
    echo "   • Health Check: http://localhost:$PORT/health"
    echo ""
    echo "🔧 Useful Commands:"
    echo "   • View logs: docker logs $CONTAINER_NAME"
    echo "   • Stop app: docker stop $CONTAINER_NAME"
    echo "   • Restart app: docker restart $CONTAINER_NAME"
    echo "   • Remove app: docker rm -f $CONTAINER_NAME"
    echo ""
}
    echo "   • Backup data: docker run --rm -v $DATA_VOLUME:/data -v \$(pwd):/backup alpine tar czf /backup/fasttrack-backup.tar.gz -C /data ."
    echo "   • Restore data: docker run --rm -v $DATA_VOLUME:/data -v \$(pwd):/backup alpine tar xzf /backup/fasttrack-backup.tar.gz -C /data"
main() {
    log_info "FastTrack Deployment Script v1.0"
    echo ""
    
    check_docker
    build_image
    cleanup_container
    run_container
    wait_for_health
    show_info
    
    echo ""
    echo "📁 Data Structure:"
    echo "   • User accounts: /data/app_data/users.json"
    echo "   • User sessions: /data/app_data/sessions.json"
    echo "   • User data: /data/app_data/users/[username]/"
    log_success "Deployment completed! 🎉"
}

# Handle script arguments
case "${1:-}" in
    "build")
        check_docker
        build_image
        ;;
    "run")
        check_docker
        cleanup_container
        run_container
        wait_for_health
        show_info
        ;;
    "stop")
        docker stop $CONTAINER_NAME || true
        log_success "Application stopped"
        ;;
    "restart")
        docker restart $CONTAINER_NAME || true
        log_success "Application restarted"
        ;;
    "logs")
        docker logs -f $CONTAINER_NAME
        ;;
    "clean")
        cleanup_container
        docker rmi $IMAGE_NAME:latest || true
        log_success "Cleanup completed"
        ;;
    *)
        main
        ;;
esac