"""
Pydantic models for Data and Security Agent
"""
from typing import Optional, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime


class EncryptDataRequest(BaseModel):
    """Request model for encrypting data"""
    user_id: str = Field(..., description="User identifier")
    data: Dict[str, Any] = Field(..., description="Data to encrypt")
    
    class Config:
        json_schema_extra = {
            "example": {
                "user_id": "507f1f77bcf86cd799439011",
                "data": {
                    "name": "John Doe",
                    "health_data": {
                        "weight": 70,
                        "height": 175
                    }
                }
            }
        }


class EncryptDataResponse(BaseModel):
    """Response model for encrypted data"""
    encrypted_data: str = Field(..., description="Encrypted data string")
    user_id: str = Field(..., description="User identifier")
    encrypted_at: str = Field(..., description="Encryption timestamp")
    encryption_method: str = Field(..., description="Encryption method used")
    note: str = Field(..., description="Instructions for decryption")


class DecryptDataRequest(BaseModel):
    """Request model for decrypting data"""
    encrypted_data: str = Field(..., description="Encrypted data string to decrypt")
    user_id: str = Field(..., description="User identifier used during encryption")
    
    class Config:
        json_schema_extra = {
            "example": {
                "encrypted_data": "gAAAAABk...",
                "user_id": "507f1f77bcf86cd799439011"
            }
        }


class DecryptWithTokenRequest(BaseModel):
    """Request model for decrypting data with a token"""
    encrypted_data: str = Field(..., description="Encrypted data string to decrypt")
    decryption_token: str = Field(..., description="Decryption token")
    
    class Config:
        json_schema_extra = {
            "example": {
                "encrypted_data": "gAAAAABk...",
                "decryption_token": "d09GRktfa..."
            }
        }


class GenerateTokenRequest(BaseModel):
    """Request model for generating decryption token"""
    user_id: str = Field(..., description="User identifier")
    expires_in_hours: int = Field(24, description="Token expiration in hours", ge=1, le=168)
    
    class Config:
        json_schema_extra = {
            "example": {
                "user_id": "507f1f77bcf86cd799439011",
                "expires_in_hours": 24
            }
        }


class HealthReportRequest(BaseModel):
    """Request model for getting health reports"""
    user_id: str = Field(..., description="User identifier")
    report_type: str = Field(
        "all", 
        description="Type of report: 'diet', 'fitness', 'mental_health', or 'all'"
    )
    days: int = Field(30, description="Number of days of historical data", ge=1, le=365)
    encrypt: bool = Field(False, description="Whether to encrypt the report data")
    
    class Config:
        json_schema_extra = {
            "example": {
                "user_id": "507f1f77bcf86cd799439011",
                "report_type": "all",
                "days": 30,
                "encrypt": True
            }
        }


class HealthReportResponse(BaseModel):
    """Response model for health reports"""
    success: bool = Field(..., description="Whether the request was successful")
    report_type: str = Field(..., description="Type of report generated")
    data: Optional[Dict[str, Any]] = Field(None, description="Report data (if not encrypted)")
    encrypted_data: Optional[str] = Field(None, description="Encrypted report data")
    user_id: Optional[str] = Field(None, description="User identifier (if encrypted)")
    encrypted_at: Optional[str] = Field(None, description="Encryption timestamp (if encrypted)")
    encryption_method: Optional[str] = Field(None, description="Encryption method (if encrypted)")
    note: Optional[str] = Field(None, description="Additional notes")
    
    class Config:
        json_schema_extra = {
            "example": {
                "success": True,
                "report_type": "all",
                "encrypted_data": "gAAAAABk...",
                "user_id": "507f1f77bcf86cd799439011",
                "encrypted_at": "2025-01-15T10:30:00",
                "encryption_method": "Fernet (symmetric)",
                "note": "Use the decryption endpoint with your user_id to decrypt this data"
            }
        }


class AgentDataRequest(BaseModel):
    """Request model for getting specific agent data"""
    user_id: str = Field(..., description="User identifier")
    agent_type: str = Field(..., description="Agent type: 'diet', 'fitness', 'mental_health'")
    days: int = Field(30, description="Number of days of historical data", ge=1, le=365)
    
    class Config:
        json_schema_extra = {
            "example": {
                "user_id": "507f1f77bcf86cd799439011",
                "agent_type": "diet",
                "days": 30
            }
        }
