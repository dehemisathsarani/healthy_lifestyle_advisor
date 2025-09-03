from hashlib import sha256

def encrypt_text(text: str):
    # Dummy encryption: reverse string
    encrypted = text[::-1]
    hash_summary = sha256(encrypted.encode()).hexdigest()
    return encrypted, hash_summary

def decrypt_text(encrypted: str):
    # Dummy decryption
    return encrypted[::-1]
