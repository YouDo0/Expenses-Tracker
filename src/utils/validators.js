/**
 * Validation utilities
 */

/**
 * Validate and parse amount string
 * @param {string} amountStr - Amount string
 * @returns {number|null} Parsed amount or null if invalid
 */
function validateAmount(amountStr) {
  if (!amountStr) return null;
  
  // Remove currency symbols and whitespace
  let cleaned = amountStr.toString().trim();
  cleaned = cleaned.replace(/[$€£¥Rp\s,]/gi, '');
  
  // Handle 'k' suffix (e.g., 50k = 50000)
  if (/^\d+k$/i.test(cleaned)) {
    cleaned = cleaned.replace(/k$/i, '000');
  }
  
  const amount = parseFloat(cleaned);
  
  if (isNaN(amount) || amount <= 0) {
    return null;
  }
  
  // Round to 2 decimal places
  return Math.round(amount * 100) / 100;
}

/**
 * Validate phone number
 * @param {string} phone - Phone number
 * @returns {boolean} Is valid
 */
function validatePhoneNumber(phone) {
  if (!phone) return false;
  
  // Remove common formatting
  const cleaned = phone.replace(/[\s\-\(\)]/g, '');
  
  // Basic validation: should contain digits and optional + prefix
  return /^\+?\d{10,15}$/.test(cleaned);
}

/**
 * Validate category name
 * @param {string} name - Category name
 * @returns {Object} Validation result {isValid, error}
 */
function validateCategoryName(name) {
  if (!name) {
    return { isValid: false, error: 'Category name cannot be empty' };
  }
  
  const trimmed = name.trim();
  
  if (trimmed.length < 1) {
    return { isValid: false, error: 'Category name cannot be empty' };
  }
  
  if (trimmed.length > 100) {
    return { isValid: false, error: 'Category name cannot exceed 100 characters' };
  }
  
  // Check for invalid characters
  if (/[<>:"/\\|?*]/.test(trimmed)) {
    return { isValid: false, error: 'Category name contains invalid characters' };
  }
  
  return { isValid: true, error: null };
}

/**
 * Validate expense ID
 * @param {string|number} id - Expense ID
 * @returns {number|null} Parsed ID or null if invalid
 */
function validateExpenseId(id) {
  const parsed = parseInt(id);
  return isNaN(parsed) || parsed <= 0 ? null : parsed;
}

module.exports = {
  validateAmount,
  validatePhoneNumber,
  validateCategoryName,
  validateExpenseId
};
