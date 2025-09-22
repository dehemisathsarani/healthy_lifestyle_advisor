from typing import Dict, List, Optional, Any
from datetime import datetime
from .ai_agent import SecurityAIAgent
from .encryption import EncryptionService

class AgentDataCollector:
    """Collects and processes data from various health agents securely"""
    
    def __init__(self, security_agent: SecurityAIAgent, encryption_service: EncryptionService):
        self.security_agent = security_agent
        self.encryption_service = encryption_service
    
    async def collect_diet_data(self, data: Dict[str, Any], privacy_settings: Dict[str, Any]) -> Dict[str, Any]:
        """
        Collect and process diet agent data
        """
        sanitized_data = {
            "calorie_intake": data.get("calories", 0),
            "macros": {
                "protein": data.get("macros", {}).get("protein", 0),
                "carbs": data.get("macros", {}).get("carbs", 0),
                "fats": data.get("macros", {}).get("fats", 0)
            },
            "timestamp": datetime.utcnow().isoformat()
        }
        
        # Analyze for privacy implications
        analysis = await self.security_agent.analyze_health_data(
            sanitized_data,
            privacy_settings
        )
        
        if analysis.risk_level == "HIGH":
            # Enhance encryption for high-risk data
            return self.encryption_service.encrypt_data_enhanced(sanitized_data)
        return self.encryption_service.encrypt_data(sanitized_data)

    async def collect_fitness_data(self, data: Dict[str, Any], privacy_settings: Dict[str, Any]) -> Dict[str, Any]:
        """
        Collect and process fitness agent data
        """
        sanitized_data = {
            "workout_type": data.get("workout_type", ""),
            "calories_burned": data.get("calories_burned", 0),
            "duration_minutes": data.get("duration", 0),
            "heart_rate_data": self._sanitize_heart_rate(data.get("heart_rate", [])),
            "timestamp": datetime.utcnow().isoformat()
        }
        
        # Analyze for privacy implications
        analysis = await self.security_agent.analyze_health_data(
            sanitized_data,
            privacy_settings
        )
        
        if analysis.risk_level == "HIGH":
            return self.encryption_service.encrypt_data_enhanced(sanitized_data)
        return self.encryption_service.encrypt_data(sanitized_data)

    async def collect_mental_health_data(self, data: Dict[str, Any], privacy_settings: Dict[str, Any]) -> Dict[str, Any]:
        """
        Collect and process mental health agent data
        Extra careful with privacy due to sensitivity
        """
        sanitized_data = {
            "mood_score": data.get("mood_score", 0),
            "stress_level": data.get("stress_level", 0),
            "notes": self._sanitize_notes(data.get("notes", "")),
            "timestamp": datetime.utcnow().isoformat()
        }
        
        # Always treat mental health data as high sensitivity
        return self.encryption_service.encrypt_data_enhanced(sanitized_data)

    def _sanitize_heart_rate(self, heart_rate_data: List[int]) -> List[int]:
        """
        Sanitize heart rate data to remove any anomalies
        """
        if not heart_rate_data:
            return []
            
        # Remove physiologically impossible values
        return [hr for hr in heart_rate_data if 30 <= hr <= 220]

    def _sanitize_notes(self, notes: str) -> str:
        """
        Sanitize mental health notes to remove any PII
        """
        import re
        
        # Remove potential email addresses
        notes = re.sub(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}', '[EMAIL]', notes)
        
        # Remove potential phone numbers
        notes = re.sub(r'\b\d{3}[-.]?\d{3}[-.]?\d{4}\b', '[PHONE]', notes)
        
        # Remove potential names (basic implementation - might need enhancement)
        notes = re.sub(r'\b[A-Z][a-z]+\s+[A-Z][a-z]+\b', '[NAME]', notes)
        
        return notes

    async def verify_data_integrity(self, data: Dict[str, Any], data_type: str) -> bool:
        """
        Verify the integrity of collected data
        """
        required_fields = {
            "diet": ["calories", "macros"],
            "fitness": ["workout_type", "calories_burned", "duration"],
            "mental_health": ["mood_score", "stress_level"]
        }
        
        # Check for required fields
        if data_type in required_fields:
            return all(field in data for field in required_fields[data_type])
        return False

    async def apply_privacy_filters(
        self,
        data: Dict[str, Any],
        privacy_settings: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Apply privacy filters based on user preferences
        """
        filtered_data = data.copy()
        
        # Apply sharing restrictions
        if not privacy_settings.get("share_detailed_data", False):
            # Remove detailed/sensitive information
            filtered_data.pop("notes", None)
            filtered_data.pop("heart_rate_data", None)
            
            # Aggregate sensitive metrics
            if "macros" in filtered_data:
                filtered_data["macros"] = sum(filtered_data["macros"].values())
        
        # Apply time-based restrictions
        if privacy_settings.get("data_retention_days"):
            retention_days = privacy_settings["data_retention_days"]
            cutoff_date = datetime.utcnow() - timedelta(days=retention_days)
            
            if datetime.fromisoformat(filtered_data["timestamp"]) < cutoff_date:
                return None
        
        return filtered_data
