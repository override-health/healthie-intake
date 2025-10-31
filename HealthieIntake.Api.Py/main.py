"""
Healthie Intake API - Python FastAPI version
Exact port of HealthieIntake.Api (.NET) to Python
"""
from fastapi import FastAPI, HTTPException, status, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Dict, Any
import logging

from config import settings
from models import Patient, PatientSearchRequest, CustomModuleForm, FormAnswerGroupInput, IntakeSubmission
from services import HealthieApiClient
from repositories import IntakeRepository
from database import get_session, init_db

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


# Startup event to initialize database tables
@app.on_event("startup")
async def startup():
    """Initialize PostgreSQL database tables on startup"""
    await init_db()
    logger.info("PostgreSQL database initialized")


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


@app.post("/api/healthie/patients/search", response_model=List[Patient])
async def search_patients(request: PatientSearchRequest):
    """
    Search for patients by name and date of birth

    Returns list of matching patients from Healthie.
    """
    try:
        patients = await healthie_client.search_patients_async(
            first_name=request.first_name,
            last_name=request.last_name,
            dob=request.dob
        )
        return patients
    except Exception as e:
        logger.error(f"Error searching patients: {str(e)}")
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


# ============================================================================
# NEW: PostgreSQL Intake Endpoints with Draft Support
# ============================================================================

@app.get("/api/intake/draft/{healthie_id}")
async def get_draft(
    healthie_id: str,
    session: AsyncSession = Depends(get_session)
):
    """
    Get draft progress for a patient by Healthie ID

    Returns most recent draft if exists, otherwise 404.
    """
    try:
        repo = IntakeRepository(session)
        draft = await repo.get_draft_by_healthie_id(healthie_id)
        if not draft:
            raise HTTPException(status_code=404, detail="No draft found for this patient")
        return draft
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching draft for {healthie_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/intake/completed/{healthie_id}")
async def check_completed_intake(
    healthie_id: str,
    session: AsyncSession = Depends(get_session)
):
    """
    Check if a completed intake exists for this patient

    Returns intake info if completed intake exists, otherwise 404.
    Used to prevent duplicate submissions.
    """
    try:
        repo = IntakeRepository(session)

        # Check if a completed intake exists
        from sqlalchemy import select
        from models.database import IntakeRecord

        result = await session.execute(
            select(IntakeRecord)
            .where(IntakeRecord.patient_healthie_id == healthie_id)
            .where(IntakeRecord.status == 'completed')
            .order_by(IntakeRecord.submitted_at.desc())
        )
        completed_intake = result.scalar_one_or_none()

        if not completed_intake:
            raise HTTPException(status_code=404, detail="No completed intake found")

        return {
            "intake_id": str(completed_intake.id),
            "status": completed_intake.status,
            "submitted_at": completed_intake.submitted_at.isoformat() if completed_intake.submitted_at else None,
            "message": "A completed intake form already exists for this patient"
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error checking completed intake for {healthie_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/intake/draft")
async def save_draft(
    intake: IntakeSubmission,
    session: AsyncSession = Depends(get_session)
):
    """
    Save draft progress

    Creates new draft or updates existing draft for this patient.
    """
    try:
        repo = IntakeRepository(session)

        # Ensure status is draft
        intake.status = "draft"

        draft_id = await repo.save_draft(intake)
        logger.info(f"Draft saved: {draft_id} for healthie_id {intake.patient_healthie_id}")

        return {
            "draft_id": draft_id,
            "status": "success",
            "message": "Draft saved successfully",
            "last_updated_at": intake.last_updated_at.isoformat() if intake.last_updated_at else None
        }
    except Exception as e:
        logger.error(f"Error saving draft: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/api/intake/draft/{healthie_id}")
async def delete_draft(
    healthie_id: str,
    session: AsyncSession = Depends(get_session)
):
    """
    Delete draft for a patient by Healthie ID

    Used for "Clear & Start Over" functionality.
    """
    try:
        from sqlalchemy import delete
        from models.database import IntakeRecord

        result = await session.execute(
            delete(IntakeRecord)
            .where(IntakeRecord.patient_healthie_id == healthie_id)
            .where(IntakeRecord.status == 'draft')
        )
        await session.commit()

        deleted_count = result.rowcount
        logger.info(f"Deleted {deleted_count} draft(s) for healthie_id {healthie_id}")

        return {
            "success": True,
            "deleted_count": deleted_count,
            "message": f"Draft deleted successfully"
        }
    except Exception as e:
        logger.error(f"Error deleting draft for {healthie_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/intake/submit")
async def submit_intake(
    intake: IntakeSubmission,
    session: AsyncSession = Depends(get_session)
):
    """
    Submit intake form to PostgreSQL

    Updates existing draft to 'completed' status or creates new completed record.
    Healthie sync will be handled by AWS Lambda later.
    """
    try:
        repo = IntakeRepository(session)

        # Set status to completed and add submitted_at timestamp
        intake.status = "completed"
        from datetime import datetime
        intake.submitted_at = datetime.utcnow()

        # Check if draft exists
        draft = await repo.get_draft_by_healthie_id(intake.patient_healthie_id)

        if draft:
            # Update existing draft with all final submission data in one operation
            from sqlalchemy import update
            from models.database import IntakeRecord
            from uuid import UUID

            await session.execute(
                update(IntakeRecord)
                .where(IntakeRecord.id == UUID(draft['id']))
                .values(
                    status='completed',
                    submitted_at=datetime.utcnow(),
                    last_updated_at=datetime.utcnow(),
                    first_name=intake.first_name,
                    last_name=intake.last_name,
                    email=intake.email,
                    date_of_birth=intake.date_of_birth,
                    phone=intake.phone,
                    form_data=intake.form_data
                )
            )
            await session.commit()

            intake_id = draft['id']
            logger.info(f"Draft updated to completed: {intake_id} for {intake.email}")
        else:
            # No draft exists, create new completed record
            intake_id = await repo.save(intake)
            logger.info(f"New intake submitted: {intake_id} for {intake.email}")

        return {
            "intake_id": intake_id,
            "status": "success",
            "message": "Intake submission saved successfully"
        }
    except Exception as e:
        logger.error(f"Error saving intake: {str(e)}")
        logger.exception("Full traceback:")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/intake/list")
async def list_intakes(
    limit: int = 50,
    session: AsyncSession = Depends(get_session)
):
    """
    List recent intake submissions

    For testing/debugging purposes. Shows most recent intakes.
    """
    try:
        repo = IntakeRepository(session)
        intakes = await repo.find_all(limit=limit)
        count = await repo.count()

        return {
            "total_count": count,
            "returned_count": len(intakes),
            "intakes": intakes
        }
    except Exception as e:
        logger.error(f"Error listing intakes: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/intake/{intake_id}")
async def get_intake(
    intake_id: str,
    session: AsyncSession = Depends(get_session)
):
    """
    Get intake submission by ID

    Returns the complete intake record from PostgreSQL.
    """
    try:
        repo = IntakeRepository(session)
        intake = await repo.find_by_id(intake_id)
        if not intake:
            raise HTTPException(status_code=404, detail="Intake not found")
        return intake
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching intake {intake_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/intake/patient/{email}")
async def get_patient_intakes(
    email: str,
    session: AsyncSession = Depends(get_session)
):
    """
    Get all intake submissions for a patient email

    Returns list of intakes sorted by most recent first.
    """
    try:
        repo = IntakeRepository(session)
        intakes = await repo.find_by_email(email)

        return {
            "email": email,
            "count": len(intakes),
            "intakes": intakes
        }
    except Exception as e:
        logger.error(f"Error fetching intakes for {email}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/health")
async def health_check(session: AsyncSession = Depends(get_session)):
    """
    Health check endpoint for monitoring

    Returns status of both Healthie connection and PostgreSQL database.
    """
    db_status = "unknown"
    try:
        repo = IntakeRepository(session)
        count = await repo.count()
        db_status = f"connected ({count} intakes)"
    except Exception as e:
        db_status = f"error: {str(e)}"

    return {
        "status": "healthy",
        "database": {
            "type": "postgresql",
            "status": db_status
        },
        "healthie_api": {
            "url": settings.healthie_api_url,
            "configured": bool(settings.healthie_api_key)
        }
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=settings.host,
        port=settings.port,
        reload=True,
        log_level="info"
    )
