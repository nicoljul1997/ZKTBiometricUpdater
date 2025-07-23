/**
 * Core service that orchestrates the biometric data synchronization process
 * This is the main business logic that coordinates between biometric devices and database
 * Supports both single device and multiple devices synchronization
 */
class BiometricSyncService {
    constructor(biometricDeviceOrManager, databaseAdapter, logger = console) {
        this.biometricDeviceManager = biometricDeviceOrManager;
        this.databaseAdapter = databaseAdapter;
        this.logger = logger;
        this.isMultiDevice = typeof biometricDeviceOrManager.getAllDevices === 'function';
    }

    /**
     * Synchronize attendance data from biometric device(s) to database
     * @param {Date} fromDate - Start date for synchronization
     * @param {Date} toDate - End date for synchronization
     * @param {Array|string} deviceIds - Optional specific device IDs to sync (for multi-device setup)
     * @returns {Promise<Object>} Sync result with statistics
     */
    async syncAttendanceData(fromDate, toDate, deviceIds = null) {
        if (this.isMultiDevice) {
            return this.syncMultipleDevices(fromDate, toDate, deviceIds);
        } else {
            return this.syncSingleDevice(fromDate, toDate);
        }
    }

    /**
     * Synchronize data from multiple devices
     * @param {Date} fromDate - Start date for synchronization
     * @param {Date} toDate - End date for synchronization
     * @param {Array|string} deviceIds - Optional specific device IDs to sync
     * @returns {Promise<Object>} Sync result with statistics
     */
    async syncMultipleDevices(fromDate, toDate, deviceIds = null) {
        const stats = {
            totalRecords: 0,
            insertedRecords: 0,
            errors: [],
            deviceStats: {},
            startTime: new Date(),
            endTime: null
        };

        try {
            this.logger.log(`Starting multi-device sync from ${fromDate.toISOString()} to ${toDate.toISOString()}`);

            // Determine which devices to sync
            let devicesToSync = [];
            if (deviceIds) {
                const idsArray = Array.isArray(deviceIds) ? deviceIds : [deviceIds];
                devicesToSync = idsArray.map(id => this.biometricDeviceManager.getDevice(id));
            } else {
                devicesToSync = this.biometricDeviceManager.getAllDevices();
            }

            this.logger.log(`Syncing ${devicesToSync.length} devices`);

            // Connect to database
            await this.databaseAdapter.connect();
            this.logger.log('Connected to database');

            // Sync each device
            for (const device of devicesToSync) {
                const deviceInfo = await device.getDeviceInfo();
                const deviceId = deviceInfo.id;

                this.logger.log(`Syncing device: ${deviceId} (${deviceInfo.name})`);

                try {
                    const deviceStats = await this.syncDeviceData(device, fromDate, toDate);
                    stats.deviceStats[deviceId] = deviceStats;
                    stats.totalRecords += deviceStats.totalRecords;
                    stats.insertedRecords += deviceStats.insertedRecords;
                    stats.errors.push(...deviceStats.errors);

                    this.logger.log(`Device ${deviceId} sync completed: ${deviceStats.insertedRecords}/${deviceStats.totalRecords} records`);

                } catch (error) {
                    this.logger.error(`Error syncing device ${deviceId}:`, error);
                    stats.errors.push({
                        deviceId,
                        error: error.message,
                        type: 'device_sync_error'
                    });
                    stats.deviceStats[deviceId] = {
                        totalRecords: 0,
                        insertedRecords: 0,
                        errors: [{ error: error.message }]
                    };
                }
            }

            // Update all devices' last sync timestamp
            if (stats.insertedRecords > 0) {
                await this.updateAllDevicesLastSync(devicesToSync);
                this.logger.log('Updated all devices last sync timestamp');
            }

            // Disconnect from database
            await this.databaseAdapter.disconnect();
            this.logger.log('Disconnected from database');

            stats.endTime = new Date();
            this.logger.log(`Multi-device sync completed. Total: ${stats.insertedRecords}/${stats.totalRecords} records`);

            return stats;

        } catch (error) {
            this.logger.error('Multi-device sync failed:', error);
            stats.errors.push({ error: error.message, type: 'general_error' });
            stats.endTime = new Date();

            // Cleanup connections
            await this.cleanupConnections();

            throw error;
        }
    }

    /**
     * Synchronize data from a single device (backward compatibility)
     * @param {Date} fromDate - Start date for synchronization
     * @param {Date} toDate - End date for synchronization
     * @returns {Promise<Object>} Sync result with statistics
     */
    async syncSingleDevice(fromDate, toDate) {
        const stats = {
            totalRecords: 0,
            insertedRecords: 0,
            errors: [],
            startTime: new Date(),
            endTime: null
        };

        try {
            this.logger.log(`Starting sync from ${fromDate.toISOString()} to ${toDate.toISOString()}`);

            const deviceStats = await this.syncDeviceData(this.biometricDeviceManager, fromDate, toDate);
            
            // Connect to database
            await this.databaseAdapter.connect();
            this.logger.log('Connected to database');

            // Update device last sync timestamp
            if (deviceStats.insertedRecords > 0) {
                await this.updateDeviceLastSync(this.biometricDeviceManager);
                this.logger.log('Updated device last sync timestamp');
            }

            // Disconnect from database
            await this.databaseAdapter.disconnect();
            this.logger.log('Disconnected from database');

            deviceStats.endTime = new Date();
            this.logger.log(`Sync completed. Inserted ${deviceStats.insertedRecords}/${deviceStats.totalRecords} records`);

            return deviceStats;

        } catch (error) {
            this.logger.error('Sync failed:', error);
            const stats = {
                totalRecords: 0,
                insertedRecords: 0,
                errors: [{ error: error.message }],
                startTime: new Date(),
                endTime: new Date()
            };

            // Cleanup connections
            await this.cleanupConnections();
            throw error;
        }
    }

    /**
     * Sync data from a single device
     * @param {IBiometricDevice} device - Device to sync
     * @param {Date} fromDate - Start date
     * @param {Date} toDate - End date
     * @returns {Promise<Object>} Device sync statistics
     */
    async syncDeviceData(device, fromDate, toDate) {
        const deviceStats = {
            totalRecords: 0,
            insertedRecords: 0,
            errors: [],
            startTime: new Date(),
            endTime: null
        };

        try {
            // Connect to biometric device
            await device.connect();
            this.logger.log('Connected to biometric device');

            // Get attendance data
            const attendanceData = await device.getAttendanceData(fromDate, toDate);
            deviceStats.totalRecords = attendanceData.length;
            this.logger.log(`Retrieved ${deviceStats.totalRecords} records from device`);

            // Disconnect from device early to free resources
            await device.disconnect();
            this.logger.log('Disconnected from biometric device');

            // Process each record (database connection should already be established)
            for (const record of attendanceData) {
                try {
                    await this.databaseAdapter.insertTimeRecord(record);
                    deviceStats.insertedRecords++;
                } catch (error) {
                    this.logger.error(`Error inserting record:`, error);
                    deviceStats.errors.push({
                        record,
                        error: error.message
                    });
                }
            }

            deviceStats.endTime = new Date();
            return deviceStats;

        } catch (error) {
            this.logger.error('Device sync failed:', error);
            deviceStats.errors.push({ error: error.message });
            deviceStats.endTime = new Date();

            // Cleanup device connection
            try {
                await device.disconnect();
            } catch (e) {
                // Ignore cleanup errors
            }

            throw error;
        }
    }

    /**
     * Update multiple devices' last synchronization timestamp
     * @param {Array} devices - Array of device adapters
     * @returns {Promise<void>}
     */
    async updateAllDevicesLastSync(devices) {
        const timestamp = new Date().toISOString().slice(0, 19).replace('T', ' ');
        
        for (const device of devices) {
            try {
                const deviceInfo = await device.getDeviceInfo();
                await this.databaseAdapter.updateBiometricDevice(deviceInfo.id, timestamp);
            } catch (error) {
                this.logger.error(`Error updating sync timestamp for device ${deviceInfo?.id}:`, error);
            }
        }
    }

    /**
     * Update a single device's last synchronization timestamp
     * @param {IBiometricDevice} device - Device adapter
     * @returns {Promise<void>}
     */
    async updateDeviceLastSync(device) {
        const timestamp = new Date().toISOString().slice(0, 19).replace('T', ' ');
        const deviceInfo = await device.getDeviceInfo();
        await this.databaseAdapter.updateBiometricDevice(deviceInfo.id, timestamp);
    }

    /**
     * Cleanup all connections
     * @returns {Promise<void>}
     */
    async cleanupConnections() {
        try {
            if (this.isMultiDevice) {
                await this.biometricDeviceManager.disconnectAll();
            } else {
                await this.biometricDeviceManager.disconnect();
            }
        } catch (e) {
            // Ignore cleanup errors
        }
        
        try {
            await this.databaseAdapter.disconnect();
        } catch (e) {
            // Ignore cleanup errors
        }
    }

    /**
     * Get sync statistics for a specific date range
     * @param {Date} fromDate - Start date
     * @param {Date} toDate - End date
     * @returns {Promise<Object>} Statistics object
     */
    async getSyncStatistics(fromDate, toDate) {
        // This could be implemented to query the database for existing records
        // and provide insights about the sync status
        throw new Error('getSyncStatistics() not yet implemented');
    }
}

module.exports = BiometricSyncService;
