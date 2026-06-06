# Troubleshooting Guide

## Common Issues and Solutions

### Backend Issues

#### MongoDB Connection Error

**Error:** `MongooseError: Unable to connect to MongoDB`

**Solutions:**
1. Check MongoDB connection string in `.env`
2. Verify IP whitelist in MongoDB Atlas
3. Ensure MongoDB credentials are correct
4. Check network connectivity: `ping cluster0.xxxxx.mongodb.net`
5. Verify cluster is running in MongoDB Atlas

```bash
# Test connection
mongo "mongodb+srv://user:password@cluster.mongodb.net/dbname"
```

#### Redis Connection Error

**Error:** `Error: Redis connection refused`

**Solutions:**
1. Start Redis server: `redis-server` (or check if running)
2. Verify Redis URL in `.env`: `redis://localhost:6379`
3. Check if port 6379 is accessible
4. Ensure Redis credentials are correct (if using auth)

```bash
# Test Redis connection
redis-cli ping  # Should return PONG
```

#### Port Already in Use

**Error:** `Error: listen EADDRINUSE: address already in use :::5000`

**Solutions:**

```bash
# Windows - Find process using port 5000
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Mac/Linux
lsof -i :5000
kill -9 <PID>

# Change port in .env
PORT=5001
```

#### JWT Token Errors

**Error:** `JsonWebTokenError: invalid token`

**Solutions:**
1. Verify JWT_SECRET in `.env` is correct
2. Check token expiration
3. Ensure Authorization header format: `Bearer <token>`
4. Regenerate token by logging in again

```bash
# Decode JWT (online tool or CLI)
echo "token_here" | base64 -d
```

#### Firebase Configuration Error

**Error:** `firebase.initializeApp is not a function`

**Solutions:**
1. Verify Firebase configuration in `config/firebase.js`
2. Check if service account JSON is valid
3. Ensure environment variables are set
4. Restart development server after env changes

#### Email/Nodemailer Issues

**Error:** `Error: Invalid login: 535-5.7.8 Username and password not accepted`

**Solutions:**
1. Use app-specific password for Gmail (not regular password)
2. Enable "Less secure app access" (if not using app password)
3. Verify email address in `EMAIL_USER`
4. Check email service configuration

```env
# For Gmail with 2FA
EMAIL_USER=youremail@gmail.com
EMAIL_PASS=your-16-character-app-password
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
```

### Frontend Issues

#### API Calls Returning 404

**Error:** `Failed to fetch /api/endpoint`

**Solutions:**
1. Verify backend is running: `curl http://localhost:5000/api/health`
2. Check API URL in `.env`: `VITE_API_URL=http://localhost:5000/api`
3. Verify endpoint exists in backend
4. Check CORS configuration in server.js

#### Socket.IO Connection Failed

**Error:** `WebSocket is closed before the connection is established`

**Solutions:**
1. Ensure backend Socket.IO is running
2. Check Socket URL in `.env`: `VITE_SOCKET_URL=http://localhost:5000`
3. Verify CORS settings allow Socket.IO
4. Check browser console for CORS errors

#### Vite Build Errors

**Error:** `error during build: SyntaxError: Unexpected token`

**Solutions:**
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear Vite cache
rm -rf .vite
npm run build

# Check for syntax errors
npm run lint
```

#### Environment Variables Not Loading

**Error:** `VITE_API_URL is undefined`

**Solutions:**
1. Ensure `.env` file exists in frontend root
2. Restart dev server after adding env vars
3. Use `VITE_` prefix for frontend env vars
4. Check `.env` file is not in .gitignore

```bash
# Verify env vars are loaded
console.log(import.meta.env.VITE_API_URL)
```

#### Import/Module Not Found

**Error:** `Failed to resolve '@/components/Button'`

**Solutions:**
1. Check path aliases in `vite.config.js`
2. Verify file exists and path is correct
3. Check file extension (.js, .jsx, .ts, .tsx)
4. Clear node_modules: `rm -rf node_modules && npm install`

### Docker Issues

#### Container Won't Start

**Error:** `docker-compose: command not found` or container exits immediately

**Solutions:**
```bash
# Check Docker daemon is running
docker ps

# Check logs
docker-compose logs <service-name>

# Rebuild images
docker-compose build --no-cache

# Start with verbose output
docker-compose up --verbose
```

#### Port Conflicts

**Error:** `Cannot start service: Ports are not available`

**Solutions:**
```bash
# Stop all running containers
docker-compose down

# Remove conflicting containers
docker container rm <container-name>

# Use different ports in docker-compose.yml
# Change port mapping: "5001:5000"
```

### Deployment Issues

#### Build Fails on Deployment

**Solutions:**
1. Check build command in deployment config
2. Verify all dependencies installed
3. Check environment variables set
4. Review build logs from deployment platform

#### Application Crashes After Deployment

**Error:** App starts then crashes with error

**Solutions:**
1. Check application logs on deployment platform
2. Verify environment variables are set
3. Test with production build locally
4. Check database connectivity
5. Review error tracking service (Sentry, etc.)

```bash
# Test production build locally
npm run build
npm start
```

#### Slow Performance in Production

**Solutions:**
1. Enable caching headers
2. Enable compression
3. Optimize images with Cloudinary
4. Use CDN for static assets
5. Implement database query optimization
6. Monitor with performance tools

### Development Environment Issues

#### Port Conflicts in Development

**Solutions:**
```bash
# Check what's using port 3000
lsof -i :3000

# Or change frontend port in vite.config.js
# server: { port: 5173 }
```

#### Node Version Mismatch

**Error:** `npm ERR! engines.node: Wanted: {"node":">=18.0.0"} (current: {"node":"16.13.0"})`

**Solutions:**
```bash
# Check Node version
node --version

# Update Node using nvm
nvm use 18
nvm install 18

# Or use .nvmrc
nvm use $(cat .nvmrc)
```

#### npm Package Issues

**Error:** `npm ERR! peer dep missing`

**Solutions:**
```bash
# Clear cache and reinstall
npm cache clean --force
rm -rf node_modules package-lock.json
npm install

# Install missing peer dependencies
npm install <package-name>

# Check for outdated packages
npm outdated
```

### Git Issues

#### Unable to Push Changes

**Error:** `Permission denied (publickey)`

**Solutions:**
```bash
# Generate SSH key
ssh-keygen -t rsa -b 4096 -C "your@email.com"

# Add to GitHub
cat ~/.ssh/id_rsa.pub  # Copy and add to GitHub settings

# Test connection
ssh -T git@github.com
```

#### Merge Conflicts

**Solutions:**
```bash
# Pull latest
git pull origin main

# Fix conflicts in editor
# Then stage and commit
git add .
git commit -m "Resolve merge conflicts"
```

### Performance Issues

#### Slow API Response Times

**Diagnosis:**
```bash
# Check backend logs for slow queries
grep "duration" logs/app.log

# Monitor database
use admin
db.setProfilingLevel(1, { slowms: 100 })
```

**Solutions:**
1. Add database indexes
2. Optimize queries
3. Implement caching
4. Increase server resources
5. Use read replicas for read-heavy operations

#### High Memory Usage

**Solutions:**
```bash
# Monitor memory
node --max-old-space-size=4096 server.js

# Check for memory leaks
node --inspect server.js
# Then use Chrome DevTools

# Restart application regularly
# (use PM2 or Docker restart policy)
```

## Getting Help

### Debug Steps

1. **Check logs** - Application and system logs
2. **Verify configuration** - All settings in .env
3. **Test connectivity** - Can I reach dependent services?
4. **Search GitHub issues** - Similar problem reported?
5. **Check documentation** - See relevant docs
6. **Test in isolation** - Reproduce minimal example
7. **Ask for help** - GitHub Issues or discussions

### Reporting Issues

Include:
- Error message and stack trace
- Steps to reproduce
- Environment (OS, Node version, etc.)
- What you've already tried
- Expected vs actual behavior

### Resources

- GitHub Issues: https://github.com/Nicgott99/Premium-Sports-Field-Booking-Platform/issues
- MongoDB Docs: https://docs.mongodb.com
- Express Docs: https://expressjs.com
- React Docs: https://react.dev
- Vite Docs: https://vitejs.dev

---

**Last Updated:** March 2024
**Version:** 1.0.0
