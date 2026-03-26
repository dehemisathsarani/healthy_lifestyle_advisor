import uuid
from datetime import datetime, date, timedelta
from typing import Dict, List, Tuple, Optional
import json
import statistics
from fastapi.encoders import jsonable_encoder

from health_models import HealthInsight, RecoveryAdvice


async def analyze_heart_rate_anomalies(db, heart_rate_metric):
    """
    Analyze heart rate data for anomalies and generate insights
    
    Args:
        db: Database connection
        heart_rate_metric: The new heart rate metric to analyze
    """
    user_id = heart_rate_metric.user_id
    
    # Get recent heart rate data for this user in the same activity state
    query = {
        "user_id": user_id,
        "activity_state": heart_rate_metric.activity_state,
        "timestamp": {
            "$gte": datetime.now() - timedelta(days=30)
        }
    }
    
    cursor = db["heart_rate_metrics"].find(query)
    recent_data = await cursor.to_list(length=1000)
    
    if len(recent_data) < 10:
        # Not enough data to establish a baseline
        return
    
    # Calculate the user's typical heart rate range for this activity state
    heart_rates = [hr["bpm"] for hr in recent_data]
    avg_heart_rate = statistics.mean(heart_rates)
    stdev_heart_rate = statistics.stdev(heart_rates) if len(heart_rates) > 1 else 5
    
    # Define anomaly thresholds
    high_threshold = avg_heart_rate + (2 * stdev_heart_rate)
    low_threshold = avg_heart_rate - (2 * stdev_heart_rate)
    
    # Check if the new measurement is anomalous
    current_bpm = heart_rate_metric.bpm
    is_anomalous = current_bpm > high_threshold or current_bpm < low_threshold
    
    if is_anomalous:
        # Create insight for this anomaly
        if current_bpm > high_threshold:
            insight_type = "elevated_heart_rate"
            title = "Elevated Heart Rate Detected"
            description = f"Your heart rate of {current_bpm} bpm during {heart_rate_metric.activity_state} " \
                         f"is higher than your typical range of {int(avg_heart_rate-stdev_heart_rate)}-" \
                         f"{int(avg_heart_rate+stdev_heart_rate)} bpm."
            severity = "medium" if current_bpm > high_threshold + stdev_heart_rate else "low"
            actions = [
                "Take a few minutes to rest and breathe deeply",
                "Stay hydrated",
                "If this persists while at rest, consider consulting a healthcare professional"
            ]
        else:
            insight_type = "low_heart_rate"
            title = "Lower Than Usual Heart Rate Detected"
            description = f"Your heart rate of {current_bpm} bpm during {heart_rate_metric.activity_state} " \
                         f"is lower than your typical range of {int(avg_heart_rate-stdev_heart_rate)}-" \
                         f"{int(avg_heart_rate+stdev_heart_rate)} bpm."
            severity = "low"
            actions = [
                "This could be a sign of improved fitness if you're exercising regularly",
                "If you feel dizzy or fatigued, take a rest",
                "If this persists and you feel unwell, consider consulting a healthcare professional"
            ]
        
        # Create the insight
        insight = HealthInsight(
            id=str(uuid.uuid4()),
            user_id=user_id,
            type=insight_type,
            title=title,
            description=description,
            severity=severity,
            metrics_referenced=[str(heart_rate_metric.timestamp)],
            generated_at=datetime.now(),
            dismissed=False,
            actions=actions
        )
        
        # Save to database
        await db["health_insights"].insert_one(jsonable_encoder(insight))
        
        return insight
    
    return None


async def analyze_sleep_quality(db, sleep_metric):
    """
    Analyze sleep data and generate insights about sleep quality
    
    Args:
        db: Database connection
        sleep_metric: The new sleep metric to analyze
    """
    user_id = sleep_metric.user_id
    
    # Check if sleep duration is sufficient
    total_duration_hours = sleep_metric.duration_minutes / 60
    is_sufficient_sleep = total_duration_hours >= 7
    
    # Check if deep sleep is sufficient (should be about 20-25% of total sleep)
    deep_sleep_hours = sleep_metric.deep_sleep_minutes / 60 if sleep_metric.deep_sleep_minutes else 0
    ideal_deep_sleep_ratio = 0.2  # 20% of total sleep
    actual_deep_sleep_ratio = deep_sleep_hours / total_duration_hours if total_duration_hours > 0 else 0
    has_sufficient_deep_sleep = actual_deep_sleep_ratio >= ideal_deep_sleep_ratio
    
    # Generate insights based on sleep analysis
    if not is_sufficient_sleep:
        # Create insufficient sleep insight
        insight = HealthInsight(
            id=str(uuid.uuid4()),
            user_id=user_id,
            type="insufficient_sleep",
            title="Insufficient Sleep Detected",
            description=f"You slept for {total_duration_hours:.1f} hours, which is less than the recommended " \
                       f"7-9 hours for optimal health and recovery.",
            severity="medium",
            metrics_referenced=[str(sleep_metric.timestamp)],
            generated_at=datetime.now(),
            dismissed=False,
            actions=[
                "Try to go to bed 30 minutes earlier tonight",
                "Limit screen time before bed",
                "Create a consistent sleep schedule",
                "Ensure your bedroom is dark, quiet, and cool"
            ]
        )
        await db["health_insights"].insert_one(jsonable_encoder(insight))
    
    if not has_sufficient_deep_sleep and sleep_metric.deep_sleep_minutes is not None:
        # Create insufficient deep sleep insight
        insight = HealthInsight(
            id=str(uuid.uuid4()),
            user_id=user_id,
            type="insufficient_deep_sleep",
            title="Low Deep Sleep Detected",
            description=f"Your deep sleep was {deep_sleep_hours:.1f} hours ({actual_deep_sleep_ratio*100:.1f}% of total sleep), " \
                       f"which is less than the ideal of {ideal_deep_sleep_ratio*100:.0f}%. Deep sleep is crucial for physical recovery.",
            severity="low",
            metrics_referenced=[str(sleep_metric.timestamp)],
            generated_at=datetime.now(),
            dismissed=False,
            actions=[
                "Avoid caffeine after 2 PM",
                "Try to exercise earlier in the day rather than close to bedtime",
                "Consider relaxation techniques before bed",
                "Keep your bedroom cool (65-68°F / 18-20°C)"
            ]
        )
        await db["health_insights"].insert_one(jsonable_encoder(insight))
    
    # Look at sleep patterns over time (inconsistent sleep schedule)
    query = {
        "user_id": user_id,
        "timestamp": {
            "$gte": datetime.now() - timedelta(days=7)
        }
    }
    
    cursor = db["sleep_metrics"].find(query).sort("timestamp", -1)
    recent_sleep = await cursor.to_list(length=10)
    
    if len(recent_sleep) >= 5:  # Need at least 5 days to detect patterns
        # Check for inconsistent bedtimes
        bedtimes = [datetime.fromisoformat(sleep["start_time"]).time() for sleep in recent_sleep]
        bedtime_hours = [bt.hour + bt.minute/60 for bt in bedtimes]
        
        if max(bedtime_hours) - min(bedtime_hours) > 2:  # More than 2 hour variation
            insight = HealthInsight(
                id=str(uuid.uuid4()),
                user_id=user_id,
                type="inconsistent_sleep_schedule",
                title="Inconsistent Sleep Schedule",
                description=f"Your bedtime has varied by more than 2 hours over the past week. " \
                           f"A consistent sleep schedule helps improve sleep quality.",
                severity="low",
                metrics_referenced=[str(sleep_metric.timestamp)],
                generated_at=datetime.now(),
                dismissed=False,
                actions=[
                    "Try to go to bed and wake up at the same time every day, even on weekends",
                    "Create a bedtime routine to signal to your body it's time to sleep",
                    "Set a bedtime alarm to remind you when to start winding down"
                ]
            )
            await db["health_insights"].insert_one(jsonable_encoder(insight))


async def generate_recovery_advice(db, user_id: str, target_date: date) -> RecoveryAdvice:
    """
    Generate recovery advice based on user's health metrics
    
    Args:
        db: Database connection
        user_id: The user ID to generate advice for
        target_date: The date to generate advice for
        
    Returns:
        RecoveryAdvice object with personalized recommendations
    """
    # Get score and factors
    recovery_score, factors = await calculate_recovery_score(db, user_id, target_date)
    
    # Determine recovery status
    if recovery_score >= 80:
        recovery_status = "optimal"
        title = "Ready for Peak Performance"
        description = "Your body is showing optimal recovery. You're ready for high-intensity training or challenging workouts today."
    elif recovery_score >= 60:
        recovery_status = "good"
        title = "Good Recovery Status"
        description = "Your body has recovered well. You can proceed with moderate to high-intensity training today."
    elif recovery_score >= 40:
        recovery_status = "moderate"
        title = "Moderate Recovery Status"
        description = "Your body has partially recovered. Consider moderate-intensity workouts or active recovery today."
    else:
        recovery_status = "needs_recovery"
        title = "Recovery Needed"
        description = "Your metrics indicate that your body needs more time to recover. Focus on rest and light activity today."
    
    # Generate basic suggestions (for backward compatibility)
    suggestions = []
    
    # Get workout history for personalization
    start_datetime = datetime.combine(target_date, datetime.min.time()) - timedelta(days=7)
    end_datetime = datetime.combine(target_date, datetime.max.time())
    
    workout_query = {
        "user_id": user_id,
        "completed_at": {"$gte": start_datetime, "$lt": end_datetime}
    }
    workout_cursor = db["workout_history"].find(workout_query)
    workouts = await workout_cursor.to_list(length=20)
    
    # Build workout intensity history
    workout_intensity_history = {}
    for workout in workouts:
        date_key = workout["completed_at"].date().isoformat()
        intensity = workout.get("perceived_effort", 5)  # On a scale of 1-10
        duration = workout.get("duration_minutes", 30)
        workout_intensity = min(10, int((intensity * duration) / 30))  # Normalize to 10-point scale
        workout_intensity_history[date_key] = workout_intensity
    
    # Get user preferences
    user_prefs_doc = await db["user_preferences"].find_one({"user_id": user_id})
    user_prefs = user_prefs_doc if user_prefs_doc else {}
    
    preferred_activities = user_prefs.get("preferred_recovery_activities", ["stretching", "meditation", "light walking"])
    available_equipment = user_prefs.get("available_equipment", ["none"])
    
    # Get sleep data for sleep quality factor
    sleep_query = {
        "user_id": user_id,
        "_type": "SleepMetric",
        "timestamp": {"$gte": start_datetime, "$lt": end_datetime}
    }
    sleep_cursor = db["health_metrics"].find(sleep_query)
    sleep_metrics = await sleep_cursor.to_list(length=10)
    
    sleep_quality_factor = 70  # Default
    if sleep_metrics:
        sleep_scores = [m.get("sleep_score", 70) for m in sleep_metrics if "sleep_score" in m]
        if sleep_scores:
            sleep_quality_factor = int(sum(sleep_scores) / len(sleep_scores))
    
    # Analyze HRV trend (simplified - would use real HRV in production)
    hrv_trend = "stable"
    if factors.get("heart_rate_variability", 50) > 70:
        hrv_trend = "improving"
    elif factors.get("heart_rate_variability", 50) < 40:
        hrv_trend = "declining"
    
    # Calculate stress level
    stress_level = 100 - int((factors.get("heart_rate_variability", 50) + factors.get("sleep", 70)) / 2)
    
    # Generate detailed recommendations
    
    # Physical recommendations
    physical_recommendations = []
    
    if recovery_status in ["needs_recovery", "moderate"]:
        physical_recommendations = [
            {
                "title": "Gentle Mobility Session",
                "description": "Focus on hip and shoulder mobility with gentle movements to maintain range of motion without creating additional fatigue.",
                "duration_minutes": 15,
                "priority": "high" if recovery_status == "needs_recovery" else "medium",
                "video_link": "https://example.com/mobility-recovery",
                "suitable_for": ["beginners", "intermediate", "advanced"],
                "benefits": ["Improves circulation", "Maintains mobility", "Speeds recovery"]
            },
            {
                "title": "Light Walking",
                "description": "Low-intensity walking in zone 1 (very easy effort) to promote blood flow without creating additional fatigue.",
                "duration_minutes": 20,
                "priority": "medium",
                "outdoor": True,
                "suitable_for": ["all levels"],
                "benefits": ["Increases circulation", "Clears metabolic waste", "Low stress on body"]
            },
            {
                "title": "Foam Rolling",
                "description": "Target quads, hamstrings, calves, and upper back to release tension and promote blood flow to tired muscles.",
                "duration_minutes": 10,
                "priority": "high",
                "equipment_needed": ["foam_roller"],
                "suitable_for": ["all levels"],
                "benefits": ["Relieves muscle tension", "Improves tissue quality", "Enhances recovery"]
            }
        ]
        
        # Add personalization based on workout history
        if workout_intensity_history:
            # If recent high intensity leg workout, suggest leg recovery
            high_intensity_days = [day for day, score in workout_intensity_history.items() if score >= 8]
            if high_intensity_days:
                physical_recommendations.append({
                    "title": "Targeted Recovery for Worked Muscles",
                    "description": "Focus extra attention on recovering the primary muscle groups from your recent intense workouts.",
                    "duration_minutes": 15,
                    "priority": "high",
                    "suitable_for": ["all levels"],
                    "benefits": ["Addresses specific fatigue", "Reduces DOMS", "Speeds muscle recovery"]
                })
    else:
        physical_recommendations = [
            {
                "title": "Dynamic Mobility Flow",
                "description": "Full body dynamic stretching routine to maintain mobility and prepare for upcoming training.",
                "duration_minutes": 10,
                "priority": "medium",
                "video_link": "https://example.com/dynamic-stretch",
                "suitable_for": ["all levels"],
                "benefits": ["Maintains flexibility", "Improves movement patterns", "Prepares for workouts"]
            },
            {
                "title": "Light Resistance Training",
                "description": "Bodyweight exercises focusing on form and control, emphasizing technique rather than intensity.",
                "duration_minutes": 25,
                "priority": "medium",
                "equipment_needed": ["none"],
                "suitable_for": ["all levels"],
                "benefits": ["Maintains strength", "Improves movement quality", "Promotes active recovery"]
            }
        ]
    
    # Mental recommendations
    mental_recommendations = []
    
    if stress_level > 70:
        mental_recommendations = [
            {
                "title": "Guided Meditation",
                "description": "Use a guided meditation focusing on deep breathing and stress reduction to activate the parasympathetic nervous system.",
                "duration_minutes": 15,
                "priority": "high",
                "audio_link": "https://example.com/stress-meditation",
                "suitable_for": ["all levels"],
                "benefits": ["Reduces cortisol levels", "Calms nervous system", "Improves sleep quality"]
            },
            {
                "title": "Digital Detox",
                "description": "Take a break from screens and notifications for at least 1 hour to reduce cognitive stress and mental fatigue.",
                "duration_minutes": 60,
                "priority": "high",
                "suitable_for": ["all levels"],
                "benefits": ["Reduces mental fatigue", "Improves focus", "Decreases anxiety"]
            }
        ]
    elif stress_level > 40:
        mental_recommendations = [
            {
                "title": "Mindful Breathing",
                "description": "Practice box breathing technique: 4 counts in, 4 hold, 4 out, 4 hold to activate your parasympathetic nervous system.",
                "duration_minutes": 5,
                "priority": "medium",
                "suitable_for": ["all levels"],
                "benefits": ["Reduces heart rate", "Calms nervous system", "Can be done anywhere"]
            }
        ]
    
    # Nutritional recommendations
    nutritional_recommendations = []
    
    if recovery_status in ["needs_recovery", "moderate"]:
        # Get user weight if available
        user_data = await db["users"].find_one({"_id": user_id})
        user_weight_kg = user_data.get("weight_kg", 70) if user_data else 70
        
        protein_target = int(user_weight_kg * 1.8)  # 1.8g per kg for recovery
        
        nutritional_recommendations = [
            {
                "title": "Protein-Focused Recovery Nutrition",
                "description": f"Aim for {protein_target}g of protein today distributed across meals to support muscle recovery and adaptation.",
                "priority": "high",
                "specific_foods": ["lean protein", "eggs", "Greek yogurt", "quality protein powder"],
                "custom_target": f"{protein_target}g protein",
                "benefits": ["Supports muscle repair", "Prevents muscle breakdown", "Optimizes recovery"]
            },
            {
                "title": "Strategic Hydration",
                "description": "Drink an extra 500ml of water with electrolytes to support cellular hydration and metabolic recovery processes.",
                "priority": "high",
                "specific_foods": ["water with electrolytes", "coconut water"],
                "benefits": ["Accelerates recovery", "Supports cellular function", "Improves performance"]
            },
            {
                "title": "Anti-inflammatory Foods",
                "description": "Include foods rich in omega-3 fatty acids and antioxidants to naturally reduce inflammation and support recovery.",
                "priority": "medium",
                "specific_foods": ["fatty fish", "berries", "leafy greens", "turmeric", "tart cherries"],
                "benefits": ["Reduces inflammation", "Speeds recovery", "Supports immune function"]
            }
        ]
        
        # Add personalization based on workout history
        if workout_intensity_history:
            avg_intensity = sum(workout_intensity_history.values()) / len(workout_intensity_history)
            if avg_intensity > 7:
                nutritional_recommendations.append({
                    "title": "Carbohydrate Replenishment",
                    "description": "Include additional quality carbohydrates today to replenish muscle glycogen after your high-intensity training period.",
                    "priority": "medium",
                    "specific_foods": ["sweet potatoes", "whole grains", "fruits", "rice"],
                    "benefits": ["Replenishes energy stores", "Supports recovery", "Prevents overtraining"]
                })
    else:
        nutritional_recommendations = [
            {
                "title": "Balanced Nutrition",
                "description": "Maintain balanced intake of protein, carbs and healthy fats to support ongoing performance and recovery.",
                "priority": "medium",
                "specific_foods": ["balanced meals", "variety of whole foods"],
                "benefits": ["Supports overall health", "Maintains energy levels", "Promotes recovery"]
            }
        ]
    
    # Sleep recommendations
    sleep_recommendations = []
    
    if sleep_quality_factor < 60:
        sleep_recommendations = [
            {
                "title": "Extended Sleep Window",
                "description": "Aim for an additional 30-60 minutes of sleep tonight to address your sleep deficit and support recovery processes.",
                "priority": "high",
                "suitable_for": ["all levels"],
                "benefits": ["Accelerates recovery", "Improves hormone balance", "Enhances cognitive function"]
            },
            {
                "title": "Sleep Environment Optimization",
                "description": "Ensure your bedroom is cool (65-68°F), completely dark, and quiet to maximize sleep quality and deep sleep phases.",
                "priority": "medium",
                "suitable_for": ["all levels"],
                "benefits": ["Improves sleep quality", "Increases deep sleep", "Enhances recovery"]
            },
            {
                "title": "Evening Wind-Down Routine",
                "description": "Establish a calming 30-minute routine before bed to signal your body it's time to sleep and improve sleep onset.",
                "priority": "medium",
                "activities": ["reading", "gentle stretching", "avoid screens"],
                "suitable_for": ["all levels"],
                "benefits": ["Reduces sleep latency", "Improves sleep quality", "Creates consistent routine"]
            }
        ]
    else:
        sleep_recommendations = [
            {
                "title": "Consistent Sleep Schedule",
                "description": "Maintain regular sleep and wake times to support your circadian rhythm and optimize recovery patterns.",
                "priority": "medium",
                "suitable_for": ["all levels"],
                "benefits": ["Supports hormonal patterns", "Improves sleep quality", "Enhances recovery"]
            }
        ]
    
    # Compile all recommendations
    all_recs = physical_recommendations + mental_recommendations + nutritional_recommendations + sleep_recommendations
    
    # Select priority recommendations
    priority_recs = [rec for rec in all_recs if rec.get("priority") == "high"]
    if len(priority_recs) == 0:
        priority_recs = all_recs[:3]  # Take first 3 if no high priority ones
    elif len(priority_recs) > 3:
        priority_recs = priority_recs[:3]  # Limit to top 3 high priority items
    
    # Generate recovery windows based on user's typical day
    recovery_windows = [
        {
            "start_time": "07:30",
            "end_time": "08:00",
            "activities": ["Morning mobility"],
            "priority": "medium"
        },
        {
            "start_time": "12:00",
            "end_time": "12:30", 
            "activities": ["Breathing exercise", "Short walk"],
            "priority": "medium"
        },
        {
            "start_time": "19:00",
            "end_time": "20:00",
            "activities": ["Foam rolling", "Stretching"],
            "priority": "high"
        }
    ]
    
    # Weather-appropriate options (would use real weather API in production)
    weather_appropriate = ["indoor mobility work", "yoga", "meditation"] 
    
    # Determine expected recovery time
    if recovery_score < 40:
        expected_time = "2-3 days of focused recovery"
    elif recovery_score < 60:
        expected_time = "24-36 hours of balanced recovery"
    elif recovery_score < 80:
        expected_time = "Normal recovery routine"
    else:
        expected_time = "Ready for training"
    
    # Next workout recommendation
    if recovery_score < 40:
        next_workout = {
            "recommended_type": "Rest or very light activity",
            "earliest_date": (target_date + timedelta(days=1)).isoformat(),
            "intensity": "Very low (1-2/10)",
            "notes": "Focus on recovery activities only"
        }
    elif recovery_score < 60:
        next_workout = {
            "recommended_type": "Light activity or technique work",
            "earliest_date": target_date.isoformat(),
            "intensity": "Low (3-4/10)",
            "notes": "Focus on form, avoid high intensity"
        }
    elif recovery_score < 80:
        next_workout = {
            "recommended_type": "Moderate training session",
            "earliest_date": target_date.isoformat(),
            "intensity": "Moderate (5-7/10)",
            "notes": "Normal training, monitor fatigue"
        }
    else:
        next_workout = {
            "recommended_type": "Full training session",
            "earliest_date": target_date.isoformat(),
            "intensity": "As planned (up to 10/10)",
            "notes": "Good day for challenging workout"
        }
    
    # Extract legacy suggestion strings for backward compatibility
    legacy_suggestions = []
    for rec in priority_recs:
        legacy_suggestions.append(rec["title"])
    if len(legacy_suggestions) < 3:
        for rec in all_recs:
            if rec["title"] not in legacy_suggestions:
                legacy_suggestions.append(rec["title"])
                if len(legacy_suggestions) >= 5:
                    break
    
    # Create the enhanced recovery advice object
    recovery_advice = RecoveryAdvice(
        id=str(uuid.uuid4()),
        user_id=user_id,
        title=title,
        description=description,
        advice_date=target_date,
        recovery_score=recovery_score,
        recovery_status=recovery_status,
        factors=factors,
        
        # Enhanced fields
        workout_intensity_history=workout_intensity_history,
        sleep_quality_factor=sleep_quality_factor,
        hrv_trend=hrv_trend,
        stress_level=stress_level,
        
        physical_recommendations=physical_recommendations,
        mental_recommendations=mental_recommendations,
        nutritional_recommendations=nutritional_recommendations,
        sleep_recommendations=sleep_recommendations,
        
        suggestions=legacy_suggestions,  # Backward compatibility
        
        recommended_recovery_windows=recovery_windows,
        next_workout_recommendation=next_workout,
        
        preferred_recovery_activities=preferred_activities,
        available_equipment=available_equipment,
        weather_appropriate_options=weather_appropriate,
        
        priority_recommendations=priority_recs,
        expected_recovery_time=expected_time,
        
        generated_at=datetime.now()
    )
    
    return recovery_advice


async def calculate_recovery_score(db, user_id: str, target_date: date) -> Tuple[int, Dict[str, float]]:
    """
    Calculate a recovery score based on various health metrics
    
    Args:
        db: Database connection
        user_id: The user ID to calculate score for
        target_date: The date to calculate score for
        
    Returns:
        Tuple of (recovery_score, factor_scores)
    """
    # Initialize factors and default scores (0-100 scale)
    factors = {
        "sleep": 70,  # Sleep quality & duration
        "resting_heart_rate": 70,  # RHR compared to baseline
        "heart_rate_variability": 70,  # HRV compared to baseline
        "activity_strain": 70,  # Recent activity level/strain
        "muscle_fatigue": 70,  # Estimated muscle fatigue
    }
    
    start_datetime = datetime.combine(target_date - timedelta(days=1), datetime.min.time())
    end_datetime = datetime.combine(target_date, datetime.min.time())
    
    # Analyze sleep
    sleep_query = {
        "user_id": user_id,
        "end_time": {"$gte": start_datetime, "$lte": end_datetime}
    }
    sleep_data = await db["sleep_metrics"].find_one(sleep_query)
    
    if sleep_data:
        sleep_duration_hours = sleep_data["duration_minutes"] / 60
        
        # Sleep duration factor: 7-9 hours is optimal
        if sleep_duration_hours >= 7 and sleep_duration_hours <= 9:
            duration_score = 100
        elif sleep_duration_hours >= 6 and sleep_duration_hours < 7:
            duration_score = 80
        elif sleep_duration_hours > 9 and sleep_duration_hours <= 10:
            duration_score = 80
        elif sleep_duration_hours >= 5 and sleep_duration_hours < 6:
            duration_score = 60
        elif sleep_duration_hours > 10:
            duration_score = 60
        else:
            duration_score = 40
        
        # Sleep quality factor
        sleep_score = sleep_data.get("sleep_score", None)
        if sleep_score is not None:
            quality_score = sleep_score
        else:
            # Estimate quality from deep sleep percentage if available
            deep_sleep_min = sleep_data.get("deep_sleep_minutes", None)
            if deep_sleep_min is not None:
                deep_sleep_pct = (deep_sleep_min / sleep_data["duration_minutes"]) * 100
                if deep_sleep_pct >= 20:
                    quality_score = 90
                elif deep_sleep_pct >= 15:
                    quality_score = 75
                elif deep_sleep_pct >= 10:
                    quality_score = 60
                else:
                    quality_score = 45
            else:
                quality_score = 70  # Default if we have no quality indicators
        
        # Combine duration and quality
        factors["sleep"] = (duration_score * 0.6) + (quality_score * 0.4)
    
    # Analyze heart rate
    rhr_query = {
        "user_id": user_id,
        "activity_state": "rest",
        "timestamp": {"$gte": start_datetime, "$lte": end_datetime}
    }
    rhr_cursor = db["heart_rate_metrics"].find(rhr_query)
    rhr_data = await rhr_cursor.to_list(length=100)
    
    if rhr_data:
        # Calculate resting heart rate
        resting_hrs = [hr["bpm"] for hr in rhr_data]
        avg_rhr = statistics.mean(resting_hrs)
        
        # Get baseline RHR (previous 7-14 days)
        baseline_query = {
            "user_id": user_id,
            "activity_state": "rest",
            "timestamp": {
                "$gte": start_datetime - timedelta(days=14),
                "$lt": start_datetime - timedelta(days=1)
            }
        }
        baseline_cursor = db["heart_rate_metrics"].find(baseline_query)
        baseline_data = await baseline_cursor.to_list(length=1000)
        
        if baseline_data:
            baseline_hrs = [hr["bpm"] for hr in baseline_data]
            baseline_avg = statistics.mean(baseline_hrs)
            baseline_stdev = statistics.stdev(baseline_hrs) if len(baseline_hrs) > 1 else 3
            
            # Score based on deviation from baseline
            # Lower RHR than baseline is generally good, higher can indicate fatigue/stress
            rhr_delta = avg_rhr - baseline_avg
            
            if rhr_delta <= -5:  # Significantly lower RHR (improved fitness)
                factors["resting_heart_rate"] = 95
            elif rhr_delta <= -2:  # Moderately lower RHR
                factors["resting_heart_rate"] = 85
            elif rhr_delta <= 2:  # Similar to baseline
                factors["resting_heart_rate"] = 75
            elif rhr_delta <= 5:  # Moderately elevated RHR
                factors["resting_heart_rate"] = 60
            elif rhr_delta <= 10:  # Significantly elevated RHR
                factors["resting_heart_rate"] = 40
            else:  # Very elevated RHR
                factors["resting_heart_rate"] = 25
    
    # Analyze recent activity strain
    # Look at workout history for past 3 days
    three_days_ago = start_datetime - timedelta(days=3)
    workout_query = {
        "user_id": user_id,
        "completed_at": {"$gte": three_days_ago, "$lt": start_datetime}
    }
    workout_cursor = db["workout_history"].find(workout_query)
    workout_data = await workout_cursor.to_list(length=10)
    
    if workout_data:
        # Calculate strain based on workout intensity, duration, and recency
        total_strain = 0
        for workout in workout_data:
            # Base strain from calories
            calories = workout.get("calories_burned", 300)
            strain = calories / 100  # 300 calories = 3 strain points
            
            # Adjust for recency
            days_ago = (start_datetime - workout["completed_at"]).days
            recency_factor = 1.0 if days_ago == 0 else (0.8 if days_ago == 1 else 0.6)
            
            total_strain += strain * recency_factor
        
        # Score based on accumulated strain
        if total_strain <= 5:  # Very low recent strain
            factors["activity_strain"] = 95
        elif total_strain <= 10:  # Low strain
            factors["activity_strain"] = 85
        elif total_strain <= 15:  # Moderate strain
            factors["activity_strain"] = 70
        elif total_strain <= 20:  # High strain
            factors["activity_strain"] = 50
        elif total_strain <= 25:  # Very high strain
            factors["activity_strain"] = 30
        else:  # Extreme strain
            factors["activity_strain"] = 20
    
    # Calculate overall recovery score (weighted average)
    weights = {
        "sleep": 0.35,
        "resting_heart_rate": 0.25,
        "heart_rate_variability": 0.15,
        "activity_strain": 0.15,
        "muscle_fatigue": 0.10
    }
    
    recovery_score = sum(factors[k] * weights[k] for k in factors)
    
    # Ensure score is an integer between 0 and 100
    recovery_score = max(0, min(100, round(recovery_score)))
    
    return recovery_score, factors
