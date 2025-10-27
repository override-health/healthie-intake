# Form Changes - Stakeholder Decisions

**Date:** 2025-10-27
**Decided by:** Corey

---

## ✅ DECISIONS MADE

### 1. Address Field
**Decision:** Keep as-is
- Keep Mapbox autocomplete integration
- Do NOT split into 5 separate fields
- No changes needed

### 2. Signature Field
**Decision:** Keep as-is
- Leave signature on Step 6 where it currently is
- Do NOT relocate
- No changes needed

### 3. Form Structure
**Decision:** Keep 6-step wizard
- Maintain current step progress indicator
- Can add or remove steps as needed
- Keep step-by-step navigation

### 4. Medications Field
**Decision:** Keep as text field FOR NOW
- Current: Long-text field
- Note: Will make more complex later with dropdown
- Defer until later phase

### 5. Medical Conditions Field
**Decision:** Keep as text field FOR NOW
- Current: Long-text field
- Note: Will make more complex later with dropdown/checklist
- Defer until later phase

### 6. "Top 3 Goals" Field (#5)
**Decision:** Keep
- Maintain current long-text field
- No changes needed

### 7. Agreement Links
**Decision:** Keep on last step
- Keep all 3 disclaimer links on Step 6 where they are now
- No relocation needed

---

## 📋 REVISED SCOPE

Based on these decisions, the implementation plan is simplified to:

### OUT OF SCOPE (Deferred or Not Needed):
- ❌ Address field restructuring (keeping Mapbox)
- ❌ Signature relocation (keeping on Step 6)
- ❌ Medications dropdown (deferred)
- ❌ Medical conditions dropdown (deferred)
- ❌ Agreement links relocation (keeping on Step 6)
- ❌ "Top 3 goals" removal (keeping)

### IN SCOPE (Phase 1 - Immediate):
- ✅ Remove "Anything else providers" field
- ✅ Remove "If other therapy" field (if marked for removal)
- ✅ Change trauma history to Yes/No
- ✅ Add conditional logic for "Other procedures"
- ✅ Rephrase PT question with time period
- ✅ Clarify allergies prompt

### IN SCOPE (Phase 2 - Next):
- ✅ Add Primary Language dropdown with conditional "Other" field
- ✅ Split Emergency Contact into 3 fields
- ✅ Split Primary Care Physician (if still needed - TBD)

---

## 🎯 IMPLEMENTATION STRATEGY

1. **Commit all current work to git**
2. **Create feature branch:** `field-changes`
3. **Start Phase 1:** Low-risk removals and updates
4. **Test after Phase 1**
5. **Move to Phase 2:** Field additions
6. **Can rollback to main if issues occur**

---

**Next Step:** Create git commit and feature branch
