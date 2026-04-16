# 🚀 Quick Start - Deploy in 15 Minutes

## What You Need
- Render account (free): https://render.com
- Your GitHub repo is already connected ✅

## 3 Simple Steps

### 1️⃣ Create Database (3 min)
```
Render Dashboard → New + → PostgreSQL
├─ Name: tiyeni-db
├─ Region: Oregon
└─ Plan: Free
```
**📋 Copy the "Internal Database URL"**

### 2️⃣ Deploy API (5 min)
```
Render Dashboard → New + → Web Service
├─ Repo: cvlyx/TIYENI
├─ Name: tiyeni-api
├─ Region: Oregon
└─ Plan: Free
```

**Add Environment Variables:**
Open `.env.render.template` and copy these to Render:
- `NODE_ENV` = production
- `PORT` = 10000
- `DATABASE_URL` = [Paste from step 1]
- `JWT_ACCESS_SECRET` = [From template]
- `JWT_REFRESH_SECRET` = [From template]

### 3️⃣ Initialize Database (2 min)
```
Render Dashboard → tiyeni-api → Shell
Run: cd lib/db && npx drizzle-kit push --config ./drizzle.config.ts
```

## ✅ Test It Works
Open: https://tiyeni-api.onrender.com/api/health

Should see: `{"status":"ok"}` ✨

## 📱 Test Your App
Open your installed APK and try creating an account - it should work now!

## 📚 Need More Details?
- **Step-by-step guide**: `DEPLOYMENT_CHECKLIST.md`
- **Full documentation**: `RENDER_DEPLOYMENT_GUIDE.md`
- **Configuration info**: `BACKEND_STATUS_REPORT.md`

## 🆘 Troubleshooting
- **Build fails**: Check Render logs
- **Health check fails**: Wait 60 seconds (spin-up time)
- **App can't connect**: Verify URL matches in app config

---
**Total time**: ~15 minutes | **Cost**: $0 (Free tier)
