from fastapi import APIRouter
from app.services.forget_service import request_delete_user_data

router = APIRouter(prefix="/righttoforget", tags=["Right To Forget"])

@router.post("/{email}")
def forget_user(email: str):
    return request_delete_user_data(email)
