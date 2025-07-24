const moment = require('moment');

/**
 * Utility class for date operations
 */
class DateUtils {
    /**
     * Get yesterday's date range (start and end of day)
     * @returns {Object} Object with fromDate and toDate
     */
    static getYesterdayRange() {
        const yesterday = moment().subtract(1, 'days');
        return {
            fromDate: yesterday.startOf('day').toDate(),
            toDate: yesterday.endOf('day').toDate(),
            dateString: yesterday.format('YYYY-MM-DD')
        };
    }

    /**
     * Get date range for a specific date
     * @param {Date|string} date - The date to get range for
     * @returns {Object} Object with fromDate and toDate
     */
    static getDateRange(date) {
        const momentDate = moment(date);
        return {
            fromDate: momentDate.startOf('day').toDate(),
            toDate: momentDate.endOf('day').toDate(),
            dateString: momentDate.format('YYYY-MM-DD')
        };
    }

    /**
     * Format date for database storage
     * @param {Date} date - Date to format
     * @returns {string} Formatted date string
     */
    static formatForDatabase(date) {
        return moment(date).format('YYYY-MM-DD HH:mm:ss');
    }

    /**
     * Check if a date string matches a specific date
     * @param {string} dateTimeString - Date time string to check
     * @param {string} targetDate - Target date in YYYY-MM-DD format
     * @returns {boolean} True if dates match
     */
    static isDateMatch(dateTimeString, targetDate) {
        return dateTimeString.startsWith(targetDate);
    }
}

module.exports = DateUtils;
