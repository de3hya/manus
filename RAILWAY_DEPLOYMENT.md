# Railway Deployment Guide

This guide will help you deploy the Accounting & Inventory Management app to Railway.

## Prerequisites

1. GitHub account with the repository pushed
2. Railway account (https://railway.app)

## Step-by-Step Deployment

### 1. Push Code to GitHub

```bash
git remote add origin <your-github-repo-url>
git push -u origin master
```

### 2. Create Railway Project

1. Go to https://railway.app/dashboard
2. Click "New Project"
3. Select "Deploy from GitHub"
4. Connect your GitHub account and select this repository

### 3. Add PostgreSQL Service

1. In Railway dashboard, click "Add Service" or "+"
2. Select "PostgreSQL"
3. Railway will automatically create a PostgreSQL database
4. Note the generated `DATABASE_URL` from the PostgreSQL service variables

### 5. Configure Backend Service

1. Click "Add Service" → "GitHub Repo"
2. Select this repository
3. Railway will auto-detect the Node.js project
4. Go to the service settings and add environment variables:

```
DATABASE_URL=<copy from PostgreSQL service>
JWT_SECRET=generate-a-random-secret-key-here
NODE_ENV=production
PORT=3000
```

5. Set the start command:
```
npm run start
```

6. Set the build command:
```
npm run build
```

7. Wait for deployment to complete

### 6. Configure Frontend Service (Optional - for separate frontend)

If you want to deploy frontend separately:

1. Click "Add Service" → "GitHub Repo"
2. Select this repository
3. Add environment variable:
```
VITE_API_URL=https://<backend-railway-url>/api
```

4. Set build command:
```
npm --prefix frontend run build
```

5. Set start command:
```
npm --prefix frontend run preview
```

### 7. Connect Services

1. In the backend service, add environment variable:
```
VITE_API_URL=http://localhost:3000/api
```

2. Railway will automatically handle inter-service communication

### 8. Deploy

1. Railway will automatically deploy when you push to GitHub
2. Check the deployment logs in the Railway dashboard
3. Once deployment is complete, click "View Deployment" to see your live app

## Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/db` |
| `JWT_SECRET` | Secret key for JWT signing | `your-random-secret-key` |
| `NODE_ENV` | Environment mode | `production` |
| `PORT` | Server port | `3000` |
| `VITE_API_URL` | Frontend API endpoint | `https://your-app.railway.app/api` |

## Troubleshooting

### Build Fails

- Check the build logs in Railway dashboard
- Ensure all dependencies are listed in package.json
- Verify Node.js version compatibility

### Database Connection Error

- Verify `DATABASE_URL` is correctly set
- Ensure PostgreSQL service is running
- Check database credentials

### API Not Responding

- Verify backend service is running
- Check environment variables are set correctly
- Review application logs in Railway dashboard

## Monitoring

1. Go to Railway dashboard
2. Select your project
3. View logs, metrics, and deployment history
4. Set up alerts for errors or downtime

## Custom Domain

1. In Railway project settings, go to "Domains"
2. Click "Add Domain"
3. Enter your custom domain
4. Follow DNS configuration instructions

## Scaling

1. In Railway service settings, adjust:
   - CPU/Memory allocation
   - Number of replicas
   - Auto-scaling rules

## Support

For Railway-specific issues, visit: https://railway.app/docs
