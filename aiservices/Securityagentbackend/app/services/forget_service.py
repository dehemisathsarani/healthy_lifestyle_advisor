from pymongo import MongoClient
from datetime import datetime
from app.config.settings import MONGO_URI, DATABASE_NAME

client = MongoClient(MONGO_URI)
db = client[DATABASE_NAME]

def request_delete_user_data(email: str):
    # Delete user data
    db["health_data"].delete_many({"user": email})
    db["backups"].delete_many({"user": email})
    db["users"].delete_one({"email": email})

    # Optional: log for admin auditing
    db["deleted_logs"].insert_one({
        "user": email,
        "deleted_at": datetime.utcnow()
    })
    return {"message": f"All data for {email} has been deleted."}
