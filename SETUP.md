# Healthie Intake Form - Setup Guide

Complete setup instructions for running this project on a new machine.

## Prerequisites

### Required Software

1. **Git**
   ```bash
   git --version  # Should be 2.x or higher
   ```

2. **Docker Desktop**
   - Download from: https://www.docker.com/products/docker-desktop
   - Must be running before starting backend

3. **PostgreSQL**
   - Version 12 or higher
   - Running on localhost:5432
   - Database: `override-intake`
   - User: `corey` (or update DATABASE_URL in .env)

4. **Node.js & npm**
   ```bash
   node --version  # Should be 18.x or higher
   npm --version   # Should be 9.x or higher
   ```

5. **Python 3**
   ```bash
   python3 --version  # Should be 3.9 or higher
   pip3 --version
   ```

## Initial Setup

### 1. Clone Repository

```bash
git clone https://github.com/c88951/healthie-intake.git
cd healthie-intake
```

### 2. Database Setup

Create PostgreSQL database and run migrations:

```bash
# Create database (if not exists)
createdb override-intake

# Run migrations
psql -U corey -d override-intake -f migrations/001_add_draft_support.sql
```

**Verify database**:
```bash
psql -U corey -d override-intake -c "\dt"
# Should show: intake_records table
```

### 3. Backend Setup (Python FastAPI)

```bash
cd HealthieIntake.Api.Py
```

#### Create virtual environment (optional but recommended)
```bash
python3 -m venv venv
source venv/bin/activate  # On macOS/Linux
# OR
venv\Scripts\activate  # On Windows
```

#### Install dependencies
```bash
pip install --upgrade pip
pip install -r requirements.txt
```

#### Configure environment variables

Ensure `.env` file exists with correct values:
```bash
cat .env
```

Should contain:
```
HEALTHIE_API_URL=https://staging-api.gethealthie.com/graphql
HEALTHIE_API_KEY=gh_sbox_M5NFMUJfUhP3ug5a5TPJPss1pBvtkEgqqHeEsDk3PZwxvM6Spn2K9Up4Q5Ff1Luq
HOST=0.0.0.0
PORT=5096
DATABASE_URL=postgresql+asyncpg://corey@host.docker.internal:5432/override-intake
```

**Note**: Update `DATABASE_URL` if using different PostgreSQL user/password.

#### Build Docker image

```bash
docker build -t healthie-api-py .
```

### 4. Frontend Setup (React)

Open a new terminal window/tab:

```bash
cd HealthieIntake.UI.React
```

#### Install dependencies
```bash
npm install
```

#### Verify configuration

Check `src/config.js`:
```javascript
export const API_BASE_URL = 'http://localhost:5096';
export const PATIENT_ID = '3642270';
export const FORM_ID = '2215494';
```

## Running the Application

### Start Backend (Python API)

Make sure Docker Desktop is running, then:

```bash
cd HealthieIntake.Api.Py

# Run Docker container
docker run -d --name healthie-api-py -p 5096:5096 --env-file .env healthie-api-py

# View logs (optional)
docker logs healthie-api-py --follow
```

**Verify backend is running**:
- Visit: http://localhost:5096
- Should see: `{"name":"Healthie Intake API (Python)","version":"1.0.0","status":"running"}`

**Health check**:
- Visit: http://localhost:5096/health
- Should show database connection status

### Start Frontend (React)

Open a new terminal:

```bash
cd HealthieIntake.UI.React
npm run dev
```

**Access application**:
- Visit: http://localhost:5173
- Should see the patient intake form

## Testing the Application

### Test Patient Search

Use these credentials to test patient lookup:
- **First Name**: Corey
- **Last Name**: Eight
- **Date of Birth**: 08/05/1985

### Test Form Flow

1. Search for patient (use credentials above)
2. Fill out form across multiple steps
3. Form auto-saves every 30 seconds
4. Can navigate away and return - draft will load
5. Submit completed form

### Test Clear & Start Over

1. Search for patient and start filling form
2. Click "Clear & Start Over" button
3. Confirms draft deletion
4. Returns to Step 1 with clean state

### Test API Endpoints

```bash
# Health check
curl http://localhost:5096/health

# Search patients
curl -X POST http://localhost:5096/api/healthie/patients/search \
  -H "Content-Type: application/json" \
  -d '{"first_name":"Corey","last_name":"Eight","dob":"1985-08-05"}'

# Check for draft (replace with actual healthie_id)
curl http://localhost:5096/api/intake/draft/3642270

# List all intakes
curl http://localhost:5096/api/intake/list
```

## Stopping the Application

### Stop Frontend
- Press `Ctrl+C` in the terminal running `npm run dev`

### Stop Backend
```bash
docker stop healthie-api-py
docker rm healthie-api-py
```

## Troubleshooting

### Backend won't start

1. **Check Docker is running**:
   ```bash
   docker ps
   ```

2. **Check if port 5096 is in use**:
   ```bash
   lsof -ti:5096 | xargs kill  # Kill process on port 5096
   ```

3. **Check Docker logs**:
   ```bash
   docker logs healthie-api-py
   ```

4. **Rebuild Docker image**:
   ```bash
   docker stop healthie-api-py
   docker rm healthie-api-py
   docker rmi healthie-api-py
   docker build -t healthie-api-py .
   docker run -d --name healthie-api-py -p 5096:5096 --env-file .env healthie-api-py
   ```

### Database connection fails

1. **Check PostgreSQL is running**:
   ```bash
   psql -U corey -d override-intake -c "SELECT 1"
   ```

2. **Check database exists**:
   ```bash
   psql -U corey -l | grep override-intake
   ```

3. **Verify migrations ran**:
   ```bash
   psql -U corey -d override-intake -c "\dt"
   # Should show intake_records table
   ```

4. **Check DATABASE_URL in .env**:
   - Must use `host.docker.internal` (not `localhost`) when running in Docker
   - Must use `postgresql+asyncpg://` prefix for async SQLAlchemy

### Frontend won't start

1. **Check Node version**:
   ```bash
   node --version  # Should be 18+
   ```

2. **Clear node_modules and reinstall**:
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

3. **Check port 5173 is available**:
   ```bash
   lsof -ti:5173 | xargs kill  # Kill process on port 5173
   ```

### Draft not loading

1. **Check browser console** for errors
2. **Check localStorage**:
   - Open DevTools → Application → Local Storage
   - Look for key: `healthie_intake_3642270`
3. **Check database**:
   ```bash
   psql -U corey -d override-intake -c "SELECT * FROM intake_records WHERE patient_healthie_id = '3642270';"
   ```

### API returns 404 for draft

This is expected if no draft exists yet. The frontend handles 404 gracefully.

### CORS errors

Ensure backend CORS middleware is configured correctly in `main.py`:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,  # Should include frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

## Development Workflow

### Making Changes

1. **Backend changes**:
   ```bash
   # Edit files in HealthieIntake.Api.Py/
   # Rebuild and restart Docker container
   docker stop healthie-api-py
   docker rm healthie-api-py
   docker build -t healthie-api-py .
   docker run -d --name healthie-api-py -p 5096:5096 --env-file .env healthie-api-py
   ```

2. **Frontend changes**:
   - Vite provides hot module reload (HMR)
   - Changes appear automatically in browser
   - No restart needed

### Database Migrations

1. Create migration file in `/migrations/`
2. Run migration:
   ```bash
   psql -U corey -d override-intake -f migrations/YOUR_MIGRATION.sql
   ```

### Committing Changes

```bash
git add .
git commit -m "Your commit message"
git push origin main
```

## Production Considerations

**Not Yet Configured**:
- Environment-specific configs (dev/staging/prod)
- SSL/HTTPS setup
- Production database credentials
- AWS Lambda integration for Healthie sync
- Email notifications
- Error monitoring (Sentry, etc.)
- CI/CD pipeline

## Getting Help

- Check `PROJECT_STATE.md` for current project status
- Review `ARCHITECTURE.md` for system design details
- Check Docker logs: `docker logs healthie-api-py`
- Check browser console for frontend errors
- Check PostgreSQL logs if database issues occur

## Quick Reference

### Backend
- **URL**: http://localhost:5096
- **Health**: http://localhost:5096/health
- **API Docs**: http://localhost:5096/docs (FastAPI auto-generated)

### Frontend
- **URL**: http://localhost:5173
- **Build**: `npm run build`
- **Preview**: `npm run preview`

### Database
- **Host**: localhost:5432
- **Database**: override-intake
- **User**: corey
- **Table**: intake_records

### Docker
- **Container**: healthie-api-py
- **Image**: healthie-api-py
- **Port**: 5096:5096

### Test Data
- **Patient ID**: 3642270
- **Form ID**: 2215494
- **Name**: Corey Eight
- **DOB**: 08/05/1985
- **Email**: corey@override.health
