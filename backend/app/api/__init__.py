"""
API package for Healthy Lifestyle Advisor
Contains all API routes and endpoints
"""

from .mental_health import router as mental_health_router

__all__ = ["mental_health_router"]
