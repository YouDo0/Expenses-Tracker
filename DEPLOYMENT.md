# Koyeb Deployment Guide

This guide explains how to deploy the Expenses Tracker Telegram bot to Koyeb for 24/7 operation.

## Prerequisites

1. **GitHub Account** - Your code must be on GitHub
2. **Koyeb Account** - Sign up at [koyeb.com](https://www.koyeb.com)
3. **Telegram Bot Token** - From [@BotFather](https://t.me/botfather)
4. **Supabase Account** - Sign up at [supabase.com](https://supabase.com) (free tier available)

## Step 1: Create Telegram Bot

1. Open Telegram and search for `@BotFather`
2. Send `/newbot` and follow the prompts
3. Copy the bot token (looks like `123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ`)
4. (Optional) Set commands with `/setcommands`

## Step 2: Set Up Supabase Database

1. **Create a Supabase account**:
   - Go to [supabase.com](https://supabase.com)
   - Sign up (GitHub login recommended)

2. **Create a new project**:
   - Click **New Project**
   - Enter project details:
     - **Name**: `expenses-tracker` (or any name)
     - **Database Password**: Generate a strong password (save it!)
     - **Region**: Choose nearest to your users (or same as Koyeb region)
   - Click **Create new project**
   - Wait for the project to be provisioned (~1-2 minutes)

3. **Get your database connection string**:
   - Go to **Project Settings** (gear icon) → **Database**
   - Scroll down to **Connection Info**
   - Find **Connection string** dropdown → select **Node.js** (or "URI")
   - Copy the connection string, it looks like:
     ```
     postgresql://postgres:[YOUR-PASSWORD]@db.xxx.supabase.co:5432/postgres
     ```

4. **Optional: Set up database schema via Supabase dashboard**:
   - Go to **SQL Editor** in the left sidebar
   - You can run queries directly here instead of using `npm run db:setup`
   - Or use the **Table Editor** to view/edit data visually

## Step 3: Push Code to GitHub

```bash
# Initialize git if not already done
git init
git add .
git commit -m "Initial commit"

# Create repository on GitHub first, then:
git remote add origin https://github.com/YOUR_USERNAME/expenses-tracker.git
git branch -M main
git push -u origin main
```

## Step 4: Deploy to Koyeb

### Create the App

1. Go to [Koyeb Dashboard](https://app.koyeb.com)
2. Click **Apps** → **Create App**
3. Select **Git** as deployment source
4. Choose **GitHub** and authorize if needed
5. Select your `expenses-tracker` repository
6. Configure:

   **Basic Settings:**
   - Name: `expenses-tracker`
   - Region: Choose nearest to your users

   **Build Settings:**
   - Build command: `npm install`
   - Build context: `/` (root)

   **Run Settings:**
   - Start command: `npm start`
   - Port: (not needed for this bot)

7. **Environment Variables** (click **Add Variable** for each):
   - `NODE_ENV` = `production`
   - `DATABASE_URL` = (your Supabase connection string from Step 2.3)
   - `TELEGRAM_BOT_TOKEN` = (your bot token from BotFather)
   - `LOG_LEVEL` = `info` (optional)

8. Click **Deploy**

## Step 5: Initialize Database

### Option A: Via Supabase Dashboard (Recommended)

1. Go to your Supabase project
2. Click **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy the contents of `src/database/schema.sql` from your repository
5. Paste and click **Run** to create all tables

### Option B: Via Koyeb Terminal

1. Go to your app in Koyeb Dashboard
2. Click on the deployment
3. Click **Terminal** (or use SSH)
4. Run:
   ```bash
   npm run db:setup
   ```

## Step 6: Test Your Bot

1. Open Telegram
2. Search for your bot by name
3. Send a message like: `Spent $10 on coffee`
4. You should get a response!

## Managing Your Deployment

### View Logs

```bash
# In Koyeb Dashboard, go to your app → Logs
# Or via Koyeb CLI:
koyeb logs expenses-tracker
```

### Redeploy

Push new code to GitHub and Koyeb auto-deploys, or:
- Dashboard: App → **Redeploy**
- CLI: `koyeb redeploy expenses-tracker`

### Update Environment Variables

1. Go to App → **Settings** → **Environment Variables**
2. Modify the variable
3. **Save** and the app restarts automatically

## Scaling & High Availability

For production, consider:

1. **Enable Health Checks** - Koyeb can restart failed instances
2. **Add Regions** - Deploy closer to users globally
3. **Backup Database** - Regular PostgreSQL backups

## Troubleshooting

### Bot Not Responding

1. Check logs for errors
2. Verify `TELEGRAM_BOT_TOKEN` is correct
3. Ensure database connection is valid
4. Check that database schema is initialized (`npm run db:setup`)

### Database Connection Errors

- Verify `DATABASE_URL` format from Supabase: `postgresql://postgres:[YOUR-PASSWORD]@db.xxx.supabase.co:5432/postgres`
- Make sure you replaced `[YOUR-PASSWORD]` with your actual database password
- Check that your Supabase project is active (not paused)
- Verify the database region is accessible from Koyeb

### App Keeps Restarting

- Check logs for uncaught errors
- Verify all dependencies are in `package.json`
- Ensure `npm start` command works locally

## Cost Optimization

- Koyeb's free tier includes 512MB RAM and shared CPU
- For a Telegram bot, this is usually sufficient
- Monitor usage in dashboard and upgrade if needed

## Security Best Practices

1. **Never commit** `.env` file to Git
2. Use strong PostgreSQL passwords
3. Rotate bot tokens if compromised
4. Keep dependencies updated (`npm audit fix`)
5. Set up database backups

## Alternative: Docker Deployment

If you prefer Docker, Koyeb supports it:

```dockerfile
# Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
CMD ["npm", "start"]
```

Then choose **Docker** as deployment type in Koyeb.
