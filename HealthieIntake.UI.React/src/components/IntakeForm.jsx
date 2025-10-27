import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { API_BASE_URL, PATIENT_ID as DEFAULT_PATIENT_ID, FORM_ID } from '../config';
import MapboxAddressInput from './MapboxAddressInput';
import SignaturePad from './SignaturePad';

const IntakeForm = () => {
  // State management
  const [form, setForm] = useState(null);
  const [formAnswers, setFormAnswers] = useState({});
  const [patientId, setPatientId] = useState(DEFAULT_PATIENT_ID);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // Date fields - separate month, day, year
  const [dateMonths, setDateMonths] = useState({});
  const [dateDays, setDateDays] = useState({});
  const [dateYears, setDateYears] = useState({});

  // Checkbox fields - track multiple selections
  const [checkboxSelections, setCheckboxSelections] = useState({});

  // BMI calculator fields
  const [heightFeet, setHeightFeet] = useState('');
  const [heightInches, setHeightInches] = useState('');
  const [weight, setWeight] = useState('');
  const [bmiModuleId, setBmiModuleId] = useState(null);
  const [weightModuleId, setWeightModuleId] = useState(null);
  const [bmiResultModuleId, setBmiResultModuleId] = useState(null);

  // Mapbox integration
  const [addressModuleId, setAddressModuleId] = useState(null);

  // Primary Language field (custom field)
  const [primaryLanguage, setPrimaryLanguage] = useState('');
  const [primaryLanguageOther, setPrimaryLanguageOther] = useState('');

  // Primary care provider phone (custom field)
  const [primaryCareProviderPhone, setPrimaryCareProviderPhone] = useState('');

  // Emergency contact fields (custom fields replacing textarea)
  const [emergencyContactName, setEmergencyContactName] = useState('');
  const [emergencyContactRelationship, setEmergencyContactRelationship] = useState('');
  const [emergencyContactPhone, setEmergencyContactPhone] = useState('');

  // Test mode - bypass validation
  const [testMode, setTestMode] = useState(false);

  // Multi-step navigation
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 6;

  // Signature pad refs
  const signaturePadRefs = useRef({});

  // Load form on mount
  useEffect(() => {
    loadForm();
  }, []);

  // Load form progress when form is loaded
  useEffect(() => {
    if (form) {
      loadFormProgress();
    }
  }, [form]);

  // Save progress whenever form data changes
  useEffect(() => {
    if (form) {
      saveFormProgress();
    }
  }, [formAnswers, dateMonths, dateDays, dateYears, checkboxSelections, currentStep, primaryLanguage, primaryLanguageOther, primaryCareProviderPhone, emergencyContactName, emergencyContactRelationship, emergencyContactPhone]);

  // Calculate BMI when height or weight changes
  useEffect(() => {
    if (heightFeet && heightInches && bmiModuleId) {
      const totalInches = (parseInt(heightFeet) * 12) + parseInt(heightInches);
      setFormAnswer(bmiModuleId, totalInches.toString());
    }
  }, [heightFeet, heightInches]);

  useEffect(() => {
    if (weight && weightModuleId) {
      setFormAnswer(weightModuleId, weight);
    }
  }, [weight]);

  const loadForm = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/healthie/forms/${FORM_ID}`);
      if (response.data) {
        setForm(response.data);

        // Initialize answers dictionaries
        const modules = response.data.customModules || [];
        const newFormAnswers = {};
        const newDateMonths = {};
        const newDateDays = {};
        const newDateYears = {};
        const newCheckboxes = {};

        modules.forEach(module => {
          if (module.modType === 'label' || module.modType === 'read_only') {
            return;
          }

          if (module.modType === 'date') {
            newDateMonths[module.id] = '';
            newDateDays[module.id] = '';
            newDateYears[module.id] = '';
          } else if (module.modType === 'checkbox' && shouldHaveCheckboxGroup(module)) {
            newCheckboxes[module.id] = new Set();
          } else if (module.modType === 'location') {
            setAddressModuleId(module.id);
            newFormAnswers[module.id] = '';
          } else if (module.modType === 'BMI(in.)') {
            setBmiModuleId(module.id);
            newFormAnswers[module.id] = '';
          } else if (module.modType === 'Weight') {
            setWeightModuleId(module.id);
            newFormAnswers[module.id] = '';
          } else if (module.modType === 'BMI') {
            setBmiResultModuleId(module.id);
            newFormAnswers[module.id] = '';
          } else {
            newFormAnswers[module.id] = '';
          }
        });

        setFormAnswers(newFormAnswers);
        setDateMonths(newDateMonths);
        setDateDays(newDateDays);
        setDateYears(newDateYears);
        setCheckboxSelections(newCheckboxes);
      }
      setLoading(false);
    } catch (error) {
      setErrorMessage(`Error loading form: ${error.message}`);
      setLoading(false);
    }
  };

  const shouldHaveCheckboxGroup = (module) => {
    return module.label?.toLowerCase().includes('relationship status') ||
           module.label?.includes('following procedures') ||
           module.label?.includes('tried any of the following') ||
           module.label?.includes('run in your family') ||
           module.label?.includes('use any of the following');
  };

  // LocalStorage helpers
  const getStorageKey = () => `healthie_intake_${patientId}`;

  const saveFormProgress = () => {
    try {
      const progress = {
        patientId,
        currentStep,
        formAnswers,
        dateMonths,
        dateDays,
        dateYears,
        checkboxSelections: Object.fromEntries(
          Object.entries(checkboxSelections).map(([k, v]) => [k, Array.from(v)])
        ),
        heightFeet,
        heightInches,
        weight,
        primaryLanguage,
        primaryLanguageOther,
        primaryCareProviderPhone,
        emergencyContactName,
        emergencyContactRelationship,
        emergencyContactPhone
      };
      localStorage.setItem(getStorageKey(), JSON.stringify(progress));
    } catch (error) {
      console.log('Failed to save progress:', error.message);
    }
  };

  const loadFormProgress = () => {
    try {
      const json = localStorage.getItem(getStorageKey());
      if (json) {
        const progress = JSON.parse(json);

        if (progress.currentStep) setCurrentStep(progress.currentStep);
        if (progress.formAnswers) setFormAnswers(progress.formAnswers);
        if (progress.dateMonths) setDateMonths(progress.dateMonths);
        if (progress.dateDays) setDateDays(progress.dateDays);
        if (progress.dateYears) setDateYears(progress.dateYears);
        if (progress.checkboxSelections) {
          setCheckboxSelections(
            Object.fromEntries(
              Object.entries(progress.checkboxSelections).map(([k, v]) => [k, new Set(v)])
            )
          );
        }
        if (progress.heightFeet) setHeightFeet(progress.heightFeet);
        if (progress.heightInches) setHeightInches(progress.heightInches);
        if (progress.weight) setWeight(progress.weight);
        if (progress.primaryLanguage) setPrimaryLanguage(progress.primaryLanguage);
        if (progress.primaryLanguageOther) setPrimaryLanguageOther(progress.primaryLanguageOther);
        if (progress.primaryCareProviderPhone) setPrimaryCareProviderPhone(progress.primaryCareProviderPhone);
        if (progress.emergencyContactName) setEmergencyContactName(progress.emergencyContactName);
        if (progress.emergencyContactRelationship) setEmergencyContactRelationship(progress.emergencyContactRelationship);
        if (progress.emergencyContactPhone) setEmergencyContactPhone(progress.emergencyContactPhone);
      }
    } catch (error) {
      console.log('Failed to load progress:', error.message);
    }
  };

  const clearFormProgress = () => {
    try {
      localStorage.removeItem(getStorageKey());
    } catch (error) {
      console.log('Failed to clear progress:', error.message);
    }
  };

  // Form answer helpers
  const getFormAnswer = (moduleId) => {
    return formAnswers[moduleId] || '';
  };

  const setFormAnswer = (moduleId, value) => {
    setFormAnswers(prev => ({ ...prev, [moduleId]: value }));
  };

  const getDateMonth = (moduleId) => dateMonths[moduleId] || '';
  const setDateMonth = (moduleId, value) => {
    setDateMonths(prev => ({ ...prev, [moduleId]: value }));
  };

  const getDateDay = (moduleId) => dateDays[moduleId] || '';
  const setDateDay = (moduleId, value) => {
    setDateDays(prev => ({ ...prev, [moduleId]: value }));
  };

  const getDateYear = (moduleId) => dateYears[moduleId] || '';
  const setDateYear = (moduleId, value) => {
    setDateYears(prev => ({ ...prev, [moduleId]: value }));
  };

  // Checkbox helpers
  const handleCheckboxChange = (moduleId, option, isChecked) => {
    setCheckboxSelections(prev => {
      const newSelections = { ...prev };
      if (!newSelections[moduleId]) {
        newSelections[moduleId] = new Set();
      }

      const set = new Set(newSelections[moduleId]);
      if (isChecked) {
        set.add(option);
      } else {
        set.delete(option);
      }
      newSelections[moduleId] = set;
      return newSelections;
    });
  };

  // BMI calculation
  const calculateBMIValue = () => {
    if (!heightFeet || !heightInches || !weight) return 0;

    const feet = parseInt(heightFeet);
    const inches = parseInt(heightInches);
    const weightLbs = parseFloat(weight);

    if (isNaN(feet) || isNaN(inches) || isNaN(weightLbs)) return 0;

    const totalInches = (feet * 12) + inches;
    if (totalInches === 0) return 0;

    // BMI = (weight in lbs / (height in inches)^2) * 703
    return (weightLbs / (totalInches * totalInches)) * 703;
  };

  // Navigation helpers
  const getModulesForCurrentStep = () => {
    if (!form) return [];

    const allModules = form.customModules || [];

    switch (currentStep) {
      case 1:
        // Step 1: Introduction only
        return allModules.filter(m => m.label?.includes('Thank you for taking'));

      case 2:
        // Step 2: Personal Information (includes location)
        return allModules.filter(m =>
          m.label?.includes('Date of birth') ||
          m.modType === 'location' ||
          m.label === 'Sex' ||
          m.label === 'BMI' ||
          m.label?.includes('Primary care physician')
        );

      case 3:
        // Step 3: Demographics & Emergency Contact (EXCLUDE location)
        return allModules.filter(m =>
          m.modType !== 'location' && (
            m.label?.includes('Relationship status') ||
            m.label?.includes('Employment status') ||
            m.label?.includes('Occupation') ||
            m.label?.includes('Emergency contact')
          )
        );

      case 4:
        // Step 4: Pain Assessment (EXCLUDE location)
        const painStart = allModules.findIndex(m => m.label === 'PAIN ASSESSMENT');
        const medHistoryStart = allModules.findIndex(m => m.label === 'MEDICAL HISTORY');
        if (painStart === -1) return [];
        const endIndex = medHistoryStart === -1 ? allModules.length : medHistoryStart;
        return allModules.slice(painStart, endIndex).filter(m => m.modType !== 'location');

      case 5:
        // Step 5: Medical History (EXCLUDE location and Patient Agreement)
        const medHistStart = allModules.findIndex(m => m.label === 'MEDICAL HISTORY');
        if (medHistStart === -1) return [];
        return allModules.slice(medHistStart).filter(m => {
          // Exclude location, signature, and patient agreement
          if (m.modType === 'location') return false;
          if (m.modType === 'signature') return false;
          if (m.label?.toLowerCase().includes('patient agreement')) return false;

          // PHASE 1 CHANGES: Remove specific fields
          // Remove "Anything else providers" field (ID: 19056499)
          if (m.label?.toLowerCase().includes('anything more you would like your override providers to know')) return false;
          // Remove "If other therapy" comment field (ID: 19056490)
          if (m.label?.toLowerCase().includes('if other') && m.label?.toLowerCase().includes('comment')) return false;

          // PHASE 1: Conditional logic for "Other procedures" field (ID: 19056485)
          // Only show if "Other" was selected in procedures checkbox
          if (m.label?.toLowerCase().includes('if other, list them here')) {
            const proceduresModule = allModules.find(mod =>
              mod.label?.toLowerCase().includes('have you had any of the following procedures')
            );
            if (proceduresModule && checkboxSelections[proceduresModule.id]) {
              return checkboxSelections[proceduresModule.id].has('Other');
            }
            return false;
          }

          return true;
        });

      case 6:
        // Step 6: Patient Agreement and Signature only
        return allModules.filter(m =>
          m.label === 'PATIENT AGREEMENT' ||
          m.modType === 'signature' ||
          m.label?.includes('PATIENT AGREEMENT')
        );

      default:
        return [];
    }
  };

  const getSectionTitle = () => {
    switch (currentStep) {
      case 1: return 'Welcome';
      case 2: return 'Patient Demographics';
      case 3: return 'Demographics & Emergency Contact';
      case 4: return 'Pain Assessment';
      case 5: return 'Medical History';
      case 6: return 'Patient Agreement';
      default: return 'Patient Intake Form';
    }
  };

  const getCompletionPercentage = () => {
    if (!form || !form.customModules) return 0;

    const totalFields = form.customModules.filter(m =>
      m.modType !== 'label' && m.modType !== 'read_only'
    ).length + 1; // +1 for patient ID

    let completedFields = 0;

    form.customModules.forEach(module => {
      if (module.modType === 'label' || module.modType === 'read_only') return;

      if (module.modType === 'date') {
        if (dateMonths[module.id] && dateDays[module.id] && dateYears[module.id]) {
          completedFields++;
        }
      } else if (module.modType === 'checkbox') {
        if (checkboxSelections[module.id]?.size > 0) {
          completedFields++;
        }
      } else {
        if (formAnswers[module.id]) {
          completedFields++;
        }
      }
    });

    if (patientId) completedFields++;

    return Math.round((completedFields / totalFields) * 100);
  };

  const validateCurrentStep = () => {
    // Bypass validation in test mode
    if (testMode) {
      return {
        isValid: true,
        missingFields: []
      };
    }

    const modulesForStep = getModulesForCurrentStep();
    const missingFields = [];

    // Check patient ID on step 1
    if (currentStep === 1 && !patientId) {
      missingFields.push('Patient Healthie ID');
    }

    // Track question numbers for Step 4
    let step4QuestionNumber = 0;

    // Check Primary Language on step 2
    if (currentStep === 2) {
      if (!primaryLanguage) {
        missingFields.push('Primary Language');
      } else if (primaryLanguage === 'Other' && !primaryLanguageOther.trim()) {
        missingFields.push('Specify your primary language');
      }

      // Validate phone number format if provided (optional field)
      if (primaryCareProviderPhone.trim()) {
        const phoneRegex = /^[\d\s\-\(\)\+\.]+$/;
        const digitsOnly = primaryCareProviderPhone.replace(/\D/g, '');

        if (!phoneRegex.test(primaryCareProviderPhone) || digitsOnly.length < 10) {
          missingFields.push('Primary care provider phone number (invalid format - example: (123)123-1234)');
        }
      }
    }

    // Check Emergency Contact Phone on step 3 (if provided)
    if (currentStep === 3) {
      if (emergencyContactPhone.trim()) {
        const phoneRegex = /^[\d\s\-\(\)\+\.]+$/;
        const digitsOnly = emergencyContactPhone.replace(/\D/g, '');

        if (!phoneRegex.test(emergencyContactPhone) || digitsOnly.length < 10) {
          missingFields.push('Emergency contact phone number (invalid format - example: (123)123-1234)');
        }
      }
    }

    // Check all required fields for current step
    modulesForStep.forEach(module => {
      // Skip non-input fields
      if (module.modType === 'label' || module.modType === 'read_only' || module.modType === 'staticText') return;

      // Increment question number for Step 4 (before checking if required)
      if (currentStep === 4) {
        step4QuestionNumber++;
      }

      // Use the same logic as visual indicator
      if (!isFieldRequired(module)) return;

      // Determine field label for error message
      let fieldLabel = module.label || 'Field';
      if (currentStep === 4) {
        fieldLabel = `Question ${step4QuestionNumber}`;
      }

      // Check different field types
      if (module.modType === 'date') {
        if (!dateMonths[module.id] || !dateDays[module.id] || !dateYears[module.id]) {
          missingFields.push(fieldLabel);
        }
      } else if (module.modType === 'checkbox') {
        if (!checkboxSelections[module.id] || checkboxSelections[module.id].size === 0) {
          missingFields.push(fieldLabel);
        }
      } else if (module.modType === 'signature') {
        const ref = signaturePadRefs.current[module.id];
        if (!ref || !ref.getDataURL || !ref.getDataURL()) {
          missingFields.push(fieldLabel);
        }
      } else if (module.modType === 'BMI(in.)' || module.modType === 'Weight' || module.modType === 'BMI') {
        // BMI fields - check if height and weight are filled
        if (module.modType === 'BMI(in.)') {
          if (!heightFeet || !heightInches) {
            missingFields.push(currentStep === 4 ? fieldLabel : 'Height');
          }
          if (!weight) {
            missingFields.push(currentStep === 4 ? fieldLabel : 'Weight');
          }
        }
      } else {
        // Text, textarea, radio, location, etc.
        if (!formAnswers[module.id] || formAnswers[module.id].trim() === '') {
          missingFields.push(fieldLabel);
        }
      }
    });

    return {
      isValid: missingFields.length === 0,
      missingFields
    };
  };

  const nextStep = (e) => {
    if (e) e.preventDefault();

    // Validate current step before progressing
    const validation = validateCurrentStep();
    if (!validation.isValid) {
      setErrorMessage(`Please complete the following required fields: ${validation.missingFields.join(', ')}`);
      window.scrollTo(0, 0);
      return;
    }

    // Clear error message on successful validation
    setErrorMessage(null);

    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
      window.scrollTo(0, 0);
    }
  };

  const previousStep = (e) => {
    if (e) e.preventDefault();
    // Clear any validation errors when going back
    setErrorMessage(null);
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      window.scrollTo(0, 0);
    }
  };

  const saveAndExit = () => {
    saveFormProgress();
    setSuccessMessage('Progress saved! You can return to complete the form later.');
  };

  const clearAndStartOver = () => {
    clearFormProgress();
    setPatientId('');
    setFormAnswers({});
    setDateMonths({});
    setDateDays({});
    setDateYears({});
    setCheckboxSelections({});
    setHeightFeet('');
    setHeightInches('');
    setWeight('');
    setPrimaryLanguage('');
    setPrimaryLanguageOther('');
    setPrimaryCareProviderPhone('');
    setEmergencyContactName('');
    setEmergencyContactRelationship('');
    setEmergencyContactPhone('');
    setCurrentStep(1);
    setSuccessMessage(null);
    setErrorMessage(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!patientId) {
      setErrorMessage('Patient ID is required');
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      // Combine date parts into YYYY-MM-DD format
      const combinedFormAnswers = { ...formAnswers };

      // Add Primary Language field
      // Find the custom module for primary language or use a synthetic ID
      if (form) {
        const primaryLanguageModule = form.customModules.find(m =>
          m.label?.toLowerCase().includes('primary language')
        );

        // Use the actual value (from dropdown or "Other" text field)
        const primaryLanguageValue = primaryLanguage === 'Other' ? primaryLanguageOther : primaryLanguage;

        if (primaryLanguageModule && primaryLanguageValue) {
          combinedFormAnswers[primaryLanguageModule.id] = primaryLanguageValue;
        } else if (primaryLanguageValue) {
          // If no existing module found, create a synthetic entry
          // This will need to be added as a custom field in Healthie
          combinedFormAnswers['primary_language'] = primaryLanguageValue;
        }

        // Add Primary Care Provider Phone if provided
        if (primaryCareProviderPhone.trim()) {
          const primaryCarePhoneModule = form.customModules.find(m =>
            m.label?.toLowerCase().includes('primary care') &&
            m.label?.toLowerCase().includes('phone')
          );

          if (primaryCarePhoneModule) {
            combinedFormAnswers[primaryCarePhoneModule.id] = primaryCareProviderPhone;
          } else {
            // Create synthetic entry if no module found
            combinedFormAnswers['primary_care_provider_phone'] = primaryCareProviderPhone;
          }
        }

        // Add Emergency Contact fields (replace the old textarea)
        const emergencyContactModule = form.customModules.find(m =>
          m.label?.toLowerCase().includes('emergency contact')
        );

        if (emergencyContactModule) {
          // Build combined emergency contact string
          const emergencyParts = [];
          if (emergencyContactName.trim()) emergencyParts.push(`Name: ${emergencyContactName}`);
          if (emergencyContactRelationship.trim()) emergencyParts.push(`Relationship: ${emergencyContactRelationship}`);
          if (emergencyContactPhone.trim()) emergencyParts.push(`Phone: ${emergencyContactPhone}`);

          if (emergencyParts.length > 0) {
            combinedFormAnswers[emergencyContactModule.id] = emergencyParts.join('; ');
          }
        } else {
          // Create synthetic entries if no module found
          if (emergencyContactName.trim()) combinedFormAnswers['emergency_contact_name'] = emergencyContactName;
          if (emergencyContactRelationship.trim()) combinedFormAnswers['emergency_contact_relationship'] = emergencyContactRelationship;
          if (emergencyContactPhone.trim()) combinedFormAnswers['emergency_contact_phone'] = emergencyContactPhone;
        }
      }

      // Capture all signatures DIRECTLY into combinedFormAnswers (not using state)
      if (form) {
        const signatureModules = form.customModules.filter(m => m.modType === 'signature');
        signatureModules.forEach(module => {
          const ref = signaturePadRefs.current[module.id];
          if (ref && ref.getDataURL) {
            const dataURL = ref.getDataURL();
            if (dataURL) {
              combinedFormAnswers[module.id] = dataURL;
            }
          }
        });
      }

      Object.keys(dateMonths).forEach(moduleId => {
        if (dateMonths[moduleId] && dateDays[moduleId] && dateYears[moduleId]) {
          const month = dateMonths[moduleId].padStart(2, '0');
          const day = dateDays[moduleId].padStart(2, '0');
          const year = dateYears[moduleId];
          combinedFormAnswers[moduleId] = `${year}-${month}-${day}`;
        }
      });

      // Combine checkbox selections into comma-separated string
      Object.entries(checkboxSelections).forEach(([moduleId, selections]) => {
        if (selections.size > 0) {
          combinedFormAnswers[moduleId] = Array.from(selections).join(', ');
        }
      });

      const formSubmission = {
        customModuleFormId: FORM_ID,
        userId: patientId,
        formAnswers: Object.entries(combinedFormAnswers)
          .filter(([_, value]) => value)
          .map(([customModuleId, answer]) => ({
            customModuleId,
            answer
          }))
      };

      const response = await axios.post(`${API_BASE_URL}/api/healthie/forms/submit`, formSubmission);

      if (response.data && response.data.formAnswerGroupId) {
        setSuccessMessage(`Form submitted successfully! Form Answer Group ID: ${response.data.formAnswerGroupId}`);

        // Clear localStorage after successful submission
        clearFormProgress();

        // Reset form
        setFormAnswers({});
        setDateMonths({});
        setDateDays({});
        setDateYears({});
        setCheckboxSelections({});
        setHeightFeet('');
        setHeightInches('');
        setWeight('');
        setPrimaryLanguage('');
        setPrimaryLanguageOther('');
        setPrimaryCareProviderPhone('');
        setEmergencyContactName('');
        setEmergencyContactRelationship('');
        setEmergencyContactPhone('');

        // Re-initialize empty dictionaries
        if (form) {
          const modules = form.customModules || [];
          const newFormAnswers = {};
          const newDateMonths = {};
          const newDateDays = {};
          const newDateYears = {};
          const newCheckboxes = {};

          modules.forEach(module => {
            if (module.modType === 'label' || module.modType === 'read_only') return;

            if (module.modType === 'date') {
              newDateMonths[module.id] = '';
              newDateDays[module.id] = '';
              newDateYears[module.id] = '';
            } else if (module.modType === 'checkbox' && shouldHaveCheckboxGroup(module)) {
              newCheckboxes[module.id] = new Set();
            } else {
              newFormAnswers[module.id] = '';
            }
          });

          setFormAnswers(newFormAnswers);
          setDateMonths(newDateMonths);
          setDateDays(newDateDays);
          setDateYears(newDateYears);
          setCheckboxSelections(newCheckboxes);
        }
      }
    } catch (error) {
      setErrorMessage(`Error submitting form: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const getScaleLegend = (label) => {
    if (label?.includes('PEG-3') || label?.includes('pain on average')) {
      return '0 = No pain, 10 = Pain as bad as you can imagine';
    } else if (label?.includes('interfered with') && (label.includes('enjoyment') || label.includes('activity') || label.includes('sleep') || label.includes('relationships'))) {
      return '0 = Does not interfere, 10 = Completely interferes';
    } else if (label?.includes('overwhelmed') || label?.includes('hopeless')) {
      return '0 = Not at all, 10 = All the time';
    } else if (label?.includes('anxious') || label?.includes('worrying') || label?.includes('depressed') || label?.includes('interest or pleasure')) {
      return '0 = Not at all, 1 = Several days, 2 = More than half the days, 3 = Nearly every day';
    } else if (label?.includes('surgery upcoming') || label?.includes('opioid medication') || label?.includes('therapist') || label?.includes('unhealthy relationship')) {
      return '0 = No, 10 = Yes';
    }
    return '';
  };

  // Helper to determine if field should be treated as required
  const isFieldRequired = (module) => {
    if (module.required) return true;

    // Critical fields that should be treated as required (only Date of Birth)
    const isCriticalField = module.label?.toLowerCase().includes('date of birth');

    return isCriticalField;
  };

  // Format phone number as user types: (123)123-1234
  const formatPhoneNumber = (value) => {
    // Remove all non-digit characters
    const digitsOnly = value.replace(/\D/g, '');

    // Format based on length
    if (digitsOnly.length === 0) return '';
    if (digitsOnly.length <= 3) return `(${digitsOnly}`;
    if (digitsOnly.length <= 6) return `(${digitsOnly.slice(0, 3)})${digitsOnly.slice(3)}`;
    return `(${digitsOnly.slice(0, 3)})${digitsOnly.slice(3, 6)}-${digitsOnly.slice(6, 10)}`;
  };

  // Render field based on type
  const renderField = (module, questionNumber = null) => {
    // Skip section headers that duplicate the step title
    if (currentStep === 4 && module.label === 'PAIN ASSESSMENT') {
      return null;
    }
    if (currentStep === 5 && (module.label === 'MEDICAL HISTORY' || module.label?.toLowerCase().includes('patient agreement'))) {
      return null;
    }

    // For Step 4, prefix labels with question number
    const getFieldLabel = (label) => {
      if (questionNumber && currentStep === 4) {
        return `${questionNumber}. ${label}`;
      }
      return label;
    };

    // CHANGE: Sex label - Update to "Sex assigned at birth"
    if (module.label === 'Sex') {
      return (
        <div className="mb-3" key={module.id}>
          <label className="form-label fw-bold">
            Sex assigned at birth
            {isFieldRequired(module) && <span className="text-danger">*</span>}
          </label>
          {renderFieldInput(module)}
        </div>
      );
    }

    // CHANGE: Primary care physician - Update label and add phone field
    if (module.label?.toLowerCase().includes('primary care physician')) {
      return (
        <div key={module.id}>
          <div className="mb-3">
            <label className="form-label fw-bold">
              Primary care provider name
            </label>
            <input
              type="text"
              className="form-control"
              value={getFormAnswer(module.id)}
              onChange={(e) => setFormAnswer(module.id, e.target.value)}
            />
          </div>
          <div className="mb-3">
            <label className="form-label fw-bold">
              Primary care provider phone number
            </label>
            <input
              type="tel"
              className="form-control"
              value={primaryCareProviderPhone}
              onChange={(e) => {
                const formatted = formatPhoneNumber(e.target.value);
                setPrimaryCareProviderPhone(formatted);
              }}
            />
          </div>
        </div>
      );
    }

    // CHANGE: Pain description - Replace with pain location field
    if (module.label?.toLowerCase().includes('tell us about your pain')) {
      return (
        <div className="mb-3" key={module.id}>
          <label className="form-label fw-bold">
            {getFieldLabel('Where is your pain located? (List all areas that are affected)')}
            <span className="text-danger">*</span>
          </label>
          <textarea
            className="form-control"
            rows="4"
            value={getFormAnswer(module.id)}
            onChange={(e) => setFormAnswer(module.id, e.target.value)}
            required
          />
        </div>
      );
    }

    // CHANGE: Emergency contact - Split into 3 fields
    if (module.label?.toLowerCase().includes('emergency contact')) {
      return (
        <div key={module.id}>
          <div className="mb-3">
            <label className="form-label fw-bold">
              Emergency contact name
            </label>
            <input
              type="text"
              className="form-control"
              value={emergencyContactName}
              onChange={(e) => setEmergencyContactName(e.target.value)}
            />
          </div>
          <div className="mb-3">
            <label className="form-label fw-bold">
              Emergency contact relationship
            </label>
            <select
              className="form-select"
              value={emergencyContactRelationship}
              onChange={(e) => setEmergencyContactRelationship(e.target.value)}
            >
              <option value="">Select relationship...</option>
              <option value="Caregiver">Caregiver</option>
              <option value="Child">Child</option>
              <option value="Dependent">Dependent</option>
              <option value="Family Member">Family Member</option>
              <option value="Legal Guardian">Legal Guardian</option>
              <option value="Parent">Parent</option>
              <option value="Spouse">Spouse</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div className="mb-3">
            <label className="form-label fw-bold">
              Emergency contact phone number
            </label>
            <input
              type="tel"
              className="form-control"
              value={emergencyContactPhone}
              onChange={(e) => {
                const formatted = formatPhoneNumber(e.target.value);
                setEmergencyContactPhone(formatted);
              }}
            />
          </div>
        </div>
      );
    }

    // PHASE 1 CHANGE: Trauma history - Change from textarea to Yes/No radio
    if (module.label?.toLowerCase().includes('history of physical or psychological trauma')) {
      return (
        <div className="mb-3" key={module.id}>
          <label className="form-label fw-bold">
            Do you have any history of physical or psychological trauma?
            {isFieldRequired(module) && <span className="text-danger">*</span>}
          </label>
          <div className="mt-2">
            <div className="form-check">
              <input
                className="form-check-input"
                type="radio"
                name={module.id}
                id={`${module.id}_yes`}
                value="Yes"
                checked={getFormAnswer(module.id) === 'Yes'}
                onChange={(e) => setFormAnswer(module.id, e.target.value)}
                required={module.required}
              />
              <label className="form-check-label" htmlFor={`${module.id}_yes`}>
                Yes
              </label>
            </div>
            <div className="form-check">
              <input
                className="form-check-input"
                type="radio"
                name={module.id}
                id={`${module.id}_no`}
                value="No"
                checked={getFormAnswer(module.id) === 'No'}
                onChange={(e) => setFormAnswer(module.id, e.target.value)}
                required={module.required}
              />
              <label className="form-check-label" htmlFor={`${module.id}_no`}>
                No
              </label>
            </div>
          </div>
        </div>
      );
    }

    // PHASE 1 CHANGE: PT question - Update label with 3-month time period
    if (module.label?.toLowerCase().includes('if you have done pt, when was the last time')) {
      return (
        <div className="mb-3" key={module.id}>
          <label className="form-label fw-bold">
            Have you done physical therapy in the last 3 months?
            {isFieldRequired(module) && <span className="text-danger">*</span>}
          </label>
          <input
            type="text"
            className="form-control"
            value={getFormAnswer(module.id)}
            onChange={(e) => setFormAnswer(module.id, e.target.value)}
            placeholder="If yes, when was the last time?"
            required={module.required}
          />
        </div>
      );
    }

    // PHASE 1 CHANGE: Allergies - Clarify to include all allergies
    if (module.label?.toLowerCase().includes('medication allergies')) {
      return (
        <div className="mb-3" key={module.id}>
          <label className="form-label fw-bold">
            Do you have any allergies? (medications, food, environmental, etc.)
            {isFieldRequired(module) && <span className="text-danger">*</span>}
          </label>
          <textarea
            className="form-control"
            rows="3"
            value={getFormAnswer(module.id)}
            onChange={(e) => setFormAnswer(module.id, e.target.value)}
            placeholder="Please list all allergies"
            required={module.required}
          />
        </div>
      );
    }

    // Label or read-only field
    if (module.modType === 'label' || module.modType === 'read_only' || module.modType === 'staticText') {
      return (
        <div className="mb-3" key={module.id}>
          <div className="alert alert-info" dangerouslySetInnerHTML={{ __html: module.label }} />
        </div>
      );
    }

    return (
      <div className="mb-3" key={module.id}>
        <label className="form-label fw-bold">
          {getFieldLabel(module.label)}
          {isFieldRequired(module) && <span className="text-danger">*</span>}
        </label>

        {renderFieldInput(module)}
      </div>
    );
  };

  const renderFieldInput = (module) => {
    switch (module.modType) {
      case 'text':
        return (
          <input
            type="text"
            className="form-control"
            value={getFormAnswer(module.id)}
            onChange={(e) => setFormAnswer(module.id, e.target.value)}
            required={module.required}
          />
        );

      case 'textarea':
        return (
          <textarea
            className="form-control"
            rows="3"
            value={getFormAnswer(module.id)}
            onChange={(e) => setFormAnswer(module.id, e.target.value)}
            required={module.required}
          />
        );

      case 'date':
        return (
          <div className="row g-2" style={{ maxWidth: '50%' }}>
            <div className="col-4">
              <input
                type="text"
                className="form-control"
                value={getDateMonth(module.id)}
                onChange={(e) => setDateMonth(module.id, e.target.value)}
                placeholder="MM"
                maxLength="2"
                required={module.required}
              />
            </div>
            <div className="col-4">
              <input
                type="text"
                className="form-control"
                value={getDateDay(module.id)}
                onChange={(e) => setDateDay(module.id, e.target.value)}
                placeholder="DD"
                maxLength="2"
                required={module.required}
              />
            </div>
            <div className="col-4">
              <input
                type="text"
                className="form-control"
                value={getDateYear(module.id)}
                onChange={(e) => setDateYear(module.id, e.target.value)}
                placeholder="YYYY"
                maxLength="4"
                required={module.required}
              />
            </div>
          </div>
        );

      case 'radio':
      case 'horizontal_radio':
        return renderRadioField(module);

      case 'checkbox':
        return renderCheckboxField(module);

      case 'location':
        return (
          <MapboxAddressInput
            moduleId={module.id}
            value={getFormAnswer(module.id)}
            onChange={(value) => setFormAnswer(module.id, value)}
            required={module.required}
          />
        );

      case 'signature':
        return (
          <SignaturePad
            ref={(ref) => signaturePadRefs.current[module.id] = ref}
            moduleId={module.id}
            initialValue={getFormAnswer(module.id)}
          />
        );

      case 'BMI(in.)':
        return renderBMIField(module);

      case 'Weight':
      case 'BMI':
        // Don't render - handled by BMI field
        return null;

      default:
        return (
          <input
            type="text"
            className="form-control"
            value={getFormAnswer(module.id)}
            onChange={(e) => setFormAnswer(module.id, e.target.value)}
            required={module.required}
          />
        );
    }
  };

  const renderRadioField = (module) => {
    let options = [];
    let maxValue = 10;

    if (module.label === 'Sex') {
      options = ['Female', 'Male', 'Other'];
    } else if (module.label === 'Employment status') {
      options = ['Employed', 'Unemployed', 'Retired'];
    } else if (module.options && module.options.length > 0) {
      options = module.options;
    } else {
      // Numeric scale
      const legend = getScaleLegend(module.label);
      if (module.label?.includes('anxious') || module.label?.includes('worrying') ||
          module.label?.includes('depressed') || module.label?.includes('interest or pleasure')) {
        maxValue = 3;
      }

      return (
        <div className="mt-2">
          {legend && <div className="form-text mb-2">{legend}</div>}
          <div>
            {[...Array(maxValue + 1)].map((_, i) => (
              <div className="form-check form-check-inline" key={i}>
                <input
                  className="form-check-input"
                  type="radio"
                  name={module.id}
                  id={`${module.id}_${i}`}
                  value={i.toString()}
                  checked={formAnswers[module.id] === i.toString()}
                  onChange={() => setFormAnswer(module.id, i.toString())}
                  required={module.required}
                />
                <label className="form-check-label" htmlFor={`${module.id}_${i}`}>
                  {i}
                </label>
              </div>
            ))}
          </div>
        </div>
      );
    }

    return (
      <div className="mt-2">
        {options.map(option => (
          <div className="form-check form-check-inline" key={option}>
            <input
              className="form-check-input"
              type="radio"
              name={module.id}
              id={`${module.id}_${option}`}
              value={option}
              checked={formAnswers[module.id] === option}
              onChange={() => setFormAnswer(module.id, option)}
              required={module.required}
            />
            <label className="form-check-label" htmlFor={`${module.id}_${option}`}>
              {option}
            </label>
          </div>
        ))}
      </div>
    );
  };

  const renderCheckboxField = (module) => {
    let options = [];

    if (module.label?.toLowerCase().includes('relationship status')) {
      options = ['Single', 'Married', 'Separated / Divorced'];
    } else if (module.label?.includes('following procedures')) {
      options = [
        'Epidural steroid injection',
        'Facet joint/medial branch nerve block',
        'Radiofrequency Ablation (RFA):',
        'Joint injection',
        'Trigger point injection',
        'Spinal cord stimulation',
        'None of the above',
        'Other'
      ];
    } else if (module.label?.includes('tried any of the following')) {
      options = [
        'Physical therapy',
        'Chiropractic care',
        'Massage therapy',
        'Heat or ice pool therapy',
        'TENS unit',
        'Brace / orthotic',
        'Acupuncture',
        'Biofeedback',
        'Interdisciplinary pain education classes',
        'None of the above',
        'Other'
      ];
    } else if (module.label?.includes('run in your family')) {
      options = [
        'Similar pain',
        'Arthritis',
        'Bleeding Disorder',
        'Cancer',
        'Depression',
        'Substance abuse',
        'Other psychological history',
        'Other trauma condition',
        'None of the above',
        'Other'
      ];
    } else if (module.label?.includes('use any of the following')) {
      options = [
        'Alcohol',
        'Tobacco',
        'Cannabis',
        'Illicit drugs (street drugs) ',
        'Prescription drugs not prescribed to you',
        'None of the above',
        'Other'
      ];
    } else {
      // Fallback to text input
      return (
        <>
          <input
            type="text"
            className="form-control"
            value={getFormAnswer(module.id)}
            onChange={(e) => setFormAnswer(module.id, e.target.value)}
            placeholder="Enter comma-separated values"
            required={module.required}
          />
          <div className="form-text">Enter multiple selections separated by commas</div>
        </>
      );
    }

    return (
      <div className="mt-2">
        {options.map(option => (
          <div className="form-check" key={option}>
            <input
              className="form-check-input"
              type="checkbox"
              id={`${module.id}_${option}`}
              checked={checkboxSelections[module.id]?.has(option) || false}
              onChange={(e) => handleCheckboxChange(module.id, option, e.target.checked)}
            />
            <label className="form-check-label" htmlFor={`${module.id}_${option}`}>
              {option}
            </label>
          </div>
        ))}
      </div>
    );
  };

  const renderBMIField = (module) => {
    return (
      <div className="row g-2">
        <div className="col-md-4">
          <label className="form-label">Height (Feet)</label>
          <select
            className="form-select"
            value={heightFeet}
            onChange={(e) => setHeightFeet(e.target.value)}
            style={{ height: '38px' }}
          >
            <option value="">Select</option>
            {[3, 4, 5, 6, 7, 8].map(i => (
              <option key={i} value={i}>{i} ft</option>
            ))}
          </select>
        </div>
        <div className="col-md-4">
          <label className="form-label">Height (Inches)</label>
          <select
            className="form-select"
            value={heightInches}
            onChange={(e) => setHeightInches(e.target.value)}
            style={{ height: '38px' }}
          >
            <option value="">Select</option>
            {[...Array(12)].map((_, i) => (
              <option key={i} value={i}>{i} in</option>
            ))}
          </select>
        </div>
        <div className="col-md-4">
          <label className="form-label">Weight (lbs)</label>
          <input
            type="number"
            className="form-control"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            placeholder="lbs"
            style={{ height: '38px' }}
          />
        </div>
        {heightFeet && heightInches && weight && (
          <div className="mt-2">
            <strong>BMI: {calculateBMIValue().toFixed(1)}</strong>
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="container mt-4">
        <div className="text-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p>Loading form...</p>
        </div>
      </div>
    );
  }

  if (errorMessage && !form) {
    return (
      <div className="container mt-4">
        <div className="alert alert-danger">
          <strong>Error:</strong> {errorMessage}
        </div>
      </div>
    );
  }

  return (
    <div className="container mt-4">
      <div className="d-flex align-items-center justify-content-between mb-4">
        <img
          src="https://i0.wp.com/override.health/wp-content/uploads/2025/08/Override-Logo_Full-Color-e1757963862728.png?w=2860&ssl=1"
          alt="Override Health"
          style={{ height: '60px' }}
        />
        <h1 className="mb-0">Patient Intake Form</h1>
      </div>

      {/* Test Mode Toggle */}
      <div className="mb-3">
        <div className="form-check">
          <input
            className="form-check-input"
            type="checkbox"
            id="testMode"
            checked={testMode}
            onChange={(e) => setTestMode(e.target.checked)}
          />
          <label className="form-check-label" htmlFor="testMode">
            Test Mode (bypass required field validation)
          </label>
        </div>
      </div>

      <form onSubmit={handleSubmit} onKeyDown={(e) => {
        // Prevent Enter key from submitting form unless on last step
        if (e.key === 'Enter' && currentStep < totalSteps) {
          e.preventDefault();
        }
      }}>
        {/* Progress Bar */}
        <div className="mb-3">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <small className="text-muted">Overall Progress</small>
            <small className="text-muted">{getCompletionPercentage()}% Complete</small>
          </div>
          <div className="progress" style={{ height: '10px' }}>
            <div
              className="progress-bar"
              role="progressbar"
              style={{ width: `${getCompletionPercentage()}%` }}
              aria-valuenow={getCompletionPercentage()}
              aria-valuemin="0"
              aria-valuemax="100"
            />
          </div>
        </div>

        {/* Progress Indicator */}
        <div className="alert alert-info mb-3">
          <strong>Step {currentStep} of {totalSteps}:</strong> {getSectionTitle()}
        </div>

        {/* Patient ID field on step 1 */}
        {currentStep === 1 && (
          <div className="card mb-3">
            <div className="card-body">
              <div className="mb-3">
                <label htmlFor="patientId" className="form-label">
                  Patient Healthie ID <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  className="form-control"
                  id="patientId"
                  value={patientId}
                  onChange={(e) => setPatientId(e.target.value)}
                  required
                />
                <div className="form-text">Enter the Healthie patient ID for this form submission</div>
              </div>
            </div>
          </div>
        )}

        {/* Step 6 disclaimer links */}
        {currentStep === 6 && (
          <div className="alert alert-info mb-4" role="contentinfo">
            <p>By signing this form you agree to the following:</p>
            <p><a href="https://www.override.health/healthie-privacy-policy" target="_blank" rel="noopener noreferrer">Notice of Privacy Policy</a></p>
            <p><a href="https://www.override.health/informed-treatment-consent" target="_blank" rel="noopener noreferrer">Informed Treatment Consent</a></p>
            <p><a href="https://www.override.health/clinical-policies-procedures" target="_blank" rel="noopener noreferrer">Clinical Policies & Procedures</a></p>
          </div>
        )}

        {/* Form Fields */}
        <div className="card">
          <div className="card-body">
            {getModulesForCurrentStep().map((module, index) => {
              // Track question number for Step 4
              let questionNumber = null;
              if (currentStep === 4) {
                // Count all fields before this one (excluding labels)
                const allModules = getModulesForCurrentStep();
                questionNumber = allModules.slice(0, index + 1).filter(m =>
                  m.modType !== 'label' && m.modType !== 'read_only' && m.modType !== 'staticText'
                ).length;
              }

              const fields = [renderField(module, questionNumber)];

              // Insert Primary Language after BMI field on Step 2
              if (currentStep === 2 && module.label === 'BMI') {
                fields.push(
                  <div key="primary-language" className="mb-3">
                    <label htmlFor="primaryLanguage" className="form-label fw-bold">
                      Primary Language <span className="text-danger">*</span>
                    </label>
                    <select
                      id="primaryLanguage"
                      className="form-select"
                      value={primaryLanguage}
                      onChange={(e) => {
                        setPrimaryLanguage(e.target.value);
                        // Clear "Other" text when changing selection
                        if (e.target.value !== 'Other') {
                          setPrimaryLanguageOther('');
                        }
                      }}
                      required
                    >
                      <option value="">Select language...</option>
                      <option value="English">English</option>
                      <option value="Spanish">Spanish</option>
                      <option value="Chinese (Mandarin/Cantonese)">Chinese (Mandarin/Cantonese)</option>
                      <option value="Vietnamese">Vietnamese</option>
                      <option value="Tagalog">Tagalog</option>
                      <option value="Arabic">Arabic</option>
                      <option value="French">French</option>
                      <option value="Korean">Korean</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                );

                // Add conditional "Other" text field
                if (primaryLanguage === 'Other') {
                  fields.push(
                    <div key="primary-language-other" className="mb-3">
                      <label htmlFor="primaryLanguageOther" className="form-label fw-bold">
                        Specify your primary language <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        id="primaryLanguageOther"
                        className="form-control"
                        value={primaryLanguageOther}
                        onChange={(e) => setPrimaryLanguageOther(e.target.value)}
                        placeholder="Enter your primary language"
                        required
                      />
                    </div>
                  );
                }
              }

              return fields;
            })}
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="mt-4 mb-5 d-flex justify-content-between">
          <div>
            {currentStep > 1 && (
              <button type="button" className="btn btn-outline-secondary" onClick={previousStep}>
                &larr; Previous
              </button>
            )}
          </div>
          <div className="d-flex gap-2">
            <button type="button" className="btn btn-outline-danger" onClick={clearAndStartOver}>
              Clear & Start Over
            </button>
            <button type="button" className="btn btn-outline-primary" onClick={saveAndExit}>
              Save & Exit
            </button>
          </div>
          <div>
            {currentStep < totalSteps ? (
              <button type="button" className="btn btn-primary" onClick={nextStep}>
                Next &rarr;
              </button>
            ) : (
              <button type="submit" className="btn btn-primary btn-lg" disabled={submitting}>
                {submitting ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" />
                    <span>Submitting...</span>
                  </>
                ) : (
                  <span>Submit Form</span>
                )}
              </button>
            )}
          </div>
        </div>
      </form>

      {/* Success/Error Messages */}
      {successMessage && (
        <div className="alert alert-success">
          <strong>Success!</strong> {successMessage}
        </div>
      )}
      {errorMessage && (
        <div className="alert alert-danger">
          <strong>Error!</strong> {errorMessage}
        </div>
      )}
    </div>
  );
};

export default IntakeForm;
