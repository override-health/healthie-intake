// API Configuration
// Use environment variable if available, otherwise default to localhost for development
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5096';

// Healthie Form Configuration
export const PATIENT_ID = '3642270';
export const FORM_ID = '2215494';

// Mapbox Configuration
export const MAPBOX_ACCESS_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || 'YOUR_MAPBOX_TOKEN_HERE';
