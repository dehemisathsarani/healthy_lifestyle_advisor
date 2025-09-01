from typing import Dict, List, Optional, Any
from datetime import datetime, timedelta
from motor.motor_asyncio import AsyncIOMotorClient
from .ai_agent import SecurityAIAgent
from .agent_collector import AgentDataCollector
from .encryption import EncryptionService
from .models import SecurityProfile, HealthData
import os

class SecurityIntegrationService:
    """Service to integrate data collection, security, and AI analysis"""
    
    def __init__(self, db: AsyncIOMotorClient):
        self.db = db
        openai_api_key = os.getenv("OPENAI_API_KEY")
        if not openai_api_key:
            raise ValueError("OpenAI API key not found in environment variables")
            
        self.security_agent = SecurityAIAgent(openai_api_key=openai_api_key)
        self.encryption_service = EncryptionService()
        self.data_collector = AgentDataCollector(
            security_agent=self.security_agent,
            encryption_service=self.encryption_service
        )
        
    async def process_agent_data(
        self,
        user_id: str,
        data: Dict[str, Any],
        agent_type: str
    ) -> Dict[str, Any]:
        """Process incoming data from various health agents"""
        try:
            # Get user's privacy settings
            profile = await self._get_security_profile(user_id)
            privacy_settings = profile.privacy_preferences
            
            # Verify data integrity
            if not await self.data_collector.verify_data_integrity(data, agent_type):
                raise ValueError(f"Invalid data format for agent type: {agent_type}")
            
            # Process data based on agent type
            if agent_type == "diet":
                processed_data = await self.data_collector.collect_diet_data(
                    data,
                    privacy_settings
                )
            elif agent_type == "fitness":
                processed_data = await self.data_collector.collect_fitness_data(
                    data,
                    privacy_settings
                )
            elif agent_type == "mental_health":
                processed_data = await self.data_collector.collect_mental_health_data(
                    data,
                    privacy_settings
                )
            else:
                raise ValueError(f"Unsupported agent type: {agent_type}")
            
            # Apply privacy filters
            filtered_data = await self.data_collector.apply_privacy_filters(
                processed_data,
                privacy_settings
            )
            
            if filtered_data:
                # Store processed and filtered data
                await self._store_health_data(user_id, filtered_data, agent_type)
                
                # Generate security analysis
                security_analysis = await self.security_agent.analyze_security_profile(
                    profile.dict(),
                    {"data_type": agent_type, "timestamp": datetime.utcnow().isoformat()}
                )
                
                return {
                    "status": "success",
                    "security_analysis": security_analysis.dict(),
                    "timestamp": datetime.utcnow()
                }
            
            return {
                "status": "filtered",
                "message": "Data filtered out based on privacy settings",
                "timestamp": datetime.utcnow()
            }
            
        except Exception as e:
            await self._log_error(user_id, str(e), agent_type)
            raise
            
    async def generate_health_report(
        self,
        user_id: str,
        report_type: str = "weekly"
    ) -> Dict[str, Any]:
        """Generate comprehensive health report"""
        try:
            # Define time range
            end_date = datetime.utcnow()
            if report_type == "weekly":
                start_date = end_date - timedelta(days=7)
            elif report_type == "monthly":
                start_date = end_date - timedelta(days=30)
            else:
                raise ValueError(f"Unsupported report type: {report_type}")
            
            # Fetch data from all agents
            diet_data = await self._get_agent_data(user_id, "diet", start_date, end_date)
            fitness_data = await self._get_agent_data(user_id, "fitness", start_date, end_date)
            mental_health_data = await self._get_agent_data(
                user_id,
                "mental_health",
                start_date,
                end_date
            )
            
            # Get user's security profile
            profile = await self._get_security_profile(user_id)
            
            # Generate AI analysis
            report = await self.security_agent.generate_privacy_report(
                user_data={"user_id": user_id},
                security_profile=profile.dict(),
                health_data={
                    "diet": diet_data,
                    "fitness": fitness_data,
                    "mental_health": mental_health_data
                }
            )
            
            return {
                "report_type": report_type,
                "period": {
                    "start": start_date,
                    "end": end_date
                },
                "report": report,
                "generated_at": datetime.utcnow()
            }
            
        except Exception as e:
            await self._log_error(user_id, str(e), "report_generation")
            raise
            
    async def process_gdpr_request(
        self,
        user_id: str,
        request_type: str = "export"
    ) -> Dict[str, Any]:
        """Handle GDPR-related requests (export/delete)"""
        try:
            if request_type == "export":
                # Fetch all user data
                all_data = await self._get_all_user_data(user_id)
                
                # Create encrypted export
                export_file = self.encryption_service.encrypt_data({
                    "user_id": user_id,
                    "data": all_data,
                    "export_date": datetime.utcnow().isoformat()
                })
                
                return {
                    "status": "success",
                    "export_data": export_file,
                    "timestamp": datetime.utcnow()
                }
                
            elif request_type == "delete":
                # Get AI verification before deletion
                profile = await self._get_security_profile(user_id)
                verification = await self.security_agent.analyze_security_profile(
                    profile.dict(),
                    {"operation": "gdpr_deletion"}
                )
                
                if verification.risk_level == "HIGH":
                    raise ValueError("High-risk deletion request requires manual review")
                
                # Perform deletion
                await self._delete_all_user_data(user_id)
                
                return {
                    "status": "success",
                    "message": "All user data has been deleted",
                    "timestamp": datetime.utcnow()
                }
                
            else:
                raise ValueError(f"Unsupported GDPR request type: {request_type}")
                
        except Exception as e:
            await self._log_error(user_id, str(e), f"gdpr_{request_type}")
            raise
            
    async def _store_health_data(
        self,
        user_id: str,
        data: Dict[str, Any],
        agent_type: str
    ) -> None:
        """Store processed health data"""
        await self.db.health_data.insert_one({
            "user_id": user_id,
            "agent_type": agent_type,
            "content": data,
            "created_at": datetime.utcnow()
        })
        
    async def _get_security_profile(self, user_id: str) -> SecurityProfile:
        """Retrieve user's security profile"""
        profile = await self.db.security_profiles.find_one({"user_id": user_id})
        if not profile:
            raise ValueError(f"Security profile not found for user {user_id}")
        return SecurityProfile(**profile)
        
    async def _get_agent_data(
        self,
        user_id: str,
        agent_type: str,
        start_date: datetime,
        end_date: datetime
    ) -> List[Dict[str, Any]]:
        """Retrieve data for specific agent type"""
        cursor = self.db.health_data.find({
            "user_id": user_id,
            "agent_type": agent_type,
            "created_at": {
                "$gte": start_date,
                "$lte": end_date
            }
        })
        
        return [doc["content"] async for doc in cursor]
        
    async def _get_all_user_data(self, user_id: str) -> Dict[str, List[Dict[str, Any]]]:
        """Retrieve all user data for GDPR purposes"""
        data = {
            "diet": [],
            "fitness": [],
            "mental_health": []
        }
        
        async for doc in self.db.health_data.find({"user_id": user_id}):
            data[doc["agent_type"]].append(doc["content"])
            
        return data
        
    async def _delete_all_user_data(self, user_id: str) -> None:
        """Delete all user data (GDPR compliance)"""
        await self.db.health_data.delete_many({"user_id": user_id})
        await self.db.security_profiles.delete_one({"user_id": user_id})
        
    async def _log_error(
        self,
        user_id: str,
        error: str,
        operation: str
    ) -> None:
        """Log errors for auditing"""
        await self.db.error_logs.insert_one({
            "user_id": user_id,
            "error": error,
            "operation": operation,
            "timestamp": datetime.utcnow()
        })
