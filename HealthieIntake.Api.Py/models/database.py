"""
SQLAlchemy database models for PostgreSQL

Uses JSONB for flexible form_data storage (MongoDB-like flexibility)
"""
from sqlalchemy import Column, String, DateTime, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import declarative_base
from sqlalchemy.sql import func
import uuid

Base = declarative_base()


class IntakeRecord(Base):
    """
    PostgreSQL table for intake submissions

    Core patient demographics are indexed columns for fast queries.
    All form data goes into JSONB column for schema flexibility.
    """
    __tablename__ = "intakes"

    # Primary key (UUID for distributed systems)
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Core patient demographics (indexed for fast queries)
    first_name = Column(String(100), nullable=False, index=True)
    last_name = Column(String(100), nullable=False, index=True)
    email = Column(String(255), nullable=False, index=True)
    date_of_birth = Column(String(10), nullable=False)  # YYYY-MM-DD format
    phone = Column(String(20), nullable=True)

    # Metadata
    schema_version = Column(String(20), nullable=False, default="1.0-poc", index=True)
    status = Column(String(20), nullable=False, default="submitted", index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Flexible form data (JSONB - MongoDB-like flexibility!)
    # Can store nested objects, arrays, etc. just like MongoDB
    form_data = Column(JSONB, nullable=False, default=dict)

    def to_dict(self):
        """Convert to dictionary for API responses"""
        return {
            "id": str(self.id),
            "first_name": self.first_name,
            "last_name": self.last_name,
            "email": self.email,
            "date_of_birth": self.date_of_birth,
            "phone": self.phone,
            "schema_version": self.schema_version,
            "status": self.status,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "form_data": self.form_data
        }
