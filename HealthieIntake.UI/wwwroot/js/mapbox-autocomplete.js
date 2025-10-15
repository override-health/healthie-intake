// Mapbox Address Autocomplete Integration using Geocoder
// Note: Requires Mapbox Access Token to be set

window.MapboxAutocomplete = {
    geocoders: {},

    initialize: function (inputId, accessToken, dotNetHelper, moduleId) {
        console.log('MapboxAutocomplete.initialize called for:', inputId);
        console.log('MapboxGeocoder available:', typeof MapboxGeocoder !== 'undefined');
        console.log('Access token:', accessToken ? 'provided' : 'missing');

        // Wait for Mapbox Geocoder to be loaded
        if (typeof MapboxGeocoder === 'undefined') {
            console.error('Mapbox Geocoder not loaded - will retry in 500ms');
            setTimeout(() => this.initialize(inputId, accessToken, dotNetHelper, moduleId), 500);
            return;
        }

        const input = document.getElementById(inputId);
        if (!input) {
            console.error('Input element not found:', inputId);
            return;
        }
        console.log('Input element found:', input);

        // Create a wrapper div for the geocoder
        const wrapper = document.createElement('div');
        wrapper.style.width = '100%';
        input.style.display = 'none'; // Hide original input
        input.parentNode.insertBefore(wrapper, input);

        // Create the geocoder instance
        const geocoder = new MapboxGeocoder({
            accessToken: accessToken,
            types: 'address',
            countries: 'us',
            placeholder: 'Start typing your address...',
            marker: false,
            mapboxgl: null // We don't need a map
        });

        // Add to wrapper
        geocoder.addTo(wrapper);

        // Store reference
        this.geocoders[inputId] = geocoder;

        // Listen for result selection
        geocoder.on('result', (e) => {
            const fullAddress = e.result.place_name;

            // Update the hidden input
            input.value = fullAddress;

            // Trigger Blazor event
            const event = new Event('input', { bubbles: true });
            input.dispatchEvent(event);

            // Notify Blazor
            dotNetHelper.invokeMethodAsync('OnAddressSelected', moduleId, fullAddress);
        });

        // Listen for clear
        geocoder.on('clear', () => {
            input.value = '';
            const event = new Event('input', { bubbles: true });
            input.dispatchEvent(event);
        });

        console.log('Mapbox geocoder initialized for:', inputId);
    }
};
