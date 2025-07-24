const FirebirdAdapter = require('./FirebirdAdapter');

/**
 * Database adapter factory
 * Creates database adapters based on configuration
 */
class DatabaseAdapterFactory {
    /**
     * Create a database adapter based on type
     * @param {string} type - Database type ('firebird', 'mysql', 'postgresql', etc.)
     * @param {Object} config - Database configuration
     * @param {Object} logger - Logger instance
     * @returns {IDatabaseAdapter} Database adapter instance
     */
    static create(type, config, logger) {
        switch (type.toLowerCase()) {
            case 'firebird':
                return new FirebirdAdapter(config, logger);
            
            // Future database adapters can be added here
            case 'mysql':
                throw new Error('MySQL adapter not implemented yet');
            
            case 'postgresql':
                throw new Error('PostgreSQL adapter not implemented yet');
            
            case 'sqlite':
                throw new Error('SQLite adapter not implemented yet');
            
            default:
                throw new Error(`Unsupported database type: ${type}`);
        }
    }

    /**
     * Get list of supported database types
     * @returns {Array<string>} List of supported database types
     */
    static getSupportedTypes() {
        return ['firebird'];
    }

    /**
     * Check if a database type is supported
     * @param {string} type - Database type to check
     * @returns {boolean} True if supported
     */
    static isSupported(type) {
        return this.getSupportedTypes().includes(type.toLowerCase());
    }
}

module.exports = DatabaseAdapterFactory;
