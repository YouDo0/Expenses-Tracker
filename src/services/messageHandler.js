/**
 * Message Handler Service
 */

const db = require('../database/connection');
const { User, Category, Expense } = require('../database/models');
const nlp = require('./nlp');
const aiParser = require('./aiParser');
const reportGenerator = require('./reportGenerator');
const confirmationStore = require('./confirmationStore');
const { formatExpenseList, formatCategoryList, formatCurrency, formatDate, formatBalanceSummary, formatLimitNotification } = require('../utils/formatters');
const { validateCategoryName, validateExpenseId, validateAmount } = require('../utils/validators');

/**
 * Process incoming message
 * @param {string} userId - User's chat ID
 * @param {string} message - Message text
 * @returns {Promise<string>} Response message
 */
async function processMessage(userId, message) {
  try {
    // Check for pending confirmation first
    if (confirmationStore.has(userId)) {
      return await handleConfirmation(userId, message);
    }

    // Get or create user
    const user = await User.getOrCreate(userId);

    // Recognize intent
    const intent = nlp.recognizeIntent(message);

    // Handle based on intent
    switch (intent) {
      case 'add_expense':
        return await handleAddExpense(user, message);
      case 'view_expenses':
        return await handleViewExpenses(user, message);
      case 'edit_expense':
        return await handleEditExpense(user, message);
      case 'delete_expense':
        return await handleDeleteExpense(user, message);
      case 'generate_report':
        return await handleGenerateReport(user, message);
      case 'add_category':
        return await handleAddCategory(user, message);
      case 'delete_category':
        return await handleDeleteCategory(user, message);
      case 'view_categories':
        return await handleViewCategories(user);
      case 'view_balance':
        return await handleViewBalance(user);
      case 'set_limit':
        return await handleSetLimit(user, message);
      case 'help':
        return getHelpMessage();
      default:
        return getUnknownMessage();
    }
  } catch (error) {
    console.error('Error processing message:', error);
    return `✗ Error: ${error.message}`;
  }
}

/**
 * Handle add expense intent
 */
async function handleAddExpense(user, message) {
  let aiResult;

  // Try AI parser first, fall back to rule-based NLP if it fails
  if (process.env.OPENROUTER_API_KEY) {
    try {
      aiResult = await aiParser.extractAllTransactions(message);

      // Debug: log AI result
      console.log('[AI Parser] Result:', JSON.stringify(aiResult));
    } catch (error) {
      console.error('AI parser failed, falling back to rule-based NLP:', error.message);
      aiResult = buildFallbackTransactions(message);
    }
  } else {
    // No AI key - use rule-based with multiple amount support
    aiResult = buildFallbackTransactions(message);
  }

  const transactions = aiResult.transactions || [];

  // Filter out transactions with null amounts
  const validTransactions = transactions.filter(t => t.amount !== null && t.amount > 0);

  if (validTransactions.length === 0) {
    return "✗ Error: Please specify the amount. Example: 'Makan siang Rp50000'";
  }

  // Single transaction - process immediately
  if (validTransactions.length === 1) {
    return await saveTransaction(user, validTransactions[0]);
  }

  // Multiple transactions - ask for confirmation
  const summary = buildTransactionSummary(validTransactions);
  confirmationStore.set(user.chat_id, {
    transactions: validTransactions,
    summary: summary
  });

  return {
    status: 'confirmation_required',
    summary: summary,
    data: { transactions: validTransactions }
  };
}

/**
 * Save a single transaction
 */
/**
 * Build transactions using rule-based NLP (supports multiple amounts)
 */
function buildFallbackTransactions(message) {
  const amounts = nlp.extractAllAmounts(message);

  if (amounts.length === 0) {
    return { transactions: [] };
  }

  const entities = nlp.extractEntities(message);
  const today = new Date().toISOString().split('T')[0];

  // If multiple amounts, try to split by "and" or ","
  if (amounts.length > 1) {
    // Split message by " and " or ", " to get parts
    const parts = message.split(/\s+and\s+|,\s+/i);

    const transactions = [];
    for (let i = 0; i < amounts.length && i < parts.length; i++) {
      const part = parts[i];
      // Extract description from this part
      const partEntities = nlp.extractEntities(part);

      transactions.push({
        amount: amounts[i],
        description: partEntities.description || `Expense ${i + 1}`,
        category: partEntities.category || 'Other',
        date: today,
        notes: null,
        transactionType: partEntities.transactionType || 'debit'
      });
    }

    // If we have more amounts than parts, add remaining with generic descriptions
    for (let i = parts.length; i < amounts.length; i++) {
      transactions.push({
        amount: amounts[i],
        description: `Expense ${i + 1}`,
        category: 'Other',
        date: today,
        notes: null,
        transactionType: 'debit'
      });
    }

    return { transactions };
  }

  // Single amount - use original logic
  return {
    transactions: [{
      amount: entities.amount,
      description: entities.description,
      category: entities.category,
      date: entities.date ? entities.date.toISOString().split('T')[0] : today,
      notes: entities.notes,
      transactionType: entities.transactionType
    }]
  };
}

async function saveTransaction(user, transaction) {
  // Get or create category
  let category;
  if (transaction.category) {
    category = await Category.getOrCreate(user.id, transaction.category);
  } else {
    category = await Category.getUncategorized(user.id);
  }

  // Create expense
  const expense = await Expense.create({
    userId: user.id,
    categoryId: category ? category.id : null,
    date: new Date(transaction.date),
    description: transaction.description,
    amount: transaction.amount,
    transactionType: transaction.transactionType || 'debit',
    notes: transaction.notes
  });

  const categoryName = category ? category.name : 'Uncategorized';
  const emoji = (transaction.transactionType || 'debit') === 'debit' ? '📤' : '📥';

  let response = `✓ Expense added!\n\n${emoji} <b>${formatCurrency(transaction.amount)}</b> - ${expense.description}\n📅 ${formatDate(expense.date)}\n🏷️ ${categoryName}\n<i>ID: ${expense.id}</i>`;

  // Check spending limits for debit transactions
  if ((transaction.transactionType || 'debit') === 'debit' && category) {
    const limitNotification = await checkSpendingLimits(user.id, category.id);
    if (limitNotification) {
      response += `\n\n${limitNotification}`;
    }
  }

  return response;
}

/**
 * Check spending limits after adding an expense
 * @param {number} userId - User ID
 * @param {number} categoryId - Category ID
 * @returns {Promise<string|null>} Notification message or null
 */
async function checkSpendingLimits(userId, categoryId) {
  const { Limit } = require('../database/models');
  const limits = await Limit.getApplicableLimits(userId, categoryId);

  if (limits.length === 0) {
    return null;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  for (const limit of limits) {
    let currentSpending = 0;

    if (limit.limit_type === 'daily') {
      // Get today's spending for the category
      const result = await db.query(
        `SELECT COALESCE(SUM(amount), 0) as total FROM expenses
         WHERE user_id = $1 AND category_id = $2 AND date = $3 AND transaction_type = 'debit'`,
        [userId, categoryId, today]
      );
      currentSpending = parseFloat(result.rows[0].total);
    } else if (limit.limit_type === 'monthly') {
      // Get this month's spending for the category
      const result = await db.query(
        `SELECT COALESCE(SUM(amount), 0) as total FROM expenses
         WHERE user_id = $1 AND category_id = $2 AND date >= $3 AND date <= $4 AND transaction_type = 'debit'`,
        [userId, categoryId, startOfMonth, today]
      );
      currentSpending = parseFloat(result.rows[0].total);
    }

    const percentage = (currentSpending / parseFloat(limit.amount)) * 100;

    // Notify if limit exceeded or close to being exceeded (90%+)
    if (percentage >= 100) {
      return formatLimitNotification(limit, currentSpending, percentage);
    } else if (percentage >= 90) {
      const typeLabel = limit.limit_type === 'daily' ? 'Harian' : 'Bulanan';
      const categoryName = limit.category_name || 'All Categories';
      return `⚠️ <b>Limit Warning!</b>\n\n📊 Limit ${typeLabel} untuk <b>${categoryName}</b> sudah ${percentage.toFixed(0)}% terpakai.\n💰 Limit: ${formatCurrency(limit.amount)}\n📤 Spending: ${formatCurrency(currentSpending)}`;
    }
  }

  return null;
}

/**
 * Build a summary of multiple transactions
 */
function buildTransactionSummary(transactions) {
  const items = transactions.map((t, i) => {
    const emoji = (t.transactionType || 'debit') === 'debit' ? '📤' : '📥';
    return `${i + 1}. ${emoji} ${t.description || 'Expense'}: <b>${formatCurrency(t.amount)}</b> (${t.category || 'Uncategorized'})`;
  });

  const total = transactions.reduce((sum, t) => sum + t.amount, 0);
  const totalLabel = transactions.every(t => (t.transactionType || 'debit') === 'debit') ? 'Total' : 'Net Total';

  return `<b>Found ${transactions.length} transactions:</b>\n\n${items.join('\n')}\n\n<b>${totalLabel}: ${formatCurrency(total)}</b>\n\nPlease confirm with "yes" to save all, or "no" to cancel.`;
}

/**
 * Handle confirmation response (yes/no/correction)
 */
async function handleConfirmation(chatId, response) {
  const pending = confirmationStore.get(chatId);

  if (!pending) {
    return "No pending confirmation found. Please add expenses again.";
  }

  const responseLower = response.toLowerCase().trim();

  // Check for "yes" confirmation
  if (responseLower === 'yes' || responseLower === 'y' || responseLower === 'confirm' || responseLower === 'save') {
    return await confirmAndSave(chatId, pending.transactions);
  }

  // Check for "no" without correction
  if (responseLower === 'no' || responseLower === 'n' || responseLower === 'cancel' || responseLower === 'batal') {
    confirmationStore.delete(chatId);
    return "❌ Transaction(s) cancelled. No expenses were saved.";
  }

  // Check for correction pattern: "fix X to Y" or "change X to Y"
  const fixMatch = response.match(/(?:fix|change|update)\s+(\d+)\s+(?:to|menjadi)\s+(.+)/i);
  if (fixMatch) {
    return await handleCorrection(chatId, pending, parseInt(fixMatch[1]) - 1, fixMatch[2]);
  }

  // Check for correction pattern: "no, fix [description] to [amount]"
  const descFixMatch = response.match(/(?:fix|change|update)\s+(.+?)\s+(?:to|menjadi)\s+(?:Rp?\.?\s*)?([\d,.]+)/i);
  if (descFixMatch) {
    const targetDesc = descFixMatch[1].toLowerCase();
    const newAmount = validateAmount(descFixMatch[2]);

    if (newAmount) {
      const idx = pending.transactions.findIndex(t =>
        (t.description || '').toLowerCase().includes(targetDesc)
      );
      if (idx !== -1) {
        return await handleCorrection(chatId, pending, idx, `Rp${newAmount}`);
      }
    }
  }

  // If user says "no" but not a specific correction, ask which to fix
  return `Please specify which transaction to fix.\n\n${pending.summary}\n\nExample: "fix 1 to Rp35000" or "fix coffee to 35000"`;
}

/**
 * Handle transaction correction
 */
async function handleCorrection(chatId, pending, index, newValue) {
  if (index < 0 || index >= pending.transactions.length) {
    return `Invalid transaction number. Please specify a number between 1 and ${pending.transactions.length}.`;
  }

  const transaction = pending.transactions[index];

  // Check if newValue is an amount
  const amountMatch = newValue.match(/Rp?\.?\s*([\d,.]+)/i);
  if (amountMatch) {
    const newAmount = validateAmount(amountMatch[1]);
    if (newAmount) {
      transaction.amount = newAmount;
    } else {
      return "✗ Invalid amount. Please provide a valid number.";
    }
  }

  // Rebuild summary with updated transaction
  const summary = buildTransactionSummary(pending.transactions);
  confirmationStore.set(chatId, {
    transactions: pending.transactions,
    summary: summary
  });

  return `✓ Updated transaction ${index + 1}.\n\n${summary}\n\nPlease confirm with "yes" or make another correction.`;
}

/**
 * Confirm and save all pending transactions
 */
async function confirmAndSave(chatId, transactions) {
  // Get user from chatId
  const user = await User.findByChatId(chatId);
  if (!user) {
    confirmationStore.delete(chatId);
    return "✗ Error: User not found. Please start over.";
  }

  const results = [];
  let savedCount = 0;

  for (const transaction of transactions) {
    try {
      const result = await saveTransaction(user, transaction);
      results.push(result);
      savedCount++;
    } catch (error) {
      results.push(`✗ Failed to save "${transaction.description}": ${error.message}`);
    }
  }

  confirmationStore.delete(chatId);

  if (savedCount === transactions.length) {
    return `✓ All ${savedCount} expense(s) saved successfully!\n\n${results.join('\n\n')}`;
  } else {
    return `✓ Saved ${savedCount} of ${transactions.length} expense(s):\n\n${results.join('\n\n')}`;
  }
}

/**
 * Handle view expenses intent
 */
async function handleViewExpenses(user, message) {
  const filters = nlp.parseViewFilters(message);

  // Get category ID if category name specified
  let categoryId = null;
  if (filters.categoryName) {
    const category = await Category.findByName(user.id, filters.categoryName);
    if (category) {
      categoryId = category.id;
    }
  }

  // Determine if no date filters are specified - use ascending order with default limit 10
  const hasDateFilters = filters.startDate !== null || filters.endDate !== null;

  const expenses = await Expense.findByUser(user.id, {
    startDate: filters.startDate,
    endDate: filters.endDate,
    categoryId: categoryId,
    limit: hasDateFilters ? filters.limit : 10,
    orderAsc: !hasDateFilters
  });

  if (expenses.length === 0) {
    return 'No expenses found.';
  }

  let response = `<b>Your Expenses</b> (${expenses.length} found)\n\n`;
  response += formatExpenseList(expenses);

  return response;
}

/**
 * Handle edit expense intent
 */
async function handleEditExpense(user, message) {
  // Extract expense ID
  const idMatch = message.match(/(\d+)/);
  if (!idMatch) {
    return "✗ Error: Please specify expense ID. Example: 'Edit expense 123 Amount: Rp60000'";
  }

  const expenseId = validateExpenseId(idMatch[1]);
  if (!expenseId) {
    return "✗ Error: Invalid expense ID.";
  }

  // Check if expense exists
  const expense = await Expense.findById(expenseId, user.id);
  if (!expense) {
    return `✗ Error: Expense ${expenseId} not found.`;
  }

  // Extract updates
  const messageLower = message.toLowerCase();
  const updates = {};

  // Update amount — allow optional space before colon (e.g. "Amount : Rp60000")
  const amountMatch = message.match(/amount\s*:\s*(?:Rp|\$)?([\d,.]+)/i);
  if (amountMatch) {
    const { validateAmount } = require('../utils/validators');
    const amount = validateAmount(amountMatch[1]);
    if (amount) {
      updates.amount = amount;
    }
  }

  // Update category — allow optional space before colon (e.g. "Category : Food")
  const categoryMatch = message.match(/category\s*:\s*(\w+)/i);
  if (categoryMatch) {
    const categoryName = categoryMatch[1];
    const category = await Category.getOrCreate(user.id, categoryName);
    updates.categoryId = category.id;
  }

  // Update description — allow optional space before colon (e.g. "Description : Makan Malam")
  const descMatch = message.match(/description\s*:\s*(.+?)(?:\s+amount\s*:|\s+category\s*:|$)/i);
  if (descMatch) {
    updates.description = descMatch[1].trim().substring(0, 200);
  }

  // Guard: nothing to update
  if (Object.keys(updates).length === 0) {
    return "✗ Error: No valid fields to update. Use: Amount: Rp60000 | Category: Food | Description: text";
  }

  // Apply updates
  await Expense.update(expenseId, user.id, updates);

  return `✓ Expense ${expenseId} updated successfully`;
}

/**
 * Handle delete expense intent
 */
async function handleDeleteExpense(user, message) {
  // Extract expense ID
  const idMatch = message.match(/(\d+)/);
  if (!idMatch) {
    return "✗ Error: Please specify expense ID. Example: 'Delete expense 123'";
  }

  const expenseId = validateExpenseId(idMatch[1]);
  if (!expenseId) {
    return "✗ Error: Invalid expense ID.";
  }

  // Check if expense exists
  const expense = await Expense.findById(expenseId, user.id);
  if (!expense) {
    return `✗ Error: Expense ${expenseId} not found.`;
  }

  // Delete expense
  await Expense.remove(expenseId, user.id);

  return `✓ Expense ${expenseId} deleted successfully`;
}

/**
 * Handle generate report intent
 */
async function handleGenerateReport(user, message) {
  const { year, month } = nlp.parseReportMonth(message);
  return await reportGenerator.generateMonthlyReport(user.id, year, month);
}

/**
 * Handle add category intent
 */
async function handleAddCategory(user, message) {
  // Extract category name
  const categoryMatch = message.match(/(?:add|create|new)\s+category\s+(.+)/i) ||
    message.match(/category\s+(.+)/i);

  if (!categoryMatch) {
    return "✗ Error: Please specify category name. Example: 'Add category Travel'";
  }

  const categoryName = categoryMatch[1].trim();

  // Validate
  const validation = validateCategoryName(categoryName);
  if (!validation.isValid) {
    return `✗ Error: ${validation.error}`;
  }

  // Check if exists
  const existing = await Category.findByName(user.id, categoryName);
  if (existing) {
    return `✗ Error: Category '${categoryName}' already exists.`;
  }

  // Create
  const capitalizedName = categoryName.charAt(0).toUpperCase() + categoryName.slice(1).toLowerCase();
  await Category.create(user.id, capitalizedName, false);

  return `✓ Category '${capitalizedName}' added successfully`;
}

/**
 * Handle delete category intent
 */
async function handleDeleteCategory(user, message) {
  // Extract category name
  const categoryMatch = message.match(/(?:delete|remove)\s+category\s+(.+)/i) ||
    message.match(/category\s+(.+)/i);

  if (!categoryMatch) {
    return "✗ Error: Please specify category name. Example: 'Delete category Travel'";
  }

  const categoryName = categoryMatch[1].trim();

  // Find category
  const category = await Category.findByName(user.id, categoryName);
  if (!category) {
    return `✗ Error: Category '${categoryName}' not found.`;
  }

  // Check if system category
  if (category.is_system) {
    return `✗ Error: Cannot delete system category '${category.name}'.`;
  }

  // Delete
  await Category.remove(category.id, user.id);

  return `✓ Category '${category.name}' deleted successfully`;
}

/**
 * Handle view categories intent
 */
async function handleViewCategories(user) {
  const categories = await Category.findByUser(user.id);
  return formatCategoryList(categories);
}

/**
 * Handle view balance intent
 */
async function handleViewBalance(user) {
  const totals = await Expense.getAllTimeTotals(user.id);
  const recentIncome = await Expense.getRecentIncome(user.id, 5);

  return formatBalanceSummary(totals, recentIncome);
}

/**
 * Handle set limit intent
 */
async function handleSetLimit(user, message) {
  const params = nlp.parseLimitParams(message);

  if (!params.amount) {
    return "✗ Error: Please specify the limit amount. Example: 'set monthly limit for Food 500k'";
  }

  // Get category ID if category name specified
  let categoryId = null;
  if (params.categoryName) {
    const category = await Category.findByName(user.id, params.categoryName);
    if (!category) {
      return `✗ Error: Category '${params.categoryName}' not found. Use "Show categories" to see available categories.`;
    }
    categoryId = category.id;
  }

  // Import the Limit model
  const { Limit } = require('../database/models');

  // Set the limit
  await Limit.setLimit(user.id, params.limitType, categoryId, params.amount);

  const typeLabel = params.limitType === 'daily' ? 'Harian' : 'Bulanan';
  const categoryName = params.categoryName || 'All Categories';

  return `✓ Limit ${typeLabel} berhasil diset!\n\n📊 Kategori: ${categoryName}\n💰 Batas: ${formatCurrency(params.amount)}`;
}

/**
 * Get help message
 */
function getHelpMessage() {
  return `📱 <b>EXPENSES TRACKER - HELP</b>

━━━━━━━━━━━━━━━━━━━━━━━━━━

📝 <b>MENAMBAH EXPENSE:</b>
   Makan siang Rp50000
   Kopi Rp15000 Category: Food
   Gaji Rp5000000, Category: Income
   Belanja 50k Category: Shopping

👁️ <b>MELIHAT EXPENSE:</b>
   Show expenses
   Show expenses from last week
   Show expenses Category: Food
   Show last 10 expenses

💰 <b>MELIHAT SALDO:</b>
   Show balance
   Saldo

✏️ <b>MENGEDIT EXPENSE:</b>
   Edit expense 123 Amount: Rp60000
   Update expense 123 Category: Food

🗑️ <b>MENGHAPUS EXPENSE:</b>
   Delete expense 123

📊 <b>LAPORAN BULANAN:</b>
   Show monthly report
   Generate report for January

🏷️ <b>KATEGORI:</b>
   Add category Travel
   Show categories
   Delete category Travel

📈 <b>ATUR LIMIT:</b>
   set monthly limit for Food 500k
   set daily limit 200k

💡 <b>FORMAT YANG DIDUKUNG:</b>
   Rp50000, 50k, 50rb, IDR 50000

❓ <b>BANTUAN:</b>
   Help atau ?`;
}

/**
 * Get unknown command message
 */
function getUnknownMessage() {
  return `✗ I didn't understand that. Try:
- Add expense: "Makan siang Rp50000"
- View expenses: "Show expenses"
- Help: "Help"`;
}

module.exports = {
  processMessage
};
