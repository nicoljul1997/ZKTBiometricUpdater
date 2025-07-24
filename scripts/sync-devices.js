#!/usr/bin/env node

const BiometricUpdaterApp = require('../src/BiometricUpdaterApp');

/**
 * Script to sync attendance data for specific devices
 * Usage: node scripts/sync-devices.js [device1,device2,...]
 */
async function main() {
    const args = process.argv.slice(2);
    
    if (args.length === 0) {
        console.error('Usage: node scripts/sync-devices.js <device-ids>');
        console.error('Example: node scripts/sync-devices.js device1,device2');
        console.error('Example: node scripts/sync-devices.js device1');
        process.exit(1);
    }

    const deviceIds = args[0].split(',').map(id => id.trim());

    const app = new BiometricUpdaterApp();
    
    try {
        await app.initialize();
        console.log(`Syncing devices: ${deviceIds.join(', ')}`);

        // Show registered devices
        const registeredDevices = app.getRegisteredDevices();
        console.log('\nRegistered devices:');
        registeredDevices.forEach(device => {
            console.log(`  - ${device.id}: ${device.name} (${device.ip})`);
        });

        // Validate device IDs
        const validDeviceIds = deviceIds.filter(id => 
            registeredDevices.some(device => device.id === id)
        );
        
        const invalidDeviceIds = deviceIds.filter(id => 
            !registeredDevices.some(device => device.id === id)
        );

        if (invalidDeviceIds.length > 0) {
            console.error(`\nInvalid device IDs: ${invalidDeviceIds.join(', ')}`);
            process.exit(1);
        }

        const stats = await app.runDeviceSync(validDeviceIds);
        
        console.log('\n=== Sync Summary ===');
        console.log(`Devices synced: ${validDeviceIds.join(', ')}`);
        console.log(`Total records processed: ${stats.totalRecords}`);
        console.log(`Successfully inserted: ${stats.insertedRecords}`);
        console.log(`Errors: ${stats.errors.length}`);
        console.log(`Duration: ${stats.endTime - stats.startTime}ms`);

        // Show per-device statistics if available
        if (stats.deviceStats) {
            console.log('\n=== Per-Device Stats ===');
            Object.entries(stats.deviceStats).forEach(([deviceId, deviceStats]) => {
                console.log(`${deviceId}: ${deviceStats.insertedRecords}/${deviceStats.totalRecords} records (${deviceStats.errors.length} errors)`);
            });
        }
        
        if (stats.errors.length > 0) {
            console.log('\n=== Errors ===');
            stats.errors.forEach((error, index) => {
                console.log(`${index + 1}. ${error.error} ${error.deviceId ? `(Device: ${error.deviceId})` : ''}`);
            });
            process.exit(1);
        }

        console.log('Device sync completed successfully');
        process.exit(0);

    } catch (error) {
        console.error('Device sync failed:', error.message);
        process.exit(1);
    } finally {
        await app.cleanup();
    }
}

if (require.main === module) {
    main();
}
