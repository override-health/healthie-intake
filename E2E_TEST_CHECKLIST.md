# End-to-End Testing Checklist
## MongoDB POC - Full Form Submission Test

**Date:** 2025-10-28
**Branch:** mongodb-migration

---

## Pre-Test Verification

### ✅ Servers Running
- [ ] MongoDB Docker container: `docker ps | grep mongodb-local`
- [ ] Python API on port 5096: `curl http://localhost:5096/health`
- [ ] React UI on port 5173: Open browser to http://localhost:5173

### ✅ Expected API Health Response
```json
{
  "status": "healthy",
  "database": {
    "type": "mongodb",
    "status": "connected (1 intakes)"
  }
}
```

---

## Form Submission Test

### Step 1: Open Form
1. Navigate to: **http://localhost:5173**
2. Form should load without errors
3. Verify 6-step navigation visible

### Step 2: Fill Out Minimal Required Fields

**Step 1 - Personal Information:**
- First Name: `Test`
- Last Name: `Patient`
- Date of Birth: `01/01/1990`
- Email: `test.patient@test.com`
- Phone: `(555) 123-4567`

**Steps 2-5:**
- Fill out any required fields (marked with red asterisk)
- You can use test data or real data
- **Test conditional logic:**
  - Question 9: Select "Yes" → Verify 9b appears
  - Question 11: Select "Other" → Verify 11b appears
  - Question 12: Select any substance → Verify 12b appears (but NOT if only "None of the above")
  - Question 13: Select "Yes" → Verify 13b appears

**Step 6 - Signatures:**
- Sign all signature fields (if any)

### Step 3: Submit Form
1. Click "Submit" button on final step
2. Watch for success message
3. **Expected:** "Form submitted successfully! Intake ID: [MongoDB ObjectId]"
4. **Copy the Intake ID** for verification

---

## Verification Steps

### 1. Check API Response
Success message should show:
```
Form submitted successfully! Intake ID: 690143...
```

### 2. Verify in MongoDB (Direct Query)
```bash
docker exec mongodb-local mongosh healthie_intake --eval "db.intakes.find().sort({created_at: -1}).limit(1).pretty()"
```

**Expected Output:**
- Document with your test data
- `first_name`: "Test"
- `last_name`: "Patient"
- `email`: "test.patient@test.com"
- `form_data` object with all form fields

### 3. Verify via API Endpoint
```bash
# Replace {intake_id} with the ID from success message
curl http://localhost:5096/api/intake/{intake_id}
```

**Expected:** JSON document with all submitted data

### 4. Verify by Email
```bash
curl http://localhost:5096/api/intake/patient/test.patient@test.com
```

**Expected:**
- `count`: 1 or more
- `intakes` array with your submission(s)

---

## Conditional Logic Test

### Sub-Question 9b (Physical Activity)
- **Test:** Select "Yes" for question 9
- **Expected:** Question 9b appears below
- **Test:** Enter "Running 3x per week"
- **Verify in MongoDB:** `form_data.physical_activity_description` contains text

### Sub-Question 11b (Family History)
- **Test:** Select "Other" in question 11 checkboxes
- **Expected:** Question 11b text field appears
- **Test:** Enter "Mother has diabetes"
- **Verify in MongoDB:** Should be in form answers

### Sub-Question 12b (Substance Use Details)
- **Test 1:** Select only "None of the above"
- **Expected:** 12b should NOT appear
- **Test 2:** Select "Alcohol" checkbox
- **Expected:** 12b appears
- **Test 3:** Select both "Alcohol" and "None of the above"
- **Expected:** 12b still appears (complex logic works)

### Sub-Question 13b (Relationship Details)
- **Test:** Select "Yes" for question 13
- **Expected:** Question 13b text field appears
- **Verify in MongoDB:** Should be in form answers

---

## Data Integrity Checks

### Patient Demographics
```bash
# Query MongoDB directly
docker exec mongodb-local mongosh healthie_intake --eval "
  db.intakes.find(
    {email: 'test.patient@test.com'},
    {first_name: 1, last_name: 1, email: 1, date_of_birth: 1, phone: 1}
  ).pretty()
"
```

**Expected:**
- All 5 core fields present
- Email validated (Pydantic EmailStr)
- Date formatted correctly

### Form Data Structure
```bash
docker exec mongodb-local mongosh healthie_intake --eval "
  db.intakes.findOne(
    {email: 'test.patient@test.com'},
    {form_data: 1}
  )
"
```

**Expected form_data keys:**
- `answers` - Object with all form field IDs and values
- `patient_id` - String
- `form_id` - String
- `submission_date` - ISO timestamp
- `emergency_contact` - Object {name, relationship, phone}
- `physical_activity` - "Yes" or "No"
- `physical_activity_description` - Text (if answered Yes)
- `height_feet`, `height_inches`, `weight` - BMI data

### Schema Version
```bash
docker exec mongodb-local mongosh healthie_intake --eval "
  db.intakes.distinct('schema_version')
"
```

**Expected:** `["1.0-poc"]`

---

## Edge Cases to Test

### Test 1: Multiple Submissions from Same Email
1. Submit form once with test.patient@test.com
2. Submit again with same email
3. Query: `curl http://localhost:5096/api/intake/patient/test.patient@test.com`
4. **Expected:** `count: 2`, both intakes in array

### Test 2: Missing Optional Fields
1. Fill only required fields (marked with *)
2. Leave all optional fields blank
3. Submit form
4. **Expected:** Submission succeeds, optional fields absent or empty in form_data

### Test 3: All Conditional Sub-Questions Hidden
1. Answer "No" to question 9
2. Don't select "Other" in question 11
3. Select only "None of the above" in question 12
4. Answer "No" to question 13
5. **Expected:** No sub-questions visible, form submits successfully

### Test 4: All Conditional Sub-Questions Visible
1. Answer "Yes" to question 9 → Fill 9b
2. Select "Other" in question 11 → Fill 11b
3. Select any substance in question 12 → Fill 12b
4. Answer "Yes" to question 13 → Fill 13b
5. **Expected:** All 4 sub-questions visible and submit with data

---

## Performance Check

### Response Time Test
```bash
time curl -X POST http://localhost:5096/api/intake/submit \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "Speed",
    "last_name": "Test",
    "date_of_birth": "1990-01-01",
    "email": "speed.test@test.com",
    "form_data": {"test": "performance"}
  }'
```

**Expected:** < 500ms response time

---

## Common Issues & Fixes

### Issue: "email-validator is not installed"
**Fix:**
```bash
cd HealthieIntake.Api.Py
source venv/bin/activate
pip install "pydantic[email]"
```

### Issue: MongoDB connection error
**Fix:**
```bash
# Check if container is running
docker ps | grep mongodb-local

# If not running, start it
docker start mongodb-local

# Or create new container
docker run -d --name mongodb-local -p 27017:27017 mongo:latest
```

### Issue: API not responding on 5096
**Fix:**
```bash
# Check if API is running
lsof -i :5096

# Restart API
cd HealthieIntake.Api.Py
source venv/bin/activate
python main.py
```

### Issue: React UI not loading
**Fix:**
```bash
# Check if React server is running
lsof -i :5173

# Restart React server
cd HealthieIntake.UI.React
npm run dev
```

### Issue: CORS errors in browser
**Check:**
- API should allow origin http://localhost:5173
- Check browser console for specific error
- Verify in config.py: mongodb_uri is set

---

## Success Criteria

### ✅ POC is Complete When:
1. [ ] Form loads without errors
2. [ ] All 6 steps navigate correctly
3. [ ] Form submission succeeds
4. [ ] Success message shows MongoDB intake_id
5. [ ] Data appears in MongoDB (verified via mongosh)
6. [ ] Data retrievable via API endpoint
7. [ ] All conditional logic works (9b, 11b, 12b, 13b)
8. [ ] Multiple submissions for same email work
9. [ ] No Healthie errors in console
10. [ ] Response time < 500ms

### ✅ POC Deliverables:
- [x] MongoDB running locally
- [x] Backend API with 5 MongoDB endpoints
- [x] Frontend submitting to MongoDB
- [ ] End-to-end test passing
- [x] All code committed to mongodb-migration branch
- [x] Documentation (this checklist)

---

## Next Steps After POC

If all tests pass:
1. Iterate on data structure (refine form_data organization)
2. Add validation and error handling
3. Extract more structured patient info
4. Add admin dashboard
5. Plan AWS Lambda for Healthie sync

If tests fail:
1. Document the failure
2. Check browser console for errors
3. Check API logs for errors
4. Verify MongoDB connection
5. Debug and fix

---

## Manual Test Report

**Tester:** _____________
**Date:** 2025-10-28
**Time:** _____________

### Test Results:
- [ ] Form loads successfully
- [ ] Step 1 personal info works
- [ ] Steps 2-5 form fields work
- [ ] Step 6 signatures work (if applicable)
- [ ] Submission succeeds
- [ ] Success message correct
- [ ] Data in MongoDB verified
- [ ] API retrieval works
- [ ] Conditional logic (9b, 11b, 12b, 13b) works

### Notes:
_______________________________________
_______________________________________
_______________________________________

### Issues Found:
_______________________________________
_______________________________________
_______________________________________

### Screenshots:
- Success message
- MongoDB data
- API response

---

**Status:** ☐ PASS  ☐ FAIL  ☐ NEEDS WORK
