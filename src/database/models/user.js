/**
 * User model
 */

const db = require('../connection');

// Default system categories
const DEFAULT_CATEGORIES = [
  { name: 'Food', is_system: true },
  { name: 'Transportation', is_system: true },
  { name: 'Entertainment', is_system: true },
  { name: 'Utilities', is_system: true },
  { name: 'Shopping', is_system: true },
  { name: 'Healthcare', is_system: true },
  { name: 'Income', is_system: true },
  { name: 'Uncategorized', is_system: false }
];

/**
 * Find user by chat ID
 * @param {string|number} chatId - User's chat ID
 * @returns {Promise<Object|null>} User object or null
 */
async function findByChatId(chatId) {
  const result = await db.query(
    'SELECT * FROM users WHERE chat_id = $1',
    [chatId]
  );
  return result.rows[0] || null;
}

/**
 * Find user by ID
 * @param {number} id - User ID
 * @returns {Promise<Object|null>} User object or null
 */
async function findById(id) {
  const result = await db.query(
    'SELECT * FROM users WHERE id = $1',
    [id]
  );
  return result.rows[0] || null;
}

/**
 * Create a new user with default categories
 * @param {string|number} chatId - User's chat ID
 * @returns {Promise<Object>} Created user
 */
async function create(chatId) {
  const client = await db.getClient();

  try {
    await client.query('BEGIN');

    // Create user
    const userResult = await client.query(
      'INSERT INTO users (chat_id) VALUES ($1) RETURNING *',
      [chatId]
    );
    const user = userResult.rows[0];

    // Create default categories
    for (const category of DEFAULT_CATEGORIES) {
      await client.query(
        'INSERT INTO categories (user_id, name, is_system) VALUES ($1, $2, $3)',
        [user.id, category.name, category.is_system]
      );
    }

    await client.query('COMMIT');

    return user;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Get or create user by chat ID
 * @param {string|number} chatId - User's chat ID
 * @returns {Promise<Object>} User object
 */
async function getOrCreate(chatId) {
  // Convert chatId to string for consistency
  const cleanChatId = String(chatId);

  let user = await findByChatId(cleanChatId);

  if (!user) {
    user = await create(cleanChatId);
    console.log(`Created new user: ${cleanChatId}`);
  }

  return user;
}

module.exports = {
  findByChatId,
  findById,
  create,
  getOrCreate,
  DEFAULT_CATEGORIES
};
