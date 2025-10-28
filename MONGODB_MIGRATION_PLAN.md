# MongoDB Atlas Migration Plan
## Healthie Intake Form Rearchitecture

**Date:** 2025-10-28
**Goal:** Decouple intake form from Healthie EMR, use MongoDB Atlas for flexible schema
**Timeline:** 3-4 weeks (can be compressed with focused effort)

---

## Executive Summary

This plan outlines the migration from Healthie-dependent architecture to a clean, MongoDB-based system that stores intake form submissions independently. An AWS Lambda will handle Healthie synchronization separately (future phase).

### Why MongoDB Atlas?

1. **Schema Evolution Without Pain**: Add/change form questions without database migrations
2. **Form Versioning Built-In**: Multiple form versions coexist naturally in same collection
3. **Perfect Impedance Match**: 48 React state variables map directly to single document
4. **AWS Lambda Friendly**: Official MongoDB Lambda layer, easier cold starts
5. **Faster Development**: No migration scripts slow down iteration
6. **Managed Service**: Backups, scaling, monitoring handled by Atlas

---

## Architecture Overview

### Current Architecture (Tightly Coupled)
```
┌─────────────┐      ┌──────────────┐      ┌─────────────────┐
│  React UI   │─────▶│  Python API  │─────▶│  Healthie EMR   │
│  (48 vars)  │      │  (FastAPI)   │      │  (GraphQL API)  │
└─────────────┘      └──────────────┘      └─────────────────┘
     Vite                Port 5096           External Service
   Port 5173
```

**Problems:**
- 18+ hardcoded Healthie module IDs
- Form changes require Healthie API updates
- Tight coupling prevents independent development
- Schema changes require coordinated updates

### Target Architecture (Decoupled)
```
┌─────────────┐      ┌──────────────┐      ┌─────────────────┐
│  React UI   │─────▶│  Python API  │─────▶│  MongoDB Atlas  │
│  (Domain)   │      │  (FastAPI)   │      │  (Flexible DB)  │
└─────────────┘      └──────────────┘      └─────────────────┘
                            │
                            │ (Future Phase)
                            ▼
                     ┌──────────────┐      ┌─────────────────┐
                     │  AWS Lambda  │─────▶│  Healthie EMR   │
                     │   (Sync)     │      │  (GraphQL API)  │
                     └──────────────┘      └─────────────────┘
```

**Benefits:**
- Form ownership and control
- Zero-downtime schema changes
- Independent development cycles
- Easy A/B testing of form variations
- Reduced external dependencies

---

## MongoDB Document Structure

### Intake Submission Document
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "schema_version": "2.0",
  "created_at": "2025-10-28T14:30:00Z",
  "updated_at": "2025-10-28T14:35:00Z",
  "status": "submitted",

  "patient_info": {
    "first_name": "John",
    "last_name": "Doe",
    "date_of_birth": "1990-05-15",
    "email": "john.doe@example.com",
    "phone": "(555) 123-4567",
    "gender": "Male",
    "preferred_pronouns": "He/Him"
  },

  "emergency_contact": {
    "name": "Jane Doe",
    "relationship": "Spouse",
    "phone": "(555) 987-6543"
  },

  "insurance": {
    "provider": "Blue Cross",
    "policy_number": "ABC123456",
    "group_number": "GRP789",
    "subscriber_name": "John Doe"
  },

  "medical_history": {
    "current_medications": ["Lisinopril 10mg", "Metformin 500mg"],
    "medication_allergies": ["Penicillin"],
    "surgical_history": ["Appendectomy"],
    "surgical_history_details": "Appendectomy in 2015, no complications",
    "chronic_conditions": ["Type 2 Diabetes", "Hypertension"],
    "family_history": ["Diabetes", "Heart Disease"],
    "family_history_details": "Mother has Type 2 diabetes, Father had heart attack at 65"
  },

  "current_treatment": {
    "current_providers": ["Dr. Smith - Primary Care", "Dr. Jones - Endocrinology"],
    "previous_therapy": "Yes",
    "previous_therapy_helpful": "Somewhat helpful",
    "current_medications_list": ["Lisinopril", "Metformin"],
    "supplements": ["Vitamin D", "Fish Oil"]
  },

  "lifestyle_factors": {
    "engages_in_physical_activity": "Yes",
    "physical_activity_description": "Running 3x per week for 30 minutes, weight training 2x per week",
    "sleep_hours": "7",
    "diet_description": "Mediterranean diet, mostly plant-based",
    "caffeine_intake": "2 cups coffee per day",
    "alcohol_use": "Occasional",
    "tobacco_use": "Never"
  },

  "mental_health": {
    "substance_use": ["Alcohol - Occasional"],
    "substance_use_details": "1-2 drinks on weekends only",
    "trauma_history": "No",
    "unhealthy_relationship": "No",
    "current_stressors": "Work deadlines, financial planning",
    "support_system": "Spouse, close friends, family nearby"
  },

  "intake_goals": {
    "reason_for_visit": "Annual physical and diabetes management",
    "treatment_goals": ["Better glucose control", "Lose 15 pounds", "Improve energy levels"],
    "expectations": "Regular monitoring and medication adjustment as needed"
  },

  "metadata": {
    "submitted_from_ip": "192.168.1.100",
    "user_agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)...",
    "completion_time_seconds": 420,
    "form_version": "2.0",
    "submission_date": "2025-10-28",
    "healthie_sync_status": "pending",
    "healthie_patient_id": null
  }
}
```

### Schema Versioning Strategy
```json
{
  "schema_version": "1.0",  // Initial form
  "created_at": "2025-10-01T10:00:00Z",
  // ... v1 fields only
}

{
  "schema_version": "2.0",  // Added physical activity questions
  "created_at": "2025-10-28T10:00:00Z",
  "lifestyle_factors": {
    "engages_in_physical_activity": "Yes",  // NEW in v2.0
    "physical_activity_description": "..."   // NEW in v2.0
  }
}

{
  "schema_version": "2.1",  // Added nutrition section
  "created_at": "2025-11-15T10:00:00Z",
  "nutrition": {             // NEW in v2.1
    "daily_water_intake": "8 glasses",
    "dietary_restrictions": ["Gluten-free"]
  }
}
```

### Indexes
```javascript
// Primary lookups
db.intakes.createIndex({ "patient_info.email": 1 })
db.intakes.createIndex({ "created_at": -1 })
db.intakes.createIndex({ "status": 1 })

// Healthie sync tracking
db.intakes.createIndex({ "metadata.healthie_sync_status": 1 })
db.intakes.createIndex({ "metadata.healthie_patient_id": 1 })

// Schema version queries
db.intakes.createIndex({ "schema_version": 1 })

// Full-text search (Atlas Search)
db.intakes.createIndex({
  "patient_info.first_name": "text",
  "patient_info.last_name": "text",
  "patient_info.email": "text"
})
```

---

## Implementation Plan

### Phase 1: MongoDB Atlas Setup (Days 1-2)

**Tasks:**
1. Create MongoDB Atlas account (Free tier: M0)
2. Create cluster: `healthie-intake-cluster`
3. Create database: `healthie_intake`
4. Create collection: `intakes`
5. Configure network access (IP whitelist or 0.0.0.0/0 for dev)
6. Create database user with read/write permissions
7. Get connection string
8. Set up Atlas Search indexes (optional, for future search features)

**Deliverables:**
- MongoDB Atlas cluster running
- Connection string stored in `.env`
- Database user credentials secured

**Configuration:**
```bash
# .env
MONGODB_URI=mongodb+srv://user:password@healthie-intake-cluster.xxxxx.mongodb.net/healthie_intake?retryWrites=true&w=majority
MONGODB_DATABASE=healthie_intake
MONGODB_COLLECTION=intakes
```

---

### Phase 2: Domain Models (Days 3-4)

**Goal:** Create clean Pydantic models representing intake form data

**File:** `models/domain/intake.py`

```python
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, EmailStr, validator

class PatientInfo(BaseModel):
    first_name: str
    last_name: str
    date_of_birth: str
    email: EmailStr
    phone: str
    gender: Optional[str]
    preferred_pronouns: Optional[str]

class EmergencyContact(BaseModel):
    name: str
    relationship: str
    phone: str

class Insurance(BaseModel):
    provider: Optional[str]
    policy_number: Optional[str]
    group_number: Optional[str]
    subscriber_name: Optional[str]

class MedicalHistory(BaseModel):
    current_medications: Optional[List[str]]
    medication_allergies: Optional[List[str]]
    surgical_history: Optional[List[str]]
    surgical_history_details: Optional[str]
    chronic_conditions: Optional[List[str]]
    family_history: Optional[List[str]]
    family_history_details: Optional[str]

class CurrentTreatment(BaseModel):
    current_providers: Optional[List[str]]
    previous_therapy: Optional[str]
    previous_therapy_helpful: Optional[str]
    current_medications_list: Optional[List[str]]
    supplements: Optional[List[str]]

class LifestyleFactors(BaseModel):
    engages_in_physical_activity: Optional[str]
    physical_activity_description: Optional[str]
    sleep_hours: Optional[str]
    diet_description: Optional[str]
    caffeine_intake: Optional[str]
    alcohol_use: Optional[str]
    tobacco_use: Optional[str]

class MentalHealth(BaseModel):
    substance_use: Optional[List[str]]
    substance_use_details: Optional[str]
    trauma_history: Optional[str]
    unhealthy_relationship: Optional[str]
    unhealthy_relationship_details: Optional[str]
    current_stressors: Optional[str]
    support_system: Optional[str]

class IntakeGoals(BaseModel):
    reason_for_visit: Optional[str]
    treatment_goals: Optional[List[str]]
    expectations: Optional[str]

class IntakeMetadata(BaseModel):
    submitted_from_ip: Optional[str]
    user_agent: Optional[str]
    completion_time_seconds: Optional[int]
    form_version: str = "2.0"
    submission_date: str
    healthie_sync_status: str = "pending"
    healthie_patient_id: Optional[str] = None

class IntakeSubmission(BaseModel):
    schema_version: str = "2.0"
    created_at: datetime
    updated_at: datetime
    status: str = "submitted"

    patient_info: PatientInfo
    emergency_contact: Optional[EmergencyContact]
    insurance: Optional[Insurance]
    medical_history: Optional[MedicalHistory]
    current_treatment: Optional[CurrentTreatment]
    lifestyle_factors: Optional[LifestyleFactors]
    mental_health: Optional[MentalHealth]
    intake_goals: Optional[IntakeGoals]
    metadata: IntakeMetadata

    def to_dict(self):
        """Convert to dictionary, excluding None values"""
        return self.dict(exclude_none=True)

    @validator('created_at', 'updated_at', pre=True, always=True)
    def set_timestamps(cls, v):
        return v or datetime.utcnow()
```

**Deliverables:**
- Complete domain model hierarchy
- Pydantic validation
- Type safety throughout
- Clean separation of concerns

---

### Phase 3: Repository Layer (Days 5-6)

**Goal:** Abstract MongoDB operations behind clean interface

**File:** `repositories/intake_repository.py`

```python
from motor.motor_asyncio import AsyncIOMotorClient
from typing import Optional, List
from models.domain.intake import IntakeSubmission
from bson import ObjectId
import os

class IntakeRepository:
    def __init__(self, mongo_uri: str = None):
        uri = mongo_uri or os.getenv("MONGODB_URI")
        self.client = AsyncIOMotorClient(uri)
        self.db = self.client[os.getenv("MONGODB_DATABASE", "healthie_intake")]
        self.collection = self.db[os.getenv("MONGODB_COLLECTION", "intakes")]

    async def save(self, intake: IntakeSubmission) -> str:
        """Save intake submission and return document ID"""
        result = await self.collection.insert_one(intake.to_dict())
        return str(result.inserted_id)

    async def find_by_id(self, intake_id: str) -> Optional[dict]:
        """Find intake by MongoDB ObjectId"""
        return await self.collection.find_one({"_id": ObjectId(intake_id)})

    async def find_by_email(self, email: str) -> List[dict]:
        """Find all intakes for a patient email"""
        cursor = self.collection.find({"patient_info.email": email})
        return await cursor.to_list(length=100)

    async def find_by_status(self, status: str) -> List[dict]:
        """Find intakes by status (submitted, synced, failed)"""
        cursor = self.collection.find({"status": status})
        return await cursor.to_list(length=100)

    async def find_pending_sync(self) -> List[dict]:
        """Find intakes pending Healthie sync"""
        cursor = self.collection.find({
            "metadata.healthie_sync_status": "pending"
        })
        return await cursor.to_list(length=100)

    async def update_sync_status(self, intake_id: str, status: str,
                                 healthie_patient_id: Optional[str] = None):
        """Update Healthie sync status"""
        update_doc = {"metadata.healthie_sync_status": status}
        if healthie_patient_id:
            update_doc["metadata.healthie_patient_id"] = healthie_patient_id

        await self.collection.update_one(
            {"_id": ObjectId(intake_id)},
            {"$set": update_doc}
        )

    async def find_by_schema_version(self, version: str) -> List[dict]:
        """Find all intakes with specific schema version"""
        cursor = self.collection.find({"schema_version": version})
        return await cursor.to_list(length=100)

    async def get_recent_intakes(self, limit: int = 50) -> List[dict]:
        """Get most recent intake submissions"""
        cursor = self.collection.find().sort("created_at", -1).limit(limit)
        return await cursor.to_list(length=limit)
```

**Additional File:** `repositories/__init__.py`
```python
from .intake_repository import IntakeRepository

__all__ = ['IntakeRepository']
```

**Deliverables:**
- Clean repository interface
- Async MongoDB operations using Motor
- All CRUD operations
- Query methods for common use cases
- Healthie sync status tracking

---

### Phase 4: Service Layer (Days 7-8)

**Goal:** Business logic and orchestration

**File:** `services/intake_service.py`

```python
from datetime import datetime
from models.domain.intake import IntakeSubmission
from repositories.intake_repository import IntakeRepository
from typing import Optional, List

class IntakeService:
    def __init__(self, repository: IntakeRepository):
        self.repository = repository

    async def submit_intake(self, intake_data: dict) -> dict:
        """
        Process and save intake submission

        Returns:
            dict with intake_id and status
        """
        # Create domain model from raw data
        intake = IntakeSubmission(**intake_data)

        # Set timestamps
        intake.created_at = datetime.utcnow()
        intake.updated_at = datetime.utcnow()

        # Save to MongoDB
        intake_id = await self.repository.save(intake)

        return {
            "intake_id": intake_id,
            "status": "submitted",
            "message": "Intake submission saved successfully"
        }

    async def get_intake(self, intake_id: str) -> Optional[dict]:
        """Retrieve intake by ID"""
        return await self.repository.find_by_id(intake_id)

    async def get_patient_intakes(self, email: str) -> List[dict]:
        """Get all intakes for a patient"""
        return await self.repository.find_by_email(email)

    async def get_pending_sync(self) -> List[dict]:
        """Get intakes pending Healthie sync (for Lambda)"""
        return await self.repository.find_pending_sync()

    async def mark_synced(self, intake_id: str, healthie_patient_id: str):
        """Mark intake as synced to Healthie"""
        await self.repository.update_sync_status(
            intake_id,
            "synced",
            healthie_patient_id
        )

    async def mark_sync_failed(self, intake_id: str):
        """Mark intake sync as failed"""
        await self.repository.update_sync_status(intake_id, "failed")
```

**Deliverables:**
- Business logic layer
- Validation and error handling
- Clean service interface
- Separation from data access

---

### Phase 5: API Endpoints (Days 9-10)

**Goal:** Update FastAPI endpoints to use new architecture

**File:** `main.py` (Update existing file)

```python
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from models.domain.intake import IntakeSubmission
from repositories.intake_repository import IntakeRepository
from services.intake_service import IntakeService
import os

app = FastAPI(title="Healthie Intake API", version="2.0")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # React dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize repository and service
repository = IntakeRepository()
intake_service = IntakeService(repository)

@app.get("/")
async def root():
    return {"message": "Healthie Intake API v2.0 - MongoDB"}

@app.post("/api/intake/submit")
async def submit_intake(intake: IntakeSubmission, request: Request):
    """
    Submit a new intake form

    Body: IntakeSubmission (Pydantic model)
    Returns: {intake_id, status, message}
    """
    try:
        # Add metadata from request
        intake_dict = intake.dict()
        intake_dict["metadata"]["submitted_from_ip"] = request.client.host
        intake_dict["metadata"]["user_agent"] = request.headers.get("user-agent", "")

        result = await intake_service.submit_intake(intake_dict)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/intake/{intake_id}")
async def get_intake(intake_id: str):
    """Get intake submission by ID"""
    intake = await intake_service.get_intake(intake_id)
    if not intake:
        raise HTTPException(status_code=404, detail="Intake not found")

    # Convert ObjectId to string for JSON serialization
    intake["_id"] = str(intake["_id"])
    return intake

@app.get("/api/intake/patient/{email}")
async def get_patient_intakes(email: str):
    """Get all intake submissions for a patient email"""
    intakes = await intake_service.get_patient_intakes(email)

    # Convert ObjectIds to strings
    for intake in intakes:
        intake["_id"] = str(intake["_id"])

    return intakes

@app.get("/api/intake/sync/pending")
async def get_pending_sync():
    """
    Get intakes pending Healthie sync
    Used by AWS Lambda for background sync
    """
    intakes = await intake_service.get_pending_sync()

    for intake in intakes:
        intake["_id"] = str(intake["_id"])

    return intakes

@app.post("/api/intake/{intake_id}/sync/complete")
async def mark_synced(intake_id: str, healthie_patient_id: str):
    """Mark intake as synced to Healthie (called by Lambda)"""
    await intake_service.mark_synced(intake_id, healthie_patient_id)
    return {"status": "synced"}

@app.post("/api/intake/{intake_id}/sync/failed")
async def mark_sync_failed(intake_id: str):
    """Mark intake sync as failed (called by Lambda)"""
    await intake_service.mark_sync_failed(intake_id)
    return {"status": "failed"}

# Health check for monitoring
@app.get("/health")
async def health_check():
    return {"status": "healthy", "database": "mongodb"}
```

**Deliverables:**
- Updated API endpoints
- MongoDB integration
- Clean request/response handling
- Error handling
- Health checks

---

### Phase 6: React UI Updates (Days 11-12)

**Goal:** Update React to submit domain objects instead of Healthie format

**File:** `IntakeForm.jsx` (Update existing)

**Key Changes:**

1. **Remove Healthie mutation logic**
2. **Create domain object from state**
3. **Submit to new API endpoint**

```javascript
// NEW: Build domain object from form state
const buildIntakeSubmission = () => {
  return {
    schema_version: "2.0",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    status: "submitted",

    patient_info: {
      first_name: firstName,
      last_name: lastName,
      date_of_birth: dateOfBirth,
      email: email,
      phone: phone,
      gender: gender,
      preferred_pronouns: preferredPronouns
    },

    emergency_contact: {
      name: emergencyContactName,
      relationship: emergencyContactRelationship,
      phone: emergencyContactPhone
    },

    insurance: {
      provider: insuranceProvider,
      policy_number: policyNumber,
      group_number: groupNumber,
      subscriber_name: subscriberName
    },

    medical_history: {
      current_medications: currentMedications,
      medication_allergies: medicationAllergies,
      surgical_history: surgicalHistory,
      surgical_history_details: surgicalHistoryDetails,
      chronic_conditions: chronicConditions,
      family_history: familyHistory,
      family_history_details: familyHistoryDetails
    },

    current_treatment: {
      current_providers: currentProviders,
      previous_therapy: previousTherapy,
      previous_therapy_helpful: previousTherapyHelpful,
      current_medications_list: currentMedicationsList,
      supplements: supplements
    },

    lifestyle_factors: {
      engages_in_physical_activity: engagesInPhysicalActivity,
      physical_activity_description: physicalActivityDescription,
      sleep_hours: sleepHours,
      diet_description: dietDescription,
      caffeine_intake: caffeineIntake,
      alcohol_use: alcoholUse,
      tobacco_use: tobaccoUse
    },

    mental_health: {
      substance_use: substanceUse,
      substance_use_details: substanceUseDetails,
      trauma_history: traumaHistory,
      unhealthy_relationship: unhealthyRelationship,
      unhealthy_relationship_details: unhealthyRelationshipDetails,
      current_stressors: currentStressors,
      support_system: supportSystem
    },

    intake_goals: {
      reason_for_visit: reasonForVisit,
      treatment_goals: treatmentGoals,
      expectations: expectations
    },

    metadata: {
      form_version: "2.0",
      submission_date: new Date().toISOString().split('T')[0],
      completion_time_seconds: Math.floor((Date.now() - formStartTime) / 1000),
      healthie_sync_status: "pending",
      healthie_patient_id: null
    }
  };
};

// NEW: Submit to MongoDB-backed API
const handleFinalSubmit = async () => {
  setIsSubmitting(true);
  setSubmitError('');

  try {
    const intakeData = buildIntakeSubmission();

    const response = await fetch('http://localhost:5096/api/intake/submit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(intakeData)
    });

    if (!response.ok) {
      throw new Error('Submission failed');
    }

    const result = await response.json();

    // Show success message
    setSubmitSuccess(true);
    setIntakeId(result.intake_id);

    // Clear localStorage
    localStorage.removeItem('intakeFormData');

  } catch (error) {
    console.error('Submission error:', error);
    setSubmitError('Failed to submit intake form. Please try again.');
  } finally {
    setIsSubmitting(false);
  }
};
```

**Additional Changes:**
- Remove all Healthie GraphQL queries/mutations
- Remove Apollo Client dependency
- Simplify state-to-submission mapping
- Update success message

**Deliverables:**
- React UI submits domain objects
- No Healthie coupling in frontend
- Cleaner code without GraphQL complexity
- Better error handling

---

### Phase 7: Testing & Validation (Days 13-14)

**Testing Checklist:**

#### Backend Testing
- [ ] MongoDB connection successful
- [ ] Intake submission creates document
- [ ] All fields saved correctly
- [ ] Document structure matches schema
- [ ] Timestamps auto-generated
- [ ] Email queries work
- [ ] Status queries work
- [ ] Sync status updates work

#### Frontend Testing
- [ ] Form loads correctly
- [ ] All 6 steps navigate properly
- [ ] Conditional sub-questions show/hide correctly
- [ ] LocalStorage persistence works
- [ ] Final submission successful
- [ ] Success message displays
- [ ] Error handling works

#### Integration Testing
- [ ] End-to-end form submission
- [ ] Data integrity (all fields present)
- [ ] No data loss
- [ ] Performance acceptable (< 2 sec submission)

#### Schema Version Testing
- [ ] Can submit v1.0 schema
- [ ] Can submit v2.0 schema
- [ ] Both coexist in database
- [ ] Queries work across versions

**Test Data:**
Create sample intake submissions with:
- Minimal required fields
- All optional fields populated
- Various schema versions
- Different conditional logic paths

**Deliverables:**
- All tests passing
- No regressions
- Performance validated
- Documentation of any issues

---

## Dependencies Update

### Python Requirements
**File:** `requirements.txt`

```
fastapi==0.104.1
uvicorn[standard]==0.24.0
pydantic==2.5.0
motor==3.3.2          # NEW: Async MongoDB driver
pymongo==4.6.0        # NEW: MongoDB driver (used by motor)
python-dotenv==1.0.0
httpx==0.25.1
```

### Install Commands
```bash
cd HealthieIntake.Api.Py
source venv/bin/activate
pip install motor pymongo
pip freeze > requirements.txt
```

### Remove Old Dependencies (Optional)
If no longer using Healthie GraphQL:
```bash
pip uninstall gql aiohttp graphql-core
```

---

## Environment Configuration

### .env File Updates
```bash
# MongoDB Atlas
MONGODB_URI=mongodb+srv://username:password@cluster.xxxxx.mongodb.net/healthie_intake?retryWrites=true&w=majority
MONGODB_DATABASE=healthie_intake
MONGODB_COLLECTION=intakes

# Application
API_HOST=0.0.0.0
API_PORT=5096
CORS_ORIGINS=http://localhost:5173

# Healthie (Keep for future Lambda sync)
HEALTHIE_API_KEY=your_api_key_here
HEALTHIE_API_URL=https://staging-api.gethealthie.com/graphql
```

### .env.example Template
```bash
# MongoDB Atlas Configuration
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database>?retryWrites=true&w=majority
MONGODB_DATABASE=healthie_intake
MONGODB_COLLECTION=intakes

# Application Settings
API_HOST=0.0.0.0
API_PORT=5096
CORS_ORIGINS=http://localhost:5173

# Healthie EMR (for future Lambda sync)
HEALTHIE_API_KEY=
HEALTHIE_API_URL=https://staging-api.gethealthie.com/graphql
```

---

## Directory Structure (After Migration)

```
healthie-intake/
├── HealthieIntake.Api.Py/
│   ├── models/
│   │   ├── __init__.py
│   │   └── domain/
│   │       ├── __init__.py
│   │       └── intake.py                  # NEW: Pydantic domain models
│   ├── repositories/
│   │   ├── __init__.py
│   │   └── intake_repository.py           # NEW: MongoDB repository
│   ├── services/
│   │   ├── __init__.py
│   │   └── intake_service.py              # NEW: Business logic
│   ├── main.py                             # UPDATED: New endpoints
│   ├── requirements.txt                    # UPDATED: Add motor, pymongo
│   ├── .env                                # UPDATED: MongoDB URI
│   └── .env.example                        # NEW: Template
├── HealthieIntake.UI.React/
│   └── src/
│       └── components/
│           └── IntakeForm.jsx              # UPDATED: Remove Healthie, use domain objects
├── CONVERSATION_HISTORY.md                 # NEW: This conversation
├── MONGODB_MIGRATION_PLAN.md               # NEW: This document
└── README.md                               # UPDATE: Reflect new architecture
```

---

## Rollback Plan

If migration needs to be rolled back:

### Quick Rollback (< 1 hour)
1. Revert to previous git commit:
   ```bash
   git checkout main  # or previous stable branch
   ```
2. Restart Python API with old code
3. MongoDB data preserved for retry

### Partial Rollback
Keep MongoDB but use old Healthie submission as backup:
1. Add dual-write: Save to both MongoDB AND Healthie
2. Validate MongoDB data
3. Eventually remove Healthie writes

### Data Migration Back to Healthie
If needed to sync all MongoDB data to Healthie:
1. Use AWS Lambda (future phase)
2. Batch process all pending intakes
3. Update sync status

---

## Future Enhancements (Post-Migration)

### Phase 8: AWS Lambda Sync (Future)
**Goal:** Background sync from MongoDB to Healthie

**Architecture:**
```
CloudWatch Event (every 5 min)
         ↓
    AWS Lambda
         ↓
   Query MongoDB (pending intakes)
         ↓
   Healthie GraphQL API
         ↓
   Update MongoDB (sync status)
```

**Implementation:**
- Python Lambda function
- Query `/api/intake/sync/pending`
- Submit to Healthie GraphQL
- Call `/api/intake/{id}/sync/complete`

**Timeline:** 1-2 weeks after main migration

### Phase 9: Admin Dashboard
- View all intake submissions
- Search by patient email
- Filter by status, date
- Export to CSV
- Retry failed syncs

### Phase 10: Analytics
- Submission volume over time
- Completion rates by step
- Drop-off analysis
- Field-level analytics
- Schema version distribution

### Phase 11: Advanced Features
- Patient portal (view own submissions)
- Multi-language support
- PDF export
- Email notifications
- Webhooks for integrations

---

## Success Criteria

### Technical Metrics
- ✅ Zero downtime during migration
- ✅ All form submissions saved to MongoDB
- ✅ API response time < 500ms
- ✅ 100% data integrity (no field loss)
- ✅ Schema versioning working

### Business Metrics
- ✅ Form can be updated without code deployment
- ✅ New questions added in < 1 hour (vs days)
- ✅ A/B testing enabled
- ✅ Independent from Healthie downtime
- ✅ Healthie sync decoupled (future AWS Lambda)

### Developer Experience
- ✅ Clean domain models
- ✅ Type safety with Pydantic
- ✅ Easy to test
- ✅ Simple to extend
- ✅ Clear documentation

---

## Risk Mitigation

### Risk: Data Loss During Migration
**Mitigation:**
- Keep Healthie submission as backup initially
- Dual-write to both systems temporarily
- Validate MongoDB saves before removing Healthie

### Risk: MongoDB Atlas Costs
**Mitigation:**
- Start with free M0 cluster (512MB)
- Monitor usage closely
- Set billing alerts
- Upgrade only when needed ($60/mo for M10)

### Risk: Schema Evolution Complexity
**Mitigation:**
- Document schema versions clearly
- Use semantic versioning (1.0, 2.0, 2.1)
- Add migration helpers for major changes
- Keep old schema handling for 6 months

### Risk: Performance at Scale
**Mitigation:**
- Implement proper indexes from day 1
- Monitor query performance
- Use MongoDB Atlas performance advisor
- Plan sharding strategy if needed

---

## Timeline Summary

### Conservative Timeline (3-4 weeks)
- **Days 1-2**: MongoDB Atlas setup
- **Days 3-4**: Domain models
- **Days 5-6**: Repository layer
- **Days 7-8**: Service layer
- **Days 9-10**: API endpoints
- **Days 11-12**: React UI updates
- **Days 13-14**: Testing & validation

### Aggressive Timeline (1.5-2 weeks)
- **Days 1-3**: MongoDB + Domain models + Repository
- **Days 4-6**: Service layer + API endpoints
- **Days 7-9**: React UI updates
- **Days 10**: Testing & validation

### Key Milestones
- ✅ **Day 2**: MongoDB cluster running, connection tested
- ✅ **Day 4**: Domain models complete, validated
- ✅ **Day 6**: Repository CRUD operations working
- ✅ **Day 8**: API endpoints functional
- ✅ **Day 12**: React UI submitting to new API
- ✅ **Day 14**: All testing complete, production-ready

---

## Support & Resources

### MongoDB Atlas Resources
- Docs: https://www.mongodb.com/docs/atlas/
- Motor (Async Driver): https://motor.readthedocs.io/
- Python Tutorial: https://www.mongodb.com/languages/python

### FastAPI + MongoDB
- Tutorial: https://www.mongodb.com/languages/python/pymongo-tutorial
- FastAPI Best Practices: https://fastapi.tiangolo.com/tutorial/

### Healthie API (for future Lambda)
- Docs: https://docs.gethealthie.com/
- GraphQL Explorer: https://staging-api.gethealthie.com/graphql

---

## Questions to Resolve

1. **Timeline**: Can we compress to 1.5-2 weeks with focused effort?
2. **Patient ID**: Should we generate our own patient IDs or use email as identifier?
3. **Dual-Write**: Want to dual-write to Healthie during transition?
4. **Testing**: Unit tests required or manual testing sufficient?
5. **Deployment**: Docker containers? AWS Lambda? EC2?

---

## Document Status

**Version:** 1.0
**Created:** 2025-10-28
**Author:** Claude Code AI Assistant
**Status:** Ready for Review
**Next Steps:** Await user approval to begin Phase 1
