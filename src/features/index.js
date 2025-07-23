// Features exports
const DatabaseAdapterFactory = require('./database/DatabaseAdapterFactory');
const FirebirdAdapter = require('./database/FirebirdAdapter');
const BiometricDeviceFactory = require('./biometric/BiometricDeviceFactory');
const BiometricDeviceManager = require('./biometric/BiometricDeviceManager');
const ZKTecoAdapter = require('./biometric/ZKTecoAdapter');

module.exports = {
    database: {
        DatabaseAdapterFactory,
        FirebirdAdapter
    },
    biometric: {
        BiometricDeviceFactory,
        BiometricDeviceManager,
        ZKTecoAdapter
    }
};
