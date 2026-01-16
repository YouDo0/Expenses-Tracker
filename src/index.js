/**
 * Expenses Tracker - Main Entry Point
 * 
 * A WhatsApp-integrated expense management application
 */

require('dotenv').config();

const { initialize } = require('./whatsapp/client');
const { handleMessage } = require('./whatsapp/handlers');
const db = require('./database/connection');

// ASCII Art Banner
const banner = `
╔═══════════════════════════════════════════╗
║        EXPENSES TRACKER                    ║
║   WhatsApp Expense Management Bot          ║
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

  // Initialize WhatsApp client
  initialize(handleMessage);

  // Handle graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\n\nShutting down...');
    
    try {
      const { destroy } = require('./whatsapp/client');
      await destroy();
      console.log('✓ WhatsApp client disconnected');
    } catch (error) {
      console.error('Error disconnecting WhatsApp:', error);
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
