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
