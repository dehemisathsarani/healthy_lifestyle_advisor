from cryptography.fernet import Fernet

# Generate a key once and store it safely
key = Fernet.generate_key()
cipher = Fernet(key)

def encrypt_data(data: str) -> str:
    return cipher.encrypt(data.encode()).decode()

def decrypt_data(data: str) -> str:
    return cipher.decrypt(data.encode()).decode()
