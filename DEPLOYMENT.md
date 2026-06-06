# Deployment Guide

## Deployment Options

This guide covers deploying the Premium Sports Field Booking Platform to various platforms.

## Backend Deployment

### Option 1: Railway.app (Recommended)

**Advantages:**
- Free tier available
- Git integration
- Easy environment variable management
- MongoDB Atlas compatible
- Custom domains

**Steps:**
1. Push code to GitHub
2. Connect GitHub repo to Railway
3. Set environment variables
4. Deploy automatically on push

**Configuration:**
```env
NODE_ENV=production
MONGODB_URI=<Atlas connection string>
REDIS_URL=<Redis Cloud URL>
JWT_SECRET=<secure random string>
```

### Option 2: Heroku

**Steps:**
1. Install Heroku CLI
2. Create Heroku app: `heroku create <app-name>`
3. Set config vars: `heroku config:set KEY=VALUE`
4. Deploy: `git push heroku main`

### Option 3: DigitalOcean App Platform

**Steps:**
1. Connect GitHub repository
2. Configure build and run commands
3. Set environment variables
4. Deploy

### Option 4: AWS (EC2 + Elastic Beanstalk)

**Prerequisites:**
- AWS account
- Node.js server configured
- Security groups set up

**Deployment:**
1. Deploy to EC2 instance manually
2. Or use Elastic Beanstalk for managed deployment

## Frontend Deployment

### Option 1: Vercel (Recommended)

**Advantages:**
- Optimized for React/Vite
- Serverless functions
- Automatic deployments
- Edge caching
- Analytics

**Steps:**
1. Push code to GitHub
2. Connect repo to Vercel
3. Set environment variables
4. Deploy on every push

**Environment Variables:**
```
VITE_API_URL=https://your-backend.railway.app/api
VITE_SOCKET_URL=https://your-backend.railway.app
```

### Option 2: Netlify

**Steps:**
1. Connect GitHub repository
2. Set build command: `npm run build`
3. Set publish directory: `dist`
4. Add environment variables
5. Deploy

### Option 3: GitHub Pages

**Limitations:**
- Static sites only
- No backend support
- Not recommended for this project

### Option 4: AWS S3 + CloudFront

**Steps:**
1. Build frontend: `npm run build`
2. Upload `dist` folder to S3
3. Create CloudFront distribution
4. Point custom domain to CloudFront

## Database Deployment

### MongoDB Atlas (Recommended)

**Setup:**
1. Create MongoDB Atlas account
2. Create cluster (free tier available)
3. Get connection string
4. Add IP whitelist
5. Use connection string in `MONGODB_URI`

**Production Best Practices:**
- Enable encryption at rest
- Enable authentication
- Set up backup snapshots
- Monitor database performance
- Use dedicated instance for production

### Redis Deployment

**Option 1: Redis Cloud**
- Free tier (30MB)
- Easy setup
- Managed backups
- Connection string in `REDIS_URL`

**Option 2: Self-hosted Redis**
- Full control
- Requires server management
- Better for high volume

## Docker Deployment

### Using Docker Compose

```bash
# Build images
docker-compose build

# Start services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Production Docker Setup

```dockerfile
# Build stage
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production stage
FROM node:18-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --only=production
COPY --from=builder /app/dist ./dist
EXPOSE 5000
CMD ["npm", "start"]
```

## Environment Configuration

### Backend Production Variables

```env
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/db
REDIS_URL=redis://:password@host:port
JWT_SECRET=<very-long-secure-random-string>
JWT_EXPIRE=30d
BCRYPT_SALT_ROUNDS=12
CLIENT_URL=https://your-frontend-domain.com
FIREBASE_PROJECT_ID=your-project
FIREBASE_PRIVATE_KEY=...
CLOUDINARY_CLOUD_NAME=...
STRIPE_SECRET_KEY=sk_live_...
EMAIL_USER=noreply@yourdomain.com
EMAIL_PASS=your-app-password
```

### Frontend Production Variables

```env
VITE_API_URL=https://your-backend.com/api
VITE_SOCKET_URL=https://your-backend.com
VITE_FIREBASE_API_KEY=...
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...
VITE_GOOGLE_MAPS_API_KEY=...
```

## Deployment Checklist

- [ ] All tests passing
- [ ] No console errors/warnings
- [ ] Environment variables configured
- [ ] Database backups enabled
- [ ] HTTPS enforced
- [ ] Logging enabled
- [ ] Error tracking setup (e.g., Sentry)
- [ ] CDN configured (for static assets)
- [ ] Monitoring and alerts configured
- [ ] Disaster recovery plan documented
- [ ] Security audit completed
- [ ] Performance optimized

## Post-Deployment

### Monitoring

1. **Application Performance:**
   - Response times
   - Error rates
   - User activity

2. **Infrastructure:**
   - CPU/Memory usage
   - Disk space
   - Network bandwidth

3. **Database:**
   - Query performance
   - Connection pool health
   - Backup status

### Tools

- **Sentry** - Error tracking
- **LogRocket** - Session recording
- **New Relic** - Performance monitoring
- **DataDog** - Infrastructure monitoring

### Health Checks

```bash
# Check backend health
curl https://your-backend.com/api/health

# Check extended status
curl https://your-backend.com/api/health/status
```

## Scaling Strategies

### Vertical Scaling
- Increase server resources
- Upgrade database tier
- More memory/CPU

### Horizontal Scaling
- Multiple backend instances
- Load balancer (nginx, AWS ALB)
- Database replication
- Redis clustering

## Common Issues & Solutions

### Issue: Slow API Responses

**Solutions:**
1. Optimize database queries
2. Add caching with Redis
3. Enable CDN for static assets
4. Increase server resources
5. Use connection pooling

### Issue: Database Connection Errors

**Solutions:**
1. Check IP whitelist
2. Verify connection string
3. Check database credentials
4. Increase connection pool size
5. Review database logs

### Issue: Memory Leaks

**Solutions:**
1. Use memory profiling tools
2. Check for proper cleanup
3. Monitor long-running processes
4. Implement automatic restarts
5. Upgrade server resources

## Backup & Recovery

### Database Backups

```bash
# MongoDB Atlas automatic backups
# Enable in cluster settings
# Restore from backup in UI

# Manual backup
mongodump --uri="mongodb+srv://..." --out=backup
```

### Code Backups

- GitHub automatically backs up code
- Use GitHub releases for versioning
- Tag production releases

## Security Hardening

1. **Enable HTTPS** - Use SSL certificates
2. **Security Headers** - Already configured with Helmet.js
3. **Environment Variables** - Never commit secrets
4. **Database Encryption** - Enable in MongoDB Atlas
5. **Regular Updates** - Keep dependencies updated
6. **Firewall Rules** - Restrict access
7. **Monitoring** - Track suspicious activity

## Performance Optimization

1. **Compression** - Enabled via gzip middleware
2. **Caching** - Redis for data caching
3. **CDN** - For static assets
4. **Database Indexing** - Already configured
5. **Code Splitting** - Done in Vite build
6. **Image Optimization** - Via Cloudinary

---

**Last Updated:** March 2024
**Version:** 1.0.0
