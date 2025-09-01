from fastapi import APIRouter, Depends
from app.auth.auth import get_current_user
from app.services.privacy_service import delete_user_data

router = APIRouter(prefix="/privacy", tags=["privacy"])

@router.delete("/right-to-forget")
async def right_to_forget(user=Depends(get_current_user)):
    result = await delete_user_data(str(user["_id"]))
    return result
