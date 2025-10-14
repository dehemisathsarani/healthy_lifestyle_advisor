"""
Notification Service
Sends notifications to users about meal logging and workout recommendations
"""

import logging
from typing import Dict, Any, List
from datetime import datetime
import asyncio

logger = logging.getLogger(__name__)


class NotificationService:
    """Handles sending notifications to users"""
    
    def __init__(self):
        """Initialize notification service"""
        self.notification_queue = []
        
    async def send_notification(
        self, 
        user_id: str, 
        title: str, 
        message: str, 
        notification_type: str = "info",
        data: Dict[str, Any] = None
    ) -> bool:
        """
        Send notification to user
        
        Args:
            user_id: User identifier
            title: Notification title
            message: Notification message
            notification_type: Type (info, success, warning, recommendation)
            data: Additional data to include
            
        Returns:
            True if successful
        """
        try:
            notification = {
                'user_id': user_id,
                'title': title,
                'message': message,
                'type': notification_type,
                'timestamp': datetime.now().isoformat(),
                'data': data or {},
                'read': False
            }
            
            logger.info(f"🔔 Sending notification to user {user_id}")
            logger.info(f"   Title: {title}")
            logger.info(f"   Message: {message}")
            
            # Store notification (in production, save to database)
            self.notification_queue.append(notification)
            
            # In production, you would:
            # 1. Save to database: await db.notifications.insert_one(notification)
            # 2. Send push notification: await push_service.send(user_id, notification)
            # 3. Send WebSocket event: await websocket_service.emit(user_id, notification)
            # 4. Send email (optional): await email_service.send(user_id, notification)
            
            logger.info(f"✅ Notification sent successfully")
            return True
            
        except Exception as e:
            logger.error(f"❌ Failed to send notification: {e}")
            return False
    
    async def send_workout_recommendation(
        self, 
        user_id: str, 
        meal_calories: int,
        remaining_burn: int,
        workout_plan: Dict[str, Any]
    ) -> bool:
        """
        Send workout recommendation after meal logging
        
        Args:
            user_id: User identifier
            meal_calories: Calories from meal
            remaining_burn: Remaining calories to burn
            workout_plan: Suggested workout plan
        """
        title = "🏃 Workout Recommendation"
        message = f"You consumed {meal_calories} kcal. " \
                  f"Suggested workout to burn {remaining_burn} kcal: " \
                  f"{workout_plan.get('name', 'Cardio Session')}"
        
        return await self.send_notification(
            user_id=user_id,
            title=title,
            message=message,
            notification_type="recommendation",
            data={
                'meal_calories': meal_calories,
                'remaining_burn': remaining_burn,
                'workout_plan': workout_plan
            }
        )
    
    async def send_calorie_balance_update(
        self, 
        user_id: str,
        workout_name: str,
        calories_burnt: int,
        new_allowance: int,
        nutrition_recommendation: str
    ) -> bool:
        """
        Send calorie balance update after workout
        
        Args:
            user_id: User identifier
            workout_name: Name of completed workout
            calories_burnt: Calories burned
            new_allowance: New calorie allowance
            nutrition_recommendation: Nutrition advice
        """
        title = "✅ Workout Completed!"
        message = f"Great job on {workout_name}! " \
                  f"You burned {calories_burnt} kcal. " \
                  f"You can now eat {new_allowance} more kcal today. " \
                  f"{nutrition_recommendation}"
        
        return await self.send_notification(
            user_id=user_id,
            title=title,
            message=message,
            notification_type="success",
            data={
                'workout_name': workout_name,
                'calories_burnt': calories_burnt,
                'new_allowance': new_allowance,
                'nutrition_recommendation': nutrition_recommendation
            }
        )
    
    async def send_calorie_goal_achieved(
        self, 
        user_id: str,
        total_consumed: int,
        total_burnt: int
    ) -> bool:
        """
        Send notification when calorie goal is achieved
        """
        title = "🎉 Daily Goal Achieved!"
        message = f"Congratulations! You've reached your daily calorie goal. " \
                  f"Consumed: {total_consumed} kcal | Burned: {total_burnt} kcal"
        
        return await self.send_notification(
            user_id=user_id,
            title=title,
            message=message,
            notification_type="success",
            data={
                'total_consumed': total_consumed,
                'total_burnt': total_burnt,
                'goal_achieved': True
            }
        )
    
    async def get_user_notifications(
        self, 
        user_id: str, 
        unread_only: bool = False
    ) -> List[Dict[str, Any]]:
        """
        Get notifications for a user
        
        Args:
            user_id: User identifier
            unread_only: Return only unread notifications
            
        Returns:
            List of notifications
        """
        try:
            user_notifications = [
                n for n in self.notification_queue 
                if n['user_id'] == user_id
            ]
            
            if unread_only:
                user_notifications = [
                    n for n in user_notifications 
                    if not n['read']
                ]
            
            return user_notifications
            
        except Exception as e:
            logger.error(f"❌ Failed to get notifications: {e}")
            return []
    
    async def mark_as_read(self, user_id: str, notification_id: int) -> bool:
        """Mark notification as read"""
        try:
            if notification_id < len(self.notification_queue):
                notification = self.notification_queue[notification_id]
                if notification['user_id'] == user_id:
                    notification['read'] = True
                    return True
            return False
        except Exception as e:
            logger.error(f"❌ Failed to mark notification as read: {e}")
            return False


# Global notification service instance
notification_service = NotificationService()
