# Expenses Tracker

A WhatsApp-integrated expense management application that allows users to track, manage, and analyze their expenses through natural language conversations.

## Features

- 📱 Add expenses via WhatsApp using natural language
- 📊 View expenses by date range, category, or recent entries
- ✏️ Edit and delete expenses
- 📈 Generate monthly reports with detailed financial summaries
- 🏷️ Category management with custom categories
- 🤖 Natural language processing for intuitive interactions

## Technology Stack

- **Backend**: Python 3.11, Flask
- **Database**: PostgreSQL
- **WhatsApp Integration**: Twilio API
- **Deployment**: Vercel Serverless Functions

## Setup

### Prerequisites

- Python 3.9+
- PostgreSQL database
- Twilio account with WhatsApp Business API

### Installation

1. Clone the repository
2. Create a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Create `.env` file from `.env.example` and fill in your credentials
5. Set up the database:
   ```bash
   python -c "from database.connection import init_db; init_db()"
   ```
6. Run the application:
   ```bash
   python app.py
   ```

## Configuration

### Environment Variables

See `.env.example` for required environment variables.

### Twilio Setup

1. Create a Twilio account
2. Enable WhatsApp Business API
3. Configure webhook URL: `https://your-domain.vercel.app/api/webhook/whatsapp`
4. Add your Twilio credentials to `.env`

## Usage

Send messages to your Twilio WhatsApp number:

- **Add expense**: "Spent $50 on groceries"
- **View expenses**: "Show expenses from last week"
- **Monthly report**: "Show monthly report"
- **Help**: "Help" or "?"

## Deployment

### Vercel

1. Install Vercel CLI: `npm i -g vercel`
2. Deploy: `vercel`
3. Set environment variables in Vercel dashboard
4. Configure Twilio webhook URL

## License

MIT
