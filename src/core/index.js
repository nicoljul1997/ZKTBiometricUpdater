// Core exports
const BiometricSyncService = require('./services/BiometricSyncService');
const IDatabaseAdapter = require('./interfaces/IDatabaseAdapter');
const IBiometricDevice = require('./interfaces/IBiometricDevice');
const DateUtils = require('./utils/DateUtils');
const Logger = require('./utils/Logger');

module.exports = {
    services: {
        BiometricSyncService
    },
    interfaces: {
        IDatabaseAdapter,
        IBiometricDevice
    },
    utils: {
        DateUtils,
        Logger
    }
};
