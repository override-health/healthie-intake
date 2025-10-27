# Stack Choice Decision - 2025-10-27

## Decision

**Active Development Stack:** React + Python FastAPI

## Rationale

### Why React over Blazor?
- ✅ **Instant hot module replacement** - Changes visible immediately without restart
- ✅ **Smaller bundle size** - 270 KB vs 5 MB (18x smaller)
- ✅ **Faster initial load** - ~500ms vs ~2-3s
- ✅ **Better developer experience** - No restart needed after every change
- ✅ **Larger ecosystem** - More libraries and community support
- ✅ **Easier debugging** - Standard JavaScript DevTools

### Why Python FastAPI over .NET?
- ✅ **Automatic API documentation** - Swagger/ReDoc generated automatically
- ✅ **Faster development** - No compilation step, instant reload
- ✅ **Less boilerplate** - More concise code
- ✅ **Lower memory footprint** - ~40 MB vs ~80 MB (50% less)
- ✅ **Easier deployment** - Simpler containerization
- ✅ **Modern async patterns** - Built-in async/await support

## Active Projects

### Frontend
- **Location:** `HealthieIntake.UI.React/`
- **Port:** 5173
- **Tech:** React 18, Vite, JavaScript, Bootstrap 5
- **Start:** `npm run dev`

### Backend
- **Location:** `HealthieIntake.Api.Py/`
- **Port:** 5096
- **Tech:** Python 3.11+, FastAPI, gql, Pydantic
- **Start:** `python main.py`

## Archived Projects

- **Location:** `_archive/`
- **Projects:**
  - `HealthieIntake.UI` - Blazor WebAssembly (Port 5046)
  - `HealthieIntake.Api` - ASP.NET Core API (Port 5095)
- **Status:** Fully functional, preserved for reference
- **Note:** At 100% feature parity with active stack

## Quick Start

```bash
# Terminal 1: Start Python API
cd /Users/corey/source/repos/healthie-intake/HealthieIntake.Api.Py
source venv/bin/activate  # Activate virtual environment
python main.py            # Runs on http://localhost:5096

# Terminal 2: Start React UI
cd /Users/corey/source/repos/healthie-intake/HealthieIntake.UI.React
npm run dev              # Runs on http://localhost:5173
```

## Configuration Changes Needed

### React UI
The React UI is already configured to use port 5096. Check `src/config.js`:
```javascript
export const API_BASE_URL = 'http://localhost:5096';
```

If it's still pointing to 5095, update it to 5096.

## Known Issues (Carried Over)

Both stacks share the same known issues from the original implementation:
1. **Weight field** - Not submitting properly to Healthie (DEFERRED)
2. **BMI field** - Explicitly deferred until requested

## Next Steps

1. Verify React UI points to Python API (port 5096)
2. Test full form submission with Python backend
3. Address weight field issue (if needed)
4. Continue feature development on React/Python stack

## Notes

- All git history preserved
- Can reference archived code anytime
- Can rollback to .NET/Blazor if ever needed (unlikely)
- Console POC (`HealthieIntake.Console`) kept for reference
