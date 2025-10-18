"""
Healthie Intake API - Python FastAPI version
Exact port of HealthieIntake.Api (.NET) to Python
"""
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from typing import List, Dict, Any
import logging

from config import settings
from models import Patient, CustomModuleForm, FormAnswerGroupInput
from services import HealthieApiClient

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="Healthie Intake API (Python)",
    description="Python FastAPI port of HealthieIntake.Api (.NET)",
    version="1.0.0"
)

# Configure CORS (matching .NET API configuration)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Healthie API client
healthie_client = HealthieApiClient(
    api_url=settings.healthie_api_url,
    api_key=settings.healthie_api_key
)


@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "name": "Healthie Intake API (Python)",
        "version": "1.0.0",
        "status": "running"
    }


@app.get("/api/healthie/patients/{patient_id}", response_model=Patient)
async def get_patient(patient_id: str):
    """
    Get patient by ID

    Port of: [HttpGet("patients/{patientId}")]
    """
    try:
        patient = await healthie_client.get_patient_async(patient_id)
        if not patient:
            raise HTTPException(status_code=404, detail="Patient not found")
        return patient
    except Exception as e:
        logger.error(f"Error fetching patient {patient_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/healthie/forms/{form_id}", response_model=CustomModuleForm)
async def get_form(form_id: str):
    """
    Get form structure by ID

    Port of: [HttpGet("forms/{formId}")]
    """
    try:
        form = await healthie_client.get_custom_form_async(form_id)
        if not form:
            raise HTTPException(status_code=404, detail="Form not found")

        # Post-process: Convert specific questions from 10-point scale to Yes/No
        # (Matching .NET logic in HealthieController.cs lines 42-56)
        if form.custom_modules:
            for module in form.custom_modules:
                if module.label and (
                    "Do you have any surgery upcoming" in module.label or
                    "Are you currently taking an opioid medication" in module.label or
                    "Are you currently seeing a therapist or counselor" in module.label or
                    "unhealthy relationship with alcohol, drugs, or prescription medications" in module.label
                ):
                    # Change from 10-point scale to Yes/No
                    module.options = ["Yes", "No"]

        return form
    except Exception as e:
        logger.error(f"Error fetching form {form_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/healthie/forms/submit")
async def submit_form(input_data: FormAnswerGroupInput):
    """
    Submit form answers

    Port of: [HttpPost("forms/submit")]
    """
    try:
        form_answer_group_id = await healthie_client.create_form_answer_group_async(input_data)
        return {
            "formAnswerGroupId": form_answer_group_id,
            "success": True
        }
    except Exception as e:
        logger.error(f"Error submitting form: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/healthie/patients/{patient_id}/forms", response_model=List[str])
async def get_patient_forms(patient_id: str):
    """
    Get list of form answer group IDs for a patient

    Port of: [HttpGet("patients/{patientId}/forms")]
    """
    try:
        forms = await healthie_client.get_form_answer_groups_for_patient_async(patient_id)
        return forms
    except Exception as e:
        logger.error(f"Error fetching forms for patient {patient_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/healthie/forms/details/{form_answer_group_id}")
async def get_form_details(form_answer_group_id: str):
    """
    Get form answer group details

    Port of: [HttpGet("forms/details/{formAnswerGroupId}")]
    """
    try:
        details = await healthie_client.get_form_answer_group_details_async(form_answer_group_id)
        return details
    except Exception as e:
        logger.error(f"Error fetching form details {form_answer_group_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/api/healthie/forms/{form_answer_group_id}")
async def delete_form(form_answer_group_id: str):
    """
    Delete form answer group

    Port of: [HttpDelete("forms/{formAnswerGroupId}")]
    """
    try:
        await healthie_client.delete_form_answer_group_async(form_answer_group_id)
        return {"success": True}
    except Exception as e:
        logger.error(f"Error deleting form {form_answer_group_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=settings.host,
        port=settings.port,
        reload=True,
        log_level="info"
    )
