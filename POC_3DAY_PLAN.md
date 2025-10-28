# 3-Day POC Plan - MongoDB Migration
## Minimum Viable Product

**Goal:** Working end-to-end intake form submission to MongoDB in 3 days
**Then:** Iterate and refine over the following week

---

## POC Scope (Minimum Viable)

### ✅ In Scope
- MongoDB Atlas free tier setup
- Basic Pydantic model (flat structure, not nested)
- Simple repository (save + find_by_email)
- One API endpoint: POST /api/intake/submit
- React UI update: remove Healthie, submit to new endpoint
- Manual testing

### ❌ Out of Scope (for POC)
- Complex nested models (keep it flat initially)
- Service layer (call repository directly from API)
- Sync status tracking (add later)
- Comprehensive error handling
- Unit tests
- Admin endpoints

---

## 3-Day Timeline

### Day 1: Database + Models (4-6 hours)

#### Morning: MongoDB Atlas Setup (1-2 hours)
```bash
# Tasks:
1. Create MongoDB Atlas account (free)
2. Create cluster (M0 free tier)
3. Database: healthie_intake
4. Collection: intakes
5. Create DB user
6. Whitelist IP: 0.0.0.0/0 (dev only)
7. Get connection string
8. Test connection
```

**Environment:**
```bash
# .env
MONGODB_URI=mongodb+srv://user:pass@cluster.xxxxx.mongodb.net/healthie_intake?retryWrites=true&w=majority
```

#### Afternoon: Minimal Domain Model (2-4 hours)

**File:** `models/intake.py` (simplified, flat structure)

```python
from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, EmailStr

class IntakeSubmission(BaseModel):
    """
    Simplified flat model for POC
    All form fields at top level for speed
    """
    # Metadata
    schema_version: str = "1.0-poc"
    created_at: datetime = None
    status: str = "submitted"

    # Patient Info
    first_name: str
    last_name: str
    date_of_birth: str
    email: EmailStr
    phone: Optional[str]

    # Form data (store as flexible dict for POC)
    form_data: Dict[str, Any]

    def __init__(self, **data):
        if data.get('created_at') is None:
            data['created_at'] = datetime.utcnow()
        super().__init__(**data)

    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }
```

**Why this works for POC:**
- Fast to implement
- Flexible (form_data can hold anything)
- Can refactor to nested structure later
- Pydantic validates core fields
- Everything else goes in form_data dict

#### Evening: Repository (1 hour)

**File:** `repositories/intake_repository.py`

```python
from motor.motor_asyncio import AsyncIOMotorClient
from models.intake import IntakeSubmission
import os

class IntakeRepository:
    def __init__(self):
        uri = os.getenv("MONGODB_URI")
        self.client = AsyncIOMotorClient(uri)
        self.db = self.client.healthie_intake
        self.collection = self.db.intakes

    async def save(self, intake: IntakeSubmission) -> str:
        doc = intake.dict()
        result = await self.collection.insert_one(doc)
        return str(result.inserted_id)

    async def find_by_email(self, email: str):
        cursor = self.collection.find({"email": email})
        return await cursor.to_list(length=100)
```

**End of Day 1 Deliverable:**
- MongoDB cluster running
- Connection working
- Models defined
- Repository tested

---

### Day 2: API + Basic Testing (4-6 hours)

#### Morning: Update main.py (2-3 hours)

**File:** `main.py`

```python
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from models.intake import IntakeSubmission
from repositories.intake_repository import IntakeRepository

app = FastAPI()

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Repository
repo = IntakeRepository()

@app.get("/")
async def root():
    return {"message": "POC API", "db": "mongodb"}

@app.post("/api/intake/submit")
async def submit_intake(intake: IntakeSubmission):
    try:
        intake_id = await repo.save(intake)
        return {
            "intake_id": intake_id,
            "status": "success"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/intake/test/{email}")
async def test_find(email: str):
    """Test endpoint to verify saves"""
    results = await repo.find_by_email(email)
    for r in results:
        r["_id"] = str(r["_id"])
    return results
```

#### Afternoon: Test API (1-2 hours)

**Install dependencies:**
```bash
cd HealthieIntake.Api.Py
source venv/bin/activate
pip install motor pymongo
```

**Test with curl:**
```bash
curl -X POST http://localhost:5096/api/intake/submit \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "Test",
    "last_name": "Patient",
    "date_of_birth": "1990-01-01",
    "email": "test@example.com",
    "phone": "555-1234",
    "form_data": {
      "step1": {"field1": "value1"},
      "step2": {"field2": "value2"}
    }
  }'
```

**Verify in MongoDB:**
- Check Atlas console
- Document should appear in intakes collection

#### Evening: Fix any bugs (1 hour)

**End of Day 2 Deliverable:**
- API accepting submissions
- Data saving to MongoDB
- Test endpoint working
- Verified in Atlas console

---

### Day 3: React Integration (4-6 hours)

#### Morning: Update IntakeForm.jsx (2-3 hours)

**Goal:** Replace Healthie submission with MongoDB submission

**Key changes:**

1. **Remove Healthie code** (at top of file):
```javascript
// DELETE: All Healthie GraphQL imports
// DELETE: All Apollo Client code
// DELETE: All Healthie queries/mutations
```

2. **Add submission builder** (around line 2000):
```javascript
// NEW: Build simple submission object
const buildPOCSubmission = () => {
  return {
    first_name: firstName,
    last_name: lastName,
    date_of_birth: dateOfBirth,
    email: email,
    phone: phone,

    // Everything else goes in form_data for POC
    form_data: {
      // Personal info
      gender: gender,
      preferred_pronouns: preferredPronouns,

      // Emergency contact
      emergency_contact: {
        name: emergencyContactName,
        relationship: emergencyContactRelationship,
        phone: emergencyContactPhone
      },

      // Medical history
      medications: currentMedications,
      allergies: medicationAllergies,
      surgical_history: surgicalHistory,

      // Step 5 - all your recent changes
      physical_activity: engagesInPhysicalActivity,
      physical_activity_description: physicalActivityDescription,
      family_history: familyHistory,
      family_history_details: familyHistoryDetails,
      substance_use: substanceUse,
      substance_use_details: substanceUseDetails,

      // ... all other state variables

      // Store ALL state for POC
      raw_state: {
        // Dump everything here initially
        // We can clean up later
      }
    }
  };
};
```

3. **Update submit handler**:
```javascript
const handleFinalSubmit = async () => {
  setIsSubmitting(true);

  try {
    const submission = buildPOCSubmission();

    const response = await fetch('http://localhost:5096/api/intake/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(submission)
    });

    if (!response.ok) throw new Error('Submit failed');

    const result = await response.json();

    alert(`Success! Intake ID: ${result.intake_id}`);

    // Clear form
    localStorage.removeItem('intakeFormData');

  } catch (error) {
    console.error('Error:', error);
    alert('Submission failed: ' + error.message);
  } finally {
    setIsSubmitting(false);
  }
};
```

#### Afternoon: End-to-End Testing (2-3 hours)

**Test flow:**
1. Open http://localhost:5173
2. Fill out form (all 6 steps)
3. Submit
4. Verify success message with intake_id
5. Check MongoDB Atlas - document should be there
6. Test `/api/intake/test/{email}` endpoint
7. Verify all form data saved

**Test cases:**
- ✅ Complete form submission
- ✅ Required fields validation
- ✅ Conditional sub-questions (9b, 11b, 12b, 13b)
- ✅ Data in MongoDB matches form input
- ✅ Multiple submissions for same email
- ✅ Error handling (bad data, network failure)

#### Evening: Documentation + Demo (1 hour)

Create quick README for POC:
- How to run
- How to test
- What works
- What's left for iteration week

**End of Day 3 Deliverable:**
- ✅ Working end-to-end flow
- ✅ React → API → MongoDB
- ✅ Form data persisted
- ✅ No Healthie dependency
- ✅ Ready for demo

---

## Iteration Week (Days 4-10)

### Day 4: Refinement
- Clean up form_data structure
- Add better error messages
- Improve success UI
- Add loading states

### Day 5: Data Structure
- Start migrating to nested models
- Proper domain objects
- Keep form_data as fallback

### Day 6: Additional Endpoints
- GET intake by ID
- List all intakes
- Search by patient

### Day 7: Service Layer
- Add business logic layer
- Validation rules
- Data sanitization

### Day 8: Admin Features
- Simple admin page
- View submissions
- Export to CSV

### Day 9: Testing & Bug Fixes
- Comprehensive testing
- Edge cases
- Performance testing

### Day 10: Documentation & Cleanup
- Update README
- API documentation
- Code cleanup
- Production readiness checklist

---

## Quick Start Commands

### Day 1: Setup
```bash
# MongoDB Atlas - manual steps in web console

# Install dependencies
cd HealthieIntake.Api.Py
source venv/bin/activate
pip install motor pymongo
pip freeze > requirements.txt

# Update .env
echo "MONGODB_URI=your_connection_string_here" >> .env
```

### Day 2: Test API
```bash
# Start API
cd HealthieIntake.Api.Py
source venv/bin/activate
python main.py

# Test in another terminal
curl -X POST http://localhost:5096/api/intake/submit \
  -H "Content-Type: application/json" \
  -d '{"first_name":"Test","last_name":"User","email":"test@test.com","date_of_birth":"1990-01-01","form_data":{}}'
```

### Day 3: Test Full Stack
```bash
# Terminal 1: API
cd HealthieIntake.Api.Py && source venv/bin/activate && python main.py

# Terminal 2: React
cd HealthieIntake.UI.React && npm run dev

# Browser: http://localhost:5173
```

---

## Critical Path (Must Complete for POC)

### Blockers (Must be done in order)
1. MongoDB Atlas cluster created ✋ **BLOCKS EVERYTHING**
2. Connection string working ✋ **BLOCKS API**
3. API accepting POST ✋ **BLOCKS REACT**
4. React submitting to API ✋ **BLOCKS TESTING**

### Parallel Work (Can do simultaneously)
- Refine Pydantic models while testing API
- Update React UI while API is being built
- Documentation while testing

---

## Risk Mitigation (POC)

### Risk: MongoDB connection issues
**Quick fix:** Use local MongoDB Docker container instead
```bash
docker run -d -p 27017:27017 mongo
MONGODB_URI=mongodb://localhost:27017/healthie_intake
```

### Risk: CORS issues
**Quick fix:** Already configured in main.py, but can temporarily disable:
```python
allow_origins=["*"]  # Development only!
```

### Risk: Data structure too rigid
**Quick fix:** Using flexible form_data dict, can hold anything

### Risk: Pydantic validation errors
**Quick fix:** Make almost everything Optional initially

---

## Success Criteria (POC)

### Minimum for "Done"
- ✅ Form submits without errors
- ✅ Data appears in MongoDB Atlas
- ✅ Can retrieve submission by email
- ✅ All 6 form steps work
- ✅ Conditional logic intact (9b, 11b, 12b, 13b)

### Nice to Have (but not required for POC)
- ⚪ Proper error messages
- ⚪ Loading spinners
- ⚪ Retry logic
- ⚪ Admin dashboard
- ⚪ Healthie sync

---

## Files to Create/Modify

### Create (Day 1)
- `HealthieIntake.Api.Py/models/intake.py`
- `HealthieIntake.Api.Py/models/__init__.py`
- `HealthieIntake.Api.Py/repositories/intake_repository.py`
- `HealthieIntake.Api.Py/repositories/__init__.py`

### Modify (Day 2-3)
- `HealthieIntake.Api.Py/main.py` (simplified endpoints)
- `HealthieIntake.Api.Py/requirements.txt` (add motor, pymongo)
- `HealthieIntake.Api.Py/.env` (MongoDB URI)
- `HealthieIntake.UI.React/src/components/IntakeForm.jsx` (remove Healthie, add MongoDB)

### Create (Day 3)
- `POC_DEMO.md` (how to test/demo)
- `ITERATION_BACKLOG.md` (what to improve)

---

## Next Steps

1. **Approve this plan** ✋ Waiting for your go-ahead
2. **Day 1 Start**: MongoDB Atlas setup
3. **Daily standups**: Quick status check
4. **Day 3 demo**: End-to-end working
5. **Week 2 iterate**: Polish and extend

Ready to start? I can begin with Day 1 tasks immediately.

---

## Document Status

**Version:** 1.0
**Created:** 2025-10-28
**Timeline:** 3 days POC + 1 week iteration
**Status:** READY TO START
