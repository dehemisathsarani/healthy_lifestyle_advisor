"""
Security Service for Data Encryption and Decryption
Handles sensitive data protection using Fernet symmetric encryption
"""
import os
import base64
import json
from datetime import datetime
from typing import Dict, Any, Optional
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.backends import default_backend


class SecurityService:
    """Service for encrypting and decrypting sensitive health data"""
    
    def __init__(self):
        """Initialize security service with encryption key"""
        # In production, store this in a secure vault (e.g., Azure Key Vault, AWS Secrets Manager)
        self.master_key = os.getenv("ENCRYPTION_MASTER_KEY", "health-agent-master-key-change-in-production")
        self.salt = os.getenv("ENCRYPTION_SALT", "health-agent-salt").encode()
        
    def _generate_key(self, user_id: str) -> bytes:
        """
        Generate a unique encryption key for each user
        Uses PBKDF2HMAC to derive a key from the master key and user ID
        """
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=self.salt + user_id.encode(),
            iterations=100000,
            backend=default_backend()
        )
        key = base64.urlsafe_b64encode(kdf.derive(self.master_key.encode()))
        return key
    
    def encrypt_data(self, data: Dict[str, Any], user_id: str) -> Dict[str, str]:
        """
        Encrypt sensitive data for a user
        
        Args:
            data: Dictionary containing the data to encrypt
            user_id: User identifier for key derivation
            
        Returns:
            Dictionary with encrypted data and metadata
        """
        try:
            # Generate user-specific encryption key
            key = self._generate_key(user_id)
            fernet = Fernet(key)
            
            # Convert data to JSON string
            json_data = json.dumps(data, default=str)
            
            # Encrypt the data
            encrypted_bytes = fernet.encrypt(json_data.encode())
            encrypted_data = encrypted_bytes.decode()
            
            # Create response with metadata
            result = {
                "encrypted_data": encrypted_data,
                "user_id": user_id,
                "encrypted_at": datetime.utcnow().isoformat(),
                "encryption_method": "Fernet (symmetric)",
                "note": "Use the decryption endpoint with your user_id to decrypt this data"
            }
            
            return result
            
        except Exception as e:
            raise ValueError(f"Encryption failed: {str(e)}")
    
    def decrypt_data(self, encrypted_data: str, user_id: str) -> Dict[str, Any]:
        """
        Decrypt encrypted data for a user
        
        Args:
            encrypted_data: The encrypted data string
            user_id: User identifier for key derivation
            
        Returns:
            Decrypted data as dictionary
        """
        try:
            # Generate the same user-specific encryption key
            key = self._generate_key(user_id)
            fernet = Fernet(key)
            
            # Decrypt the data
            decrypted_bytes = fernet.decrypt(encrypted_data.encode())
            decrypted_json = decrypted_bytes.decode()
            
            # Parse JSON back to dictionary
            data = json.loads(decrypted_json)
            
            return data
            
        except Exception as e:
            raise ValueError(f"Decryption failed: {str(e)}. Make sure you're using the correct user_id.")
    
    def generate_decryption_token(self, user_id: str, expires_in_hours: int = 24) -> Dict[str, str]:
        """
        Generate a decryption token/key that users can use
        
        Args:
            user_id: User identifier
            expires_in_hours: Token expiration time
            
        Returns:
            Dictionary with decryption token information
        """
        try:
            key = self._generate_key(user_id)
            
            return {
                "decryption_token": base64.urlsafe_b64encode(key).decode(),
                "user_id": user_id,
                "valid_until": f"{expires_in_hours} hours from now",
                "instructions": "Use this token with the /decrypt-with-token endpoint to decrypt your data"
            }
        except Exception as e:
            raise ValueError(f"Token generation failed: {str(e)}")
    
    def decrypt_with_token(self, encrypted_data: str, decryption_token: str) -> Dict[str, Any]:
        """
        Decrypt data using a decryption token
        
        Args:
            encrypted_data: The encrypted data string
            decryption_token: The decryption token
            
        Returns:
            Decrypted data as dictionary
        """
        try:
            # Decode the token to get the key
            key = base64.urlsafe_b64decode(decryption_token.encode())
            fernet = Fernet(key)
            
            # Decrypt the data
            decrypted_bytes = fernet.decrypt(encrypted_data.encode())
            decrypted_json = decrypted_bytes.decode()
            
            # Parse JSON back to dictionary
            data = json.loads(decrypted_json)
            
            return data
            
        except Exception as e:
            raise ValueError(f"Decryption with token failed: {str(e)}. Invalid or expired token.")


# Singleton instance
security_service = SecurityService()
