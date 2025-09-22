from fastapi import APIRouter, Depends
from app.auth.auth import get_current_user
from app.services.encryption import encrypt_data, decrypt_data

router = APIRouter(prefix="/encrypt", tags=["encrypt"])

@router.post("/")
async def encrypt(payload: dict, user=Depends(get_current_user)):
    data = payload.get("data", "")
    encrypted = encrypt_data(data)
    return {"encrypted": encrypted}

@router.post("/decrypt")
async def decrypt(payload: dict, user=Depends(get_current_user)):
    data = payload.get("data", "")
    decrypted = decrypt_data(data)
    return {"decrypted": decrypted}
