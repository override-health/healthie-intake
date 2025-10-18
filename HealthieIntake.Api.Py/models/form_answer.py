from pydantic import BaseModel, Field
from typing import List, Optional


class FormAnswerInput(BaseModel):
    """Form answer input model matching .NET FormAnswerInput class"""
    custom_module_id: str = Field(..., alias="customModuleId")
    answer: Optional[str] = Field(default=None, alias="answer")
    user_answer: Optional[str] = Field(default=None, alias="userAnswer")

    class Config:
        populate_by_name = True
        json_schema_extra = {
            "example": {
                "customModuleId": "19056452",
                "answer": "1985-05-15"
            }
        }


class FormAnswerGroupInput(BaseModel):
    """Form answer group input model matching .NET FormAnswerGroupInput class"""
    custom_module_form_id: str = Field(..., alias="customModuleFormId")
    user_id: str = Field(..., alias="userId")
    form_answers: List[FormAnswerInput] = Field(default_factory=list, alias="formAnswers")

    class Config:
        populate_by_name = True
        json_schema_extra = {
            "example": {
                "customModuleFormId": "2215494",
                "userId": "3642270",
                "formAnswers": [
                    {
                        "customModuleId": "19056452",
                        "answer": "1985-05-15"
                    }
                ]
            }
        }
