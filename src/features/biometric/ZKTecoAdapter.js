const IBiometricDevice = require('../../core/interfaces/IBiometricDevice');
const ZKLib = require('zklib');
const moment = require('moment');

/**
 * ZKTeco biometric device adapter implementation
 * Implements the IBiometricDevice interface for ZKTeco devices
 */
class ZKTecoAdapter extends IBiometricDevice {
    constructor(config, logger = console) {
        super();
        this.config = config;
        this.logger = logger;
        this.device = null;
        this.isConnected = false;
    }

    /**
     * Connect to the ZKTeco biometric device
     * @returns {Promise<void>}
     */
    async connect() {
        return new Promise((resolve, reject) => {
            if (this.isConnected) {
                return resolve();
            }

            this.device = new ZKLib({
                ip: this.config.ip,
                port: this.config.port,
                inport: this.config.inport,
                timeout: this.config.timeout,
                attendanceParser: this.config.parser,
                connectionType: this.config.protocol,
            });

            this.device.connect((err) => {
                if (err) {
                    this.logger.error('Failed to connect to ZKTeco device:', err);
                    return reject(err);
                }

                this.isConnected = true;
                this.logger.debug('Connected to ZKTeco device');
                resolve();
            });
        });
    }

    /**
     * Disconnect from the ZKTeco biometric device
     * @returns {Promise<void>}
     */
    async disconnect() {
        return new Promise((resolve, reject) => {
            if (!this.isConnected || !this.device) {
                this.isConnected = false;
                return resolve();
            }

            this.device.disconnect((err) => {
                if (err) {
                    this.logger.error('Error disconnecting from ZKTeco device:', err);
                    return reject(err);
                }

                this.isConnected = false;
                this.device = null;
                this.logger.debug('Disconnected from ZKTeco device');
                resolve();
            });
        });
    }

    /**
     * Get attendance data from the device
     * @param {Date} fromDate - Start date for data retrieval
     * @param {Date} toDate - End date for data retrieval
     * @returns {Promise<Array>} Array of attendance records
     */
    async getAttendanceData(fromDate, toDate) {
        return new Promise((resolve, reject) => {
            if (!this.isConnected || !this.device) {
                return reject(new Error('Device not connected'));
            }

            this.device.getAttendance((err, data) => {
                if (err) {
                    this.logger.error('Error getting attendance data:', err);
                    return reject(err);
                }

                // Format the raw attendance data
                const formattedLogs = data.map((log) => ({
                    employeeNumber: log.uid,
                    timeRecord: moment(log.timestamp).format('YYYY-MM-DD HH:mm:ss'),
                    inOutMode: log.inOutStatus,
                    verifyMode: log.verifyMode || 1,
                    ipAddress: this.config.ip,
                    location: this.config.name
                }));

                // Filter by date range if specified
                let filteredLogs = formattedLogs;
                if (fromDate && toDate) {
                    const fromDateStr = moment(fromDate).format('YYYY-MM-DD');
                    const toDateStr = moment(toDate).format('YYYY-MM-DD');
                    
                    filteredLogs = formattedLogs.filter(record => {
                        const recordDate = record.timeRecord.split(' ')[0];
                        return recordDate >= fromDateStr && recordDate <= toDateStr;
                    });
                }

                this.logger.debug(`Retrieved ${filteredLogs.length} attendance records`);
                resolve(filteredLogs);
            });
        });
    }

    /**
     * Get device information
     * @returns {Promise<Object>} Device information
     */
    async getDeviceInfo() {
        return new Promise((resolve, reject) => {
            if (!this.isConnected || !this.device) {
                // Return config-based info if not connected
                return resolve({
                    id: this.config.id,
                    ip: this.config.ip,
                    name: this.config.name,
                    model: this.config.model,
                    port: this.config.port
                });
            }

            // Try to get device info from the device itself
            try {
                resolve({
                    id: this.config.id,
                    ip: this.config.ip,
                    name: this.config.name,
                    model: this.config.model,
                    port: this.config.port,
                    connected: this.isConnected
                });
            } catch (error) {
                this.logger.error('Error getting device info:', error);
                reject(error);
            }
        });
    }

    /**
     * Clear attendance data from device
     * @returns {Promise<void>}
     */
    async clearAttendanceData() {
        return new Promise((resolve, reject) => {
            if (!this.isConnected || !this.device) {
                return reject(new Error('Device not connected'));
            }

            this.device.clearAttendanceLog((err) => {
                if (err) {
                    this.logger.error('Error clearing attendance data:', err);
                    return reject(err);
                }

                this.logger.debug('Cleared attendance data from device');
                resolve();
            });
        });
    }

    /**
     * Get device status and statistics
     * @returns {Promise<Object>} Device status information
     */
    async getDeviceStatus() {
        return new Promise((resolve, reject) => {
            if (!this.isConnected || !this.device) {
                return reject(new Error('Device not connected'));
            }

            // This is a placeholder - actual implementation depends on ZKLib capabilities
            try {
                resolve({
                    connected: this.isConnected,
                    lastSync: new Date(),
                    // Add more status fields as needed
                });
            } catch (error) {
                this.logger.error('Error getting device status:', error);
                reject(error);
            }
        });
    }
}

module.exports = ZKTecoAdapter;
