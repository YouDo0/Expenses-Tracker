"""Message handler service for processing WhatsApp commands."""

from datetime import datetime, date, timedelta
from typing import Optional, Dict, Tuple
from decimal import Decimal
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, desc
import re

from models.user import User
from models.category import Category
from models.expense import Expense
from services.nlp import NLPService
from services.report_generator import ReportGenerator
from utils.validators import validate_amount, validate_category_name
from utils.formatters import format_expense_list, format_category_list, format_currency


# Default system categories
DEFAULT_CATEGORIES = [
    'Food', 'Transportation', 'Entertainment', 'Utilities',
    'Shopping', 'Healthcare', 'Income', 'Uncategorized'
]


class MessageHandler:
    """Service for handling and processing WhatsApp messages."""
    
    def __init__(self, db_session: Session):
        """
        Initialize message handler.
        
        Args:
            db_session: Database session
        """
        self.db = db_session
        self.nlp = NLPService()
        self.report_generator = ReportGenerator(db_session)
    
    def get_or_create_user(self, phone_number: str) -> User:
        """
        Get existing user or create new one with default categories.
        
        Args:
            phone_number: User's phone number
            
        Returns:
            User object
        """
        # Clean phone number
        phone_number = phone_number.replace('whatsapp:', '').strip()
        
        user = self.db.query(User).filter(User.phone_number == phone_number).first()
        
        if not user:
            # Create new user
            user = User(phone_number=phone_number)
            self.db.add(user)
            self.db.flush()  # Get user ID
            
            # Create default categories
            for category_name in DEFAULT_CATEGORIES:
                category = Category(
                    user_id=user.id,
                    name=category_name,
                    is_system=(category_name != 'Uncategorized')
                )
                self.db.add(category)
            
            self.db.commit()
            self.db.refresh(user)
        
        return user
    
    def process_message(self, phone_number: str, message: str) -> str:
        """
        Process incoming WhatsApp message and return response.
        
        Args:
            phone_number: Sender's phone number
            message: Message text
            
        Returns:
            Response message string
        """
        try:
            # Get or create user
            user = self.get_or_create_user(phone_number)
            
            # Recognize intent
            intent = self.nlp.recognize_intent(message)
            
            # Handle based on intent
            if intent == 'add_expense':
                return self.handle_add_expense(user, message)
            elif intent == 'view_expenses':
                return self.handle_view_expenses(user, message)
            elif intent == 'edit_expense':
                return self.handle_edit_expense(user, message)
            elif intent == 'delete_expense':
                return self.handle_delete_expense(user, message)
            elif intent == 'generate_report':
                return self.handle_generate_report(user, message)
            elif intent == 'add_category':
                return self.handle_add_category(user, message)
            elif intent == 'delete_category':
                return self.handle_delete_category(user, message)
            elif intent == 'view_categories':
                return self.handle_view_categories(user)
            elif intent == 'help':
                return self.handle_help()
            else:
                return self.handle_unknown(message)
        
        except Exception as e:
            return f"✗ Error: {str(e)}"
    
    def handle_add_expense(self, user: User, message: str) -> str:
        """Handle add expense intent."""
        entities = self.nlp.extract_entities(message)
        
        # Validate required fields
        if not entities['amount']:
            return "✗ Error: Please specify the amount. Example: 'Spent $50 on groceries'"
        
        if not entities['description']:
            return "✗ Error: Please provide a description. Example: 'Spent $50 on groceries'"
        
        # Get or create category
        category = None
        if entities['category']:
            category = self.get_or_create_category(user.id, entities['category'])
        else:
            # Default to Uncategorized
            category = self.db.query(Category).filter(
                and_(Category.user_id == user.id, Category.name == 'Uncategorized')
            ).first()
        
        # Create expense
        expense = Expense(
            user_id=user.id,
            category_id=category.id if category else None,
            date=entities['date'].date() if entities['date'] else date.today(),
            description=entities['description'],
            amount=entities['amount'],
            transaction_type=entities['transaction_type'],
            notes=entities['notes']
        )
        
        self.db.add(expense)
        self.db.commit()
        
        category_name = category.name if category else "Uncategorized"
        amount_str = format_currency(entities['amount'])
        date_str = expense.date.strftime('%Y-%m-%d')
        
        return f"✓ Expense added: {amount_str} - {expense.description} ({category_name}) on {date_str}"
    
    def handle_view_expenses(self, user: User, message: str) -> str:
        """Handle view expenses intent."""
        message_lower = message.lower()
        
        # Parse filters
        query = self.db.query(Expense).filter(Expense.user_id == user.id)
        
        # Date range filter
        if 'last week' in message_lower:
            start_date = date.today() - timedelta(days=7)
            query = query.filter(Expense.date >= start_date)
        elif 'last month' in message_lower:
            first_day = date.today().replace(day=1)
            start_date = (first_day - timedelta(days=1)).replace(day=1)
            query = query.filter(Expense.date >= start_date, Expense.date < first_day)
        
        # Category filter
        category_match = re.search(r'category:\s*(\w+)', message_lower)
        if category_match:
            category_name = category_match.group(1).capitalize()
            category = self.db.query(Category).filter(
                and_(Category.user_id == user.id, Category.name == category_name)
            ).first()
            if category:
                query = query.filter(Expense.category_id == category.id)
        
        # Limit (e.g., "last 10 expenses")
        limit_match = re.search(r'last\s+(\d+)', message_lower)
        limit = int(limit_match.group(1)) if limit_match else 20
        
        # Order by date (newest first)
        expenses = query.order_by(desc(Expense.date), desc(Expense.id)).limit(limit).all()
        
        if not expenses:
            return "No expenses found."
        
        return format_expense_list(expenses)
    
    def handle_edit_expense(self, user: User, message: str) -> str:
        """Handle edit expense intent."""
        # Extract expense ID
        id_match = re.search(r'(\d+)', message)
        if not id_match:
            return "✗ Error: Please specify expense ID. Example: 'Edit expense 123 Amount: $60'"
        
        expense_id = int(id_match.group(1))
        expense = self.db.query(Expense).filter(
            and_(Expense.id == expense_id, Expense.user_id == user.id)
        ).first()
        
        if not expense:
            return f"✗ Error: Expense {expense_id} not found."
        
        # Extract updates
        message_lower = message.lower()
        
        # Update amount
        amount_match = re.search(r'amount:\s*\$?([\d,]+\.?\d*)', message_lower)
        if amount_match:
            amount = validate_amount(amount_match.group(1))
            if amount:
                expense.amount = amount
        
        # Update category
        category_match = re.search(r'category:\s*(\w+)', message_lower)
        if category_match:
            category_name = category_match.group(1).capitalize()
            category = self.get_or_create_category(user.id, category_name)
            expense.category_id = category.id
        
        # Update description
        desc_match = re.search(r'description:\s*(.+?)(?:\s+amount:|\s+category:|$)', message_lower)
        if desc_match:
            expense.description = desc_match.group(1).strip()[:200]
        
        self.db.commit()
        
        return f"✓ Expense {expense_id} updated successfully"
    
    def handle_delete_expense(self, user: User, message: str) -> str:
        """Handle delete expense intent."""
        # Extract expense ID
        id_match = re.search(r'(\d+)', message)
        if not id_match:
            return "✗ Error: Please specify expense ID. Example: 'Delete expense 123'"
        
        expense_id = int(id_match.group(1))
        expense = self.db.query(Expense).filter(
            and_(Expense.id == expense_id, Expense.user_id == user.id)
        ).first()
        
        if not expense:
            return f"✗ Error: Expense {expense_id} not found."
        
        self.db.delete(expense)
        self.db.commit()
        
        return f"✓ Expense {expense_id} deleted successfully"
    
    def handle_generate_report(self, user: User, message: str) -> str:
        """Handle generate report intent."""
        # Parse month if specified
        report_month = None
        message_lower = message.lower()
        
        # Try to extract month
        month_match = re.search(r'(january|february|march|april|may|june|july|august|september|october|november|december)', message_lower)
        if month_match:
            month_name = month_match.group(1)
            month_num = datetime.strptime(month_name, '%B').month
            report_month = date.today().replace(month=month_num, day=1)
        
        return self.report_generator.generate_monthly_report(user.id, report_month)
    
    def handle_add_category(self, user: User, message: str) -> str:
        """Handle add category intent."""
        # Extract category name
        category_match = re.search(r'(?:add|create|new)\s+category\s+(.+)', message.lower())
        if not category_match:
            category_match = re.search(r'category\s+(.+)', message.lower())
        
        if not category_match:
            return "✗ Error: Please specify category name. Example: 'Add category Travel'"
        
        category_name = category_match.group(1).strip().capitalize()
        
        # Validate category name
        is_valid, error_msg = validate_category_name(category_name)
        if not is_valid:
            return f"✗ Error: {error_msg}"
        
        # Check if category already exists
        existing = self.db.query(Category).filter(
            and_(Category.user_id == user.id, Category.name == category_name)
        ).first()
        
        if existing:
            return f"✗ Error: Category '{category_name}' already exists."
        
        # Create category
        category = Category(user_id=user.id, name=category_name, is_system=False)
        self.db.add(category)
        self.db.commit()
        
        return f"✓ Category '{category_name}' added successfully"
    
    def handle_delete_category(self, user: User, message: str) -> str:
        """Handle delete category intent."""
        # Extract category name
        category_match = re.search(r'(?:delete|remove)\s+category\s+(.+)', message.lower())
        if not category_match:
            category_match = re.search(r'category\s+(.+)', message.lower())
        
        if not category_match:
            return "✗ Error: Please specify category name. Example: 'Delete category Travel'"
        
        category_name = category_match.group(1).strip().capitalize()
        
        category = self.db.query(Category).filter(
            and_(Category.user_id == user.id, Category.name == category_name)
        ).first()
        
        if not category:
            return f"✗ Error: Category '{category_name}' not found."
        
        if category.is_system:
            return f"✗ Error: Cannot delete system category '{category_name}'."
        
        # Delete category (expenses will have category_id set to NULL)
        self.db.delete(category)
        self.db.commit()
        
        return f"✓ Category '{category_name}' deleted successfully"
    
    def handle_view_categories(self, user: User) -> str:
        """Handle view categories intent."""
        categories = self.db.query(Category).filter(Category.user_id == user.id).order_by(Category.is_system.desc(), Category.name).all()
        
        if not categories:
            return "No categories found."
        
        return format_category_list(categories)
    
    def handle_help(self) -> str:
        """Handle help intent."""
        help_text = """📱 EXPENSES TRACKER - HELP

📝 ADD EXPENSE:
   "Spent $50 on groceries"
   "Coffee $5.50 Category: Food"
   "Received $200 from client, Category: Income"

👁️ VIEW EXPENSES:
   "Show expenses"
   "Show expenses from last week"
   "Show expenses Category: Food"
   "Show last 10 expenses"

✏️ EDIT EXPENSE:
   "Edit expense 123 Amount: $60"
   "Update expense 123 Category: Food"

🗑️ DELETE EXPENSE:
   "Delete expense 123"

📊 MONTHLY REPORT:
   "Show monthly report"
   "Generate report for January"

🏷️ CATEGORIES:
   "Add category Travel"
   "Show categories"
   "Delete category Travel"

❓ HELP:
   "Help" or "?"
"""
        return help_text
    
    def handle_unknown(self, message: str) -> str:
        """Handle unknown intent."""
        return ("✗ I didn't understand that. Try:\n"
                "- Add expense: 'Spent $50 on groceries'\n"
                "- View expenses: 'Show expenses'\n"
                "- Help: 'Help'")
    
    def get_or_create_category(self, user_id: int, category_name: str) -> Category:
        """
        Get existing category or create new one.
        
        Args:
            user_id: User ID
            category_name: Category name
            
        Returns:
            Category object
        """
        category_name = category_name.capitalize()
        category = self.db.query(Category).filter(
            and_(Category.user_id == user_id, Category.name == category_name)
        ).first()
        
        if not category:
            category = Category(user_id=user_id, name=category_name, is_system=False)
            self.db.add(category)
            self.db.commit()
            self.db.refresh(category)
        
        return category
