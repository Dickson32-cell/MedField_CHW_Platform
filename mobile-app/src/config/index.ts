import Constants from 'expo-constants';

// Environment configuration for MedField Mobile App
// Uses Expo's environment variable system (EXPO_PUBLIC_*)

interface Config {
  API_URL: string;
  API_TIMEOUT: number;
  APP_VERSION: string;
  ENVIRONMENT: 'development' | 'staging' | 'production';
  ENABLE_LOGGING: boolean;
  SYNC_INTERVAL: number; // in milliseconds
}

const getApiUrl = (): string => {
  // Check for Expo public environment variable
  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  if (envUrl) {
    return envUrl;
  }
  
  // Check for extra config from app.json/app.config.js
  const extra = Constants.expoConfig?.extra;
  if (extra?.apiUrl) {
    return extra.apiUrl;
  }
  
  // Development fallback
  return 'http://localhost:3007/api';
};

const getEnvironment = (): 'development' | 'staging' | 'production' => {
  const env = process.env.EXPO_PUBLIC_ENVIRONMENT;
  if (env === 'production' || env === 'staging') {
    return env;
  }
  return 'development';
};

export const CONFIG: Config = {
  API_URL: getApiUrl(),
  API_TIMEOUT: parseInt(process.env.EXPO_PUBLIC_API_TIMEOUT || '30000', 10),
  APP_VERSION: Constants.expoConfig?.version || '2.0.0',
  ENVIRONMENT: getEnvironment(),
  ENABLE_LOGGING: process.env.EXPO_PUBLIC_ENABLE_LOGGING === 'true' || getEnvironment() === 'development',
  SYNC_INTERVAL: parseInt(process.env.EXPO_PUBLIC_SYNC_INTERVAL || '300000', 10), // 5 minutes default
};

// Helper function to check if running in development
export const isDevelopment = (): boolean => CONFIG.ENVIRONMENT === 'development';

// Helper function to check if running in production
export const isProduction = (): boolean => CONFIG.ENVIRONMENT === 'production';

export default CONFIG;
