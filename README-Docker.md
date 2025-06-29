# FastTrack Docker Deployment Guide

This guide will help you deploy the FastTrack fasting app using Docker for production hosting.

## 🚀 Quick Start

### Option 1: Using the Deployment Script (Recommended)
```bash
# Make the script executable (if not already)
chmod +x scripts/deploy.sh

# Deploy the application
./scripts/deploy.sh
```

### Option 2: Using Docker Compose
```bash
# Development/Testing
docker-compose up -d

# Production
docker-compose -f docker-compose.prod.yml up -d
```

### Option 3: Manual Docker Commands
```bash
# Build the image
docker build -t fasttrack:latest .

# Run the container
docker run -d \
  --name fasttrack-app \
  --restart unless-stopped \
  -p 3000:80 \
  fasttrack:latest
```

## 📋 Deployment Options

### 1. Local Development
```bash
# Start with hot reload for development
npm run dev

# Or use Docker for testing production build
docker-compose up
```

### 2. Production Server
```bash
# Using production compose file
docker-compose -f docker-compose.prod.yml up -d

# Or using the deployment script
./scripts/deploy.sh
```

### 3. Cloud Deployment

#### AWS EC2
```bash
# Install Docker on EC2
sudo yum update -y
sudo yum install -y docker
sudo service docker start
sudo usermod -a -G docker ec2-user

# Deploy FastTrack
git clone <your-repo>
cd fasttrack
./scripts/deploy.sh
```

#### DigitalOcean Droplet
```bash
# Create droplet with Docker pre-installed
# Upload your code and run:
./scripts/deploy.sh
```

#### Google Cloud Platform
```bash
# Use Cloud Run for serverless deployment
gcloud run deploy fasttrack \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

## 🔧 Configuration

### Environment Variables
Create a `.env` file for custom configuration:
```env
PORT=3000
NODE_ENV=production
```

### SSL/HTTPS Setup
For production with SSL, update `docker-compose.prod.yml`:
```yaml
volumes:
  - ./ssl:/etc/nginx/ssl:ro
```

Place your SSL certificates in the `ssl/` directory:
- `ssl/cert.pem`
- `ssl/key.pem`

### Custom Domain
Update the nginx configuration in `nginx.conf`:
```nginx
server_name your-domain.com www.your-domain.com;
```

## 📊 Monitoring & Management

### Health Checks
The application includes built-in health checks:
```bash
# Check application health
curl http://localhost:3000/health

# Docker health status
docker inspect --format='{{.State.Health.Status}}' fasttrack-app
```

### Logs
```bash
# View application logs
docker logs fasttrack-app

# Follow logs in real-time
docker logs -f fasttrack-app

# Using the deployment script
./scripts/deploy.sh logs
```

### Container Management
```bash
# Stop the application
./scripts/deploy.sh stop

# Restart the application
./scripts/deploy.sh restart

# Clean up (remove container and image)
./scripts/deploy.sh clean
```

## 🔒 Security Best Practices

### 1. Firewall Configuration
```bash
# Allow only necessary ports
sudo ufw allow 22    # SSH
sudo ufw allow 80    # HTTP
sudo ufw allow 443   # HTTPS
sudo ufw enable
```

### 2. Regular Updates
```bash
# Update the application
git pull origin main
./scripts/deploy.sh
```

### 3. Backup Strategy
Since FastTrack stores data in localStorage, consider:
- Regular data exports via the app's Data Management feature
- Server-side backup of user data if implementing backend storage

## 🌐 Reverse Proxy Setup

### Using Traefik (Included)
```bash
# Start with Traefik for automatic SSL
docker-compose --profile traefik up -d
```

### Using Nginx Proxy Manager
```yaml
# Add to your existing nginx-proxy-manager setup
version: '3.8'
services:
  fasttrack:
    image: fasttrack:latest
    environment:
      - VIRTUAL_HOST=fasttrack.yourdomain.com
      - LETSENCRYPT_HOST=fasttrack.yourdomain.com
```

## 🚨 Troubleshooting

### Common Issues

1. **Port Already in Use**
   ```bash
   # Change port in deployment
   PORT=8080 ./scripts/deploy.sh
   ```

2. **Docker Permission Denied**
   ```bash
   # Add user to docker group
   sudo usermod -a -G docker $USER
   # Logout and login again
   ```

3. **Build Failures**
   ```bash
   # Clean Docker cache
   docker system prune -a
   # Rebuild
   ./scripts/deploy.sh build
   ```

4. **Application Not Loading**
   ```bash
   # Check container status
   docker ps
   # Check logs
   docker logs fasttrack-app
   ```

## 📈 Performance Optimization

### 1. Resource Limits
Update `docker-compose.prod.yml` with appropriate limits:
```yaml
deploy:
  resources:
    limits:
      cpus: '1.0'
      memory: 1G
```

### 2. Caching
The nginx configuration includes:
- Gzip compression
- Static asset caching
- Browser caching headers

### 3. CDN Integration
For better performance, consider using a CDN:
- CloudFlare
- AWS CloudFront
- Google Cloud CDN

## 🎯 Next Steps

1. **Custom Domain**: Point your domain to the server IP
2. **SSL Certificate**: Set up Let's Encrypt or use your own certificates
3. **Monitoring**: Add application monitoring (Prometheus, Grafana)
4. **Backup**: Implement automated backup strategy
5. **CI/CD**: Set up automated deployments with GitHub Actions

## 📞 Support

For deployment issues:
1. Check the logs: `docker logs fasttrack-app`
2. Verify health: `curl http://localhost:3000/health`
3. Review this documentation
4. Check Docker and system resources

---

**FastTrack** - Your Personal Fasting Companion 🏃‍♂️💨