from pydantic import BaseModel, Field
from typing import List, Optional


class CustomModule(BaseModel):
    """Custom module (form field) model matching .NET CustomModule class"""
    id: str = Field(default="", alias="id")
    label: str = Field(default="", alias="label")
    mod_type: str = Field(default="", alias="modType")
    required: bool = Field(default=False, alias="required")
    options: Optional[List[str]] = Field(default=None, alias="options")

    class Config:
        populate_by_name = True
        json_schema_extra = {
            "example": {
                "id": "19056452",
                "label": "Date of birth",
                "modType": "date",
                "required": True,
                "options": None
            }
        }


class CustomModuleForm(BaseModel):
    """Custom module form model matching .NET CustomModuleForm class"""
    id: str = Field(default="", alias="id")
    name: str = Field(default="", alias="name")
    custom_modules: List[CustomModule] = Field(default_factory=list, alias="customModules")

    class Config:
        populate_by_name = True
        json_schema_extra = {
            "example": {
                "id": "2215494",
                "name": "Override App: Intake Form",
                "customModules": []
            }
        }
