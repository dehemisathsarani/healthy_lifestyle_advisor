from fastapi import APIRouter
from app.services.weekly_report_service import get_weekly_report

router = APIRouter(prefix="/weeklyreport", tags=["Weekly Report"])

@router.get("/")
def weekly_report():
    return get_weekly_report()
