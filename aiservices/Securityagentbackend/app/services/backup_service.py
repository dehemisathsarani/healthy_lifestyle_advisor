import json
from datetime import datetime
from pymongo import MongoClient
from app.config.settings import MONGO_URI, DATABASE_NAME

client = MongoClient(MONGO_URI)
db = client[DATABASE_NAME]

def create_backup(email: str):
    data = list(db["health_data"].find({"user": email}, {"_id":0}))
    filename = f"backup_{email}_{datetime.utcnow().strftime('%Y%m%d%H%M%S')}.json"
    with open(filename, "w") as f:
        json.dump(data, f, indent=4)
    db["backups"].insert_one({
        "user": email,
        "filename": filename,
        "created_at": datetime.utcnow()
    })
    return {"message": f"Backup created: {filename}"}

def get_backups():
    return list(db["backups"].find({}, {"_id":0}))
