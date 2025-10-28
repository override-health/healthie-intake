"""
Simplified Intake Submission Model for POC

This model uses a flat structure with a flexible form_data dictionary
to allow rapid iteration during the POC phase. We can refactor to a
more structured nested model later.
"""

from datetime import datetime
from typing import Optional, Dict, Any
from pydantic import BaseModel, EmailStr, Field


class IntakeSubmission(BaseModel):
    """
    Minimal viable intake submission model

    Core fields are validated by Pydantic.
    All other form data goes into the flexible form_data dict.
    """

    # Metadata
    schema_version: str = Field(default="1.0-poc", description="Schema version for tracking form changes")
    created_at: Optional[datetime] = Field(default=None, description="Timestamp when intake was created")
    status: str = Field(default="submitted", description="Status: submitted, synced, failed")

    # Core Patient Info (validated)
    first_name: str = Field(..., min_length=1, max_length=100, description="Patient first name")
    last_name: str = Field(..., min_length=1, max_length=100, description="Patient last name")
    date_of_birth: str = Field(..., description="Patient date of birth (YYYY-MM-DD)")
    email: EmailStr = Field(..., description="Patient email address")
    phone: Optional[str] = Field(None, max_length=20, description="Patient phone number")

    # Flexible form data (everything else)
    form_data: Dict[str, Any] = Field(
        default_factory=dict,
        description="All other form fields stored as flexible dict for POC"
    )

    def __init__(self, **data):
        """Auto-set created_at timestamp if not provided"""
        if data.get('created_at') is None:
            data['created_at'] = datetime.utcnow()
        super().__init__(**data)

    class Config:
        """Pydantic config"""
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }
        json_schema_extra = {
            "example": {
                "first_name": "John",
                "last_name": "Doe",
                "date_of_birth": "1990-01-01",
                "email": "john.doe@example.com",
                "phone": "(555) 123-4567",
                "form_data": {
                    "gender": "Male",
                    "emergency_contact": {
                        "name": "Jane Doe",
                        "relationship": "Spouse",
                        "phone": "(555) 987-6543"
                    },
                    "physical_activity": "Yes",
                    "physical_activity_description": "Running 3x per week"
                }
            }
        }

    def to_dict(self) -> dict:
        """Convert to dictionary for MongoDB insertion"""
        return self.model_dump(mode='json')
