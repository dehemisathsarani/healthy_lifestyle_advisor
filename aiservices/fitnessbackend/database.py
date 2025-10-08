from motor.motor_asyncio import AsyncIOMotorClient
from fastapi import Depends
from settings import settings


# MongoDB connection
mongo_client = AsyncIOMotorClient(settings.MONGODB_URL)
database = mongo_client[settings.DB_NAME]


async def get_database():
    """
    Dependency to get the MongoDB database instance
    """
    return database
