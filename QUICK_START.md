# ⚡ Intern Flow - Quick Start Guide

Get Intern Flow running in 5 minutes!

---

## 🏃 Local Development (5 Minutes)

### Step 1: Setup Environment (1 min)

```bash
# Backend environment
cd backend
cp .env.example .env

# Edit backend/.env - Minimum required:
# FRONTEND_URL=http://localhost:5173
# MONGODB_URI=mongodb://localhost:27017/internflow
# (or use MongoDB Atlas URI)
```

### Step 2: Install Dependencies (2 min)

```bash
# From project root
npm install

# Backend dependencies
cd backend
npm install
cd ..
```

### Step 3: Start Services (2 min)

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev

# ✅ Should see:
# 🚀 Intern Flow backend started successfully!
# 📋 Configuration displayed
# 💡 Activation links will appear in console logs
```

**Terminal 2 - Frontend:**
```bash
npm run dev

# ✅ Should see:
# VITE ready
# ➜ Local: http://localhost:5173/
```

### Step 4: Access Application

Open browser: **http://localhost:5173**

---

## 🧪 Testing Onboarding Invitations Locally

**The activation links appear in the backend console!**

1. **Login** as HR user (or create one via Register page with role HR)
2. **Create a referral** in the Referrals page
3. **Approve the referral** (click Approve button)
4. **Check the backend terminal** - You'll see:
   ```
   [HR Approval] Activation link: http://localhost:5173/onboarding/accept?token=abc123...
   ```
5. **Copy the link** and paste it in your browser
6. **Complete the activation form** - create password and submit
7. **Login** with the activated account

---

## ✅ Check Your Configuration

```bash
cd backend
node check-env.js

# This will validate your .env file and show any issues
```

---

## 🔧 Common Issues & Fixes

### Issue: "Cannot connect to MongoDB"

**Fix:**
```bash
# Option 1: Use MongoDB Atlas (free cloud database)
# 1. Go to mongodb.com/cloud/atlas
# 2. Create free cluster
# 3. Get connection string
# 4. Update backend/.env:
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/internflow

# Option 2: Install MongoDB locally
# Windows: https://www.mongodb.com/try/download/community
# Mac: brew install mongodb-community
# Start: mongod --dbpath /path/to/data
```

### Issue: "Port 5173 already in use"

**Fix:**
```bash
# Kill the process using the port
# Windows:
netstat -ano | findstr :5173
taskkill /PID <PID> /F

# Mac/Linux:
lsof -ti:5173 | xargs kill -9

# Or change the port in vite.config.ts
```

### Issue: "CORS error"

**Fix:**
```bash
# backend/.env - Make sure CORS matches frontend
CORS_ORIGIN=http://localhost:5173
```

### Issue: "Activation link not working"

**Fix:**
- Check the link is complete (should start with http://localhost:5173/onboarding/accept?token=...)
- Check the route exists in App.tsx: `/onboarding/accept`
- Clear browser cache: Ctrl+Shift+R
- Check token hasn't expired (72 hours)

---

## 📚 Full Documentation

- **Complete Setup Guide:** [SETUP_GUIDE.md](./SETUP_GUIDE.md)
- **AWS Deployment:** See SETUP_GUIDE.md → AWS Deployment section
- **Environment Variables:** See `backend/.env.example` for all options

---

## 🌐 Default URLs

| Service | Local | Production |
|---------|-------|------------|
| Frontend | http://localhost:5173 | Your CloudFront/domain |
| Backend | http://localhost:5000 | Your EB/API domain |
| Health Check | http://localhost:5000/health | Your API/health |

---

## 🎯 First-Time Setup Checklist

- [ ] MongoDB running (local or Atlas)
- [ ] `backend/.env` created from `.env.example`
- [ ] `FRONTEND_URL=http://localhost:5173` in backend/.env
- [ ] `MONGODB_URI` set in backend/.env
- [ ] Dependencies installed (`npm install` in root and backend)
- [ ] Backend running on port 5000
- [ ] Frontend running on port 5173
- [ ] Can access http://localhost:5173
- [ ] Can login/register

---

## 🔐 Test Accounts

Create via Register page:
- **HR User:** Role = HR, Email = hr@internflowsystem.com (or any @internflowsystem email)
- **Candidate:** Role = Candidate, Any email

---

## 🚀 Production Deployment

**Quick AWS Deploy:**

1. **Setup MongoDB Atlas** (free tier works)
2. **Deploy Backend** to Elastic Beanstalk
3. **Deploy Frontend** to S3 + CloudFront
4. **Update all URLs** in backend/.env:
   ```bash
   FRONTEND_URL=https://your-app.com
   BACKEND_URL=https://api.your-app.com
   CORS_ORIGIN=https://your-app.com
   NODE_ENV=production
   ```

See [SETUP_GUIDE.md](./SETUP_GUIDE.md) for detailed AWS deployment instructions.

---

## 💡 Pro Tips

1. **Activation Links:** Always check backend console for links in local dev
2. **Email Setup:** Not required for local testing (links appear in console)
3. **AI Scoring:** Set `ENABLE_AI_SCORING=false` to skip Groq API setup initially
4. **Database:** Use MongoDB Atlas free tier for zero local setup

---

## 🆘 Need Help?

1. **Check backend console** for configuration output on startup
2. **Run:** `cd backend && node check-env.js`
3. **Check:** Backend logs for detailed error messages
4. **Review:** [SETUP_GUIDE.md](./SETUP_GUIDE.md) for detailed troubleshooting

---

**Happy coding! 🎉**
