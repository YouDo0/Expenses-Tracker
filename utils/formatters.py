"""Formatting utilities for messages and reports."""

from datetime import date, datetime
from decimal import Decimal
from typing import List
from models.expense import Expense
from models.category import Category


def format_currency(amount: Decimal, show_symbol: bool = True) -> str:
    """
    Format amount as currency string.
    
    Args:
        amount: Decimal amount
        show_symbol: Whether to include currency symbol
        
    Returns:
        Formatted currency string
    """
    if show_symbol:
        return f"${amount:,.2f}"
    return f"{amount:,.2f}"


def format_expense_list(expenses: List[Expense], start_index: int = 1) -> str:
    """
    Format list of expenses for WhatsApp display.
    
    Args:
        expenses: List of Expense objects
        start_index: Starting index for numbering
        
    Returns:
        Formatted string
    """
    if not expenses:
        return "No expenses found."
    
    lines = []
    for idx, expense in enumerate(expenses, start=start_index):
        category_name = expense.category.name if expense.category else "Uncategorized"
        amount_str = format_currency(expense.get_amount_decimal())
        type_emoji = "📤" if expense.transaction_type == "debit" else "📥"
        
        line = (
            f"{idx}. {type_emoji} {amount_str} - {expense.description}\n"
            f"   📅 {expense.date} | 🏷️ {category_name}"
        )
        if expense.notes:
            line += f"\n   📝 {expense.notes}"
        lines.append(line)
    
    return "\n\n".join(lines)


def format_monthly_report(expenses: List[Expense], month: date, total_debits: Decimal, total_credits: Decimal) -> str:
    """
    Format monthly report for WhatsApp display.
    
    Args:
        expenses: List of Expense objects for the month
        month: Month date object
        total_debits: Total debits for the month
        total_credits: Total credits for the month
        
    Returns:
        Formatted report string
    """
    month_str = month.strftime("%B %Y")
    net_balance = total_credits - total_debits
    
    header = f"📊 MONTHLY REPORT - {month_str}\n" + "=" * 40 + "\n\n"
    
    # Report table header
    table_header = f"{'Day':<4} {'Description':<20} {'Category':<12} {'Debit':<10} {'Credit':<10} {'NET':<10}\n"
    table_header += "-" * 70 + "\n"
    
    # Build table rows
    rows = []
    running_balance = Decimal('0')
    
    for expense in expenses:
        day = expense.date.day
        desc = expense.description[:18] + ".." if len(expense.description) > 20 else expense.description
        category = (expense.category.name[:10] + ".." if expense.category and len(expense.category.name) > 12 
                   else (expense.category.name if expense.category else "Uncategorized"))
        
        debit = format_currency(expense.get_amount_decimal()) if expense.transaction_type == "debit" else ""
        credit = format_currency(expense.get_amount_decimal()) if expense.transaction_type == "credit" else ""
        
        if expense.transaction_type == "debit":
            running_balance -= expense.get_amount_decimal()
        else:
            running_balance += expense.get_amount_decimal()
        
        net = format_currency(running_balance)
        
        row = f"{day:<4} {desc:<20} {category:<12} {debit:<10} {credit:<10} {net:<10}"
        rows.append(row)
    
    # Summary
    summary = "\n" + "=" * 70 + "\n"
    summary += f"Total Debits:  {format_currency(total_debits)}\n"
    summary += f"Total Credits: {format_currency(total_credits)}\n"
    summary += f"Net Balance:   {format_currency(net_balance)}\n"
    summary += "=" * 70
    
    # Combine all parts
    report = header + table_header
    if rows:
        report += "\n".join(rows)
    else:
        report += "No expenses for this month."
    report += summary
    
    # Check if report is too long for WhatsApp (4096 char limit)
    if len(report) > 3500:  # Leave some buffer
        # Truncate and add note
        report = report[:3400] + "\n\n[Report truncated - too many expenses. Consider filtering by category.]" + summary
    
    return report


def format_category_list(categories: List[Category]) -> str:
    """
    Format list of categories for display.
    
    Args:
        categories: List of Category objects
        
    Returns:
        Formatted string
    """
    if not categories:
        return "No categories found."
    
    lines = []
    for category in categories:
        system_indicator = "🔒 " if category.is_system else "📝 "
        lines.append(f"{system_indicator}{category.name}")
    
    return "\n".join(lines)
