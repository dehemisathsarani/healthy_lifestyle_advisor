"""
ETL Configuration and Environment Setup
"""

import os
from dataclasses import dataclass
from typing import Optional, List
from pathlib import Path

@dataclass
class AzureETLConfig:
    """Configuration for Azure EFS ETL Pipeline"""
    
    # Azure Storage Configuration
    azure_connection_string: str
    azure_share_name: str = "diet-agent-data"
    azure_base_directory: str = "diet_agent_etl"
    
    # MongoDB Configuration
    mongodb_uri: str = ""
    mongodb_database: str = "HealthAgent"
    
    # ETL Configuration
    batch_size: int = 1000
    compression_enabled: bool = True
    retention_days: int = 365
    backup_enabled: bool = True
    
    # Processing Configuration
    max_workers: int = 4
    timeout_seconds: int = 300
    retry_attempts: int = 3
    
    # Data Partitioning
    partition_by_date: bool = True
    partition_by_user: bool = False
    max_partition_size_mb: int = 100
    
    # Monitoring and Logging
    enable_metrics: bool = True
    log_level: str = "INFO"
    metrics_retention_days: int = 30

class ETLEnvironment:
    """Environment configuration manager"""
    
    @classmethod
    def from_environment(cls) -> AzureETLConfig:
        """Create configuration from environment variables"""
        return AzureETLConfig(
            azure_connection_string=os.getenv('AZURE_STORAGE_CONNECTION_STRING', ''),
            azure_share_name=os.getenv('AZURE_SHARE_NAME', 'diet-agent-data'),
            azure_base_directory=os.getenv('AZURE_BASE_DIRECTORY', 'diet_agent_etl'),
            
            mongodb_uri=os.getenv('MONGODB_URI', ''),
            mongodb_database=os.getenv('MONGODB_DATABASE', 'HealthAgent'),
            
            batch_size=int(os.getenv('ETL_BATCH_SIZE', '1000')),
            compression_enabled=os.getenv('ETL_COMPRESSION_ENABLED', 'true').lower() == 'true',
            retention_days=int(os.getenv('ETL_RETENTION_DAYS', '365')),
            backup_enabled=os.getenv('ETL_BACKUP_ENABLED', 'true').lower() == 'true',
            
            max_workers=int(os.getenv('ETL_MAX_WORKERS', '4')),
            timeout_seconds=int(os.getenv('ETL_TIMEOUT_SECONDS', '300')),
            retry_attempts=int(os.getenv('ETL_RETRY_ATTEMPTS', '3')),
            
            partition_by_date=os.getenv('ETL_PARTITION_BY_DATE', 'true').lower() == 'true',
            partition_by_user=os.getenv('ETL_PARTITION_BY_USER', 'false').lower() == 'true',
            max_partition_size_mb=int(os.getenv('ETL_MAX_PARTITION_SIZE_MB', '100')),
            
            enable_metrics=os.getenv('ETL_ENABLE_METRICS', 'true').lower() == 'true',
            log_level=os.getenv('ETL_LOG_LEVEL', 'INFO'),
            metrics_retention_days=int(os.getenv('ETL_METRICS_RETENTION_DAYS', '30'))
        )
    
    @classmethod
    def create_development_config(cls) -> AzureETLConfig:
        """Create development configuration"""
        return AzureETLConfig(
            azure_connection_string="UseDevelopmentStorage=true",
            azure_share_name="diet-agent-dev",
            azure_base_directory="diet_agent_dev_etl",
            
            mongodb_uri="mongodb://localhost:27017",
            mongodb_database="HealthAgentDev",
            
            batch_size=100,
            compression_enabled=False,
            retention_days=30,
            backup_enabled=False,
            
            max_workers=2,
            timeout_seconds=60,
            retry_attempts=2,
            
            log_level="DEBUG"
        )
    
    @classmethod
    def create_production_config(cls) -> AzureETLConfig:
        """Create production configuration"""
        return AzureETLConfig(
            azure_connection_string=os.getenv('AZURE_STORAGE_CONNECTION_STRING'),
            azure_share_name="diet-agent-prod",
            azure_base_directory="diet_agent_prod_etl",
            
            mongodb_uri=os.getenv('MONGODB_URI'),
            mongodb_database="HealthAgent",
            
            batch_size=5000,
            compression_enabled=True,
            retention_days=730,  # 2 years
            backup_enabled=True,
            
            max_workers=8,
            timeout_seconds=600,
            retry_attempts=5,
            
            log_level="INFO"
        )

# Example environment configurations
DEVELOPMENT_CONFIG = ETLEnvironment.create_development_config()
PRODUCTION_CONFIG = ETLEnvironment.create_production_config()

# Data type mappings for ETL
DATA_TYPE_MAPPINGS = {
    'nutrition_logs': {
        'source_collection': 'nutrition_entries',
        'partition_field': 'date',
        'required_fields': ['user_id', 'total_nutrition', 'created_at'],
        'optional_fields': ['meal_type', 'confidence_score', 'ai_insights']
    },
    'food_analyses': {
        'source_collection': 'food_analyses',
        'partition_field': 'created_at',
        'required_fields': ['user_id', 'detected_foods', 'analysis_method'],
        'optional_fields': ['image_hash', 'processing_time_seconds', 'text_description']
    },
    'user_profiles': {
        'source_collection': 'user_profiles',
        'partition_field': 'created_at',
        'required_fields': ['name', 'email', 'age', 'weight', 'height'],
        'optional_fields': ['dietary_restrictions', 'allergies', 'fitness_goal']
    },
    'meal_entries': {
        'source_collection': 'meal_entries',
        'partition_field': 'created_at',
        'required_fields': ['user_id', 'detected_foods', 'total_nutrition'],
        'optional_fields': ['meal_type', 'image_url', 'confidence_score']
    }
}

# Schema validation for transformed data
NUTRITION_DATA_SCHEMA = {
    'type': 'object',
    'properties': {
        'calories': {'type': 'number', 'minimum': 0},
        'protein': {'type': 'number', 'minimum': 0},
        'carbohydrates': {'type': 'number', 'minimum': 0},
        'fat': {'type': 'number', 'minimum': 0},
        'fiber': {'type': 'number', 'minimum': 0},
        'sugar': {'type': 'number', 'minimum': 0},
        'sodium': {'type': 'number', 'minimum': 0},
        'cholesterol': {'type': 'number', 'minimum': 0}
    },
    'required': ['calories', 'protein', 'carbohydrates', 'fat']
}

FOOD_ITEM_SCHEMA = {
    'type': 'object',
    'properties': {
        'name': {'type': 'string', 'minLength': 1},
        'quantity': {'type': 'string'},
        'nutrition': NUTRITION_DATA_SCHEMA,
        'confidence': {'type': 'number', 'minimum': 0, 'maximum': 1},
        'food_category': {'type': 'string'},
        'sri_lankan_food': {'type': 'boolean'}
    },
    'required': ['name', 'nutrition']
}
