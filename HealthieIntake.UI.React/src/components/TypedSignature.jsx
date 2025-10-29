import React, { useState, useEffect, useRef, useImperativeHandle, forwardRef } from 'react';

const TypedSignature = forwardRef(({ moduleId, initialValue }, ref) => {
  const [agreed, setAgreed] = useState(false);
  const [typedName, setTypedName] = useState('');
  const [timestamp, setTimestamp] = useState(null);
  const canvasRef = useRef(null);
  const fontLoadedRef = useRef(false);

  // Load initial values if provided
  useEffect(() => {
    if (initialValue && typeof initialValue === 'object') {
      try {
        setAgreed(initialValue.agreed || false);
        setTypedName(initialValue.typedName || '');
        setTimestamp(initialValue.timestamp || null);
      } catch (error) {
        console.error('Error loading initial signature:', error);
      }
    }
  }, [initialValue]);

  // Wait for font to load
  useEffect(() => {
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => {
        fontLoadedRef.current = true;
        generateSignatureImage(typedName);
      });
    } else {
      // Fallback if Font Loading API not supported
      setTimeout(() => {
        fontLoadedRef.current = true;
        generateSignatureImage(typedName);
      }, 500);
    }
  }, []);

  // Generate signature image when name changes
  useEffect(() => {
    if (fontLoadedRef.current && typedName) {
      generateSignatureImage(typedName);
    } else if (!typedName && canvasRef.current) {
      // Clear canvas if name is empty
      const ctx = canvasRef.current.getContext('2d');
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
  }, [typedName]);

  const generateSignatureImage = (text) => {
    if (!text || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    // Clear and set white background
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw text in cursive font
    ctx.font = '48px "Dancing Script", cursive';
    ctx.fillStyle = 'black';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, canvas.width / 2, canvas.height / 2);
  };

  const handleAgreementChange = (e) => {
    const isChecked = e.target.checked;
    setAgreed(isChecked);
    if (isChecked) {
      setTimestamp(new Date().toISOString());
    } else {
      setTimestamp(null);
    }
  };

  const handleNameChange = (e) => {
    setTypedName(e.target.value);
  };

  // Expose methods to parent component (matching old SignaturePad interface)
  useImperativeHandle(ref, () => ({
    getDataURL: () => {
      if (!agreed || !typedName) {
        return null;
      }

      // Return structured data instead of just image
      return JSON.stringify({
        agreed,
        timestamp,
        typedName,
        imageDataURL: canvasRef.current ? canvasRef.current.toDataURL('image/png') : null
      });
    },
    clear: () => {
      setAgreed(false);
      setTypedName('');
      setTimestamp(null);
      if (canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d');
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
    },
    isEmpty: () => {
      return !agreed || !typedName;
    }
  }));

  return (
    <div className="typed-signature-container">
      {/* Agreement Checkbox */}
      <div className="form-check mb-3">
        <input
          type="checkbox"
          className="form-check-input"
          id={`agreement-${moduleId}`}
          checked={agreed}
          onChange={handleAgreementChange}
        />
        <label className="form-check-label" htmlFor={`agreement-${moduleId}`}>
          <strong>I agree to the policies listed above</strong>
        </label>
      </div>

      {/* Name Input */}
      <div className="mb-3">
        <label htmlFor={`name-input-${moduleId}`} className="form-label">
          Type your full name <span className="text-danger">*</span>
        </label>
        <input
          type="text"
          className="form-control"
          id={`name-input-${moduleId}`}
          value={typedName}
          onChange={handleNameChange}
          disabled={!agreed}
        />
        {!agreed && (
          <small className="text-muted">Please check the agreement box above to enable name input</small>
        )}
      </div>

      {/* Signature Preview */}
      {typedName && agreed && (
        <div className="signature-preview mb-3">
          <label className="form-label">Signature Preview:</label>
          <div className="border rounded p-2 bg-white">
            <canvas
              ref={canvasRef}
              width="500"
              height="200"
              className="signature-canvas"
              style={{ maxWidth: '100%', height: 'auto', display: 'block' }}
            />
          </div>
          {timestamp && (
            <small className="text-muted d-block mt-2">
              Signed on: {new Date(timestamp).toLocaleString()}
            </small>
          )}
        </div>
      )}

      {/* Validation message */}
      {agreed && !typedName && (
        <div className="alert alert-warning" role="alert">
          Please type your full name above to complete the signature.
        </div>
      )}
    </div>
  );
});

TypedSignature.displayName = 'TypedSignature';

export default TypedSignature;
