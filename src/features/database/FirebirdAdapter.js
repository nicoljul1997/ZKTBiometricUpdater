const IDatabaseAdapter = require('../../core/interfaces/IDatabaseAdapter');
const Firebird = require('node-firebird');

/**
 * Firebird database adapter implementation
 * Implements the IDatabaseAdapter interface for Firebird database operations
 */
class FirebirdAdapter extends IDatabaseAdapter {
    constructor(config, logger = console) {
        super();
        this.config = config;
        this.logger = logger;
        this.connection = null;
    }

    /**
     * Connect to the Firebird database
     * @returns {Promise<void>}
     */
    async connect() {
        return new Promise((resolve, reject) => {
            if (this.connection) {
                return resolve();
            }

            Firebird.attach(this.config, (err, db) => {
                if (err) {
                    this.logger.error('Error connecting to Firebird database:', err);
                    return reject(err);
                }

                this.connection = db;
                this.logger.debug('Connected to Firebird database');
                resolve();
            });
        });
    }

    /**
     * Disconnect from the Firebird database
     * @returns {Promise<void>}
     */
    async disconnect() {
        return new Promise((resolve, reject) => {
            if (!this.connection) {
                return resolve();
            }

            this.connection.detach((err) => {
                if (err) {
                    this.logger.error('Error disconnecting from Firebird database:', err);
                    return reject(err);
                }

                this.connection = null;
                this.logger.debug('Disconnected from Firebird database');
                resolve();
            });
        });
    }

    /**
     * Insert a time record into the EMPLOYEETIMERECORDS table
     * @param {Object} record - The time record to insert
     * @param {string} record.employeeNumber - Employee number
     * @param {string} record.timeRecord - Time record timestamp
     * @param {number} record.inOutMode - In/Out mode
     * @param {string} record.ipAddress - Device IP address
     * @param {string} record.location - Device location/name
     * @returns {Promise<any>}
     */
    async insertTimeRecord(record) {
        const query = `
            INSERT INTO EMPLOYEETIMERECORDS 
            (EMPLOYEENUMBER, TIMERECORD, INOUTMODE, VERIFYMODE, IPADDRESS, LOCATION) 
            VALUES (?, ?, ?, ?, ?, ?)
        `;
        
        const params = [
            record.employeeNumber,
            record.timeRecord,
            record.inOutMode,
            record.verifyMode || 1,
            record.ipAddress,
            record.location
        ];

        return this.executeQuery(query, params);
    }

    /**
     * Update biometric device last updated timestamp
     * @param {string} deviceId - The device ID
     * @param {string} timestamp - The timestamp
     * @returns {Promise<any>}
     */
    async updateBiometricDevice(deviceId, timestamp) {
        const query = 'UPDATE BIOMETRICDEVICES SET DATELASTUPDATED = ? WHERE ID = ?';
        const params = [timestamp, deviceId];

        return this.executeQuery(query, params);
    }

    /**
     * Execute a custom query
     * @param {string} query - The SQL query
     * @param {Array} params - Query parameters
     * @returns {Promise<any>}
     */
    async executeQuery(query, params = []) {
        return new Promise((resolve, reject) => {
            if (!this.connection) {
                return reject(new Error('Database not connected'));
            }

            this.connection.query(query, params, (err, result) => {
                if (err) {
                    this.logger.error('Error executing query:', err);
                    this.logger.error('Query:', query);
                    this.logger.error('Params:', params);
                    return reject(err);
                }

                this.logger.debug('Query executed successfully');
                resolve(result);
            });
        });
    }

    /**
     * Execute a query and return results
     * @param {string} query - The SQL query
     * @param {Array} params - Query parameters
     * @returns {Promise<Array>}
     */
    async selectQuery(query, params = []) {
        return new Promise((resolve, reject) => {
            if (!this.connection) {
                return reject(new Error('Database not connected'));
            }

            this.connection.query(query, params, (err, result) => {
                if (err) {
                    this.logger.error('Error executing select query:', err);
                    return reject(err);
                }

                resolve(result || []);
            });
        });
    }

    /**
     * Check if a time record already exists
     * @param {Object} record - The time record to check
     * @returns {Promise<boolean>}
     */
    async recordExists(record) {
        const query = `
            SELECT COUNT(*) as count 
            FROM EMPLOYEETIMERECORDS 
            WHERE EMPLOYEENUMBER = ? AND TIMERECORD = ? AND INOUTMODE = ?
        `;
        
        const params = [record.employeeNumber, record.timeRecord, record.inOutMode];
        const result = await this.selectQuery(query, params);
        
        return result && result.length > 0 && result[0].COUNT > 0;
    }
}

module.exports = FirebirdAdapter;
