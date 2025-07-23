#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Script to validate device configuration files
 * Usage: node scripts/validate-config.js [config-file-path]
 */

function validateDevice(device, index) {
    const errors = [];
    const warnings = [];

    // Required fields
    if (!device.id) {
        errors.push(`Device ${index}: Missing required field "id"`);
    } else if (typeof device.id !== 'string') {
        errors.push(`Device ${index}: Field "id" must be a string`);
    }

    if (!device.ip) {
        errors.push(`Device ${index}: Missing required field "ip"`);
    } else if (!/^(\d{1,3}\.){3}\d{1,3}$/.test(device.ip)) {
        warnings.push(`Device ${index} (${device.id}): IP address format may be invalid`);
    }

    // Optional fields with validation
    if (device.port && (!Number.isInteger(device.port) || device.port < 1 || device.port > 65535)) {
        errors.push(`Device ${index} (${device.id}): Port must be an integer between 1 and 65535`);
    }

    if (device.timeout && (!Number.isInteger(device.timeout) || device.timeout < 1000)) {
        warnings.push(`Device ${index} (${device.id}): Timeout should be at least 1000ms`);
    }

    if (device.type && !['zkteco', 'zklib', 'hikvision', 'suprema'].includes(device.type.toLowerCase())) {
        warnings.push(`Device ${index} (${device.id}): Unknown device type "${device.type}"`);
    }

    if (device.protocol && !['udp', 'tcp'].includes(device.protocol.toLowerCase())) {
        warnings.push(`Device ${index} (${device.id}): Unknown protocol "${device.protocol}"`);
    }

    return { errors, warnings };
}

function validateConfig(config) {
    const result = {
        valid: true,
        errors: [],
        warnings: [],
        devices: {
            total: 0,
            enabled: 0,
            disabled: 0
        }
    };

    // Check root structure
    if (!config || typeof config !== 'object') {
        result.errors.push('Config must be a valid JSON object');
        result.valid = false;
        return result;
    }

    if (!config.devices) {
        result.errors.push('Config must contain a "devices" array');
        result.valid = false;
        return result;
    }

    if (!Array.isArray(config.devices)) {
        result.errors.push('Field "devices" must be an array');
        result.valid = false;
        return result;
    }

    if (config.devices.length === 0) {
        result.warnings.push('No devices defined in configuration');
    }

    // Check for duplicate device IDs
    const deviceIds = new Set();
    const duplicateIds = new Set();

    config.devices.forEach((device, index) => {
        if (device.id) {
            if (deviceIds.has(device.id)) {
                duplicateIds.add(device.id);
            }
            deviceIds.add(device.id);
        }
    });

    duplicateIds.forEach(id => {
        result.errors.push(`Duplicate device ID found: "${id}"`);
    });

    // Validate each device
    config.devices.forEach((device, index) => {
        result.devices.total++;
        
        if (device.enabled !== false) {
            result.devices.enabled++;
        } else {
            result.devices.disabled++;
        }

        const deviceValidation = validateDevice(device, index + 1);
        result.errors.push(...deviceValidation.errors);
        result.warnings.push(...deviceValidation.warnings);
    });

    if (result.errors.length > 0) {
        result.valid = false;
    }

    return result;
}

async function main() {
    const args = process.argv.slice(2);
    
    if (args.length === 0) {
        console.error('Usage: node scripts/validate-config.js <config-file-path>');
        console.error('');
        console.error('Examples:');
        console.error('  node scripts/validate-config.js config.json');
        console.error('  node scripts/validate-config.js config/devices.json');
        process.exit(1);
    }

    const configPath = path.resolve(args[0]);

    try {
        // Check if file exists
        if (!fs.existsSync(configPath)) {
            console.error(`❌ Config file not found: ${configPath}`);
            process.exit(1);
        }

        // Read and parse config file
        console.log(`📁 Validating config file: ${configPath}`);
        console.log('');

        const configContent = fs.readFileSync(configPath, 'utf8');
        let config;

        try {
            config = JSON.parse(configContent);
        } catch (parseError) {
            console.error(`❌ Invalid JSON format: ${parseError.message}`);
            process.exit(1);
        }

        // Validate configuration
        const validation = validateConfig(config);

        // Display results
        console.log('📊 Validation Results:');
        console.log('='.repeat(50));
        console.log(`Status: ${validation.valid ? '✅ VALID' : '❌ INVALID'}`);
        console.log(`Total devices: ${validation.devices.total}`);
        console.log(`Enabled devices: ${validation.devices.enabled}`);
        console.log(`Disabled devices: ${validation.devices.disabled}`);
        console.log('');

        // Show errors
        if (validation.errors.length > 0) {
            console.log('❌ Errors:');
            validation.errors.forEach((error, index) => {
                console.log(`  ${index + 1}. ${error}`);
            });
            console.log('');
        }

        // Show warnings
        if (validation.warnings.length > 0) {
            console.log('⚠️  Warnings:');
            validation.warnings.forEach((warning, index) => {
                console.log(`  ${index + 1}. ${warning}`);
            });
            console.log('');
        }

        // Show device summary
        if (config.devices && config.devices.length > 0) {
            console.log('📋 Device Summary:');
            config.devices.forEach((device, index) => {
                const status = device.enabled !== false ? '✅' : '❌';
                const id = device.id || 'NO_ID';
                const name = device.name || 'No Name';
                const ip = device.ip || 'No IP';
                console.log(`  ${index + 1}. ${status} ${id} (${name}) - ${ip}`);
            });
            console.log('');
        }

        if (validation.valid) {
            console.log('✅ Configuration file is valid and ready to use!');
            process.exit(0);
        } else {
            console.log('❌ Configuration file has errors and needs to be fixed.');
            process.exit(1);
        }

    } catch (error) {
        console.error(`❌ Error validating config file: ${error.message}`);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}
