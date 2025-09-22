from typing import Dict, Optional, List
from datetime import datetime
from .encryption_service import EncryptionService
from .auth_service import AuthService
from .data_models import HealthData, PrivacyPreferences, EncryptedData, AccessPermission
from fastapi import HTTPException, status

class DataSecurityAgent:
    def __init__(self):
        """Initialize Data & Security Agent"""
        self.encryption_service = EncryptionService()
        self.auth_service = AuthService()
        self.data_cache = {}  # In-memory cache, replace with proper database in production

    async def process_health_data(
        self,
        user_id: str,
        data: HealthData,
        privacy_prefs: PrivacyPreferences
    ) -> Dict:
        """Process and secure health data from all agents"""
        try:
            # Validate and sanitize data
            validated_data = self._sanitize_health_data(data)
            
            # Encrypt based on privacy preferences
            encrypted_data = self.encryption_service.encrypt_health_data(
                validated_data,
                use_rsa=privacy_prefs.keep_private
            )
            
            # Store encrypted data
            self.data_cache[user_id] = {
                "data": encrypted_data,
                "privacy": privacy_prefs.dict(),
                "timestamp": datetime.utcnow().isoformat()
            }
            
            return {
                "status": "success",
                "message": "Health data processed and secured",
                "timestamp": datetime.utcnow().isoformat()
            }
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to process health data: {str(e)}"
            )

    def _sanitize_health_data(self, data: HealthData) -> Dict:
        """Sanitize and validate health data"""
        # Remove any potentially harmful or unnecessary data
        sanitized = {
            "diet": {
                "calories": data.diet_data.get("calories"),
                "macros": data.diet_data.get("macros", {}),
                "timestamp": datetime.utcnow().isoformat()
            },
            "fitness": {
                "workouts": data.fitness_data.get("workouts", []),
                "calories_burned": data.fitness_data.get("calories_burned"),
                "timestamp": datetime.utcnow().isoformat()
            },
            "mental_health": {
                "mood": data.mental_health_data.get("mood"),
                "stress_level": data.mental_health_data.get("stress_level"),
                "timestamp": datetime.utcnow().isoformat()
            }
        }
        return sanitized

    async def get_health_data(
        self,
        user_id: str,
        requester_id: str,
        requester_role: str
    ) -> Optional[Dict]:
        """Retrieve health data based on privacy preferences and permissions"""
        try:
            # Get stored data
            stored_data = self.data_cache.get(user_id)
            if not stored_data:
                return None

            # Check permissions
            if not self._check_access_permission(user_id, requester_id, requester_role):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Access denied based on privacy preferences"
                )

            # Decrypt data
            decrypted_data = self.encryption_service.decrypt_health_data(stored_data["data"])
            
            # Filter based on role
            return self._filter_data_by_role(decrypted_data, requester_role)
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to retrieve health data: {str(e)}"
            )

    def _check_access_permission(
        self,
        user_id: str,
        requester_id: str,
        requester_role: str
    ) -> bool:
        """Check if requester has permission to access data"""
        if user_id == requester_id:
            return True  # User accessing their own data
            
        stored_data = self.data_cache.get(user_id, {})
        privacy_prefs = stored_data.get("privacy", {})
        
        if requester_role == "doctor" and privacy_prefs.get("share_with_doctor"):
            return True
        if requester_role == "coach" and privacy_prefs.get("share_with_coach"):
            return True
            
        return False

    def _filter_data_by_role(self, data: Dict, role: str) -> Dict:
        """Filter health data based on requester's role"""
        if role == "doctor":
            return {
                "diet": data["diet"],
                "fitness": data["fitness"],
                "mental_health": data["mental_health"]
            }
        elif role == "coach":
            return {
                "diet": {
                    "calories": data["diet"]["calories"],
                    "macros": data["diet"]["macros"]
                },
                "fitness": data["fitness"]
            }
        else:
            return {
                "summary": {
                    "calories": data["diet"]["calories"],
                    "workouts": len(data["fitness"]["workouts"]),
                    "mood": data["mental_health"]["mood"]
                }
            }

    async def update_privacy_preferences(
        self,
        user_id: str,
        preferences: PrivacyPreferences
    ) -> Dict:
        """Update user's privacy preferences"""
        try:
            if user_id not in self.data_cache:
                self.data_cache[user_id] = {"privacy": preferences.dict()}
            else:
                self.data_cache[user_id]["privacy"] = preferences.dict()

            return {
                "status": "success",
                "message": "Privacy preferences updated",
                "timestamp": datetime.utcnow().isoformat()
            }
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to update privacy preferences: {str(e)}"
            )

    async def delete_user_data(self, user_id: str) -> Dict:
        """Delete all user data (GDPR right to be forgotten)"""
        try:
            if user_id in self.data_cache:
                del self.data_cache[user_id]
            
            return {
                "status": "success",
                "message": "All user data deleted",
                "timestamp": datetime.utcnow().isoformat()
            }
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to delete user data: {str(e)}"
            )
