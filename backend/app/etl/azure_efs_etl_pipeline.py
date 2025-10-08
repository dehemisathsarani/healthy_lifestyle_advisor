"""
Azure EFS ETL Pipeline for Diet Agent Data
=========================================

This module provides comprehensive ETL (Extract, Transform, Load) capabilities
for diet agent information storage and retrieval using Azure EFS (Elastic File System).

Features:
- Extract data from MongoDB and local sources
- Transform nutrition data into standardized formats
- Load data to Azure EFS with proper structure
- Retrieve and process data from Azure EFS
- Handle food analysis, nutrition logs, user profiles, and meal data
- Support for batch and real-time processing
"""

import os
import json
import asyncio
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Union
from pathlib import Path
import pandas as pd
import pickle
import gzip
import hashlib
from dataclasses import dataclass, asdict
from azure.storage.fileshare import ShareFileClient, ShareDirectoryClient, ShareServiceClient
from azure.core.exceptions import ResourceNotFoundError, ResourceExistsError
import motor.motor_asyncio
from bson import ObjectId
import numpy as np

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class ETLConfig:
    """Configuration for Azure EFS ETL Pipeline"""
    azure_connection_string: str
    azure_share_name: str
    azure_base_directory: str = "diet_agent_data"
    mongodb_uri: str = ""
    mongodb_database: str = "HealthAgent"
    batch_size: int = 1000
    compression_enabled: bool = True
    retention_days: int = 365
    backup_enabled: bool = True

@dataclass
class DataPartition:
    """Data partition structure for efficient storage"""
    date: str
    data_type: str
    user_count: int
    record_count: int
    file_size_mb: float
    compression_ratio: float

class AzureEFSClient:
    """Azure EFS client for file operations"""
    
    def __init__(self, config: ETLConfig):
        self.config = config
        self.service_client = ShareServiceClient.from_connection_string(
            config.azure_connection_string
        )
        self.share_client = self.service_client.get_share_client(config.azure_share_name)
        self._ensure_share_exists()
    
    def _ensure_share_exists(self):
        """Ensure Azure file share exists"""
        try:
            self.share_client.create_share()
            logger.info(f"Created Azure file share: {self.config.azure_share_name}")
        except ResourceExistsError:
            logger.info(f"Azure file share already exists: {self.config.azure_share_name}")
    
    def _ensure_directory_exists(self, directory_path: str):
        """Ensure directory exists in Azure EFS"""
        parts = directory_path.split('/')
        current_path = ""
        
        for part in parts:
            if part:
                current_path = f"{current_path}/{part}" if current_path else part
                try:
                    dir_client = self.share_client.get_directory_client(current_path)
                    dir_client.create_directory()
                except ResourceExistsError:
                    pass
    
    async def upload_file(self, local_path: str, remote_path: str, metadata: Dict = None) -> bool:
        """Upload file to Azure EFS"""
        try:
            # Ensure directory exists
            remote_dir = "/".join(remote_path.split('/')[:-1])
            if remote_dir:
                self._ensure_directory_exists(remote_dir)
            
            # Upload file
            file_client = self.share_client.get_file_client(remote_path)
            
            with open(local_path, 'rb') as file_data:
                file_client.upload_file(file_data, metadata=metadata or {})
            
            logger.info(f"Uploaded file: {local_path} -> {remote_path}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to upload file {local_path}: {e}")
            return False
    
    async def download_file(self, remote_path: str, local_path: str) -> bool:
        """Download file from Azure EFS"""
        try:
            file_client = self.share_client.get_file_client(remote_path)
            
            # Ensure local directory exists
            os.makedirs(os.path.dirname(local_path), exist_ok=True)
            
            with open(local_path, 'wb') as file_data:
                download_stream = file_client.download_file()
                file_data.write(download_stream.readall())
            
            logger.info(f"Downloaded file: {remote_path} -> {local_path}")
            return True
            
        except ResourceNotFoundError:
            logger.warning(f"File not found in Azure EFS: {remote_path}")
            return False
        except Exception as e:
            logger.error(f"Failed to download file {remote_path}: {e}")
            return False
    
    async def list_files(self, directory_path: str = "") -> List[Dict]:
        """List files in Azure EFS directory"""
        try:
            if directory_path:
                dir_client = self.share_client.get_directory_client(directory_path)
                items = dir_client.list_directories_and_files()
            else:
                items = self.share_client.list_directories_and_files()
            
            files = []
            for item in items:
                if hasattr(item, 'size'):  # It's a file
                    files.append({
                        'name': item.name,
                        'path': f"{directory_path}/{item.name}" if directory_path else item.name,
                        'size': item.size,
                        'last_modified': item.last_modified,
                        'is_directory': False
                    })
                else:  # It's a directory
                    files.append({
                        'name': item.name,
                        'path': f"{directory_path}/{item.name}" if directory_path else item.name,
                        'is_directory': True
                    })
            
            return files
            
        except Exception as e:
            logger.error(f"Failed to list files in {directory_path}: {e}")
            return []

class DietDataExtractor:
    """Extract diet agent data from various sources"""
    
    def __init__(self, mongodb_uri: str, database_name: str):
        self.mongodb_uri = mongodb_uri
        self.database_name = database_name
        self.client = None
        self.db = None
    
    async def connect(self):
        """Connect to MongoDB"""
        self.client = motor.motor_asyncio.AsyncIOMotorClient(self.mongodb_uri)
        self.db = self.client[self.database_name]
    
    async def disconnect(self):
        """Disconnect from MongoDB"""
        if self.client:
            self.client.close()
    
    async def extract_nutrition_logs(self, 
                                   start_date: datetime = None, 
                                   end_date: datetime = None,
                                   user_ids: List[str] = None) -> List[Dict]:
        """Extract nutrition logs from MongoDB"""
        try:
            query = {}
            
            if start_date or end_date:
                date_filter = {}
                if start_date:
                    date_filter["$gte"] = start_date
                if end_date:
                    date_filter["$lte"] = end_date
                query["created_at"] = date_filter
            
            if user_ids:
                query["user_id"] = {"$in": [ObjectId(uid) for uid in user_ids]}
            
            cursor = self.db.nutrition_entries.find(query)
            logs = []
            
            async for log in cursor:
                # Convert ObjectId to string for JSON serialization
                log["_id"] = str(log["_id"])
                if "user_id" in log:
                    log["user_id"] = str(log["user_id"])
                logs.append(log)
            
            logger.info(f"Extracted {len(logs)} nutrition logs")
            return logs
            
        except Exception as e:
            logger.error(f"Failed to extract nutrition logs: {e}")
            return []
    
    async def extract_food_analyses(self, 
                                   start_date: datetime = None, 
                                   end_date: datetime = None) -> List[Dict]:
        """Extract food analysis results"""
        try:
            query = {}
            
            if start_date or end_date:
                date_filter = {}
                if start_date:
                    date_filter["$gte"] = start_date
                if end_date:
                    date_filter["$lte"] = end_date
                query["created_at"] = date_filter
            
            cursor = self.db.food_analyses.find(query)
            analyses = []
            
            async for analysis in cursor:
                analysis["_id"] = str(analysis["_id"])
                if "user_id" in analysis:
                    analysis["user_id"] = str(analysis["user_id"])
                analyses.append(analysis)
            
            logger.info(f"Extracted {len(analyses)} food analyses")
            return analyses
            
        except Exception as e:
            logger.error(f"Failed to extract food analyses: {e}")
            return []
    
    async def extract_user_profiles(self, user_ids: List[str] = None) -> List[Dict]:
        """Extract user profiles"""
        try:
            query = {}
            if user_ids:
                query["_id"] = {"$in": [ObjectId(uid) for uid in user_ids]}
            
            cursor = self.db.user_profiles.find(query)
            profiles = []
            
            async for profile in cursor:
                profile["_id"] = str(profile["_id"])
                profiles.append(profile)
            
            logger.info(f"Extracted {len(profiles)} user profiles")
            return profiles
            
        except Exception as e:
            logger.error(f"Failed to extract user profiles: {e}")
            return []
    
    async def extract_meal_entries(self, 
                                  start_date: datetime = None, 
                                  end_date: datetime = None) -> List[Dict]:
        """Extract meal entries from enhanced image processor"""
        try:
            query = {}
            
            if start_date or end_date:
                date_filter = {}
                if start_date:
                    date_filter["$gte"] = start_date
                if end_date:
                    date_filter["$lte"] = end_date
                query["created_at"] = date_filter
            
            cursor = self.db.meal_entries.find(query)
            meals = []
            
            async for meal in cursor:
                meal["_id"] = str(meal["_id"])
                if "user_id" in meal:
                    meal["user_id"] = str(meal["user_id"])
                meals.append(meal)
            
            logger.info(f"Extracted {len(meals)} meal entries")
            return meals
            
        except Exception as e:
            logger.error(f"Failed to extract meal entries: {e}")
            return []

class DietDataTransformer:
    """Transform diet agent data for standardized storage"""
    
    def __init__(self):
        self.transformation_stats = {
            'records_processed': 0,
            'records_transformed': 0,
            'errors': 0
        }
    
    def transform_nutrition_logs(self, logs: List[Dict]) -> Dict[str, Any]:
        """Transform nutrition logs to standardized format"""
        try:
            transformed_data = {
                'data_type': 'nutrition_logs',
                'transformation_timestamp': datetime.now().isoformat(),
                'total_records': len(logs),
                'records': []
            }
            
            for log in logs:
                try:
                    transformed_record = {
                        'log_id': log.get('_id'),
                        'user_id': log.get('user_id'),
                        'date': log.get('date', log.get('created_at', datetime.now()).strftime('%Y-%m-%d')),
                        'meal_type': log.get('meal_type', 'unknown'),
                        'total_nutrition': self._standardize_nutrition_data(log.get('total_nutrition', {})),
                        'food_items': self._transform_food_items(log.get('meals', [])),
                        'analysis_method': log.get('analysis_method', 'manual'),
                        'confidence_score': log.get('confidence_score', 0.0),
                        'ai_insights': log.get('ai_insights', []),
                        'created_at': log.get('created_at', datetime.now()).isoformat(),
                        'metadata': {
                            'source': 'nutrition_entries',
                            'version': '1.0',
                            'transformed_at': datetime.now().isoformat()
                        }
                    }
                    
                    transformed_data['records'].append(transformed_record)
                    self.transformation_stats['records_transformed'] += 1
                    
                except Exception as e:
                    logger.warning(f"Failed to transform nutrition log {log.get('_id')}: {e}")
                    self.transformation_stats['errors'] += 1
                
                self.transformation_stats['records_processed'] += 1
            
            return transformed_data
            
        except Exception as e:
            logger.error(f"Failed to transform nutrition logs: {e}")
            return {'data_type': 'nutrition_logs', 'records': [], 'error': str(e)}
    
    def transform_food_analyses(self, analyses: List[Dict]) -> Dict[str, Any]:
        """Transform food analysis results"""
        try:
            transformed_data = {
                'data_type': 'food_analyses',
                'transformation_timestamp': datetime.now().isoformat(),
                'total_records': len(analyses),
                'records': []
            }
            
            for analysis in analyses:
                try:
                    transformed_record = {
                        'analysis_id': analysis.get('_id'),
                        'user_id': analysis.get('user_id'),
                        'image_hash': analysis.get('image_hash'),
                        'detected_foods': self._transform_detected_foods(analysis.get('detected_foods', [])),
                        'total_nutrition': self._standardize_nutrition_data(analysis.get('total_nutrition', {})),
                        'confidence_score': analysis.get('confidence_score', 0.0),
                        'analysis_method': analysis.get('analysis_method', 'unknown'),
                        'processing_time': analysis.get('processing_time_seconds', 0.0),
                        'meal_type': analysis.get('meal_type', 'unknown'),
                        'text_description': analysis.get('text_description'),
                        'image_url': analysis.get('image_url'),
                        'created_at': analysis.get('created_at', datetime.now()).isoformat(),
                        'metadata': {
                            'source': 'food_analyses',
                            'version': '1.0',
                            'transformed_at': datetime.now().isoformat()
                        }
                    }
                    
                    transformed_data['records'].append(transformed_record)
                    self.transformation_stats['records_transformed'] += 1
                    
                except Exception as e:
                    logger.warning(f"Failed to transform food analysis {analysis.get('_id')}: {e}")
                    self.transformation_stats['errors'] += 1
                
                self.transformation_stats['records_processed'] += 1
            
            return transformed_data
            
        except Exception as e:
            logger.error(f"Failed to transform food analyses: {e}")
            return {'data_type': 'food_analyses', 'records': [], 'error': str(e)}
    
    def transform_user_profiles(self, profiles: List[Dict]) -> Dict[str, Any]:
        """Transform user profiles"""
        try:
            transformed_data = {
                'data_type': 'user_profiles',
                'transformation_timestamp': datetime.now().isoformat(),
                'total_records': len(profiles),
                'records': []
            }
            
            for profile in profiles:
                try:
                    transformed_record = {
                        'user_id': profile.get('_id'),
                        'name': profile.get('name'),
                        'email': profile.get('email'),
                        'demographics': {
                            'age': profile.get('age'),
                            'gender': profile.get('gender'),
                            'height': profile.get('height'),
                            'weight': profile.get('weight')
                        },
                        'health_metrics': {
                            'bmi': profile.get('bmi'),
                            'bmr': profile.get('bmr'),
                            'tdee': profile.get('tdee'),
                            'daily_calorie_goal': profile.get('daily_calorie_goal')
                        },
                        'preferences': {
                            'activity_level': profile.get('activity_level'),
                            'fitness_goal': profile.get('fitness_goal'),
                            'dietary_restrictions': profile.get('dietary_restrictions', []),
                            'allergies': profile.get('allergies', [])
                        },
                        'created_at': profile.get('created_at', datetime.now()).isoformat(),
                        'updated_at': profile.get('updated_at', datetime.now()).isoformat(),
                        'metadata': {
                            'source': 'user_profiles',
                            'version': '1.0',
                            'transformed_at': datetime.now().isoformat()
                        }
                    }
                    
                    transformed_data['records'].append(transformed_record)
                    self.transformation_stats['records_transformed'] += 1
                    
                except Exception as e:
                    logger.warning(f"Failed to transform user profile {profile.get('_id')}: {e}")
                    self.transformation_stats['errors'] += 1
                
                self.transformation_stats['records_processed'] += 1
            
            return transformed_data
            
        except Exception as e:
            logger.error(f"Failed to transform user profiles: {e}")
            return {'data_type': 'user_profiles', 'records': [], 'error': str(e)}
    
    def _standardize_nutrition_data(self, nutrition: Dict) -> Dict[str, float]:
        """Standardize nutrition data format"""
        return {
            'calories': float(nutrition.get('calories', 0)),
            'protein': float(nutrition.get('protein', 0)),
            'carbohydrates': float(nutrition.get('carbs', nutrition.get('carbohydrates', 0))),
            'fat': float(nutrition.get('fat', 0)),
            'fiber': float(nutrition.get('fiber', 0)),
            'sugar': float(nutrition.get('sugar', 0)),
            'sodium': float(nutrition.get('sodium', 0)),
            'cholesterol': float(nutrition.get('cholesterol', 0))
        }
    
    def _transform_food_items(self, food_items: List[Dict]) -> List[Dict]:
        """Transform food items to standardized format"""
        transformed_items = []
        
        for item in food_items:
            try:
                transformed_item = {
                    'name': item.get('name', 'Unknown'),
                    'quantity': item.get('quantity', '1 serving'),
                    'nutrition': self._standardize_nutrition_data(item.get('nutrition', {})),
                    'confidence': float(item.get('confidence', 0.0)),
                    'food_category': item.get('food_category', 'general'),
                    'sri_lankan_food': bool(item.get('sri_lankan_food', False))
                }
                transformed_items.append(transformed_item)
            except Exception as e:
                logger.warning(f"Failed to transform food item: {e}")
        
        return transformed_items
    
    def _transform_detected_foods(self, detected_foods: List[Dict]) -> List[Dict]:
        """Transform detected foods from image analysis"""
        transformed_foods = []
        
        for food in detected_foods:
            try:
                transformed_food = {
                    'name': food.get('name', 'Unknown'),
                    'confidence': float(food.get('confidence', 0.0)),
                    'estimated_portion': food.get('estimated_portion', '1 serving'),
                    'calories': float(food.get('calories', 0)),
                    'protein': float(food.get('protein', 0)),
                    'carbs': float(food.get('carbs', 0)),
                    'fat': float(food.get('fat', 0)),
                    'fiber': float(food.get('fiber', 0)),
                    'detection_method': food.get('detection_method', 'unknown')
                }
                transformed_foods.append(transformed_food)
            except Exception as e:
                logger.warning(f"Failed to transform detected food: {e}")
        
        return transformed_foods

class DietDataLoader:
    """Load transformed data to Azure EFS"""
    
    def __init__(self, azure_client: AzureEFSClient, config: ETLConfig):
        self.azure_client = azure_client
        self.config = config
        self.temp_dir = Path("./temp_etl")
        self.temp_dir.mkdir(exist_ok=True)
    
    async def load_data(self, transformed_data: Dict[str, Any], 
                       partition_key: str = None) -> bool:
        """Load transformed data to Azure EFS"""
        try:
            data_type = transformed_data.get('data_type', 'unknown')
            timestamp = datetime.now()
            
            # Create partition key if not provided
            if not partition_key:
                partition_key = f"{timestamp.strftime('%Y-%m-%d')}"
            
            # Create file paths
            base_path = f"{self.config.azure_base_directory}/{data_type}/{partition_key}"
            
            # Generate unique filename
            file_hash = hashlib.md5(
                json.dumps(transformed_data, sort_keys=True).encode()
            ).hexdigest()[:8]
            
            filename = f"{data_type}_{timestamp.strftime('%Y%m%d_%H%M%S')}_{file_hash}"
            
            # Prepare data with metadata
            final_data = {
                **transformed_data,
                'partition': {
                    'date': partition_key,
                    'data_type': data_type,
                    'record_count': len(transformed_data.get('records', [])),
                    'loaded_at': timestamp.isoformat(),
                    'file_hash': file_hash
                }
            }
            
            # Save to temporary file
            if self.config.compression_enabled:
                temp_file = self.temp_dir / f"{filename}.json.gz"
                with gzip.open(temp_file, 'wt', encoding='utf-8') as f:
                    json.dump(final_data, f, indent=2, default=str)
                remote_path = f"{base_path}/{filename}.json.gz"
            else:
                temp_file = self.temp_dir / f"{filename}.json"
                with open(temp_file, 'w', encoding='utf-8') as f:
                    json.dump(final_data, f, indent=2, default=str)
                remote_path = f"{base_path}/{filename}.json"
            
            # Upload to Azure EFS
            metadata = {
                'data_type': data_type,
                'partition_date': partition_key,
                'record_count': str(len(transformed_data.get('records', []))),
                'compressed': str(self.config.compression_enabled),
                'created_at': timestamp.isoformat()
            }
            
            success = await self.azure_client.upload_file(
                str(temp_file), remote_path, metadata
            )
            
            # Cleanup temp file
            temp_file.unlink()
            
            if success:
                logger.info(f"Successfully loaded {len(transformed_data.get('records', []))} records to {remote_path}")
                
                # Create partition index
                await self._update_partition_index(partition_key, data_type, final_data)
                
                return True
            else:
                logger.error(f"Failed to load data to {remote_path}")
                return False
                
        except Exception as e:
            logger.error(f"Failed to load data: {e}")
            return False
    
    async def _update_partition_index(self, partition_key: str, data_type: str, data: Dict):
        """Update partition index for efficient querying"""
        try:
            index_path = f"{self.config.azure_base_directory}/indexes/partitions.json"
            
            # Download existing index
            temp_index_file = self.temp_dir / "partition_index.json"
            await self.azure_client.download_file(index_path, str(temp_index_file))
            
            # Load existing index or create new
            if temp_index_file.exists():
                with open(temp_index_file, 'r') as f:
                    index = json.load(f)
            else:
                index = {'partitions': [], 'last_updated': None}
            
            # Update index
            partition_info = {
                'partition_key': partition_key,
                'data_type': data_type,
                'record_count': len(data.get('records', [])),
                'file_size_mb': 0,  # Could calculate actual size
                'loaded_at': datetime.now().isoformat(),
                'compression_enabled': self.config.compression_enabled
            }
            
            # Remove existing entry for same partition/data_type
            index['partitions'] = [
                p for p in index['partitions'] 
                if not (p['partition_key'] == partition_key and p['data_type'] == data_type)
            ]
            
            index['partitions'].append(partition_info)
            index['last_updated'] = datetime.now().isoformat()
            
            # Save updated index
            with open(temp_index_file, 'w') as f:
                json.dump(index, f, indent=2)
            
            await self.azure_client.upload_file(str(temp_index_file), index_path)
            temp_index_file.unlink()
            
        except Exception as e:
            logger.warning(f"Failed to update partition index: {e}")

class DietDataRetriever:
    """Retrieve and process data from Azure EFS"""
    
    def __init__(self, azure_client: AzureEFSClient, config: ETLConfig):
        self.azure_client = azure_client
        self.config = config
        self.temp_dir = Path("./temp_etl")
        self.temp_dir.mkdir(exist_ok=True)
    
    async def retrieve_data(self, 
                           data_type: str,
                           start_date: str = None,
                           end_date: str = None,
                           user_ids: List[str] = None) -> List[Dict]:
        """Retrieve data from Azure EFS with filtering"""
        try:
            # Get available partitions
            partitions = await self._get_partitions(data_type, start_date, end_date)
            
            all_records = []
            
            for partition in partitions:
                partition_data = await self._load_partition_data(
                    data_type, partition['partition_key']
                )
                
                if partition_data and 'records' in partition_data:
                    records = partition_data['records']
                    
                    # Filter by user_ids if provided
                    if user_ids:
                        records = [
                            record for record in records 
                            if record.get('user_id') in user_ids
                        ]
                    
                    all_records.extend(records)
            
            logger.info(f"Retrieved {len(all_records)} records of type {data_type}")
            return all_records
            
        except Exception as e:
            logger.error(f"Failed to retrieve data: {e}")
            return []
    
    async def _get_partitions(self, 
                             data_type: str,
                             start_date: str = None,
                             end_date: str = None) -> List[Dict]:
        """Get available partitions for data type and date range"""
        try:
            index_path = f"{self.config.azure_base_directory}/indexes/partitions.json"
            temp_index_file = self.temp_dir / "partition_index.json"
            
            success = await self.azure_client.download_file(index_path, str(temp_index_file))
            
            if not success:
                logger.warning("Partition index not found, scanning directories")
                return await self._scan_partitions(data_type)
            
            with open(temp_index_file, 'r') as f:
                index = json.load(f)
            
            partitions = index.get('partitions', [])
            
            # Filter by data type
            partitions = [p for p in partitions if p['data_type'] == data_type]
            
            # Filter by date range
            if start_date or end_date:
                filtered_partitions = []
                for partition in partitions:
                    partition_date = partition['partition_key']
                    
                    if start_date and partition_date < start_date:
                        continue
                    if end_date and partition_date > end_date:
                        continue
                    
                    filtered_partitions.append(partition)
                
                partitions = filtered_partitions
            
            temp_index_file.unlink()
            return partitions
            
        except Exception as e:
            logger.error(f"Failed to get partitions: {e}")
            return []
    
    async def _scan_partitions(self, data_type: str) -> List[Dict]:
        """Scan Azure EFS directories for partitions (fallback method)"""
        try:
            base_path = f"{self.config.azure_base_directory}/{data_type}"
            directories = await self.azure_client.list_files(base_path)
            
            partitions = []
            for directory in directories:
                if directory['is_directory']:
                    partitions.append({
                        'partition_key': directory['name'],
                        'data_type': data_type
                    })
            
            return partitions
            
        except Exception as e:
            logger.error(f"Failed to scan partitions: {e}")
            return []
    
    async def _load_partition_data(self, data_type: str, partition_key: str) -> Dict:
        """Load data from a specific partition"""
        try:
            base_path = f"{self.config.azure_base_directory}/{data_type}/{partition_key}"
            files = await self.azure_client.list_files(base_path)
            
            if not files:
                logger.warning(f"No files found in partition {partition_key}")
                return {}
            
            # Get the most recent file (in case there are multiple)
            data_files = [f for f in files if not f['is_directory']]
            if not data_files:
                return {}
            
            # Sort by name (contains timestamp) and get latest
            latest_file = sorted(data_files, key=lambda x: x['name'])[-1]
            
            remote_path = latest_file['path']
            temp_file = self.temp_dir / f"temp_partition_{partition_key}.json"
            
            if remote_path.endswith('.gz'):
                temp_file = temp_file.with_suffix('.json.gz')
            
            success = await self.azure_client.download_file(remote_path, str(temp_file))
            
            if not success:
                return {}
            
            # Load data
            if temp_file.suffix == '.gz':
                with gzip.open(temp_file, 'rt', encoding='utf-8') as f:
                    data = json.load(f)
            else:
                with open(temp_file, 'r', encoding='utf-8') as f:
                    data = json.load(f)
            
            temp_file.unlink()
            return data
            
        except Exception as e:
            logger.error(f"Failed to load partition data {partition_key}: {e}")
            return {}
    
    async def get_user_nutrition_history(self, 
                                        user_id: str,
                                        days: int = 30) -> Dict[str, List]:
        """Get comprehensive nutrition history for a user"""
        try:
            end_date = datetime.now().strftime('%Y-%m-%d')
            start_date = (datetime.now() - timedelta(days=days)).strftime('%Y-%m-%d')
            
            # Retrieve all relevant data types
            nutrition_logs = await self.retrieve_data(
                'nutrition_logs', start_date, end_date, [user_id]
            )
            
            food_analyses = await self.retrieve_data(
                'food_analyses', start_date, end_date, [user_id]
            )
            
            meal_entries = await self.retrieve_data(
                'meal_entries', start_date, end_date, [user_id]
            )
            
            return {
                'user_id': user_id,
                'date_range': {'start': start_date, 'end': end_date},
                'nutrition_logs': nutrition_logs,
                'food_analyses': food_analyses,
                'meal_entries': meal_entries,
                'summary': {
                    'total_logs': len(nutrition_logs),
                    'total_analyses': len(food_analyses),
                    'total_meals': len(meal_entries),
                    'retrieved_at': datetime.now().isoformat()
                }
            }
            
        except Exception as e:
            logger.error(f"Failed to get user nutrition history: {e}")
            return {}

class DietAgentETLPipeline:
    """Main ETL Pipeline orchestrator"""
    
    def __init__(self, config: ETLConfig):
        self.config = config
        self.azure_client = AzureEFSClient(config)
        self.extractor = DietDataExtractor(config.mongodb_uri, config.mongodb_database)
        self.transformer = DietDataTransformer()
        self.loader = DietDataLoader(self.azure_client, config)
        self.retriever = DietDataRetriever(self.azure_client, config)
    
    async def run_full_etl(self, 
                          start_date: datetime = None,
                          end_date: datetime = None,
                          data_types: List[str] = None) -> Dict[str, Any]:
        """Run complete ETL pipeline"""
        try:
            if not data_types:
                data_types = ['nutrition_logs', 'food_analyses', 'user_profiles', 'meal_entries']
            
            await self.extractor.connect()
            
            results = {
                'pipeline_start': datetime.now().isoformat(),
                'data_types_processed': [],
                'total_records_processed': 0,
                'errors': []
            }
            
            for data_type in data_types:
                try:
                    logger.info(f"Processing data type: {data_type}")
                    
                    # Extract
                    if data_type == 'nutrition_logs':
                        raw_data = await self.extractor.extract_nutrition_logs(start_date, end_date)
                    elif data_type == 'food_analyses':
                        raw_data = await self.extractor.extract_food_analyses(start_date, end_date)
                    elif data_type == 'user_profiles':
                        raw_data = await self.extractor.extract_user_profiles()
                    elif data_type == 'meal_entries':
                        raw_data = await self.extractor.extract_meal_entries(start_date, end_date)
                    else:
                        logger.warning(f"Unknown data type: {data_type}")
                        continue
                    
                    if not raw_data:
                        logger.info(f"No data found for {data_type}")
                        continue
                    
                    # Transform
                    if data_type == 'nutrition_logs':
                        transformed_data = self.transformer.transform_nutrition_logs(raw_data)
                    elif data_type == 'food_analyses':
                        transformed_data = self.transformer.transform_food_analyses(raw_data)
                    elif data_type == 'user_profiles':
                        transformed_data = self.transformer.transform_user_profiles(raw_data)
                    else:
                        continue
                    
                    # Load
                    partition_key = end_date.strftime('%Y-%m-%d') if end_date else datetime.now().strftime('%Y-%m-%d')
                    success = await self.loader.load_data(transformed_data, partition_key)
                    
                    if success:
                        results['data_types_processed'].append({
                            'data_type': data_type,
                            'records_count': len(raw_data),
                            'status': 'success'
                        })
                        results['total_records_processed'] += len(raw_data)
                    else:
                        results['errors'].append(f"Failed to load {data_type}")
                        
                except Exception as e:
                    error_msg = f"Error processing {data_type}: {e}"
                    logger.error(error_msg)
                    results['errors'].append(error_msg)
            
            await self.extractor.disconnect()
            
            results['pipeline_end'] = datetime.now().isoformat()
            results['success'] = len(results['errors']) == 0
            
            return results
            
        except Exception as e:
            logger.error(f"ETL Pipeline failed: {e}")
            return {'success': False, 'error': str(e)}
    
    async def get_nutrition_insights(self, user_id: str, days: int = 30) -> Dict[str, Any]:
        """Get comprehensive nutrition insights for a user"""
        try:
            # Retrieve user data
            user_data = await self.retriever.get_user_nutrition_history(user_id, days)
            
            if not user_data:
                return {'error': 'No data found for user'}
            
            # Analyze data
            nutrition_logs = user_data.get('nutrition_logs', [])
            food_analyses = user_data.get('food_analyses', [])
            
            # Calculate insights
            insights = {
                'user_id': user_id,
                'analysis_period': f"{days} days",
                'total_entries': len(nutrition_logs) + len(food_analyses),
                'average_daily_calories': 0,
                'nutrition_trends': {},
                'food_preferences': {},
                'health_recommendations': [],
                'generated_at': datetime.now().isoformat()
            }
            
            # Calculate average daily nutrition
            if nutrition_logs:
                total_calories = sum(
                    log.get('total_nutrition', {}).get('calories', 0) 
                    for log in nutrition_logs
                )
                insights['average_daily_calories'] = total_calories / len(nutrition_logs)
                
                # Calculate macro trends
                total_protein = sum(
                    log.get('total_nutrition', {}).get('protein', 0) 
                    for log in nutrition_logs
                )
                total_carbs = sum(
                    log.get('total_nutrition', {}).get('carbohydrates', 0) 
                    for log in nutrition_logs
                )
                total_fat = sum(
                    log.get('total_nutrition', {}).get('fat', 0) 
                    for log in nutrition_logs
                )
                
                insights['nutrition_trends'] = {
                    'average_protein': total_protein / len(nutrition_logs),
                    'average_carbs': total_carbs / len(nutrition_logs),
                    'average_fat': total_fat / len(nutrition_logs)
                }
            
            # Analyze food preferences
            all_foods = []
            for log in nutrition_logs:
                for food_item in log.get('food_items', []):
                    all_foods.append(food_item.get('name', 'Unknown'))
            
            # Count food frequency
            food_counts = {}
            for food in all_foods:
                food_counts[food] = food_counts.get(food, 0) + 1
            
            # Get top 10 most frequent foods
            insights['food_preferences'] = dict(
                sorted(food_counts.items(), key=lambda x: x[1], reverse=True)[:10]
            )
            
            return insights
            
        except Exception as e:
            logger.error(f"Failed to generate nutrition insights: {e}")
            return {'error': str(e)}

# Example usage and configuration
async def main():
    """Example usage of the ETL pipeline"""
    
    # Configuration
    config = ETLConfig(
        azure_connection_string="DefaultEndpointsProtocol=https;AccountName=your_account;AccountKey=your_key;EndpointSuffix=core.windows.net",
        azure_share_name="diet-agent-data",
        azure_base_directory="diet_agent_etl",
        mongodb_uri="mongodb+srv://Admin:X1bzjS2IGHrNHFgS@healthagent.ucnrbse.mongodb.net/HealthAgent",
        mongodb_database="HealthAgent",
        batch_size=1000,
        compression_enabled=True
    )
    
    # Initialize pipeline
    pipeline = DietAgentETLPipeline(config)
    
    # Run ETL for last 7 days
    end_date = datetime.now()
    start_date = end_date - timedelta(days=7)
    
    print("🚀 Starting Diet Agent ETL Pipeline...")
    
    # Run full ETL
    results = await pipeline.run_full_etl(
        start_date=start_date,
        end_date=end_date,
        data_types=['nutrition_logs', 'food_analyses', 'user_profiles']
    )
    
    print(f"✅ ETL Pipeline completed: {results}")
    
    # Example: Retrieve data for analysis
    print("\n📊 Retrieving nutrition data...")
    nutrition_data = await pipeline.retriever.retrieve_data(
        'nutrition_logs',
        start_date=start_date.strftime('%Y-%m-%d'),
        end_date=end_date.strftime('%Y-%m-%d')
    )
    
    print(f"Retrieved {len(nutrition_data)} nutrition log records")
    
    # Example: Get user insights
    if nutrition_data:
        sample_user_id = nutrition_data[0].get('user_id')
        if sample_user_id:
            print(f"\n🔍 Generating insights for user {sample_user_id}...")
            insights = await pipeline.get_nutrition_insights(sample_user_id, days=30)
            print(f"User insights: {json.dumps(insights, indent=2)}")

if __name__ == "__main__":
    asyncio.run(main())
