# Healthie Intake Form - Architecture Documentation

## System Overview

This is a full-stack patient intake form application that integrates with the Healthie health platform API. The system allows patients to complete multi-step intake forms with draft-saving capabilities.

```
┌─────────────────┐         ┌──────────────────┐         ┌─────────────────┐
│                 │         │                  │         │                 │
│  React Frontend │◄────────│  Python FastAPI  │◄────────│  Healthie API   │
│   (Port 5173)   │  HTTP   │   (Port 5096)    │  GraphQL│   (External)    │
│                 │         │                  │         │                 │
└─────────────────┘         └──────────────────┘         └─────────────────┘
         │                           │
         │                           │
         │ localStorage              │ SQL
         │ (Draft Cache)             │
         │                           ▼
         │                  ┌─────────────────┐
         │                  │                 │
         └──────────────────│   PostgreSQL    │
           (Backup Draft)   │  (Port 5432)    │
                            │                 │
                            └─────────────────┘
```

## Architecture Layers

### 1. Frontend Layer (React + Vite)

**Technology Stack**:
- React 18.x - UI framework
- Vite - Build tool with HMR
- Bootstrap 5 - CSS framework
- Axios - HTTP client

**Key Responsibilities**:
- Multi-step form UI (6 steps)
- Client-side validation
- Draft auto-save to localStorage (every 30 seconds)
- Draft backup to database (every 30 seconds)
- Patient search interface
- Responsive design for mobile/desktop

**State Management**:
- React hooks (useState, useEffect)
- No Redux/Context needed - single component manages all state
- ~50+ state variables for form fields

**Data Flow**:
```
User Input → React State → localStorage → Backend API → PostgreSQL
                      ↓
                Auto-save every 30s
```

### 2. Backend Layer (Python FastAPI)

**Technology Stack**:
- FastAPI - Modern Python web framework
- Uvicorn - ASGI server
- Pydantic - Data validation
- SQLAlchemy - ORM (async)
- asyncpg - PostgreSQL async driver
- httpx - Async HTTP client for Healthie API

**Key Responsibilities**:
- RESTful API endpoints
- Healthie API integration (GraphQL)
- Database operations (CRUD)
- Data validation
- CORS handling
- Health monitoring

**Architecture Pattern**:
```
main.py (Controllers/Routes)
    ↓
repositories/ (Data Access)
    ↓
database.py (Connection Pool)
    ↓
PostgreSQL

main.py (Controllers/Routes)
    ↓
services/ (Business Logic)
    ↓
Healthie GraphQL API
```

**Layered Design**:
1. **Routes (main.py)** - HTTP endpoint handlers
2. **Services (services/)** - Business logic and external API calls
3. **Repositories (repositories/)** - Database operations
4. **Models (models/)** - Data structures and validation
5. **Database (database.py)** - Connection management

### 3. Database Layer (PostgreSQL)

**Schema Design**:

```sql
CREATE TABLE intake_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_healthie_id VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL,  -- 'draft' or 'completed'

    -- Patient Info
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    email VARCHAR(255),
    date_of_birth VARCHAR(10),
    phone VARCHAR(20),

    -- Form Data (JSONB for flexibility)
    form_data JSONB,

    -- Metadata
    current_step VARCHAR(10),
    schema_version VARCHAR(20) DEFAULT '1.0-poc',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    submitted_at TIMESTAMP
);

CREATE INDEX idx_patient_healthie_id ON intake_records(patient_healthie_id);
CREATE INDEX idx_status ON intake_records(status);
CREATE INDEX idx_email ON intake_records(email);
```

**Design Decisions**:
- **JSONB for form_data**: Allows flexible schema during POC phase
- **UUIDs for primary keys**: Better for distributed systems, no collision risk
- **Timestamps**: Track creation, updates, and submission separately
- **Indexes**: Fast lookups by patient_healthie_id, status, and email

### 4. External Integration Layer (Healthie API)

**Integration Method**: GraphQL over HTTP

**Key Operations**:
1. **Patient Search**:
   ```graphql
   query {
     users(search_term: "...", dob: "...") {
       id, first_name, last_name, email, dob
     }
   }
   ```

2. **Get Patient Details**:
   ```graphql
   query {
     user(id: "...") {
       id, first_name, last_name, email, dob
     }
   }
   ```

3. **Get Form Structure**:
   ```graphql
   query {
     customModuleForm(id: "...") {
       id, name, custom_modules
     }
   }
   ```

4. **Submit Form**:
   ```graphql
   mutation {
     createFormAnswerGroup(input: {...}) {
       form_answer_group { id }
     }
   }
   ```

**Error Handling**:
- Retry logic for transient failures
- Proper HTTP status codes returned to frontend
- Detailed logging for debugging

## Component Interactions

### Patient Search Flow

```
1. User enters name + DOB in frontend
2. Frontend → POST /api/healthie/patients/search
3. Backend → GraphQL query to Healthie
4. Healthie → Returns matching patients
5. Backend → Returns patient list to frontend
6. Frontend → Displays results, user selects
7. Frontend → Loads draft from database if exists
```

### Draft Save Flow

```
1. User types in form field
2. React state updates immediately
3. After 30 seconds (debounced):
   a. Save to localStorage (instant)
   b. POST /api/intake/draft (background)
4. Backend → Upsert to PostgreSQL
5. Success → Continue, Failure → Retry
```

### Form Submission Flow

```
1. User completes all steps
2. Frontend → Validates all fields
3. Frontend → POST /api/intake/submit
4. Backend → Checks for existing completed intake
5. Backend → Updates draft to 'completed' status
6. Backend → Saves to PostgreSQL
7. Backend → Returns success
8. Frontend → Shows thank you page
9. [Future] AWS Lambda → Syncs to Healthie
```

### Clear & Start Over Flow

```
1. User clicks "Clear & Start Over"
2. Frontend → Confirmation dialog
3. User confirms
4. Frontend → DELETE /api/intake/draft/{healthie_id}
5. Backend → Deletes draft from PostgreSQL
6. Frontend → Clears localStorage
7. Frontend → Resets all React state
8. Frontend → Returns to Step 1
```

## Data Models

### IntakeSubmission (Pydantic)

```python
class IntakeSubmission(BaseModel):
    # Metadata
    schema_version: str = "1.0-poc"
    status: str = "draft"
    current_step: Optional[str]
    created_at: Optional[datetime]
    last_updated_at: Optional[datetime]
    submitted_at: Optional[datetime]

    # Patient Info
    patient_healthie_id: str
    first_name: str
    last_name: str
    email: str
    date_of_birth: str
    phone: Optional[str]

    # Flexible form data
    form_data: Dict[str, Any]
```

### IntakeRecord (SQLAlchemy ORM)

```python
class IntakeRecord(Base):
    __tablename__ = "intake_records"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    patient_healthie_id = Column(String(50), nullable=False, index=True)
    status = Column(String(20), nullable=False, index=True)

    # Patient fields
    first_name = Column(String(100))
    last_name = Column(String(100))
    email = Column(String(255), index=True)
    date_of_birth = Column(String(10))
    phone = Column(String(20))

    # Flexible form data
    form_data = Column(JSON)

    # Metadata
    current_step = Column(String(10))
    schema_version = Column(String(20), default="1.0-poc")
    created_at = Column(DateTime, default=datetime.utcnow)
    last_updated_at = Column(DateTime, default=datetime.utcnow)
    submitted_at = Column(DateTime, nullable=True)
```

## Security Considerations

### Current Security Measures

1. **API Key Protection**:
   - Healthie API key stored in backend .env file
   - Never exposed to frontend
   - Not committed to git

2. **CORS Configuration**:
   - Whitelist specific origins
   - Credentials allowed for auth
   - Prevents unauthorized domains

3. **Input Validation**:
   - Pydantic models validate all inputs
   - SQL injection prevented by ORM
   - XSS prevented by React's escaping

4. **Database Security**:
   - Connection pooling with proper limits
   - Prepared statements via SQLAlchemy
   - No raw SQL execution

### Security TODO (Production)

- [ ] HTTPS/SSL for all connections
- [ ] Rate limiting on API endpoints
- [ ] Authentication for admin endpoints
- [ ] Encryption at rest for sensitive data
- [ ] Audit logging for HIPAA compliance
- [ ] Session management
- [ ] CSRF tokens
- [ ] Content Security Policy headers

## Performance Optimizations

### Current Optimizations

1. **Database**:
   - Indexes on frequently queried fields
   - Connection pooling
   - Async operations (non-blocking)

2. **Frontend**:
   - Vite for fast builds and HMR
   - Debounced auto-save (30s)
   - Local storage for instant load

3. **Backend**:
   - Async FastAPI (handles many concurrent requests)
   - Connection reuse for Healthie API
   - Efficient SQLAlchemy queries

### Future Optimizations

- [ ] Redis caching for form structures
- [ ] CDN for static assets
- [ ] Database read replicas
- [ ] GraphQL query optimization
- [ ] Lazy loading for large forms
- [ ] Image optimization for signatures

## Deployment Architecture

### Current (Development)

```
Local Machine:
├── Frontend (Vite dev server, port 5173)
├── Backend (Docker container, port 5096)
└── PostgreSQL (Host machine, port 5432)
```

### Planned (Production)

```
AWS Infrastructure:
├── Frontend (S3 + CloudFront)
├── Backend (ECS/Fargate or Lambda)
├── Database (RDS PostgreSQL)
├── Lambda Functions (Healthie sync)
└── Route53 (DNS)
```

## Error Handling Strategy

### Frontend Error Handling

1. **Network Errors**:
   - Axios interceptors for global error handling
   - User-friendly error messages
   - Retry logic for transient failures

2. **Validation Errors**:
   - Inline field validation
   - Step-level validation before proceeding
   - Clear error messages

3. **Draft Load Errors**:
   - Graceful degradation to empty form
   - Log errors to console
   - Don't block user progress

### Backend Error Handling

1. **HTTP Exceptions**:
   - Standard HTTP status codes
   - JSON error responses with details
   - Logging for debugging

2. **Database Errors**:
   - Transaction rollback on failure
   - Connection pool recovery
   - Detailed error logging

3. **External API Errors**:
   - Healthie API error mapping
   - Retry with exponential backoff
   - Circuit breaker pattern (future)

## Monitoring and Observability

### Current Monitoring

1. **Health Endpoints**:
   - `GET /` - Basic health check
   - `GET /health` - Detailed status with DB check

2. **Logging**:
   - Python logging module
   - Structured logs with timestamps
   - Log levels: INFO, ERROR, DEBUG

3. **Development Tools**:
   - Docker logs: `docker logs healthie-api-py --follow`
   - Browser DevTools for frontend debugging
   - PostgreSQL logs

### Production Monitoring (Planned)

- [ ] Application Performance Monitoring (APM)
- [ ] Error tracking (Sentry)
- [ ] Metrics dashboard (Grafana)
- [ ] Log aggregation (CloudWatch)
- [ ] Alerting (PagerDuty)
- [ ] Uptime monitoring

## Testing Strategy

### Current Testing

- Manual testing with test patient (ID: 3642270)
- API endpoint testing with curl
- Browser testing across desktop/mobile

### Planned Testing

- [ ] Unit tests for backend (pytest)
- [ ] Integration tests for API endpoints
- [ ] Frontend component tests (React Testing Library)
- [ ] End-to-end tests (Playwright/Cypress)
- [ ] Load testing (Locust)
- [ ] Security testing (OWASP ZAP)

## Scalability Considerations

### Current Limitations

- Single Docker container for backend
- No load balancing
- No caching layer
- Single database instance

### Scalability Plan

1. **Horizontal Scaling**:
   - Multiple backend instances behind load balancer
   - Stateless design (no session affinity needed)

2. **Database Scaling**:
   - Read replicas for queries
   - Write master for updates
   - Connection pooling tuning

3. **Caching**:
   - Redis for form structures
   - Browser caching for static assets
   - CDN for global distribution

4. **Async Processing**:
   - Message queue for Healthie sync (SQS)
   - Background workers for heavy tasks
   - Webhook handlers for notifications

## Future Enhancements

### Short Term

1. AWS Lambda integration for Healthie sync
2. Email notifications on submission
3. Admin dashboard for viewing submissions
4. PDF export of completed forms

### Long Term

1. Multi-form support (different intake forms)
2. Conditional logic in forms
3. File upload support (documents, images)
4. E-signature with legal compliance
5. Multi-language support
6. Accessibility improvements (WCAG 2.1 AA)
7. Mobile app (React Native)

## Technical Debt

### Known Issues

1. Frontend: 2800+ line single component (needs refactoring)
2. Form validation scattered across component
3. No automated tests
4. Manual Healthie sync process
5. Console 404 errors (harmless but noisy)

### Refactoring Priorities

1. **High Priority**:
   - Break IntakeForm.jsx into smaller components
   - Add automated testing
   - Implement proper error boundaries

2. **Medium Priority**:
   - Extract form validation logic
   - Create custom hooks for reusable logic
   - Add TypeScript for type safety

3. **Low Priority**:
   - Optimize bundle size
   - Implement code splitting
   - Add service worker for offline support

## Development Guidelines

### Code Style

- **Python**: PEP 8 with Black formatter
- **JavaScript**: ESLint with Airbnb config
- **SQL**: Lowercase with underscores

### Git Workflow

- Main branch for stable code
- Feature branches for new work
- Descriptive commit messages
- Merge via pull requests (future)

### Documentation

- Inline comments for complex logic
- Docstrings for all functions
- README for setup instructions
- Architecture docs (this file)

## Conclusion

This architecture provides a solid foundation for a patient intake system with room for growth. The modular design allows for easy scaling and feature additions while maintaining code quality and performance.
