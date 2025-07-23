#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Script to generate device configuration files
 * Usage: node scripts/generate-config.js [config-type]
 */

function generateSingleDeviceConfig() {
    return {
        devices: [
            {
                id: "main_device",
                name: "Main Office Device",
                ip: "192.168.1.100",
                port: 4370,
                model: "ZK-U160",
                type: "zkteco",
                parser: "v6.60",
                protocol: "udp",
                inport: 5200,
                timeout: 5000,
                enabled: true
            }
        ]
    };
}

function generateMultiDeviceConfig() {
    return {
        devices: [
            {
                id: "main_office",
                name: "Main Office Device",
                ip: "192.168.1.100",
                port: 4370,
                model: "ZK-U160",
                type: "zkteco",
                parser: "v6.60",
                protocol: "udp",
                inport: 5200,
                timeout: 5000,
                enabled: true
            },
            {
                id: "branch_office",
                name: "Branch Office Device",
                ip: "192.168.1.101",
                port: 4370,
                model: "ZK-F19",
                type: "zkteco",
                parser: "v6.60",
                protocol: "udp",
                inport: 5200,
                timeout: 5000,
                enabled: true
            },
            {
                id: "warehouse",
                name: "Warehouse Device",
                ip: "192.168.1.102",
                port: 4370,
                model: "ZK-MA300",
                type: "zkteco",
                parser: "v6.60",
                protocol: "udp",
                inport: 5200,
                timeout: 8000,
                enabled: false,
                notes: "Device temporarily disabled for maintenance"
            },
            {
                id: "reception",
                name: "Reception Device",
                ip: "192.168.1.103",
                port: 4370,
                model: "ZK-F22",
                type: "zkteco",
                parser: "v6.60",
                protocol: "udp",
                inport: 5200,
                timeout: 5000,
                enabled: true
            }
        ]
    };
}

function generateTemplateConfig() {
    return {
        devices: [
            {
                id: "device_id_here",
                name: "Device Name Here", 
                ip: "192.168.1.XXX",
                port: 4370,
                model: "Device Model",
                type: "zkteco",
                parser: "v6.60",
                protocol: "udp",
                inport: 5200,
                timeout: 5000,
                enabled: true,
                notes: "Optional notes about this device"
            }
        ]
    };
}

async function main() {
    const args = process.argv.slice(2);
    const configType = args[0] || 'single';
    
    let config;
    let filename = 'devices.json';

    switch (configType.toLowerCase()) {
        case 'single':
            config = generateSingleDeviceConfig();
            break;
        case 'multi':
        case 'multiple':
            config = generateMultiDeviceConfig();
            break;
        case 'template':
            config = generateTemplateConfig();
            filename = 'devices-template.json';
            break;
        default:
            console.error('Usage: node scripts/generate-config.js [single|multi|template]');
            console.error('');
            console.error('Examples:');
            console.error('  node scripts/generate-config.js single    # Generate single device config');
            console.error('  node scripts/generate-config.js multi     # Generate multi-device config');
            console.error('  node scripts/generate-config.js template  # Generate template config');
            process.exit(1);
    }

    try {
        const configPath = path.join(process.cwd(), filename);
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
        
        console.log(`✅ Generated ${configType} device configuration:`);
        console.log(`📁 File: ${configPath}`);
        console.log(`📊 Devices: ${config.devices.length}`);
        console.log('');
        console.log('Device summary:');
        config.devices.forEach((device, index) => {
            const status = device.enabled !== false ? '✅ Enabled' : '❌ Disabled';
            console.log(`  ${index + 1}. ${device.id} (${device.name}) - ${device.ip} ${status}`);
        });
        
        console.log('');
        console.log('📝 To use this configuration:');
        if (configType === 'template') {
            console.log(`   1. Rename ${filename} to devices.json`);
        } else {
            console.log(`   1. The file is ready to use as devices.json`);
        }
        console.log('   2. Update the IP addresses and device settings as needed');
        console.log('   3. Set CONFIG_FILE_PATH environment variable if you want to use a different location');
        console.log('');
        console.log('💡 devices.json takes precedence over environment variables');

    } catch (error) {
        console.error('❌ Error generating config file:', error.message);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}
