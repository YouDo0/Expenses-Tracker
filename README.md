# Expenses Tracker

A Telegram-integrated expense management application that allows users to track, manage, and analyze their expenses through natural language conversations.

## Features

- 💬 Add expenses via Telegram using natural language
- 📊 View expenses by date range, category, or recent entries
- ✏️ Edit and delete expenses
- 📈 Generate monthly reports with detailed financial summaries
- 🏷️ Category management with custom categories
- 🤖 Natural language processing for intuitive interactions

## Technology Stack

- **Runtime**: Node.js 18+
- **Database**: PostgreSQL
- **Telegram Integration**: [node-telegram-bot-api](https://github.com/yagop/node-telegram-bot-api)
- **Deployment**: VPS with PM2 process manager

## Prerequisites

- Node.js 18 or higher
- PostgreSQL database
- Telegram Bot Token (from [@BotFather](https://t.me/botfather))

## Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd expenses-tracker
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create `.env` file from `.env.example`:
   ```bash
   cp .env.example .env
   ```

4. Edit `.env` with your credentials:
   ```env
   TELEGRAM_BOT_TOKEN=your-bot-token-from-botfather
   DATABASE_URL=postgresql://user:password@localhost:5432/expenses_tracker
   NODE_ENV=development
   ```

5. Set up the database:
   ```bash
   npm run db:setup
   ```

6. Run the application:
   ```bash
   npm start
   ```

7. Open Telegram, search for your bot, and start tracking expenses!

## Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `TELEGRAM_BOT_TOKEN` | Bot token from @BotFather | Yes |
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `NODE_ENV` | Environment (development/production) | Yes |
| `SESSION_SECRET` | Secret for session encryption | No |
| `LOG_LEVEL` | Logging level (info/debug/error) | No |

## Usage

Send messages to your Telegram bot:

### Add Expense
```
Makan siang Rp50000
Kopi Rp15000 Category: Food
Gaji Rp5000000, Category: Income
Belanja 50k Category: Shopping
```

### View Expenses
```
Show expenses
Show expenses from last week
Show expenses Category: Food
Show last 10 expenses
```

### Edit/Delete Expense
```
Edit expense 123 Amount: Rp60000
Delete expense 123
```

### Monthly Report
```
Show monthly report
Generate report for January
```

### Categories
```
Show categories
Add category Travel
Delete category Travel
```

### Help
```
Help
?
```

For a complete guide with all features and examples, see [BOT_USAGE.md](BOT_USAGE.md).

## Project Structure

```
expenses-tracker/
├── src/
│   ├── index.js              # Application entry point
│   ├── telegram/
│   │   ├── bot.js            # Telegram bot setup (polling)
│   │   ├── handlers.js       # Message handlers
│   │   └── index.js          # Module exports
│   ├── services/
│   │   ├── nlp.js            # Natural language processing
│   │   ├── messageHandler.js # Message processing logic
│   │   └── reportGenerator.js# Report generation
│   ├── database/
│   │   ├── connection.js     # Database connection
│   │   ├── setup.js          # Schema initialization
│   │   ├── schema.sql        # Database schema
│   │   └── models/           # Database models
│   └── utils/
│       ├── validators.js
│       └── formatters.js
├── package.json
├── .env.example
├── DEPLOYMENT.md
└── README.md
```

## Deployment (VPS)

This project is designed to run on your own VPS with PM2 for process management.

1. Set up a VPS (Ubuntu/Debian recommended)
2. Install Node.js 18+ and PostgreSQL
3. Clone the repository and install dependencies
4. Configure `.env` with your credentials
5. Run the bot with PM2:
   ```bash
   npm install -g pm2
   pm2 start src/index.js --name expenses-tracker
   pm2 startup
   pm2 save
   ```

See [DEPLOYMENT.md](DEPLOYMENT.md) for the full step-by-step guide.

## Scripts

```bash
npm start          # Start the application
npm run dev        # Start with auto-reload (development)
npm run db:setup   # Initialize database schema
npm test           # Run tests
```

## Troubleshooting

### Bot not responding
- Verify your `TELEGRAM_BOT_TOKEN` is correct
- Check PM2 logs: `pm2 logs expenses-tracker`

### Database connection error
- Verify `DATABASE_URL` is correct
- Check if PostgreSQL is running
- Ensure the database and user exist

## License

MIT
