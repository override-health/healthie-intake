from pydantic import BaseModel, Field


class Patient(BaseModel):
    """Patient model matching .NET Patient class"""
    id: str = Field(default="", alias="id")
    email: str = Field(default="", alias="email")
    first_name: str = Field(default="", alias="firstName")
    last_name: str = Field(default="", alias="lastName")

    class Config:
        populate_by_name = True
        json_schema_extra = {
            "example": {
                "id": "3642270",
                "email": "patient@example.com",
                "firstName": "John",
                "lastName": "Doe"
            }
        }


class PatientSearchRequest(BaseModel):
    """Request model for patient search"""
    first_name: str = Field(..., alias="firstName", description="Patient first name")
    last_name: str = Field(..., alias="lastName", description="Patient last name")
    dob: str = Field(..., alias="dob", description="Date of birth in YYYY-MM-DD format")

    class Config:
        populate_by_name = True
        json_schema_extra = {
            "example": {
                "firstName": "Corey",
                "lastName": "Crowley",
                "dob": "1978-12-31"
            }
        }
