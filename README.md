# FastTrack - Personal Fasting Companion 🏃‍♂️💨

This application was built using https://bolt.new, made for tracking my intermitent and long fasts

A beautiful, full-featured intermittent fasting tracker with persistent data storage, health monitoring, and comprehensive analytics.

## ✨ Features

- **🕐 Fasting Timer**: Live timer with start/pause/stop functionality
- **📅 Calendar Entry**: Easy date and time selection for past fasts
- **📊 Analytics**: Beautiful charts and statistics
- **⚖️ Weight Tracking**: BMI calculations and progress charts
- **💊 Supplement Tracking**: Track vitamins and supplements with calendar view
- **🎨 Themes**: 8 beautiful color themes including dark mode
- **💾 Data Persistence**: All data stored per-user with automatic backups
- **📱 Responsive**: Works perfectly on mobile and desktop
- **🔄 Import/Export**: CSV import/export for data portability
- **🏥 Health Metrics**: Calorie burn calculations and health insights
- **👥 Multi-User**: Secure user accounts with individual data storage

## 🚀 Quick Start

### Prerequisites
- Docker and Docker Compose installed
- Port 3004 available (change in docker-compose file to whatever)

### Simple Docker Run
```bash
docker run -d \
  --name fasttrack \
  -p 3004:80 \
  -v fasttrack-data:/data \
  --restart unless-stopped \
  proteinman81/fasttrack:latest
```

### Docker Compose example
```yaml
version: '3.8'
services:
  fasttrack:
    image: proteinman81/fasttrack:latest
    container_name: fasttrack
    ports:
      - "3004:80"
    volumes:
      - fasttrack-data:/data
    restart: unless-stopped
    environment:
      - JWT_SECRET=your-secure-jwt-secret-here

volumes:
  fasttrack-data:
    driver: local
```

### Easy Deployment
```bash
# Clone and deploy
git clone https://github.com/theqldcoalminer/fasttrack.git
cd fasttrack
docker-compose up -d --build
```

### Alternative Deployment
```bash
# Using deployment script
git clone https://github.com/theqldcoalminer/fasttrack.git
cd fasttrack
chmod +x scripts/deploy.sh
./scripts/deploy.sh
```

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
