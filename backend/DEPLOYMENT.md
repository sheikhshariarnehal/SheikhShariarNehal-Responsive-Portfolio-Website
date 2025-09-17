# Deployment Guide

This guide covers deploying the Portfolio Backend & Admin Dashboard to various platforms.

## Pre-deployment Checklist

### 1. Environment Configuration
- [ ] Set `NODE_ENV=production`
- [ ] Generate secure `JWT_SECRET` (32+ characters)
- [ ] Set strong `ADMIN_PASSWORD`
- [ ] Configure production URLs for CORS
- [ ] Set appropriate file upload limits

### 2. Security Review
- [ ] Review and update CORS origins
- [ ] Verify rate limiting settings
- [ ] Check file upload restrictions
- [ ] Ensure sensitive data is not logged

### 3. Testing
- [ ] Run test suite: `npm test`
- [ ] Test API endpoints manually
- [ ] Verify dashboard functionality
- [ ] Test file upload system

## Platform-Specific Deployment

### Heroku

1. **Install Heroku CLI**
   ```bash
   # Install Heroku CLI (if not already installed)
   npm install -g heroku
   ```

2. **Create Heroku App**
   ```bash
   heroku create your-portfolio-backend
   ```

3. **Set Environment Variables**
   ```bash
   heroku config:set NODE_ENV=production
   heroku config:set JWT_SECRET=your-very-secure-secret-key
   heroku config:set ADMIN_USERNAME=your-admin-username
   heroku config:set ADMIN_PASSWORD=your-secure-password
   heroku config:set FRONTEND_URL=https://your-frontend-domain.com
   heroku config:set PORTFOLIO_URL=https://your-portfolio-domain.com
   ```

4. **Deploy**
   ```bash
   git add .
   git commit -m "Deploy to Heroku"
   git push heroku main
   ```

5. **Open Application**
   ```bash
   heroku open
   ```

### DigitalOcean App Platform

1. **Create App**
   - Go to DigitalOcean App Platform
   - Connect your GitHub repository
   - Select the backend directory

2. **Configure Build Settings**
   ```yaml
   name: portfolio-backend
   services:
   - name: api
     source_dir: /backend
     github:
       repo: your-username/your-repo
       branch: main
     run_command: npm start
     environment_slug: node-js
     instance_count: 1
     instance_size_slug: basic-xxs
     envs:
     - key: NODE_ENV
       value: production
     - key: JWT_SECRET
       value: your-secure-secret
       type: SECRET
     - key: ADMIN_USERNAME
       value: your-admin-username
       type: SECRET
     - key: ADMIN_PASSWORD
       value: your-secure-password
       type: SECRET
   ```

3. **Deploy**
   - Click "Create Resources"
   - Wait for deployment to complete

### AWS EC2

1. **Launch EC2 Instance**
   - Choose Ubuntu 20.04 LTS
   - Select appropriate instance type (t2.micro for testing)
   - Configure security groups (allow HTTP/HTTPS)

2. **Connect and Setup**
   ```bash
   # Connect to instance
   ssh -i your-key.pem ubuntu@your-instance-ip
   
   # Update system
   sudo apt update && sudo apt upgrade -y
   
   # Install Node.js
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   
   # Install PM2
   sudo npm install -g pm2
   ```

3. **Deploy Application**
   ```bash
   # Clone repository
   git clone https://github.com/your-username/your-repo.git
   cd your-repo/backend
   
   # Install dependencies
   npm ci --only=production
   
   # Create environment file
   nano .env
   # Add your production environment variables
   
   # Start with PM2
   pm2 start server.js --name "portfolio-backend"
   pm2 startup
   pm2 save
   ```

4. **Setup Nginx (Optional)**
   ```bash
   # Install Nginx
   sudo apt install nginx
   
   # Create configuration
   sudo nano /etc/nginx/sites-available/portfolio-backend
   ```
   
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
   
       location / {
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
   }
   ```
   
   ```bash
   # Enable site
   sudo ln -s /etc/nginx/sites-available/portfolio-backend /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

### Vercel (Serverless)

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Create vercel.json**
   ```json
   {
     "version": 2,
     "builds": [
       {
         "src": "server.js",
         "use": "@vercel/node"
       }
     ],
     "routes": [
       {
         "src": "/(.*)",
         "dest": "/server.js"
       }
     ],
     "env": {
       "NODE_ENV": "production"
     }
   }
   ```

3. **Deploy**
   ```bash
   vercel --prod
   ```

4. **Set Environment Variables**
   ```bash
   vercel env add JWT_SECRET
   vercel env add ADMIN_USERNAME
   vercel env add ADMIN_PASSWORD
   # Add other environment variables
   ```

## SSL/HTTPS Setup

### Let's Encrypt (Free SSL)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

### Cloudflare (Recommended)

1. Add your domain to Cloudflare
2. Update nameservers
3. Enable "Full (strict)" SSL mode
4. Enable "Always Use HTTPS"

## Monitoring and Maintenance

### Health Checks

Set up monitoring for:
- `/api/health` endpoint
- Server uptime
- Response times
- Error rates

### Logging

Configure log aggregation:
```bash
# PM2 logs
pm2 logs portfolio-backend

# System logs
sudo journalctl -u nginx -f
```

### Backup Strategy

1. **Automated Backups**
   ```bash
   # Create backup script
   #!/bin/bash
   DATE=$(date +%Y%m%d_%H%M%S)
   cp /path/to/projects/projects.json /backups/projects_$DATE.json
   
   # Add to crontab
   0 2 * * * /path/to/backup-script.sh
   ```

2. **Database Backups**
   - Regular exports of projects.json
   - Version control integration
   - Cloud storage backup

### Performance Optimization

1. **Enable Compression**
   ```javascript
   // Already included in server.js
   app.use(compression());
   ```

2. **Caching Headers**
   ```nginx
   location /dashboard/assets/ {
       expires 1y;
       add_header Cache-Control "public, immutable";
   }
   ```

3. **Rate Limiting**
   ```javascript
   // Adjust based on your needs
   const limiter = rateLimit({
     windowMs: 15 * 60 * 1000, // 15 minutes
     max: 100 // requests per window
   });
   ```

## Troubleshooting

### Common Issues

1. **Port Already in Use**
   ```bash
   sudo lsof -i :5000
   sudo kill -9 PID
   ```

2. **Permission Errors**
   ```bash
   sudo chown -R $USER:$USER /path/to/app
   chmod -R 755 /path/to/app
   ```

3. **Environment Variables Not Loading**
   - Check .env file location
   - Verify file permissions
   - Ensure no trailing spaces

4. **CORS Errors**
   - Verify CORS origins in .env
   - Check protocol (http vs https)
   - Ensure no trailing slashes

### Log Analysis

```bash
# Application logs
pm2 logs portfolio-backend --lines 100

# System logs
sudo journalctl -u your-service --since "1 hour ago"

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

## Security Considerations

### Production Security Checklist

- [ ] Use HTTPS everywhere
- [ ] Set secure JWT secret (32+ characters)
- [ ] Enable rate limiting
- [ ] Configure proper CORS origins
- [ ] Use strong admin credentials
- [ ] Regular security updates
- [ ] Monitor for suspicious activity
- [ ] Implement proper logging
- [ ] Use environment variables for secrets
- [ ] Regular backup verification

### Security Headers

```javascript
// Already configured in server.js with Helmet
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
```

## Scaling Considerations

### Horizontal Scaling

1. **Load Balancer Setup**
2. **Session Management** (stateless JWT)
3. **File Storage** (cloud storage)
4. **Database Migration** (from JSON to proper DB)

### Vertical Scaling

1. **Increase server resources**
2. **Optimize Node.js performance**
3. **Enable clustering**

```javascript
// cluster.js
const cluster = require('cluster');
const numCPUs = require('os').cpus().length;

if (cluster.isMaster) {
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }
} else {
  require('./server.js');
}
```

## Support

For deployment issues:
1. Check the troubleshooting section
2. Review platform-specific documentation
3. Check server logs
4. Verify environment configuration
5. Test locally first
