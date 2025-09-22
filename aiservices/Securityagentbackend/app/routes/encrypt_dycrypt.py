from fastapi import APIRouter
from pydantic import BaseModel
from app.services.encryption_service import encrypt_text, decrypt_text

router = APIRouter(prefix="/encrypt", tags=["Encrypt / Decrypt"])

class TextPayload(BaseModel):
    text: str

@router.post("/encrypt")
def encrypt(payload: TextPayload):
    encrypted, hash_summary = encrypt_text(payload.text)
    return {"encrypted": encrypted, "hash": hash_summary}

@router.post("/decrypt")
def decrypt(payload: TextPayload):
    decrypted = decrypt_text(payload.text)
    return {"decrypted": decrypted}
