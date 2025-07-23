#!/usr/bin/env node

const BiometricUpdaterApp = require('../src/BiometricUpdaterApp');

/**
 * Script to sync attendance data for a specific date
 * Usage: node scripts/sync-date.js [YYYY-MM-DD]
 */
async function main() {
    const args = process.argv.slice(2);
    
    if (args.length === 0) {
        console.error('Usage: node scripts/sync-date.js <YYYY-MM-DD>');
        console.error('Example: node scripts/sync-date.js 2024-01-15');
        process.exit(1);
    }

    const targetDate = args[0];
    
    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(targetDate)) {
        console.error('Invalid date format. Please use YYYY-MM-DD format.');
        process.exit(1);
    }

    const app = new BiometricUpdaterApp();
    
    try {
        await app.initialize();
        console.log(`Syncing attendance data for date: ${targetDate}`);

        const stats = await app.runDateSync(targetDate);
        
        console.log('=== Sync Summary ===');
        console.log(`Date: ${targetDate}`);
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
        console.error('Sync failed:', error.message);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}
