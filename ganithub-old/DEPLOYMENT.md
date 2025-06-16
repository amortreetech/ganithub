# 🚀 GanitHub Deployment Guide

This guide provides step-by-step instructions for deploying GanitHub to production environments.

## 📋 Prerequisites

### System Requirements
- **Node.js** v16.0.0 or higher
- **MySQL** v8.0 or higher
- **nginx** (recommended for production)
- **PM2** (for process management)
- **SSL Certificate** (for HTTPS)

### Server Specifications (Recommended)
- **CPU:** 2+ cores
- **RAM:** 4GB minimum, 8GB recommended
- **Storage:** 50GB+ SSD
- **Bandwidth:** 100Mbps+

## 🛠️ Production Setup

### 1. Server Preparation

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install MySQL
sudo apt install mysql-server -y
sudo mysql_secure_installation

# Install nginx
sudo apt install nginx -y

# Install PM2 globally
sudo npm install -g pm2
```

### 2. Database Setup

```bash
# Login to MySQL
sudo mysql -u root -p

# Create production database
CREATE DATABASE ganithub_prod;
CREATE USER 'ganithub_user'@'localhost' IDENTIFIED BY 'secure_password_here';
GRANT ALL PRIVILEGES ON ganithub_prod.* TO 'ganithub_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;

# Import database schema
mysql -u ganithub_user -p ganithub_prod < database_schema.sql

# Import seed data (optional for demo)
mysql -u ganithub_user -p ganithub_prod < seed_data.sql
```

### 3. Application Deployment

```bash
# Clone repository
git clone <your-repository-url>
cd ganithub

# Backend setup
cd backend
npm install --production

# Create production environment file
cp .env.example .env.production
```

Edit `.env.production`:
```env
NODE_ENV=production
PORT=5000
DB_HOST=localhost
DB_USER=ganithub_user
DB_PASSWORD=secure_password_here
DB_NAME=ganithub_prod
JWT_SECRET=your_super_secure_jwt_secret_here
CORS_ORIGIN=https://yourdomain.com
```

```bash
# Frontend setup
cd ../frontend
npm install
npm run build

# Copy build files to nginx directory
sudo cp -r dist/* /var/www/ganithub/
sudo chown -R www-data:www-data /var/www/ganithub/
```

### 4. Process Management with PM2

Create `ecosystem.config.js` in the backend directory:
```javascript
module.exports = {
  apps: [{
    name: 'ganithub-backend',
    script: 'src/server.js',
    env: {
      NODE_ENV: 'development'
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    instances: 'max',
    exec_mode: 'cluster',
    watch: false,
    max_memory_restart: '1G',
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
}
```

```bash
# Start application with PM2
cd backend
mkdir logs
pm2 start ecosystem.config.js --env production

# Save PM2 configuration
pm2 save
pm2 startup
```

### 5. nginx Configuration

Create `/etc/nginx/sites-available/ganithub`:
```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    ssl_certificate /path/to/your/certificate.crt;
    ssl_certificate_key /path/to/your/private.key;
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    root /var/www/ganithub;
    index index.html;

    # Frontend routes
    location / {
        try_files $uri $uri/ /index.html;
        add_header Cache-Control "no-cache, no-store, must-revalidate";
        add_header Pragma "no-cache";
        add_header Expires "0";
    }

    # API routes
    location /api/ {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # File uploads
    location /uploads/ {
        alias /path/to/ganithub/backend/uploads/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied expired no-cache no-store private must-revalidate auth;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/javascript;
}
```

```bash
# Enable site and restart nginx
sudo ln -s /etc/nginx/sites-available/ganithub /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## 🔒 Security Configuration

### 1. Firewall Setup
```bash
# Configure UFW firewall
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

### 2. SSL Certificate (Let's Encrypt)
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Obtain SSL certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

### 3. Database Security
```bash
# Secure MySQL installation
sudo mysql_secure_installation

# Configure MySQL for production
sudo nano /etc/mysql/mysql.conf.d/mysqld.cnf
```

Add to MySQL config:
```ini
[mysqld]
bind-address = 127.0.0.1
max_connections = 100
innodb_buffer_pool_size = 1G
```

## 📊 Monitoring & Maintenance

### 1. Application Monitoring
```bash
# Monitor PM2 processes
pm2 monit

# View logs
pm2 logs ganithub-backend

# Restart application
pm2 restart ganithub-backend
```

### 2. Database Backup
Create backup script `/home/ubuntu/backup.sh`:
```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/home/ubuntu/backups"
mkdir -p $BACKUP_DIR

# Database backup
mysqldump -u ganithub_user -p'secure_password_here' ganithub_prod > $BACKUP_DIR/ganithub_$DATE.sql

# File backup
tar -czf $BACKUP_DIR/uploads_$DATE.tar.gz /path/to/ganithub/backend/uploads/

# Keep only last 7 days of backups
find $BACKUP_DIR -name "ganithub_*.sql" -mtime +7 -delete
find $BACKUP_DIR -name "uploads_*.tar.gz" -mtime +7 -delete
```

```bash
# Make executable and schedule
chmod +x /home/ubuntu/backup.sh
crontab -e
# Add: 0 2 * * * /home/ubuntu/backup.sh
```

### 3. Log Rotation
```bash
# Configure logrotate for PM2 logs
sudo nano /etc/logrotate.d/pm2
```

Add:
```
/home/ubuntu/ganithub/backend/logs/*.log {
    daily
    missingok
    rotate 7
    compress
    notifempty
    create 644 ubuntu ubuntu
    postrotate
        pm2 reloadLogs
    endscript
}
```

## 🚀 Performance Optimization

### 1. nginx Optimization
```nginx
# Add to nginx.conf
worker_processes auto;
worker_connections 1024;

# Enable HTTP/2
listen 443 ssl http2;

# Enable caching
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

### 2. Database Optimization
```sql
-- Optimize MySQL for production
SET GLOBAL innodb_buffer_pool_size = 1073741824; -- 1GB
SET GLOBAL query_cache_size = 268435456; -- 256MB
SET GLOBAL max_connections = 100;
```

### 3. Node.js Optimization
```javascript
// Add to server.js
const compression = require('compression');
app.use(compression());

// Enable cluster mode in PM2 (already configured above)
```

## 🔧 Environment Variables

### Production Environment Variables
```env
# Application
NODE_ENV=production
PORT=5000
APP_URL=https://yourdomain.com

# Database
DB_HOST=localhost
DB_PORT=3306
DB_USER=ganithub_user
DB_PASSWORD=secure_password_here
DB_NAME=ganithub_prod

# Security
JWT_SECRET=your_super_secure_jwt_secret_here
JWT_EXPIRES_IN=7d
BCRYPT_ROUNDS=12

# CORS
CORS_ORIGIN=https://yourdomain.com

# File Upload
UPLOAD_MAX_SIZE=10485760
UPLOAD_PATH=/var/www/ganithub/uploads

# Email (if implemented)
SMTP_HOST=smtp.yourdomain.com
SMTP_PORT=587
SMTP_USER=noreply@yourdomain.com
SMTP_PASS=email_password_here

# Jitsi Meet
JITSI_DOMAIN=meet.jit.si
JITSI_APP_ID=your_jitsi_app_id
```

## 📈 Scaling Considerations

### Horizontal Scaling
- Use load balancer (nginx, HAProxy)
- Database replication (master-slave)
- Redis for session storage
- CDN for static assets

### Vertical Scaling
- Increase server resources
- Optimize database queries
- Implement caching strategies
- Use database indexing

## 🆘 Troubleshooting

### Common Issues

1. **Application won't start**
   ```bash
   pm2 logs ganithub-backend
   # Check for port conflicts, database connection issues
   ```

2. **Database connection errors**
   ```bash
   mysql -u ganithub_user -p ganithub_prod
   # Verify credentials and database existence
   ```

3. **nginx 502 errors**
   ```bash
   sudo nginx -t
   sudo systemctl status nginx
   # Check backend server status
   ```

4. **SSL certificate issues**
   ```bash
   sudo certbot certificates
   sudo certbot renew --dry-run
   ```

## 📞 Support

For deployment support:
- Email: devops@ganithub.com
- Documentation: https://docs.ganithub.com
- Issues: GitHub repository issues

---

**Happy Deploying! 🚀**

