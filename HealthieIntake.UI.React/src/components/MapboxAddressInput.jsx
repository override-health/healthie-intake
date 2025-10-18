import React, { useEffect, useRef } from 'react';
import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder';
import '@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css';

// You'll need to set your Mapbox token here or in an environment variable
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || 'YOUR_MAPBOX_TOKEN_HERE';

const MapboxAddressInput = ({ moduleId, value, onChange, required }) => {
  const inputRef = useRef(null);
  const wrapperRef = useRef(null);
  const geocoderRef = useRef(null);

  useEffect(() => {
    if (!inputRef.current || !wrapperRef.current) return;

    // Create geocoder instance
    const geocoder = new MapboxGeocoder({
      accessToken: MAPBOX_TOKEN,
      types: 'address',
      countries: 'us',
      placeholder: 'Start typing your address...',
      marker: false,
    });

    // Add to wrapper
    geocoder.addTo(wrapperRef.current);
    geocoderRef.current = geocoder;

    // Set initial value if exists
    if (value) {
      geocoder.setInput(value);
    }

    // Listen for result selection
    geocoder.on('result', (e) => {
      const fullAddress = e.result.place_name;
      onChange(fullAddress);
    });

    // Listen for clear
    geocoder.on('clear', () => {
      onChange('');
    });

    // Cleanup
    return () => {
      if (geocoderRef.current) {
        geocoderRef.current.onRemove();
      }
    };
  }, [moduleId]);

  // Update geocoder when value changes externally
  useEffect(() => {
    if (geocoderRef.current && value !== geocoderRef.current.inputString) {
      geocoderRef.current.setInput(value || '');
    }
  }, [value]);

  return (
    <div>
      {/* Hidden input for form validation */}
      <input
        ref={inputRef}
        type="hidden"
        value={value}
        required={required}
      />
      {/* Mapbox geocoder container */}
      <div ref={wrapperRef} className="mapbox-geocoder-wrapper" />
    </div>
  );
};

export default MapboxAddressInput;
