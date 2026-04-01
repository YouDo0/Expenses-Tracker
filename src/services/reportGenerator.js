/**
 * Report Generator Service
 */

const { Expense } = require('../database/models');
const { formatMonthlyReport, formatCurrency } = require('../utils/formatters');
const ExcelJS = require('exceljs');

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

/**
 * Generate XLSX report for a specific month
 * @param {number} userId - User ID
 * @param {number} year - Year
 * @param {number} month - Month (1-12)
 * @returns {Promise<Buffer>} Excel file buffer
 */
async function generateXlsxReport(userId, year, month) {
  const expenses = await Expense.findByMonth(userId, year, month);
  const totals = await Expense.getMonthlyTotals(userId, year, month);

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Expenses Tracker Bot';
  workbook.created = new Date();

  // Create Summary Sheet
  const summarySheet = workbook.addWorksheet('Summary');
  summarySheet.columns = [
    { header: 'Report', key: 'label', width: 25 },
    { header: 'Value', key: 'value', width: 20 }
  ];

  const monthName = new Date(year, month - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  summarySheet.addRow({ label: 'Report Period', value: monthName });
  summarySheet.addRow({ label: 'Total Income', value: totals.totalCredits });
  summarySheet.addRow({ label: 'Total Expenses', value: totals.totalDebits });
  summarySheet.addRow({ label: 'Net Balance', value: totals.netBalance });
  summarySheet.addRow({ label: 'Transaction Count', value: totals.count });

  // Make header row bold
  summarySheet.getRow(1).font = { bold: true };

  // Create Transactions Sheet
  const transSheet = workbook.addWorksheet('Transactions');
  transSheet.columns = [
    { header: 'ID', key: 'id', width: 8 },
    { header: 'Date', key: 'date', width: 12 },
    { header: 'Description', key: 'description', width: 30 },
    { header: 'Category', key: 'category', width: 15 },
    { header: 'Amount', key: 'amount', width: 15 },
    { header: 'Type', key: 'type', width: 10 },
    { header: 'Notes', key: 'notes', width: 25 }
  ];

  // Add header row
  const headerRow = transSheet.getRow(1);
  headerRow.font = { bold: true };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF4472C4' }
  };
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };

  // Add expense rows
  for (const expense of expenses) {
    transSheet.addRow({
      id: expense.id,
      date: expense.date instanceof Date ? expense.date.toISOString().split('T')[0] : expense.date,
      description: expense.description || '',
      category: expense.category_name || 'Uncategorized',
      amount: parseFloat(expense.amount),
      type: expense.transaction_type,
      notes: expense.notes || ''
    });
  }

  // Format amount column with currency
  transSheet.getColumn('amount').numFmt = '"Rp"#,##0';

  // Add borders to all cells
  transSheet.eachRow((row, rowNumber) => {
    row.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    });
  });

  // Generate buffer
  return await workbook.xlsx.writeBuffer();
}

module.exports = {
  generateMonthlyReport,
  getMonthlySummary,
  generateXlsxReport
};
