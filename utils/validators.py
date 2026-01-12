"""Validation utilities."""

import re
from decimal import Decimal, InvalidOperation
from typing import Optional


def validate_amount(amount_str: str) -> Optional[Decimal]:
    """
    Validate and parse amount string.
    
    Args:
        amount_str: Amount string (e.g., "$50", "50.99", "fifty")
        
    Returns:
        Decimal amount or None if invalid
    """
    if not amount_str:
        return None
    
    # Remove currency symbols and whitespace
    cleaned = re.sub(r'[\$€£¥,\s]', '', amount_str.strip())
    
    try:
        amount = Decimal(cleaned)
        if amount <= 0:
            return None
        return amount
    except (InvalidOperation, ValueError):
        return None


def validate_phone_number(phone: str) -> bool:
    """
    Validate phone number format.
    
    Args:
        phone: Phone number string
        
    Returns:
        True if valid, False otherwise
    """
    if not phone:
        return False
    
    # Remove common formatting characters
    cleaned = re.sub(r'[\s\-\(\)\+]', '', phone)
    
    # Basic validation: should contain only digits and optional + prefix
    pattern = r'^\+?\d{10,15}$'
    return bool(re.match(pattern, cleaned))


def validate_category_name(name: str) -> tuple[bool, Optional[str]]:
    """
    Validate category name.
    
    Args:
        name: Category name
        
    Returns:
        Tuple of (is_valid, error_message)
    """
    if not name:
        return False, "Category name cannot be empty"
    
    name = name.strip()
    
    if len(name) < 1:
        return False, "Category name cannot be empty"
    
    if len(name) > 100:
        return False, "Category name cannot exceed 100 characters"
    
    # Check for invalid characters
    if re.search(r'[<>:"/\\|?*]', name):
        return False, "Category name contains invalid characters"
    
    return True, None
