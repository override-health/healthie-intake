# Medication Autocomplete Feature Documentation

**Date**: 2025-10-31
**Branch**: medication_management
**Status**: Complete - Ready for Testing

## Overview

Implemented openFDA API-powered medication autocomplete for two medication questions:
- **Question 5** (Module 19056481): Current Medications with **Start Date**
- **Question 6** (Module 19056482): Past Medications with **End Date**

Both questions share the same autocomplete functionality and UI/UX patterns.

## Features Implemented

### Core Autocomplete Features (Both Questions)

1. **openFDA Drug Product (NDC) API Integration**
   - API Key: `3yhXgt8QD6o3VEHPgTt38HALhJ8TZVnPquQpKDRa`
   - Searches both generic and brand names
   - Wildcard prefix matching: `brand_name:query* OR generic_name:query*`
   - Minimum 3 characters before triggering search
   - Maximum 10 suggestions displayed
   - 300ms debounce to reduce API calls

2. **Search Caching**
   - Caches API results by query (lowercase)
   - Reduces redundant API calls
   - Shared cache between Q5 and Q6

3. **Recently Selected Medications**
   - Tracks last 10 selected medications
   - Shows when Drug Name field is focused and empty
   - Header displays "Recently Selected"
   - Shared list between Q5 and Q6

4. **Keyboard Navigation**
   - Arrow Down/Up: Navigate through suggestions
   - Enter: Select highlighted suggestion
   - Escape: Close dropdown
   - Tab: Skip clear button, go to next field (Dosage)

5. **Text Highlighting**
   - Matching text in suggestions appears bold
   - Case-insensitive matching

6. **Clear Button (X)**
   - Appears when drug name has text
   - Clears the drug name field
   - Removed from tab order (tabIndex={-1})
   - Hover effect (turns red)

7. **Loading Indicator**
   - Shows "Searching medications..." while API call in progress

## Question-Specific Differences

### Question 5: Current Medications (Module 19056481)

**Fields**:
- Drug Name * (required)
- Dosage (optional)
- **Start Date** (optional) - Calendar picker
- Directions (optional)

**State**: `medications` array
**Handlers**:
- `handleDrugNameChange(id, value)`
- `selectSuggestion(medicationId, suggestion)`
- `clearDrugName(medicationId)`

**Button**: "Add Medication"

### Question 6: Past Medications (Module 19056482)

**Fields**:
- Drug Name * (required)
- Dosage (optional)
- **End Date** (optional) - Calendar picker
- Directions (optional)

**State**: `pastMedications` array
**Handlers**:
- `handlePastDrugNameChange(id, value)`
- `selectPastSuggestion(medicationId, suggestion)`
- `clearPastDrugName(medicationId)`

**Button**: "Add Past Medication"

**Hint Text**: "Click "Add Past Medication" to list medications you've taken in the past but are no longer taking, or leave empty if not applicable."

## Technical Implementation

### State Variables (Lines 78-92)

```javascript
// Question 5: Current Medications
const [medications, setMedications] = useState([]);

// Question 6: Past Medications
const [pastMedications, setPastMedications] = useState([]);

// Shared autocomplete state
const [medicationSuggestions, setMedicationSuggestions] = useState({});
const [showSuggestions, setShowSuggestions] = useState({});
const [loadingSuggestions, setLoadingSuggestions] = useState({});
const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState({});
const [searchCache, setSearchCache] = useState({});
const [recentSelections, setRecentSelections] = useState([]);
```

### Shared Search Function (Lines 610-651)

```javascript
const searchMedications = async (query, medicationId) => {
  if (query.length < 3) {
    setShowSuggestions({ ...showSuggestions, [medicationId]: false });
    setSelectedSuggestionIndex({ ...selectedSuggestionIndex, [medicationId]: -1 });
    return;
  }

  // Check cache first
  const cacheKey = query.toLowerCase();
  if (searchCache[cacheKey]) {
    setMedicationSuggestions({
      ...medicationSuggestions,
      [medicationId]: searchCache[cacheKey]
    });
    setShowSuggestions({ ...showSuggestions, [medicationId]: true });
    setSelectedSuggestionIndex({ ...selectedSuggestionIndex, [medicationId]: -1 });
    return;
  }

  setLoadingSuggestions({ ...loadingSuggestions, [medicationId]: true });

  try {
    const API_KEY = '3yhXgt8QD6o3VEHPgTt38HALhJ8TZVnPquQpKDRa';
    const searchQuery = `(brand_name:${query}* OR generic_name:${query}*)`;
    const url = `https://api.fda.gov/drug/ndc.json?search=${encodeURIComponent(searchQuery)}&limit=10&api_key=${API_KEY}`;

    const response = await axios.get(url);

    if (response.data && response.data.results) {
      const suggestions = response.data.results
        .map(result => {
          const name = result.brand_name || result.generic_name || '';
          return Array.isArray(name) ? name[0] : name;
        })
        .filter(name => name)
        .filter((name, index, self) => self.indexOf(name) === index)
        .slice(0, 10);

      // Cache the results
      setSearchCache({
        ...searchCache,
        [cacheKey]: suggestions
      });

      setMedicationSuggestions({
        ...medicationSuggestions,
        [medicationId]: suggestions
      });
      setShowSuggestions({ ...showSuggestions, [medicationId]: true });
      setSelectedSuggestionIndex({ ...selectedSuggestionIndex, [medicationId]: -1 });
    }
  } catch (error) {
    console.log('Error fetching medication suggestions:', error);
    setShowSuggestions({ ...showSuggestions, [medicationId]: false });
  } finally {
    setLoadingSuggestions({ ...loadingSuggestions, [medicationId]: false });
  }
};
```

### Keyboard Navigation Handler (Lines 738-779)

```javascript
const handleKeyDown = (e, medicationId) => {
  const suggestions = medicationSuggestions[medicationId] || [];
  const currentIndex = selectedSuggestionIndex[medicationId] ?? -1; // Using ?? for index 0
  const isOpen = showSuggestions[medicationId];

  if (!isOpen || suggestions.length === 0) return;

  switch (e.key) {
    case 'ArrowDown':
      e.preventDefault();
      const nextIndex = currentIndex < suggestions.length - 1 ? currentIndex + 1 : 0;
      setSelectedSuggestionIndex({ ...selectedSuggestionIndex, [medicationId]: nextIndex });
      break;

    case 'ArrowUp':
      e.preventDefault();
      const prevIndex = currentIndex > 0 ? currentIndex - 1 : suggestions.length - 1;
      setSelectedSuggestionIndex({ ...selectedSuggestionIndex, [medicationId]: prevIndex });
      break;

    case 'Enter':
      e.preventDefault();
      if (currentIndex >= 0 && currentIndex < suggestions.length) {
        selectSuggestion(medicationId, suggestions[currentIndex]); // Or selectPastSuggestion for Q6
      }
      break;

    case 'Escape':
      e.preventDefault();
      setShowSuggestions({ ...showSuggestions, [medicationId]: false });
      setSelectedSuggestionIndex({ ...selectedSuggestionIndex, [medicationId]: -1 });
      break;
  }
};
```

### Text Highlighting Function (Lines 781-799)

```javascript
const highlightMatch = (text, query) => {
  if (!query) return text;

  const index = text.toLowerCase().indexOf(query.toLowerCase());
  if (index === -1) return text;

  return (
    <>
      {text.substring(0, index)}
      <strong>{text.substring(index, index + query.length)}</strong>
      {text.substring(index + query.length)}
    </>
  );
};
```

## Field Width Configuration

### Question 5 & 6 (Desktop >= 768px)
- Drug Name: 35% (col-md-3.5)
- Dosage: 11.67% (col-md-1.67)
- Date: 15% (col-md-2 adjusted)
- Directions: 30% (col-md-4 adjusted)
- Remove: 8.33% (col-md-1)

### Mobile (< 768px)
- All fields: 100% width (col-12)
- Stacked vertically
- Field labels visible above each input
- Remove button centered

## Draft Persistence

### localStorage Save (Lines 347-351)
```javascript
medications,
pastMedications
```

### localStorage Load (Lines 389-392)
```javascript
if (progress.medications) setMedications(progress.medications);
if (progress.pastMedications) setPastMedications(progress.pastMedications);
```

### Database Draft Save (Lines 1428-1433)
```javascript
medications: medications.filter(med => med.drugName && med.drugName.trim()),
pastMedications: pastMedications.filter(med => med.drugName && med.drugName.trim())
```

### Database Draft Load (Lines 852-857, 882-887)
```javascript
// From database
if (formData.medications) setMedications(formData.medications);
if (formData.pastMedications) setPastMedications(formData.pastMedications);

// From localStorage
if (draft.medications) setMedications(draft.medications);
if (draft.pastMedications) setPastMedications(draft.pastMedications);
```

## Form Submission

### Question 5 Format (Lines 1318-1336)
```javascript
// Current Medications
if (medications.length > 0) {
  const validMedications = medications.filter(med => med.drugName && med.drugName.trim());

  if (validMedications.length > 0) {
    const medicationsText = validMedications.map(med => {
      const parts = [med.drugName];
      if (med.dosage && med.dosage.trim()) parts.push(`- ${med.dosage}`);
      if (med.startDate && med.startDate.trim()) parts.push(`- Started: ${med.startDate}`);
      if (med.directions && med.directions.trim()) parts.push(`- ${med.directions}`);
      return parts.join(' ');
    }).join('\n');

    combinedFormAnswers['19056481'] = medicationsText;
    combinedFormAnswers['medications_structured'] = validMedications;
  }
}
```

### Question 6 Format (Lines 1343-1363)
```javascript
// Past Medications
if (pastMedications.length > 0) {
  const validPastMedications = pastMedications.filter(med => med.drugName && med.drugName.trim());

  if (validPastMedications.length > 0) {
    const pastMedicationsText = validPastMedications.map(med => {
      const parts = [med.drugName];
      if (med.dosage && med.dosage.trim()) parts.push(`- ${med.dosage}`);
      if (med.endDate && med.endDate.trim()) parts.push(`- Ended: ${med.endDate}`);
      if (med.directions && med.directions.trim()) parts.push(`- ${med.directions}`);
      return parts.join(' ');
    }).join('\n');

    combinedFormAnswers['19056482'] = pastMedicationsText;
    combinedFormAnswers['past_medications_structured'] = validPastMedications;
  }
}
```

## UI Components

### Question 5 UI (Lines 1967-2193)
- Column headers (desktop only): Drug Name, Dosage, Start Date, Directions
- Mobile labels for each field
- Autocomplete dropdown with recent selections
- Clear button (X) with tabIndex={-1}
- Loading indicator
- Remove button for each medication

### Question 6 UI (Lines 2196-2424)
- Column headers (desktop only): Drug Name, Dosage, End Date, Directions
- Mobile labels for each field
- Autocomplete dropdown with recent selections
- Clear button (X) with tabIndex={-1}
- Loading indicator
- Remove button for each past medication

## State Reset

### clearAndStartOver (Line 530-533)
```javascript
setMedications([]);
setPastMedications([]);
```

### handleSubmit (Line 1507-1510)
```javascript
setMedications([]);
setPastMedications([]);
```

## Bug Fixes

### 1. Search Query Fix
**Problem**: "adv" didn't return "Advil"
**Solution**: Changed from `brand_name:"query"` to `brand_name:query*` for wildcard matching

### 2. Keyboard Navigation Fix
**Problem**: Enter key didn't work on first item (index 0)
**Solution**: Changed from `||` to `??` operator in line 740:
```javascript
const currentIndex = selectedSuggestionIndex[medicationId] ?? -1;
```

### 3. Question 6 Typing Fix
**Problem**: Couldn't type in Q6 drug name field
**Solution**: Created separate handlers for past medications:
- `handlePastDrugNameChange`
- `selectPastSuggestion`
- `clearPastDrugName`

### 4. Tab Navigation Improvement
**Problem**: Tab key focused on clear button (X)
**Solution**: Added `tabIndex={-1}` to both Q5 and Q6 clear buttons

## Testing Checklist

### Question 5 Testing
- [ ] Add medication with 3+ characters - autocomplete shows
- [ ] Select from dropdown with mouse
- [ ] Select from dropdown with keyboard (arrows + Enter)
- [ ] Recent selections show when field empty
- [ ] Clear button (X) works
- [ ] Tab skips clear button, goes to Dosage
- [ ] Start Date calendar picker works
- [ ] Add multiple medications
- [ ] Remove medication works
- [ ] Draft saves and loads correctly
- [ ] Form submission includes all medications

### Question 6 Testing
- [ ] Add past medication with 3+ characters
- [ ] Select from dropdown with mouse
- [ ] Select from dropdown with keyboard
- [ ] Recent selections show when field empty
- [ ] Clear button (X) works
- [ ] Tab skips clear button, goes to Dosage
- [ ] End Date calendar picker works
- [ ] Add multiple past medications
- [ ] Remove past medication works
- [ ] Draft saves and loads correctly
- [ ] Form submission includes all past medications

### Cross-Question Testing
- [ ] Cache shared between Q5 and Q6
- [ ] Recent selections shared between Q5 and Q6
- [ ] Can have medications in both Q5 and Q6
- [ ] Both save/load from draft correctly
- [ ] Both submit correctly
- [ ] Mobile responsive for both questions
- [ ] Desktop column layout for both questions

## Known Limitations

1. **No duplicate detection** - Users can add same medication multiple times
2. **No drug interaction warnings** - No cross-checking between medications
3. **No medication validation** - Any text accepted in drug name field
4. **Browser-dependent date picker** - Date format varies by browser
5. **Text-only Healthie format** - Structured data only in PostgreSQL

## Future Enhancements

- [ ] Duplicate medication detection
- [ ] Drug interaction warnings (FDA API)
- [ ] Medication frequency field (e.g., "twice daily")
- [ ] Import medications from previous submissions
- [ ] Medication autocomplete for dosage
- [ ] Prescription vs OTC flag
- [ ] Condition/reason field
- [ ] Export medications as PDF

## Files Modified

1. **HealthieIntake.UI.React/src/components/IntakeForm.jsx**
   - Lines 78-92: State variables for medications and autocomplete
   - Lines 128: Added pastMedications to useEffect dependencies
   - Lines 347-351: localStorage save
   - Lines 389-392: localStorage load
   - Lines 524-533: clearAndStartOver state reset
   - Lines 555-574: Current medication handlers (Q5)
   - Lines 576-596: Past medication handlers (Q6)
   - Lines 610-651: searchMedications function (shared)
   - Lines 682-709: Current medication autocomplete handlers
   - Lines 711-736: Past medication autocomplete handlers
   - Lines 738-779: Keyboard navigation handler
   - Lines 781-799: Text highlighting function
   - Lines 1318-1336: Q5 form submission
   - Lines 1343-1363: Q6 form submission
   - Lines 1428-1433: Database draft save
   - Lines 1507-1510: Submission state reset
   - Lines 1967-2193: Q5 UI (Current Medications)
   - Lines 2196-2424: Q6 UI (Past Medications)

## Performance Considerations

- **Debouncing**: 300ms delay prevents excessive API calls
- **Caching**: Reduces redundant API requests
- **Lazy Loading**: Dropdown only renders when needed
- **Keyboard IDs**: Uses medication ID as unique key for state management

## Accessibility

- Tab navigation works correctly (skips clear button)
- Keyboard navigation for dropdown (arrows, Enter, Escape)
- Loading indicators for screen readers
- Title attributes on clear buttons
- Proper placeholder text on all fields

## API Rate Limiting

openFDA API has rate limits:
- **Without API key**: 40 requests per minute
- **With API key**: 240 requests per minute per IP (current setup)

Current implementation with 300ms debounce + caching should stay well within limits.

## Commit History

- `q5_auto_complete` - Completed Question 5 autocomplete implementation
- (Next commit will include Q6 completion + bug fixes)
