# Healthie Intake Form - React UI

React version of the Healthie patient intake form, functionally identical to the Blazor UI.

## Features

- ✅ 6-step form wizard with progress tracking
- ✅ All field types: text, textarea, date (MM/DD/YYYY), radio, checkbox, location, signature, BMI calculator
- ✅ Mapbox address autocomplete with proper cleanup
- ✅ Canvas-based signature pad
- ✅ LocalStorage auto-save/restore
- ✅ Override Health branding (Navy #050038, Green #1CB783)
- ✅ Same API integration (connects to http://localhost:5095)
- ✅ Same data format as Blazor version

## Tech Stack

- **React 18** - Functional components with hooks
- **Vite** - Fast development server
- **Axios** - HTTP requests
- **Bootstrap 5** - UI framework
- **Mapbox GL JS** - Address autocomplete
- **signature_pad** - Canvas signature capture

## Prerequisites

- Node.js 16+ and npm
- Healthie API running on http://localhost:5095
- Mapbox Access Token (for address autocomplete)

## Setup

1. **Install dependencies:**
   ```bash
   cd /Users/corey/source/repos/healthie-intake/HealthieIntake.UI.React
   npm install
   ```

2. **Configure Mapbox token:**
   ```bash
   # Copy the example env file
   cp .env.example .env

   # Edit .env and add your Mapbox token
   # Get a token from https://account.mapbox.com/access-tokens/
   ```

3. **Verify API is running:**
   - Make sure the HealthieIntake.Api is running on http://localhost:5095
   - You can start it from another terminal:
     ```bash
     cd /Users/corey/source/repos/healthie-intake/HealthieIntake.Api
     dotnet run
     ```

## Running the App

```bash
npm run dev
```

The app will start on **http://localhost:5173** (or next available port)

## Build for Production

```bash
npm run build
```

The production build will be in the `dist/` folder.

## Project Structure

```
HealthieIntake.UI.React/
├── src/
│   ├── components/
│   │   ├── IntakeForm.jsx         # Main form component (1000+ lines)
│   │   ├── MapboxAddressInput.jsx # Address autocomplete component
│   │   └── SignaturePad.jsx       # Signature canvas component
│   ├── styles/
│   │   └── override-brand.css     # Override Health branding
│   ├── config.js                  # API configuration
│   ├── App.jsx                    # Root component
│   └── main.jsx                   # Entry point
├── public/                        # Static assets
├── index.html                     # HTML template
├── package.json                   # Dependencies
└── vite.config.js                 # Vite configuration
```

## Configuration

All configuration is in `src/config.js`:

- **API_BASE_URL**: http://localhost:5095 (same API as Blazor version)
- **PATIENT_ID**: 3642270 (default test patient)
- **FORM_ID**: 2215494 (Override App: Intake Form)

## Comparison with Blazor

This React version is a **functionally identical** port of the Blazor UI:

| Feature | Blazor | React |
|---------|--------|-------|
| Port | 5046 | 5173 |
| Language | C# / Razor | JavaScript / JSX |
| Framework | Blazor WASM | React 18 |
| Build Tool | .NET 9 | Vite |
| State Management | Component state | useState/useEffect hooks |
| API Calls | HttpClient | Axios |
| Hot Reload | ❌ Not reliable | ✅ Fast HMR |
| Bundle Size | ~5MB (WASM) | ~300KB (minified) |

## Key Differences from Blazor

### Advantages of React version:
- ✅ **Fast Hot Module Replacement (HMR)** - instant updates without full restart
- ✅ **Smaller bundle size** - faster initial load
- ✅ **More ecosystem libraries** - larger community
- ✅ **Easier debugging** - standard JavaScript tools

### Advantages of Blazor version:
- ✅ **Type safety** - C# compile-time checks
- ✅ **Code sharing** - Can share models with API
- ✅ **Single language** - C# everywhere

## Development Notes

### No Changes to API Required
This React UI uses the **exact same API endpoints** as the Blazor version:
- `GET /api/healthie/forms/{formId}` - Get form structure
- `POST /api/healthie/forms/submit` - Submit form

### LocalStorage Keys
Form progress is saved to localStorage with key: `healthie_intake_{patientId}`

### Step Filtering
The form filters which fields appear on each step using the same logic as Blazor:
- **Step 1**: Welcome message
- **Step 2**: Personal Information (includes location/address field)
- **Step 3**: Demographics & Emergency Contact (excludes location)
- **Step 4**: Pain Assessment (excludes location)
- **Step 5**: Medical History (excludes location and Patient Agreement)
- **Step 6**: Patient Agreement & Signature

### Known Issues from Blazor
The React version addresses the following issues from Blazor:
- ✅ **No restart needed** - HMR works reliably
- ✅ **Address field cleanup** - Properly destroys Mapbox instance on unmount
- ✅ **Signature pad initialization** - Prevents duplicate loading

## Testing

1. Start the API server (port 5095)
2. Start the React app: `npm run dev`
3. Open http://localhost:5173
4. Fill out the form and submit
5. Verify submission in Healthie staging environment

## Troubleshooting

**Mapbox not loading:**
- Check that `VITE_MAPBOX_TOKEN` is set in `.env`
- Verify the token is valid at https://account.mapbox.com/

**API connection errors:**
- Verify API is running: `curl http://localhost:5095/api/healthie/forms/2215494`
- Check CORS is enabled for port 5173

**Signature pad not working:**
- Make sure canvas is visible (not hidden by CSS)
- Check browser console for errors

## License

Internal use only - Override Health
