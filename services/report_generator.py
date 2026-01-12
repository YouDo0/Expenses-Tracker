"""Report generation service."""

from datetime import datetime, date
from typing import List, Optional
from decimal import Decimal
from sqlalchemy.orm import Session
from sqlalchemy import func
from models.expense import Expense
from models.user import User
from utils.formatters import format_monthly_report


class ReportGenerator:
    """Service for generating monthly reports."""
    
    def __init__(self, db_session: Session):
        """
        Initialize report generator.
        
        Args:
            db_session: Database session
        """
        self.db = db_session
    
    def generate_monthly_report(self, user_id: int, month: Optional[date] = None) -> str:
        """
        Generate monthly report for a user.
        
        Args:
            user_id: User ID
            month: Month date (defaults to current month)
            
        Returns:
            Formatted report string
        """
        if month is None:
            month = date.today().replace(day=1)
        else:
            month = month.replace(day=1)
        
        # Get start and end dates for the month
        if month.month == 12:
            next_month = month.replace(year=month.year + 1, month=1)
        else:
            next_month = month.replace(month=month.month + 1)
        
        start_date = month
        end_date = next_month
        
        # Query expenses for the month
        expenses = self.db.query(Expense).filter(
            Expense.user_id == user_id,
            Expense.date >= start_date,
            Expense.date < end_date
        ).order_by(Expense.date, Expense.id).all()
        
        # Calculate totals
        total_debits = Decimal('0')
        total_credits = Decimal('0')
        
        for expense in expenses:
            amount = expense.get_amount_decimal()
            if expense.transaction_type == 'debit':
                total_debits += amount
            else:
                total_credits += amount
        
        # Format and return report
        return format_monthly_report(expenses, month, total_debits, total_credits)
    
    def get_monthly_summary(self, user_id: int, month: Optional[date] = None) -> dict:
        """
        Get monthly summary statistics.
        
        Args:
            user_id: User ID
            month: Month date (defaults to current month)
            
        Returns:
            Dictionary with summary statistics
        """
        if month is None:
            month = date.today().replace(day=1)
        else:
            month = month.replace(day=1)
        
        # Get start and end dates for the month
        if month.month == 12:
            next_month = month.replace(year=month.year + 1, month=1)
        else:
            next_month = month.replace(month=month.month + 1)
        
        start_date = month
        end_date = next_month
        
        # Calculate totals using SQL aggregation
        from sqlalchemy import case
        result = self.db.query(
            func.sum(case((Expense.transaction_type == 'debit', Expense.amount), else_=0)).label('total_debits'),
            func.sum(case((Expense.transaction_type == 'credit', Expense.amount), else_=0)).label('total_credits'),
            func.count(Expense.id).label('count')
        ).filter(
            Expense.user_id == user_id,
            Expense.date >= start_date,
            Expense.date < end_date
        ).first()
        
        total_debits = Decimal(str(result.total_debits or 0))
        total_credits = Decimal(str(result.total_credits or 0))
        count = result.count or 0
        
        return {
            'month': month,
            'total_debits': total_debits,
            'total_credits': total_credits,
            'net_balance': total_credits - total_debits,
            'expense_count': count
        }
