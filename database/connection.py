"""Database connection and initialization module."""

import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, scoped_session
from dotenv import load_dotenv

load_dotenv()

# Get database URL from environment variable
DATABASE_URL = os.getenv('DATABASE_POOL_URL') or os.getenv('DATABASE_URL')

if not DATABASE_URL:
    raise ValueError("DATABASE_URL or DATABASE_POOL_URL environment variable is required")

# Create engine
engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    pool_size=5,
    max_overflow=10,
    echo=os.getenv('ENVIRONMENT') == 'development'
)

# Create session factory
SessionLocal = scoped_session(sessionmaker(autocommit=False, autoflush=False, bind=engine))

# Create base class for models
Base = declarative_base()

# Database instance for Flask
db = Base


def get_db_session():
    """Get database session."""
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()


def init_db():
    """Initialize database tables."""
    from models.user import User
    from models.category import Category
    from models.expense import Expense
    
    Base.metadata.create_all(bind=engine)
    print("Database tables created successfully!")
