import uuid
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
import random

from models import (
    UserProfile, Exercise, Workout, WorkoutPlan, 
    DashboardData, WeeklyActivitySummary, FitnessStats,
    WorkoutExercise, WorkoutPlanRequest
)


def get_demo_user_profile() -> UserProfile:
    """Get a demo user profile"""
    return UserProfile(
        id="profile_123",
        user_id="user_123",
        name="Demo User",
        age=32,
        gender="male",
        height_cm=178,
        weight_kg=75,
        fitness_level="intermediate",
        fitness_goal="strength",
        created_at=datetime.now() - timedelta(days=30),
        updated_at=datetime.now()
    )


def get_demo_exercises() -> List[Exercise]:
    """Get a list of demo exercises"""
    return [
        Exercise(
            id="ex1",
            name="Barbell Bench Press",
            description="A compound exercise that targets the chest, shoulders, and triceps",
            difficulty="Intermediate",
            type="Strength",
            muscle_groups=["Chest", "Shoulders", "Triceps"],
            equipment=["Barbell", "Bench"],
            instructions=[
                "Lie on your back on a flat bench",
                "Grip the barbell with hands slightly wider than shoulder-width",
                "Lower the bar to mid-chest level",
                "Press the bar back to starting position, extending your arms",
                "Repeat for the desired number of repetitions"
            ],
            recommended_sets=4,
            recommended_reps=8,
            recommended_rest=90,
            calories_per_min=8,
            image_url="https://www.inspireusafoundation.org/wp-content/uploads/2022/03/barbell-bench-press-benefits-1024x576.jpg"
        ),
        Exercise(
            id="ex2",
            name="Squat",
            description="A fundamental compound exercise that primarily targets the quadriceps, hamstrings, and glutes",
            difficulty="Intermediate",
            type="Strength",
            muscle_groups=["Legs", "Glutes", "Lower Back"],
            equipment=["Barbell", "Squat Rack"],
            instructions=[
                "Stand with feet shoulder-width apart",
                "Place barbell across upper back",
                "Bend knees and lower body until thighs are parallel to floor",
                "Keep back straight and chest up throughout the movement",
                "Return to starting position by extending knees and hips"
            ],
            recommended_sets=4,
            recommended_reps=10,
            recommended_rest=120,
            calories_per_min=10,
            image_url="https://www.inspireusafoundation.org/wp-content/uploads/2022/11/barbell-squat-muscles.jpg"
        ),
        Exercise(
            id="ex3",
            name="Pull-Up",
            description="An upper body exercise that targets the lats, biceps, and middle back",
            difficulty="Advanced",
            type="Strength",
            muscle_groups=["Back", "Biceps", "Shoulders"],
            equipment=["Pull-Up Bar"],
            instructions=[
                "Hang from a pull-up bar with hands slightly wider than shoulder-width",
                "Pull your body up until your chin clears the bar",
                "Lower your body back to starting position with control",
                "Repeat for the desired number of repetitions"
            ],
            recommended_sets=3,
            recommended_reps=8,
            recommended_rest=90,
            calories_per_min=9,
            image_url="https://www.inspireusafoundation.org/wp-content/uploads/2022/11/pull-up-variations.jpg"
        ),
        Exercise(
            id="ex4",
            name="Deadlift",
            description="A compound exercise that works the lower back, glutes, and hamstrings",
            difficulty="Advanced",
            type="Strength",
            muscle_groups=["Lower Back", "Glutes", "Hamstrings"],
            equipment=["Barbell", "Weight Plates"],
            instructions=[
                "Stand with feet hip-width apart, barbell over mid-foot",
                "Bend at hips and knees to grasp the bar with hands shoulder-width apart",
                "Keep back flat and chest up as you stand up with the weight",
                "Return the weight to the floor by pushing hips back and bending knees",
                "Repeat for the desired number of repetitions"
            ],
            recommended_sets=3,
            recommended_reps=6,
            recommended_rest=180,
            calories_per_min=11,
            image_url="https://www.inspireusafoundation.org/wp-content/uploads/2022/08/barbell-deadlift.jpg"
        ),
        Exercise(
            id="ex5",
            name="Push-Up",
            description="A classic bodyweight exercise that targets the chest, shoulders, and triceps",
            difficulty="Beginner",
            type="Bodyweight",
            muscle_groups=["Chest", "Shoulders", "Triceps", "Core"],
            equipment=[],
            instructions=[
                "Start in a plank position with hands slightly wider than shoulders",
                "Keep body in a straight line from head to heels",
                "Lower body by bending elbows until chest nearly touches the floor",
                "Push back up to starting position",
                "Repeat for the desired number of repetitions"
            ],
            recommended_sets=3,
            recommended_reps=15,
            recommended_rest=60,
            calories_per_min=7,
            image_url="https://www.inspireusafoundation.org/wp-content/uploads/2022/04/push-up-variations.jpg"
        ),
        Exercise(
            id="ex6",
            name="Dumbbell Shoulder Press",
            description="An exercise that targets the deltoid muscles and triceps",
            difficulty="Intermediate",
            type="Strength",
            muscle_groups=["Shoulders", "Triceps"],
            equipment=["Dumbbells"],
            instructions=[
                "Sit on a bench with back support",
                "Hold dumbbells at shoulder height with palms facing forward",
                "Press the weights upward until arms are extended",
                "Lower the weights back to starting position",
                "Repeat for the desired number of repetitions"
            ],
            recommended_sets=3,
            recommended_reps=12,
            recommended_rest=90,
            calories_per_min=7,
            image_url="https://www.inspireusafoundation.org/wp-content/uploads/2022/04/dumbbell-shoulder-press.jpg"
        ),
        Exercise(
            id="ex7",
            name="Plank",
            description="A core strengthening exercise that improves stability and endurance",
            difficulty="Beginner",
            type="Bodyweight",
            muscle_groups=["Core", "Abs", "Lower Back"],
            equipment=[],
            instructions=[
                "Start in a forearm plank position with elbows directly under shoulders",
                "Keep body in a straight line from head to heels",
                "Engage core and hold the position",
                "Maintain proper form and breathe normally"
            ],
            recommended_sets=3,
            recommended_reps=None,
            recommended_rest=60,
            calories_per_min=5,
            image_url="https://www.inspireusafoundation.org/wp-content/uploads/2022/03/plank-exercise-benefits.jpg"
        ),
        Exercise(
            id="ex8",
            name="Lunges",
            description="A lower body exercise that works the quadriceps, hamstrings, and glutes",
            difficulty="Beginner",
            type="Bodyweight",
            muscle_groups=["Legs", "Glutes"],
            equipment=[],
            instructions=[
                "Stand with feet hip-width apart",
                "Take a step forward with one leg",
                "Lower body by bending both knees to 90 degrees",
                "Push back up to starting position",
                "Repeat with the other leg",
                "Continue alternating legs for the desired number of repetitions"
            ],
            recommended_sets=3,
            recommended_reps=12,
            recommended_rest=60,
            calories_per_min=8,
            image_url="https://www.inspireusafoundation.org/wp-content/uploads/2022/02/lunge-variations.jpg"
        ),
        Exercise(
            id="ex9",
            name="Burpee",
            description="A full-body exercise that combines a squat, push-up, and jump",
            difficulty="Advanced",
            type="Cardio",
            muscle_groups=["Full Body", "Legs", "Chest", "Core"],
            equipment=[],
            instructions=[
                "Start in a standing position",
                "Drop into a squat position and place hands on the floor",
                "Kick feet back into a plank position",
                "Perform a push-up",
                "Return feet to squat position",
                "Jump up from squat position with arms extended overhead",
                "Repeat for the desired number of repetitions"
            ],
            recommended_sets=3,
            recommended_reps=15,
            recommended_rest=60,
            calories_per_min=12,
            image_url="https://www.inspireusafoundation.org/wp-content/uploads/2022/07/burpee-exercise-benefits.jpg"
        ),
        Exercise(
            id="ex10",
            name="Russian Twist",
            description="An exercise that targets the obliques and core muscles",
            difficulty="Intermediate",
            type="Core",
            muscle_groups=["Abs", "Obliques", "Core"],
            equipment=["Dumbbell", "Medicine Ball"],
            instructions=[
                "Sit on the floor with knees bent and feet elevated",
                "Lean back slightly to engage core muscles",
                "Hold a weight or medicine ball with both hands",
                "Twist torso to the right, bringing the weight beside your hip",
                "Twist to the left side",
                "Continue alternating sides for the desired number of repetitions"
            ],
            recommended_sets=3,
            recommended_reps=20,
            recommended_rest=45,
            calories_per_min=6,
            image_url="https://www.inspireusafoundation.org/wp-content/uploads/2022/01/weighted-russian-twist.jpg"
        )
    ]


def get_demo_workouts(exercise_list: Optional[List[Exercise]] = None) -> List[Workout]:
    """Get a list of demo workouts"""
    if exercise_list is None:
        exercise_list = get_demo_exercises()
    
    # Upper body workout
    upper_body_exercises = [
        WorkoutExercise(
            exercise=ex,
            sets_reps=f"{ex.recommended_sets}×{ex.recommended_reps}" if ex.recommended_reps else f"{ex.recommended_sets}×30s",
            duration=30 if not ex.recommended_reps else None
        )
        for ex in exercise_list 
        if any(muscle in ["Chest", "Back", "Shoulders", "Arms", "Triceps", "Biceps"] 
               for muscle in ex.muscle_groups)
    ][:5]  # Limit to 5 exercises
    
    upper_body_workout = Workout(
        id="workout-1",
        name="Upper Body Focus",
        focus="Chest, Back, and Arms",
        total_duration=45,
        total_calories=320,
        rest_day=False,
        exercises=upper_body_exercises,
        instructions="Perform each exercise with proper form. Rest 60-90 seconds between sets."
    )
    
    # Lower body workout
    lower_body_exercises = [
        WorkoutExercise(
            exercise=ex,
            sets_reps=f"{ex.recommended_sets}×{ex.recommended_reps}" if ex.recommended_reps else f"{ex.recommended_sets}×30s",
            duration=30 if not ex.recommended_reps else None
        )
        for ex in exercise_list 
        if any(muscle in ["Legs", "Glutes", "Lower Back", "Hamstrings", "Quadriceps"] 
               for muscle in ex.muscle_groups)
    ][:5]  # Limit to 5 exercises
    
    lower_body_workout = Workout(
        id="workout-2",
        name="Lower Body Power",
        focus="Legs and Glutes",
        total_duration=50,
        total_calories=380,
        rest_day=False,
        exercises=lower_body_exercises,
        instructions="Focus on proper form. For squats and deadlifts, start with lighter weights to warm up."
    )
    
    # Rest day
    rest_day = Workout(
        id="workout-3",
        name="Rest Day",
        focus="Recovery",
        total_duration=0,
        total_calories=0,
        rest_day=True,
        exercises=[]
    )
    
    # Core workout
    core_exercises = [
        WorkoutExercise(
            exercise=ex,
            sets_reps=f"{ex.recommended_sets}×{ex.recommended_reps}" if ex.recommended_reps else f"{ex.recommended_sets}×30s",
            duration=30 if not ex.recommended_reps else None
        )
        for ex in exercise_list 
        if any(muscle in ["Core", "Abs", "Obliques"] 
               for muscle in ex.muscle_groups)
    ][:5]  # Limit to 5 exercises
    
    core_workout = Workout(
        id="workout-4",
        name="Core and Cardio",
        focus="Abs and Cardiovascular System",
        total_duration=40,
        total_calories=280,
        rest_day=False,
        exercises=core_exercises,
        instructions="Perform the core exercises in a circuit with minimal rest. Finish with 15 minutes of cardio."
    )
    
    return [upper_body_workout, lower_body_workout, rest_day, core_workout]


def get_demo_workout_plan(user_id: str) -> WorkoutPlan:
    """Get a demo workout plan"""
    workouts = get_demo_workouts()
    
    return WorkoutPlan(
        id="plan-1",
        user_id=user_id,
        name="Strength Building Program",
        description="A balanced program focused on building overall strength",
        goal="Increase strength and muscle mass",
        difficulty="Intermediate",
        duration_weeks=6,
        workouts_per_week=4,
        focus_areas=["Upper Body", "Lower Body", "Core"],
        workouts=workouts,
        created_at=datetime.now() - timedelta(days=7)
    )


def generate_workout_plan(plan_request: WorkoutPlanRequest, user_id: str) -> WorkoutPlan:
    """Generate a workout plan based on user preferences"""
    exercises = get_demo_exercises()
    
    # Filter exercises by difficulty
    difficulty_mapping = {
        "beginner": "Beginner",
        "intermediate": "Intermediate",
        "advanced": "Advanced"
    }
    
    target_difficulty = difficulty_mapping.get(plan_request.fitness_level, "Intermediate")
    
    # Adjust difficulty based on user level
    if plan_request.fitness_level == "beginner":
        filtered_exercises = [ex for ex in exercises if ex.difficulty in ["Beginner", "Intermediate"]]
    elif plan_request.fitness_level == "advanced":
        filtered_exercises = [ex for ex in exercises if ex.difficulty in ["Intermediate", "Advanced"]]
    else:
        filtered_exercises = exercises
    
    # Adjust workouts based on specific fitness goal
    goal_focused_exercises = []
    if plan_request.goal.lower() == "weight_loss" or plan_request.goal.lower() == "fat_loss":
        # For weight loss, focus on cardio and full-body exercises with higher rep ranges
        goal_focused_exercises = [ex for ex in filtered_exercises if ex.type in ["Cardio", "HIIT"]]
        # Add some strength exercises for muscle retention
        strength_exercises = [ex for ex in filtered_exercises if ex.type == "Strength"][:3]
        goal_focused_exercises.extend(strength_exercises)
        
    elif plan_request.goal.lower() == "muscle_gain" or plan_request.goal.lower() == "strength":
        # For muscle gain, focus on strength exercises with progressive overload
        goal_focused_exercises = [ex for ex in filtered_exercises if ex.type == "Strength"]
        # Add some compound exercises
        compound_exercises = [ex for ex in goal_focused_exercises 
                             if len(ex.muscle_groups) > 2][:5]
        goal_focused_exercises = compound_exercises + [ex for ex in goal_focused_exercises 
                                                      if ex not in compound_exercises][:5]
        
    elif plan_request.goal.lower() == "endurance":
        # For endurance, focus on higher rep ranges and cardio
        goal_focused_exercises = [ex for ex in filtered_exercises if ex.type in ["Cardio", "HIIT"]]
        # Include bodyweight exercises for muscular endurance
        bodyweight_exercises = [ex for ex in filtered_exercises if ex.type == "Bodyweight"]
        goal_focused_exercises.extend(bodyweight_exercises)
        
    elif plan_request.goal.lower() == "flexibility":
        # For flexibility, include stretching exercises
        # Note: In a real implementation, you'd have stretching exercises in the database
        # For demo, we'll use a mix of bodyweight exercises
        goal_focused_exercises = [ex for ex in filtered_exercises if ex.type == "Bodyweight"]
        
    else:
        # Default to a balanced approach
        goal_focused_exercises = filtered_exercises
    
    # If we don't have enough exercises after filtering, add some from the filtered list
    if len(goal_focused_exercises) < 10:
        remaining_needed = 10 - len(goal_focused_exercises)
        additional_exercises = [ex for ex in filtered_exercises if ex not in goal_focused_exercises][:remaining_needed]
        goal_focused_exercises.extend(additional_exercises)
    
    # Create progression plan - adjust workout intensity based on weeks
    progression_workouts = []
    
    # Generate base workouts
    workouts = get_demo_workouts(goal_focused_exercises)
    
    # Implement progression logic based on fitness level and duration
    for week in range(1, plan_request.duration_weeks + 1):
        week_workouts = []
        progression_factor = min(1.0 + (week - 1) * 0.1, 1.5)  # Progressive increase up to 50%
        
        # Create weekly workout rotation based on frequency
        for day in range(plan_request.frequency):
            if day < len(workouts):
                base_workout = workouts[day]
                
                # Create a progressively more intense version of the workout
                progressed_exercises = []
                for workout_ex in base_workout.exercises:
                    # Parse the sets and reps
                    parts = workout_ex.sets_reps.split("×")
                    if len(parts) == 2:
                        sets = int(parts[0])
                        if parts[1].endswith("s"):  # Duration-based exercise
                            duration_secs = int(parts[1][:-1])
                            new_duration = min(int(duration_secs * progression_factor), 60)  # Cap at 60 seconds
                            progressed_sets_reps = f"{sets}×{new_duration}s"
                        else:  # Rep-based exercise
                            reps = int(parts[1])
                            # Adjust reps based on goal and progression
                            if plan_request.goal.lower() in ["endurance", "weight_loss"]:
                                # Higher reps for endurance/weight loss
                                new_reps = min(int(reps * progression_factor), 30)  # Cap at 30 reps
                            elif plan_request.goal.lower() in ["muscle_gain", "strength"]:
                                # Keep reps lower for strength but increase sets
                                new_reps = min(int(reps * 0.9 * progression_factor), 12)  # Cap at 12 reps
                                sets = min(sets + (week // 2), 5)  # Increase sets every 2 weeks, cap at 5
                            else:
                                new_reps = min(int(reps * progression_factor), 20)  # Default cap at 20
                            
                            progressed_sets_reps = f"{sets}×{new_reps}"
                    else:
                        progressed_sets_reps = workout_ex.sets_reps
                    
                    progressed_exercises.append(
                        WorkoutExercise(
                            exercise=workout_ex.exercise,
                            sets_reps=progressed_sets_reps,
                            duration=workout_ex.duration
                        )
                    )
                
                # Create the progressed workout
                week_workout = Workout(
                    id=f"{base_workout.id}-w{week}",
                    name=f"{base_workout.name} - Week {week}",
                    focus=base_workout.focus,
                    total_duration=base_workout.total_duration,
                    total_calories=int(base_workout.total_calories * progression_factor),
                    rest_day=base_workout.rest_day,
                    exercises=progressed_exercises,
                    instructions=f"Week {week}: {base_workout.instructions} As you progress, focus on maintaining proper form while increasing intensity."
                )
                week_workouts.append(week_workout)
        
        progression_workouts.extend(week_workouts)
    
    # Create the workout plan
    plan_id = str(uuid.uuid4())
    plan_name = f"Custom {plan_request.goal.replace('_', ' ').title()} Plan"
    
    return WorkoutPlan(
        id=plan_id,
        user_id=user_id,
        name=plan_name,
        description=f"A personalized {plan_request.duration_weeks}-week {plan_request.goal.replace('_', ' ')} program tailored for {plan_request.fitness_level} level with progressive intensity",
        goal=plan_request.goal,
        difficulty=target_difficulty,
        duration_weeks=plan_request.duration_weeks,
        workouts_per_week=plan_request.frequency,
        focus_areas=plan_request.preferences.get("focusAreas", ["Upper Body", "Lower Body", "Core"]),
        workouts=progression_workouts,
        created_at=datetime.now()
    )


def get_demo_dashboard_data(user_id: str) -> DashboardData:
    """Get demo dashboard data"""
    today = datetime.now().date()
    
    # Generate weekly activity summary for the past 7 days
    weekly_summary = []
    for i in range(6, -1, -1):
        date_str = (today - timedelta(days=i)).strftime("%Y-%m-%d")
        
        # Alternate between workout days and rest days
        if i % 2 == 0:
            weekly_summary.append(WeeklyActivitySummary(
                date=date_str,
                calories_burned=random.randint(250, 400),
                minutes_active=random.randint(30, 70),
                workouts_completed=1
            ))
        else:
            weekly_summary.append(WeeklyActivitySummary(
                date=date_str,
                calories_burned=0,
                minutes_active=0,
                workouts_completed=0
            ))
    
    # Get demo workout plan and upcoming workout
    workout_plan = get_demo_workout_plan(user_id)
    upcoming_workout = workout_plan.workouts[0]  # Use first workout as upcoming
    
    return DashboardData(
        active_plan=workout_plan,
        upcoming_workout=upcoming_workout,
        workout_streak=8,
        total_workouts_completed=24,
        total_calories_burned=8450,
        weekly_activity_summary=weekly_summary,
        fitness_stats=FitnessStats(
            workout_consistency=85
        )
    )
