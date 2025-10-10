# Add these new endpoints after the meal-plan endpoint in main.py

@app.post("/hydration")
async def update_hydration(
    hydration_data: HydrationUpdateRequest,
    current_user: dict = Depends(get_current_user)
):
    """Record water intake"""
    try:
        from nutrition_service import nutrition_service
        
        timestamp = hydration_data.timestamp or datetime.now()
        date = timestamp.strftime('%Y-%m-%d')
        
        # Create hydration entry
        hydration_entry = HydrationEntry(
            user_id=current_user['user_id'],
            amount_ml=hydration_data.amount_ml,
            timestamp=timestamp,
            date=date
        )
        
        # Save entry to database
        result = await db.hydration_entries.insert_one(hydration_entry.dict())
        
        # Update daily summary
        await db.daily_nutrition.update_one(
            {
                "user_id": current_user['user_id'],
                "date": date
            },
            {
                "$inc": {"total_water_ml": hydration_data.amount_ml},
                "$set": {"updated_at": datetime.now()}
            },
            upsert=True
        )
        
        # Get updated hydration summary
        hydration_summary = await nutrition_service.get_hydration_reminder(current_user['user_id'])
        
        return {
            "success": True,
            "message": "Hydration recorded successfully",
            "hydration_summary": hydration_summary
        }
    
    except Exception as e:
        logger.error(f"Error recording hydration: {e}")
        raise HTTPException(status_code=500, detail="Failed to record hydration")

@app.get("/hydration/reminder")
async def get_hydration_reminder(
    current_user: dict = Depends(get_current_user)
):
    """Get hydration reminder and status"""
    try:
        from nutrition_service import nutrition_service
        
        # Get current date
        today = datetime.now().strftime('%Y-%m-%d')
        
        # Get today's hydration entries
        hydration_entries = await db.hydration_entries.find({
            "user_id": current_user['user_id'],
            "date": today
        }).to_list(None)
        
        # Calculate total water intake
        total_water_ml = sum(entry.get('amount_ml', 0) for entry in hydration_entries)
        
        # Get user's hydration goal
        user_goals = await db.user_goals.find_one({"user_id": current_user['user_id']})
        daily_water_target = user_goals.get('daily_water_ml', 2500) if user_goals else 2500
        
        # Get hydration reminder
        hydration_reminder = await nutrition_service.get_hydration_reminder(current_user['user_id'])
        
        # Override with actual data
        hydration_reminder["water_consumed"] = total_water_ml
        hydration_reminder["daily_target"] = daily_water_target
        hydration_reminder["remaining"] = max(0, daily_water_target - total_water_ml)
        hydration_reminder["percent_complete"] = min(100, (total_water_ml / daily_water_target) * 100)
        
        return hydration_reminder
    
    except Exception as e:
        logger.error(f"Error getting hydration reminder: {e}")
        raise HTTPException(status_code=500, detail="Failed to get hydration reminder")

@app.get("/nutrition/daily-summary")
async def get_daily_nutrition_summary(
    date: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """Get summary of nutrition for a specific day"""
    try:
        from nutrition_service import nutrition_service
        
        if not date:
            date = datetime.now().strftime('%Y-%m-%d')
        
        # Try to get from database first
        daily_summary = await db.daily_nutrition.find_one({
            "user_id": current_user['user_id'],
            "date": date
        })
        
        if daily_summary:
            # Convert ObjectId to string
            daily_summary["_id"] = str(daily_summary["_id"])
            return daily_summary
        
        # If not found, generate summary using service
        daily_summary = await nutrition_service.get_daily_summary(current_user['user_id'], date)
        
        # Store in database for future reference
        await db.daily_nutrition.insert_one(daily_summary.dict())
        
        return daily_summary.dict()
    
    except Exception as e:
        logger.error(f"Error getting daily nutrition summary: {e}")
        raise HTTPException(status_code=500, detail="Failed to get nutrition summary")

@app.get("/nutrition/insights")
async def get_nutrition_insights(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """Get nutrition insights over a period of time"""
    try:
        from nutrition_service import nutrition_service
        
        if not end_date:
            end_date = datetime.now().strftime('%Y-%m-%d')
            
        if not start_date:
            # Default to last 7 days
            start = datetime.now() - timedelta(days=7)
            start_date = start.strftime('%Y-%m-%d')
        
        insights = await nutrition_service.get_nutrition_insights(
            current_user['user_id'],
            start_date,
            end_date
        )
        
        return insights
    
    except Exception as e:
        logger.error(f"Error getting nutrition insights: {e}")
        raise HTTPException(status_code=500, detail="Failed to get nutrition insights")

@app.post("/nutrition/import-myfitnesspal")
async def import_from_myfitnesspal(
    credentials: dict,
    current_user: dict = Depends(get_current_user)
):
    """Import nutrition data from MyFitnessPal"""
    try:
        from nutrition_service import nutrition_service
        
        if "username" not in credentials or "password" not in credentials:
            raise HTTPException(status_code=400, detail="Username and password are required")
        
        # Import data from MyFitnessPal
        import_result = await nutrition_service.import_from_myfitnesspal(
            credentials["username"],
            credentials["password"],
            current_user['user_id']
        )
        
        return import_result
    
    except Exception as e:
        logger.error(f"Error importing from MyFitnessPal: {e}")
        raise HTTPException(status_code=500, detail="Failed to import from MyFitnessPal")
