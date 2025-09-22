# backup_service.py
from fastapi import APIRouter, Query
from fastapi.responses import FileResponse
from app.services.backup_service import create_backup, get_backups, delete_backup
import os

router = APIRouter(prefix="/backup", tags=["Backup"])

@router.post("/create/{email}")
def backup_create(email: str, encrypt: bool = Query(False)):
    return create_backup(email, encrypt)

@router.get("/")
def backup_list():
    return get_backups()

@router.get("/files/{filename}")
def download_file(filename: str):
    file_path = os.path.join(os.getcwd(), filename)
    if os.path.exists(file_path):
        return FileResponse(file_path, filename=filename)
    return {"error": "File not found"}

@router.delete("/delete/{filename}")
def backup_delete(filename: str):
    return delete_backup(filename)
