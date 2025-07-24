/**
 * Interface for database operations
 * Defines the contract that all database adapters must implement
 */
class IDatabaseAdapter {
    /**
     * Connect to the database
     * @returns {Promise<void>}
     */
    async connect() {
        throw new Error('connect() method must be implemented');
    }

    /**
     * Disconnect from the database
     * @returns {Promise<void>}
     */
    async disconnect() {
        throw new Error('disconnect() method must be implemented');
    }

    /**
     * Insert a time record
     * @param {Object} record - The time record to insert
     * @returns {Promise<any>}
     */
    async insertTimeRecord(record) {
        throw new Error('insertTimeRecord() method must be implemented');
    }

    /**
     * Update biometric device last updated timestamp
     * @param {string} deviceId - The device ID
     * @param {string} timestamp - The timestamp
     * @returns {Promise<any>}
     */
    async updateBiometricDevice(deviceId, timestamp) {
        throw new Error('updateBiometricDevice() method must be implemented');
    }

    /**
     * Execute a custom query
     * @param {string} query - The SQL query
     * @param {Array} params - Query parameters
     * @returns {Promise<any>}
     */
    async executeQuery(query, params = []) {
        throw new Error('executeQuery() method must be implemented');
    }
}

module.exports = IDatabaseAdapter;
