const BiometricDeviceFactory = require('./BiometricDeviceFactory');

/**
 * Manages multiple biometric devices
 * Provides factory pattern for creating and managing device adapters
 */
class BiometricDeviceManager {
    constructor(logger = console) {
        this.logger = logger;
        this.devices = new Map(); // deviceId -> adapter instance
        this.deviceConfigs = new Map(); // deviceId -> device config
    }

    /**
     * Register a device configuration
     * @param {Object} deviceConfig - Device configuration
     * @returns {void}
     */
    registerDevice(deviceConfig) {
        if (!deviceConfig.id) {
            throw new Error('Device configuration must have an ID');
        }

        this.deviceConfigs.set(deviceConfig.id, deviceConfig);
        this.logger.debug(`Registered device: ${deviceConfig.id} (${deviceConfig.name})`);
    }

    /**
     * Register multiple device configurations
     * @param {Array} deviceConfigs - Array of device configurations
     * @returns {void}
     */
    registerDevices(deviceConfigs) {
        deviceConfigs.forEach(config => this.registerDevice(config));
        this.logger.info(`Registered ${deviceConfigs.length} biometric devices`);
    }

    /**
     * Get a device adapter instance (creates if not exists)
     * @param {string} deviceId - Device ID
     * @returns {IBiometricDevice} Device adapter instance
     */
    getDevice(deviceId) {
        // Return existing instance if available
        if (this.devices.has(deviceId)) {
            return this.devices.get(deviceId);
        }

        // Get device configuration
        const config = this.deviceConfigs.get(deviceId);
        if (!config) {
            throw new Error(`Device configuration not found for ID: ${deviceId}`);
        }

        // Create new device adapter
        const deviceType = config.type || BiometricDeviceFactory.autoDetectType(config);
        const adapter = BiometricDeviceFactory.create(deviceType, config, this.logger);
        
        // Cache the adapter
        this.devices.set(deviceId, adapter);
        this.logger.debug(`Created device adapter for: ${deviceId}`);

        return adapter;
    }

    /**
     * Get all device adapter instances
     * @returns {Array} Array of device adapter instances
     */
    getAllDevices() {
        const devices = [];
        for (const deviceId of this.deviceConfigs.keys()) {
            devices.push(this.getDevice(deviceId));
        }
        return devices;
    }

    /**
     * Get device configurations
     * @returns {Array} Array of device configurations
     */
    getDeviceConfigs() {
        return Array.from(this.deviceConfigs.values());
    }

    /**
     * Get registered device IDs
     * @returns {Array} Array of device IDs
     */
    getDeviceIds() {
        return Array.from(this.deviceConfigs.keys());
    }

    /**
     * Check if a device is registered
     * @param {string} deviceId - Device ID
     * @returns {boolean} True if device is registered
     */
    hasDevice(deviceId) {
        return this.deviceConfigs.has(deviceId);
    }

    /**
     * Remove a device and its adapter
     * @param {string} deviceId - Device ID
     * @returns {boolean} True if device was removed
     */
    removeDevice(deviceId) {
        const removed = this.deviceConfigs.delete(deviceId);
        if (this.devices.has(deviceId)) {
            // Disconnect the device if it was connected
            const adapter = this.devices.get(deviceId);
            adapter.disconnect().catch(err => {
                this.logger.error(`Error disconnecting device ${deviceId}:`, err);
            });
            this.devices.delete(deviceId);
        }
        
        if (removed) {
            this.logger.debug(`Removed device: ${deviceId}`);
        }
        
        return removed;
    }

    /**
     * Disconnect all devices
     * @returns {Promise<void>}
     */
    async disconnectAll() {
        const disconnectPromises = [];
        
        for (const [deviceId, adapter] of this.devices.entries()) {
            disconnectPromises.push(
                adapter.disconnect().catch(err => {
                    this.logger.error(`Error disconnecting device ${deviceId}:`, err);
                })
            );
        }

        await Promise.all(disconnectPromises);
        this.devices.clear();
        this.logger.info('Disconnected all biometric devices');
    }

    /**
     * Get device status for all registered devices
     * @returns {Promise<Array>} Array of device status objects
     */
    async getDevicesStatus() {
        const statusPromises = [];
        
        for (const deviceId of this.deviceConfigs.keys()) {
            statusPromises.push(
                this.getDeviceStatus(deviceId).catch(err => ({
                    deviceId,
                    error: err.message,
                    status: 'error'
                }))
            );
        }

        return Promise.all(statusPromises);
    }

    /**
     * Get status for a specific device
     * @param {string} deviceId - Device ID
     * @returns {Promise<Object>} Device status object
     */
    async getDeviceStatus(deviceId) {
        try {
            const adapter = this.getDevice(deviceId);
            const config = this.deviceConfigs.get(deviceId);
            const deviceInfo = await adapter.getDeviceInfo();
            
            return {
                deviceId,
                name: config.name,
                ip: config.ip,
                type: config.type,
                status: 'available',
                info: deviceInfo
            };
        } catch (error) {
            return {
                deviceId,
                status: 'error',
                error: error.message
            };
        }
    }

    /**
     * Test connection to all devices
     * @returns {Promise<Array>} Array of connection test results
     */
    async testAllConnections() {
        const testPromises = [];
        
        for (const deviceId of this.deviceConfigs.keys()) {
            testPromises.push(this.testDeviceConnection(deviceId));
        }

        return Promise.all(testPromises);
    }

    /**
     * Test connection to a specific device
     * @param {string} deviceId - Device ID
     * @returns {Promise<Object>} Connection test result
     */
    async testDeviceConnection(deviceId) {
        try {
            const adapter = this.getDevice(deviceId);
            const config = this.deviceConfigs.get(deviceId);
            
            await adapter.connect();
            const deviceInfo = await adapter.getDeviceInfo();
            await adapter.disconnect();
            
            return {
                deviceId,
                name: config.name,
                success: true,
                info: deviceInfo
            };
        } catch (error) {
            return {
                deviceId,
                success: false,
                error: error.message
            };
        }
    }
}

module.exports = BiometricDeviceManager;
