/**
 * Message Handler Service
 */

const { User, Category, Expense } = require('../database/models');
const nlp = require('./nlp');
const reportGenerator = require('./reportGenerator');
const { formatExpenseList, formatCategoryList, formatCurrency, formatDate } = require('../utils/formatters');
const { validateCategoryName, validateExpenseId } = require('../utils/validators');

/**
 * Process incoming message
 * @param {string} phoneNumber - Sender's phone number
 * @param {string} message - Message text
 * @returns {Promise<string>} Response message
 */
async function processMessage(phoneNumber, message) {
  try {
    // Get or create user
    const user = await User.getOrCreate(phoneNumber);
    
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
  const entities = nlp.extractEntities(message);
  
  // Validate required fields
  if (!entities.amount) {
    return "✗ Error: Please specify the amount. Example: 'Spent $50 on groceries'";
  }
  
  if (!entities.description) {
    return "✗ Error: Please provide a description. Example: 'Spent $50 on groceries'";
  }
  
  // Get or create category
  let category;
  if (entities.category) {
    category = await Category.getOrCreate(user.id, entities.category);
  } else {
    category = await Category.getUncategorized(user.id);
  }
  
  // Create expense
  const expense = await Expense.create({
    userId: user.id,
    categoryId: category ? category.id : null,
    date: entities.date,
    description: entities.description,
    amount: entities.amount,
    transactionType: entities.transactionType,
    notes: entities.notes
  });
  
  const categoryName = category ? category.name : 'Uncategorized';
  const emoji = entities.transactionType === 'debit' ? '📤' : '📥';
  
  return `✓ Expense added!\n\n${emoji} *${formatCurrency(entities.amount)}* - ${expense.description}\n📅 ${formatDate(expense.date)}\n🏷️ ${categoryName}\n_ID: ${expense.id}_`;
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
  
  const expenses = await Expense.findByUser(user.id, {
    startDate: filters.startDate,
    endDate: filters.endDate,
    categoryId: categoryId,
    limit: filters.limit
  });
  
  if (expenses.length === 0) {
    return 'No expenses found.';
  }
  
  let response = `*Your Expenses* (${expenses.length} found)\n\n`;
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
    return "✗ Error: Please specify expense ID. Example: 'Edit expense 123 Amount: $60'";
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
  
  // Update amount
  const amountMatch = message.match(/amount:\s*\$?([\d,.]+)/i);
  if (amountMatch) {
    const { validateAmount } = require('../utils/validators');
    const amount = validateAmount(amountMatch[1]);
    if (amount) {
      updates.amount = amount;
    }
  }
  
  // Update category
  const categoryMatch = message.match(/category:\s*(\w+)/i);
  if (categoryMatch) {
    const categoryName = categoryMatch[1];
    const category = await Category.getOrCreate(user.id, categoryName);
    updates.categoryId = category.id;
  }
  
  // Update description
  const descMatch = message.match(/description:\s*(.+?)(?:\s+amount:|\s+category:|$)/i);
  if (descMatch) {
    updates.description = descMatch[1].trim().substring(0, 200);
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
 * Get help message
 */
function getHelpMessage() {
  return `📱 *EXPENSES TRACKER - HELP*

📝 *ADD EXPENSE:*
  "Spent $50 on groceries"
  "Coffee $5.50 Category: Food"
  "Received $200 from client, Category: Income"

👁️ *VIEW EXPENSES:*
  "Show expenses"
  "Show expenses from last week"
  "Show expenses Category: Food"
  "Show last 10 expenses"

✏️ *EDIT EXPENSE:*
  "Edit expense 123 Amount: $60"
  "Update expense 123 Category: Food"

🗑️ *DELETE EXPENSE:*
  "Delete expense 123"

📊 *MONTHLY REPORT:*
  "Show monthly report"
  "Generate report for January"

🏷️ *CATEGORIES:*
  "Add category Travel"
  "Show categories"
  "Delete category Travel"

❓ *HELP:*
  "Help" or "?"`;
}

/**
 * Get unknown command message
 */
function getUnknownMessage() {
  return `✗ I didn't understand that. Try:
- Add expense: "Spent $50 on groceries"
- View expenses: "Show expenses"
- Help: "Help"`;
}

module.exports = {
  processMessage
};
