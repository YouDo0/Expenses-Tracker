/**
 * Expenses Tracker - Main Entry Point
 *
 * A Telegram-integrated expense management application
 */

require('dotenv').config();

const { initialize: initBot, stop: stopBot } = require('./telegram/bot');
const { handleMessage } = require('./telegram/handlers');
const db = require('./database/connection');

// ASCII Art Banner
const banner = `
╔═══════════════════════════════════════════╗
║        EXPENSES TRACKER                    ║
║   Telegram Expense Management Bot          ║
╚═══════════════════════════════════════════╝
`;

/**
 * Main application entry point
 */
async function main() {
  console.log(banner);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Started at: ${new Date().toISOString()}\n`);

  // Test database connection
  try {
    console.log('Connecting to database...');
    await db.query('SELECT 1');
    console.log('✓ Database connected successfully\n');
  } catch (error) {
    console.error('✗ Database connection failed:', error.message);
    console.error('  Please check your DATABASE_URL in .env file');
    process.exit(1);
  }

  // Check for bot token
  const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  if (!TELEGRAM_BOT_TOKEN) {
    console.error('✗ TELEGRAM_BOT_TOKEN not found in .env file');
    console.error('  Please get a token from @BotFather on Telegram');
    process.exit(1);
  }

  // Initialize Telegram bot
  console.log('Initializing Telegram bot...');
  initBot(TELEGRAM_BOT_TOKEN, handleMessage);
  console.log('✓ Bot is running. Send a message to start tracking expenses!\n');

  // Handle graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\n\nShutting down...');

    try {
      await stopBot();
    } catch (error) {
      console.error('Error stopping bot:', error);
    }

    try {
      await db.close();
      console.log('✓ Database connections closed');
    } catch (error) {
      console.error('Error closing database:', error);
    }

    console.log('Goodbye!\n');
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    process.emit('SIGINT');
  });

  // Handle uncaught errors
  process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
  });

  process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  });
}

// Run application
main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
