# 🚀 Intern Flow - Setup Guide

Complete guide for running Intern Flow locally and deploying to AWS.

---

## 📋 Table of Contents

1. [Local Development Setup](#local-development-setup)
2. [Environment Configuration](#environment-configuration)
3. [Running the Application](#running-the-application)
4. [Testing Onboarding Invitations Locally](#testing-onboarding-invitations-locally)
5. [AWS Deployment](#aws-deployment)
6. [Troubleshooting](#troubleshooting)

---

## 🖥️ Local Development Setup

### Prerequisites

- Node.js 18+ and npm
- MongoDB (local or Atlas)
- Git

### Step 1: Clone and Install

```bash
# Navigate to project directory
cd "E:\designathon\Intern Flow SaaS Application Design"

# Install frontend dependencies
npm install

# Install backend dependencies
cd backend
npm install
cd ..
```

### Step 2: Configure Environment

```bash
# Copy environment template
cd backend
cp .env.example .env

# Edit .env file with your settings
notepad .env  # or use your preferred editor
```

### Step 3: Configure MongoDB

**Option A: Local MongoDB**
```bash
# Start MongoDB service
# Windows: mongod --dbpath C:\data\db
# Mac/Linux: sudo service mongod start

# In .env:
MONGODB_URI=mongodb://localhost:27017/internflow
```

**Option B: MongoDB Atlas (Cloud)**
1. Create free cluster at https://www.mongodb.com/cloud/atlas
2. Get connection string
3. In .env:
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/internflow
```

### Step 4: Essential Environment Variables

Edit `backend/.env`:

```env
# CRITICAL: Set these for local development
PORT=5000
NODE_ENV=development

# Frontend URL (Vite default port)
FRONTEND_URL=http://localhost:5173
APP_URL=http://localhost:5173

# Backend URL
BACKEND_URL=http://localhost:5000
API_URL=http://localhost:5000

# CORS
CORS_ORIGIN=http://localhost:5173

# MongoDB
MONGODB_URI=mongodb://localhost:27017/internflow

# JWT
JWT_SECRET=dev-secret-key-change-in-production

# Email (Optional for local testing)
ENABLE_EMAIL_QUEUE=false  # Set to false to skip email setup initially

# AI Scoring (Optional)
ENABLE_AI_SCORING=false   # Set to false to skip AI initially
```

---

## 🔧 Environment Configuration

### Frontend Environment Variables

The frontend uses the backend API URL from Vite configuration. Check `vite.config.ts`:

```typescript
export default defineConfig({
  server: {
    port: 5173,  // Frontend port
    proxy: {
      '/api': {
        target: 'http://localhost:5000',  // Backend port
        changeOrigin: true,
      },
    },
  },
});
```

### Backend Environment Variables

All backend config is in `backend/.env`. Key variables:

| Variable | Local Value | AWS Value | Required |
|----------|-------------|-----------|----------|
| `FRONTEND_URL` | `http://localhost:5173` | `https://your-app.com` | ✅ Yes |
| `BACKEND_URL` | `http://localhost:5000` | `https://api.your-app.com` | ✅ Yes |
| `MONGODB_URI` | Local or Atlas | Atlas URI | ✅ Yes |
| `JWT_SECRET` | Any string | Strong random string | ✅ Yes |
| `SMTP_USER` | Your email | Production email | ⚠️  For emails |
| `GROQ_API_KEY` | Your key | Your key | ⚠️  For AI |

---

## 🏃 Running the Application

### Terminal 1: Start Backend

```bash
cd backend
npm run dev

# You should see:
# 📋 Configuration:
# =====================================
# Environment:      development
# Port:             5000
# Frontend URL:     http://localhost:5173
# Backend URL:      http://localhost:5000
# =====================================
```

### Terminal 2: Start Frontend

```bash
# From project root
npm run dev

# You should see:
# VITE v6.3.5  ready in 500 ms
# ➜  Local:   http://localhost:5173/
```

### Access the Application

1. **Frontend:** http://localhost:5173
2. **Backend API:** http://localhost:5000
3. **Health Check:** http://localhost:5000/health

---

## 🧪 Testing Onboarding Invitations Locally

### Method 1: Using Console Logs (Recommended for Local)

Since emails require SMTP setup, the activation link is printed to the console.

**Steps:**

1. **Create a referral** as HR/SuperAdmin
2. **Approve the referral** in the Referrals page
3. **Check the backend terminal** for the activation link:

```bash
[HR Approval] Invitation created, sending email with activation link
[HR Approval] Activation link: http://localhost:5173/onboarding/accept?token=abc123...
```

4. **Copy and paste the link** into your browser
5. **Complete the activation form**

### Method 2: Check Database (Advanced)

```bash
# Connect to MongoDB
mongosh internflow

# Find the invite
db.onboardinginvites.find().sort({createdAt: -1}).limit(1)

# Copy the token value
# Navigate to: http://localhost:5173/onboarding/accept?token=YOUR_TOKEN
```

### Method 3: Setup Email (Production-Like Testing)

**Using Gmail:**

1. Enable 2FA on your Google account
2. Generate App Password: https://myaccount.google.com/apppasswords
3. Update `backend/.env`:

```env
ENABLE_EMAIL_QUEUE=true
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
EMAIL_FROM=your-email@gmail.com
```

4. Restart backend
5. Approve a referral
6. Check email for activation link

---

## ☁️ AWS Deployment

### Architecture Options

**Option 1: Simple (Single EC2)**
- Frontend + Backend on one EC2 instance
- MongoDB Atlas for database
- Nginx as reverse proxy

**Option 2: Recommended (Elastic Beanstalk)**
- Backend on Elastic Beanstalk
- Frontend on S3 + CloudFront
- MongoDB Atlas
- Load balancing included

**Option 3: Advanced (ECS/EKS)**
- Containerized with Docker
- Auto-scaling
- Production-grade

### Deployment Steps (Option 2 - Elastic Beanstalk)

#### 1. Prepare MongoDB Atlas

```bash
# Create production database
1. Go to mongodb.com/cloud/atlas
2. Create new cluster (M0 free or paid)
3. Whitelist IP: 0.0.0.0/0 (or specific IPs)
4. Create database user
5. Get connection string
```

#### 2. Deploy Backend to Elastic Beanstalk

```bash
# Install EB CLI
pip install awsebcli

# Initialize EB
cd backend
eb init -p node.js-18 internflow-api --region us-east-1

# Create environment
eb create internflow-api-prod

# Set environment variables
eb setenv \
  NODE_ENV=production \
  FRONTEND_URL=https://your-app.com \
  MONGODB_URI="your-atlas-uri" \
  JWT_SECRET="your-secure-secret" \
  SMTP_USER="your-email" \
  SMTP_PASSWORD="your-password" \
  CORS_ORIGIN=https://your-app.com

# Deploy
eb deploy

# Get backend URL
eb status
# Note the CNAME: internflow-api-prod.us-east-1.elasticbeanstalk.com
```

#### 3. Deploy Frontend to S3 + CloudFront

```bash
# Build frontend
cd ..
npm run build

# Create S3 bucket
aws s3 mb s3://internflow-frontend --region us-east-1

# Enable static website hosting
aws s3 website s3://internflow-frontend \
  --index-document index.html \
  --error-document index.html

# Upload files
aws s3 sync dist/ s3://internflow-frontend --acl public-read

# Create CloudFront distribution (optional, for HTTPS)
# Follow AWS Console: CloudFront > Create Distribution
# Origin: internflow-frontend.s3-website-us-east-1.amazonaws.com
```

#### 4. Update Environment Variables

After deployment, update URLs:

```bash
# Backend environment
eb setenv \
  FRONTEND_URL=https://d123456.cloudfront.net \
  BACKEND_URL=https://internflow-api-prod.us-east-1.elasticbeanstalk.com

# Redeploy backend
eb deploy
```

#### 5. Update Frontend API URL

Edit `vite.config.ts` for production:

```typescript
export default defineConfig({
  base: '/',
  build: {
    outDir: 'dist',
  },
  define: {
    'import.meta.env.VITE_API_URL': JSON.stringify(
      process.env.VITE_API_URL || 'https://internflow-api-prod.us-east-1.elasticbeanstalk.com'
    ),
  },
});
```

Rebuild and redeploy frontend:

```bash
npm run build
aws s3 sync dist/ s3://internflow-frontend --delete
```

### Custom Domain Setup (Optional)

**Backend:**
1. Get domain (e.g., Route 53)
2. Create SSL certificate (ACM)
3. Configure custom domain in EB
4. Update CNAME: `api.your-app.com` → EB URL

**Frontend:**
1. Point CloudFront to your domain
2. Update SSL certificate
3. Update DNS: `your-app.com` → CloudFront

**Final URLs:**
- Frontend: https://internflow.your-app.com
- Backend: https://api.internflow.your-app.com

Update all `.env` variables with final URLs.

---

## 🔍 Troubleshooting

### Issue: Activation link returns 404

**Cause:** Frontend route not registered or build issue

**Fix:**
```bash
# Check App.tsx has the route
<Route path="/onboarding/accept" element={<OnboardingAccept />} />

# Rebuild frontend
npm run build

# Clear browser cache
Ctrl+Shift+R (Windows/Linux) or Cmd+Shift+R (Mac)
```

### Issue: "Invalid invitation token"

**Cause:** Token not in database or expired

**Fix:**
```bash
# Check MongoDB
mongosh internflow
db.onboardinginvites.find({ token: "YOUR_TOKEN" })

# Check expiration
# If expired > 72 hours, re-approve referral to generate new invite
```

### Issue: CORS errors

**Cause:** Backend not allowing frontend origin

**Fix:**
```bash
# backend/.env
CORS_ORIGIN=http://localhost:5173  # Local
# or
CORS_ORIGIN=https://your-app.com   # Production
```

### Issue: Backend not connecting to frontend

**Cause:** Port mismatch or proxy not working

**Fix:**
```bash
# Check vite.config.ts proxy settings
proxy: {
  '/api': {
    target: 'http://localhost:5000',  # Match backend PORT
    changeOrigin: true,
  },
}

# Check backend port in .env
PORT=5000
```

### Issue: Email not sending

**Cause:** SMTP not configured

**Fix:**
```bash
# For local testing, disable emails:
ENABLE_EMAIL_QUEUE=false

# OR setup Gmail app password (see Testing section)

# Check backend logs for email queue errors
```

### Issue: AI scoring fails

**Cause:** Groq API key not set

**Fix:**
```bash
# Get API key from https://console.groq.com
# backend/.env
GROQ_API_KEY=your-key-here
ENABLE_AI_SCORING=true
```

---

## 📝 Quick Reference

### Local Development URLs

| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| Backend | http://localhost:5000 |
| API Health | http://localhost:5000/health |
| MongoDB | mongodb://localhost:27017 |

### Default Ports

- Frontend (Vite): **5173**
- Backend (Express): **5000**
- MongoDB: **27017**

### Important Files

- Backend config: `backend/.env`
- Frontend config: `vite.config.ts`
- Environment helper: `backend/src/config/environment.js`

### Useful Commands

```bash
# Check backend config
cd backend && node -e "require('./src/config/environment').printConfig()"

# Check MongoDB connection
mongosh internflow --eval "db.stats()"

# View backend logs
cd backend && npm run dev | tee logs.txt

# Build for production
npm run build
cd backend && npm run build  # if backend has build script
```

---

## 🎯 Summary

**For Local Development:**
1. Copy `backend/.env.example` to `backend/.env`
2. Set `FRONTEND_URL=http://localhost:5173`
3. Set `MONGODB_URI` (local or Atlas)
4. Run `npm run dev` (frontend) and `cd backend && npm run dev`
5. Activation links appear in backend console

**For AWS Deployment:**
1. Deploy backend to Elastic Beanstalk
2. Deploy frontend to S3 + CloudFront
3. Update all URLs in environment variables
4. Setup custom domain (optional)
5. Activation links will work via email

**Need Help?**
- Check backend console for config output
- Check MongoDB for invite records
- Check browser network tab for API errors
- Review logs in AWS CloudWatch (production)

---

🚀 **You're all set!** The application now works seamlessly in both local development and AWS production environments.
