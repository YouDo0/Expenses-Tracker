/**
 * Expense model
 */

const db = require('../connection');

/**
 * Find expense by ID
 * @param {number} id - Expense ID
 * @param {number} userId - User ID (for verification)
 * @returns {Promise<Object|null>} Expense object or null
 */
async function findById(id, userId) {
  const result = await db.query(
    `SELECT e.*, c.name as category_name 
     FROM expenses e 
     LEFT JOIN categories c ON e.category_id = c.id 
     WHERE e.id = $1 AND e.user_id = $2`,
    [id, userId]
  );
  return result.rows[0] || null;
}

/**
 * Get expenses for a user with filters
 * @param {number} userId - User ID
 * @param {Object} options - Filter options
 * @returns {Promise<Array>} Array of expenses
 */
async function findByUser(userId, options = {}) {
  const {
    startDate,
    endDate,
    categoryId,
    limit = 20,
    offset = 0,
    orderAsc = false
  } = options;

  let query = `
    SELECT e.*, c.name as category_name
    FROM expenses e
    LEFT JOIN categories c ON e.category_id = c.id
    WHERE e.user_id = $1
  `;
  const params = [userId];
  let paramIndex = 2;

  if (startDate) {
    query += ` AND e.date >= $${paramIndex}`;
    params.push(startDate);
    paramIndex++;
  }

  if (endDate) {
    query += ` AND e.date <= $${paramIndex}`;
    params.push(endDate);
    paramIndex++;
  }

  if (categoryId) {
    query += ` AND e.category_id = $${paramIndex}`;
    params.push(categoryId);
    paramIndex++;
  }

  const orderDirection = orderAsc ? 'ASC' : 'DESC';
  query += ` ORDER BY e.date ${orderDirection}, e.id ${orderDirection} LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
  params.push(limit, offset);

  const result = await db.query(query, params);
  return result.rows;
}

/**
 * Get expenses for monthly report
 * @param {number} userId - User ID
 * @param {number} year - Year
 * @param {number} month - Month (1-12)
 * @returns {Promise<Array>} Array of expenses
 */
async function findByMonth(userId, year, month) {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);
  
  const result = await db.query(
    `SELECT e.*, c.name as category_name 
     FROM expenses e 
     LEFT JOIN categories c ON e.category_id = c.id 
     WHERE e.user_id = $1 AND e.date >= $2 AND e.date <= $3
     ORDER BY e.date ASC, e.id ASC`,
    [userId, startDate, endDate]
  );
  return result.rows;
}

/**
 * Create a new expense
 * @param {Object} data - Expense data
 * @returns {Promise<Object>} Created expense
 */
async function create(data) {
  const { userId, categoryId, date, description, amount, transactionType, notes } = data;
  
  const result = await db.query(
    `INSERT INTO expenses (user_id, category_id, date, description, amount, transaction_type, notes)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [userId, categoryId, date, description, amount, transactionType, notes]
  );
  
  // Get category name
  const expense = result.rows[0];
  if (categoryId) {
    const catResult = await db.query('SELECT name FROM categories WHERE id = $1', [categoryId]);
    expense.category_name = catResult.rows[0]?.name || 'Uncategorized';
  } else {
    expense.category_name = 'Uncategorized';
  }
  
  return expense;
}

/**
 * Update an expense
 * @param {number} id - Expense ID
 * @param {number} userId - User ID
 * @param {Object} data - Update data
 * @returns {Promise<Object|null>} Updated expense or null
 */
async function update(id, userId, data) {
  const fields = [];
  const values = [];
  let paramIndex = 1;
  
  if (data.categoryId !== undefined) {
    fields.push(`category_id = $${paramIndex}`);
    values.push(data.categoryId);
    paramIndex++;
  }
  
  if (data.date !== undefined) {
    fields.push(`date = $${paramIndex}`);
    values.push(data.date);
    paramIndex++;
  }
  
  if (data.description !== undefined) {
    fields.push(`description = $${paramIndex}`);
    values.push(data.description);
    paramIndex++;
  }
  
  if (data.amount !== undefined) {
    fields.push(`amount = $${paramIndex}`);
    values.push(data.amount);
    paramIndex++;
  }
  
  if (data.transactionType !== undefined) {
    fields.push(`transaction_type = $${paramIndex}`);
    values.push(data.transactionType);
    paramIndex++;
  }
  
  if (data.notes !== undefined) {
    fields.push(`notes = $${paramIndex}`);
    values.push(data.notes);
    paramIndex++;
  }
  
  if (fields.length === 0) {
    return findById(id, userId);
  }
  
  fields.push(`updated_at = CURRENT_TIMESTAMP`);
  
  values.push(id, userId);
  
  const query = `
    UPDATE expenses 
    SET ${fields.join(', ')}
    WHERE id = $${paramIndex} AND user_id = $${paramIndex + 1}
    RETURNING *
  `;
  
  const result = await db.query(query, values);
  return result.rows[0] || null;
}

/**
 * Delete an expense
 * @param {number} id - Expense ID
 * @param {number} userId - User ID
 * @returns {Promise<boolean>} Success status
 */
async function remove(id, userId) {
  const result = await db.query(
    'DELETE FROM expenses WHERE id = $1 AND user_id = $2 RETURNING *',
    [id, userId]
  );
  return result.rowCount > 0;
}

/**
 * Get monthly totals
 * @param {number} userId - User ID
 * @param {number} year - Year
 * @param {number} month - Month (1-12)
 * @returns {Promise<Object>} Totals object
 */
async function getMonthlyTotals(userId, year, month) {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);

  const result = await db.query(
    `SELECT
       COALESCE(SUM(CASE WHEN transaction_type = 'debit' THEN amount ELSE 0 END), 0) as total_debits,
       COALESCE(SUM(CASE WHEN transaction_type = 'credit' THEN amount ELSE 0 END), 0) as total_credits,
       COUNT(*) as count
     FROM expenses
     WHERE user_id = $1 AND date >= $2 AND date <= $3`,
    [userId, startDate, endDate]
  );

  const row = result.rows[0];
  return {
    totalDebits: parseFloat(row.total_debits),
    totalCredits: parseFloat(row.total_credits),
    netBalance: parseFloat(row.total_credits) - parseFloat(row.total_debits),
    count: parseInt(row.count)
  };
}

/**
 * Get all-time totals for a user
 * @param {number} userId - User ID
 * @returns {Promise<Object>} Totals object
 */
async function getAllTimeTotals(userId) {
  const result = await db.query(
    `SELECT
       COALESCE(SUM(CASE WHEN transaction_type = 'debit' THEN amount ELSE 0 END), 0) as total_debits,
       COALESCE(SUM(CASE WHEN transaction_type = 'credit' THEN amount ELSE 0 END), 0) as total_credits,
       COUNT(*) as count
     FROM expenses
     WHERE user_id = $1`,
    [userId]
  );

  const row = result.rows[0];
  return {
    totalDebits: parseFloat(row.total_debits),
    totalCredits: parseFloat(row.total_credits),
    netBalance: parseFloat(row.total_credits) - parseFloat(row.total_debits),
    count: parseInt(row.count)
  };
}

/**
 * Get recent credit transactions
 * @param {number} userId - User ID
 * @param {number} limit - Number of records to return
 * @returns {Promise<Array>} Array of credit expenses
 */
async function getRecentIncome(userId, limit = 5) {
  const result = await db.query(
    `SELECT e.*, c.name as category_name
     FROM expenses e
     LEFT JOIN categories c ON e.category_id = c.id
     WHERE e.user_id = $1 AND e.transaction_type = 'credit'
     ORDER BY e.date DESC, e.id DESC
     LIMIT $2`,
    [userId, limit]
  );
  return result.rows;
}

module.exports = {
  findById,
  findByUser,
  findByMonth,
  create,
  update,
  remove,
  getMonthlyTotals,
  getAllTimeTotals,
  getRecentIncome
};
