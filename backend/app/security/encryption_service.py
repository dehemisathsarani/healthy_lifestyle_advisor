from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import rsa, padding
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
import base64
import os
from typing import Dict, Tuple
from datetime import datetime

class EncryptionService:
    def __init__(self):
        """Initialize encryption service with both AES and RSA capabilities"""
        self.aes_key = self._generate_aes_key()
        self.rsa_private_key = self._generate_rsa_keypair()
        self.rsa_public_key = self.rsa_private_key.public_key()
        self.fernet = Fernet(self.aes_key)

    def _generate_aes_key(self) -> bytes:
        """Generate a new AES key"""
        return Fernet.generate_key()

    def _generate_rsa_keypair(self) -> rsa.RSAPrivateKey:
        """Generate RSA key pair"""
        return rsa.generate_private_key(
            public_exponent=65537,
            key_size=2048
        )

    def encrypt_aes(self, data: Dict) -> Tuple[str, str]:
        """
        Encrypt data using AES (Fernet)
        Returns: (encrypted_data, initialization_vector)
        """
        try:
            data_bytes = str(data).encode()
            encrypted_data = self.fernet.encrypt(data_bytes)
            return base64.b64encode(encrypted_data).decode(), ""
        except Exception as e:
            raise Exception(f"AES encryption failed: {str(e)}")

    def decrypt_aes(self, encrypted_data: str) -> Dict:
        """Decrypt AES encrypted data"""
        try:
            encrypted_bytes = base64.b64decode(encrypted_data.encode())
            decrypted_data = self.fernet.decrypt(encrypted_bytes)
            return eval(decrypted_data.decode())
        except Exception as e:
            raise Exception(f"AES decryption failed: {str(e)}")

    def encrypt_rsa(self, data: bytes) -> bytes:
        """Encrypt data using RSA"""
        try:
            encrypted_data = self.rsa_public_key.encrypt(
                data,
                padding.OAEP(
                    mgf=padding.MGF1(algorithm=hashes.SHA256()),
                    algorithm=hashes.SHA256(),
                    label=None
                )
            )
            return encrypted_data
        except Exception as e:
            raise Exception(f"RSA encryption failed: {str(e)}")

    def decrypt_rsa(self, encrypted_data: bytes) -> bytes:
        """Decrypt RSA encrypted data"""
        try:
            decrypted_data = self.rsa_private_key.decrypt(
                encrypted_data,
                padding.OAEP(
                    mgf=padding.MGF1(algorithm=hashes.SHA256()),
                    algorithm=hashes.SHA256(),
                    label=None
                )
            )
            return decrypted_data
        except Exception as e:
            raise Exception(f"RSA decryption failed: {str(e)}")

    def encrypt_health_data(self, data: Dict, use_rsa: bool = False) -> Dict:
        """
        Encrypt health data using either AES or RSA
        For large datasets, AES is preferred
        """
        try:
            if use_rsa:
                encrypted_data = self.encrypt_rsa(str(data).encode())
                return {
                    "data": base64.b64encode(encrypted_data).decode(),
                    "encryption_type": "RSA",
                    "timestamp": datetime.utcnow().isoformat()
                }
            else:
                encrypted_data, iv = self.encrypt_aes(data)
                return {
                    "data": encrypted_data,
                    "encryption_type": "AES",
                    "iv": iv,
                    "timestamp": datetime.utcnow().isoformat()
                }
        except Exception as e:
            raise Exception(f"Health data encryption failed: {str(e)}")

    def decrypt_health_data(self, encrypted_data: Dict) -> Dict:
        """Decrypt health data based on encryption type"""
        try:
            if encrypted_data["encryption_type"] == "RSA":
                encrypted_bytes = base64.b64decode(encrypted_data["data"])
                decrypted_data = self.decrypt_rsa(encrypted_bytes)
                return eval(decrypted_data.decode())
            else:  # AES
                return self.decrypt_aes(encrypted_data["data"])
        except Exception as e:
            raise Exception(f"Health data decryption failed: {str(e)}")
