// Get API URL from environment or use localhost for development
// In production, set this via environment variable or local.properties
const getApiUrl = () => {
    // Check for environment variable (set via expo or .env)
    if (process.env.EXPO_PUBLIC_API_URL) {
        return process.env.EXPO_PUBLIC_API_URL;
    }
    // Development fallback - change to your local IP
    return 'http://192.168.X.X:3007/api';
};

export const CONFIG = {
    API_URL: getApiUrl(),
    TIMEOUT: 30000,
    VERSION: '2.0.0'
};
