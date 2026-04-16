# 🚀 Tiyeni Deployment Checklist

## Quick Start (15 minutes)

### Phase 1: Database Setup (3 minutes)
- [ ] Go to https://dashboard.render.com
- [ ] Click "New +" → "PostgreSQL"
- [ ] Name: `tiyeni-db`
- [ ] Region: `Oregon (US West)`
- [ ] Plan: `Free`
- [ ] Click "Create Database"
- [ ] **Copy "Internal Database URL"** (you'll need this next)

### Phase 2: Deploy API (5 minutes)
- [ ] Click "New +" → "Web Service"
- [ ] Connect GitHub repo: `cvlyx/TIYENI`
- [ ] Name: `tiyeni-api`
- [ ] Region: `Oregon (US West)`
- [ ] Branch: `main`
- [ ] Build Command: `npm install -g pnpm && pnpm install --no-frozen-lockfile && pnpm --filter @workspace/api-server run build`
- [ ] Start Command: `node --enable-source-maps ./artifacts/api-server/dist/index.mjs`
- [ ] Plan: `Free`

### Phase 3: Environment Variables (3 minutes)
Click "Advanced" and add these variables (copy from `.env.render.template`):

**Required:**
- [ ] `NODE_ENV` = `production`
- [ ] `PORT` = `10000`
- [ ] `DATABASE_URL` = [Paste from Phase 1]
- [ ] `JWT_ACCESS_SECRET` = [From .env.render.template]
- [ ] `JWT_REFRESH_SECRET` = [From .env.render.template]

**Optional (add now or later):**
- [ ] `JWT_ACCESS_TTL_SECONDS` = `900`
- [ ] `JWT_REFRESH_TTL_SECONDS` = `2592000`
- [ ] `AT_USERNAME` = `sandbox`
- [ ] `API_BASE_URL` = `https://tiyeni-api.onrender.com`
- [ ] `APP_RETURN_URL` = `tiyeni://wallet`

- [ ] Click "Create Web Service"

### Phase 4: Wait for Build (5-10 minutes)
- [ ] Watch logs in Render dashboard
- [ ] Wait for "Server listening" message
- [ ] Status changes to "Live"

### Phase 5: Initialize Database (2 minutes)
- [ ] In Render dashboard, go to `tiyeni-api` service
- [ ] Click "Shell" tab
- [ ] Run: `cd lib/db && npx drizzle-kit push --config ./drizzle.config.ts`
- [ ] Wait for "Schema pushed successfully"

### Phase 6: Test API (1 minute)
- [ ] Open: https://tiyeni-api.onrender.com/api/health
- [ ] Should see: `{"status":"ok"}`
- [ ] If yes, **YOU'RE DONE!** 🎉

### Phase 7: Test Mobile App
- [ ] Open your installed APK
- [ ] Try to create an account
- [ ] Should work now! (OTP will be in dev mode without Twilio)

## 🐛 If Something Goes Wrong

### Build Fails
1. Check logs in Render dashboard
2. Look for error messages
3. Common issues:
   - Missing dependencies
   - Build command typo
   - Wrong Node version

### Health Check Fails
1. Check if service is "Live"
2. View logs for errors
3. Verify PORT is set to 10000
4. Check DATABASE_URL is correct

### Database Connection Error
1. Verify DATABASE_URL is the "Internal" URL
2. Check database is in same region (Oregon)
3. Ensure database is "Available"

### App Still Can't Connect
1. Wait 30-60 seconds (free tier spin-up time)
2. Check API URL in app matches Render URL
3. Try health check URL in browser first
4. Check Render service logs for errors

## 📱 After Deployment

### Rebuild Mobile App (Optional)
If you want to publish an OTA update:
```bash
cd artifacts/tiyeni
npx eas-cli update --branch preview --message "Backend is now live"
```

Or rebuild APK:
```bash
npx eas-cli build --platform android --profile preview
```

### Monitor Your Service
- Check logs regularly: Render Dashboard → tiyeni-api → Logs
- Set up email alerts: Settings → Notifications
- Monitor database usage: tiyeni-db → Metrics

### Keep Service Awake (Optional)
Free tier spins down after 15 minutes. To keep it awake:
1. Use UptimeRobot (free): https://uptimerobot.com
2. Add monitor: `https://tiyeni-api.onrender.com/api/health`
3. Check interval: Every 10 minutes

## ✅ Success Criteria

You're done when:
- ✅ Health check returns `{"status":"ok"}`
- ✅ Mobile app can create accounts
- ✅ Login works
- ✅ Can post trips/parcels
- ✅ No errors in Render logs

## 🎯 Current Status

Your deployment URL will be:
- **API**: https://tiyeni-api.onrender.com
- **Health**: https://tiyeni-api.onrender.com/api/health
- **Database**: Internal only (not publicly accessible)

## 📞 Need Help?

1. Check `RENDER_DEPLOYMENT_GUIDE.md` for detailed steps
2. Check `BACKEND_STATUS_REPORT.md` for configuration details
3. Review Render logs for specific errors
4. Check database connection in Render dashboard

---

**Time to complete**: ~15 minutes
**Cost**: $0 (Free tier)
**Next steps**: Test app, add payment/SMS services later
