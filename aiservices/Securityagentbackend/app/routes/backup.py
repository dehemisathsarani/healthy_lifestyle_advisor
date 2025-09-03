# backup_service.py
from fastapi import APIRouter
from app.services.backup_service import create_backup, get_backups

router = APIRouter(prefix="/backup", tags=["Backup"])

@router.post("/create/{email}")
def backup_create(email: str):
    return create_backup(email)

@router.get("/")
def backup_list():
    return get_backups()
