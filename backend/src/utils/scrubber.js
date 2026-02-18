/**
 * Recursive utility to scrub PII from objects before logging
 */
const PII_KEYS = [
    'first_name', 'last_name', 'phone', 'email', 'date_of_birth',
    'address', 'emergency_contact', 'gps_coordinates', 'notes',
    'password', 'refresh_token', 'accessToken', 'refreshToken'
];

/**
 * Scrubs PII from a value (object, array, or primitive)
 * @param {any} data The data to scrub
 * @returns {any} The scrubbed data
 */
const scrub = (data) => {
    if (!data || typeof data !== 'object') {
        return data;
    }

    if (Array.isArray(data)) {
        return data.map(item => scrub(item));
    }

    const scrubbed = {};
    for (const [key, value] of Object.entries(data)) {
        if (PII_KEYS.includes(key)) {
            scrubbed[key] = '[SCRUBBED]';
        } else if (typeof value === 'object') {
            scrubbed[key] = scrub(value);
        } else {
            scrubbed[key] = value;
        }
    }
    return scrubbed;
};

module.exports = { scrub, PII_KEYS };
