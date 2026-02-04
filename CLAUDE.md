 # CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Expenses Tracker is a **WhatsApp-integrated expense management application** that processes natural language messages to track expenses. It's a long-running Node.js application using whatsapp-web.js for WhatsApp automation and PostgreSQL for data persistence.

**Critical Constraint**: This is NOT compatible with serverless platforms (Vercel, AWS Lambda). It requires a persistent connection for WhatsApp Web session management and persistent storage for `.wwebjs_auth/` folder.

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
1. Copy `.env.example` to `.env` and set `DATABASE_URL`
2. Run `npm run db:setup` to create database tables
3. Run `npm start` - a QR code will appear in the terminal
4. Scan the QR code with WhatsApp (Settings → Linked Devices → Link a Device)
5. Session is saved to `.wwebjs_auth/` for subsequent runs

### Production Deployment (PM2)
```bash
npm install -g pm2
pm2 start src/index.js --name expenses-tracker
pm2 startup
pm2 save
```

## Architecture

### Entry Point
- `src/index.js` - Main entry point that initializes database connection, sets up WhatsApp client, and handles graceful shutdown (SIGINT, SIGTERM)

### Application Flow
```
WhatsApp Message → whatsapp/handlers.js (filter/route)
  → services/messageHandler.js (business logic router)
  → services/nlp.js (natural language parsing)
  → database/models/ (data access)
  → Response via whatsapp/client.js
```

### Key Modules

#### WhatsApp Layer (`src/whatsapp/`)
- `client.js` - WhatsApp client lifecycle, QR generation, session persistence, message event listener. Filters out groups, status broadcasts, and self-messages.
- `handlers.js` - Entry point for message processing, extracts phone number and passes to message handler

#### Services Layer (`src/services/`)
- `messageHandler.js` - Main router that directs messages to appropriate handlers (add/view/edit/delete expenses, categories, reports)
- `nlp.js` - Rule-based natural language processing using chrono-node for date parsing. Extracts amount, date, category, transaction type from free-form text
- `reportGenerator.js` - Generates monthly financial summaries

#### Database Layer (`src/database/`)
- `connection.js` - PostgreSQL connection pool (pg library)
- `models/user.js` - User operations (phone number as primary key)
- `models/category.js` - Category CRUD operations (per-user, system categories protected)
- `models/expense.js` - Expense CRUD operations with filtering by date/category
- `setup.js` - Database schema initialization (reads `schema.sql`)

#### Utilities (`src/utils/`)
- `formatters.js` - Text formatting for WhatsApp responses (currency, dates, tables)
- `validators.js` - Input validation (phone numbers, amounts, etc.)

### Database Schema
- `users` - phone_number (PK), created_at, updated_at
- `categories` - id, user_id (FK), name, is_system, created_at
- `expenses` - id, user_id (FK), category_id (FK), amount, date, description, type, notes, created_at, updated_at

Cascading deletes: User deletion removes all their categories and expenses.

### NLP Patterns
The NLP service recognizes various expense formats:
- `Spent $50 on groceries` - Amount + implicit category
- `Coffee $5.50 Category: Food` - Explicit category specification
- `Received $200 from client` - Credit transaction
- `Show expenses from last week` - chrono-node date parsing

## Important Constraints

- **Single WhatsApp Account**: One instance connects to one WhatsApp number
- **Session Persistence**: `.wwebjs_auth/` must be preserved or re-authentication required
- **Message Limits**: WhatsApp's 4096 character limit affects report formatting
- **Group Messages**: Application ignores all group messages and status broadcasts
- **Self-Messages**: Application ignores messages sent by the bot itself

## Recent Migration

This project was refactored from Python/Flask to Node.js in January 2026. The new architecture:
- Migrated from webhook-based to direct WhatsApp Web automation
- Changed from REST API to event-driven message processing
- Replaced SQLAlchemy with direct PostgreSQL queries using `pg`

## Environment Variables

| Variable | Purpose | Required |
|----------|---------|----------|
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `NODE_ENV` | development/production | Yes |
| `SESSION_SECRET` | Session encryption | No |
| `LOG_LEVEL` | Logging verbosity | No |
