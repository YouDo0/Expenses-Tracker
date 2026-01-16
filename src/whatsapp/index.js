/**
 * WhatsApp module index
 */

const client = require('./client');
const handlers = require('./handlers');

module.exports = {
  ...client,
  ...handlers
};
