import json
import os
from datetime import datetime
from pymongo import MongoClient
from app.config.settings import MONGO_URI, DATABASE_NAME

client = MongoClient(MONGO_URI)
db = client[DATABASE_NAME]

def create_backup(email: str, encrypt: bool = False):
    data = list(db["health_data"].find({"user": email}, {"_id": 0}))
    filename = f"backup_{email}_{datetime.utcnow().strftime('%Y%m%d%H%M%S')}.json"

    # Optional encryption (simple example)
    if encrypt:
        data = json.dumps(data)
        data = "".join([chr(ord(c) + 3) for c in data])
        with open(filename, "w") as f:
            f.write(data)
    else:
        with open(filename, "w") as f:
            json.dump(data, f, indent=4)

    db["backups"].insert_one({
        "user": email,
        "filename": filename,
        "size_kb": os.path.getsize(filename) // 1024,
        "encrypted": encrypt,
        "created_at": datetime.utcnow()
    })
    return {"message": f"Backup created: {filename}"}

def get_backups():
    return list(db["backups"].find({}, {"_id": 0}))

def delete_backup(filename: str):
    file_path = os.path.join(os.getcwd(), filename)
    if os.path.exists(file_path):
        os.remove(file_path)
        db["backups"].delete_one({"filename": filename})
        return {"message": f"Backup {filename} deleted successfully."}
    return {"error": "Backup file not found"}
