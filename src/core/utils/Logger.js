/**
 * Simple logger implementation
 * Can be extended to use different logging libraries
 */
class Logger {
    constructor(level = 'info') {
        this.level = level;
        this.levels = {
            error: 0,
            warn: 1,
            info: 2,
            debug: 3
        };
    }

    /**
     * Check if a message should be logged based on current level
     * @param {string} level - Message level
     * @returns {boolean} True if should log
     */
    shouldLog(level) {
        return this.levels[level] <= this.levels[this.level];
    }

    /**
     * Format log message with timestamp
     * @param {string} level - Log level
     * @param {Array} args - Arguments to log
     * @returns {string} Formatted message
     */
    formatMessage(level, ...args) {
        const timestamp = new Date().toISOString();
        return `[${timestamp}] [${level.toUpperCase()}] ${args.join(' ')}`;
    }

    /**
     * Log error message
     * @param {...any} args - Arguments to log
     */
    error(...args) {
        if (this.shouldLog('error')) {
            console.error(this.formatMessage('error', ...args));
        }
    }

    /**
     * Log warning message
     * @param {...any} args - Arguments to log
     */
    warn(...args) {
        if (this.shouldLog('warn')) {
            console.warn(this.formatMessage('warn', ...args));
        }
    }

    /**
     * Log info message
     * @param {...any} args - Arguments to log
     */
    info(...args) {
        if (this.shouldLog('info')) {
            console.log(this.formatMessage('info', ...args));
        }
    }

    /**
     * Log debug message
     * @param {...any} args - Arguments to log
     */
    debug(...args) {
        if (this.shouldLog('debug')) {
            console.log(this.formatMessage('debug', ...args));
        }
    }

    /**
     * Alias for info
     * @param {...any} args - Arguments to log
     */
    log(...args) {
        this.info(...args);
    }
}

module.exports = Logger;
