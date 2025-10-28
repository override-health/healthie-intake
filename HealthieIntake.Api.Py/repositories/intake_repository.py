"""
MongoDB Repository for Intake Submissions

Handles all database operations for intake forms.
Uses Motor for async MongoDB operations.
"""

from motor.motor_asyncio import AsyncIOMotorClient
from typing import Optional, List
from models.intake import IntakeSubmission
from bson import ObjectId
import os


class IntakeRepository:
    """
    Repository pattern for intake submissions

    Provides clean interface for MongoDB operations
    """

    def __init__(self, mongo_uri: str = None):
        """
        Initialize MongoDB connection

        Args:
            mongo_uri: MongoDB connection string (defaults to env var)
        """
        uri = mongo_uri or os.getenv("MONGODB_URI", "mongodb://localhost:27017/healthie_intake")
        self.client = AsyncIOMotorClient(uri)

        db_name = os.getenv("MONGODB_DATABASE", "healthie_intake")
        collection_name = os.getenv("MONGODB_COLLECTION", "intakes")

        self.db = self.client[db_name]
        self.collection = self.db[collection_name]

    async def save(self, intake: IntakeSubmission) -> str:
        """
        Save intake submission to MongoDB

        Args:
            intake: IntakeSubmission model to save

        Returns:
            String ID of inserted document
        """
        result = await self.collection.insert_one(intake.to_dict())
        return str(result.inserted_id)

    async def find_by_id(self, intake_id: str) -> Optional[dict]:
        """
        Find intake by MongoDB ObjectId

        Args:
            intake_id: String representation of ObjectId

        Returns:
            Document dict or None if not found
        """
        try:
            return await self.collection.find_one({"_id": ObjectId(intake_id)})
        except Exception:
            return None

    async def find_by_email(self, email: str) -> List[dict]:
        """
        Find all intakes for a patient email

        Args:
            email: Patient email address

        Returns:
            List of intake documents
        """
        cursor = self.collection.find({"email": email}).sort("created_at", -1)
        return await cursor.to_list(length=100)

    async def find_all(self, limit: int = 50) -> List[dict]:
        """
        Get most recent intake submissions

        Args:
            limit: Maximum number of documents to return

        Returns:
            List of intake documents sorted by created_at descending
        """
        cursor = self.collection.find().sort("created_at", -1).limit(limit)
        return await cursor.to_list(length=limit)

    async def count(self) -> int:
        """
        Get total count of intake submissions

        Returns:
            Total number of documents in collection
        """
        return await self.collection.count_documents({})
