from datetime import datetime, timedelta
from pymongo import MongoClient
from app.config.settings import MONGO_URI, DATABASE_NAME

client = MongoClient(MONGO_URI)
db = client[DATABASE_NAME]

def get_weekly_report():
    one_week_ago = datetime.utcnow() - timedelta(days=7)

    total_reports = db["reports"].count_documents({"created_at": {"$gte": one_week_ago}})
    new_users = db["users"].count_documents({"created_at": {"$gte": one_week_ago}})
    backups = db["backups"].count_documents({"created_at": {"$gte": one_week_ago}})
    errors = db["logs"].count_documents({"level": "error", "timestamp": {"$gte": one_week_ago}})

    recent_activities = [
        {"time": "1 hour ago", "activity": "User John submitted a report"},
        {"time": "3 hours ago", "activity": "Backup completed successfully"},
        {"time": "6 hours ago", "activity": "Error detected in encryption module"},
        {"time": "Yesterday", "activity": "New user Mary registered"},
    ]

    return {
        "stats": [
            {"title": "Total Reports", "value": total_reports},
            {"title": "New Users", "value": new_users},
            {"title": "Backups", "value": backups},
            {"title": "Errors", "value": errors},
        ],
        "recentActivities": recent_activities
    }
