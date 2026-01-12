"""Natural Language Processing service for parsing WhatsApp messages."""

import re
from datetime import datetime, timedelta
from typing import Dict, Optional, Tuple
from decimal import Decimal
import dateparser
from utils.validators import validate_amount


class NLPService:
    """Service for natural language processing of expense messages."""
    
    # Transaction type keywords
    DEBIT_KEYWORDS = ['spent', 'bought', 'paid', 'expense', 'purchase', 'cost', 'spend', 'buy']
    CREDIT_KEYWORDS = ['received', 'income', 'earned', 'credit', 'salary', 'pay', 'payment']
    
    # Category keywords mapping
    CATEGORY_KEYWORDS = {
        'food': ['food', 'groceries', 'lunch', 'dinner', 'breakfast', 'coffee', 'restaurant', 'meal', 'eat'],
        'transportation': ['transport', 'taxi', 'uber', 'gas', 'fuel', 'parking', 'metro', 'bus', 'train'],
        'entertainment': ['movie', 'cinema', 'game', 'concert', 'music', 'netflix', 'spotify'],
        'utilities': ['electric', 'water', 'internet', 'phone', 'utility', 'bill'],
        'shopping': ['shopping', 'store', 'mall', 'shop', 'buy'],
        'healthcare': ['hospital', 'doctor', 'medicine', 'pharmacy', 'medical', 'health'],
        'income': ['salary', 'income', 'payment', 'paycheck', 'wage']
    }
    
    def __init__(self):
        """Initialize NLP service."""
        pass
    
    def extract_entities(self, message: str) -> Dict:
        """
        Extract entities from message (amount, date, category, description, transaction_type).
        
        Args:
            message: User message string
            
        Returns:
            Dictionary with extracted entities
        """
        message_lower = message.lower().strip()
        
        entities = {
            'amount': None,
            'date': None,
            'category': None,
            'description': None,
            'transaction_type': 'debit',  # Default to debit
            'notes': None
        }
        
        # Extract amount
        entities['amount'] = self._extract_amount(message)
        
        # Extract date
        entities['date'] = self._extract_date(message)
        
        # Extract transaction type
        entities['transaction_type'] = self._extract_transaction_type(message_lower)
        
        # Extract category (explicit or implicit)
        entities['category'] = self._extract_category(message_lower)
        
        # Extract description
        entities['description'] = self._extract_description(message, entities)
        
        # Extract notes (if present after description)
        entities['notes'] = self._extract_notes(message)
        
        return entities
    
    def _extract_amount(self, message: str) -> Optional[Decimal]:
        """Extract amount from message."""
        # Look for explicit amount patterns
        patterns = [
            r'\$[\d,]+\.?\d*',  # $50, $50.99
            r'[\d,]+\.?\d*\s*(?:dollars?|usd)',  # 50 dollars, 50.99 USD
            r'(?:amount|price|cost):\s*\$?[\d,]+\.?\d*',  # Amount: $50
            r'\d+\.?\d*',  # Fallback: any number
        ]
        
        for pattern in patterns:
            matches = re.findall(pattern, message, re.IGNORECASE)
            if matches:
                # Take the first match
                amount_str = matches[0]
                amount = validate_amount(amount_str)
                if amount:
                    return amount
        
        return None
    
    def _extract_date(self, message: str) -> Optional[datetime]:
        """Extract date from message."""
        # Try dateparser first
        parsed_date = dateparser.parse(message, languages=['en'])
        if parsed_date:
            return parsed_date.replace(hour=0, minute=0, second=0, microsecond=0)
        
        # Handle relative dates
        message_lower = message.lower()
        today = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
        
        if 'today' in message_lower:
            return today
        elif 'yesterday' in message_lower:
            return today - timedelta(days=1)
        elif 'tomorrow' in message_lower:
            return today + timedelta(days=1)
        elif 'last week' in message_lower:
            return today - timedelta(weeks=1)
        elif 'this month' in message_lower:
            return today.replace(day=1)
        
        # Default to today if no date found
        return today
    
    def _extract_transaction_type(self, message_lower: str) -> str:
        """Extract transaction type (debit or credit)."""
        # Check for credit keywords first
        for keyword in self.CREDIT_KEYWORDS:
            if keyword in message_lower:
                return 'credit'
        
        # Check for debit keywords
        for keyword in self.DEBIT_KEYWORDS:
            if keyword in message_lower:
                return 'debit'
        
        # Default to debit
        return 'debit'
    
    def _extract_category(self, message_lower: str) -> Optional[str]:
        """Extract category from message."""
        # Look for explicit category pattern
        category_pattern = r'category:\s*(\w+)|cat:\s*(\w+)'
        match = re.search(category_pattern, message_lower)
        if match:
            category = match.group(1) or match.group(2)
            return category.strip().capitalize()
        
        # Infer category from keywords
        for category, keywords in self.CATEGORY_KEYWORDS.items():
            for keyword in keywords:
                if keyword in message_lower:
                    return category.capitalize()
        
        return None
    
    def _extract_description(self, message: str, entities: Dict) -> Optional[str]:
        """Extract description from message."""
        # Remove known patterns to extract description
        text = message
        
        # Remove amount patterns
        text = re.sub(r'\$[\d,]+\.?\d*', '', text)
        text = re.sub(r'[\d,]+\.?\d*\s*(?:dollars?|usd)', '', text, flags=re.IGNORECASE)
        
        # Remove category patterns
        text = re.sub(r'category:\s*\w+|cat:\s*\w+', '', text, flags=re.IGNORECASE)
        
        # Remove transaction type keywords
        for keyword in self.DEBIT_KEYWORDS + self.CREDIT_KEYWORDS:
            text = re.sub(rf'\b{keyword}\b', '', text, flags=re.IGNORECASE)
        
        # Remove date patterns (simple ones)
        text = re.sub(r'\b(today|yesterday|tomorrow|last week|this month)\b', '', text, flags=re.IGNORECASE)
        
        # Clean up
        text = re.sub(r'\s+', ' ', text).strip()
        
        # Remove common prepositions and articles
        text = re.sub(r'^(spent|bought|paid|received|earned)\s+(on|for|from)\s+', '', text, flags=re.IGNORECASE)
        
        if text:
            return text[:200]  # Limit description length
        
        return None
    
    def _extract_notes(self, message: str) -> Optional[str]:
        """Extract notes from message (text after 'Notes:' or similar)."""
        notes_pattern = r'notes?:\s*(.+?)(?:category:|cat:|$)'
        match = re.search(notes_pattern, message, re.IGNORECASE)
        if match:
            return match.group(1).strip()[:500]  # Limit notes length
        return None
    
    def recognize_intent(self, message: str) -> str:
        """
        Recognize user intent from message.
        
        Args:
            message: User message string
            
        Returns:
            Intent string (add_expense, view_expenses, edit_expense, delete_expense, 
                          generate_report, manage_categories, help, unknown)
        """
        message_lower = message.lower().strip()
        
        # View expenses
        if any(keyword in message_lower for keyword in ['show', 'list', 'view', 'display']) and 'expense' in message_lower:
            return 'view_expenses'
        
        # Edit expense
        if any(keyword in message_lower for keyword in ['edit', 'update', 'change', 'modify']) and 'expense' in message_lower:
            return 'edit_expense'
        
        # Delete expense
        if any(keyword in message_lower for keyword in ['delete', 'remove', 'cancel']) and 'expense' in message_lower:
            return 'delete_expense'
        
        # Generate report
        if any(keyword in message_lower for keyword in ['report', 'summary', 'monthly']) or \
           ('show' in message_lower and 'report' in message_lower):
            return 'generate_report'
        
        # Manage categories
        if 'category' in message_lower or 'categories' in message_lower:
            if any(keyword in message_lower for keyword in ['add', 'create', 'new']):
                return 'add_category'
            elif any(keyword in message_lower for keyword in ['delete', 'remove']):
                return 'delete_category'
            elif any(keyword in message_lower for keyword in ['show', 'list', 'view']):
                return 'view_categories'
            return 'manage_categories'
        
        # Help
        if message_lower in ['help', '?', 'commands', 'menu']:
            return 'help'
        
        # Add expense (default for messages with amounts)
        if self._extract_amount(message):
            return 'add_expense'
        
        # Unknown intent
        return 'unknown'
