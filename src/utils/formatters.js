/**
 * Formatting utilities
 */

/**
 * Format amount as currency string
 * @param {number} amount - Amount
 * @param {boolean} showSymbol - Show currency symbol
 * @returns {string} Formatted currency string
 */
function formatCurrency(amount, showSymbol = true) {
  const formatted = Math.abs(amount).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  return showSymbol ? `$${formatted}` : formatted;
}

/**
 * Format date for display
 * @param {Date|string} date - Date object or string
 * @returns {string} Formatted date string
 */
function formatDate(date) {
  const d = new Date(date);
  return d.toISOString().split('T')[0];
}

/**
 * Format date for display with day name
 * @param {Date|string} date - Date object or string
 * @returns {string} Formatted date string
 */
function formatDateLong(date) {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

/**
 * Format expense list for WhatsApp display
 * @param {Array} expenses - Array of expense objects
 * @param {number} startIndex - Starting index for numbering
 * @returns {string} Formatted string
 */
function formatExpenseList(expenses, startIndex = 1) {
  if (!expenses || expenses.length === 0) {
    return 'No expenses found.';
  }
  
  const lines = expenses.map((expense, idx) => {
    const num = startIndex + idx;
    const emoji = expense.transaction_type === 'debit' ? '📤' : '📥';
    const amount = formatCurrency(parseFloat(expense.amount));
    const category = expense.category_name || 'Uncategorized';
    const date = formatDate(expense.date);
    
    let line = `${num}. ${emoji} *${amount}* - ${expense.description}\n`;
    line += `   📅 ${date} | 🏷️ ${category}`;
    
    if (expense.notes) {
      line += `\n   📝 ${expense.notes}`;
    }
    
    line += `\n   _ID: ${expense.id}_`;
    
    return line;
  });
  
  return lines.join('\n\n');
}

/**
 * Format monthly report for WhatsApp display
 * @param {Array} expenses - Array of expense objects
 * @param {Object} totals - Totals object {totalDebits, totalCredits, netBalance}
 * @param {number} year - Year
 * @param {number} month - Month
 * @returns {string} Formatted report string
 */
function formatMonthlyReport(expenses, totals, year, month) {
  const monthName = new Date(year, month - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  
  let report = `📊 *MONTHLY REPORT - ${monthName}*\n`;
  report += `${'═'.repeat(35)}\n\n`;
  
  if (expenses.length === 0) {
    report += '_No expenses for this month._\n\n';
  } else {
    // Group by date
    let runningBalance = 0;
    let currentDate = null;
    
    for (const expense of expenses) {
      const date = formatDate(expense.date);
      const amount = parseFloat(expense.amount);
      
      if (date !== currentDate) {
        if (currentDate) report += '\n';
        report += `📅 *${date}*\n`;
        currentDate = date;
      }
      
      const emoji = expense.transaction_type === 'debit' ? '📤' : '📥';
      const category = expense.category_name || 'Uncategorized';
      
      if (expense.transaction_type === 'debit') {
        runningBalance -= amount;
        report += `  ${emoji} -${formatCurrency(amount)} | ${expense.description} (${category})\n`;
      } else {
        runningBalance += amount;
        report += `  ${emoji} +${formatCurrency(amount)} | ${expense.description} (${category})\n`;
      }
    }
  }
  
  report += `\n${'═'.repeat(35)}\n`;
  report += `📤 *Total Expenses:* ${formatCurrency(totals.totalDebits)}\n`;
  report += `📥 *Total Income:* ${formatCurrency(totals.totalCredits)}\n`;
  report += `💰 *Net Balance:* ${formatCurrency(totals.netBalance)}\n`;
  report += `📝 *Transactions:* ${totals.count}`;
  
  return report;
}

/**
 * Format category list for display
 * @param {Array} categories - Array of category objects
 * @returns {string} Formatted string
 */
function formatCategoryList(categories) {
  if (!categories || categories.length === 0) {
    return 'No categories found.';
  }
  
  const lines = categories.map(cat => {
    const emoji = cat.is_system ? '🔒' : '📝';
    return `${emoji} ${cat.name}`;
  });
  
  return '*Your Categories:*\n\n' + lines.join('\n');
}

/**
 * Truncate string to max length
 * @param {string} str - String to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} Truncated string
 */
function truncate(str, maxLength) {
  if (!str || str.length <= maxLength) return str;
  return str.substring(0, maxLength - 2) + '..';
}

module.exports = {
  formatCurrency,
  formatDate,
  formatDateLong,
  formatExpenseList,
  formatMonthlyReport,
  formatCategoryList,
  truncate
};
