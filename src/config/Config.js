require('dotenv').config({ quiet: true });
const fs = require('fs');
const path = require('path');

/**
 * Configuration management class
 * Centralizes all configuration loading and validation
 * Uses devices.json for device configuration
 */
class Config {
    constructor(configFilePath = null) {
        this.configFilePath = configFilePath || this.getDevicesConfigPath();
        this.validateEnvironment();
        this.loadConfiguration();
    }

    /**
     * Get the devices.json configuration file path
     * @returns {string} Path to devices.json file
     */
    getDevicesConfigPath() {
        return process.env.CONFIG_FILE_PATH || path.join(process.cwd(), 'devices.json');
    }

    /**
     * Validate that all required environment variables are present
     * Now more flexible to support devices.json file approach
     */
    validateEnvironment() {
        // Only require database config from environment variables
        const requiredDbVars = [
            'FIREBIRD_HOST',
            'FIREBIRD_DATABASE_PATH',
            'FIREBIRD_USER',
            'FIREBIRD_PASSWORD'
        ];

        const missing = requiredDbVars.filter(varName => !process.env[varName]);
        
        if (missing.length > 0) {
            throw new Error(`Missing required database environment variables: ${missing.join(', ')}`);
        }

        // Check if we have either devices.json file or environment variables for devices
        if (!fs.existsSync(this.configFilePath) && !process.env.BIOMETRIC_DEVICE_IP && !process.env.BIOMETRIC_DEVICES && !process.env.BIOMETRIC_DEVICE_1_IP) {
            throw new Error(`No biometric device configuration found. Please create ${this.configFilePath} or set environment variables.`);
        }
    }

    /**
     * Load all configuration from environment variables and config files
     */
    loadConfiguration() {
        // Load device configurations
        this.biometric = {
            devices: this.loadDeviceConfigurations()
        };

        this.database = {
            host: process.env.FIREBIRD_HOST,
            port: parseInt(process.env.FIREBIRD_PORT) || 3050,
            database: process.env.FIREBIRD_DATABASE_PATH,
            user: process.env.FIREBIRD_USER,
            password: process.env.FIREBIRD_PASSWORD,
            encoding: process.env.FIREBIRD_ENCODING || 'UTF8'
        };

        this.app = {
            logLevel: process.env.LOG_LEVEL || 'info',
            environment: process.env.NODE_ENV || 'development',
            configSource: fs.existsSync(this.configFilePath) ? 'devices.json' : 'environment'
        };
    }

    /**
     * Load device configurations from devices.json file or environment variables
     * @returns {Array} Array of device configurations
     */
    loadDeviceConfigurations() {
        try {
            // Priority 1: Load from devices.json file
            if (fs.existsSync(this.configFilePath)) {
                console.log(`Loading device configuration from: ${this.configFilePath}`);
                return this.loadDevicesFromFile();
            }

            // Priority 2: Load from environment variables (fallback)
            console.log('devices.json not found, loading device configuration from environment variables');
            return this.loadDevicesFromEnvironment();

        } catch (error) {
            console.error('Error loading device configurations:', error.message);
            throw new Error(`Failed to load device configurations: ${error.message}`);
        }
    }

    /**
     * Load devices from devices.json configuration file
     * @returns {Array} Array of device configurations
     */
    loadDevicesFromFile() {
        try {
            const configContent = fs.readFileSync(this.configFilePath, 'utf8');
            const config = JSON.parse(configContent);

            // Validate config structure
            if (!config.devices || !Array.isArray(config.devices)) {
                throw new Error('devices.json file must contain a "devices" array');
            }

            // Validate each device configuration
            const validatedDevices = config.devices.map((device, index) => {
                if (!device.id) {
                    throw new Error(`Device at index ${index} is missing required "id" field`);
                }
                if (!device.ip) {
                    throw new Error(`Device "${device.id}" is missing required "ip" field`);
                }

                return {
                    id: device.id,
                    ip: device.ip,
                    name: device.name || device.id,
                    model: device.model || 'Unknown',
                    port: parseInt(device.port) || 4370,
                    parser: device.parser || device.pharser || 'v6.60', // Support both spellings
                    protocol: device.protocol || 'udp',
                    inport: parseInt(device.inport) || 5200,
                    timeout: parseInt(device.timeout) || 5000,
                    type: device.type || 'zkteco',
                    enabled: device.enabled !== false // Default to true unless explicitly false
                };
            });

            // Filter out disabled devices
            const enabledDevices = validatedDevices.filter(device => device.enabled);
            console.log(`Loaded ${enabledDevices.length} enabled devices from devices.json`);

            return enabledDevices;

        } catch (error) {
            if (error.code === 'ENOENT') {
                throw new Error(`devices.json file not found: ${this.configFilePath}`);
            } else if (error instanceof SyntaxError) {
                throw new Error(`Invalid JSON in devices.json file: ${error.message}`);
            }
            throw error;
        }
    }

    /**
     * Load devices from environment variables (fallback)
     * @returns {Array} Array of device configurations
     */
    loadDevicesFromEnvironment() {
        try {
            // Try to load from BIOMETRIC_DEVICES JSON string
            if (process.env.BIOMETRIC_DEVICES) {
                const devices = JSON.parse(process.env.BIOMETRIC_DEVICES);
                return Array.isArray(devices) ? devices : [devices];
            }

            // Try to load from individual device environment variables
            const devices = [];
            let deviceIndex = 1;
            
            while (process.env[`BIOMETRIC_DEVICE_${deviceIndex}_IP`]) {
                devices.push({
                    id: process.env[`BIOMETRIC_DEVICE_${deviceIndex}_ID`] || `device_${deviceIndex}`,
                    ip: process.env[`BIOMETRIC_DEVICE_${deviceIndex}_IP`],
                    name: process.env[`BIOMETRIC_DEVICE_${deviceIndex}_NAME`] || `Device ${deviceIndex}`,
                    model: process.env[`BIOMETRIC_DEVICE_${deviceIndex}_MODEL`] || 'Unknown',
                    port: parseInt(process.env[`BIOMETRIC_DEVICE_${deviceIndex}_PORT`]) || 4370,
                    parser: process.env[`BIOMETRIC_DEVICE_${deviceIndex}_PHARSER`] || 'v6.60',
                    protocol: process.env[`BIOMETRIC_DEVICE_${deviceIndex}_PROTOCOL`] || 'udp',
                    inport: parseInt(process.env[`BIOMETRIC_DEVICE_${deviceIndex}_INPORT`]) || 5200,
                    timeout: parseInt(process.env[`BIOMETRIC_DEVICE_${deviceIndex}_TIMEOUT`]) || 5000,
                    type: process.env[`BIOMETRIC_DEVICE_${deviceIndex}_TYPE`] || 'zkteco'
                });
                deviceIndex++;
            }

            // Try single device configuration (backward compatibility)
            if (devices.length === 0 && process.env.BIOMETRIC_DEVICE_IP) {
                devices.push({
                    id: process.env.BIOMETRIC_DEVICE_ID || 'device_1',
                    ip: process.env.BIOMETRIC_DEVICE_IP,
                    name: process.env.BIOMETRIC_DEVICE_NAME || 'Default Device',
                    model: process.env.BIOMETRIC_DEVICE_MODEL || 'Unknown',
                    port: parseInt(process.env.BIOMETRIC_DEVICE_PORT) || 4370,
                    parser: process.env.BIOMETRIC_DEVICE_PHARSER || 'v6.60',
                    protocol: process.env.BIOMETRIC_DEVICE_PROTOCOL || 'udp',
                    inport: parseInt(process.env.BIOMETRIC_DEVICE_INPORT) || 5200,
                    timeout: parseInt(process.env.BIOMETRIC_DEVICE_TIMEOUT) || 5000,
                    type: process.env.BIOMETRIC_DEVICE_TYPE || 'zkteco'
                });
            }

            return devices;

        } catch (error) {
            console.warn('Error parsing devices from environment variables:', error.message);
            return [];
        }
    }

    /**
     * Get all biometric devices configuration
     * @returns {Array} Array of device configurations
     */
    getBiometricDevices() {
        return [...this.biometric.devices];
    }

    /**
     * Get a specific biometric device configuration by ID
     * @param {string} deviceId - Device ID
     * @returns {Object|null} Device configuration or null if not found
     */
    getBiometricDevice(deviceId) {
        return this.biometric.devices.find(device => device.id === deviceId) || null;
    }

    /**
     * Get database configuration
     * @returns {Object} Database config
     */
    getDatabaseConfig() {
        return { ...this.database };
    }

    /**
     * Get application configuration
     * @returns {Object} Application config
     */
    getAppConfig() {
        return { ...this.app };
    }

    /**
     * Get full configuration object
     * @returns {Object} Complete configuration
     */
    getAll() {
        return {
            biometric: {
                devices: this.getBiometricDevices()
            },
            database: this.getDatabaseConfig(),
            app: this.getAppConfig()
        };
    }

    /**
     * Get configuration source information
     * @returns {Object} Information about configuration sources
     */
    getConfigInfo() {
        return {
            devicesJsonPath: this.configFilePath,
            source: this.app.configSource,
            deviceCount: this.biometric.devices.length,
            hasDevicesJson: fs.existsSync(this.configFilePath)
        };
    }
}

module.exports = Config;
