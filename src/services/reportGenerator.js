/**
 * Report Generator Service
 */

const { Expense } = require('../database/models');
const { formatMonthlyReport } = require('../utils/formatters');

/**
 * Generate monthly report
 * @param {number} userId - User ID
 * @param {number} year - Year
 * @param {number} month - Month (1-12)
 * @returns {Promise<string>} Formatted report string
 */
async function generateMonthlyReport(userId, year, month) {
  // Get expenses for the month
  const expenses = await Expense.findByMonth(userId, year, month);
  
  // Get totals
  const totals = await Expense.getMonthlyTotals(userId, year, month);
  
  // Format report
  return formatMonthlyReport(expenses, totals, year, month);
}

/**
 * Get monthly summary (totals only)
 * @param {number} userId - User ID
 * @param {number} year - Year
 * @param {number} month - Month (1-12)
 * @returns {Promise<Object>} Summary object
 */
async function getMonthlySummary(userId, year, month) {
  return await Expense.getMonthlyTotals(userId, year, month);
}

module.exports = {
  generateMonthlyReport,
  getMonthlySummary
};
