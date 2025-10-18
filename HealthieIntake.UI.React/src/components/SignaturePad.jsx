import React, { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import SignaturePadLib from 'signature_pad';

const SignaturePad = forwardRef(({ moduleId, initialValue }, ref) => {
  const canvasRef = useRef(null);
  const signaturePadRef = useRef(null);
  const initializedRef = useRef(false);

  useImperativeHandle(ref, () => ({
    getDataURL: () => {
      if (!signaturePadRef.current || signaturePadRef.current.isEmpty()) {
        return null;
      }
      return signaturePadRef.current.toDataURL('image/png');
    },
    clear: () => {
      if (signaturePadRef.current) {
        signaturePadRef.current.clear();
      }
    }
  }));

  useEffect(() => {
    if (!canvasRef.current) return;

    // Create signature pad instance
    const signaturePad = new SignaturePadLib(canvasRef.current, {
      backgroundColor: 'rgb(255, 255, 255)',
      penColor: 'rgb(0, 0, 0)',
      minWidth: 0.5,
      maxWidth: 2.5,
      throttle: 16, // 60fps
      minDistance: 5
    });

    signaturePadRef.current = signaturePad;

    // Load initial signature if provided (only once on mount)
    if (initialValue && !initializedRef.current) {
      try {
        signaturePad.fromDataURL(initialValue);
        initializedRef.current = true;
      } catch (error) {
        console.error('Error loading initial signature:', error);
      }
    }

    // Cleanup
    return () => {
      signaturePad.off();
    };
  }, [moduleId]);

  const handleClear = () => {
    if (signaturePadRef.current) {
      signaturePadRef.current.clear();
    }
  };

  return (
    <div className="signature-container">
      <canvas
        ref={canvasRef}
        width="500"
        height="200"
        className="signature-canvas"
        style={{ touchAction: 'none' }}
      />
      <button
        type="button"
        className="btn btn-sm btn-secondary mt-2"
        onClick={handleClear}
      >
        Clear Signature
      </button>
    </div>
  );
});

SignaturePad.displayName = 'SignaturePad';

export default SignaturePad;
