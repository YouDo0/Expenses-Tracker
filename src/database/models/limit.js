/**
 * Limit model
 */

const db = require('../connection');

/**
 * Find all limits for a user
 * @param {number} userId - User ID
 * @returns {Promise<Array>} Array of limits
 */
async function findByUser(userId) {
  const result = await db.query(
    `SELECT ul.*, c.name as category_name
     FROM user_limits ul
     LEFT JOIN categories c ON ul.category_id = c.id
     WHERE ul.user_id = $1
     ORDER BY ul.limit_type, c.name`,
    [userId]
  );
  return result.rows;
}

/**
 * Set or update a limit
 * @param {number} userId - User ID
 * @param {string} limitType - 'daily' or 'monthly'
 * @param {number|null} categoryId - Category ID (null for all categories)
 * @param {number} amount - Limit amount
 * @returns {Promise<Object>} Created or updated limit
 */
async function setLimit(userId, limitType, categoryId, amount) {
  const result = await db.query(
    `INSERT INTO user_limits (user_id, limit_type, category_id, amount)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (user_id, limit_type, category_id)
     DO UPDATE SET amount = $4, created_at = CURRENT_TIMESTAMP
     RETURNING *`,
    [userId, limitType, categoryId, amount]
  );

  // Get category name
  const limit = result.rows[0];
  if (categoryId) {
    const catResult = await db.query('SELECT name FROM categories WHERE id = $1', [categoryId]);
    limit.category_name = catResult.rows[0]?.name || 'Unknown';
  } else {
    limit.category_name = null;
  }

  return limit;
}

/**
 * Remove a limit
 * @param {number} userId - User ID
 * @param {string} limitType - 'daily' or 'monthly'
 * @param {number|null} categoryId - Category ID (null for all categories)
 * @returns {Promise<boolean>} Success status
 */
async function removeLimit(userId, limitType, categoryId) {
  const result = await db.query(
    'DELETE FROM user_limits WHERE user_id = $1 AND limit_type = $2 AND category_id IS NOT DISTINCT FROM $3 RETURNING *',
    [userId, limitType, categoryId]
  );
  return result.rowCount > 0;
}

/**
 * Get applicable limits for a user (for checking after adding expense)
 * @param {number} userId - User ID
 * @param {number|null} categoryId - Category ID to check
 * @returns {Promise<Array>} Array of applicable limits
 */
async function getApplicableLimits(userId, categoryId) {
  // Get limits that apply: either category-specific or global
  const result = await db.query(
    `SELECT ul.*, c.name as category_name
     FROM user_limits ul
     LEFT JOIN categories c ON ul.category_id = c.id
     WHERE ul.user_id = $1
       AND (ul.category_id = $2 OR ul.category_id IS NULL)
     ORDER BY ul.category_id DESC`,
    [userId, categoryId]
  );
  return result.rows;
}

module.exports = {
  findByUser,
  setLimit,
  removeLimit,
  getApplicableLimits
};
