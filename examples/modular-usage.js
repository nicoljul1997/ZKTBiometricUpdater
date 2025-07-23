/**
 * Example: Using the modular components individually
 * This demonstrates how to use the refactored components with multi-device support
 */

const Config = require('../src/config/Config');
const Logger = require('../src/core/utils/Logger');
const DateUtils = require('../src/core/utils/DateUtils');
const { database, biometric } = require('../src/features');
const BiometricUpdaterApp = require('../src/BiometricUpdaterApp');

async function exampleUsage() {
    try {
        // 1. Load configuration
        console.log('=== Configuration Example ===');
        const config = new Config();
        console.log('Database config:', config.getDatabaseConfig());
        console.log('Biometric devices:', config.getBiometricDevices());
        console.log('Config info:', config.getConfigInfo());
        
        // 2. Logger example
        console.log('\n=== Logger Example ===');
        const logger = new Logger('debug');
        logger.info('This is an info message');
        logger.warn('This is a warning message');
        logger.debug('This is a debug message');
        
        // 3. Date utilities example
        console.log('\n=== Date Utils Example ===');
        const yesterday = DateUtils.getYesterdayRange();
        console.log('Yesterday range:', yesterday);
        
        const customDate = DateUtils.getDateRange('2024-01-15');
        console.log('Custom date range:', customDate);
        
        // 4. Factory pattern example
        console.log('\n=== Factory Pattern Example ===');
        
        // Database factory
        const dbAdapter = database.DatabaseAdapterFactory.create(
            'firebird', 
            config.getDatabaseConfig(), 
            logger
        );
        console.log('Database adapter created:', dbAdapter.constructor.name);
        
        // Biometric device manager example
        const deviceManager = new biometric.BiometricDeviceManager(logger);
        const deviceConfigs = config.getBiometricDevices();
        deviceManager.registerDevices(deviceConfigs);
        console.log('Device manager created with', deviceConfigs.length, 'devices');
        
        // 5. Check supported types
        console.log('\n=== Supported Types ===');
        console.log('Supported databases:', database.DatabaseAdapterFactory.getSupportedTypes());
        console.log('Supported devices:', biometric.BiometricDeviceFactory.getSupportedTypes());
        
        // 6. Multi-device application example
        console.log('\n=== Multi-Device Application Example ===');
        const app = new BiometricUpdaterApp();
        await app.initialize();
        
        const status = app.getStatus();
        console.log('App status:', {
            initialized: status.initialized,
            deviceCount: status.devices.length,
            devices: status.devices.map(d => ({ id: d.id, name: d.name, ip: d.ip }))
        });
        
        // Test device connections
        console.log('\n=== Device Connection Test ===');
        try {
            const testResults = await app.testDeviceConnections();
            console.log('Connection test results:');
            testResults.forEach(result => {
                console.log(`  ${result.deviceId}: ${result.success ? 'SUCCESS' : 'FAILED'}`);
                if (!result.success) {
                    console.log(`    Error: ${result.error}`);
                }
            });
        } catch (error) {
            console.log('Connection test failed:', error.message);
        }
        
        await app.cleanup();
        
        console.log('\n=== Example completed successfully ===');
        
    } catch (error) {
        console.error('Example failed:', error.message);
    }
}

// Run the example
if (require.main === module) {
    exampleUsage();
}

module.exports = exampleUsage;
