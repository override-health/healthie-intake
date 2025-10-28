# Question Numbering System - READ THIS BEFORE CHANGING ANYTHING

## The Problem

The form has a mix of:
1. **API modules** from Healthie (in the getModulesForCurrentStep() array)
2. **Custom inserted fields** (NOT in the API, added manually in JSX)
3. **Sub-questions** (2b, 3b) that don't increment the main counter

This makes dynamic numbering a fucking nightmare.

## The Solution

**Step 5 (Medical History) uses a HYBRID approach:**
- Base calculation counts modules (excluding labels, sub-questions)
- Then **adds +1** to account for the custom "hospitalization" field inserted after medical conditions
- Sub-questions (2b, 3b, 7b, 14b) are **hardcoded** and excluded from counting
- Fields after medical conditions get **+1** (for hospitalization)

## Step 5 Question Numbers (Medical History)

| # | Question | Type | Notes |
|---|----------|------|-------|
| 1 | Medical conditions | API module | Calculated |
| 2 | Hospitalization | **CUSTOM** | Inserted inline with medical conditions module |
| 2b | Surgery list | API module | **HARDCODED** - Only shows if hospitalization = Yes |
| 3 | Surgery upcoming | API module | Calculated + adjusted (+1) |
| 3b | Surgery details | API module | **HARDCODED** - Only shows if surgery = Yes |
| 4 | Opioid medication | API module | Calculated + adjusted (+1) |
| 5 | Medication allergies Yes/No | **CUSTOM** | Inserted inline with allergies module |
| 5b | List medication allergies | API module | **HARDCODED** - Only shows if allergies = Yes |
| 6 | Procedures (checkboxes) | API module | Calculated + adjusted (+1) |
| 6b | Procedures other details | API module | **HARDCODED** - Only shows if "Other" checked |
| 7+ | Therapies, PT, trauma, etc. | API modules | Calculated + adjusted (+1) |

## Key Module IDs

```javascript
const subQuestionIds = ['19056477', '19056479', '19056483', '19056485', '19056492'];
// 19056477 = Surgery list (labeled 2b)
// 19056479 = Surgery details (labeled 3b)
// 19056483 = Medication allergies list (labeled 5b)
// 19056485 = Procedures other (labeled 6b)
// 19056492 = Family history other (labeled 14b)
```

## The Numbering Code (IntakeForm.jsx lines ~1697-1726)

```javascript
// Base calculation - counts all non-label, non-sub-question modules
questionNumber = allModules.slice(0, index + 1).filter(m =>
  m.modType !== 'label' &&
  m.modType !== 'read_only' &&
  m.modType !== 'staticText' &&
  !subQuestionIds.includes(m.id)
).length;

// Step 5 adjustment - Add 1 for hospitalization field
if (currentStep === 5 && index > 0) {
  const medicalConditionsModule = allModules.find(m =>
    m.label?.toLowerCase().includes('list all medical problems')
  );
  const currentIndex = allModules.indexOf(module);
  const medCondIndex = allModules.indexOf(medicalConditionsModule);

  // Add 1 if after medical conditions (for hospitalization field)
  if (medCondIndex >= 0 && currentIndex > medCondIndex && !subQuestionIds.includes(module.id)) {
    questionNumber += 1;
  }
}
```

## Other Steps with Custom Fields

### Step 2 (Patient Demographics)
Custom fields inserted after BMI:
- Primary Language (numbered as `questionNumber + 1`)
- Primary Language Other (numbered as `questionNumber + 2`, conditional)
- Primary care provider name (numbered as `questionNumber + 1`)
- Primary care provider phone (numbered as `questionNumber + 2`)

### Step 3 (Demographics & Emergency Contact)
Emergency contact split into 3 fields:
- Name (uses `getFieldLabel()`)
- Relationship (numbered as `questionNumber + 1`)
- Phone (numbered as `questionNumber + 2`)

## Rules

1. **Sub-questions (2b, 3b) are ALWAYS hardcoded** - Never use dynamic numbering
2. **Custom inserted fields must be accounted for** in the numbering calculation
3. **If you add a new custom field**, update the adjustment logic
4. **Labels, read_only, staticText fields DON'T get numbered**
5. **Sub-question IDs must be in the exclusion array**

## What NOT To Do

❌ Don't make sub-questions dynamic (I tried, it broke)
❌ Don't forget to adjust numbering after custom fields
❌ Don't try to be clever with the numbering - keep it simple
❌ Don't use `getFieldLabel()` for fields with hardcoded numbers

## Sub-Questions on Step 5

| Main Q | Sub Q | Condition | Label |
|--------|-------|-----------|-------|
| 2 | 2b | Hospitalization = Yes | "List any surgeries and dates of surgeries" |
| 3 | 3b | Surgery upcoming = Yes | "Provide details on your upcoming surgery..." |
| 5 | 5b | Medication allergies = Yes | "List your medication allergies" |
| 6 | 6b | Procedures "Other" checked | "If other, list them here" |
| 14 | 14b | Family history "Other" checked | "If other, provide details here." |

Note: Sub-questions don't increment the main counter, so they don't affect numbering of subsequent questions.

## Testing Checklist

When changing numbering:
- [ ] Check Step 5 numbers go 1, 2, 2b, 3, 3b, 4, 5, 5b, 6, 6b, 7...
- [ ] Verify 2b only shows when hospitalization = Yes
- [ ] Verify 3b only shows when surgery upcoming = Yes
- [ ] Verify 5b only shows when medication allergies = Yes
- [ ] Verify 6b only shows when procedures "Other" is checked
- [ ] Verify 14b only shows when family history "Other" is checked
- [ ] Check that opioid medication is question 4 (NOT 3, NOT 5)
- [ ] Check that medication allergies Yes/No is question 5
- [ ] Check that medication allergies list (5b) only appears when Yes selected
- [ ] Verify question 6 is "Have you had any of the following procedures?"
- [ ] Verify question 6b appears when "Other" procedures is checked
- [ ] Verify question 7 is "Have you tried any of the following?" (therapies)
- [ ] Verify question 14 is family history checkboxes
- [ ] Verify question 15 (not 14b) is "Do you use any of the following?"
- [ ] Reload page to verify numbers persist correctly

## If Numbering Breaks Again

1. Check `subQuestionIds` array includes all sub-question module IDs
2. Verify the Step 5 adjustment logic is running
3. Check for new custom fields that need accounting
4. Console.log `questionNumber` to see what's calculated
5. Remember: custom inserted fields aren't in the module loop

---

**Last Updated:** 2025-10-27
**Pain Level:** Extreme
**Never Again:** Please
