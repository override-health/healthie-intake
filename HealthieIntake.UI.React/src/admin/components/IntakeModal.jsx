import { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL, FORM_ID } from '../../config';

function IntakeModal({ intake, onClose }) {
  const [showRawJson, setShowRawJson] = useState(false);
  const [formDefinition, setFormDefinition] = useState(null);
  const [loadingForm, setLoadingForm] = useState(true);

  // Fetch form definition to get question labels
  useEffect(() => {
    const fetchFormDefinition = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/healthie/forms/${FORM_ID}`);
        setFormDefinition(response.data);
      } catch (error) {
        console.error('Error fetching form definition:', error);
      } finally {
        setLoadingForm(false);
      }
    };

    if (intake) {
      fetchFormDefinition();
    }
  }, [intake]);

  if (!intake) return null;

  // Helper to format medication list
  const formatMedications = (medications) => {
    if (!medications || medications.length === 0) return 'None';

    return medications.map((med, index) => (
      <div key={index} className="mb-2">
        <strong>{med.drugName || 'N/A'}</strong>
        {med.dosage && <span> - {med.dosage}</span>}
        {med.startDate && <span> - Started: {med.startDate}</span>}
        {med.endDate && <span> - Ended: {med.endDate}</span>}
        {med.directions && <div className="text-muted small">{med.directions}</div>}
      </div>
    ));
  };

  // Helper to check if a string is a base64 image
  const isBase64Image = (str) => {
    if (typeof str !== 'string') return false;
    return str.startsWith('data:image/') ||
           (str.length > 100 && /^[A-Za-z0-9+/=]+$/.test(str.substring(0, 100)));
  };

  // Helper to check if an object is a signature object
  const isSignatureObject = (obj) => {
    if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return false;
    return ('imageDataURL' in obj || 'typedName' in obj || 'agreed' in obj || 'timestamp' in obj);
  };

  // Helper to extract signature data for consent section
  const extractSignatureData = () => {
    if (!intake.form_data?.answers) return null;

    // First, check for the specific Healthie signature module ID
    const signatureValue = intake.form_data.answers['19056501'];
    if (signatureValue) {
      // If it's a string, parse it as JSON
      if (typeof signatureValue === 'string') {
        try {
          return JSON.parse(signatureValue);
        } catch (e) {
          console.error('Failed to parse signature data:', e);
        }
      }
      // If it's already an object, return it
      if (isSignatureObject(signatureValue)) {
        return signatureValue;
      }
    }

    // Fallback: Find any field with "signature" in the name or a signature object
    const signatureEntry = Object.entries(intake.form_data.answers).find(([key, value]) => {
      return key.toLowerCase().includes('signature') || isSignatureObject(value);
    });

    return signatureEntry ? signatureEntry[1] : null;
  };

  // Helper to format any value in a human-readable way
  const formatValue = (value, questionId) => {
    if (value === null || value === undefined || value === '') return 'Not answered';

    // Skip signature objects - they'll be rendered in the consent section
    if (isSignatureObject(value)) {
      return null; // Don't render signature in form responses
    }

    // Check if it's a base64 image or data URL
    if (typeof value === 'string' && isBase64Image(value)) {
      const imgSrc = value.startsWith('data:') ? value : `data:image/png;base64,${value}`;
      return (
        <div className="mt-2">
          <img
            src={imgSrc}
            alt="Signature"
            style={{
              maxWidth: '100%',
              maxHeight: '200px',
              border: '1px solid #d1d1d6',
              borderRadius: '8px',
              padding: '8px',
              backgroundColor: '#fff'
            }}
          />
        </div>
      );
    }

    if (Array.isArray(value)) {
      if (value.length === 0) return 'None selected';
      return (
        <ul className="mb-0 ps-3">
          {value.map((item, index) => (
            <li key={index}>{typeof item === 'object' ? JSON.stringify(item) : item}</li>
          ))}
        </ul>
      );
    }

    if (typeof value === 'object') {
      return (
        <div className="ps-2">
          {Object.entries(value).map(([key, val]) => (
            <div key={key} className="mb-1">
              <span className="text-muted">{key}:</span> {String(val)}
            </div>
          ))}
        </div>
      );
    }

    if (typeof value === 'boolean') return value ? 'Yes' : 'No';

    return String(value);
  };

  // Get question label from form definition or use custom field mapping
  const getQuestionLabel = (questionId) => {
    // First check if we have the form definition loaded
    if (formDefinition && formDefinition.customModules) {
      const module = formDefinition.customModules.find(m => m.id === questionId);
      if (module && module.label) {
        return module.label;
      }
    }

    // Fallback to custom field mapping for special fields and signature components
    const customFieldMap = {
      // Signature fields
      '19056501_agreed': 'Patient Agreement Consent',
      '19056501_timestamp': 'Signature Timestamp',
      '19056501_typed_name': 'Typed Name',
      '19056501_image': 'Signature Image',

      // Custom fields (camelCase versions)
      'primaryLanguage': 'Primary Language',
      'primary_language': 'Primary Language',
      'primaryCareProviderPhone': 'Primary Care Provider Phone',
      'primary_care_provider_phone': 'Primary Care Provider Phone',
      'emergencyContactName': 'Emergency Contact Name',
      'emergency_contact_name': 'Emergency Contact Name',
      'emergencyContactRelationship': 'Emergency Contact Relationship',
      'emergency_contact_relationship': 'Emergency Contact Relationship',
      'emergencyContactPhone': 'Emergency Contact Phone',
      'emergency_contact_phone': 'Emergency Contact Phone',
      'hospitalizedRecently': 'Recently Hospitalized',
      'hospitalized_recently': 'Recently Hospitalized',
      'hasMedicationAllergies': 'Has Medication Allergies',
      'has_medication_allergies': 'Has Medication Allergies',
      'participatingInPT': 'Participating in Physical Therapy',
      'participating_in_pt': 'Participating in Physical Therapy',
      'engagesInPhysicalActivity': 'Engages in Physical Activity',
      'engages_in_physical_activity': 'Engages in Physical Activity',
      'physicalActivityDescription': 'Physical Activity Description',
      'physical_activity_description': 'Physical Activity Description',
      'medications_structured': 'Current Medications',
      'past_medications_structured': 'Past Medications',
    };

    return customFieldMap[questionId] || `Question ${questionId}`;
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="modal-backdrop fade show"
        onClick={onClose}
        style={{ zIndex: 1040 }}
      ></div>

      {/* Modal */}
      <div
        className="modal fade show d-block"
        tabIndex="-1"
        style={{ zIndex: 1050 }}
      >
        <div className="modal-dialog modal-xl modal-dialog-scrollable">
          <div className="modal-content">
            {/* Header */}
            <div className="modal-header" style={{ backgroundColor: 'white', borderBottom: '1px solid #dee2e6' }}>
              <div className="d-flex align-items-center gap-3">
                <img
                  src="https://i0.wp.com/override.health/wp-content/uploads/2025/08/Override-Logo_Full-Color-e1757963862728.png?w=2860&ssl=1"
                  alt="Override Health"
                  style={{ height: '40px' }}
                />
                <h5 className="modal-title mb-0">
                  Intake Form - {intake.first_name} {intake.last_name}
                </h5>
              </div>
              <button
                type="button"
                className="btn-close"
                onClick={onClose}
              ></button>
            </div>

            {/* Body */}
            <div className="modal-body">
              {/* Patient Information */}
              <div className="card mb-3">
                <div className="card-header bg-light">
                  <h6 className="mb-0">Patient Information</h6>
                </div>
                <div className="card-body">
                  <div className="row">
                    <div className="col-md-6 mb-2">
                      <strong>Patient ID:</strong> {intake.patient_healthie_id}
                    </div>
                    <div className="col-md-6 mb-2">
                      <strong>Status:</strong>{' '}
                      <span
                        className="badge"
                        style={{
                          backgroundColor: intake.status === 'completed' ? '#1CB783' : '#ffc107',
                          color: intake.status === 'completed' ? 'white' : '#000',
                          textTransform: 'capitalize'
                        }}
                      >
                        {intake.status}
                      </span>
                    </div>
                    <div className="col-md-6 mb-2">
                      <strong>Name:</strong> {intake.first_name} {intake.last_name}
                    </div>
                    <div className="col-md-6 mb-2">
                      <strong>Email:</strong> {intake.email}
                    </div>
                    <div className="col-md-6 mb-2">
                      <strong>Date of Birth:</strong> {intake.date_of_birth}
                    </div>
                    <div className="col-md-6 mb-2">
                      <strong>Phone:</strong> {intake.phone || 'N/A'}
                    </div>
                    <div className="col-md-6 mb-2">
                      <strong>Created:</strong>{' '}
                      {intake.created_at ? new Date(intake.created_at).toLocaleString() : 'N/A'}
                    </div>
                    <div className="col-md-6 mb-2">
                      <strong>Submitted:</strong>{' '}
                      {intake.submitted_at ? new Date(intake.submitted_at).toLocaleString() : 'N/A'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Current Medications (Q5) */}
              {intake.form_data?.medications && intake.form_data.medications.length > 0 && (
                <div className="card mb-3">
                  <div className="card-header bg-light">
                    <h6 className="mb-0">Current Medications</h6>
                  </div>
                  <div className="card-body">
                    {formatMedications(intake.form_data.medications)}
                  </div>
                </div>
              )}

              {/* Past Medications (Q6) */}
              {intake.form_data?.pastMedications && intake.form_data.pastMedications.length > 0 && (
                <div className="card mb-3">
                  <div className="card-header bg-light">
                    <h6 className="mb-0">Past Medications</h6>
                  </div>
                  <div className="card-body">
                    {formatMedications(intake.form_data.pastMedications)}
                  </div>
                </div>
              )}

              {/* Patient Consent & Signature */}
              {(() => {
                const signatureData = extractSignatureData();
                if (!signatureData) return null;

                return (
                  <div className="card mb-3">
                    <div className="card-header bg-light">
                      <h6 className="mb-0">Patient Consent & Signature</h6>
                    </div>
                    <div className="card-body">
                      <div className="row">
                        {signatureData.agreed !== undefined && (
                          <div className="col-md-6 mb-3">
                            <strong>Consent Status:</strong>
                            <div className="mt-1">
                              <span className={`badge ${signatureData.agreed ? 'bg-success' : 'bg-warning'}`}>
                                {signatureData.agreed ? 'Agreed to Terms' : 'Not Agreed'}
                              </span>
                            </div>
                          </div>
                        )}
                        {signatureData.timestamp && (
                          <div className="col-md-6 mb-3">
                            <strong>Signed At:</strong>
                            <div className="mt-1">
                              {new Date(signatureData.timestamp).toLocaleString()}
                            </div>
                          </div>
                        )}
                      </div>
                      {signatureData.typedName && (
                        <div className="mb-3">
                          <strong>Typed Name:</strong>
                          <div className="mt-1" style={{ fontFamily: 'cursive', fontSize: '1.5rem' }}>
                            {signatureData.typedName}
                          </div>
                        </div>
                      )}
                      {signatureData.imageDataURL && (
                        <div>
                          <strong>Signature:</strong>
                          <div className="mt-2">
                            <img
                              src={signatureData.imageDataURL}
                              alt="Patient Signature"
                              style={{
                                maxWidth: '100%',
                                maxHeight: '200px',
                                border: '1px solid #d1d1d6',
                                borderRadius: '8px',
                                padding: '8px',
                                backgroundColor: '#fff'
                              }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* All Form Answers */}
              {intake.form_data?.answers && Object.keys(intake.form_data.answers).length > 0 && (
                <div className="card mb-3">
                  <div className="card-header bg-light">
                    <h6 className="mb-0">Form Responses</h6>
                  </div>
                  <div className="card-body">
                    {loadingForm ? (
                      <div className="text-center py-3">
                        <div className="spinner-border spinner-border-sm text-primary" role="status">
                          <span className="visually-hidden">Loading questions...</span>
                        </div>
                        <p className="text-muted mt-2 mb-0">Loading question labels...</p>
                      </div>
                    ) : (
                      <div className="row">
                        {Object.entries(intake.form_data.answers)
                          .filter(([key, value]) => {
                            // EXPLICIT: Skip the main signature field by Healthie module ID
                            if (key === '19056501') {
                              console.log('Filtering out main signature field 19056501');
                              return false;
                            }

                            // Skip anything with "signature" in the key name (case insensitive)
                            if (key.toLowerCase().includes('signature')) {
                              console.log('Filtering out signature field:', key);
                              return false;
                            }

                            // Skip signature objects (by value structure)
                            if (isSignatureObject(value)) {
                              console.log('Filtering out signature object:', key);
                              return false;
                            }

                            // Skip signature component fields (by pattern)
                            if (key.includes('_agreed') || key.includes('_timestamp') ||
                                key.includes('_typed_name') || key.includes('_image')) {
                              console.log('Filtering out signature component:', key);
                              return false;
                            }

                            // Skip medication fields (already shown in dedicated sections)
                            if (key === 'medications_structured' || key === 'past_medications_structured') {
                              return false;
                            }

                            return true;
                          })
                          .map(([key, value]) => {
                            const formattedValue = formatValue(value, key);
                            // Skip if formatValue returns null
                            if (formattedValue === null) return null;

                            return (
                              <div key={key} className="col-md-6 mb-3 pb-3" style={{ borderBottom: '1px solid #eee' }}>
                                <div className="text-muted small mb-1">{getQuestionLabel(key)}</div>
                                <div>{formattedValue}</div>
                              </div>
                            );
                          })
                        }
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Raw JSON Data (for debugging) - Collapsible */}
              <div className="card">
                <div className="card-header bg-light d-flex justify-content-between align-items-center" style={{ cursor: 'pointer' }} onClick={() => setShowRawJson(!showRawJson)}>
                  <h6 className="mb-0">Raw JSON Data (Developer View)</h6>
                  <button className="btn btn-sm btn-outline-secondary">
                    {showRawJson ? 'Hide' : 'Show'}
                  </button>
                </div>
                {showRawJson && (
                  <div className="card-body">
                    <pre className="bg-light p-3 rounded" style={{ maxHeight: '400px', overflow: 'auto', fontSize: '0.85rem' }}>
                      {JSON.stringify(intake, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default IntakeModal;
