from fastapi import APIRouter
from datetime import datetime, timedelta

router = APIRouter(prefix="/weeklyreport", tags=["Weekly Report"])

# Dummy data for example, replace with your DB queries
@router.get("/")
def get_weekly_report():
    # Example: counts for this week
    total_reports = 24
    new_users = 15
    backups = 5
    errors = 2

    # Example trends (last 7 days)
    reports_trend = [
        {"date": (datetime.utcnow() - timedelta(days=i)).strftime("%Y-%m-%d"), "reports": i*2 + 1}
        for i in reversed(range(7))
    ]
    user_activity = [
        {"date": (datetime.utcnow() - timedelta(days=i)).strftime("%Y-%m-%d"), "new_users": i + 1}
        for i in reversed(range(7))
    ]

    return {
        "total_reports": total_reports,
        "new_users": new_users,
        "backups": backups,
        "errors": errors,
        "reports_trend": reports_trend,
        "user_activity": user_activity
    }
