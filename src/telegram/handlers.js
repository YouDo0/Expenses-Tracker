/**
 * Telegram Message Handlers
 */

const { processMessage } = require('../services/messageHandler');
const { sendMessage: sendTelegramMessage } = require('./bot');

/**
 * Handle incoming Telegram message
 * @param {string} userId - User's chat ID
 * @param {string} text - Message text
 * @param {Object} msg - Telegram message object
 */
async function handleMessage(userId, text, msg) {
  const startTime = Date.now();

  try {
    // Process message and get response
    const response = await processMessage(userId, text);

    // Send response
    if (response) {
      await sendTelegramMessage(userId, response);

      const duration = Date.now() - startTime;
      console.log(`📤 Response sent (${duration}ms)`);
    }
  } catch (error) {
    console.error('Error handling message:', error);

    // Send error message
    try {
      await sendTelegramMessage(userId, '✗ Sorry, an error occurred. Please try again.');
    } catch (replyError) {
      console.error('Error sending error reply:', replyError);
    }
  }
}

module.exports = {
  handleMessage
};
