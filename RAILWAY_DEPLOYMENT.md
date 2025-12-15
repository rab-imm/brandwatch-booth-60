# Railway Deployment Guide

This guide will help you deploy the UAE Legal Assistant application to Railway.

## Prerequisites

1. A [Railway account](https://railway.app/) (sign up with GitHub for easier integration)
2. The Railway CLI installed (optional but recommended):
   ```bash
   npm install -g @railway/cli
   ```
3. Your Supabase credentials ready

## Quick Deploy (Via GitHub)

### Step 1: Push to GitHub

1. Make sure your code is committed:
   ```bash
   git add .
   git commit -m "Add Railway deployment configuration"
   git push origin main
   ```

### Step 2: Deploy on Railway

1. Go to [Railway Dashboard](https://railway.app/dashboard)
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Choose this repository
5. Railway will auto-detect the Dockerfile and start building

### Step 3: Configure Environment Variables

In the Railway dashboard, go to your project and add these environment variables:

```
VITE_SUPABASE_PROJECT_ID=your_project_id
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your_anon_key
```

**Important:** Do NOT commit your `.env` file. Railway will use the environment variables you set in the dashboard.

### Step 4: Configure Domain (Optional)

1. In Railway dashboard, go to your service
2. Click on **"Settings"**
3. Under **"Networking"**, click **"Generate Domain"**
4. Railway will provide a free subdomain like `yourapp.up.railway.app`
5. Optionally, add your custom domain

## Deploy via Railway CLI

### Step 1: Login

```bash
railway login
```

### Step 2: Initialize Project

```bash
railway init
```

Select "Create a new project" and give it a name.

### Step 3: Link to Project

```bash
railway link
```

### Step 4: Add Environment Variables

```bash
railway variables set VITE_SUPABASE_PROJECT_ID=your_project_id
railway variables set VITE_SUPABASE_URL=https://your-project.supabase.co
railway variables set VITE_SUPABASE_PUBLISHABLE_KEY=your_anon_key
```

### Step 5: Deploy

```bash
railway up
```

Railway will build your Docker container and deploy it.

## Deployment Architecture

```
┌─────────────────────────────────────────┐
│         Railway Platform                │
├─────────────────────────────────────────┤
│  ┌───────────────────────────────────┐  │
│  │  Docker Container                 │  │
│  │  ┌─────────────────────────────┐  │  │
│  │  │  Nginx (Port 8080)          │  │  │
│  │  │  ┌─────────────────────┐    │  │  │
│  │  │  │  React App (SPA)    │    │  │  │
│  │  │  │  - Vite Build       │    │  │  │
│  │  │  │  - Static Assets    │    │  │  │
│  │  │  └─────────────────────┘    │  │  │
│  │  └─────────────────────────────┘  │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
                 ↓
        Public Railway URL
                 ↓
    ┌─────────────────────────┐
    │  Supabase Backend       │
    │  - PostgreSQL           │
    │  - Edge Functions       │
    │  - Authentication       │
    │  - Storage              │
    └─────────────────────────┘
```

## Configuration Files

### Dockerfile
Multi-stage build that:
1. Builds the React app with Vite
2. Serves it with Nginx on port 8080

### nginx.conf
Configured for:
- SPA routing (all routes serve index.html)
- Gzip compression
- Static asset caching
- Security headers
- Health check endpoint at `/health`

### railway.toml
Railway-specific configuration:
- Docker build settings
- Health check configuration
- Restart policies

### .dockerignore
Excludes unnecessary files from Docker build:
- node_modules
- .env files
- Documentation
- Git files

## Monitoring & Logs

### View Logs
```bash
railway logs
```

Or view in the Railway dashboard under your service.

### Health Check
Railway will automatically monitor the `/health` endpoint. If it fails, the service will restart.

### Metrics
View CPU, memory, and network usage in the Railway dashboard.

## Updating Your Deployment

### Automatic Deployments (GitHub)
Railway will automatically redeploy when you push to your connected branch:
```bash
git add .
git commit -m "Update feature"
git push origin main
```

### Manual Deployment (CLI)
```bash
railway up
```

## Troubleshooting

### Build Fails
1. Check Railway logs: `railway logs`
2. Verify your Dockerfile builds locally:
   ```bash
   docker build -t test-build .
   docker run -p 8080:8080 test-build
   ```

### App Not Loading
1. Check environment variables are set correctly in Railway dashboard
2. Verify Supabase URL and keys are correct
3. Check browser console for errors

### 404 Errors on Refresh
This should be handled by the nginx.conf. If you still see 404s:
1. Verify nginx.conf is copied correctly in Dockerfile
2. Check Railway logs for nginx errors

### Environment Variables Not Working
1. Make sure variables start with `VITE_` (required by Vite)
2. Redeploy after adding/changing variables
3. Variables are injected at build time, not runtime

## Cost Estimation

Railway pricing (as of 2024):
- **Hobby Plan:** $5/month for 500 execution hours
- **Free Trial:** $5 credit to start
- **Pro Plan:** $20/month for better resources

This static app should consume minimal resources.

## Security Considerations

1. **Never commit** `.env` files or secrets to Git
2. Use Railway's environment variables for all sensitive data
3. The Supabase publishable/anon key is safe to expose (protected by RLS)
4. Consider enabling Railway's WAF for additional security

## Support

- [Railway Documentation](https://docs.railway.app/)
- [Railway Discord](https://discord.gg/railway)
- [Railway Status](https://status.railway.app/)

## Next Steps

After deployment:
1. Test all functionality on the Railway URL
2. Configure custom domain if needed
3. Set up monitoring alerts
4. Configure CD/CI pipelines if desired
5. Review Railway usage dashboard regularly

---

**Note:** This deployment uses Supabase for the backend, so you don't need to deploy any server-side code to Railway. The Edge Functions run on Supabase's infrastructure.
