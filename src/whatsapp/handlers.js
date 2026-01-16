/**
 * WhatsApp Message Handlers
 */

const { processMessage } = require('../services/messageHandler');

/**
 * Handle incoming WhatsApp message
 * @param {Object} msg - WhatsApp message object
 */
async function handleMessage(msg) {
  const startTime = Date.now();
  
  // Get sender info
  const from = msg.from;
  const body = msg.body.trim();
  
  // Skip empty messages
  if (!body) {
    return;
  }
  
  // Extract phone number (remove @c.us suffix)
  const phoneNumber = from.replace('@c.us', '');
  
  console.log(`📩 Message from ${phoneNumber}: ${body.substring(0, 50)}${body.length > 50 ? '...' : ''}`);
  
  try {
    // Process message and get response
    const response = await processMessage(phoneNumber, body);
    
    // Send response
    if (response) {
      await msg.reply(response);
      
      const duration = Date.now() - startTime;
      console.log(`📤 Response sent (${duration}ms)`);
    }
  } catch (error) {
    console.error('Error handling message:', error);
    
    // Send error message
    try {
      await msg.reply('✗ Sorry, an error occurred. Please try again.');
    } catch (replyError) {
      console.error('Error sending error reply:', replyError);
    }
  }
}

module.exports = {
  handleMessage
};
