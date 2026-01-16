# Expenses Tracker

A WhatsApp-integrated expense management application that allows users to track, manage, and analyze their expenses through natural language conversations.

## Features

- 📱 Add expenses via WhatsApp using natural language
- 📊 View expenses by date range, category, or recent entries
- ✏️ Edit and delete expenses
- 📈 Generate monthly reports with detailed financial summaries
- 🏷️ Category management with custom categories
- 🤖 Natural language processing for intuitive interactions

## Technology Stack

- **Runtime**: Node.js 18+
- **Database**: PostgreSQL
- **WhatsApp Integration**: [whatsapp-web.js](https://github.com/pedroslopez/whatsapp-web.js)
- **Deployment**: Railway, Render, or VPS (requires persistent connection)

## Prerequisites

- Node.js 18 or higher
- PostgreSQL database
- WhatsApp account (for bot)

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

4. Edit `.env` with your database credentials:
   ```env
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

7. **First Run - WhatsApp Authentication**:
   - A QR code will appear in the terminal
   - Open WhatsApp on your phone
   - Go to Settings → Linked Devices → Link a Device
   - Scan the QR code
   - Wait for "Client is ready!" message

## Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `NODE_ENV` | Environment (development/production) | Yes |
| `SESSION_SECRET` | Secret for session encryption | No |
| `LOG_LEVEL` | Logging level (info/debug/error) | No |

## Usage

Send messages to your WhatsApp number (the one you scanned with):

### Add Expense
```
Spent $50 on groceries
Coffee $5.50 Category: Food
Received $200 from client, Category: Income
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
Edit expense 123 Amount: $60
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

## Project Structure

```
expenses-tracker/
├── src/
│   ├── index.js              # Application entry point
│   ├── whatsapp/
│   │   ├── client.js         # WhatsApp client setup
│   │   └── handlers.js       # Message handlers
│   ├── services/
│   │   ├── nlp.js            # Natural language processing
│   │   ├── messageHandler.js # Message processing logic
│   │   └── reportGenerator.js# Report generation
│   ├── database/
│   │   ├── connection.js     # Database connection
│   │   └── models/           # Database models
│   └── utils/
│       ├── validators.js
│       └── formatters.js
├── .wwebjs_auth/             # WhatsApp session (auto-generated)
├── package.json
├── .env.example
└── README.md
```

## Deployment

### Railway (Recommended)

1. Create account at [railway.app](https://railway.app)
2. Connect your GitHub repository
3. Add PostgreSQL database
4. Set environment variables
5. Deploy

### Render

1. Create account at [render.com](https://render.com)
2. Create new Web Service
3. Connect your repository
4. Set environment variables
5. Deploy

### VPS / DigitalOcean

1. Set up a server (Ubuntu recommended)
2. Install Node.js 18+ and PostgreSQL
3. Clone repository and install dependencies
4. Set up PM2 for process management:
   ```bash
   npm install -g pm2
   pm2 start src/index.js --name expenses-tracker
   pm2 startup
   pm2 save
   ```

## Important Notes

### WhatsApp Session

- Session is stored in `.wwebjs_auth/` folder
- Keep this folder persistent across deployments
- If session is lost, you'll need to scan QR code again

### Limitations

- **NOT compatible with serverless** (Vercel, AWS Lambda)
- Requires persistent connection to WhatsApp
- One WhatsApp account per instance
- Unofficial API - use responsibly

### Best Practices

- Don't send too many messages in a short time
- Don't use for marketing/spam
- Use for personal expense tracking only
- Consider using a secondary WhatsApp number

## Scripts

```bash
npm start          # Start the application
npm run dev        # Start with auto-reload (development)
npm run db:setup   # Initialize database schema
npm test           # Run tests
```

## Troubleshooting

### QR Code not appearing
- Make sure you're running in a terminal that supports QR display
- Check if puppeteer dependencies are installed

### WhatsApp disconnected
- The app will auto-reconnect
- If persistent, delete `.wwebjs_auth/` folder and scan QR again

### Database connection error
- Verify DATABASE_URL is correct
- Check if PostgreSQL is running
- Ensure database exists

## License

MIT

## Disclaimer

This project uses [whatsapp-web.js](https://github.com/pedroslopez/whatsapp-web.js), an unofficial WhatsApp API. WhatsApp does not allow bots or unofficial clients on their platform. Use at your own risk. For personal use, the risk of being blocked is minimal.
