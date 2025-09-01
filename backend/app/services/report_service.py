from app.database import db
from datetime import datetime, timedelta

async def generate_weekly_report(user_id: str):
    # Calculate the last 7 days
    end_date = datetime.utcnow()
    start_date = end_date - timedelta(days=7)

    # Fetch diet, fitness, mental health logs from DB
    diet_logs = await db.diet_logs.find({"user_id": user_id, "date": {"$gte": start_date, "$lte": end_date}}).to_list(length=100)
    fitness_logs = await db.fitness_logs.find({"user_id": user_id, "date": {"$gte": start_date, "$lte": end_date}}).to_list(length=100)
    mental_logs = await db.mental_logs.find({"user_id": user_id, "date": {"$gte": start_date, "$lte": end_date}}).to_list(length=100)

    # Summarize data
    diet_summary = {
        "avg_calories": sum(d.get("calories",0) for d in diet_logs)/max(len(diet_logs),1),
        "avg_macros": sum(d.get("macros",0) for d in diet_logs)/max(len(diet_logs),1)
    }
    fitness_summary = {
        "workouts_done": len(fitness_logs),
        "calories_burned": sum(f.get("calories_burned",0) for f in fitness_logs)
    }
    mental_summary = {
        "avg_mood": sum(m.get("mood_score",0) for m in mental_logs)/max(len(mental_logs),1)
    }

    report = {
        "diet_summary": diet_summary,
        "fitness_summary": fitness_summary,
        "mental_summary": mental_summary,
        "generated_at": datetime.utcnow()
    }

    # Store report in DB
    await db.weekly_reports.insert_one({"user_id": user_id, **report})
    return report
