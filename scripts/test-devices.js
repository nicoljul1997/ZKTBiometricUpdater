#!/usr/bin/env node

const BiometricUpdaterApp = require('../src/BiometricUpdaterApp');

/**
 * Script to test connections to biometric devices
 * Usage: node scripts/test-devices.js [device1,device2,...]
 */
async function main() {
    const args = process.argv.slice(2);
    let deviceIds = null;

    if (args.length > 0) {
        deviceIds = args[0].split(',').map(id => id.trim());
    }

    const app = new BiometricUpdaterApp();
    
    try {
        await app.initialize();
        
        console.log('=== Biometric Device Connection Test ===\n');

        // Show registered devices
        const registeredDevices = app.getRegisteredDevices();
        console.log('Registered devices:');
        registeredDevices.forEach(device => {
            console.log(`  - ${device.id}: ${device.name} (${device.ip}:${device.port})`);
        });
        console.log('');

        // Test connections
        const testResults = await app.testDeviceConnections(deviceIds);
        
        console.log('=== Connection Test Results ===');
        let successCount = 0;
        let failureCount = 0;

        testResults.forEach(result => {
            const status = result.success ? '✅ SUCCESS' : '❌ FAILED';
            const config = registeredDevices.find(d => d.id === result.deviceId);
            
            console.log(`${status} ${result.deviceId} (${result.name || config?.name})`);
            
            if (result.success) {
                successCount++;
                if (result.info) {
                    console.log(`    IP: ${result.info.ip}, Model: ${result.info.model || 'Unknown'}`);
                }
            } else {
                failureCount++;
                console.log(`    Error: ${result.error}`);
            }
            console.log('');
        });

        console.log('=== Summary ===');
        console.log(`Total devices tested: ${testResults.length}`);
        console.log(`Successful connections: ${successCount}`);
        console.log(`Failed connections: ${failureCount}`);

        if (failureCount > 0) {
            console.log('\nSome devices failed to connect. Check network connectivity and device configurations.');
            process.exit(1);
        } else {
            console.log('\nAll devices connected successfully!');
            process.exit(0);
        }

    } catch (error) {
        console.error('Device test failed:', error.message);
        process.exit(1);
    } finally {
        await app.cleanup();
    }
}

if (require.main === module) {
    main();
}
