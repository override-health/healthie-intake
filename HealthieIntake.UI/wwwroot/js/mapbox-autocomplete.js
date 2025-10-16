// Mapbox Address Autocomplete Integration using Geocoder
// Note: Requires Mapbox Access Token to be set

window.MapboxAutocomplete = {
    geocoders: {},
    wrappers: {},

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

        // Check if geocoder already exists for this input
        if (this.geocoders[inputId]) {
            console.log('Geocoder already exists for:', inputId);
            // Update the geocoder with current value if needed
            const existingValue = input.value;
            if (existingValue) {
                this.geocoders[inputId].setInput(existingValue);
            }
            return;
        }

        // Create a wrapper div for the geocoder
        const wrapper = document.createElement('div');
        wrapper.className = 'mapbox-geocoder-wrapper';
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

        // Store references
        this.geocoders[inputId] = geocoder;
        this.wrappers[inputId] = wrapper;

        // Set initial value if exists
        if (input.value) {
            geocoder.setInput(input.value);
        }

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
    },

    destroy: function (inputId) {
        console.log('MapboxAutocomplete.destroy called for:', inputId);

        // Remove geocoder instance
        if (this.geocoders[inputId]) {
            this.geocoders[inputId].onRemove();
            delete this.geocoders[inputId];
        }

        // Remove wrapper from DOM
        if (this.wrappers[inputId]) {
            this.wrappers[inputId].remove();
            delete this.wrappers[inputId];
        }

        // Show the original input again
        const input = document.getElementById(inputId);
        if (input) {
            input.style.display = '';
        }

        console.log('Mapbox geocoder destroyed for:', inputId);
    }
};
