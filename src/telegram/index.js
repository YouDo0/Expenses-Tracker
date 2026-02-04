/**
 * Telegram module index
 */

const bot = require('./bot');
const handlers = require('./handlers');

module.exports = {
  ...bot,
  ...handlers
};
