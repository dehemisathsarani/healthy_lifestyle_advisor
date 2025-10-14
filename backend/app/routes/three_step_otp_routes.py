"""
Three-Step OTP Security Routes for Enhanced File Access
Step 1: Email Verification OTP
Step 2: Download Access OTP  
Step 3: Decrypt Access OTP - NOW WITH REAL HEALTH DATA
"""
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from app.core.database import get_database
from app.services.otp_service import OTPService
from app.services.real_health_data_service import RealHealthDataService

router = APIRouter(prefix="/api/security/three-step", tags=["Three-Step OTP"])


class EmailVerificationRequest(BaseModel):
    identifier: str


class OTPVerificationRequest(BaseModel):
    identifier: str
    otp_code: str

class DecryptAccessRequest(BaseModel):
    identifier: str
    otp_code: str
    report_type: str = "all"  # Add report type to decrypt request


class ReportDownloadRequest(BaseModel):
    identifier: str
    otp_code: str
    report_type: str = "all"
    days: int = 30


# Step 1: Email Verification
@router.post("/request-email-verification")
async def request_email_verification(
    request: EmailVerificationRequest,
    db=Depends(get_database)
):
    """Step 1: Request OTP for email verification"""
    try:
        otp_service = OTPService(db)
        result = await otp_service.create_email_verification_otp(
            identifier=request.identifier
        )
        
        if result.get("success"):
            return {
                "success": True,
                "message": "Email verification OTP sent successfully",
                "data": {
                    "otp_code": "******",  # Hide actual code for security
                    "identifier": request.identifier,
                    "expires_at": result.get("expires_at"),
                    "expires_in_minutes": 10,
                    "message": f"Step 1: Email verification OTP sent to {request.identifier}",
                    "email_sent": result.get("email_sent", False),
                    "step": 1,
                    "next_step": "Verify this OTP to access the report generation page"
                }
            }
        else:
            raise HTTPException(status_code=400, detail=result.get("message"))
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to send email verification OTP: {str(e)}")


@router.post("/verify-email-verification")
async def verify_email_verification(
    request: OTPVerificationRequest,
    db=Depends(get_database)
):
    """Step 1: Verify email verification OTP"""
    try:
        otp_service = OTPService(db)
        result = await otp_service.verify_email_verification_access(
            identifier=request.identifier,
            otp_code=request.otp_code
        )
        
        if result.get("success"):
            return {
                "success": True,
                "message": "Email verified successfully! You can now proceed to report generation.",
                "data": {
                    "access_granted": True,
                    "purpose": "email_verification",
                    "next_action": "navigate_to_report_page",
                    "next_message": "Email verified! Navigate to the report generation page.",
                    "identifier": request.identifier,
                    "step": 1,
                    "step_completed": True,
                    "next_step": "Go to report generation page and request download OTP"
                }
            }
        else:
            # Check if new OTP was generated
            if result.get("action") == "new_otp_sent":
                return {
                    "success": False,
                    "message": "New email verification OTP generated",
                    "action": "new_otp_sent",
                    "otp_code": "******",
                    "email_sent": True,
                    "purpose": "email_verification",
                    "expires_in_minutes": 10,
                    "step": 1,
                    "retry_message": "New OTP sent to your email. Please check and try again."
                }
            else:
                return result
                
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to verify email verification OTP: {str(e)}")


# Step 2: Download Access
@router.post("/request-download-access")
async def request_download_access(
    request: EmailVerificationRequest,
    db=Depends(get_database)
):
    """Step 2: Request OTP for report download access"""
    try:
        otp_service = OTPService(db)
        result = await otp_service.create_download_access_otp(
            identifier=request.identifier
        )
        
        if result.get("success"):
            return {
                "success": True,
                "message": "Download access OTP sent successfully",
                "data": {
                    "otp_code": "******",  # Hide actual code for security
                    "identifier": request.identifier,
                    "expires_at": result.get("expires_at"),
                    "expires_in_minutes": 15,
                    "message": f"Step 2: Download access OTP sent to {request.identifier}",
                    "email_sent": result.get("email_sent", False),
                    "step": 2,
                    "next_step": "Verify this OTP to download your encrypted health report"
                }
            }
        else:
            raise HTTPException(status_code=400, detail=result.get("message"))
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to send download access OTP: {str(e)}")


@router.post("/verify-download-access")
async def verify_download_access(
    request: ReportDownloadRequest,
    db=Depends(get_database)
):
    """Step 2: Verify download access OTP and generate report"""
    try:
        otp_service = OTPService(db)
        result = await otp_service.verify_download_access(
            identifier=request.identifier,
            otp_code=request.otp_code
        )
        
        if result.get("success"):
            # Simulate report generation
            report_data = {
                "report_id": f"health_report_{request.identifier.replace('@', '_')}_{request.report_type}",
                "report_type": request.report_type,
                "days": request.days,
                "generated_at": "2025-10-12T10:45:00Z",
                "encrypted": True,
                "download_url": f"/download/encrypted_report_{request.identifier.replace('@', '_')}.enc",
                "file_size": "2.5 MB"
            }
            
            return {
                "success": True,
                "message": "Download access granted! Your encrypted report is ready.",
                "data": {
                    "access_granted": True,
                    "purpose": "download_access",
                    "next_action": "allow_download",
                    "next_message": "You can now download your encrypted report.",
                    "identifier": request.identifier,
                    "step": 2,
                    "step_completed": True,
                    "next_step": "After downloading, request decrypt OTP to view the report",
                    "report_data": report_data
                }
            }
        else:
            # Check if new OTP was generated
            if result.get("action") == "new_otp_sent":
                return {
                    "success": False,
                    "message": "New download access OTP generated",
                    "action": "new_otp_sent",
                    "otp_code": "******",
                    "email_sent": True,
                    "purpose": "download_access",
                    "expires_in_minutes": 15,
                    "step": 2,
                    "retry_message": "New OTP sent to your email. Please check and try again."
                }
            else:
                return result
                
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to verify download access OTP: {str(e)}")


# Step 3: Decrypt Access
@router.post("/request-decrypt-access")
async def request_decrypt_access(
    request: EmailVerificationRequest,
    db=Depends(get_database)
):
    """Step 3: Request OTP for file decryption access"""
    try:
        otp_service = OTPService(db)
        result = await otp_service.create_decrypt_access_otp(
            identifier=request.identifier
        )
        
        if result.get("success"):
            return {
                "success": True,
                "message": "Decrypt access OTP sent successfully",
                "data": {
                    "otp_code": "******",  # Hide actual code for security
                    "identifier": request.identifier,
                    "expires_at": result.get("expires_at"),
                    "expires_in_minutes": 20,
                    "message": f"Step 3: Decrypt access OTP sent to {request.identifier}",
                    "email_sent": result.get("email_sent", False),
                    "step": 3,
                    "next_step": "Verify this OTP to decrypt and view your health report"
                }
            }
        else:
            raise HTTPException(status_code=400, detail=result.get("message"))
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to send decrypt access OTP: {str(e)}")


@router.post("/verify-decrypt-access")
async def verify_decrypt_access(
    request: DecryptAccessRequest,
    db=Depends(get_database)
):
    """Step 3: Verify decrypt access OTP and provide decrypted report with selected type"""
    try:
        otp_service = OTPService(db)
        result = await otp_service.verify_decrypt_access(
            identifier=request.identifier,
            otp_code=request.otp_code
        )
        
        if result.get("success"):
            # 🎉 FETCH REAL HEALTH DATA FROM CLOUD DATABASE WITH SELECTED REPORT TYPE
            real_health_service = RealHealthDataService(db)
            decrypted_report = await real_health_service.get_user_health_report(
                email=request.identifier, 
                report_type=request.report_type
            )
            
            return {
                "success": True,
                "message": "Decrypt access granted! Your health report is now available.",
                "data": {
                    "access_granted": True,
                    "purpose": "decrypt_access",
                    "next_action": "allow_decryption",
                    "next_message": "You can now view your decrypted health report.",
                    "identifier": request.identifier,
                    "step": 3,
                    "step_completed": True,
                    "workflow_completed": True,
                    "decrypted_report": decrypted_report
                }
            }
        else:
            # Check if new OTP was generated
            if result.get("action") == "new_otp_sent":
                return {
                    "success": False,
                    "message": "New decrypt access OTP generated",
                    "action": "new_otp_sent",
                    "otp_code": "******",
                    "email_sent": True,
                    "purpose": "decrypt_access",
                    "expires_in_minutes": 20,
                    "step": 3,
                    "retry_message": "New OTP sent to your email. Please check and try again."
                }
            else:
                return result
                
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to verify decrypt access OTP: {str(e)}")


@router.get("/workflow-status")
async def get_workflow_status():
    """Get information about the three-step OTP workflow"""
    return {
        "workflow_name": "Three-Step OTP Security System",
        "steps": {
            "step_1": {
                "name": "Email Verification",
                "description": "Verify email address to access system",
                "otp_validity": "10 minutes",
                "purpose": "email_verification"
            },
            "step_2": {
                "name": "Download Access",
                "description": "Generate and download encrypted health report",
                "otp_validity": "15 minutes",
                "purpose": "download_access"
            },
            "step_3": {
                "name": "Decrypt Access",
                "description": "Decrypt and view the health report content",
                "otp_validity": "20 minutes",
                "purpose": "decrypt_access"
            }
        },
        "features": {
            "auto_otp_generation": "enabled",
            "email_notifications": "enabled",
            "step_by_step_guidance": "enabled",
            "secure_file_handling": "enabled"
        }
    }