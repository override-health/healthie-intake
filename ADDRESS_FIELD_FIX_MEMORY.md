# ADDRESS FIELD PERSISTENT BUG - CRITICAL MEMORY

## THE PROBLEM
The Address field with label "Address" keeps showing on ALL steps when it should ONLY show on step 2.

## ROOT CAUSE
The Mapbox Geocoder JavaScript library creates a PERSISTENT wrapper `<div>` in the DOM that contains an input field with class `mapboxgl-ctrl-geocoder--input`. This wrapper DIV does NOT get destroyed when navigating away from step 2, causing it to persist across all other steps.

## THE FIX (Applied Multiple Times - DO NOT BREAK THIS AGAIN!)

### 1. Step Filtering (GetModulesForCurrentStep method)
**File:** `/Users/corey/source/repos/healthie-intake/HealthieIntake.UI/Pages/IntakeForm.razor`
**Lines:** ~859-900

```csharp
private List<CustomModule> GetModulesForCurrentStep()
{
    if (form == null) return new List<CustomModule>();

    var allModules = form.CustomModules.ToList();

    return currentStep switch
    {
        // Step 1: Introduction only
        1 => allModules.Where(m => m.Label.Contains("Thank you for taking")).ToList(),

        // Step 2: INCLUDES location - THIS IS THE ONLY STEP THAT SHOWS ADDRESS
        2 => allModules.Where(m =>
            m.Label.Contains("Date of birth") ||
            m.ModType == "location" ||  // ✅ CORRECT - Include address here
            m.Label == "Sex" ||
            m.Label == "BMI" ||
            m.Label.Contains("Referring physician") ||
            m.Label.Contains("Primary care physician")).ToList(),

        // Step 3: EXCLUDES location
        3 => allModules.Where(m =>
            m.ModType != "location" && (  // ✅ CRITICAL - Must exclude location
            m.Label.Contains("Relationship status") ||
            m.Label.Contains("Employment status") ||
            m.Label.Contains("Occupation") ||
            m.Label.Contains("Emergency contact"))).ToList(),

        // Step 4: EXCLUDES location
        4 => allModules.Where(m => m.ModType != "location")  // ✅ CRITICAL
                      .SkipWhile(m => m.Label != "PAIN ASSESSMENT")
                      .TakeWhile(m => m.Label != "MEDICAL HISTORY")
                      .ToList(),

        // Step 5: EXCLUDES location
        5 => allModules.Where(m => m.ModType != "location")  // ✅ CRITICAL
                      .SkipWhile(m => m.Label != "MEDICAL HISTORY")
                      .ToList(),

        _ => new List<CustomModule>()
    };
}
```

**KEY POINTS:**
- Step 2: Use `m.ModType == "location"` to INCLUDE the address
- Steps 3, 4, 5: Use `m.ModType != "location"` to EXCLUDE the address
- DO NOT use `m.Label == "Address"` - use ModType!

### 2. Mapbox Cleanup (NextStep and PreviousStep methods)
**File:** `/Users/corey/source/repos/healthie-intake/HealthieIntake.UI/Pages/IntakeForm.razor`
**Lines:** ~970-1005

```csharp
private async Task NextStep()
{
    if (currentStep < totalSteps)
    {
        await SaveFormProgress();

        // ✅ CRITICAL - Destroy Mapbox when leaving step 2
        if (currentStep == 2 && addressModuleId != null)
        {
            await JSRuntime.InvokeVoidAsync("MapboxAutocomplete.destroy", $"address-{addressModuleId}");
            mapboxInitialized = false;
        }

        currentStep++;
        StateHasChanged();
    }
}

private async Task PreviousStep()
{
    if (currentStep > 1)
    {
        await SaveFormProgress();

        // ✅ CRITICAL - Destroy Mapbox when leaving step 2
        if (currentStep == 2 && addressModuleId != null)
        {
            await JSRuntime.InvokeVoidAsync("MapboxAutocomplete.destroy", $"address-{addressModuleId}");
            mapboxInitialized = false;
        }

        currentStep--;
        StateHasChanged();
    }
}
```

### 3. Mapbox JavaScript Destroy Method
**File:** `/Users/corey/source/repos/healthie-intake/HealthieIntake.UI/wwwroot/js/mapbox-autocomplete.js`
**Lines:** ~91-113

```javascript
window.MapboxAutocomplete = {
    geocoders: {},
    wrappers: {},  // ✅ Track wrapper divs

    initialize: function (inputId, accessToken, dotNetHelper, moduleId) {
        // ... initialization code ...

        // Store references
        this.geocoders[inputId] = geocoder;
        this.wrappers[inputId] = wrapper;  // ✅ CRITICAL - Store wrapper reference
    },

    destroy: function (inputId) {
        console.log('MapboxAutocomplete.destroy called for:', inputId);

        // ✅ Remove geocoder instance
        if (this.geocoders[inputId]) {
            this.geocoders[inputId].onRemove();
            delete this.geocoders[inputId];
        }

        // ✅ CRITICAL - Remove wrapper div from DOM
        if (this.wrappers[inputId]) {
            this.wrappers[inputId].remove();
            delete this.wrappers[inputId];
        }

        // ✅ Show the original input again
        const input = document.getElementById(inputId);
        if (input) {
            input.style.display = '';
        }

        console.log('Mapbox geocoder destroyed for:', inputId);
    }
};
```

## CHECKLIST BEFORE MAKING ANY CODE CHANGES

**ASK YOURSELF: "WILL THIS BREAK THE ADDRESS FIELD?"**

Before making ANY change to `IntakeForm.razor`, check:

1. ✅ Does GetModulesForCurrentStep() still have `m.ModType != "location"` for steps 3, 4, 5?
2. ✅ Does NextStep() still call `MapboxAutocomplete.destroy` when leaving step 2?
3. ✅ Does PreviousStep() still call `MapboxAutocomplete.destroy` when leaving step 2?
4. ✅ Does the mapbox-autocomplete.js file still have the destroy() method?
5. ✅ Does the destroy() method still remove the wrapper div from DOM?

## SYMPTOMS OF THE BUG RETURNING
- User reports: "Address field showing on all pages"
- User reports: "Address appears on step 3, 4, or 5"
- User reports: "I see the address input on every step"
- HTML inspection shows: `<input class="mapboxgl-ctrl-geocoder--input">`on steps other than step 2

## HOW TO FIX IF BUG RETURNS
1. Read this document FIRST
2. Check GetModulesForCurrentStep() - verify ModType filtering
3. Check NextStep/PreviousStep - verify Mapbox destroy calls
4. Check mapbox-autocomplete.js - verify destroy method exists and removes wrapper
5. DO NOT rely on caching issues - this is a CODE issue, not a cache issue

## HISTORICAL CONTEXT
This bug has been reintroduced 3+ times. The user has expressed extreme frustration with this recurring issue. DO NOT let this happen again.

**Quote from user:** "you know the definition of insanity right?"

This indicates the user's frustration with repeating the same fix multiple times.

## DATE CREATED
2025-10-16

## LAST VERIFIED WORKING
After this fix is applied
