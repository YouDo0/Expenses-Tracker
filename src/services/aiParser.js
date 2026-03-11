/**
 * AI-powered Natural Language Processing service using OpenRouter API
 */

const https = require('https');

const DEFAULT_MODEL = 'anthropic/claude-3-haiku';
const API_URL = 'https://openrouter.ai/api/v1/chat/completions';

// Valid categories (from requirements)
const VALID_CATEGORIES = [
  'Food', 'Transport', 'Shopping', 'Bills', 'Entertainment', 'Health', 'Education', 'Other'
];

/**
 * Call OpenRouter API
 * @param {string} message - User message
 * @param {string} apiKey - OpenRouter API key
 * @param {string} model - Model to use
 * @returns {Promise<Object>} Parsed result
 */
async function callOpenRouterAPI(message, apiKey, model) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      model: model,
      messages: [
        {
          role: 'system',
          content: `You are an expense parser. Extract expense transactions from user input.

For each expense, extract:
- amount: numeric value only (no currency symbols)
- description: short clear description
- category: one of [${VALID_CATEGORIES.join(', ')}]
- date: YYYY-MM-DD format (if not specified, use today's date 2026-03-10)
- notes: extra context beyond description, or null if none
- transactionType: "debit" for expenses, "credit" for income

Return ONLY valid JSON in this exact format:
{
  "transactions": [
    {
      "amount": number or null,
      "description": "string",
      "category": "string",
      "date": "YYYY-MM-DD",
      "notes": "string or null",
      "transactionType": "debit" or "credit"
    }
  ],
  "intent": "add_expense" | "view_expenses" | "edit_expense" | "delete_expense" | "generate_report" | "view_categories" | "add_category" | "delete_category" | "help" | "unknown"
}

If no valid amount is found for an expense, set amount to null.
If the text is unrelated to expenses (greetings, questions, etc.), return empty transactions array.`
        },
        {
          role: 'user',
          content: message
        }
      ]
    });

    const options = {
      hostname: 'openrouter.ai',
      port: 443,
      path: '/api/v1/chat/completions',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(body);
          if (response.error) {
            reject(new Error(response.error.message));
            return;
          }
          const content = response.choices[0].message.content;
          resolve(JSON.parse(content));
        } catch (e) {
          reject(new Error(`Failed to parse AI response: ${e.message}`));
        }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

/**
 * Parse message using AI
 * @param {string} message - User message
 * @returns {Object} Parsed result with entities and intent
 */
async function parseWithAI(message) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  const model = process.env.OPENROUTER_MODEL || DEFAULT_MODEL;

  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY is not configured');
  }

  const result = await callOpenRouterAPI(message, apiKey, model);

  // Ensure valid categories
  if (result.transactions) {
    result.transactions = result.transactions.map(t => ({
      ...t,
      category: VALID_CATEGORIES.includes(t.category) ? t.category : 'Other'
    }));
  }

  return result;
}

/**
 * Wrapper for backward compatibility with existing messageHandler
 * @param {string} message - User message
 * @returns {Object} Extracted entities (compatible with nlp.js format)
 */
async function extractEntities(message) {
  const aiResult = await parseWithAI(message);

  if (!aiResult.transactions || aiResult.transactions.length === 0) {
    return {
      amount: null,
      date: null,
      category: null,
      description: null,
      transactionType: 'debit',
      notes: null,
      intent: aiResult.intent || 'unknown'
    };
  }

  // Return first transaction's data for backward compatibility
  const transaction = aiResult.transactions[0];
  return {
    amount: transaction.amount,
    date: transaction.date ? new Date(transaction.date) : new Date(),
    category: transaction.category,
    description: transaction.description,
    transactionType: transaction.transactionType,
    notes: transaction.notes,
    intent: aiResult.intent
  };
}

/**
 * Get all transactions from message (supports multiple)
 * @param {string} message - User message
 * @returns {Object} Full AI result with all transactions
 */
async function extractAllTransactions(message) {
  return parseWithAI(message);
}

module.exports = {
  parseWithAI,
  extractEntities,
  extractAllTransactions
};
