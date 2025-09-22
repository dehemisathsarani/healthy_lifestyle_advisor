from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.primitives.asymmetric import rsa, padding
from cryptography.hazmat.primitives import serialization
import base64
import os
from typing import Dict, Any

class EncryptionService:
    def __init__(self, secret_key: str = None):
        self.secret_key = secret_key or os.environ.get('ENCRYPTION_KEY')
        if not self.secret_key:
            self.secret_key = base64.urlsafe_b64encode(os.urandom(32)).decode()
        self.fernet = Fernet(self.secret_key.encode() if isinstance(self.secret_key, str) else self.secret_key)
        self._initialize_rsa_keys()

    def _initialize_rsa_keys(self):
        """Initialize RSA key pair for asymmetric encryption"""
        self.private_key = rsa.generate_private_key(
            public_exponent=65537,
            key_size=2048
        )
        self.public_key = self.private_key.public_key()

    def encrypt_data(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Encrypt sensitive health data using AES (Fernet)"""
        try:
            data_bytes = str(data).encode()
            encrypted_data = self.fernet.encrypt(data_bytes)
            return {
                "encrypted_data": base64.b64encode(encrypted_data).decode(),
                "is_encrypted": True
            }
        except Exception as e:
            raise Exception(f"Encryption failed: {str(e)}")

    def decrypt_data(self, encrypted_data: Dict[str, Any]) -> Dict[str, Any]:
        """Decrypt health data"""
        try:
            if not encrypted_data.get("is_encrypted"):
                return encrypted_data
            
            encrypted_bytes = base64.b64decode(encrypted_data["encrypted_data"])
            decrypted_data = self.fernet.decrypt(encrypted_bytes)
            return eval(decrypted_data.decode())  # Convert string representation back to dict
        except Exception as e:
            raise Exception(f"Decryption failed: {str(e)}")

    def encrypt_file(self, file_path: str) -> str:
        """Encrypt a file and return the path to the encrypted file"""
        try:
            with open(file_path, 'rb') as file:
                file_data = file.read()
            
            encrypted_data = self.fernet.encrypt(file_data)
            encrypted_file_path = f"{file_path}.encrypted"
            
            with open(encrypted_file_path, 'wb') as file:
                file.write(encrypted_data)
            
            return encrypted_file_path
        except Exception as e:
            raise Exception(f"File encryption failed: {str(e)}")

    def decrypt_file(self, encrypted_file_path: str) -> str:
        """Decrypt a file and return the path to the decrypted file"""
        try:
            with open(encrypted_file_path, 'rb') as file:
                encrypted_data = file.read()
            
            decrypted_data = self.fernet.decrypt(encrypted_data)
            decrypted_file_path = encrypted_file_path.replace('.encrypted', '.decrypted')
            
            with open(decrypted_file_path, 'wb') as file:
                file.write(decrypted_data)
            
            return decrypted_file_path
        except Exception as e:
            raise Exception(f"File decryption failed: {str(e)}")

    def generate_backup_key(self, user_id: str) -> bytes:
        """Generate a unique backup encryption key for a user"""
        salt = os.urandom(16)
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=salt,
            iterations=100000,
        )
        key = base64.urlsafe_b64encode(kdf.derive(user_id.encode()))
        return key
