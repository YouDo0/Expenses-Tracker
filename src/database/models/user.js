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
 * Find user by phone number
 * @param {string} phoneNumber - Phone number
 * @returns {Promise<Object|null>} User object or null
 */
async function findByPhone(phoneNumber) {
  const result = await db.query(
    'SELECT * FROM users WHERE phone_number = $1',
    [phoneNumber]
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
 * @param {string} phoneNumber - Phone number
 * @returns {Promise<Object>} Created user
 */
async function create(phoneNumber) {
  const client = await db.getClient();
  
  try {
    await client.query('BEGIN');
    
    // Create user
    const userResult = await client.query(
      'INSERT INTO users (phone_number) VALUES ($1) RETURNING *',
      [phoneNumber]
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
 * Get or create user by phone number
 * @param {string} phoneNumber - Phone number
 * @returns {Promise<Object>} User object
 */
async function getOrCreate(phoneNumber) {
  // Clean phone number
  const cleanPhone = phoneNumber.replace(/[^\d+]/g, '');
  
  let user = await findByPhone(cleanPhone);
  
  if (!user) {
    user = await create(cleanPhone);
    console.log(`Created new user: ${cleanPhone}`);
  }
  
  return user;
}

module.exports = {
  findByPhone,
  findById,
  create,
  getOrCreate,
  DEFAULT_CATEGORIES
};
