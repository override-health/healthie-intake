// Signature Pad Integration for Healthie Intake Form
// Handles signature canvas initialization, drawing, clearing, and data capture

window.SignaturePadHelper = {
    signaturePads: {},

    initialize: function (canvasId, moduleId) {
        console.log('SignaturePadHelper.initialize called for:', canvasId, 'moduleId:', moduleId);

        const canvas = document.getElementById(canvasId);
        if (!canvas) {
            console.error('Canvas element not found:', canvasId);
            return false;
        }

        // Check if signature pad already exists
        if (this.signaturePads[canvasId]) {
            console.log('Signature pad already exists for:', canvasId);
            return true;
        }

        // Create new signature pad instance
        const signaturePad = new SignaturePad(canvas, {
            backgroundColor: 'rgb(255, 255, 255)',
            penColor: 'rgb(0, 0, 0)',
            minWidth: 0.5,
            maxWidth: 2.5,
            throttle: 16, // 60fps
            minDistance: 5
        });

        // Store reference
        this.signaturePads[canvasId] = signaturePad;

        console.log('Signature pad initialized for:', canvasId);
        return true;
    },

    clear: function (canvasId) {
        console.log('SignaturePadHelper.clear called for:', canvasId);

        const signaturePad = this.signaturePads[canvasId];
        if (!signaturePad) {
            console.error('Signature pad not found:', canvasId);
            return false;
        }

        signaturePad.clear();
        console.log('Signature pad cleared for:', canvasId);
        return true;
    },

    isEmpty: function (canvasId) {
        const signaturePad = this.signaturePads[canvasId];
        if (!signaturePad) {
            console.error('Signature pad not found:', canvasId);
            return true;
        }

        return signaturePad.isEmpty();
    },

    getDataURL: function (canvasId, format = 'image/png') {
        console.log('SignaturePadHelper.getDataURL called for:', canvasId);

        const signaturePad = this.signaturePads[canvasId];
        if (!signaturePad) {
            console.error('Signature pad not found:', canvasId);
            return null;
        }

        if (signaturePad.isEmpty()) {
            console.log('Signature pad is empty');
            return null;
        }

        const dataURL = signaturePad.toDataURL(format);
        console.log('Signature data URL generated, length:', dataURL.length);
        return dataURL;
    },

    setDataURL: function (canvasId, dataURL) {
        console.log('SignaturePadHelper.setDataURL called for:', canvasId);

        const signaturePad = this.signaturePads[canvasId];
        if (!signaturePad) {
            console.error('Signature pad not found:', canvasId);
            return false;
        }

        if (!dataURL) {
            console.log('No data URL provided, clearing canvas');
            signaturePad.clear();
            return true;
        }

        try {
            signaturePad.fromDataURL(dataURL);
            console.log('Signature loaded from data URL');
            return true;
        } catch (error) {
            console.error('Error loading signature from data URL:', error);
            return false;
        }
    },

    destroy: function (canvasId) {
        console.log('SignaturePadHelper.destroy called for:', canvasId);

        const signaturePad = this.signaturePads[canvasId];
        if (signaturePad) {
            signaturePad.off(); // Remove event listeners
            delete this.signaturePads[canvasId];
            console.log('Signature pad destroyed for:', canvasId);
        }
    }
};
