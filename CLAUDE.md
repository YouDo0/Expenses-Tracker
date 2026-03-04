# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Expenses Tracker is a **Telegram-integrated expense management application** that processes natural language messages to track expenses. It's a Node.js application using node-telegram-bot-api for Telegram Bot integration and PostgreSQL for data persistence.

**Key Advantage**: Unlike WhatsApp-based bots, Telegram bots don't require session persistence or QR code scanning, making deployment simpler and more reliable.

## Commands

### Development
```bash
npm start          # Start the application
npm run dev        # Start with nodemon for auto-reload (development)
npm test           # Run tests
```

### Database
```bash
npm run db:setup   # Initialize database schema (executes src/database/schema.sql)
```

### First Run Setup
1. Create a Telegram bot via [@BotFather](https://t.me/BotFather) - send `/newbot` and copy the token
2. Copy `.env.example` to `.env` and configure:
   - `TELEGRAM_BOT_TOKEN` - from BotFather
   - `DATABASE_URL` - PostgreSQL connection string
3. Run `npm run db:setup` to create database tables
4. Run `npm start`
5. Start messaging your bot on Telegram!

### Production Deployment (VPS)

1. SSH into your VPS and clone the repository:
```bash
git clone <repository-url>
cd expenses-tracker
npm install
```

2. Configure environment:
```bash
cp .env.example .env
nano .env  # Set TELEGRAM_BOT_TOKEN, DATABASE_URL, NODE_ENV=production
```

3. Initialize the database:
```bash
npm run db:setup
```

4. Install PM2 and start the application:
```bash
npm install -g pm2
pm2 start src/index.js --name expenses-tracker
pm2 startup   # Enable auto-start on server reboot
pm2 save
```

5. Useful PM2 commands:
```bash
pm2 logs expenses-tracker   # View logs
pm2 restart expenses-tracker # Restart the bot
pm2 status                   # Check status
```

## Architecture

### Entry Point
- `src/index.js` - Main entry point that initializes database connection, starts Telegram bot, and handles graceful shutdown (SIGINT, SIGTERM)

### Application Flow
```
Telegram Message → telegram/bot.js (receives via polling)
  → telegram/handlers.js (routes to message handler)
  → services/messageHandler.js (business logic router)
  → services/nlp.js (natural language parsing)
  → database/models/ (data access)
  → Response via telegram/bot.js (sendMessage)
```

### Key Modules

#### Telegram Layer (`src/telegram/`)
- `bot.js` - Telegram bot initialization, polling setup, message sending with HTML formatting. Handles polling errors gracefully.
- `handlers.js` - Entry point for message processing, extracts chat ID and passes to message handler
- `index.js` - Module exports

#### Services Layer (`src/services/`)
- `messageHandler.js` - Main router that directs messages to appropriate handlers (add/view/edit/delete expenses, categories, reports)
- `nlp.js` - Rule-based natural language processing using chrono-node for date parsing. Extracts amount, date, category, transaction type from free-form text
- `reportGenerator.js` - Generates monthly financial summaries

#### Database Layer (`src/database/`)
- `connection.js` - PostgreSQL connection pool (pg library)
- `models/user.js` - User operations (chat_id as primary identifier)
- `models/category.js` - Category CRUD operations (per-user, system categories protected)
- `models/expense.js` - Expense CRUD operations with filtering by date/category
- `setup.js` - Database schema initialization (reads `schema.sql`)

#### Utilities (`src/utils/`)
- `formatters.js` - Text formatting for Telegram responses (currency, dates, tables) with HTML support
- `validators.js` - Input validation (amounts, dates, etc.)

### Database Schema
- `users` - id, chat_id (unique), created_at, updated_at
- `categories` - id, user_id (FK), name, is_system, created_at (unique constraint on user_id + name)
- `expenses` - id, user_id (FK), category_id (FK), date, description, amount, transaction_type, notes, created_at, updated_at

Cascading deletes: User deletion removes all their categories and expenses.

### NLP Patterns
The NLP service recognizes various expense formats:
- `Makan siang Rp50000` - Amount with Rupiah prefix
- `Kopi 15k Category: Food` - Shorthand amount with explicit category
- `Gaji Rp5000000, Category: Income` - Credit transaction
- `Show expenses from last week` - chrono-node date parsing
- Supported formats: `Rp50000`, `50k`, `50rb`, `IDR 50000`

## Deployment

This project is deployed on a **personal VPS** using **PM2** for process management and **PostgreSQL** installed directly on the server. See `DEPLOYMENT.md` for the full step-by-step guide.

## Environment Variables

| Variable | Purpose | Required |
|----------|---------|----------|
| `TELEGRAM_BOT_TOKEN` | Bot token from @BotFather | Yes |
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `NODE_ENV` | development/production | Yes |
| `SESSION_SECRET` | Session encryption | No |
| `LOG_LEVEL` | Logging verbosity | No |

## Migration History

This project has undergone several migrations:
- **v1.0**: Python/Flask with webhook-based architecture
- **v2.0**: Node.js with WhatsApp Web automation (wweb.js)
- **v3.0**: Node.js with Telegram Bot API (current) - Refactored for simpler deployment and better reliability