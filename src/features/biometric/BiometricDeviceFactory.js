const ZKTecoAdapter = require('./ZKTecoAdapter');

/**
 * Biometric device adapter factory
 * Creates biometric device adapters based on configuration
 */
class BiometricDeviceFactory {
    /**
     * Create a biometric device adapter based on type
     * @param {string} type - Device type ('zkteco', 'hikvision', etc.)
     * @param {Object} config - Device configuration
     * @param {Object} logger - Logger instance
     * @returns {IBiometricDevice} Biometric device adapter instance
     */
    static create(type, config, logger) {
        switch (type.toLowerCase()) {
            case 'zkteco':
            case 'zklib':
                return new ZKTecoAdapter(config, logger);
            
            // Future biometric device adapters can be added here
            case 'hikvision':
                throw new Error('Hikvision adapter not implemented yet');
            
            case 'suprema':
                throw new Error('Suprema adapter not implemented yet');
            
            case 'fingertec':
                throw new Error('FingerTec adapter not implemented yet');
            
            default:
                throw new Error(`Unsupported biometric device type: ${type}`);
        }
    }

    /**
     * Get list of supported device types
     * @returns {Array<string>} List of supported device types
     */
    static getSupportedTypes() {
        return ['zkteco', 'zklib'];
    }

    /**
     * Check if a device type is supported
     * @param {string} type - Device type to check
     * @returns {boolean} True if supported
     */
    static isSupported(type) {
        return this.getSupportedTypes().includes(type.toLowerCase());
    }

    /**
     * Auto-detect device type based on configuration
     * @param {Object} config - Device configuration
     * @returns {string} Detected device type
     */
    static autoDetectType(config) {
        // For now, default to ZKTeco since that's what the original code used
        // This could be enhanced to detect based on model, protocol, etc.
        return 'zkteco';
    }
}

module.exports = BiometricDeviceFactory;
