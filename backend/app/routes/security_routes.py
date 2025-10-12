"""
API Routes for Data and Security Agent
Handles encrypted health data downloads and decryption
"""
from fastapi import APIRouter, HTTPException, Depends, status
from typing import Dict, Any
from datetime import datetime, timedelta
from pydantic import BaseModel, EmailStr, Field

from ..core.database import get_database
from ..services.security_service import security_service
from ..services.data_aggregation_service import DataAggregationService
from ..services.otp_service import OTPService
from ..models.security_models import (
    EncryptDataRequest,
    EncryptDataResponse,
    DecryptDataRequest,
    DecryptWithTokenRequest,
    GenerateTokenRequest,
    HealthReportRequest,
    HealthReportResponse,
    AgentDataRequest
)

router = APIRouter(
    prefix="/api/security",
    tags=["Data & Security Agent"],
    responses={
        404: {"description": "Not found"},
        500: {"description": "Internal server error"}
    }
)


# Pydantic models for OTP endpoints
class RequestOTPModel(BaseModel):
    identifier: str = Field(..., description="Email or phone number")
    identifier_type: str = Field("email", description="Type: 'email' or 'phone'")
    
    class Config:
        json_schema_extra = {
            "example": {
                "identifier": "user@example.com",
                "identifier_type": "email"
            }
        }


class VerifyOTPModel(BaseModel):
    identifier: str = Field(..., description="Email or phone number")
    otp_code: str = Field(..., description="6-digit OTP code")
    identifier_type: str = Field("email", description="Type: 'email' or 'phone'")
    
    class Config:
        json_schema_extra = {
            "example": {
                "identifier": "user@example.com",
                "otp_code": "123456",
                "identifier_type": "email"
            }
        }


class SecureReportRequestModel(BaseModel):
    identifier: str = Field(..., description="Email or phone number")
    otp_code: str = Field(..., description="6-digit OTP code")
    report_type: str = Field("all", description="Type: 'diet', 'fitness', 'mental_health', 'all'")
    days: int = Field(30, description="Number of days of historical data", ge=1, le=365)
    start_date: str = Field(None, description="Start date (YYYY-MM-DD) for specific date range")
    end_date: str = Field(None, description="End date (YYYY-MM-DD) for specific date range")
    
    class Config:
        json_schema_extra = {
            "example": {
                "identifier": "user@example.com",
                "otp_code": "123456",
                "report_type": "all",
                "days": 30,
                "start_date": "2025-09-01",
                "end_date": "2025-10-01"
            }
        }


# OTP Endpoints
@router.post("/request-otp")
async def request_otp(request: RequestOTPModel):
    """
    Request an OTP code for secure report access
    
    - **identifier**: Email address or phone number
    - **identifier_type**: 'email' or 'phone'
    
    Generates and sends an OTP code (in production, this would be sent via email/SMS)
    """
    try:
        # Get database
        db = get_database()
        
        otp_service = OTPService(db)
        
        # Generate OTP
        otp_result = await otp_service.create_otp(
            identifier=request.identifier,
            identifier_type=request.identifier_type,
            expires_in_minutes=10
        )
        
        return {
            "success": True,
            "message": "OTP code generated successfully",
            "otp_code": otp_result["otp_code"],  # Remove this in production
            "expires_at": otp_result["expires_at"],
            "note": "In production, OTP will be sent to your email/phone. For demo, it's shown here."
        }
    except RuntimeError as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Database not available: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate OTP: {str(e)}"
        )


@router.post("/verify-otp")
async def verify_otp(request: VerifyOTPModel):
    """
    Verify an OTP code
    
    - **identifier**: Email address or phone number
    - **otp_code**: 6-digit OTP code received
    - **identifier_type**: 'email' or 'phone'
    
    Returns verification status
    """
    try:
        db = get_database()
        otp_service = OTPService(db)
        
        # Verify OTP
        verification_result = await otp_service.verify_otp(
            identifier=request.identifier,
            otp_code=request.otp_code,
            identifier_type=request.identifier_type
        )
        
        return verification_result
    except RuntimeError as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Database not available: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to verify OTP: {str(e)}"
        )


@router.post("/secure-report")
async def get_secure_report(request: SecureReportRequestModel):
    """
    Get encrypted health report using OTP authentication
    
    Flow:
    1. User requests OTP using /request-otp
    2. User receives OTP (via email/SMS in production)
    3. User submits this endpoint with OTP + report parameters
    4. System verifies OTP and returns encrypted report
    5. User can decrypt using /decrypt endpoint
    
    - **identifier**: Email or phone number (same as used for OTP)
    - **otp_code**: OTP code received
    - **report_type**: Type of report to generate
    - **days**: Number of days (or use start_date/end_date)
    - **start_date**: Optional start date for specific range
    - **end_date**: Optional end date for specific range
    """
    try:
        db = get_database()
        
        # Step 1: Verify OTP
        # Try both OTP verification methods: regular OTP and three-step email verification
        otp_service = OTPService(db)
        
        # First try regular OTP verification
        verification = await otp_service.verify_otp(
            identifier=request.identifier,
            otp_code=request.otp_code,
            identifier_type="email"  # Default to email
        )
        
        # If regular OTP fails, try three-step email verification OTP
        if not verification.get("success"):
            verification = await otp_service.verify_email_verification_access(
                identifier=request.identifier,
                otp_code=request.otp_code
            )
        
        if not verification.get("success"):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=verification.get("message", "Invalid or expired OTP. Please verify your email first.")
            )
        
        # Step 2: Find user by email/phone
        # First, try to find user in users collection
        user = await db.users.find_one({"email": request.identifier.lower()})
        
        if not user:
            # Try diet profiles
            user = await db.diet_user_profiles.find_one({"email": request.identifier.lower()})
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No user found with this identifier"
            )
        
        user_id = str(user["_id"])
        
        # Step 3: Fetch report data
        data_service = DataAggregationService(db)
        
        # Validate report type
        valid_types = ['diet', 'fitness', 'mental_health', 'all']
        if request.report_type not in valid_types:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid report_type. Must be one of: {', '.join(valid_types)}"
            )
        
        # Get report data
        report_data = await data_service.get_specific_report(
            user_id=user_id,
            report_type=request.report_type,
            days=request.days
        )
        
        # Add date range info if provided
        if request.start_date or request.end_date:
            report_data["date_range"] = {
                "start_date": request.start_date,
                "end_date": request.end_date
            }
        
        # Step 4: Encrypt the report
        encrypted_result = security_service.encrypt_data(
            data=report_data,
            user_id=user_id
        )
        
        # Step 5: Generate decryption token for user convenience
        decryption_token_info = security_service.generate_decryption_token(
            user_id=user_id,
            expires_in_hours=24
        )
        
        return {
            "success": True,
            "message": "Report generated and encrypted successfully",
            "encrypted_report": encrypted_result["encrypted_data"],
            "user_id": user_id,
            "report_type": request.report_type,
            "encrypted_at": encrypted_result["encrypted_at"],
            "encryption_method": encrypted_result["encryption_method"],
            "decryption_token": decryption_token_info["decryption_token"],
            "instructions": {
                "step_1": "Save the 'encrypted_report' value",
                "step_2": "To decrypt, use /decrypt endpoint with your user_id",
                "step_3": "Or use /decrypt-with-token endpoint with the decryption_token",
                "note": "Keep your encrypted report and decryption token safe"
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate secure report: {str(e)}"
        )


@router.post("/encrypt", response_model=EncryptDataResponse)
async def encrypt_data(request: EncryptDataRequest):
    """
    Encrypt sensitive data for secure storage or transmission
    
    - **user_id**: User identifier for key derivation
    - **data**: Dictionary containing the data to encrypt
    
    Returns encrypted data that can only be decrypted with the same user_id
    """
    try:
        encrypted_result = security_service.encrypt_data(
            data=request.data,
            user_id=request.user_id
        )
        return EncryptDataResponse(**encrypted_result)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Encryption failed: {str(e)}"
        )


@router.post("/decrypt")
async def decrypt_data(request: DecryptDataRequest):
    """
    Decrypt previously encrypted data using user_id
    
    - **encrypted_data**: The encrypted data string
    - **user_id**: User identifier used during encryption
    
    Returns the original decrypted data
    """
    try:
        decrypted_data = security_service.decrypt_data(
            encrypted_data=request.encrypted_data,
            user_id=request.user_id
        )
        return {
            "success": True,
            "data": decrypted_data,
            "decrypted_at": security_service._generate_key.__self__.__class__.__module__
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Decryption failed: {str(e)}"
        )


@router.post("/generate-token")
async def generate_decryption_token(request: GenerateTokenRequest):
    """
    Generate a decryption token for a user
    
    - **user_id**: User identifier
    - **expires_in_hours**: Token expiration time (default: 24 hours)
    
    Returns a decryption token that can be used to decrypt data
    """
    try:
        token_info = security_service.generate_decryption_token(
            user_id=request.user_id,
            expires_in_hours=request.expires_in_hours
        )
        return {
            "success": True,
            **token_info
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Token generation failed: {str(e)}"
        )


@router.post("/decrypt-with-token")
async def decrypt_with_token(request: DecryptWithTokenRequest):
    """
    Decrypt data using a decryption token
    
    - **encrypted_data**: The encrypted data string
    - **decryption_token**: The decryption token obtained from /generate-token
    
    Returns the original decrypted data
    """
    try:
        decrypted_data = security_service.decrypt_with_token(
            encrypted_data=request.encrypted_data,
            decryption_token=request.decryption_token
        )
        return {
            "success": True,
            "data": decrypted_data
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Decryption failed: {str(e)}"
        )


@router.post("/health-report", response_model=HealthReportResponse)
async def get_health_report(request: HealthReportRequest):
    """
    Get comprehensive health report from all agents
    
    - **user_id**: User identifier
    - **report_type**: Type of report ('diet', 'fitness', 'mental_health', 'all')
    - **days**: Number of days of historical data (1-365)
    - **encrypt**: Whether to encrypt the report data
    
    Returns health data, optionally encrypted for secure download
    """
    try:
        db = get_database()
        
        # Validate report type
        valid_types = ['diet', 'fitness', 'mental_health', 'all']
        if request.report_type not in valid_types:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid report_type. Must be one of: {', '.join(valid_types)}"
            )
        
        # Create data aggregation service
        data_service = DataAggregationService(db)
        
        # Fetch the requested data
        report_data = await data_service.get_specific_report(
            user_id=request.user_id,
            report_type=request.report_type,
            days=request.days
        )
        
        # If encryption is requested
        if request.encrypt:
            encrypted_result = security_service.encrypt_data(
                data=report_data,
                user_id=request.user_id
            )
            return HealthReportResponse(
                success=True,
                report_type=request.report_type,
                encrypted_data=encrypted_result["encrypted_data"],
                user_id=encrypted_result["user_id"],
                encrypted_at=encrypted_result["encrypted_at"],
                encryption_method=encrypted_result["encryption_method"],
                note=encrypted_result["note"]
            )
        else:
            return HealthReportResponse(
                success=True,
                report_type=request.report_type,
                data=report_data,
                note="Data is not encrypted. Set 'encrypt=true' for encrypted download."
            )
            
    except HTTPException:
        raise
    except RuntimeError as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Database not available: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate health report: {str(e)}"
        )


@router.get("/agent-data/{agent_type}/{user_id}")
async def get_agent_data(
    agent_type: str,
    user_id: str,
    days: int = 30,
    encrypt: bool = False
):
    """
    Get data from a specific health agent
    
    - **agent_type**: Type of agent ('diet', 'fitness', 'mental_health')
    - **user_id**: User identifier
    - **days**: Number of days of historical data (default: 30)
    - **encrypt**: Whether to encrypt the response (default: false)
    
    Returns data from the specified agent
    """
    try:
        db = get_database()
        
        # Validate agent type
        valid_agents = ['diet', 'fitness', 'mental_health']
        if agent_type not in valid_agents:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid agent_type. Must be one of: {', '.join(valid_agents)}"
            )
        
        # Create data aggregation service
        data_service = DataAggregationService(db)
        
        # Fetch data based on agent type
        if agent_type == 'diet':
            agent_data = await data_service.get_diet_data(user_id, days)
        elif agent_type == 'fitness':
            agent_data = await data_service.get_fitness_data(user_id, days)
        else:  # mental_health
            agent_data = await data_service.get_mental_health_data(user_id, days)
        
        # Encrypt if requested
        if encrypt:
            encrypted_result = security_service.encrypt_data(
                data=agent_data,
                user_id=user_id
            )
            return {
                "success": True,
                "agent_type": agent_type,
                **encrypted_result
            }
        else:
            return {
                "success": True,
                "agent_type": agent_type,
                "data": agent_data
            }
            
    except HTTPException:
        raise
    except RuntimeError as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Database not available: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch agent data: {str(e)}"
        )


@router.get("/health")
async def security_agent_health():
    """
    Health check endpoint for Data and Security Agent
    """
    return {
        "status": "healthy",
        "agent": "Data and Security Agent",
        "features": [
            "Data Encryption (Fernet)",
            "Data Decryption",
            "Token-based Decryption",
            "Multi-Agent Data Aggregation",
            "Encrypted Health Reports"
        ],
        "encryption_method": "Fernet (symmetric encryption)",
        "supported_agents": ["diet", "fitness", "mental_health"]
    }
