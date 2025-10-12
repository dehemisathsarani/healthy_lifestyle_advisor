"""
OTP (One-Time Password) Service for secure authentication
Generates and verifies OTP codes sent to users via email
"""
import random
import string
from datetime import datetime, timedelta
from typing import Dict, Optional
from motor.motor_asyncio import AsyncIOMotorDatabase

# Import email service for sending OTPs
try:
    from app.services.email_service import email_service
    EMAIL_ENABLED = True
except ImportError:
    EMAIL_ENABLED = False
    print("⚠️ Email service not available. OTPs will only be returned in API response.")


class OTPService:
    """Enhanced OTP service for file encryption/decryption workflow"""
    
    def __init__(self, db: AsyncIOMotorDatabase):
        """Initialize OTP service with database connection"""
        self.db = db
        self.otp_collection = db.otp_codes
        self.file_access_collection = db.file_access_logs
        self.email_enabled = EMAIL_ENABLED
    
    def _generate_otp(self, length: int = 6) -> str:
        """Generate a random OTP code"""
        return ''.join(random.choices(string.digits, k=length))
    
    async def create_otp(
        self, 
        identifier: str,  # email or phone number
        identifier_type: str = "email",  # "email" or "phone"
        expires_in_minutes: int = 10,
        purpose: str = "email_verification"  # "email_verification", "download_access", "decrypt_access"
    ) -> Dict[str, str]:
        """
        Generate and store an OTP code with three-step security support
        
        Args:
            identifier: User's email or phone number
            identifier_type: Type of identifier (email or phone)  
            expires_in_minutes: OTP expiration time
            purpose: Purpose of OTP ("email_verification", "download_access", "decrypt_access")
            
        Returns:
            Dictionary with OTP code and metadata
        """
        # Generate OTP
        otp_code = self._generate_otp()
        
        # Calculate expiration
        created_at = datetime.utcnow()
        expires_at = created_at + timedelta(minutes=expires_in_minutes)
        
        # Store in database
        otp_document = {
            "identifier": identifier.lower() if identifier_type == "email" else identifier,
            "identifier_type": identifier_type,
            "otp_code": otp_code,
            "created_at": created_at,
            "expires_at": expires_at,
            "verified": False,
            "attempts": 0,
            "max_attempts": 5,
            "purpose": purpose  # Track purpose of OTP
        }
        
        # Delete any existing OTP for this identifier and purpose
        await self.otp_collection.delete_many({
            "identifier": otp_document["identifier"],
            "purpose": purpose
        })
        
        # Insert new OTP
        await self.otp_collection.insert_one(otp_document)
        
        # Send OTP via email if identifier type is email and email service is enabled
        email_sent = False
        if identifier_type == "email" and self.email_enabled:
            try:
                email_sent = email_service.send_otp_email(
                    recipient_email=identifier,
                    otp_code=otp_code,
                    expires_in_minutes=expires_in_minutes
                )
            except Exception as e:
                print(f"⚠️ Failed to send OTP email: {e}")
        
        # Return response with success field
        response = {
            "success": True,  # Always True if we reach this point
            "otp_code": otp_code if not email_sent else "******",  # Hide OTP if email sent
            "identifier": identifier,
            "expires_at": expires_at.isoformat(),
            "expires_in_minutes": expires_in_minutes,
        }
        
        if email_sent:
            response["message"] = f"OTP code has been sent to your email: {identifier}"
            response["email_sent"] = True
        else:
            response["note"] = "OTP code shown here (in production, sent via email/SMS)"
            response["email_sent"] = False
            response["otp_code"] = otp_code  # Show OTP if email not sent
        
        return response
    
    async def verify_otp(
        self, 
        identifier: str, 
        otp_code: str,
        identifier_type: str = "email",
        purpose: str = "general",
        auto_generate_new: bool = True
    ) -> Dict[str, any]:
        """
        Enhanced OTP verification for file encryption/decryption workflow
        
        Args:
            identifier: User's email or phone number
            otp_code: The OTP code to verify
            identifier_type: Type of identifier
            purpose: Purpose of verification ("general", "encrypt", "decrypt")
            auto_generate_new: If True, generates new OTP when none found
            
        Returns:
            Dictionary with verification result and next steps
        """
        # Normalize identifier
        normalized_identifier = identifier.lower() if identifier_type == "email" else identifier
        
        # Find OTP document for specific purpose
        otp_doc = await self.otp_collection.find_one({
            "identifier": normalized_identifier,
            "verified": False,
            "purpose": purpose
        })
        
        # If no OTP found and auto_generate_new is True, create a new one
        if not otp_doc and auto_generate_new:
            print(f"🔄 No {purpose} OTP found for {identifier}. Generating new one...")
            new_otp_result = await self.create_otp(
                identifier=identifier,
                identifier_type=identifier_type,
                purpose=purpose,
                expires_in_minutes=10
            )
            
            return {
                "success": False,
                "message": f"New OTP generated for {purpose} access",
                "action": "new_otp_sent",
                "otp_code": new_otp_result.get("otp_code", "******"),
                "email_sent": new_otp_result.get("email_sent", False),
                "purpose": purpose,
                "expires_in_minutes": 10
            }
        
        elif not otp_doc:
            return {
                "success": False,
                "message": f"No {purpose} OTP found. Please request a new OTP.",
                "action": "request_new_otp",
                "purpose": purpose
            }
        
        # Check expiration
        if datetime.utcnow() > otp_doc["expires_at"]:
            await self.otp_collection.delete_one({"_id": otp_doc["_id"]})
            return {
                "success": False,
                "message": "OTP has expired"
            }
        
        # Check max attempts
        if otp_doc["attempts"] >= otp_doc["max_attempts"]:
            await self.otp_collection.delete_one({"_id": otp_doc["_id"]})
            return {
                "success": False,
                "message": "Maximum verification attempts exceeded"
            }
        
        # Verify OTP code
        if otp_doc["otp_code"] == otp_code:
            # Mark as verified
            await self.otp_collection.update_one(
                {"_id": otp_doc["_id"]},
                {"$set": {"verified": True, "verified_at": datetime.utcnow()}}
            )
            
            # Log successful access
            access_log = {
                "identifier": identifier,
                "purpose": purpose,
                "verified_at": datetime.utcnow(),
                "otp_code_used": otp_code
            }
            await self.file_access_collection.insert_one(access_log)
            
            # Determine next step based on purpose
            next_action = self._get_next_action(purpose)
            
            return {
                "success": True,
                "message": f"OTP verified successfully for {purpose} access",
                "identifier": identifier,
                "identifier_type": identifier_type,
                "purpose": purpose,
                "access_granted": True,
                "next_action": next_action["action"],
                "next_message": next_action["message"]
            }
        else:
            # Increment attempts
            await self.otp_collection.update_one(
                {"_id": otp_doc["_id"]},
                {"$inc": {"attempts": 1}}
            )
            
            remaining = otp_doc["max_attempts"] - (otp_doc["attempts"] + 1)
            return {
                "success": False,
                "message": f"Invalid OTP code. {remaining} attempts remaining",
                "remaining_attempts": remaining
            }
    
    def _get_next_action(self, current_purpose: str) -> Dict[str, str]:
        """Determine next action based on current purpose"""
        if current_purpose == "email_verification":
            return {
                "action": "navigate_to_report_page",
                "message": "Email verified! You can now navigate to the report generation page."
            }
        elif current_purpose == "download_access":
            return {
                "action": "allow_download",
                "message": "You can now download your encrypted report."
            }
        elif current_purpose == "decrypt_access":
            return {
                "action": "allow_decryption",
                "message": "You can now decrypt and view your health report."
            }
        else:
            return {
                "action": "general_access",
                "message": "Access granted for general operations."
            }
    
    async def create_email_verification_otp(self, identifier: str, identifier_type: str = "email") -> Dict[str, any]:
        """Create OTP for initial email verification (Step 1)"""
        return await self.create_otp(
            identifier=identifier,
            identifier_type=identifier_type,
            purpose="email_verification",
            expires_in_minutes=10  # Standard time for email verification
        )
    
    async def create_download_access_otp(self, identifier: str, identifier_type: str = "email") -> Dict[str, any]:
        """Create OTP for report download access (Step 2)"""
        return await self.create_otp(
            identifier=identifier,
            identifier_type=identifier_type,
            purpose="download_access",
            expires_in_minutes=15  # Longer time for report generation and download
        )
    
    async def create_decrypt_access_otp(self, identifier: str, identifier_type: str = "email") -> Dict[str, any]:
        """Create OTP for file decryption access (Step 3)"""
        return await self.create_otp(
            identifier=identifier,
            identifier_type=identifier_type,
            purpose="decrypt_access",
            expires_in_minutes=20  # Longer time for decryption process
        )
    
    async def verify_email_verification_access(self, identifier: str, otp_code: str, identifier_type: str = "email") -> Dict[str, any]:
        """Verify OTP for email verification (Step 1)"""
        return await self.verify_otp(
            identifier=identifier,
            otp_code=otp_code,
            identifier_type=identifier_type,
            purpose="email_verification",
            auto_generate_new=True
        )
    
    async def verify_download_access(self, identifier: str, otp_code: str, identifier_type: str = "email") -> Dict[str, any]:
        """Verify OTP for download access (Step 2)"""
        return await self.verify_otp(
            identifier=identifier,
            otp_code=otp_code,
            identifier_type=identifier_type,
            purpose="download_access",
            auto_generate_new=True
        )
    
    async def verify_decrypt_access(self, identifier: str, otp_code: str, identifier_type: str = "email") -> Dict[str, any]:
        """Verify OTP for decryption access (Step 3)"""
        return await self.verify_otp(
            identifier=identifier,
            otp_code=otp_code,
            identifier_type=identifier_type,
            purpose="decrypt_access",
            auto_generate_new=True
        )
    
    async def get_access_history(self, identifier: str, limit: int = 10) -> list:
        """Get access history for an identifier"""
        history = await self.file_access_collection.find({
            "identifier": identifier.lower()
        }).sort("verified_at", -1).limit(limit).to_list(length=limit)
        
        return [{
            "purpose": log.get("purpose"),
            "verified_at": log.get("verified_at"),
            "access_type": "Encryption" if log.get("purpose") == "encrypt" else "Decryption" if log.get("purpose") == "decrypt" else "General"
        } for log in history]
    
    async def cleanup_expired_otps(self):
        """Remove expired OTP codes from database"""
        result = await self.otp_collection.delete_many({
            "expires_at": {"$lt": datetime.utcnow()}
        })
        return result.deleted_count
    
    async def revoke_all_otps(self, identifier: str, identifier_type: str = "email"):
        """Revoke all active OTPs for a user (security measure)"""
        normalized_identifier = identifier.lower() if identifier_type == "email" else identifier
        result = await self.otp_collection.delete_many({
            "identifier": normalized_identifier,
            "verified": False
        })
        return result.deleted_count
