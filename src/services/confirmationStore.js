/**
 * Confirmation Store Service
 * Manages pending transaction confirmations per user
 */

const pendingConfirmations = new Map();

/**
 * Store pending confirmation for a user
 * @param {string} chatId - User's chat ID
 * @param {Object} data - Confirmation data {transactions, summary}
 */
function set(chatId, data) {
  pendingConfirmations.set(chatId.toString(), data);
}

/**
 * Get pending confirmation for a user
 * @param {string} chatId - User's chat ID
 * @returns {Object|null} Confirmation data or null if not found
 */
function get(chatId) {
  return pendingConfirmations.get(chatId.toString()) || null;
}

/**
 * Delete pending confirmation for a user
 * @param {string} chatId - User's chat ID
 */
function deleteConfirmation(chatId) {
  pendingConfirmations.delete(chatId.toString());
}

/**
 * Check if user has pending confirmation
 * @param {string} chatId - User's chat ID
 * @returns {boolean}
 */
function has(chatId) {
  return pendingConfirmations.has(chatId.toString());
}

module.exports = {
  set,
  get,
  delete: deleteConfirmation,
  has
};
