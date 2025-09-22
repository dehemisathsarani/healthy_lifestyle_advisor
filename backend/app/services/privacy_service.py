from app.database import db

async def delete_user_data(user_id: str):
    # Delete all user-related collections
    await db.users.delete_one({"_id": user_id})
    await db.diet_logs.delete_many({"user_id": user_id})
    await db.fitness_logs.delete_many({"user_id": user_id})
    await db.mental_logs.delete_many({"user_id": user_id})
    await db.weekly_reports.delete_many({"user_id": user_id})
    return {"message": "All user data deleted successfully"}
