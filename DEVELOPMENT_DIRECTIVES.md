# Development Directives

## STOP Dynamic Control Detection (2025-10-31)

**DIRECTIVE FROM USER:**

**STOP doing dynamic searches and detection for form controls/fields until properties are renamed to sensible names.**

### The Problem:
- Current property names are cryptic Healthie module IDs like "19056501"
- Dynamic detection logic (searching for "signature" in keys, checking object shapes, etc.) is fragile and error-prone
- This led to multiple failed attempts to filter/display signature data correctly
- Wasted significant time debugging when the solution was simple: use the specific key

### What NOT to do:
- ❌ DO NOT search for fields dynamically by keyword (e.g., `key.includes('signature')`)
- ❌ DO NOT try to detect field types by inspecting value structure
- ❌ DO NOT use `.find()` to search for fields across all answers
- ❌ DO NOT write "smart" detection logic that tries to figure out what a field is

### What TO do instead:
- ✅ USE specific, hardcoded keys (e.g., `intake.form_data.answers['19056501']`)
- ✅ PARSE JSON strings when needed (e.g., `JSON.parse(signatureValue)`)
- ✅ Keep it simple and explicit
- ✅ If you don't know the exact key, ASK the user

### Why this matters:
- Explicit code is easier to debug
- Reduces cognitive overhead
- Prevents the kind of issues we just experienced
- Once properties are renamed to sensible names (e.g., "patientSignature" instead of "19056501"), THEN we can revisit dynamic detection

### Next Steps:
1. Continue using explicit key references for now
2. Plan a refactoring task to rename all cryptic Healthie IDs to semantic property names
3. After renaming, we can implement sensible dynamic detection with meaningful property names

---

**Date:** 2025-10-31
**Context:** Admin dashboard signature field debugging session
**Affected Files:**
- `HealthieIntake.UI.React/src/admin/components/IntakeModal.jsx`
