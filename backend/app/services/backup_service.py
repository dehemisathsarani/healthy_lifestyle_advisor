from app.database import db
from datetime import datetime
import json
import os

BACKUP_DIR = "backups"
os.makedirs(BACKUP_DIR, exist_ok=True)

async def create_backup(user_id: str):
    data = {}
    collections = ["diet_logs", "fitness_logs", "mental_logs", "weekly_reports"]
    for col in collections:
        data[col] = await db[col].find({"user_id": user_id}).to_list(length=1000)

    filename = os.path.join(BACKUP_DIR, f"{user_id}_{datetime.utcnow().isoformat()}.json")
    with open(filename, "w") as f:
        json.dump(data, f, default=str)

    return {"message": f"Backup created successfully: {filename}"}
