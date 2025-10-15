# Healthie Intake Form - Session Notes

## Current Status

### What's Working
- ✅ Console POC (Phase 1) - Completed
- ✅ API Layer (Phase 2) - Completed and running on http://localhost:5095
- ✅ Blazor UI (Phase 3) - In progress, running on http://localhost:5046
- ✅ Form loads all 50 fields from Healthie API
- ✅ Data flows from UI → API → Healthie staging environment
- ✅ Date of Birth field updated to use 3 separate boxes (MM, DD, YYYY)

### Active Processes
When you resume, you'll need to restart these background processes:

1. **API Server** (Terminal 1):
   ```bash
   cd /Users/corey/source/repos/healthie-intake/HealthieIntake.Api
   dotnet run
   ```
   - Runs on: http://localhost:5095

2. **Blazor UI** (Terminal 2):
   ```bash
   cd /Users/corey/source/repos/healthie-intake/HealthieIntake.UI
   dotnet run
   ```
   - Runs on: http://localhost:5046

### Recent Changes (This Session)

#### UI Control Updates
1. **Date of Birth Field** - Changed from single text input to 3 separate boxes:
   - Month (MM) - maxlength 2
   - Day (DD) - maxlength 2
   - Year (YYYY) - maxlength 4
   - On submit, combines to YYYY-MM-DD format
   - Location: `IntakeForm.razor:78-102`

2. **Fixed BMI Field** - Removed problematic quotes from placeholder:
   - Changed from: `placeholder='e.g., 5\'10", 180 lbs'`
   - Changed to: `placeholder="e.g., 5 feet 10 inches, 180 lbs"`
   - Location: `IntakeForm.razor:127-132`

3. **Fixed Dictionary Initialization**:
   - Date fields now use separate dictionaries: `dateMonths`, `dateDays`, `dateYears`
   - Other fields use `formAnswers` dictionary
   - Prevents "key not found" errors
   - Location: `IntakeForm.razor:216-233` and `300-317`

### Next Steps / TODO

User mentioned these UI controls need to be changed (not all identified yet):
- ❓ Date of Birth - ✅ DONE (changed to 3 boxes)
- ❓ Other controls TBD - User said "A few of the UI controls need to be changed"

To continue the control-by-control updates:
1. Ask user which control to update next
2. User will specify the field and desired control type
3. Update the switch statement in `IntakeForm.razor` for that `ModType`
4. Test the changes

### Key Files Modified This Session

1. **IntakeForm.razor** - Main form component
   - Added date part dictionaries (dateMonths, dateDays, dateYears)
   - Updated date field rendering to 3 inputs
   - Updated initialization logic for date vs non-date fields
   - Updated form clearing logic
   - Fixed BMI placeholder

### Test Patient Info
- Patient ID: 3642270
- Email: c88951@gmail.com
- Form ID: 2215494
- API Key: Stored in `HealthieIntake.Api/appsettings.json`

### Known Issues / Limitations
- Blazor WASM doesn't support hot reload - must restart `dotnet run` to see changes
- Browser hard refresh (Cmd+Shift+R) required after restarting to clear WASM cache
- CORS configured for specific localhost ports (5000, 5001, 5173, 5174, 5046)

### Form Field Types Currently Implemented
- text
- textarea
- date (3 separate boxes)
- radio / horizontal_radio (0-10 scale)
- checkbox (comma-separated text input)
- location (text input)
- signature (text input - type full name)
- BMI(in.) (text input)
- label (read-only display)
- read_only (read-only display)

### Architecture Overview

```
┌─────────────────────┐
│   Blazor WASM UI    │
│   (Port 5046)       │
└──────────┬──────────┘
           │ HTTP
           ↓
┌─────────────────────┐
│    ASP.NET API      │
│   (Port 5095)       │
└──────────┬──────────┘
           │ GraphQL
           ↓
┌─────────────────────┐
│   Healthie Staging  │
│   EMR System        │
└─────────────────────┘
```

### How to Resume Tomorrow

1. Read this file: `SESSION_NOTES.md`
2. Read: `REQUIREMENTS.md` (contains full project requirements)
3. Start API server (see Active Processes above)
4. Start Blazor UI (see Active Processes above)
5. Ask user: "Which UI control should we update next?"
6. Continue iterating through controls

### User's Workflow Preference
- Iterative approach: Console POC → API → UI
- Update REQUIREMENTS.md as we make progress
- Go control-by-control for UI updates
- Test after each change

### Commands Reference

**Build UI:**
```bash
cd /Users/corey/source/repos/healthie-intake/HealthieIntake.UI
dotnet build
```

**Run API:**
```bash
cd /Users/corey/source/repos/healthie-intake/HealthieIntake.Api
dotnet run
```

**Run UI:**
```bash
cd /Users/corey/source/repos/healthie-intake/HealthieIntake.UI
dotnet run
```

**Clean old shells:**
Multiple background processes may still be running. Check with `/bashes` and kill old ones if needed.

---
*Last updated: End of session - Date control implemented and working*
