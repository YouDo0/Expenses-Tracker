/**
 * Telegram Bot Client Setup
 */

const TelegramBot = require('node-telegram-bot-api');

let bot = null;

/**
 * Initialize Telegram bot with message handler
 * @param {string} token - Bot token from BotFather
 * @param {Function} onMessage - Message handler callback(userId, text, msg)
 * @returns {TelegramBot} Bot instance
 */
function initialize(token, onMessage) {
  // Create bot with polling
  bot = new TelegramBot(token, { polling: true });

  // Handle text messages
  bot.on('message', (msg) => {
    // Skip non-text messages
    if (!msg.text) return;

    const userId = msg.chat.id.toString();
    const text = msg.text.trim();

    // Skip empty messages
    if (!text) return;

    console.log(`📩 Message from ${userId}: ${text.substring(0, 50)}${text.length > 50 ? '...' : ''}`);

    // Process message asynchronously
    onMessage(userId, text, msg).catch((error) => {
      console.error('Error in message handler:', error);
    });
  });

  // Handle polling errors
  bot.on('polling_error', (error) => {
    console.error('Telegram polling error:', error.message || error);
  });

  console.log('🚀 Telegram bot initialized');
  return bot;
}

/**
 * Send message to user
 * @param {string} userId - User's chat ID
 * @param {string} message - Message text (supports HTML)
 */
async function sendMessage(userId, message) {
  if (!bot) {
    throw new Error('Bot not initialized');
  }

  try {
    await bot.sendMessage(userId, message, { parse_mode: 'HTML' });
  } catch (error) {
    console.error(`Failed to send message to ${userId}:`, error.message);

    // Common error: user blocked bot
    if (error.response?.body?.description?.includes('bot was blocked')) {
      console.log(`User ${userId} has blocked the bot`);
    }
    throw error;
  }
}

/**
 * Get bot state
 * @returns {string} Bot state
 */
function getState() {
  return bot ? 'CONNECTED' : 'DISCONNECTED';
}

/**
 * Stop bot polling
 */
async function stop() {
  if (bot) {
    await bot.stopPolling();
    bot = null;
    console.log('✓ Telegram bot stopped');
  }
}

module.exports = {
  initialize,
  sendMessage,
  getState,
  stop
};
