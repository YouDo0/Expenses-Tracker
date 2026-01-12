# Expenses Tracker - Requirements Document

## 1. Project Overview

### 1.1 Application Description

The Expenses Tracker is a WhatsApp-integrated expense management application that allows users to track, manage, and analyze their expenses through natural language conversations. Users can add, view, edit, and delete expenses directly via WhatsApp messages, eliminating the need for a separate mobile app or web interface. The application processes natural language input to extract expense information and provides comprehensive monthly reporting capabilities.

### 1.2 Goals and Objectives

- **Primary Goal**: Provide a seamless, conversational expense tracking experience via WhatsApp
- **User Experience**: Enable users to log expenses using natural language without learning specific commands or formats
- **Data Management**: Maintain accurate, categorized expense records with detailed metadata (date, description, category, notes, debit, credit)
- **Reporting**: Generate comprehensive monthly reports with clear financial summaries
- **Accessibility**: Make expense tracking accessible to users who primarily communicate via WhatsApp
- **Reliability**: Ensure data persistence and security for personal financial information

### 1.3 User Personas

**Primary Persona: The Busy Professional**
- Age: 28-45
- Tech-savvy but prefers simplicity
- Frequently uses WhatsApp for communication
- Needs quick expense logging without switching apps
- Values convenience over complex features
- Wants monthly spending insights

**Secondary Persona: The Small Business Owner**
- Age: 35-55
- Manages personal and business expenses
- Needs category-based organization
- Requires monthly reports for budgeting
- Values data accuracy and reliability

**Tertiary Persona: The Travel Enthusiast**
- Age: 25-40
- Frequently makes expenses while traveling
- Needs quick logging from mobile device
- Values location/context notes with expenses
- Wants to track spending across categories while traveling

## 2. Technology Stack

### 2.1 Backend
- **Language**: Python 3.9+
- **Framework**: Flask or FastAPI (RESTful API)
- **Runtime**: Serverless Functions (Vercel) or Container-based deployment

### 2.2 Database
- **Primary Database**: PostgreSQL
- **Hosting Options**:
  - Vercel Postgres (if using Vercel)
  - External PostgreSQL service (Supabase, Neon, Railway, AWS RDS)
- **ORM/Query Builder**: SQLAlchemy or asyncpg (for async operations)

### 2.3 WhatsApp Integration
- **Service Provider**: Twilio API for WhatsApp Business
- **Communication Protocol**: Twilio WhatsApp API (Webhooks)
- **Message Processing**: Natural Language Processing (NLP) libraries

### 2.4 Natural Language Processing
- **Libraries**: spaCy, NLTK, or OpenAI API for intent recognition and entity extraction
- **Approach**: Rule-based parsing with ML-enhanced entity extraction

### 2.5 Deployment
- **Primary Platform**: Vercel (Serverless Functions)
- **Alternative Platforms**: Railway, Render, AWS Lambda, Google Cloud Functions
- **Considerations**: Python backend compatibility with serverless architecture

### 2.6 Development Tools
- **Version Control**: Git
- **Package Management**: pip, requirements.txt or Poetry
- **Environment Management**: python-dotenv, virtual environments

## 3. Functional Requirements

### 3.1 Core Expense Management

#### 3.1.1 Add Expense
- **FR-1.1**: Users must be able to add expenses via WhatsApp messages in natural language
- **FR-1.2**: System must extract the following information from messages:
  - Date (defaults to current date if not specified)
  - Description (required)
  - Category (required, defaults to "Uncategorized" if not specified)
  - Amount (required, supports debit/credit)
  - Notes (optional)
- **FR-1.3**: System must support multiple input formats:
  - "Spent $50 on groceries today"
  - "Coffee $5.50 Category: Food"
  - "Received $200 from client, Category: Income"
- **FR-1.4**: System must provide confirmation message after successful expense addition
- **FR-1.5**: System must validate amount format and reject invalid entries with helpful error messages

#### 3.1.2 View Expenses
- **FR-2.1**: Users must be able to view expenses via WhatsApp
- **FR-2.2**: System must support viewing expenses by:
  - Date range (e.g., "Show expenses from last week")
  - Category (e.g., "Show all Food expenses")
  - Recent expenses (e.g., "Show last 10 expenses")
- **FR-2.3**: System must format expense lists for WhatsApp display (limited to readable message length)
- **FR-2.4**: System must support pagination for large result sets

#### 3.1.3 Edit Expense
- **FR-3.1**: Users must be able to edit existing expenses via WhatsApp
- **FR-3.2**: System must allow editing of:
  - Description
  - Amount (debit/credit)
  - Category
  - Date
  - Notes
- **FR-3.3**: System must provide confirmation after successful edit
- **FR-3.4**: Users must reference expenses by ID or description for editing

#### 3.1.4 Delete Expense
- **FR-4.1**: Users must be able to delete expenses via WhatsApp
- **FR-4.2**: System must require confirmation for delete operations
- **FR-4.3**: System must provide confirmation after successful deletion

### 3.2 Category Management

#### 3.2.1 Category Operations
- **FR-5.1**: System must support predefined categories (Food, Transportation, Entertainment, Utilities, Income, etc.)
- **FR-5.2**: Users must be able to create custom categories via WhatsApp
- **FR-5.3**: Users must be able to view all available categories
- **FR-5.4**: System must validate category names (no duplicates, reasonable length)
- **FR-5.5**: Users must be able to rename or delete categories (with migration of existing expenses)

### 3.3 Monthly Reports

#### 3.3.1 Report Generation
- **FR-6.1**: System must generate monthly reports with the following columns:
  - Day (date)
  - Description
  - Category
  - Notes
  - Debit (expenses)
  - Credit (income)
  - NET (running balance)
- **FR-6.2**: Reports must be generated on demand via WhatsApp command
- **FR-6.3**: Reports must include totals for:
  - Total Debits (expenses)
  - Total Credits (income)
  - Net Balance for the month
- **FR-6.4**: Reports must be formatted for WhatsApp delivery (may require PDF export or formatted text)
- **FR-6.5**: System must support generating reports for specific months (default: current month)
- **FR-6.6**: Reports must be sorted chronologically by date

### 3.4 Natural Language Processing

#### 3.4.1 Message Understanding
- **FR-7.1**: System must understand natural language expense entries without strict format requirements
- **FR-7.2**: System must extract entities:
  - Amounts (with currency symbols or words)
  - Dates (relative: "today", "yesterday", "last week" or absolute: "Jan 15", "2024-01-15")
  - Categories (explicit or inferred from context)
  - Descriptions (free text)
- **FR-7.3**: System must handle ambiguous inputs and request clarification when necessary
- **FR-7.4**: System must support multiple languages (priority: English, with extensibility for others)

### 3.5 User Interaction

#### 3.5.1 Help and Commands
- **FR-8.1**: System must provide help menu explaining available commands
- **FR-8.2**: System must handle unknown commands gracefully with suggestions
- **FR-8.3**: System must provide examples of valid input formats

## 4. Non-Functional Requirements

### 4.1 Performance Requirements

- **NFR-1.1**: API response time for expense operations must be < 2 seconds (95th percentile)
- **NFR-1.2**: Monthly report generation must complete within 5 seconds for up to 1000 expenses
- **NFR-1.3**: System must handle concurrent requests from multiple users
- **NFR-1.4**: Database queries must be optimized with proper indexing
- **NFR-1.5**: WhatsApp message processing must complete within Twilio's timeout limits (typically 30 seconds)

### 4.2 Security Requirements

- **NFR-2.1**: All API endpoints must be authenticated (Twilio signature verification)
- **NFR-2.2**: User data must be isolated (each WhatsApp number = separate user)
- **NFR-2.3**: Database connections must use SSL/TLS
- **NFR-2.4**: Sensitive environment variables (API keys, database credentials) must be stored securely
- **NFR-2.5**: Input validation must prevent SQL injection and XSS attacks
- **NFR-2.6**: API keys and tokens must be rotated periodically
- **NFR-2.7**: User data must be encrypted at rest

### 4.3 Scalability Considerations

- **NFR-3.1**: System architecture must support horizontal scaling
- **NFR-3.2**: Database must handle growth from 100 to 10,000+ users
- **NFR-3.3**: Serverless functions must scale automatically based on load
- **NFR-3.4**: Consider database connection pooling for serverless environments
- **NFR-3.5**: Implement caching for frequently accessed data (categories, recent expenses)

### 4.4 Reliability and Availability

- **NFR-4.1**: System uptime target: 99.5%
- **NFR-4.2**: Database backups must be performed daily
- **NFR-4.3**: Error handling must prevent data loss on failures
- **NFR-4.4**: System must log all operations for debugging and audit purposes

### 4.5 Usability Requirements

- **NFR-5.1**: User interactions must be intuitive and require minimal learning curve
- **NFR-5.2**: Error messages must be clear and actionable
- **NFR-5.3**: System must provide helpful feedback for all operations
- **NFR-5.4**: Reports must be readable and well-formatted for mobile viewing

## 5. Database Schema

### 5.1 Tables

#### 5.1.1 Users Table
```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    phone_number VARCHAR(20) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_phone ON users(phone_number);
```

#### 5.1.2 Categories Table
```sql
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    is_system BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, name)
);

CREATE INDEX idx_categories_user ON categories(user_id);
CREATE INDEX idx_categories_user_name ON categories(user_id, name);
```

#### 5.1.3 Expenses Table
```sql
CREATE TABLE expenses (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
    date DATE NOT NULL,
    description TEXT NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    transaction_type VARCHAR(10) CHECK (transaction_type IN ('debit', 'credit')) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_expenses_user ON expenses(user_id);
CREATE INDEX idx_expenses_user_date ON expenses(user_id, date);
CREATE INDEX idx_expenses_category ON expenses(category_id);
CREATE INDEX idx_expenses_user_month ON expenses(user_id, DATE_TRUNC('month', date));
```

### 5.2 Relationships

- **Users → Categories**: One-to-Many (a user can have many categories)
- **Users → Expenses**: One-to-Many (a user can have many expenses)
- **Categories → Expenses**: One-to-Many (a category can have many expenses)
- **Cascading Deletes**: When a user is deleted, all their categories and expenses are deleted
- **Category Deletion**: When a category is deleted, expenses are set to NULL (can be reassigned to "Uncategorized")

### 5.3 Indexes

- Primary keys: All tables have primary key indexes (automatic)
- Foreign keys: Indexed for join performance
- Composite indexes:
  - `(user_id, date)` on expenses for monthly report queries
  - `(user_id, DATE_TRUNC('month', date))` for efficient monthly filtering
  - `(user_id, name)` on categories for quick category lookups

### 5.4 Default System Categories

Upon user creation, the following system categories should be created:
- Food
- Transportation
- Entertainment
- Utilities
- Shopping
- Healthcare
- Income
- Uncategorized

## 6. WhatsApp Integration

### 6.1 Twilio API Setup Requirements

- **TWI-1.1**: Twilio Account with WhatsApp Business API enabled
- **TWI-1.2**: Twilio WhatsApp Sandbox (for development) or approved WhatsApp Business Account
- **TWI-1.3**: Webhook URL configured in Twilio Console pointing to application endpoint
- **TWI-1.4**: Environment variables:
  - `TWILIO_ACCOUNT_SID`
  - `TWILIO_AUTH_TOKEN`
  - `TWILIO_WHATSAPP_NUMBER` (Twilio WhatsApp number, e.g., `whatsapp:+14155238886`)
- **TWI-1.5**: Request signature verification enabled for security

### 6.2 Message Format Specifications

#### 6.2.1 Incoming Messages (User → System)

**Expense Entry Formats:**
- "Spent $50 on groceries"
- "Bought lunch $12.50 Category: Food"
- "Coffee $5.50 today"
- "Received $200 from client, Category: Income"
- "Expense: $25.99 Description: Gas Category: Transportation Date: 2024-01-15"

**View Commands:**
- "Show expenses"
- "Show expenses from last week"
- "Show expenses Category: Food"
- "Show last 10 expenses"

**Edit Commands:**
- "Edit expense 123 Amount: $60"
- "Update expense ID 123 Category: Food"

**Delete Commands:**
- "Delete expense 123"
- "Remove expense ID 123"

**Report Commands:**
- "Show monthly report"
- "Generate report for January"
- "Monthly summary"

**Category Commands:**
- "Add category Travel"
- "Show categories"
- "Delete category Travel"

#### 6.2.2 Outgoing Messages (System → User)

**Confirmation Messages:**
- "✓ Expense added: $50.00 - Groceries (Food) on 2024-01-15"
- "✓ Expense updated successfully"
- "✓ Expense deleted"

**Error Messages:**
- "✗ Error: Invalid amount format. Please use numbers like 50 or $50"
- "✗ Error: Category not found. Use 'Show categories' to see available categories"

**Expense Lists:**
- Formatted as numbered lists with ID, date, description, amount, category
- Pagination indicators: "Showing 1-10 of 25 expenses. Reply 'more' for next page"

**Monthly Reports:**
- Formatted table with columns: Day | Description | Category | Debit | Credit | NET
- Summary totals at the bottom
- If too long, provide as downloadable PDF or link

### 6.3 Natural Language Understanding Requirements

#### 6.3.1 Entity Extraction

- **Amount Extraction**:
  - Support formats: "$50", "50", "50.99", "fifty dollars", "€50"
  - Detect currency symbols and convert if needed (default: USD)
  
- **Date Extraction**:
  - Relative: "today", "yesterday", "tomorrow", "last week", "this month"
  - Absolute: "Jan 15", "January 15, 2024", "2024-01-15", "15/01/2024"
  - Default: current date if not specified

- **Category Extraction**:
  - Explicit: "Category: Food", "cat: Transportation"
  - Implicit: Infer from keywords (e.g., "groceries" → Food, "gas" → Transportation)
  - Fuzzy matching for typos

- **Transaction Type Detection**:
  - Keywords for debit: "spent", "bought", "paid", "expense"
  - Keywords for credit: "received", "income", "earned", "credit"

#### 6.3.2 Intent Recognition

- Add Expense
- View Expenses
- Edit Expense
- Delete Expense
- Generate Report
- Manage Categories
- Help/Unknown

#### 6.3.3 Clarification Requests

When information is missing or ambiguous:
- "Please specify the amount for this expense"
- "Which category should this be? Reply with 'Category: [name]'"
- "Did you receive or spend this money? (debit/credit)"

## 7. Deployment Requirements

### 7.1 Vercel Deployment Considerations

#### 7.1.1 Serverless Functions
- **VER-1.1**: Python backend must be deployed as Vercel Serverless Functions
- **VER-1.2**: Functions must be stateless and handle cold starts efficiently
- **VER-1.3**: Function timeout limits: 10 seconds (Hobby) to 60 seconds (Pro)
- **VER-1.4**: Maximum payload size: 4.5 MB
- **VER-1.5**: Consider using Vercel Edge Functions for faster response times if applicable

#### 7.1.2 Python Runtime
- **VER-2.1**: Python runtime version must be specified in `runtime.txt` or `vercel.json`
- **VER-2.2**: Dependencies must be specified in `requirements.txt`
- **VER-2.3**: Consider using Python 3.9+ for compatibility

#### 7.1.3 Alternative Deployment Options
If full Python backend is needed with long-running processes:
- **Railway**: Supports Docker containers, PostgreSQL, Python
- **Render**: Supports Python web services, PostgreSQL
- **AWS Lambda**: Serverless with longer timeouts (15 minutes)
- **Google Cloud Functions**: Similar to AWS Lambda

### 7.2 Database Hosting

#### 7.2.1 Vercel Postgres
- **DB-1.1**: If using Vercel, consider Vercel Postgres for integrated hosting
- **DB-1.2**: Connection pooling required for serverless functions
- **DB-1.3**: Use serverless-friendly connection libraries (pg with connection pooling)

#### 7.2.2 External PostgreSQL Services
- **DB-2.1**: Options: Supabase, Neon, Railway Postgres, AWS RDS, Google Cloud SQL
- **DB-2.2**: Connection string must be stored as environment variable
- **DB-2.3**: SSL/TLS connection required
- **DB-2.4**: Connection pooling service (PgBouncer) recommended for serverless

### 7.3 Environment Variables

Required environment variables for deployment:

```
# Twilio Configuration
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886

# Database Configuration
DATABASE_URL=postgresql://user:password@host:port/database
# OR for connection pooling (recommended for serverless)
DATABASE_POOL_URL=postgresql://user:password@host:port/database?pgbouncer=true

# Application Configuration
ENVIRONMENT=production
APP_SECRET_KEY=your_secret_key

# Optional: NLP Service (if using external API)
OPENAI_API_KEY=your_api_key  # If using OpenAI for NLP
```

### 7.4 Webhook Configuration

- **WEB-1.1**: Twilio webhook URL must point to: `https://your-domain.vercel.app/api/webhook/whatsapp`
- **WEB-1.2**: HTTPS required (automatically provided by Vercel)
- **WEB-1.3**: Webhook endpoint must handle POST requests
- **WEB-1.4**: Request signature verification must be implemented

### 7.5 Build and Deployment Process

- **DEP-1.1**: Code must be in Git repository
- **DEP-1.2**: Vercel automatically builds and deploys on git push (if connected)
- **DEP-1.3**: Build command: `pip install -r requirements.txt` (if needed)
- **DEP-1.4**: Output directory: Not applicable for serverless functions
- **DEP-1.5**: Install command: Handled automatically by Vercel

## 8. Development Requirements

### 8.1 Python Dependencies

Core dependencies (requirements.txt):

```
# Web Framework
flask>=2.3.0
# OR
fastapi>=0.100.0
uvicorn>=0.23.0

# Database
sqlalchemy>=2.0.0
psycopg2-binary>=2.9.0
# OR for async
asyncpg>=0.28.0

# Twilio
twilio>=8.0.0

# Environment
python-dotenv>=1.0.0

# Natural Language Processing
spacy>=3.6.0
# OR
openai>=1.0.0  # If using OpenAI API

# Date Parsing
dateparser>=1.2.0

# HTTP Client (if needed)
requests>=2.31.0

# Utilities
python-dateutil>=2.8.0
```

### 8.2 Development Setup

#### 8.2.1 Local Development Environment

1. **Python Version**: Python 3.9 or higher
2. **Virtual Environment**:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```
3. **Local PostgreSQL Database**:
   - Install PostgreSQL locally or use Docker
   - Create database: `CREATE DATABASE expenses_tracker;`
   - Run migrations/schema setup
4. **Environment Variables**:
   - Create `.env` file with local configuration
   - Never commit `.env` to version control
5. **Twilio Sandbox**:
   - Set up Twilio WhatsApp Sandbox for testing
   - Configure webhook to point to ngrok/tunneling service for local testing

#### 8.2.2 Project Structure

```
expenses-tracker/
├── api/
│   ├── __init__.py
│   ├── webhook.py          # Twilio webhook endpoint
│   ├── expenses.py         # Expense CRUD endpoints
│   └── reports.py          # Report generation
├── models/
│   ├── __init__.py
│   ├── user.py
│   ├── category.py
│   └── expense.py
├── services/
│   ├── __init__.py
│   ├── nlp.py              # Natural language processing
│   ├── message_handler.py  # WhatsApp message handling
│   └── report_generator.py
├── database/
│   ├── __init__.py
│   ├── connection.py
│   └── migrations/
├── utils/
│   ├── __init__.py
│   ├── validators.py
│   └── formatters.py
├── tests/
│   ├── test_nlp.py
│   ├── test_expenses.py
│   └── test_webhook.py
├── requirements.txt
├── .env.example
├── vercel.json             # Vercel configuration
├── runtime.txt             # Python version
└── README.md
```

### 8.3 Testing Requirements

#### 8.3.1 Unit Tests
- **TEST-1.1**: NLP entity extraction (amount, date, category)
- **TEST-1.2**: Intent recognition
- **TEST-1.3**: Database models and relationships
- **TEST-1.4**: Expense CRUD operations
- **TEST-1.5**: Report generation logic

#### 8.3.2 Integration Tests
- **TEST-2.1**: Twilio webhook handling
- **TEST-2.2**: End-to-end message processing
- **TEST-2.3**: Database operations with real PostgreSQL
- **TEST-2.4**: Monthly report generation with sample data

#### 8.3.3 Testing Framework
- **Framework**: pytest
- **Database Testing**: Use test database or mocking
- **Coverage Target**: Minimum 70% code coverage

#### 8.3.4 Test Data
- Sample expenses across multiple categories
- Multiple users for isolation testing
- Edge cases: invalid inputs, missing data, boundary conditions

### 8.4 Code Quality Requirements

- **CQ-1.1**: Follow PEP 8 Python style guidelines
- **CQ-1.2**: Use type hints where applicable
- **CQ-1.3**: Document functions and classes with docstrings
- **CQ-1.4**: Implement error handling for all external API calls
- **CQ-1.5**: Log important operations and errors
- **CQ-1.6**: Use linters: flake8, black (formatter), mypy (type checking)

### 8.5 Version Control

- **VC-1.1**: Use Git for version control
- **VC-1.2**: Meaningful commit messages
- **VC-1.3**: Branch strategy: main/master for production, feature branches for development
- **VC-1.4**: `.gitignore` must exclude:
  - `__pycache__/`
  - `*.pyc`
  - `.env`
  - `venv/`
  - `.venv/`
  - Database files
  - IDE-specific files

## 9. Future Enhancements (Out of Scope for Initial Version)

- Multi-currency support
- Recurring expenses
- Budget setting and alerts
- Expense analytics and charts
- Receipt image processing
- Export to CSV/Excel
- Multi-user shared accounts
- Voice message support
- Expense tags/labels
- Integration with accounting software

## 10. Constraints and Limitations

- **CON-1**: WhatsApp message length limit (4096 characters) affects report formatting
- **CON-2**: Twilio WhatsApp Sandbox limitations during development (must send "join [code-word]" first)
- **CON-3**: Serverless function cold starts may cause initial latency
- **CON-4**: Database connection limits in serverless environments
- **CON-5**: Monthly reports with 1000+ expenses may require PDF export or pagination

---

**Document Version**: 1.0  
**Last Updated**: [Current Date]  
**Status**: Draft
