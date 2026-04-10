/**
 * Natural Language Processing service
 */

const chrono = require('chrono-node');
const { validateAmount } = require('../utils/validators');

// Transaction type keywords
const DEBIT_KEYWORDS = ['spent', 'bought', 'paid', 'expense', 'purchase', 'cost', 'spend', 'buy', 'bayar', 'beli'];
const CREDIT_KEYWORDS = ['received', 'income', 'earned', 'credit', 'salary', 'payment', 'terima', 'dapat', 'gaji'];

// Category keywords mapping
const CATEGORY_KEYWORDS = { 
  'food': ['food', 'groceries', 'lunch', 'dinner', 'breakfast', 'coffee', 'restaurant', 'meal', 'eat', 'makan', 'makanan'],
  'transportation': ['transport', 'taxi', 'uber', 'grab', 'gojek', 'gas', 'fuel', 'parking', 'metro', 'bus', 'train', 'bensin', 'parkir'],
  'entertainment': ['movie', 'cinema', 'game', 'concert', 'music', 'netflix', 'spotify', 'hiburan', 'film'],
  'utilities': ['electric', 'water', 'internet', 'phone', 'utility', 'bill', 'listrik', 'air', 'tagihan'],
  'shopping': ['shopping', 'store', 'mall', 'shop', 'belanja', 'toko'],
  'healthcare': ['hospital', 'doctor', 'medicine', 'pharmacy', 'medical', 'health', 'dokter', 'obat', 'rumah sakit'],
  'income': ['salary', 'income', 'payment', 'paycheck', 'wage', 'gaji', 'pendapatan']
};

/**
 * Extract entities from message
 * @param {string} message - User message
 * @returns {Object} Extracted entities
 */
function extractEntities(message) {
  const messageLower = message.toLowerCase().trim();

  const entities = {
    amount: null,
    date: null,
    category: null,
    description: null,
    transactionType: 'debit',
    notes: null
  };

  // Extract amount
  entities.amount = extractAmount(message);

  // Extract date
  entities.date = extractDate(message);

  // Extract transaction type
  entities.transactionType = extractTransactionType(messageLower);

  // Extract category (explicit or implicit)
  entities.category = extractCategory(messageLower);

  // Extract description
  entities.description = extractDescription(message, entities);

  // Extract notes
  entities.notes = extractNotes(message);

  return entities;
}

/**
 * Extract amount from message
 * @param {string} message - Message string
 * @returns {number|null} Amount or null
 */
function extractAmount(message) {
  // Patterns to match amounts (Rupiah patterns first)
  const patterns = [
    /(?:Rp|IDR)\s?[\d,.]+/gi,             // Rp50000, IDR 50.000
    /[\d,]+\.?\d*\s*(?:k|rb|ribu)/gi,     // 50k, 50rb, 50ribu
    /\$[\d,]+\.?\d*/g,                    // $50, $50.99
    /[\d,]+\.?\d*\s*(?:dollars?|usd)/gi,  // 50 dollars
    /(?:amount|price|cost):\s*(?:Rp|\$)?[\d,]+\.?\d*/gi,  // Amount: Rp50000
    /\d+\.?\d*/g                          // Fallback: any number
  ];

  for (const pattern of patterns) {
    const matches = message.match(pattern);
    if (matches && matches.length > 0) {
      // Return the first valid amount
      for (const match of matches) {
        const amount = validateAmount(match);
        if (amount) return amount;
      }
    }
  }

  return null;
}

/**
 * Extract multiple amounts from message (preserves order)
 * @param {string} message - Message string
 * @returns {Array} Array of amounts in order of appearance
 */
function extractAllAmounts(message) {
  const amounts = [];
  const seen = new Set();

  // Pattern that matches any amount format
  const allPatterns = [
    /(?:Rp|IDR)\s?[\d,.]+/gi,
    /[\d,]+\.?\d*\s*(?:k|rb|ribu)/gi,
    /\$[\d,]+\.?\d*/g,
    /[\d,]+\.?\d*\s*(?:dollars?|usd)/gi
  ];

  for (const pattern of allPatterns) {
    const matches = message.match(pattern);
    if (matches) {
      for (const match of matches) {
        const amount = validateAmount(match);
        if (amount && !seen.has(amount)) {
          seen.add(amount);
          amounts.push(amount);
        }
      }
    }
  }

  return amounts; // Return in order of appearance
}

/**
 * Extract date from message
 * @param {string} message - Message string
 * @returns {Date} Date object (defaults to today)
 */
function extractDate(message) {
  // Use chrono for natural language date parsing
  const parsed = chrono.parseDate(message);

  if (parsed) {
    return parsed;
  }

  // No date found - let database default to CURRENT_DATE
  return null;
}

/**
 * Extract transaction type
 * @param {string} messageLower - Lowercase message
 * @returns {string} 'debit' or 'credit'
 */
function extractTransactionType(messageLower) {
  // Check for credit keywords first
  for (const keyword of CREDIT_KEYWORDS) {
    if (messageLower.includes(keyword)) {
      return 'credit';
    }
  }

  // Check for debit keywords
  for (const keyword of DEBIT_KEYWORDS) {
    if (messageLower.includes(keyword)) {
      return 'debit';
    }
  }

  // Default to debit
  return 'debit';
}

/**
 * Extract category from message
 * @param {string} messageLower - Lowercase message
 * @returns {string|null} Category name or null
 */
function extractCategory(messageLower) {
  // Look for explicit category pattern
  const categoryPattern = /category:\s*(\w+)|cat:\s*(\w+)/i;
  const match = messageLower.match(categoryPattern);
  if (match) {
    const category = (match[1] || match[2]).trim();
    return category.charAt(0).toUpperCase() + category.slice(1);
  }

  // Infer category from keywords
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    for (const keyword of keywords) {
      if (messageLower.includes(keyword)) {
        return category.charAt(0).toUpperCase() + category.slice(1);
      }
    }
  }

  return null;
}

/**
 * Extract description from message
 * @param {string} message - Original message
 * @param {Object} entities - Already extracted entities
 * @returns {string|null} Description or null
 */
function extractDescription(message, entities) {
  let text = message;

  // Remove amount patterns (Rupiah first)
  text = text.replace(/(?:Rp|IDR)\s?[\d,.]+/gi, '');
  text = text.replace(/[\d,]+\.?\d*\s*(?:k|rb|ribu)/gi, '');
  text = text.replace(/\$[\d,]+\.?\d*/g, '');
  text = text.replace(/[\d,]+\.?\d*\s*(?:dollars?|usd)/gi, '');

  // Remove category patterns
  text = text.replace(/category:\s*\w+|cat:\s*\w+/gi, '');

  // Remove notes patterns
  text = text.replace(/notes?:\s*.+?(?:category:|cat:|$)/gi, '');

  // Remove transaction type keywords
  const allKeywords = [...DEBIT_KEYWORDS, ...CREDIT_KEYWORDS];
  for (const keyword of allKeywords) {
    text = text.replace(new RegExp(`\\b${keyword}\\b`, 'gi'), '');
  }

  // Remove common prepositions
  text = text.replace(/\b(on|for|from|at|to)\b/gi, '');

  // Clean up
  text = text.replace(/\s+/g, ' ').trim();

  // Remove leading/trailing punctuation
  text = text.replace(/^[,.\s]+|[,.\s]+$/g, '');

  if (text.length > 0) {
    return text.substring(0, 200);
  }

  return null;
}

/**
 * Extract notes from message
 * @param {string} message - Original message
 * @returns {string|null} Notes or null
 */
function extractNotes(message) {
  const notesPattern = /notes?:\s*(.+?)(?:category:|cat:|$)/i;
  const match = message.match(notesPattern);
  if (match) {
    return match[1].trim().substring(0, 500);
  }
  return null;
}

/**
 * Recognize user intent from message
 * @param {string} message - User message
 * @returns {string} Intent string
 */
function recognizeIntent(message) {
  const messageLower = message.toLowerCase().trim();

  // View expenses
  if (/\b(show|list|view|display|lihat|tampilkan)\b.*\b(expense|pengeluaran)/i.test(messageLower)) {
    return 'view_expenses';
  }

  // Edit expense
  if (/\b(edit|update|change|modify|ubah|ganti)\b.*\b(expense|pengeluaran)/i.test(messageLower)) {
    return 'edit_expense';
  }

  // Delete expense
  if (/\b(delete|remove|hapus|cancel)\b.*\b(expense|pengeluaran)/i.test(messageLower)) {
    return 'delete_expense';
  }

  // Export report (xlsx)
  if (/\b(export|download).*\breport\b/i.test(messageLower)) {
    return 'export_report';
  }

  // Generate report
  if (/\b(report|summary|laporan|ringkasan|monthly)\b/i.test(messageLower)) {
    return 'generate_report';
  }

  // View balance
  if (/\b(balance|saldo)\b/i.test(messageLower)) {
    return 'view_balance';
  }

  // Set limit
  if (/\b(set|atur)\b.*\b(limit|batas)\b/i.test(messageLower)) {
    return 'set_limit';
  }

  // Manage categories
  // Only treat as a category command if "category" is NOT used as a parameter (e.g., "Category: food")
  // A parameter form looks like "category:" or "cat:" followed by a value
  const hasCategoryParam = /\b(category|cat):\s*\w+/i.test(messageLower);
  if (!hasCategoryParam && /\b(category|categories|kategori)\b/i.test(messageLower)) {
    if (/\b(add|create|new|tambah|buat)\b/i.test(messageLower)) {
      return 'add_category';
    }
    if (/\b(delete|remove|hapus)\b/i.test(messageLower)) {
      return 'delete_category';
    }
    if (/\b(show|list|view|lihat)\b/i.test(messageLower)) {
      return 'view_categories';
    }
    return 'view_categories';
  }

  // Help
  if (/^(help|\?|menu|bantuan|tolong)$/i.test(messageLower)) {
    return 'help';
  }

  // Add expense (check if message contains an amount)
  if (extractAmount(message)) {
    return 'add_expense';
  }

  // Unknown intent
  return 'unknown';
}

/**
 * Parse view expenses filters from message
 * @param {string} message - User message
 * @returns {Object} Filter options
 */
function parseViewFilters(message) {
  const messageLower = message.toLowerCase();
  const filters = {
    startDate: null,
    endDate: null,
    categoryName: null,
    limit: 10
  };

  // Parse date range
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (/last\s*week|minggu\s*lalu/i.test(messageLower)) {
    filters.startDate = new Date(today);
    filters.startDate.setDate(filters.startDate.getDate() - 7);
    filters.endDate = new Date(today);
  } else if (/last\s*month|bulan\s*lalu/i.test(messageLower)) {
    filters.startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    filters.endDate = new Date(today.getFullYear(), today.getMonth(), 0);
  } else if (/this\s*month|bulan\s*ini/i.test(messageLower)) {
    filters.startDate = new Date(today.getFullYear(), today.getMonth(), 1);
    filters.endDate = new Date(today);
  } else if (/today|hari\s*ini/i.test(messageLower)) {
    filters.startDate = new Date(today);
    filters.endDate = new Date(today);
  } else if (/yesterday|kemarin/i.test(messageLower)) {
    filters.startDate = new Date(today);
    filters.startDate.setDate(filters.startDate.getDate() - 1);
    filters.endDate = new Date(filters.startDate);
  }

  // Parse category
  const categoryMatch = messageLower.match(/category:\s*(\w+)/i);
  if (categoryMatch) {
    filters.categoryName = categoryMatch[1];
  }

  // Parse limit
  const limitMatch = messageLower.match(/last\s*(\d+)/);
  if (limitMatch) {
    filters.limit = Math.min(parseInt(limitMatch[1]), 50);
  }

  return filters;
}

/**
 * Parse month from report request
 * @param {string} message - User message
 * @returns {Object} {year, month}
 */
function parseReportMonth(message) {
  const messageLower = message.toLowerCase();
  const today = new Date();

  // Month names
  const months = {
    'january': 1, 'february': 2, 'march': 3, 'april': 4,
    'may': 5, 'june': 6, 'july': 7, 'august': 8,
    'september': 9, 'october': 10, 'november': 11, 'december': 12,
    'januari': 1, 'februari': 2, 'maret': 3, 'april': 4,
    'mei': 5, 'juni': 6, 'juli': 7, 'agustus': 8,
    'september': 9, 'oktober': 10, 'november': 11, 'desember': 12
  };

  // Check for month name
  for (const [name, num] of Object.entries(months)) {
    if (messageLower.includes(name)) {
      return { year: today.getFullYear(), month: num };
    }
  }

  // Default to current month
  return { year: today.getFullYear(), month: today.getMonth() + 1 };
}

/**
 * Parse limit parameters from message
 * @param {string} message - User message
 * @returns {Object} {limitType, categoryName, amount}
 */
function parseLimitParams(message) {
  const messageLower = message.toLowerCase();
  const params = {
    limitType: null,
    categoryName: null,
    amount: null
  };

  // Parse limit type (daily/monthly)
  if (/\bdaily\b/i.test(messageLower)) {
    params.limitType = 'daily';
  } else if (/\b(monthly|bulanan)\b/i.test(messageLower)) {
    params.limitType = 'monthly';
  } else {
    // Default to monthly if not specified
    params.limitType = 'monthly';
  }

  // Parse category name - look for patterns like "for Food" or "Category: Food"
  const categoryMatch = messageLower.match(/(?:for|category:\s*)\s*(\w+)/i);
  if (categoryMatch) {
    params.categoryName = categoryMatch[1];
  }

  // Parse amount
  params.amount = extractAmount(message);

  return params;
}

module.exports = {
  extractEntities,
  recognizeIntent,
  parseViewFilters,
  parseReportMonth,
  parseLimitParams,
  extractAmount,
  extractAllAmounts
};
