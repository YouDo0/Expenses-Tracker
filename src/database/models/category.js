/**
 * Category model
 */

const db = require('../connection');

/**
 * Find category by ID
 * @param {number} id - Category ID
 * @returns {Promise<Object|null>} Category object or null
 */
async function findById(id) {
  const result = await db.query(
    'SELECT * FROM categories WHERE id = $1',
    [id]
  );
  return result.rows[0] || null;
}

/**
 * Find category by name for a user
 * @param {number} userId - User ID
 * @param {string} name - Category name
 * @returns {Promise<Object|null>} Category object or null
 */
async function findByName(userId, name) {
  const result = await db.query(
    'SELECT * FROM categories WHERE user_id = $1 AND LOWER(name) = LOWER($2)',
    [userId, name]
  );
  return result.rows[0] || null;
}

/**
 * Get all categories for a user
 * @param {number} userId - User ID
 * @returns {Promise<Array>} Array of categories
 */
async function findByUser(userId) {
  const result = await db.query(
    'SELECT * FROM categories WHERE user_id = $1 ORDER BY is_system DESC, name ASC',
    [userId]
  );
  return result.rows;
}

/**
 * Create a new category
 * @param {number} userId - User ID
 * @param {string} name - Category name
 * @param {boolean} isSystem - Is system category
 * @returns {Promise<Object>} Created category
 */
async function create(userId, name, isSystem = false) {
  const result = await db.query(
    'INSERT INTO categories (user_id, name, is_system) VALUES ($1, $2, $3) RETURNING *',
    [userId, name, isSystem]
  );
  return result.rows[0];
}

/**
 * Get or create category
 * @param {number} userId - User ID
 * @param {string} name - Category name
 * @returns {Promise<Object>} Category object
 */
async function getOrCreate(userId, name) {
  let category = await findByName(userId, name);
  
  if (!category) {
    category = await create(userId, name, false);
  }
  
  return category;
}

/**
 * Delete a category
 * @param {number} id - Category ID
 * @param {number} userId - User ID (for verification)
 * @returns {Promise<boolean>} Success status
 */
async function remove(id, userId) {
  // Check if it's a system category
  const category = await findById(id);
  if (category && category.is_system) {
    throw new Error('Cannot delete system category');
  }
  
  const result = await db.query(
    'DELETE FROM categories WHERE id = $1 AND user_id = $2 AND is_system = false RETURNING *',
    [id, userId]
  );
  return result.rowCount > 0;
}

/**
 * Get Uncategorized category for a user
 * @param {number} userId - User ID
 * @returns {Promise<Object>} Uncategorized category
 */
async function getUncategorized(userId) {
  return findByName(userId, 'Uncategorized');
}

module.exports = {
  findById,
  findByName,
  findByUser,
  create,
  getOrCreate,
  remove,
  getUncategorized
};
