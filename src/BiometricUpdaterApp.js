const Config = require('./config/Config');
const Logger = require('./core/utils/Logger');
const DateUtils = require('./core/utils/DateUtils');
const BiometricSyncService = require('./core/services/BiometricSyncService');
const DatabaseAdapterFactory = require('./features/database/DatabaseAdapterFactory');
const BiometricDeviceManager = require('./features/biometric/BiometricDeviceManager');

/**
 * Main application class
 * Orchestrates the entire biometric data synchronization process
 */
class BiometricUpdaterApp {
    constructor() {
        this.config = null;
        this.logger = null;
        this.syncService = null;
        this.deviceManager = null;
    }

    /**
     * Initialize the application
     * @returns {Promise<void>}
     */
    async initialize() {
        try {
            // Load configuration
            this.config = new Config();
            console.log('Configuration loaded successfully');

            // Initialize logger
            const appConfig = this.config.getAppConfig();
            this.logger = new Logger(appConfig.logLevel);
            this.logger.info('Logger initialized');

            // Create database adapter
            const databaseConfig = this.config.getDatabaseConfig();
            const databaseAdapter = DatabaseAdapterFactory.create('firebird', databaseConfig, this.logger);
            this.logger.info('Database adapter created');

            // Create and configure biometric device manager
            this.deviceManager = new BiometricDeviceManager(this.logger);
            const deviceConfigs = this.config.getBiometricDevices();
            
            if (deviceConfigs.length === 0) {
                throw new Error('No biometric devices configured');
            }
            
            this.deviceManager.registerDevices(deviceConfigs);
            this.logger.info(`Registered ${deviceConfigs.length} biometric device(s)`);

            // Create sync service
            this.syncService = new BiometricSyncService(this.deviceManager, databaseAdapter, this.logger);
            this.logger.info('Sync service initialized');

            this.logger.info('Application initialized successfully');

        } catch (error) {
            console.error('Failed to initialize application:', error);
            throw error;
        }
    }

    /**
     * Run the synchronization for yesterday's data
     * @returns {Promise<Object>} Sync statistics
     */
    async runYesterdaySync() {
        try {
            this.logger.info('Starting yesterday sync process');

            const { fromDate, toDate, dateString } = DateUtils.getYesterdayRange();
            this.logger.info(`Syncing data for date: ${dateString}`);

            const stats = await this.syncService.syncAttendanceData(fromDate, toDate);
            
            this.logger.info(`Sync completed successfully for ${dateString}`);
            this.logger.info(`Total records: ${stats.totalRecords}, Inserted: ${stats.insertedRecords}, Errors: ${stats.errors.length}`);
            
            if (stats.errors.length > 0) {
                this.logger.warn(`${stats.errors.length} errors occurred during sync:`);
                stats.errors.forEach((error, index) => {
                    this.logger.error(`Error ${index + 1}:`, error.error);
                });
            }

            return stats;

        } catch (error) {
            this.logger.error('Sync process failed:', error);
            throw error;
        }
    }

    /**
     * Run synchronization for a specific date
     * @param {Date|string} date - The date to sync
     * @returns {Promise<Object>} Sync statistics
     */
    async runDateSync(date) {
        try {
            const { fromDate, toDate, dateString } = DateUtils.getDateRange(date);
            this.logger.info(`Syncing data for date: ${dateString}`);

            const stats = await this.syncService.syncAttendanceData(fromDate, toDate);
            
            this.logger.info(`Sync completed successfully for ${dateString}`);
            this.logger.info(`Total records: ${stats.totalRecords}, Inserted: ${stats.insertedRecords}, Errors: ${stats.errors.length}`);

            return stats;

        } catch (error) {
            this.logger.error('Date sync process failed:', error);
            throw error;
        }
    }

    /**
     * Run synchronization for a specific date range
     * @param {Date|string} fromDate - Start date
     * @param {Date|string} toDate - End date
     * @param {Array|string} deviceIds - Optional specific device IDs to sync
     * @returns {Promise<Object>} Sync statistics
     */
    async runRangeSync(fromDate, toDate, deviceIds = null) {
        try {
            this.logger.info(`Syncing data from ${fromDate} to ${toDate}`);
            if (deviceIds) {
                this.logger.info(`Target devices: ${Array.isArray(deviceIds) ? deviceIds.join(', ') : deviceIds}`);
            }

            const stats = await this.syncService.syncAttendanceData(new Date(fromDate), new Date(toDate), deviceIds);
            
            this.logger.info('Range sync completed successfully');
            this.logger.info(`Total records: ${stats.totalRecords}, Inserted: ${stats.insertedRecords}, Errors: ${stats.errors.length}`);

            return stats;

        } catch (error) {
            this.logger.error('Range sync process failed:', error);
            throw error;
        }
    }

    /**
     * Sync specific devices for yesterday's data
     * @param {Array|string} deviceIds - Device IDs to sync
     * @returns {Promise<Object>} Sync statistics
     */
    async runDeviceSync(deviceIds) {
        try {
            const { fromDate, toDate, dateString } = DateUtils.getYesterdayRange();
            this.logger.info(`Syncing devices [${Array.isArray(deviceIds) ? deviceIds.join(', ') : deviceIds}] for date: ${dateString}`);

            const stats = await this.syncService.syncAttendanceData(fromDate, toDate, deviceIds);
            
            this.logger.info(`Device sync completed successfully for ${dateString}`);
            this.logger.info(`Total records: ${stats.totalRecords}, Inserted: ${stats.insertedRecords}, Errors: ${stats.errors.length}`);

            return stats;

        } catch (error) {
            this.logger.error('Device sync process failed:', error);
            throw error;
        }
    }

    /**
     * Test connections to all or specific devices
     * @param {Array|string} deviceIds - Optional specific device IDs to test
     * @returns {Promise<Array>} Connection test results
     */
    async testDeviceConnections(deviceIds = null) {
        try {
            if (deviceIds) {
                const idsArray = Array.isArray(deviceIds) ? deviceIds : [deviceIds];
                const results = [];
                for (const deviceId of idsArray) {
                    results.push(await this.deviceManager.testDeviceConnection(deviceId));
                }
                return results;
            } else {
                return await this.deviceManager.testAllConnections();
            }
        } catch (error) {
            this.logger.error('Device connection test failed:', error);
            throw error;
        }
    }

    /**
     * Get status of all devices
     * @returns {Promise<Array>} Device status array
     */
    async getDevicesStatus() {
        try {
            return await this.deviceManager.getDevicesStatus();
        } catch (error) {
            this.logger.error('Failed to get devices status:', error);
            throw error;
        }
    }

    /**
     * Get list of registered devices
     * @returns {Array} Array of device configurations
     */
    getRegisteredDevices() {
        return this.deviceManager ? this.deviceManager.getDeviceConfigs() : [];
    }

    /**
     * Get application status and configuration
     * @returns {Object} Application status
     */
    getStatus() {
        return {
            initialized: !!this.syncService,
            config: this.config ? this.config.getAll() : null,
            devices: this.getRegisteredDevices(),
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Cleanup and disconnect all resources
     * @returns {Promise<void>}
     */
    async cleanup() {
        try {
            if (this.deviceManager) {
                await this.deviceManager.disconnectAll();
                this.logger.info('Disconnected all devices');
            }
        } catch (error) {
            this.logger.error('Error during cleanup:', error);
        }
    }
}

module.exports = BiometricUpdaterApp;
