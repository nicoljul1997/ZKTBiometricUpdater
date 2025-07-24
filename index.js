#!/usr/bin/env node

const BiometricUpdaterApp = require('./src/BiometricUpdaterApp');

/**
 * Main entry point for the Biometric Updater application
 * This script runs the synchronization process for yesterday's attendance data
 */
async function main() {
    const app = new BiometricUpdaterApp();
    
    try {
        // Initialize the application
        await app.initialize();
        console.log('Application initialized successfully');

        // Run yesterday's sync
        const stats = await app.runYesterdaySync();
        
        console.log('=== Sync Summary ===');
        console.log(`Date: ${new Date(stats.startTime).toISOString().split('T')[0]}`);
        console.log(`Total records processed: ${stats.totalRecords}`);
        console.log(`Successfully inserted: ${stats.insertedRecords}`);
        console.log(`Errors: ${stats.errors.length}`);
        console.log(`Duration: ${stats.endTime - stats.startTime}ms`);
        
        if (stats.errors.length > 0) {
            console.log('\n=== Errors ===');
            stats.errors.forEach((error, index) => {
                console.log(`${index + 1}. ${error.error}`);
            });
            process.exit(1);
        }

        console.log('Sync completed successfully');
        process.exit(0);

    } catch (error) {
        console.error('Application failed:', error.message);
        console.error('Stack trace:', error.stack);
        process.exit(1);
    }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    process.exit(1);
});

// Run the application
if (require.main === module) {
    main();
}

module.exports = main;
