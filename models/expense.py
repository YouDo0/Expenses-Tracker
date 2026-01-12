"""Expense model."""

from sqlalchemy import Column, Integer, String, Text, Date, Numeric, DateTime, ForeignKey, CheckConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database.connection import Base
from decimal import Decimal


class Expense(Base):
    """Expense model representing an expense or income entry."""
    
    __tablename__ = 'expenses'
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    category_id = Column(Integer, ForeignKey('categories.id', ondelete='SET NULL'), nullable=True, index=True)
    date = Column(Date, nullable=False, index=True)
    description = Column(Text, nullable=False)
    amount = Column(Numeric(10, 2), nullable=False)
    transaction_type = Column(String(10), nullable=False)  # 'debit' or 'credit'
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    user = relationship("User", back_populates="expenses")
    category = relationship("Category", back_populates="expenses")
    
    # Check constraint
    __table_args__ = (CheckConstraint("transaction_type IN ('debit', 'credit')", name='check_transaction_type'),)
    
    def __repr__(self):
        return f"<Expense(id={self.id}, description='{self.description}', amount={self.amount}, type='{self.transaction_type}')>"
    
    def get_amount_decimal(self) -> Decimal:
        """Get amount as Decimal."""
        return Decimal(str(self.amount))
