"""Twilio webhook endpoint for WhatsApp messages."""

import os
import logging
from flask import Blueprint, request, Response
from twilio.request_validator import RequestValidator
from twilio.twiml.messaging_response import MessagingResponse
from database.connection import get_db_session
from services.message_handler import MessageHandler

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

webhook_bp = Blueprint('webhook', __name__, url_prefix='/api/webhook')


def validate_twilio_request(request) -> bool:
    """
    Validate Twilio request signature.
    
    Args:
        request: Flask request object
        
    Returns:
        True if valid, False otherwise
    """
    auth_token = os.getenv('TWILIO_AUTH_TOKEN')
    if not auth_token:
        logger.warning("TWILIO_AUTH_TOKEN not set, skipping validation")
        return True  # Allow in development
    
    validator = RequestValidator(auth_token)
    signature = request.headers.get('X-Twilio-Signature', '')
    url = request.url
    
    # For POST requests, use form data
    if request.method == 'POST':
        return validator.validate(url, request.form, signature)
    
    return False


@webhook_bp.route('/whatsapp', methods=['POST'])
def whatsapp_webhook():
    """
    Handle incoming WhatsApp messages from Twilio.
    
    Returns:
        TwiML response
    """
    try:
        # Validate request (skip in development if token not set)
        if os.getenv('ENVIRONMENT') == 'production':
            if not validate_twilio_request(request):
                logger.warning("Invalid Twilio request signature")
                return Response("Unauthorized", status=401)
        
        # Get message data
        message_body = request.form.get('Body', '').strip()
        from_number = request.form.get('From', '').strip()
        
        if not message_body or not from_number:
            logger.warning("Missing message body or from number")
            return Response("Bad Request", status=400)
        
        logger.info(f"Received message from {from_number}: {message_body}")
        
        # Process message
        db_session = next(get_db_session())
        try:
            handler = MessageHandler(db_session)
            response_message = handler.process_message(from_number, message_body)
        finally:
            db_session.close()
        
        # Create TwiML response
        resp = MessagingResponse()
        resp.message(response_message)
        
        logger.info(f"Sent response to {from_number}")
        
        return Response(str(resp), mimetype='text/xml')
    
    except Exception as e:
        logger.error(f"Error processing webhook: {str(e)}", exc_info=True)
        resp = MessagingResponse()
        resp.message("✗ Sorry, an error occurred. Please try again.")
        return Response(str(resp), mimetype='text/xml')
