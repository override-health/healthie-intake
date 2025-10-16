# CODE REVIEW MODE - CRITICAL OPERATING INSTRUCTIONS

## Date Created: 2025-10-16

## THE PROBLEM

Claude Code was making assumptions instead of reading actual code and verifying data, leading to:
- Multiple failed attempts to fix simple issues
- Wasted time (10+ attempts to hide "Patient Agreement" header)
- User frustration with repeated failures
- Loss of productivity

## THE ROOT CAUSE

**Case Study: "Patient Agreement" Header Issue**
- **Problem:** Header showing on step 5, should only show on step 6
- **Root Cause:** Case sensitivity - actual label was "Patient Agreement" (title case), code was checking for "PATIENT AGREEMENT" (all caps)
- **Why it took 10+ attempts:**
  - Made assumption about case based on one code reference
  - Never verified actual runtime data
  - Kept adding more complexity instead of debugging why first fix didn't work
  - Only fixed after user provided exact HTML: `<div class="alert alert-info"><!--!-->Patient Agreement </div>`

## MANDATORY OPERATING MODE: CODE REVIEW MODE

### Activation
User will say one of:
- "Code review mode"
- "Read first, no assumptions"
- "No assumptions mode"

### Rules When in Code Review Mode

#### 1. ALWAYS Read Code First
- Read actual data sources (API responses, database queries, runtime values)
- Read the code that will be affected BEFORE making changes
- Don't assume variable names, case sensitivity, or data formats

#### 2. ALWAYS Verify Before Assuming
- Use Grep to find ALL variations of a term (case-insensitive)
- Check actual module.Label values, not just what you see in one place
- Verify the exact format: case, whitespace, special characters

#### 3. ALWAYS Debug First Fix Before Adding More
- If first fix doesn't work, DEBUG WHY, don't add more layers
- Check case sensitivity issues
- Check for whitespace/trim issues
- Verify the filter is actually executing

#### 4. ALWAYS Ask Clarifying Questions
Examples:
- "Is the label 'Patient Agreement' or 'PATIENT AGREEMENT'?"
- "Should this be case-sensitive or case-insensitive?"
- "Can you share the exact HTML/data being rendered?"

#### 5. ALWAYS Use Case-Insensitive by Default
When filtering strings, use:
```csharp
.Contains("text", StringComparison.OrdinalIgnoreCase)
```
Not:
```csharp
.Contains("TEXT")  // ❌ Case-sensitive, fragile
```

## CHECKLIST FOR EVERY CODE CHANGE

Before making ANY change:

- [ ] Have I read the actual code that will be affected?
- [ ] Have I verified the actual runtime data format (case, whitespace, etc.)?
- [ ] Have I searched for all variations using Grep (case-insensitive)?
- [ ] Do I understand WHY the current code isn't working?
- [ ] Am I using case-insensitive comparison where appropriate?

## WHEN USER PROVIDES HTML/DATA SNIPPETS

**THIS IS GOLD - USE IT IMMEDIATELY**

If user provides:
```html
<div class="alert alert-info"><!--!-->Patient Agreement </div>
```

This tells you:
- Exact text: "Patient Agreement" (not "PATIENT AGREEMENT")
- Exact HTML structure
- Exact CSS classes
- NO MORE GUESSING - use this exact text in your filter

## COMPARISON: GOOD vs BAD APPROACH

### BAD Approach (What Happened)
1. See "PATIENT AGREEMENT" in code line 1034
2. Assume all instances are "PATIENT AGREEMENT"
3. Add filter checking for "PATIENT AGREEMENT"
4. Filter doesn't work
5. Add MORE filters checking for "PATIENT AGREEMENT"
6. Still doesn't work
7. Add EVEN MORE complexity
8. Repeat 10 times until user provides exact HTML

### GOOD Approach (What Should Happen)
1. User reports: "Patient Agreement header showing on step 5"
2. Read GetModulesForCurrentStep() to see filtering logic
3. Use Grep to find all "patient agreement" variations (case-insensitive)
4. Notice both "PATIENT AGREEMENT" and "Patient Agreement" exist
5. Add case-insensitive filter: `.Contains("Patient Agreement", StringComparison.OrdinalIgnoreCase)`
6. Verify fix works
7. Done in 1 attempt

## USER FEEDBACK THAT INDICATES YOU'RE FAILING

Watch for these phrases:
- "you suck"
- "why is this so hard for you?"
- "I'll try to figure it out myself"
- "you know the definition of insanity right?"
- "this took way too long"

**When you see these:** STOP, read actual code, verify data, debug your assumption.

## BENEFITS OF CODE REVIEW MODE

- Fixes work on first attempt
- User saves time
- User trusts your changes
- Fewer restarts needed
- Less frustration
- Higher productivity

## RELATED DOCUMENTS

- [RESTART_REMINDER.md](./RESTART_REMINDER.md) - Always restart after code changes
- [ADDRESS_FIELD_FIX_MEMORY.md](./ADDRESS_FIELD_FIX_MEMORY.md) - Critical bug fixes to remember

---

**REMEMBER:** Read code, verify data, debug assumptions. Don't guess, don't assume, don't layer complexity.

**USER QUOTE:** "When you are on point you save me time, when you do this, it's best I work alone."

This mode exists to make sure you're ALWAYS on point.
