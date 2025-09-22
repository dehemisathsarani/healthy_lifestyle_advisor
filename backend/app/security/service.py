from datetime import datetime
from typing import Dict, List, Optional, Any
from .models import SecurityProfile, HealthData, DataSharingPreferences, BackupPreferences, NotificationPreferences
from .encryption import EncryptionService
from .ai_agent import SecurityAIAgent
from motor.motor_asyncio import AsyncIOMotorClient
import json
import os
from fastapi import HTTPException

class SecurityService:
    def __init__(self, db: AsyncIOMotorClient):
        self.db = db
        self.encryption_service = EncryptionService()
        self.ai_agent = SecurityAIAgent()
        self.backup_path = os.environ.get('BACKUP_PATH', './backups')
        os.makedirs(self.backup_path, exist_ok=True)

    async def create_security_profile(self, user_id: str, profile_data: Dict[str, Any]) -> SecurityProfile:
        """Create a new security profile for a user"""
        try:
            profile = SecurityProfile(
                user_id=user_id,
                privacy_level=profile_data.get('privacy_level'),
                data_sharing=DataSharingPreferences(**profile_data.get('data_sharing', {})),
                backup_preferences=BackupPreferences(**profile_data.get('backup_preferences', {})),
                notification_preferences=NotificationPreferences(**profile_data.get('notification_preferences', {}))
            )
            
            await self.db.security_profiles.insert_one(profile.dict())
            return profile
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to create security profile: {str(e)}")

    async def get_security_profile(self, user_id: str) -> SecurityProfile:
        """Retrieve a user's security profile"""
        profile = await self.db.security_profiles.find_one({"user_id": user_id})
        if not profile:
            raise HTTPException(status_code=404, detail="Security profile not found")
        return SecurityProfile(**profile)

    async def update_security_profile(self, user_id: str, updates: Dict[str, Any]) -> SecurityProfile:
        """Update a user's security profile"""
        try:
            updates['updated_at'] = datetime.utcnow()
            result = await self.db.security_profiles.update_one(
                {"user_id": user_id},
                {"$set": updates}
            )
            if result.modified_count == 0:
                raise HTTPException(status_code=404, detail="Security profile not found")
            return await self.get_security_profile(user_id)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to update security profile: {str(e)}")

    async def store_health_data(self, user_id: str, data_type: str, content: Dict[str, Any]) -> str:
        """Store encrypted health data"""
        try:
            encrypted_content = self.encryption_service.encrypt_data(content)
            health_data = HealthData(
                user_id=user_id,
                data_type=data_type,
                content=encrypted_content,
                encrypted=True
            )
            result = await self.db.health_data.insert_one(health_data.dict())
            return str(result.inserted_id)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to store health data: {str(e)}")

    async def get_health_data(self, user_id: str, data_type: Optional[str] = None) -> List[Dict[str, Any]]:
        """Retrieve and decrypt health data"""
        try:
            query = {"user_id": user_id}
            if data_type:
                query["data_type"] = data_type
            
            cursor = self.db.health_data.find(query)
            health_data = []
            
            async for data in cursor:
                if data['encrypted']:
                    data['content'] = self.encryption_service.decrypt_data(data['content'])
                health_data.append(data)
            
            return health_data
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to retrieve health data: {str(e)}")

    async def create_data_backup(self, user_id: str) -> str:
        """Create an encrypted backup of user's health data"""
        try:
            # Get all user's health data
            health_data = await self.get_health_data(user_id)
            
            # Create backup file
            timestamp = datetime.utcnow().strftime('%Y%m%d_%H%M%S')
            backup_file = f"{self.backup_path}/{user_id}_{timestamp}.backup"
            
            # Encrypt and save the backup
            with open(backup_file, 'w') as f:
                json.dump(health_data, f)
            
            encrypted_backup = self.encryption_service.encrypt_file(backup_file)
            os.remove(backup_file)  # Remove unencrypted backup
            
            # Store backup metadata
            await self.db.backups.insert_one({
                "user_id": user_id,
                "backup_path": encrypted_backup,
                "created_at": datetime.utcnow(),
                "status": "completed"
            })
            
            return encrypted_backup
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to create backup: {str(e)}")

    async def delete_user_data(self, user_id: str, data_types: Optional[List[str]] = None) -> bool:
        """Delete user's health data (GDPR right to be forgotten)"""
        try:
            query = {"user_id": user_id}
            if data_types:
                query["data_type"] = {"$in": data_types}
            
            # Delete health data
            await self.db.health_data.delete_many(query)
            
            # If no specific data types provided, delete everything including profile
            if not data_types:
                await self.db.security_profiles.delete_one({"user_id": user_id})
                await self.db.backups.delete_many({"user_id": user_id})
            
            return True
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to delete user data: {str(e)}")

    async def generate_health_report(self, user_id: str, start_date: datetime, end_date: datetime) -> Dict[str, Any]:
        """Generate a comprehensive health report"""
        try:
            # Get health data for the specified period
            query = {
                "user_id": user_id,
                "created_at": {
                    "$gte": start_date,
                    "$lte": end_date
                }
            }
            
            cursor = self.db.health_data.find(query)
            health_data = []
            
            async for data in cursor:
                if data['encrypted']:
                    data['content'] = self.encryption_service.decrypt_data(data['content'])
                health_data.append(data)
            
            # Process and summarize data
            report = {
                "period": {
                    "start": start_date,
                    "end": end_date
                },
                "diet_summary": self._summarize_diet_data(health_data),
                "fitness_summary": self._summarize_fitness_data(health_data),
                "mental_health_summary": self._summarize_mental_health_data(health_data),
                "generated_at": datetime.utcnow()
            }
            
            return report
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to generate health report: {str(e)}")

    def _summarize_diet_data(self, health_data: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Summarize diet-related health data"""
        diet_data = [d for d in health_data if d['data_type'] == 'diet']
        if not diet_data:
            return {"message": "No diet data available"}

        total_calories = 0
        total_entries = len(diet_data)
        macros = {"protein": 0, "carbs": 0, "fat": 0}

        for entry in diet_data:
            content = entry['content']
            total_calories += content.get('calories', 0)
            macros['protein'] += content.get('macros', {}).get('protein', 0)
            macros['carbs'] += content.get('macros', {}).get('carbs', 0)
            macros['fat'] += content.get('macros', {}).get('fat', 0)

        return {
            "avg_daily_calories": total_calories / total_entries if total_entries > 0 else 0,
            "avg_macros": {
                k: v / total_entries if total_entries > 0 else 0
                for k, v in macros.items()
            }
        }

    def _summarize_fitness_data(self, health_data: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Summarize fitness-related health data"""
        fitness_data = [d for d in health_data if d['data_type'] == 'fitness']
        if not fitness_data:
            return {"message": "No fitness data available"}

        total_calories_burned = 0
        workouts = []

        for entry in fitness_data:
            content = entry['content']
            total_calories_burned += content.get('calories_burned', 0)
            if 'workout_type' in content:
                workouts.append(content['workout_type'])

        return {
            "total_calories_burned": total_calories_burned,
            "total_workouts": len(fitness_data),
            "workout_types": list(set(workouts))
        }

    def _summarize_mental_health_data(self, health_data: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Summarize mental health-related data"""
        mental_data = [d for d in health_data if d['data_type'] == 'mental_health']
        if not mental_data:
            return {"message": "No mental health data available"}

        mood_scores = []
        for entry in mental_data:
            content = entry['content']
            if 'mood_score' in content:
                mood_scores.append({
                    "score": content['mood_score'],
                    "date": entry['created_at']
                })

        return {
            "mood_tracking": {
                "average_mood": sum(m['score'] for m in mood_scores) / len(mood_scores) if mood_scores else 0,
                "mood_history": sorted(mood_scores, key=lambda x: x['date'])
            }
        }
