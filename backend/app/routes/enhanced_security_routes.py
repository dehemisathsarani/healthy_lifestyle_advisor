"""
Enhanced Security Routes for File Encryption/Decryption with OTP
"""
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, EmailStr, Field
from typing import Optional, Dict, Any
from app.core.database import get_database
from app.services.otp_service import OTPService

router = APIRouter(prefix="/api/security", tags=["Enhanced Security"])

# Pydantic models for requests
class EncryptOTPRequest(BaseModel):
    identifier: str = Field(..., description="Email address")
    identifier_type: str = Field("email", description="Type: 'email' or 'phone'")

class DecryptOTPRequest(BaseModel):
    identifier: str = Field(..., description="Email address")
    identifier_type: str = Field("email", description="Type: 'email' or 'phone'")

class VerifyEncryptOTPRequest(BaseModel):
    identifier: str = Field(..., description="Email address")
    otp_code: str = Field(..., description="6-digit OTP code")
    identifier_type: str = Field("email", description="Type: 'email' or 'phone'")

class VerifyDecryptOTPRequest(BaseModel):
    identifier: str = Field(..., description="Email address")
    otp_code: str = Field(..., description="6-digit OTP code")
    identifier_type: str = Field("email", description="Type: 'email' or 'phone'")

class AccessHistoryRequest(BaseModel):
    identifier: str = Field(..., description="Email address")
    limit: int = Field(10, description="Number of records to return")

@router.post("/request-encrypt-otp")
async def request_encrypt_otp(request: EncryptOTPRequest, db=Depends(get_database)):
    """
    Request OTP for file encryption access
    
    - **identifier**: Email address
    - **identifier_type**: 'email' or 'phone'
    
    Returns OTP code for encryption access (15-minute validity)
    """
    try:
        otp_service = OTPService(db)
        result = await otp_service.create_encrypt_otp(
            identifier=request.identifier,
            identifier_type=request.identifier_type
        )
        
        return {
            "success": True,
            "message": "Encryption OTP sent successfully",
            "data": result
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to send encryption OTP: {str(e)}")

@router.post("/verify-encrypt-otp")
async def verify_encrypt_otp(request: VerifyEncryptOTPRequest, db=Depends(get_database)):
    """
    Verify OTP for file encryption access
    
    - **identifier**: Email address
    - **otp_code**: 6-digit OTP code
    - **identifier_type**: 'email' or 'phone'
    
    Grants access to encrypt files
    """
    try:
        otp_service = OTPService(db)
        result = await otp_service.verify_encrypt_access(
            identifier=request.identifier,
            otp_code=request.otp_code,
            identifier_type=request.identifier_type
        )
        
        if result["success"]:
            return {
                "success": True,
                "message": "Encryption access granted",
                "data": {
                    "access_granted": True,
                    "purpose": "encrypt",
                    "next_action": result.get("next_action"),
                    "next_message": result.get("next_message"),
                    "identifier": request.identifier
                }
            }
        else:
            return {
                "success": False,
                "message": result.get("message", "Verification failed"),
                "data": result
            }
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Encryption OTP verification failed: {str(e)}")

@router.post("/request-decrypt-otp")
async def request_decrypt_otp(request: DecryptOTPRequest, db=Depends(get_database)):
    """
    Request OTP for file decryption access
    
    - **identifier**: Email address
    - **identifier_type**: 'email' or 'phone'
    
    Returns OTP code for decryption access (10-minute validity)
    """
    try:
        otp_service = OTPService(db)
        result = await otp_service.create_decrypt_otp(
            identifier=request.identifier,
            identifier_type=request.identifier_type
        )
        
        return {
            "success": True,
            "message": "Decryption OTP sent successfully",
            "data": result
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to send decryption OTP: {str(e)}")

@router.post("/verify-decrypt-otp")
async def verify_decrypt_otp(request: VerifyDecryptOTPRequest, db=Depends(get_database)):
    """
    Verify OTP for file decryption access
    
    - **identifier**: Email address
    - **otp_code**: 6-digit OTP code
    - **identifier_type**: 'email' or 'phone'
    
    Grants access to decrypt and download files
    """
    try:
        otp_service = OTPService(db)
        result = await otp_service.verify_decrypt_access(
            identifier=request.identifier,
            otp_code=request.otp_code,
            identifier_type=request.identifier_type
        )
        
        if result["success"]:
            return {
                "success": True,
                "message": "Decryption access granted",
                "data": {
                    "access_granted": True,
                    "purpose": "decrypt",
                    "next_action": result.get("next_action"),
                    "next_message": result.get("next_message"),
                    "identifier": request.identifier,
                    "download_enabled": True
                }
            }
        else:
            return {
                "success": False,
                "message": result.get("message", "Verification failed"),
                "data": result
            }
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Decryption OTP verification failed: {str(e)}")

@router.post("/access-history")
async def get_access_history(request: AccessHistoryRequest, db=Depends(get_database)):
    """
    Get access history for file operations
    
    - **identifier**: Email address
    - **limit**: Number of records to return (default: 10)
    
    Returns history of encryption/decryption access
    """
    try:
        otp_service = OTPService(db)
        history = await otp_service.get_access_history(
            identifier=request.identifier,
            limit=request.limit
        )
        
        return {
            "success": True,
            "message": "Access history retrieved successfully",
            "data": {
                "identifier": request.identifier,
                "history": history,
                "total_records": len(history)
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve access history: {str(e)}")

@router.post("/revoke-otps")
async def revoke_all_otps(request: EncryptOTPRequest, db=Depends(get_database)):
    """
    Revoke all active OTPs for security
    
    - **identifier**: Email address
    - **identifier_type**: 'email' or 'phone'
    
    Revokes all pending OTPs (security measure)
    """
    try:
        otp_service = OTPService(db)
        revoked_count = await otp_service.revoke_all_otps(
            identifier=request.identifier,
            identifier_type=request.identifier_type
        )
        
        return {
            "success": True,
            "message": f"Revoked {revoked_count} active OTP(s)",
            "data": {
                "identifier": request.identifier,
                "revoked_count": revoked_count
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to revoke OTPs: {str(e)}")

# Health check endpoint
@router.get("/status")
async def security_status():
    """Check enhanced security system status"""
    return {
        "status": "active",
        "features": {
            "encryption_otp": "enabled",
            "decryption_otp": "enabled",
            "access_history": "enabled",
            "otp_revocation": "enabled",
            "auto_otp_generation": "enabled"
        },
        "otp_validity": {
            "encrypt": "15 minutes",
            "decrypt": "10 minutes"
        }
    }
