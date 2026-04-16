# 🚀 Render Deployment Guide for Tiyeni API

## Prerequisites
- GitHub account with your code pushed
- Render account (free): https://render.com

## Step-by-Step Deployment

### 1. Create PostgreSQL Database

1. Go to https://dashboard.render.com
2. Click **"New +"** → **"PostgreSQL"**
3. Configure:
   - **Name**: `tiyeni-db`
   - **Database**: `tiyeni`
   - **User**: `tiyeni_user` (auto-generated)
   - **Region**: `Oregon (US West)` (same as your API)
   - **Plan**: **Free**
4. Click **"Create Database"**
5. Wait 2-3 minutes for database to be ready
6. **IMPORTANT**: Copy the **"Internal Database URL"** (starts with `postgresql://`)
   - You'll need this in the next step

### 2. Deploy Backend API

1. Go to https://dashboard.render.com
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository:
   - Click **"Connect account"** if not connected
   - Select your repository: `cvlyx/TIYENI`
4. Configure the service:
   - **Name**: `tiyeni-api`
   - **Region**: `Oregon (US West)`
   - **Branch**: `main`
   - **Root Directory**: Leave empty (uses repo root)
   - **Runtime**: `Node`
   - **Build Command**: 
     ```bash
     npm install -g pnpm && pnpm install --no-frozen-lockfile && pnpm --filter @workspace/api-server run build
     ```
   - **Start Command**:
     ```bash
     node --enable-source-maps ./artifacts/api-server/dist/index.mjs
     ```
   - **Plan**: **Free**

5. Click **"Advanced"** to add environment variables

### 3. Add Environment Variables

Click **"Add Environment Variable"** for each:

#### Required (Must Set):
```
NODE_ENV = production
PORT = 10000
DATABASE_URL = [Paste the Internal Database URL from Step 1]
JWT_ACCESS_SECRET = [Generate random string - see below]
JWT_REFRESH_SECRET = [Generate random string - see below]
```

#### Optional (For Full Features):
```
JWT_ACCESS_TTL_SECONDS = 900
JWT_REFRESH_TTL_SECONDS = 2592000
AT_USERNAME = sandbox
TWILIO_ACCOUNT_SID = [Your Twilio SID - optional for now]
TWILIO_AUTH_TOKEN = [Your Twilio token - optional for now]
TWILIO_VERIFY_SERVICE_SID = [Your Twilio service - optional for now]
PAYCHANGU_SECRET_KEY = [Your PayChangu key - optional for now]
API_BASE_URL = https://tiyeni-api.onrender.com
APP_RETURN_URL = tiyeni://wallet
```

#### Generate JWT Secrets:
Run these commands in your terminal to generate secure random strings:

**Windows PowerShell:**
```powershell
# JWT_ACCESS_SECRET
-join ((65..90) + (97..122) + (48..57) | Get-Random -Count 64 | ForEach-Object {[char]$_})

# JWT_REFRESH_SECRET
-join ((65..90) + (97..122) + (48..57) | Get-Random -Count 64 | ForEach-Object {[char]$_})
```

**Or use this online tool:**
https://generate-secret.vercel.app/64

6. Click **"Create Web Service"**

### 4. Wait for Deployment

- First deployment takes 5-10 minutes
- Watch the logs in real-time
- Look for: `Server listening` message
- Status should change to **"Live"**

### 5. Initialize Database Schema

Once deployed, you need to push the database schema:

**Option A: Using Render Shell (Recommended)**
1. In your Render dashboard, go to your `tiyeni-api` service
2. Click **"Shell"** tab
3. Run:
   ```bash
   cd lib/db
   npx drizzle-kit push --config ./drizzle.config.ts
   ```

**Option B: From Your Local Machine**
1. Copy the DATABASE_URL from Render
2. Run locally:
   ```bash
   cd lib/db
   DATABASE_URL="your-database-url-here" pnpm run push
   ```

### 6. Test Your API

Open these URLs in your browser:

1. **Health Check**: https://tiyeni-api.onrender.com/api/health
   - Should return: `{"status":"ok"}`

2. **Test Registration** (using curl or Postman):
   ```bash
   curl -X POST https://tiyeni-api.onrender.com/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{
       "name": "Test User",
       "username": "testuser",
       "email": "test@example.com",
       "phone": "+265888123456",
       "password": "password123"
     }'
   ```

### 7. Update Mobile App (If URL Changed)

If your Render URL is different from `https://tiyeni-api.onrender.com`, update:

**File**: `artifacts/tiyeni/eas.json`
```json
{
  "build": {
    "base": {
      "env": {
        "EXPO_PUBLIC_API_URL": "https://YOUR-RENDER-URL.onrender.com/api"
      }
    }
  }
}
```

Then rebuild the APK or publish an OTA update.

## 🎯 Your Render URLs

After deployment, you'll have:
- **API URL**: `https://tiyeni-api.onrender.com`
- **Database**: `tiyeni-db.render.com` (internal)
- **Health Check**: `https://tiyeni-api.onrender.com/api/health`

## ⚠️ Important Notes

### Free Tier Limitations:
- **Spins down after 15 minutes of inactivity**
- First request after spin-down takes 30-60 seconds
- 750 hours/month free (enough for one service)
- Database: 90 days retention, then deleted

### Keep Service Awake (Optional):
Use a service like UptimeRobot or Cron-job.org to ping your health endpoint every 10 minutes:
- URL to ping: `https://tiyeni-api.onrender.com/api/health`
- Interval: Every 10 minutes

### Monitoring:
- View logs in Render dashboard
- Set up email alerts for failures
- Monitor database usage

## 🐛 Troubleshooting

### Build Fails:
- Check build logs in Render dashboard
- Verify pnpm workspace configuration
- Ensure all dependencies are in package.json

### Database Connection Error:
- Verify DATABASE_URL is correct
- Check database is in same region
- Use "Internal Database URL" not "External"

### Health Check Fails:
- Check logs for errors
- Verify PORT is set to 10000
- Ensure health route is `/api/health`

### App Can't Connect:
- Verify API URL in app matches Render URL
- Check CORS is enabled (already configured)
- Test with curl first

## 📞 Need Help?

1. Check Render logs: Dashboard → Your Service → Logs
2. Check database status: Dashboard → tiyeni-db
3. Test endpoints with curl or Postman
4. Review error messages in logs

## ✅ Deployment Checklist

- [ ] PostgreSQL database created
- [ ] Database URL copied
- [ ] Web service created
- [ ] All environment variables added
- [ ] JWT secrets generated and added
- [ ] Service deployed successfully
- [ ] Database schema pushed
- [ ] Health check returns `{"status":"ok"}`
- [ ] Test registration endpoint works
- [ ] Mobile app updated with correct URL (if needed)

Once all checkboxes are complete, your backend is live! 🎉
