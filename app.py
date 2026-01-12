"""Main Flask application for Expenses Tracker."""

import os
import logging
from flask import Flask
from dotenv import load_dotenv
from database.connection import init_db, get_db_session
from api.webhook import webhook_bp

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Create Flask app
app = Flask(__name__)
app.config['SECRET_KEY'] = os.getenv('APP_SECRET_KEY', 'dev-secret-key-change-in-production')

# Register blueprints
app.register_blueprint(webhook_bp)


@app.route('/', methods=['GET'])
def health_check():
    """Health check endpoint."""
    return {'status': 'ok', 'service': 'expenses-tracker'}, 200


@app.route('/api/health', methods=['GET'])
def health():
    """Health check endpoint with database connection test."""
    try:
        # Test database connection
        from sqlalchemy import text
        db_session = next(get_db_session())
        db_session.execute(text('SELECT 1'))
        db_session.close()
        return {'status': 'ok', 'database': 'connected'}, 200
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        return {'status': 'error', 'database': 'disconnected', 'error': str(e)}, 500




if __name__ == '__main__':
    # Initialize database
    try:
        init_db()
        logger.info("Database initialized")
    except Exception as e:
        logger.warning(f"Database initialization warning: {str(e)}")
    
    # Run app
    port = int(os.getenv('PORT', 5000))
    debug = os.getenv('ENVIRONMENT') == 'development'
    app.run(host='0.0.0.0', port=port, debug=debug)
