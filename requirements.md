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
- **Language**: Node.js 18+ (JavaScript/TypeScript)
- **Runtime**: Long-running process (required for WhatsApp Web session)
- **Architecture**: Event-driven, single process

### 2.2 Database
- **Primary Database**: PostgreSQL
- **Hosting Options**:
  - Local PostgreSQL
- **ORM/Query Builder**: Prisma or pg (node-postgres)

### 2.3 WhatsApp Integration
- **Library**: [whatsapp-web.js](https://github.com/pedroslopez/whatsapp-web.js) (wwebjs)
- **Connection Method**: WhatsApp Web browser automation via Puppeteer
- **Authentication**: QR Code scan (like WhatsApp Web)
- **Session Storage**: Local authentication for persistent sessions

### 2.4 Natural Language Processing
- **Approach**: Rule-based parsing with regex patterns
- **Libraries**: 
  - chrono-node (date parsing)
  - Custom regex patterns for entity extraction
- **Optional**: OpenAI API for enhanced NLP

### 2.5 Deployment
- **Primary Platform**: Railway (recommended - supports long-running processes)
- **Alternative Platforms**: 
  - Render (Web Services)
  - DigitalOcean Droplet
  - AWS EC2 / Lightsail
  - VPS (any provider)
- **Important**: Vercel/serverless NOT suitable (requires persistent connection)

### 2.6 Development Tools
- **Version Control**: Git
- **Package Management**: npm or yarn
- **Environment Management**: dotenv
- **Process Manager**: PM2 (for production)

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
- **FR-6.2**: Reports must be generated on demand via WhatsApp command and automatically generated on first day in every month.
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

- **NFR-1.1**: Message response time must be < 3 seconds (95th percentile)
- **NFR-1.2**: Monthly report generation must complete within 5 seconds for up to 1000 expenses
- **NFR-1.3**: System must handle messages from multiple users concurrently
- **NFR-1.4**: Database queries must be optimized with proper indexing
- **NFR-1.5**: WhatsApp session must remain connected 24/7

### 4.2 Security Requirements

- **NFR-2.1**: WhatsApp session data must be stored securely
- **NFR-2.2**: User data must be isolated (each WhatsApp number = separate user)
- **NFR-2.3**: Database connections must use SSL/TLS
- **NFR-2.4**: Sensitive environment variables must be stored securely
- **NFR-2.5**: Input validation must prevent SQL injection and XSS attacks
- **NFR-2.6**: User data must be encrypted at rest

### 4.3 Scalability Considerations

- **NFR-3.1**: Single instance can handle multiple users (personal use)
- **NFR-3.2**: Database must handle growth from 100 to 10,000+ expenses per user
- **NFR-3.3**: Consider multi-instance architecture for high-volume usage
- **NFR-3.4**: Implement connection pooling for database

### 4.4 Reliability and Availability

- **NFR-4.1**: System uptime target: 99%
- **NFR-4.2**: Database backups must be performed daily
- **NFR-4.3**: Auto-reconnect on WhatsApp disconnection
- **NFR-4.4**: Error handling must prevent data loss on failures
- **NFR-4.5**: System must log all operations for debugging and audit purposes
- **NFR-4.6**: Session persistence across application restarts

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

### 6.1 whatsapp-web.js Setup Requirements

- **WW-1.1**: Node.js 18+ installed
- **WW-1.2**: Puppeteer dependencies installed (for headless Chrome)
- **WW-1.3**: Local authentication strategy for session persistence
- **WW-1.4**: QR code generation for initial authentication
- **WW-1.5**: Event handlers for messages, disconnection, and errors

### 6.2 Authentication Flow

1. **First Run**: 
   - Application starts and generates QR code in terminal
   - User scans QR code with WhatsApp mobile app
   - Session is saved locally for future use

2. **Subsequent Runs**:
   - Application loads saved session
   - Auto-connects without QR scan
   - If session expired, new QR code is generated

### 6.3 Message Format Specifications

#### 6.3.1 Incoming Messages (User → System)

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

#### 6.3.2 Outgoing Messages (System → User)

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
- If too long, split into multiple messages

### 6.4 Natural Language Understanding Requirements

#### 6.4.1 Entity Extraction

- **Amount Extraction**:
  - Support formats: "$50", "50", "50.99", "Rp50000", "50k"
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

#### 6.4.2 Intent Recognition

- Add Expense
- View Expenses
- Edit Expense
- Delete Expense
- Generate Report
- Manage Categories
- Help/Unknown

#### 6.4.3 Clarification Requests

When information is missing or ambiguous:
- "Please specify the amount for this expense"
- "Which category should this be? Reply with 'Category: [name]'"
- "Did you receive or spend this money? (debit/credit)"

## 7. Deployment Requirements

### 7.1 Server Requirements

#### 7.1.1 Minimum Specifications
- **RAM**: 512MB minimum, 1GB recommended
- **CPU**: 1 vCPU minimum
- **Storage**: 1GB minimum (for session data and logs)
- **OS**: Linux (Ubuntu recommended) or Windows

#### 7.1.2 Important Notes
- **NOT compatible with serverless** (Vercel, AWS Lambda, etc.)
- Requires **long-running process** for WhatsApp Web session
- Needs **persistent storage** for session authentication

### 7.2 Recommended Deployment Platforms

#### 7.2.1 Railway (Recommended)
- Easy deployment from Git
- Supports long-running processes
- Free tier available (limited hours)
- Built-in PostgreSQL option

#### 7.2.2 Render
- Web Services (not serverless)
- Supports persistent processes
- Free tier available
- Easy PostgreSQL integration

#### 7.2.3 DigitalOcean / VPS
- Full control over server
- $4-6/month for basic droplet
- Manual setup required
- Best for production

### 7.3 Environment Variables

Required environment variables for deployment:

```
# Database Configuration
DATABASE_URL=postgresql://user:password@host:port/database

# Application Configuration
NODE_ENV=production

# Optional: Session encryption
SESSION_SECRET=your_secret_key

# Optional: Logging
LOG_LEVEL=info
```

### 7.4 Process Management

For production deployment, use PM2:

```bash
# Install PM2
npm install -g pm2

# Start application
pm2 start src/index.js --name expenses-tracker

# Enable auto-restart on server reboot
pm2 startup
pm2 save
```

## 8. Development Requirements

### 8.1 Node.js Dependencies

Core dependencies (package.json):

```json
{
  "dependencies": {
    "whatsapp-web.js": "^1.23.0",
    "qrcode-terminal": "^0.12.0",
    "pg": "^8.11.0",
    "dotenv": "^16.3.0",
    "chrono-node": "^2.7.0",
    "node-cron": "^3.0.0"
  },
  "devDependencies": {
    "nodemon": "^3.0.0",
    "jest": "^29.0.0"
  }
}
```

### 8.2 Development Setup

#### 8.2.1 Local Development Environment

1. **Node.js Version**: Node.js 18 or higher
2. **Installation**:
   ```bash
   # Clone repository
   git clone <repo-url>
   cd expenses-tracker

   # Install dependencies
   npm install

   # Copy environment file
   cp .env.example .env
   # Edit .env with your database credentials
   ```
3. **Local PostgreSQL Database**:
   - Install PostgreSQL locally or use Docker
   - Create database: `CREATE DATABASE expenses_tracker;`
   - Run schema setup: `npm run db:setup`
4. **Environment Variables**:
   - Create `.env` file with local configuration
   - Never commit `.env` to version control
5. **First Run**:
   - Run `npm start`
   - Scan QR code with WhatsApp
   - Session will be saved for future runs

#### 8.2.2 Project Structure

```
expenses-tracker/
├── src/
│   ├── index.js              # Application entry point
│   ├── whatsapp/
│   │   ├── client.js         # WhatsApp client setup
│   │   └── handlers.js       # Message handlers
│   ├── services/
│   │   ├── nlp.js            # Natural language processing
│   │   ├── messageHandler.js # Message processing logic
│   │   └── reportGenerator.js# Report generation
│   ├── database/
│   │   ├── connection.js     # Database connection
│   │   ├── models/
│   │   │   ├── user.js
│   │   │   ├── category.js
│   │   │   └── expense.js
│   │   └── schema.sql        # Database schema
│   └── utils/
│       ├── validators.js
│       └── formatters.js
├── tests/
│   ├── nlp.test.js
│   ├── expenses.test.js
│   └── handlers.test.js
├── .wwebjs_auth/             # WhatsApp session (gitignored)
├── package.json
├── .env.example
├── .gitignore
└── README.md
```

### 8.3 Testing Requirements

#### 8.3.1 Unit Tests
- **TEST-1.1**: NLP entity extraction (amount, date, category)
- **TEST-1.2**: Intent recognition
- **TEST-1.3**: Database models and queries
- **TEST-1.4**: Expense CRUD operations
- **TEST-1.5**: Report generation logic

#### 8.3.2 Integration Tests
- **TEST-2.1**: Message handling flow
- **TEST-2.2**: End-to-end message processing
- **TEST-2.3**: Database operations with real PostgreSQL
- **TEST-2.4**: Monthly report generation with sample data

#### 8.3.3 Testing Framework
- **Framework**: Jest
- **Database Testing**: Use test database or mocking
- **Coverage Target**: Minimum 70% code coverage

#### 8.3.4 Test Data
- Sample expenses across multiple categories
- Multiple users for isolation testing
- Edge cases: invalid inputs, missing data, boundary conditions

### 8.4 Code Quality Requirements

- **CQ-1.1**: Follow JavaScript Standard Style or ESLint configuration
- **CQ-1.2**: Use JSDoc comments for documentation
- **CQ-1.3**: Implement error handling for all async operations
- **CQ-1.4**: Log important operations and errors
- **CQ-1.5**: Use linters: ESLint, Prettier (formatter)

### 8.5 Version Control

- **VC-1.1**: Use Git for version control
- **VC-1.2**: Meaningful commit messages
- **VC-1.3**: Branch strategy: main/master for production, feature branches for development
- **VC-1.4**: `.gitignore` must exclude:
  - `node_modules/`
  - `.env`
  - `.wwebjs_auth/`
  - `.wwebjs_cache/`
  - `*.log`
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
- Web dashboard for viewing expenses

## 10. Constraints and Limitations

- **CON-1**: WhatsApp message length limit (4096 characters) affects report formatting
- **CON-2**: Requires persistent connection (not compatible with serverless)
- **CON-3**: WhatsApp may disconnect occasionally, requiring auto-reconnect
- **CON-4**: Unofficial API - risk of being blocked (low risk for personal use)
- **CON-5**: Monthly reports with 1000+ expenses may require splitting into multiple messages
- **CON-6**: Only one WhatsApp account can be connected per instance

## 11. whatsapp-web.js Specific Notes

### 11.1 Important Warnings

> **Warning**: WhatsApp does not allow bots or unofficial clients on their platform. 
> Using this library carries a risk of your WhatsApp account being banned. 
> For personal/hobby use, the risk is minimal if you don't spam.

### 11.2 Best Practices

- Don't send too many messages in a short time
- Don't use for marketing/spam
- Add delays between messages (1-3 seconds)
- Use for personal expense tracking only
- Consider using a secondary WhatsApp number

### 11.3 Session Management

- Session is stored in `.wwebjs_auth/` folder
- Keep this folder persistent across deployments
- If session is lost, you'll need to scan QR code again

---

**Document Version**: 2.0  
**Last Updated**: January 2025  
**Status**: Updated for Node.js + whatsapp-web.js
