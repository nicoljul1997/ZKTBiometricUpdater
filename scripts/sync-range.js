#!/usr/bin/env node

const BiometricUpdaterApp = require('../src/BiometricUpdaterApp');

/**
 * Script to sync attendance data for a date range
 * Usage: node scripts/sync-range.js [YYYY-MM-DD] [YYYY-MM-DD]
 */
async function main() {
    const args = process.argv.slice(2);
    
    if (args.length !== 2) {
        console.error('Usage: node scripts/sync-range.js <from-date> <to-date>');
        console.error('Example: node scripts/sync-range.js 2024-01-01 2024-01-31');
        process.exit(1);
    }

    const [fromDate, toDate] = args;
    
    // Validate date formats
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(fromDate) || !dateRegex.test(toDate)) {
        console.error('Invalid date format. Please use YYYY-MM-DD format.');
        process.exit(1);
    }

    // Validate date range
    if (new Date(fromDate) > new Date(toDate)) {
        console.error('From date cannot be later than to date.');
        process.exit(1);
    }

    const app = new BiometricUpdaterApp();
    
    try {
        await app.initialize();
        console.log(`Syncing attendance data from ${fromDate} to ${toDate}`);

        const stats = await app.runRangeSync(fromDate, toDate);
        
        console.log('=== Sync Summary ===');
        console.log(`Date range: ${fromDate} to ${toDate}`);
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
