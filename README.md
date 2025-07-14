# FastTrack - Personal Fasting Companion 🏃‍♂️💨

This application was built using https://bolt.new, made for tracking my intermitent and long fasts

A beautiful, full-featured intermittent fasting tracker with persistent data storage, health monitoring, and comprehensive analytics.

## ✨ Features

- **🕐 Fasting Timer**: Live timer with start/pause/stop functionality
- **📅 Calendar Entry**: Easy date and time selection for past fasts
- **📊 Analytics**: Beautiful charts and statistics
- **⚖️ Weight Tracking**: BMI calculations and progress charts
- **🎨 Themes**: 8 beautiful color themes including dark mode
- **💾 Data Persistence**: All data stored securely with automatic backups
- **📱 Responsive**: Works perfectly on mobile and desktop
- **🔄 Import/Export**: CSV import/export for data portability
- **🏥 Health Metrics**: Calorie burn calculations and health insights

## 🚀 Quick Start

### Prerequisites
- Docker and Docker Compose installed
- Port 3004 available (change in docker-compose file to whatever)

```
### Easy Deployment
For ease of deployment
git clone https://github.com/theqldcoalminer/fasttrack.git
docker-compose up -d --build

or

git clone https://github.com/theqldcoalminer/fasttrack.git
cd fasttrack
chmod +x deploy.sh
./deploy.sh
```

That's it! Your FastTrack application will be available at `http://localhost:3004`

## 📋 Management Commands

```bash
# Start the application
./deploy.sh up

# Stop the application
./deploy.sh down

# View logs
./deploy.sh logs

# Check status
./deploy.sh status

# Update application
./deploy.sh update

# Backup data
./deploy.sh backup

# Restart services
./deploy.sh restart

# Get help
./deploy.sh help
```

## 🏗️ Architecture

### Frontend
- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **Recharts** for beautiful visualizations
- **Lucide React** for icons
- **Date-fns** for date handling

### Backend
- **Node.js** with Express
- **File-based storage** for simplicity
- **RESTful API** design
- **CORS enabled** for development

### Infrastructure
- **Docker** containerization
- **Nginx** reverse proxy
- **Persistent volumes** for data
- **Health checks** for reliability

## 💾 Data Storage

All user data is stored in a Docker volume (`fasttrack-data`) which includes:
- Fasting records with timestamps and durations
- Weight history with BMI calculations
- User health profiles and preferences
- Theme settings and preferences

Data persists across:
- Container restarts
- Application updates
- System reboots

## 🔧 Configuration

### Environment Variables
```bash
PORT=3004              # External port
NODE_ENV=production    # Environment
DATA_DIR=/data         # Data directory inside container
```

### Custom Port
```bash
PORT=8080 ./deploy.sh
```

## 📊 API Endpoints

### Fasting Data
- `GET /api/fasts/:userId` - Get user's fasts
- `POST /api/fasts/:userId` - Save new fast
- `DELETE /api/fasts/:userId/:fastId` - Delete fast

### Weight Data
- `GET /api/weight/:userId` - Get weight entries
- `POST /api/weight/:userId` - Save weight entry
- `DELETE /api/weight/:userId/:weightId` - Delete weight

### Health Profile
- `GET /api/profile/:userId` - Get health profile
- `POST /api/profile/:userId` - Save health profile

### Data Management
- `POST /api/import/:userId` - Import data
- `GET /api/export/:userId` - Export data
- `GET /api/users` - List all users

## 🎨 Themes

Choose from 8 beautiful themes:
- **Ocean Blue** - Classic blue gradient
- **Royal Purple** - Elegant purple tones
- **Forest Green** - Natural green palette
- **Sunset Orange** - Warm orange hues
- **Rose Pink** - Soft pink gradients
- **Teal Breeze** - Cool teal colors
- **Dark Mode** - Professional dark theme
- **Midnight** - Deep dark theme

## 📱 Mobile Support

FastTrack is fully responsive and works beautifully on:
- 📱 Mobile phones (iOS/Android)
- 📱 Tablets
- 💻 Desktop computers
- 🖥️ Large screens

## 🔒 Security Features

- **Input validation** on all forms
- **XSS protection** headers
- **CORS configuration** for API security
- **Health checks** for monitoring
- **Graceful error handling**

## 🔄 Backup & Recovery

### Automatic Backups
- Created before each deployment
- Timestamped for easy identification
- Stored as compressed archives

### Manual Backup
```bash
./deploy.sh backup
```

### Restore from Backup
```bash
# Stop application
./deploy.sh down

# Restore data (replace with your backup file)
docker run --rm -v fasttrack-data:/data -v $(pwd):/backup alpine tar xzf /backup/fasttrack-backup-YYYYMMDD-HHMMSS.tar.gz -C /

# Start application
./deploy.sh up
```

## 🌐 Network Access

### Local Access
- `http://localhost:3004`

### Network Access
```bash
# Find your server IP
hostname -I | awk '{print $1}'

# Access from other devices
http://YOUR_SERVER_IP:3004
```

## 🔍 Troubleshooting

### Application Won't Start
```bash
# Check logs
./deploy.sh logs

# Check Docker status
docker ps -a

# Restart services
./deploy.sh restart
```

### Data Not Persisting
```bash
# Check volume
docker volume inspect fasttrack-data

# Verify mount
docker inspect fasttrack-app | grep -A 10 Mounts
```

### Port Already in Use
```bash
# Use different port
PORT=8080 ./deploy.sh

# Or find what's using the port
lsof -i :3004
```

### Performance Issues
```bash
# Check resource usage
docker stats fasttrack-app

# Check system resources
df -h
free -h
```

## 🚀 Production Deployment

### Server Requirements
- **CPU**: 1 core minimum, 2+ recommended
- **RAM**: 512MB minimum, 1GB+ recommended
- **Storage**: 1GB minimum, 5GB+ recommended
- **Network**: Stable internet connection

### Security Hardening
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Configure firewall
sudo ufw allow 22    # SSH
sudo ufw allow 3004  # FastTrack
sudo ufw enable

# Set up SSL (optional)
# Use nginx-proxy-manager or traefik for SSL termination
```

### Monitoring
```bash
# Set up log rotation
echo '/var/lib/docker/containers/*/*.log {
    daily
    rotate 7
    compress
    delaycompress
    missingok
    notifempty
    create 0644 root root
}' | sudo tee /etc/logrotate.d/docker

# Monitor with cron
echo "0 */6 * * * /path/to/fasttrack/deploy.sh status > /var/log/fasttrack-status.log" | crontab -
```
![image](https://github.com/user-attachments/assets/c7308cd9-2011-4206-a7fb-fa1095f7dd2d)
![image](https://github.com/user-attachments/assets/6b220b5e-4805-439e-bd05-75432fb1fe10)
![image](https://github.com/user-attachments/assets/19a4c79c-6035-49d6-9d4e-3be6f4b74aca)
![image](https://github.com/user-attachments/assets/c9a60bda-f465-41b8-9e6e-33a47a20bc7a)
![image](https://github.com/user-attachments/assets/26da69e9-7669-415c-ad39-c9e7402dae8d)


## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- **React Team** for the amazing framework
- **Tailwind CSS** for the utility-first CSS
- **Recharts** for beautiful charts
- **Docker** for containerization
- **Nginx** for web serving

---

**FastTrack** - Your Personal Fasting Companion 🏃‍♂️💨

Made with ❤️ for the intermittent fasting community
