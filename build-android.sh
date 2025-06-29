#!/bin/bash

# FastTrack Android Build Script
set -e

echo "🚀 Building FastTrack Android App..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

# Check if Node.js is installed
check_node() {
    if ! command -v node &> /dev/null; then
        log_error "Node.js is not installed. Please install Node.js and try again."
        exit 1
    fi
    log_success "Node.js is installed"
}

# Check if Android Studio/SDK is installed
check_android() {
    if [ -z "$ANDROID_HOME" ]; then
        log_warning "ANDROID_HOME is not set. Please install Android Studio and set ANDROID_HOME."
        log_info "You can download Android Studio from: https://developer.android.com/studio"
        exit 1
    fi
    log_success "Android SDK found at $ANDROID_HOME"
}

# Install dependencies
install_deps() {
    log_info "Installing dependencies..."
    npm install
    log_success "Dependencies installed"
}

# Build web app
build_web() {
    log_info "Building web application..."
    npm run build
    log_success "Web application built"
}

# Initialize Capacitor
init_capacitor() {
    log_info "Initializing Capacitor..."
    
    # Check if android platform exists
    if [ ! -d "android" ]; then
        log_info "Adding Android platform..."
        npx cap add android
    fi
    
    # Sync with Capacitor
    npx cap sync android
    log_success "Capacitor initialized and synced"
}

# Build Android app
build_android() {
    log_info "Building Android APK..."
    
    # Open Android Studio for manual build
    log_info "Opening Android Studio..."
    log_warning "Please build the APK manually in Android Studio:"
    log_info "1. Build > Generate Signed Bundle / APK"
    log_info "2. Choose APK"
    log_info "3. Create or select a keystore"
    log_info "4. Build release APK"
    
    npx cap open android
}

# Development build
dev_build() {
    log_info "Starting development build..."
    build_web
    init_capacitor
    
    log_info "Running on Android device/emulator..."
    npx cap run android
}

# Production build
prod_build() {
    log_info "Starting production build..."
    build_web
    init_capacitor
    build_android
}

# Show usage
show_usage() {
    echo "FastTrack Android Build Script"
    echo ""
    echo "Usage:"
    echo "  ./build-android.sh dev     - Development build and run"
    echo "  ./build-android.sh prod    - Production build"
    echo "  ./build-android.sh setup   - Setup environment"
    echo "  ./build-android.sh help    - Show this help"
    echo ""
}

# Setup environment
setup_env() {
    log_info "Setting up Android development environment..."
    
    # Check requirements
    check_node
    
    # Install Capacitor CLI if not installed
    if ! command -v cap &> /dev/null; then
        log_info "Installing Capacitor CLI..."
        npm install -g @capacitor/cli
    fi
    
    # Install dependencies
    install_deps
    
    log_success "Environment setup complete!"
    log_info "Next steps:"
    log_info "1. Install Android Studio: https://developer.android.com/studio"
    log_info "2. Set ANDROID_HOME environment variable"
    log_info "3. Run './build-android.sh dev' to start development"
}

# Main execution
case "${1:-}" in
    "dev")
        check_node
        check_android
        dev_build
        ;;
    "prod")
        check_node
        check_android
        prod_build
        ;;
    "setup")
        setup_env
        ;;
    "help")
        show_usage
        ;;
    *)
        log_info "FastTrack Android Build Script"
        echo ""
        show_usage
        ;;
esac