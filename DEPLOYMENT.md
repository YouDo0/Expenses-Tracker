# Deployment Guide

This guide explains how to deploy the Expenses Tracker Telegram bot on your own VPS for 24/7 operation.

Unlike WhatsApp-based bots, Telegram bots don't require session persistence or QR code scanning, making deployment simpler and more reliable. The bot uses polling — no webhook setup is needed.

## Prerequisites

1. **VPS** — Ubuntu/Debian server with SSH access
2. **Telegram Bot Token** — From [@BotFather](https://t.me/botfather)
3. **Domain (optional)** — If you want to access logs via web

## Step 1: Create Telegram Bot

1. Open Telegram and search for `@BotFather`
2. Send `/newbot` and follow the prompts
3. Copy the bot token (looks like `123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ`)
4. (Optional) Set commands with `/setcommands`

## Step 2: Prepare Your VPS

### Install Node.js 18+

```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
node -v  # Verify installation
```

### Install PostgreSQL

```bash
sudo apt-get install -y postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### Create Database & User

```bash
sudo -u postgres psql
```

Inside the PostgreSQL shell:

```sql
CREATE USER expenses_user WITH PASSWORD 'your_strong_password';
CREATE DATABASE expenses_tracker OWNER expenses_user;
GRANT ALL PRIVILEGES ON DATABASE expenses_tracker TO expenses_user;
\q
```

Your `DATABASE_URL` will be:
```
postgresql://expenses_user:your_strong_password@localhost:5432/expenses_tracker
```

## Step 3: Deploy the Application

### Clone & Install

```bash
cd /home/$USER
git clone <repository-url> expenses-tracker
cd expenses-tracker
npm install
```

### Configure Environment

```bash
cp .env.example .env
nano .env
```

Set the following variables:

```env
TELEGRAM_BOT_TOKEN=your-bot-token-from-botfather
DATABASE_URL=postgresql://expenses_user:your_strong_password@localhost:5432/expenses_tracker
NODE_ENV=production
LOG_LEVEL=info
```

### Initialize Database Schema

```bash
npm run db:setup
```

## Step 4: Run with PM2

PM2 keeps your bot running 24/7 and auto-restarts it on crash or server reboot.

```bash
# Install PM2 globally
npm install -g pm2

# Start the bot
pm2 start src/index.js --name expenses-tracker

# Enable auto-start on server reboot
pm2 startup
pm2 save
```

### Useful PM2 Commands

```bash
pm2 status                    # Check running processes
pm2 logs expenses-tracker     # View live logs
pm2 restart expenses-tracker  # Restart the bot
pm2 stop expenses-tracker     # Stop the bot
pm2 delete expenses-tracker   # Remove from PM2
```

## Step 5: Test Your Bot

1. Open Telegram
2. Search for your bot by name
3. Send a message like: `Spent $10 on coffee`
4. You should get a response confirming the expense!

## Updating the Bot

When you push new code to your repository:

```bash
cd /home/$USER/expenses-tracker
git pull origin main
npm install         # In case of new dependencies
pm2 restart expenses-tracker
```

## Security Best Practices

1. **Never commit** your `.env` file to Git
2. Use strong PostgreSQL passwords
3. Rotate bot tokens if compromised
4. Keep dependencies updated (`npm audit fix`)
5. Set up a firewall (UFW):
   ```bash
   sudo ufw allow OpenSSH
   sudo ufw enable
   ```
6. Keep your VPS updated:
   ```bash
   sudo apt update && sudo apt upgrade -y
   ```

## Troubleshooting

### Bot not responding
- Check PM2 status: `pm2 status`
- Check logs: `pm2 logs expenses-tracker`
- Ensure bot token is correct in `.env`

### Database connection error
- Verify `DATABASE_URL` is correct
- Check if PostgreSQL is running: `sudo systemctl status postgresql`
- Ensure the database and user exist

### PM2 not auto-starting after reboot
- Run `pm2 startup` again and follow the instructions
- Then `pm2 save` to persist the process list
