# CRITICAL RESTART REMINDER

## ALWAYS RESTART AFTER EVERY CODE CHANGE

### Rules:
1. **UI file changes** (IntakeForm.razor, any .razor file, wwwroot/js files) → **RESTART PORT 5046**
2. **API file changes** (HealthieController.cs, any .cs file in API project) → **RESTART PORT 5095**

### Commands:
```bash
# Restart UI (port 5046)
lsof -ti:5046 | xargs kill -9 2>/dev/null; sleep 2 && dotnet run

# Restart API (port 5095)
cd /Users/corey/source/repos/healthie-intake/HealthieIntake.Api && lsof -ti:5095 | xargs kill -9 2>/dev/null; sleep 2 && dotnet run
```

## NEVER:
- ❌ Tell user to hard refresh
- ❌ Tell user to clear cache
- ❌ Skip restarting after a change
- ❌ Assume Blazor hot reload will work

## ALWAYS:
- ✅ Restart immediately after EVERY code change
- ✅ Run the restart command in background
- ✅ Verify the service is running after restart

## Why:
Blazor WebAssembly does NOT support hot reload reliably. Changes will NOT be visible without a full service restart. Hard refresh does NOTHING without restarting the service first.

---

**Date Created:** 2025-10-16
**User Frustration Level:** MAXIMUM
**Times This Has Been An Issue:** TOO MANY

**THIS IS NOT OPTIONAL. RESTART EVERY SINGLE TIME.**
