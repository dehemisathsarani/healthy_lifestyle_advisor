from fastapi import APIRouter, Depends
from app.auth.auth import get_current_user
from app.services.backup_service import create_backup

router = APIRouter(prefix="/backup", tags=["backup"])

@router.post("/")
async def backup(user=Depends(get_current_user)):
    result = await create_backup(str(user["_id"]))
    return result
