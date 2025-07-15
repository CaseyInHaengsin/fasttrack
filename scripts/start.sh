#!/bin/sh

# Start script for full-stack FastTrack application

echo "🚀 Starting FastTrack Full-Stack Application..."

# Ensure data directory exists with proper permissions
echo "📁 Setting up persistent data directory..."
mkdir -p /data/app_data

# Set proper ownership and permissions
chown -R nginx:nginx /data
chmod -R 755 /data

echo "📁 Data directory structure:"
ls -la /data/

# Verify data directory is writable
if [ -w "/data/app_data" ]; then
    echo "✅ Data directory is writable"
else
    echo "❌ Data directory is not writable!"
    exit 1
fi

# Start the backend API server in the background
echo "📡 Starting backend API server..."
cd /app/backend

# Check if package.json exists
if [ ! -f "package.json" ]; then
    echo "❌ Backend package.json not found!"
    exit 1
fi

# Start backend with proper error handling as nginx user
su -s /bin/sh nginx -c "node server.js" &
BACKEND_PID=$!

# Wait a moment for backend to start
sleep 5

# Check if backend is running
if kill -0 $BACKEND_PID 2>/dev/null; then
    echo "✅ Backend API server started successfully (PID: $BACKEND_PID)"
    
    # Test backend health
    for i in 1 2 3 4 5; do
        if wget --quiet --tries=1 --timeout=5 --spider http://localhost:3001/health 2>/dev/null; then
            echo "✅ Backend health check passed"
            break
        else
            echo "⏳ Waiting for backend to be ready... (attempt $i/5)"
            sleep 2
        fi
    done
else
    echo "❌ Failed to start backend API server"
    exit 1
fi

# Check if frontend files exist
if [ ! -f "/usr/share/nginx/html/index.html" ]; then
    echo "❌ Frontend files not found!"
    exit 1
fi

echo "✅ Frontend files found"

# Start nginx in the foreground
echo "🌐 Starting nginx web server..."

# Test nginx configuration
nginx -t
if [ $? -ne 0 ]; then
    echo "❌ Nginx configuration test failed"
    exit 1
fi

nginx -g "daemon off;" &
NGINX_PID=$!

# Wait a moment for nginx to start
sleep 3

# Check if nginx is running
if kill -0 $NGINX_PID 2>/dev/null; then
    echo "✅ Nginx web server started successfully (PID: $NGINX_PID)"
else
    echo "❌ Failed to start nginx web server"
    exit 1
fi

# Function to handle shutdown
shutdown() {
    echo "🛑 Shutting down services..."
    kill $BACKEND_PID 2>/dev/null
    kill $NGINX_PID 2>/dev/null
    exit 0
}

# Trap signals for graceful shutdown
trap shutdown SIGTERM SIGINT

echo "🎉 FastTrack application is ready!"
echo "📍 Frontend: http://localhost (port 80 inside container)"
echo "📍 Backend API: http://localhost:3001 (inside container)"
echo "📍 Health check: http://localhost/health"

# Wait for nginx (keeps container running)
wait $NGINX_PID