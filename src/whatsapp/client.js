/**
 * WhatsApp Web Client Setup
 */

const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

// Create client with local auth for session persistence
const client = new Client({
  authStrategy: new LocalAuth({
    dataPath: '.wwebjs_auth'
  }),
  puppeteer: {
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--disable-gpu'
    ]
  }
});

/**
 * Initialize WhatsApp client with event handlers
 * @param {Function} onMessage - Message handler callback
 */
function initialize(onMessage) {
  // QR Code event
  client.on('qr', (qr) => {
    console.log('\n📱 Scan this QR code with WhatsApp:\n');
    qrcode.generate(qr, { small: true });
    console.log('\nWaiting for QR scan...\n');
  });

  // Ready event
  client.on('ready', () => {
    console.log('✓ WhatsApp client is ready!');
    console.log(`  Connected as: ${client.info.pushname}`);
    console.log(`  Phone number: ${client.info.wid.user}`);
    console.log('\n📨 Listening for messages...\n');
  });

  // Authentication success
  client.on('authenticated', () => {
    console.log('✓ WhatsApp authenticated');
  });

  // Authentication failure
  client.on('auth_failure', (msg) => {
    console.error('✗ WhatsApp authentication failed:', msg);
  });

  // Disconnected
  client.on('disconnected', (reason) => {
    console.log('⚠ WhatsApp disconnected:', reason);
    console.log('  Attempting to reconnect...');
  });

  // Message event
  client.on('message', async (msg) => {
    // Skip messages from groups and status updates
    if (msg.from.includes('@g.us') || msg.from === 'status@broadcast') {
      return;
    }

    // Skip messages from self
    if (msg.fromMe) {
      return;
    }

    try {
      // Process message
      if (onMessage) {
        await onMessage(msg);
      }
    } catch (error) {
      console.error('Error handling message:', error);
    }
  });

  // Start client
  console.log('🚀 Starting WhatsApp client...');
  client.initialize();
}

/**
 * Send a message
 * @param {string} to - Recipient number (with @c.us suffix)
 * @param {string} message - Message text
 */
async function sendMessage(to, message) {
  try {
    await client.sendMessage(to, message);
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
}

/**
 * Get client state
 * @returns {string} Client state
 */
function getState() {
  return client.info ? 'CONNECTED' : 'DISCONNECTED';
}

/**
 * Destroy client
 */
async function destroy() {
  await client.destroy();
}

module.exports = {
  client,
  initialize,
  sendMessage,
  getState,
  destroy
};
