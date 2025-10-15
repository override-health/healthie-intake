# Project Requirements

## Overview
Web-based patient intake form that collects onboarding information from patients and submits the completed form to Healthie EMR system via their GraphQL API.

## Goals
- Streamline patient onboarding process
- Integrate seamlessly with Healthie EMR system
- Provide user-friendly intake experience

## Development Phases

### Phase 1: POC - Console Application
**Status:** ✅ Complete

**Requirements:**
- Connect to Healthie GraphQL API ✅
- Retrieve patient information by ID ✅
- Retrieve custom form structure ✅
- Create/submit form responses for a patient ✅
- Test end-to-end form submission workflow ✅

**Technical Notes:**
- Successfully connected to staging API
- Patient ID: 3642270 (c88951@gmail.com)
- Custom Form ID: 2215494 ("Override App: Intake Form")
- Form contains 50 fields including text, radio, checkbox, textarea, signature, etc.
- GraphQL queries working: `currentUser`, `user(id)`, `customModuleForm(id)`
- GraphQL mutation working: `createFormAnswerGroup`
- Test form submission successful - Form Answer Group ID: 1123151
- Created C# models: Patient, CustomModule, CustomModuleForm, FormAnswerGroupInput
- Created HealthieApiClient service for API interactions

---

### Phase 2: API
**Status:** ✅ Complete

**Requirements:**
- Create ASP.NET Core Web API project ✅
- Move HealthieApiClient to API layer ✅
- Create REST API endpoints for Healthie operations ✅
- Add Docker support ✅
- Test API endpoints ✅

**Technical Notes:**
- Created HealthieIntake.Api project (ASP.NET Core 9.0)
- API Endpoints created:
  - `GET /api/healthie/patients/{patientId}` - Get patient by ID
  - `GET /api/healthie/forms/{formId}` - Get form structure
  - `POST /api/healthie/forms/submit` - Submit completed form
  - `GET /api/healthie/patients/{patientId}/forms` - List patient's forms
  - `GET /api/healthie/forms/details/{formAnswerGroupId}` - Get form details
  - `DELETE /api/healthie/forms/{formAnswerGroupId}` - Delete form
- Reused Models and HealthieApiClient from Phase 1
- Configured dependency injection for HealthieApiClient
- Added Dockerfile for containerization
- Tested locally on port 5095 - all endpoints working
- Ready for Docker deployment when Docker daemon is running

---

### Phase 3: UI
**Status:** Not Started

**Requirements:**
-

**Technical Notes:**
-

---

## Technical Stack
- .NET 9.0 / C#
- Healthie GraphQL API
- API Key authentication
- GraphQL.Client library

## API Configuration
- **Environment:** Staging
- **API Endpoint:** https://staging-api.gethealthie.com/graphql
- **API Key:** Stored in appsettings.json (gitignored for production/development variants)

## Resources
- **Healthie Documentation Hub:** https://docs.gethealthie.com/
  - Quickstart Guide: https://docs.gethealthie.com/guides/intro
  - GraphQL Schema Explorer: https://docs.gethealthie.com/explorer
  - API Reference: https://docs.gethealthie.com/reference
- **NPM SDKs:** https://www.npmjs.com/@healthie/sdk
- **Help Documentation:** https://help.gethealthie.com/
- **GitHub Examples:** https://github.com/healthie
  - Sample Booking Widget (TypeScript): https://github.com/healthie/healthie_sample_booking_widget
  - Dev Assist (JavaScript): https://github.com/healthie/healthie-dev-assist

## Notes
- Using existing Healthie staging API key for authentication
- Will start with POC to test API integration before building full solution
- API keys stored in appsettings.json for easy reference across sessions
