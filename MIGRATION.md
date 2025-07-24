# Migration Guide: v1.0 to v2.0

## Overview

This guide helps you migrate from the monolithic `bioupdater.js` script to the new modular architecture.

## Key Changes

### 1. File Structure
**Before (v1.0):**
```
bioupdater.js          # Everything in one file
package.json
README.md
```

**After (v2.0):**
```
src/
├── core/              # Core business logic
├── features/          # Database & device adapters
├── config/            # Configuration management
└── BiometricUpdaterApp.js
index.js              # New main entry point
scripts/              # Utility scripts
examples/             # Usage examples
```

### 2. Environment Variables
The environment variables remain the same, but are now validated on startup:
- `BIOMETRIC_DEVICE_*` - Device configuration
- `FIREBIRD_*` - Database configuration
- `LOG_LEVEL` - New logging configuration
- `NODE_ENV` - New environment setting

### 3. Usage Changes

**Before (v1.0):**
```bash
node bioupdater.js
```

**After (v2.0):**
```bash
# Default yesterday sync
npm start
# or
node index.js

# Additional sync options
npm run sync:date 2024-01-15
npm run sync:range 2024-01-01 2024-01-31
```

## Benefits of v2.0

1. **Modularity**: Easy to add new database types or biometric devices
2. **Testability**: Each component can be tested independently
3. **Maintainability**: Clear separation of concerns
4. **Extensibility**: Factory pattern allows easy extension
5. **Error Handling**: Better error reporting and logging
6. **Configuration**: Centralized and validated configuration

## Extending the System

### Adding a New Database Adapter

1. Create a new adapter class extending `IDatabaseAdapter`
2. Implement all required methods
3. Add to `DatabaseAdapterFactory`

Example:
```javascript
const IDatabaseAdapter = require('../../core/interfaces/IDatabaseAdapter');

class MySQLAdapter extends IDatabaseAdapter {
    // Implement all methods...
}

// Add to factory
case 'mysql':
    return new MySQLAdapter(config, logger);
```

### Adding a New Biometric Device

1. Create a new adapter class extending `IBiometricDevice`
2. Implement all required methods
3. Add to `BiometricDeviceFactory`

Example:
```javascript
const IBiometricDevice = require('../../core/interfaces/IBiometricDevice');

class HikvisionAdapter extends IBiometricDevice {
    // Implement all methods...
}

// Add to factory
case 'hikvision':
    return new HikvisionAdapter(config, logger);
```

## Backward Compatibility

The original `bioupdater.js` file is preserved but should be considered deprecated. The new system provides the same functionality with better architecture and additional features.
