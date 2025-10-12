"""Email Service for sending OTP codes and notifications"""
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class EmailService:
    def __init__(self):
        self.smtp_server = "smtp.gmail.com"
        self.smtp_port = 587
        self.sender_email = os.getenv("SMTP_EMAIL", "your-email@gmail.com")
        self.sender_password = os.getenv("SMTP_PASSWORD", "adufkscdzidfplal")
        self.enabled = True
        
    def send_otp_email(self, recipient_email: str, otp_code: str, expires_in_minutes: int = 10) -> bool:
        try:
            message = MIMEMultipart("alternative")
            message["Subject"] = "Your OTP Code - Healthy Lifestyle Advisor"
            message["From"] = self.sender_email
            message["To"] = recipient_email
            
            html = f'''<html><body style="font-family: Arial, sans-serif; padding: 20px;">
            <div style="max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px;">
            <h2 style="color: #4CAF50;">Your OTP Code</h2>
            <p>Hello! You requested an OTP code for authentication.</p>
            <div style="background: #f0f0f0; padding: 20px; border-radius: 5px; text-align: center;">
            <h1 style="color: #4CAF50; font-size: 36px; letter-spacing: 8px;">{otp_code}</h1>
            </div>
            <p>This code will expire in {expires_in_minutes} minutes.</p>
            <p style="color: #999;">Healthy Lifestyle Advisor</p>
            </div></body></html>'''
            
            text = f"Your OTP Code: {otp_code}\nExpires in {expires_in_minutes} minutes."
            message.attach(MIMEText(text, "plain"))
            message.attach(MIMEText(html, "html"))
            
            logger.info(f"Sending OTP email to {recipient_email}")
            with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
                server.starttls()
                server.login(self.sender_email, self.sender_password)
                server.sendmail(self.sender_email, recipient_email, message.as_string())
            logger.info(f"OTP email sent successfully to {recipient_email}")
            return True
        except Exception as e:
            logger.error(f"Failed to send email: {e}")
            return False
    
    def test_connection(self) -> bool:
        try:
            logger.info("Testing SMTP connection...")
            with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
                server.starttls()
                server.login(self.sender_email, self.sender_password)
            logger.info("SMTP connection test successful!")
            return True
        except Exception as e:
            logger.error(f"SMTP connection test failed: {e}")
            return False

email_service = EmailService()


async def send_otp_email(recipient_email: str, otp_code: str, purpose: str = "verification") -> bool:
    """
    Async wrapper for sending OTP emails with purpose-specific templates
    
    Args:
        recipient_email: Email address to send OTP to
        otp_code: The OTP code to send
        purpose: Purpose of OTP ("email_verification", "download_access", "decrypt_access")
    
    Returns:
        bool: True if email sent successfully, False otherwise
    """
    try:
        # Create purpose-specific email templates
        purpose_messages = {
            "email_verification": {
                "subject": "Email Verification OTP - Healthy Lifestyle Advisor",
                "title": "Email Verification Required",
                "description": "Please verify your email address to access the system.",
                "step": "Step 1 of 3"
            },
            "download_access": {
                "subject": "Report Download OTP - Healthy Lifestyle Advisor", 
                "title": "Download Access Granted",
                "description": "Your encrypted health report is ready for download.",
                "step": "Step 2 of 3"
            },
            "decrypt_access": {
                "subject": "Decrypt Access OTP - Healthy Lifestyle Advisor",
                "title": "Decrypt Access Authorized",
                "description": "Final verification to decrypt your health report.",
                "step": "Step 3 of 3"
            }
        }
        
        # Get purpose-specific message or default
        msg_info = purpose_messages.get(purpose, purpose_messages["email_verification"])
        
        # Create enhanced message
        message = MIMEMultipart("alternative")
        message["Subject"] = msg_info["subject"]
        message["From"] = email_service.sender_email
        message["To"] = recipient_email
        
        # Enhanced HTML template
        html = f'''
        <html>
        <body style="font-family: Arial, sans-serif; padding: 20px; background-color: #f5f5f5;">
            <div style="max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                <div style="text-align: center; margin-bottom: 30px;">
                    <h1 style="color: #4CAF50; margin: 0;">🏥 Healthy Lifestyle Advisor</h1>
                    <p style="color: #666; margin: 5px 0;">{msg_info["step"]}</p>
                </div>
                
                <h2 style="color: #333; text-align: center;">{msg_info["title"]}</h2>
                <p style="color: #666; text-align: center; margin-bottom: 30px;">{msg_info["description"]}</p>
                
                <div style="background: linear-gradient(135deg, #4CAF50, #45a049); padding: 25px; border-radius: 8px; text-align: center; margin: 30px 0;">
                    <p style="color: white; margin: 0 0 10px 0; font-size: 16px;">Your OTP Code:</p>
                    <h1 style="color: white; font-size: 42px; letter-spacing: 8px; margin: 0; font-family: 'Courier New', monospace;">{otp_code}</h1>
                </div>
                
                <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0;">
                    <p style="color: #856404; margin: 0; text-align: center;">
                        ⏰ This code will expire in 10 minutes for security purposes.
                    </p>
                </div>
                
                <div style="border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px; text-align: center;">
                    <p style="color: #999; font-size: 12px; margin: 0;">
                        🔒 This is an automated security message from Healthy Lifestyle Advisor
                    </p>
                </div>
            </div>
        </body>
        </html>
        '''
        
        # Plain text version
        text = f"""
{msg_info['title']} - {msg_info['step']}

{msg_info['description']}

Your OTP Code: {otp_code}

This code will expire in 10 minutes for security purposes.

---
Healthy Lifestyle Advisor - Automated Security Message
        """.strip()
        
        message.attach(MIMEText(text, "plain"))
        message.attach(MIMEText(html, "html"))
        
        # Send email manually since we have custom content
        logger.info(f"Sending {purpose} OTP email to {recipient_email}")
        with smtplib.SMTP(email_service.smtp_server, email_service.smtp_port) as server:
            server.starttls()
            server.login(email_service.sender_email, email_service.sender_password)
            server.sendmail(email_service.sender_email, recipient_email, message.as_string())
        logger.info(f"{purpose} OTP email sent successfully to {recipient_email}")
        return True
        
    except Exception as e:
        logger.error(f"Failed to send async OTP email: {e}")
        return False
