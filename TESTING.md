# Testing Guide - Healthie Intake Form

**Last Updated**: 2025-10-30
**Target Features**: Medication Management + Submission Cleanup

## Quick Start

### Prerequisites
1. Backend running: `docker ps` should show `healthie-api-py` container
2. Frontend running: Navigate to http://localhost:5174
3. Database accessible: `psql -U corey -d override-intake -c "SELECT 1"`

### Test Patient Credentials
- **First Name**: Corey
- **Last Name**: Eight
- **Date of Birth**: 08/05/1985
- **Patient ID**: 3642270
- **Email**: corey@override.health

## Test Suite 1: Medication Management Feature

### Test 1.1: Add Single Medication
**Objective**: Verify basic medication entry functionality

**Steps**:
1. Search for test patient and proceed to Step 5
2. Scroll to Question 5: "List all current prescribed and over-the-counter medications"
3. Verify hint text displays: "Click 'Add Medication' to list your current medications..."
4. Click "Add Medication" button
5. Enter the following:
   - Drug Name: `Aspirin`
   - Dosage: `81mg`
   - Start Date: Click calendar, select `2024-01-15`
   - Directions: `Once daily with food`
6. Verify all fields display entered values

**Expected Results**:
- ✅ "Add Medication" button is visible
- ✅ Four input fields appear after clicking button
- ✅ Calendar icon appears in Start Date field
- ✅ Calendar picker works correctly
- ✅ All entered data displays properly
- ✅ Remove button (×) appears

### Test 1.2: Add Multiple Medications
**Objective**: Verify multiple medication entries work correctly

**Steps**:
1. Continue from Test 1.1
2. Click "Add Medication" again
3. Enter second medication:
   - Drug Name: `Metformin`
   - Dosage: `500mg`
   - Start Date: `2024-06-01`
   - Directions: `Twice daily with meals`
4. Click "Add Medication" again
5. Enter third medication:
   - Drug Name: `Lisinopril`
   - Dosage: `10mg`
   - Start Date: `2023-12-01`
   - Directions: `Once daily in morning`

**Expected Results**:
- ✅ Each medication displays on separate row (desktop) or stacked (mobile)
- ✅ All three medications visible simultaneously
- ✅ Each has its own remove button
- ✅ Data doesn't overlap or interfere between medications

### Test 1.3: Remove Medication
**Objective**: Verify medication removal works correctly

**Steps**:
1. Continue from Test 1.2 (3 medications present)
2. Click × button on the second medication (Metformin)
3. Verify Metformin is removed
4. Verify Aspirin and Lisinopril remain

**Expected Results**:
- ✅ Selected medication removes immediately
- ✅ Other medications remain intact
- ✅ No data loss from remaining medications
- ✅ Row gaps close properly

### Test 1.4: Empty Medication Handling
**Objective**: Verify empty medications are silently ignored

**Steps**:
1. Clear form or start fresh
2. Navigate to Step 5, Question 5
3. Click "Add Medication"
4. Leave Drug Name empty, fill in:
   - Dosage: `100mg`
   - Directions: `Test directions`
5. Click "Add Medication" again
6. Fill in complete medication:
   - Drug Name: `Ibuprofen`
   - Dosage: `200mg`
7. Navigate to Step 6
8. Submit form
9. Query database for submission

**Expected Results**:
- ✅ Form allows empty Drug Name during entry
- ✅ No validation error on empty Drug Name
- ✅ Form submits successfully
- ✅ Database only contains medication with Drug Name
- ✅ Empty medication not in database

**Database Query**:
```sql
SELECT form_data->'medications' as medications
FROM intakes
WHERE patient_healthie_id = '3642270'
ORDER BY created_at DESC
LIMIT 1;
```

### Test 1.5: Calendar Date Picker
**Objective**: Verify date picker functionality

**Steps**:
1. Navigate to medication entry
2. Click "Add Medication"
3. Click on Start Date field
4. Verify calendar picker appears
5. Navigate to previous month
6. Navigate to next month
7. Select a date
8. Verify date populates in YYYY-MM-DD format

**Expected Results**:
- ✅ Calendar icon visible in date field
- ✅ Calendar picker opens on click
- ✅ Month navigation works
- ✅ Date selection populates field
- ✅ Format is YYYY-MM-DD
- ✅ Can clear date if needed

### Test 1.6: Responsive Design
**Objective**: Verify layout adapts to screen size

**Desktop (>768px)**:
1. View medication entry on desktop browser
2. Add 2 medications
3. Verify fields appear on single row
4. Verify column widths: Drug Name (wider), Dosage (medium), Start Date (medium), Directions (widest)

**Mobile (<768px)**:
1. Resize browser to mobile width OR use device
2. View same medications
3. Verify fields stack vertically
4. Verify each field takes full width
5. Verify remove button accessible

**Expected Results**:
- ✅ Desktop: All fields on one row
- ✅ Desktop: Appropriate column widths
- ✅ Mobile: Fields stack vertically
- ✅ Mobile: Full width fields
- ✅ Mobile: Remove button accessible
- ✅ No horizontal scrolling on mobile

## Test Suite 2: Draft Persistence

### Test 2.1: localStorage Draft Save
**Objective**: Verify medications save to localStorage

**Steps**:
1. Navigate to Step 5, add 2 medications
2. Wait 30+ seconds (auto-save trigger)
3. Open browser DevTools → Application → Local Storage
4. Find key: `healthie_intake_3642270`
5. Verify medications array in JSON

**Expected Results**:
- ✅ localStorage key exists
- ✅ medications array present in JSON
- ✅ All medication fields saved correctly
- ✅ Timestamps present

### Test 2.2: Database Draft Save
**Objective**: Verify medications save to database

**Steps**:
1. Add 2 medications
2. Wait 30+ seconds for auto-save
3. Query database:
```sql
SELECT form_data->'medications' as medications
FROM intakes
WHERE patient_healthie_id = '3642270'
  AND status = 'draft'
ORDER BY last_updated_at DESC
LIMIT 1;
```

**Expected Results**:
- ✅ Draft record exists
- ✅ medications array in form_data
- ✅ All fields present (drugName, dosage, startDate, directions)
- ✅ IDs match localStorage

### Test 2.3: Draft Load on Return
**Objective**: Verify medications load from draft

**Steps**:
1. Add 2 medications
2. Navigate to different step
3. Wait for auto-save (30s)
4. Refresh page (F5)
5. Search for patient again
6. Navigate to Step 5
7. Verify medications loaded

**Expected Results**:
- ✅ Medications re-appear
- ✅ All fields populated correctly
- ✅ Correct number of medications
- ✅ Remove buttons functional

### Test 2.4: Draft Priority (DB vs localStorage)
**Objective**: Verify most recent draft loads

**Steps**:
1. Add medication "Med A"
2. Wait for auto-save (30s)
3. Manually update localStorage to have "Med B"
4. Set localStorage timestamp to future
5. Refresh page
6. Search for patient
7. Navigate to Step 5

**Expected Results**:
- ✅ Most recent draft loads (based on timestamp)
- ✅ Console logs indicate which source used
- ✅ Data integrity maintained

## Test Suite 3: Submission & Cleanup

### Test 3.1: Successful Submission
**Objective**: Verify medications submit correctly

**Steps**:
1. Complete entire form
2. Add 2 medications in Step 5
3. Navigate to Step 6
4. Submit form
5. Open browser console
6. Look for "Cleared localStorage for patient..." message
7. Query database for completed submission

**Expected Results**:
- ✅ Form submits successfully
- ✅ Thank You page displays
- ✅ Console shows localStorage cleared message
- ✅ Database contains completed record with medications
- ✅ medications formatted as text for Healthie

**Database Query**:
```sql
SELECT id, status, submitted_at,
       form_data->'medications' as medications,
       form_data->'answers'->>'19056481' as medications_text
FROM intakes
WHERE patient_healthie_id = '3642270'
  AND status = 'completed'
ORDER BY submitted_at DESC
LIMIT 1;
```

### Test 3.2: localStorage Cleanup After Submission
**Objective**: Verify localStorage cleared post-submission

**Steps**:
1. Submit form successfully
2. Check browser console for cleanup message
3. Open DevTools → Application → Local Storage
4. Verify key `healthie_intake_3642270` is absent
5. Close browser tab
6. Reopen site and search for patient
7. Verify no draft loads

**Expected Results**:
- ✅ Console message: "Cleared localStorage for patient 3642270"
- ✅ localStorage key removed
- ✅ No draft data on return
- ✅ Form starts at Step 1
- ✅ No medications pre-populated

### Test 3.3: Database Draft Cleanup After Submission
**Objective**: Verify database draft deleted post-submission

**Steps**:
1. Submit form successfully
2. Query database for drafts:
```sql
SELECT * FROM intakes
WHERE patient_healthie_id = '3642270'
  AND status = 'draft';
```

**Expected Results**:
- ✅ No draft records found
- ✅ Only completed record exists
- ✅ Completed record has all medications

### Test 3.4: Complete State Reset
**Objective**: Verify all state resets after submission

**Steps**:
1. Submit form with medications
2. Verify Thank You page shows
3. **Do NOT close browser tab**
4. Scroll up to header area
5. Verify patient name cleared
6. Check form state (if accessible)
7. Refresh page
8. Verify starts at Step 1 with empty search

**Expected Results**:
- ✅ Patient name cleared from header
- ✅ Step resets to 1
- ✅ All form fields cleared
- ✅ Search fields empty
- ✅ Medications array empty
- ✅ No "completed intake" warning on fresh search

## Test Suite 4: Clear & Start Over

### Test 4.1: Clear & Start Over Button
**Objective**: Verify manual clear works correctly

**Steps**:
1. Add 2 medications
2. Navigate to Step 3 (any step works)
3. Wait for auto-save (30s)
4. Click "Clear & Start Over" button
5. Confirm action in dialog
6. Check browser console
7. Verify form resets to Step 1
8. Search for patient again
9. Navigate to Step 5

**Expected Results**:
- ✅ Confirmation dialog appears
- ✅ Console message: "Cleared localStorage for patient 3642270"
- ✅ Alert: "All progress has been cleared..."
- ✅ Form resets to Step 1
- ✅ Search fields cleared
- ✅ No draft loads on patient search
- ✅ No medications present

### Test 4.2: Clear & Start Over - Database Cleanup
**Objective**: Verify database draft deleted on clear

**Steps**:
1. Add medications and save draft
2. Click "Clear & Start Over"
3. Confirm action
4. Query database:
```sql
SELECT * FROM intakes
WHERE patient_healthie_id = '3642270'
  AND status = 'draft';
```

**Expected Results**:
- ✅ No draft records found
- ✅ Database cleaned up
- ✅ Can create new draft immediately

### Test 4.3: Clear & Start Over - Cancel
**Objective**: Verify cancel preserves data

**Steps**:
1. Add 2 medications
2. Click "Clear & Start Over"
3. Click "Cancel" in confirmation dialog
4. Verify medications still present
5. Verify step unchanged
6. Verify draft persists

**Expected Results**:
- ✅ Medications remain
- ✅ Current step unchanged
- ✅ Draft not deleted
- ✅ Can continue editing

## Test Suite 5: Edge Cases

### Test 5.1: Special Characters in Medication Names
**Objective**: Test handling of special characters

**Steps**:
1. Add medication with Drug Name: `Aspirin/Codeine 30mg`
2. Add medication with directions: `Take with 8oz water & food`
3. Submit form
4. Query database

**Expected Results**:
- ✅ Special characters accepted
- ✅ Data saved correctly
- ✅ No encoding issues

### Test 5.2: Long Field Values
**Objective**: Test field length handling

**Steps**:
1. Add medication with very long drug name (500+ chars)
2. Add medication with very long directions (1000+ chars)
3. Verify UI handles overflow
4. Submit form

**Expected Results**:
- ✅ Fields accept long input
- ✅ UI doesn't break (scrolling or wrapping)
- ✅ Data saves completely

### Test 5.3: Many Medications
**Objective**: Test handling of 20+ medications

**Steps**:
1. Add 25 medications
2. Verify UI performance
3. Scroll to verify all visible
4. Remove middle medication
5. Submit form
6. Verify database storage

**Expected Results**:
- ✅ All medications display
- ✅ No UI lag or freeze
- ✅ Scrolling works smoothly
- ✅ Removal works correctly
- ✅ All 24 medications in database

### Test 5.4: Date Format Variations
**Objective**: Test date input handling across browsers

**Steps**:
1. Test in Chrome - calendar picker format
2. Test in Safari - calendar picker format
3. Test in Firefox - calendar picker format
4. Verify dates save consistently

**Expected Results**:
- ✅ Calendar works in all browsers
- ✅ Dates save as YYYY-MM-DD
- ✅ Dates load correctly
- ✅ No format conflicts

### Test 5.5: Network Failure During Save
**Objective**: Test draft save resilience

**Steps**:
1. Add 2 medications
2. Open DevTools → Network
3. Set "Offline" mode
4. Wait for auto-save attempt (30s)
5. Check console for errors
6. Restore network
7. Verify data in localStorage
8. Wait for next save attempt

**Expected Results**:
- ✅ localStorage saves despite network failure
- ✅ Console shows DB save error (expected)
- ✅ Data preserved in localStorage
- ✅ Next save succeeds when online
- ✅ No data loss

## Test Suite 6: Healthie API Format

### Test 6.1: Medication Text Formatting
**Objective**: Verify Healthie receives readable text

**Steps**:
1. Add medication with all fields:
   - Drug Name: `Aspirin`
   - Dosage: `81mg`
   - Start Date: `2024-01-15`
   - Directions: `Once daily`
2. Submit form
3. Query database for Healthie format:
```sql
SELECT form_data->'answers'->>'19056481' as healthie_format
FROM intakes
WHERE patient_healthie_id = '3642270'
ORDER BY submitted_at DESC
LIMIT 1;
```

**Expected Format**:
```
Aspirin - 81mg - Started: 2024-01-15 - Once daily
```

**Expected Results**:
- ✅ Format: DrugName - Dosage - Started: Date - Directions
- ✅ Fields separated by " - "
- ✅ Multiple medications separated by newlines
- ✅ Readable by humans

### Test 6.2: Partial Fields Formatting
**Objective**: Test format with missing optional fields

**Steps**:
1. Add medication: Drug Name only
2. Add medication: Drug Name + Dosage only
3. Add medication: Drug Name + Directions only
4. Submit and check format

**Expected Results**:
- ✅ Missing fields omitted cleanly
- ✅ No extra " - " separators
- ✅ Format: "DrugName" OR "DrugName - Dosage" etc.

## Success Criteria

All tests must pass before merging to main:
- [ ] All 30+ test cases completed
- [ ] No console errors
- [ ] Database queries confirm data integrity
- [ ] localStorage cleanup verified
- [ ] Cross-browser tested (minimum Chrome + Safari)
- [ ] Mobile responsive verified
- [ ] Draft persistence working
- [ ] Submission cleanup working

## Known Limitations to Accept

These are documented limitations, not bugs:
- Browser date format varies (native input)
- No medication autocomplete
- No duplicate detection
- No drug interaction warnings
- Text-only format to Healthie (structured in DB)

## Regression Testing

After medication feature, verify these still work:
- [ ] Patient search
- [ ] Multi-step navigation
- [ ] Other form fields save/load
- [ ] Signature pads work
- [ ] Phone formatting works
- [ ] Emergency contact fields
- [ ] Physical activity sub-questions
- [ ] BMI calculation
- [ ] Checkbox groups
- [ ] Date inputs (DOB, surgery dates)

## Bug Reporting Template

If issues found, document as:
```
**Test Case**: [Test number and name]
**Browser**: [Chrome 120, Safari 17, etc.]
**Steps to Reproduce**:
1. ...
2. ...

**Expected**: ...
**Actual**: ...
**Console Errors**: [paste errors]
**Screenshots**: [if applicable]
```

## Post-Testing Checklist

After all tests pass:
- [ ] Document any browser-specific quirks
- [ ] Note performance with large datasets
- [ ] Record average auto-save time
- [ ] Measure page load time impact
- [ ] Verify accessibility with screen reader
- [ ] Test with keyboard navigation only
- [ ] Check mobile data usage
- [ ] Verify HIPAA logging compliance
