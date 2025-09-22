from motor.motor_asyncio import AsyncIOMotorClient
from pymongo.errors import PyMongoError
from typing import Dict, List, Optional, Any
from datetime import datetime
import json

class HealthDataDB:
    def __init__(self, mongodb_url: str):
        """Initialize database connection"""
        self.client = AsyncIOMotorClient(mongodb_url)
        self.db = self.client.health_data
        self._setup_collections()

    def _setup_collections(self):
        """Setup database collections"""
        self.users = self.db.users
        self.health_data = self.db.health_data
        self.privacy_settings = self.db.privacy_settings
        self.reports = self.db.reports
        self.backups = self.db.backups

    async def store_health_data(self, user_id: str, data: Dict[str, Any], data_type: str) -> Dict:
        """Store encrypted health data"""
        try:
            document = {
                "user_id": user_id,
                "data": data,
                "data_type": data_type,
                "timestamp": datetime.utcnow(),
                "version": "1.0"
            }
            result = await self.health_data.insert_one(document)
            return {"status": "success", "id": str(result.inserted_id)}
        except PyMongoError as e:
            raise Exception(f"Database operation failed: {str(e)}")

    async def get_user_health_data(
        self,
        user_id: str,
        data_type: Optional[str] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None
    ) -> List[Dict]:
        """Retrieve user's health data with filters"""
        try:
            query = {"user_id": user_id}
            if data_type:
                query["data_type"] = data_type
            if start_date and end_date:
                query["timestamp"] = {
                    "$gte": start_date,
                    "$lte": end_date
                }
            cursor = self.health_data.find(query)
            return await cursor.to_list(length=None)
        except PyMongoError as e:
            raise Exception(f"Data retrieval failed: {str(e)}")

    async def delete_user_data(self, user_id: str, data_types: Optional[List[str]] = None) -> Dict:
        """Delete user data (GDPR compliance)"""
        try:
            query = {"user_id": user_id}
            if data_types:
                query["data_type"] = {"$in": data_types}
            result = await self.health_data.delete_many(query)
            return {
                "status": "success",
                "deleted_count": result.deleted_count,
                "timestamp": datetime.utcnow()
            }
        except PyMongoError as e:
            raise Exception(f"Data deletion failed: {str(e)}")

    async def store_backup(self, user_id: str, backup_data: Dict[str, Any]) -> Dict:
        """Store backup metadata"""
        try:
            document = {
                "user_id": user_id,
                "backup_data": backup_data,
                "timestamp": datetime.utcnow(),
                "status": "completed"
            }
            result = await self.backups.insert_one(document)
            return {"status": "success", "backup_id": str(result.inserted_id)}
        except PyMongoError as e:
            raise Exception(f"Backup storage failed: {str(e)}")

    async def update_privacy_settings(self, user_id: str, settings: Dict[str, Any]) -> Dict:
        """Update user's privacy settings"""
        try:
            result = await self.privacy_settings.update_one(
                {"user_id": user_id},
                {"$set": {
                    "settings": settings,
                    "updated_at": datetime.utcnow()
                }},
                upsert=True
            )
            return {"status": "success", "modified_count": result.modified_count}
        except PyMongoError as e:
            raise Exception(f"Privacy settings update failed: {str(e)}")

    async def store_report(self, user_id: str, report: Dict[str, Any]) -> Dict:
        """Store generated health report"""
        try:
            document = {
                "user_id": user_id,
                "report": report,
                "generated_at": datetime.utcnow(),
                "version": "1.0"
            }
            result = await self.reports.insert_one(document)
            return {"status": "success", "report_id": str(result.inserted_id)}
        except PyMongoError as e:
            raise Exception(f"Report storage failed: {str(e)}")
