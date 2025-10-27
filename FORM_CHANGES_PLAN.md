# Intake Form Changes - Implementation Plan

**Date:** 2025-10-27
**Source:** Intake Form.xlsx feedback
**Total Changes:** 21 items identified

---

## 📊 Summary

- **Keep:** 55 fields
- **Remove:** 3 fields
- **Modify:** 18 fields
- **Add:** Several new fields (address split, primary language)

---

## 🗑️ REMOVALS (3 fields)

### High Priority - Simple Removals

1. **Medical History: "If other (therapy), comment"**
   - Status: Remove
   - Reason: Questionable usefulness
   - Effort: 5 minutes
   - Risk: Low

2. **Function & Goals: "Anything else you'd like providers to know"**
   - Status: Remove
   - Reason: Stefanie feedback - not helpful
   - Effort: 5 minutes
   - Risk: Low

3. **Agreements & Consent: Signature**
   - Status: Remove
   - Reason: Can be placed elsewhere
   - Effort: 5 minutes
   - Risk: **Medium** (this is currently required, need clarification)
   - **⚠️ NEEDS CLARIFICATION:** Where should signature go if removed?

---

## ✏️ MODIFICATIONS (18 items)

### Category 1: Field Restructuring (High Impact)

#### 1. **Address Field - Split into Components** ⭐ MAJOR CHANGE
- **Current:** Single location/address field with Mapbox autocomplete
- **Requested:** Split into separate fields:
  - Address Line 1 (text)
  - City (text)
  - State (text)
  - Zip Code (text)
  - Country (text)
- **Impact:** Breaking change to current Mapbox integration
- **Effort:** 2-3 hours
- **Risk:** High - affects form submission, storage
- **Decision Needed:** Keep Mapbox autocomplete that fills all fields, or make them manual?

#### 2. **Emergency Contact - Split Fields** ⭐ MAJOR CHANGE
- **Current:** Single textarea with Name/Relationship/Phone prompts
- **Requested:** Three separate fields:
  - Emergency contact - Name (text)
  - Emergency contact - Relationship (text)
  - Emergency contact - Phone number (phone)
- **Impact:** Form submission structure changes
- **Effort:** 1 hour
- **Risk:** Medium

#### 3. **Primary Care Physician - Split Fields**
- **Current:** Single text field
- **Requested:** Split into Name and Contact Number
- **Note:** Spreadsheet says "If this is useful..."
- **Effort:** 30 minutes
- **Risk:** Low
- **⚠️ NEEDS CLARIFICATION:** Is this actually needed?

---

### Category 2: New Fields to Add

#### 4. **Primary Language Selection** ⭐
- **Type:** Single-select dropdown
- **Options:** English, Spanish, Chinese (Mandarin/Cantonese), Vietnamese, Tagalog, Arabic, French, Korean, Other
- **Required:** Yes
- **Logic:** Show "If Other primary language, comment here" text field only when "Other" selected
- **Effort:** 1 hour
- **Risk:** Low

---

### Category 3: Field Type Changes

#### 5. **Pain Description - Add Dropdown**
- **Current:** "Tell us about your pain..." (long-text)
- **Requested:** Make easier with dropdown for "what have you tried"
- **Effort:** 2 hours
- **Risk:** Low
- **⚠️ NEEDS CLARIFICATION:** What should dropdown options be?

#### 6. **Medical Conditions - Change to Dropdown** ⭐
- **Current:** "List all medical problems..." (long-text)
- **Requested:** Add time period + dropdown list of conditions
- **New prompt:** "Have you been hospitalized in the last X months?"
- **Effort:** 3 hours (need medical conditions list)
- **Risk:** Medium
- **⚠️ NEEDS CLARIFICATION:**
  - What time period? (1/6/12 months)
  - What conditions should be in the list?

#### 7. **Upcoming Surgery - Rephrase to Yes/No**
- **Current:** Two separate fields (yes/no + details)
- **Requested:** Make primary question yes/no, show details conditionally
- **Effort:** 30 minutes
- **Risk:** Low
- **Note:** This might already be implemented correctly

#### 8. **Current Medications - Change to Dropdown** ⭐⭐
- **Current:** "List all current prescribed and OTC medications..." (long-text)
- **Requested:** Select medications from a list
- **Effort:** 4-6 hours (need comprehensive medication database)
- **Risk:** High
- **⚠️ NEEDS CLARIFICATION:**
  - What medication list to use?
  - How to handle dosages/frequency?
  - Too complex for initial implementation?

#### 9. **Past Medications - Evaluate Need**
- **Current:** "Past medications taken for pain and why stopped" (long-text)
- **Question:** Do they need to include past meds?
- **Effort:** 5 minutes to remove
- **⚠️ NEEDS DECISION:** Keep or remove?

#### 10. **Medication Allergies - Clarify Scope**
- **Current:** "Medication allergies" (long-text)
- **Question:** Should this be allergies in general?
- **Effort:** 30 minutes (change prompt)
- **Risk:** Low
- **⚠️ NEEDS CLARIFICATION:** Medications only or all allergies?

#### 11. **Physical Therapy - Add Time Period**
- **Current:** "If PT done, when was the last time?" (text)
- **Requested:** "Have you done physical therapy in the last X months?" (yes/no + conditional date)
- **Suggested period:** 3 months
- **Effort:** 1 hour
- **Risk:** Low

#### 12. **Trauma History - Change to Yes/No**
- **Current:** "History of physical or psychological trauma" (long-text)
- **Requested:** Change to Yes/No
- **Effort:** 30 minutes
- **Risk:** Low

---

### Category 4: Conditional Logic

#### 13. **Primary Language "Other" Field**
- **Logic:** Only display if "Other" is selected for primary language
- **Effort:** Included in #4
- **Risk:** Low

#### 14. **Other Procedures Field**
- **Current:** Always shows
- **Logic:** Only appear if "Other" procedures is selected
- **Effort:** 30 minutes
- **Risk:** Low

#### 15. **Other Therapy Field**
- **Current:** Always shows
- **Logic:** Only appear if "Other" therapy is selected
- **Note:** Marked for removal anyway
- **Effort:** Already covered in removal

---

### Category 5: Content/Prompt Changes

#### 16. **Height & Weight**
- **Note:** Auto-calculates BMI
- **Status:** Keep as-is
- **Effort:** N/A (already working)

#### 17. **Top 3 Goals for Pain**
- **Current:** Long-text field
- **Feedback:** "Stefanie said in general this feels not helpful"
- **Effort:** N/A
- **⚠️ NEEDS DECISION:** Keep, modify, or remove?

#### 18. **Agreement Links & Signature**
- **Current:** 4 items at end (3 links + signature)
- **Question:** "If these can be placed elsewhere no need to put them here"
- **Effort:** 1 hour to relocate
- **⚠️ NEEDS CLARIFICATION:**
  - Where should these go?
  - Footer? Separate page? Email?

---

## 📋 IMPLEMENTATION PLAN

### Phase 1: Quick Wins (Low effort, low risk)
**Estimated Time:** 2-3 hours

1. ✅ Remove "Anything else providers" field
2. ✅ Remove "If other therapy" field
3. ✅ Change trauma history to Yes/No
4. ✅ Add conditional logic for "Other procedures"
5. ✅ Rephrase PT question with time period
6. ✅ Clarify allergies prompt

### Phase 2: Field Additions (Medium effort)
**Estimated Time:** 3-4 hours

7. ✅ Add Primary Language dropdown with conditional "Other" field
8. ✅ Split Emergency Contact into 3 fields

### Phase 3: Major Restructuring (High effort, needs decisions)
**Estimated Time:** 6-10 hours

9. ⚠️ Split Address into 5 fields (needs decision on Mapbox)
10. ⚠️ Add medical conditions dropdown (needs list)
11. ⚠️ Change medications to dropdown (needs medication database)
12. ⚠️ Relocate agreement links/signature (needs decision)

### Phase 4: Content Review (Needs stakeholder input)
**Estimated Time:** 1-2 hours after decisions

13. ⚠️ Decision: Keep/remove past medications field
14. ⚠️ Decision: Keep/modify/remove "Top 3 goals"
15. ⚠️ Decision: Signature placement
16. ⚠️ Decision: Primary care physician split
17. ⚠️ Decision: Pain description dropdown options

---

## ⚠️ CLARIFICATIONS NEEDED

Before starting implementation, need answers to:

1. **Address Fields:**
   - Keep Mapbox autocomplete that auto-fills all 5 fields?
   - Or remove Mapbox and make them manual inputs?

2. **Signature:**
   - If removing from form, where does it go?
   - Still required for submission?

3. **Medical Conditions:**
   - What time period for hospitalization? (1/6/12 months)
   - What should the conditions dropdown include?

4. **Medications:**
   - Is dropdown selection realistic/necessary?
   - What medication database to use?
   - How complex should this be?

5. **Content Decisions:**
   - Keep past medications field?
   - Keep "Top 3 goals" field?
   - Where to place agreement links?

6. **Primary Care Physician:**
   - Actually split into name + contact, or keep as-is?

---

## 💡 RECOMMENDATIONS

### Approach A: Incremental (Recommended)
- Start with Phase 1 (quick wins)
- Get feedback after each phase
- Defer complex changes (medications dropdown) until absolutely needed

### Approach B: All at Once
- Risk: Many breaking changes at once
- Not recommended without comprehensive testing plan

### Approach C: Hybrid
- Do Phases 1 & 2 immediately (low risk, clear requirements)
- Get stakeholder decisions on Phase 3 & 4 items
- Implement Phase 3 & 4 after clarification

---

## 📊 EFFORT ESTIMATE

| Phase | Effort | Risk | Dependencies |
|-------|--------|------|--------------|
| Phase 1 | 2-3 hours | Low | None |
| Phase 2 | 3-4 hours | Low | None |
| Phase 3 | 6-10 hours | High | Decisions needed |
| Phase 4 | 1-2 hours | Low | Stakeholder input |
| **Total** | **12-19 hours** | | |

---

## ✅ DECISIONS MADE (2025-10-27)

See `DECISIONS.md` for full details. Key decisions:

1. **Address:** Keep Mapbox as-is (no split)
2. **Signature:** Keep on Step 6 (no relocation)
3. **Form structure:** Keep 6-step wizard
4. **Medications:** Keep text for now (defer dropdown)
5. **Medical conditions:** Keep text for now (defer dropdown)
6. **Top 3 goals:** Keep
7. **Agreement links:** Keep on Step 6

## 🎯 REVISED SCOPE

**Phase 1: Immediate (2-3 hours)**
1. Remove "Anything else providers" field
2. Remove "If other therapy" comment field
3. Change trauma history to Yes/No
4. Add conditional logic for "Other procedures"
5. Rephrase PT question with time period
6. Clarify allergies prompt

**Phase 2: Next (3-4 hours)**
1. Add Primary Language dropdown with conditional logic
2. Split Emergency Contact into 3 fields
3. Consider Primary Care Physician split (TBD)

**Phase 3: Deferred**
- Address restructuring (keeping Mapbox)
- Medications dropdown (future enhancement)
- Medical conditions dropdown (future enhancement)

---

## 🎯 NEXT STEPS

1. ✅ Document decisions (DONE - see DECISIONS.md)
2. ✅ Commit current work to git
3. ✅ Create feature branch: `field-changes`
4. ✅ Start Phase 1 implementation
5. Test and verify Phase 1
6. Proceed to Phase 2 if approved

---

**Status:** Ready to implement Phase 1 on feature branch
