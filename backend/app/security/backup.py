from datetime import datetime
import os
import json
import aiofiles
import asyncio
from typing import Dict, List, Any
import boto3
from botocore.exceptions import ClientError

class BackupManager:
    def __init__(self, local_backup_path: str, aws_access_key: str = None, aws_secret_key: str = None):
        """Initialize backup manager"""
        self.local_backup_path = local_backup_path
        self._ensure_backup_directory()
        
        # Initialize AWS S3 client if credentials are provided
        if aws_access_key and aws_secret_key:
            self.s3_client = boto3.client(
                's3',
                aws_access_key_id=aws_access_key,
                aws_secret_access_key=aws_secret_key
            )
        else:
            self.s3_client = None

    def _ensure_backup_directory(self):
        """Create backup directory if it doesn't exist"""
        if not os.path.exists(self.local_backup_path):
            os.makedirs(self.local_backup_path)

    async def create_local_backup(self, user_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a local backup of user data"""
        try:
            timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
            filename = f"{user_id}_{timestamp}.json"
            filepath = os.path.join(self.local_backup_path, filename)

            async with aiofiles.open(filepath, mode='w') as f:
                await f.write(json.dumps(data, indent=2))

            return {
                "status": "success",
                "backup_type": "local",
                "filepath": filepath,
                "timestamp": timestamp
            }
        except Exception as e:
            raise Exception(f"Local backup failed: {str(e)}")

    async def create_cloud_backup(
        self,
        user_id: str,
        data: Dict[str, Any],
        bucket_name: str
    ) -> Dict[str, Any]:
        """Create a backup in AWS S3"""
        if not self.s3_client:
            raise Exception("AWS credentials not configured")

        try:
            timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
            key = f"backups/{user_id}/{timestamp}.json"
            
            # Convert data to JSON string
            json_data = json.dumps(data)
            
            # Upload to S3
            self.s3_client.put_object(
                Bucket=bucket_name,
                Key=key,
                Body=json_data
            )

            return {
                "status": "success",
                "backup_type": "cloud",
                "bucket": bucket_name,
                "key": key,
                "timestamp": timestamp
            }
        except ClientError as e:
            raise Exception(f"Cloud backup failed: {str(e)}")

    async def restore_local_backup(self, backup_path: str) -> Dict[str, Any]:
        """Restore data from a local backup"""
        try:
            async with aiofiles.open(backup_path, mode='r') as f:
                content = await f.read()
                return {
                    "status": "success",
                    "data": json.loads(content),
                    "restored_from": backup_path,
                    "timestamp": datetime.utcnow().isoformat()
                }
        except Exception as e:
            raise Exception(f"Local backup restoration failed: {str(e)}")

    async def restore_cloud_backup(
        self,
        bucket_name: str,
        key: str
    ) -> Dict[str, Any]:
        """Restore data from a cloud backup"""
        if not self.s3_client:
            raise Exception("AWS credentials not configured")

        try:
            response = self.s3_client.get_object(
                Bucket=bucket_name,
                Key=key
            )
            content = response['Body'].read().decode('utf-8')
            return {
                "status": "success",
                "data": json.loads(content),
                "restored_from": f"s3://{bucket_name}/{key}",
                "timestamp": datetime.utcnow().isoformat()
            }
        except ClientError as e:
            raise Exception(f"Cloud backup restoration failed: {str(e)}")

    async def list_backups(self, user_id: str) -> Dict[str, List[str]]:
        """List all available backups for a user"""
        backups = {
            "local": [],
            "cloud": []
        }

        # List local backups
        local_pattern = f"{user_id}_*.json"
        for filename in os.listdir(self.local_backup_path):
            if filename.startswith(user_id):
                backups["local"].append(os.path.join(self.local_backup_path, filename))

        # List cloud backups if configured
        if self.s3_client:
            try:
                response = self.s3_client.list_objects_v2(
                    Bucket="your-bucket-name",
                    Prefix=f"backups/{user_id}/"
                )
                if 'Contents' in response:
                    backups["cloud"] = [obj['Key'] for obj in response['Contents']]
            except ClientError:
                pass

        return backups
