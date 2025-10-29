"""
PostgreSQL Repository for Intake Submissions

Uses SQLAlchemy async ORM with JSONB for MongoDB-like flexibility
"""
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from models.database import IntakeRecord
from models.intake import IntakeSubmission
from typing import Optional, List
from uuid import UUID


class IntakeRepository:
    """
    Repository pattern for intake submissions

    PostgreSQL with JSONB provides MongoDB-like flexibility
    while maintaining relational database benefits
    """

    def __init__(self, session: AsyncSession):
        """
        Initialize repository with database session

        Args:
            session: SQLAlchemy async session
        """
        self.session = session

    async def save(self, intake: IntakeSubmission) -> str:
        """
        Save intake submission to PostgreSQL

        Args:
            intake: IntakeSubmission Pydantic model

        Returns:
            String UUID of inserted record
        """
        # Convert Pydantic model to SQLAlchemy model
        record = IntakeRecord(
            first_name=intake.first_name,
            last_name=intake.last_name,
            email=intake.email,
            date_of_birth=intake.date_of_birth,
            phone=intake.phone,
            schema_version=intake.schema_version,
            status=intake.status,
            form_data=intake.form_data  # JSONB column - stores dict as-is
        )

        self.session.add(record)
        await self.session.commit()
        await self.session.refresh(record)

        return str(record.id)

    async def find_by_id(self, intake_id: str) -> Optional[dict]:
        """
        Find intake by UUID

        Args:
            intake_id: String UUID

        Returns:
            Dictionary representation of intake or None
        """
        try:
            uuid_id = UUID(intake_id)
            result = await self.session.execute(
                select(IntakeRecord).where(IntakeRecord.id == uuid_id)
            )
            record = result.scalar_one_or_none()
            return record.to_dict() if record else None
        except Exception:
            return None

    async def find_by_email(self, email: str) -> List[dict]:
        """
        Find all intakes for a patient email

        Args:
            email: Patient email address

        Returns:
            List of intake dictionaries sorted by newest first
        """
        result = await self.session.execute(
            select(IntakeRecord)
            .where(IntakeRecord.email == email)
            .order_by(IntakeRecord.created_at.desc())
        )
        records = result.scalars().all()
        return [r.to_dict() for r in records]

    async def find_all(self, limit: int = 50) -> List[dict]:
        """
        Get most recent intake submissions

        Args:
            limit: Maximum number of records to return

        Returns:
            List of intake dictionaries sorted by newest first
        """
        result = await self.session.execute(
            select(IntakeRecord)
            .order_by(IntakeRecord.created_at.desc())
            .limit(limit)
        )
        records = result.scalars().all()
        return [r.to_dict() for r in records]

    async def count(self) -> int:
        """
        Get total count of intake submissions

        Returns:
            Total number of intake records
        """
        result = await self.session.execute(
            select(func.count(IntakeRecord.id))
        )
        return result.scalar()

    # BONUS: JSONB query capabilities (MongoDB-like!)
    async def find_by_form_field(self, field_path: str, value: str) -> List[dict]:
        """
        Query by JSONB field path (similar to MongoDB dot notation)

        Example:
            find_by_form_field('emergency_contact.name', 'Jane Doe')
            find_by_form_field('answers.19056453', '1990-01-01')

        Args:
            field_path: Dot-separated path in form_data JSONB
            value: Value to search for

        Returns:
            List of matching intake dictionaries
        """
        # Parse field path into JSONB accessor
        path_parts = field_path.split('.')

        # Build JSONB query
        jsonb_path = IntakeRecord.form_data
        for part in path_parts:
            jsonb_path = jsonb_path[part]

        result = await self.session.execute(
            select(IntakeRecord)
            .where(jsonb_path.astext == value)
        )
        records = result.scalars().all()
        return [r.to_dict() for r in records]
