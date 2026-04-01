/**
 * Formatting utilities for Telegram
 * Telegram uses HTML for formatting (parse_mode: 'HTML')
 * Tags: <b>bold</b>, <i>italic</i>, <code>code</code>, <pre>pre</pre>
 */

/**
 * Escape HTML special characters for Telegram
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 */
function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Format amount as currency string
 * @param {number} amount - Amount
 * @param {boolean} showSymbol - Show currency symbol
 * @returns {string} Formatted currency string
 */
function formatCurrency(amount, showSymbol = true) {
  const formatted = Math.abs(amount).toLocaleString('id-ID', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  });
  return showSymbol ? `Rp${formatted}` : formatted;
}

/**
 * Format date for display
 * @param {Date|string} date - Date object or string
 * @returns {string} Formatted date string
 */
function formatDate(date) {
  if (!date) return '';
  const d = new Date(date);
  // Handle date-only strings (YYYY-MM-DD) to avoid timezone shift
  const dateStr = date.toString();
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return dateStr;
  }
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
 * Format expense list for Telegram display
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
    const category = escapeHtml(expense.category_name || 'Uncategorized');
    const date = formatDate(expense.date);
    const description = escapeHtml(expense.description);

    let line = `${num}. ${emoji} <b>${amount}</b> - ${description}\n`;
    line += `   📅 ${date} | 🏷️ ${category}`;

    if (expense.notes) {
      line += `\n   📝 ${escapeHtml(expense.notes)}`;
    }

    line += `\n   <i>ID: ${expense.id}</i>`;

    return line;
  });

  return lines.join('\n\n');
}

/**
 * Format monthly report for Telegram display
 * @param {Array} expenses - Array of expense objects
 * @param {Object} totals - Totals object {totalDebits, totalCredits, netBalance}
 * @param {number} year - Year
 * @param {number} month - Month
 * @returns {string} Formatted report string
 */
function formatMonthlyReport(expenses, totals, year, month) {
  const monthName = new Date(year, month - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  let report = `📊 <b>MONTHLY REPORT - ${monthName}</b>\n`;
  report += `${'═'.repeat(35)}\n\n`;

  if (expenses.length === 0) {
    report += '<i>No expenses for this month.</i>\n\n';
  } else {
    // Group by date
    let runningBalance = 0;
    let currentDate = null;

    for (const expense of expenses) {
      const date = formatDate(expense.date);
      const amount = parseFloat(expense.amount);

      if (date !== currentDate) {
        if (currentDate) report += '\n';
        report += `📅 <b>${date}</b>\n`;
        currentDate = date;
      }

      const emoji = expense.transaction_type === 'debit' ? '📤' : '📥';
      const category = escapeHtml(expense.category_name || 'Uncategorized');
      const description = escapeHtml(expense.description);

      if (expense.transaction_type === 'debit') {
        runningBalance -= amount;
        report += `  ${emoji} -${formatCurrency(amount)} | ${description} (${category})\n`;
      } else {
        runningBalance += amount;
        report += `  ${emoji} +${formatCurrency(amount)} | ${description} (${category})\n`;
      }
    }
  }

  report += `\n${'═'.repeat(35)}\n`;
  report += `📤 <b>Total Expenses:</b> ${formatCurrency(totals.totalDebits)}\n`;
  report += `📥 <b>Total Income:</b> ${formatCurrency(totals.totalCredits)}\n`;
  report += `💰 <b>Net Balance:</b> ${formatCurrency(totals.netBalance)}\n`;
  report += `📝 <b>Transactions:</b> ${totals.count}`;

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
    return `${emoji} ${escapeHtml(cat.name)}`;
  });

  return '<b>Your Categories:</b>\n\n' + lines.join('\n');
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

/**
 * Format balance summary for display
 * @param {Object} totals - All-time totals object
 * @param {Array} recentIncome - Recent credit transactions
 * @returns {string} Formatted balance summary
 */
function formatBalanceSummary(totals, recentIncome) {
  let message = `💰 <b>YOUR BALANCE</b>\n`;
  message += `${'═'.repeat(35)}\n\n`;

  message += `📥 <b>Total Income:</b> ${formatCurrency(totals.totalCredits)}\n`;
  message += `📤 <b>Total Expenses:</b> ${formatCurrency(totals.totalDebits)}\n`;
  message += `${'─'.repeat(35)}\n`;
  message += `💵 <b>Net Balance:</b> ${formatCurrency(totals.netBalance)}\n\n`;

  if (recentIncome && recentIncome.length > 0) {
    message += `<b>Recent Income:</b>\n`;
    recentIncome.forEach((income, idx) => {
      const emoji = income.transaction_type === 'credit' ? '📥' : '📤';
      message += `${idx + 1}. ${emoji} ${formatCurrency(parseFloat(income.amount))} - ${escapeHtml(income.description)}\n`;
      message += `   📅 ${formatDate(income.date)}\n`;
    });
  } else {
    message += `<i>No income recorded yet.</i>`;
  }

  return message;
}

/**
 * Format limit notification message
 * @param {Object} limit - Limit object with limit_type, category_name, amount
 * @param {number} currentSpending - Current spending amount
 * @param {number} percentage - Percentage of limit used
 * @returns {string} Formatted notification
 */
function formatLimitNotification(limit, currentSpending, percentage) {
  const typeLabel = limit.limit_type === 'daily' ? 'Harian' : 'Bulanan';
  const categoryName = limit.category_name || 'All Categories';

  let message = `⚠️ <b>LIMIT EXCEEDED!</b>\n\n`;
  message += `📊 Limit ${typeLabel} untuk <b>${categoryName}</b> telah melampaui batas!\n\n`;
  message += `💰 Limit: ${formatCurrency(limit.amount)}\n`;
  message += `📤 Spending: ${formatCurrency(currentSpending)}\n`;
  message += `📈 Used: ${percentage.toFixed(1)}%`;

  return message;
}

module.exports = {
  escapeHtml,
  formatCurrency,
  formatDate,
  formatDateLong,
  formatExpenseList,
  formatMonthlyReport,
  formatCategoryList,
  truncate,
  formatBalanceSummary,
  formatLimitNotification
};
