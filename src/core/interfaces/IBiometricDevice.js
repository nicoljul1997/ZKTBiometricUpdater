/**
 * Interface for biometric device operations
 * Defines the contract that all biometric device adapters must implement
 */
class IBiometricDevice {
    /**
     * Connect to the biometric device
     * @returns {Promise<void>}
     */
    async connect() {
        throw new Error('connect() method must be implemented');
    }

    /**
     * Disconnect from the biometric device
     * @returns {Promise<void>}
     */
    async disconnect() {
        throw new Error('disconnect() method must be implemented');
    }

    /**
     * Get attendance data from the device
     * @param {Date} fromDate - Start date for data retrieval
     * @param {Date} toDate - End date for data retrieval
     * @returns {Promise<Array>} Array of attendance records
     */
    async getAttendanceData(fromDate, toDate) {
        throw new Error('getAttendanceData() method must be implemented');
    }

    /**
     * Get device information
     * @returns {Promise<Object>} Device information
     */
    async getDeviceInfo() {
        throw new Error('getDeviceInfo() method must be implemented');
    }

    /**
     * Clear attendance data from device
     * @returns {Promise<void>}
     */
    async clearAttendanceData() {
        throw new Error('clearAttendanceData() method must be implemented');
    }
}

module.exports = IBiometricDevice;
