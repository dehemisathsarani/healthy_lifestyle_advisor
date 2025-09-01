from fastapi import APIRouter, Depends
from app.auth.auth import get_current_user
from app.services.report_service import generate_weekly_report

router = APIRouter(prefix="/report", tags=["report"])

@router.get("/weekly")
async def weekly_report(user=Depends(get_current_user)):
    report = await generate_weekly_report(str(user["_id"]))
    return report
