// Environment-specific configurations
export type Environment = 'development' | 'staging' | 'production';

export interface EnvironmentConfig {
  apiUrl: string;
  smsServiceUrl?: string;
  emailServiceUrl?: string;
  enableDebugMode: boolean;
  enableLogging: boolean;
  enableAnalytics: boolean;
  enableCrashReporting: boolean;
  apiTimeout: number;
  retryAttempts: number;
  emailConfig?: {
    host: string;
    port: number;
    secure: boolean;
    user: string;
    pass: string;
  };
}

const developmentConfig: EnvironmentConfig = {
  apiUrl: process.env.EXPO_PUBLIC_DEV_API_URL || 'http://localhost:8080/api',
  enableDebugMode: true,
  enableLogging: true,
  enableAnalytics: false,
  enableCrashReporting: false,
  apiTimeout: 10000,
  retryAttempts: 3,
  emailConfig: {
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    user: 'calyxchisiza@gmail.com',
    pass: 'pasd xtvv trjs dqbd',
  },
};

const stagingConfig: EnvironmentConfig = {
  apiUrl: process.env.EXPO_PUBLIC_STAGING_API_URL || 'https://tiyeni-api-staging.onrender.com/api',
  enableDebugMode: true,
  enableLogging: true,
  enableAnalytics: true,
  enableCrashReporting: true,
  apiTimeout: 15000,
  retryAttempts: 3,
  emailConfig: {
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    user: 'calyxchisiza@gmail.com',
    pass: 'pasd xtvv trjs dqbd',
  },
};

const productionConfig: EnvironmentConfig = {
  apiUrl: process.env.EXPO_PUBLIC_API_URL || 'https://tiyeni-api.onrender.com/api',
  enableDebugMode: false,
  enableLogging: true,
  enableAnalytics: true,
  enableCrashReporting: true,
  apiTimeout: 20000,
  retryAttempts: 2,
  emailConfig: {
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    user: 'calyxchisiza@gmail.com',
    pass: 'pasd xtvv trjs dqbd',
  },
};

export const environments: Record<Environment, EnvironmentConfig> = {
  development: developmentConfig,
  staging: stagingConfig,
  production: productionConfig,
};

// Get current environment
export function getCurrentEnvironment(): Environment {
  // Check environment variable first
  const envVar = process.env.EXPO_PUBLIC_ENVIRONMENT;
  if (envVar && ['development', 'staging', 'production'].includes(envVar)) {
    return envVar as Environment;
  }

  // Default based on Expo environment
  if (__DEV__) {
    return 'development';
  }

  // Check if we're in Expo Go vs production build
  if (process.env.NODE_ENV === 'production') {
    return 'production';
  }

  return 'staging';
}

// Get current environment config
export function getEnvironmentConfig(): EnvironmentConfig {
  const currentEnv = getCurrentEnvironment();
  return environments[currentEnv];
}

// Environment-specific utilities
export const config = {
  get apiUrl(): string {
    return getEnvironmentConfig().apiUrl;
  },
  get isDevelopment(): boolean {
    return getCurrentEnvironment() === 'development';
  },
  get isStaging(): boolean {
    return getCurrentEnvironment() === 'staging';
  },
  get isProduction(): boolean {
    return getCurrentEnvironment() === 'production';
  },
  get enableDebugMode(): boolean {
    return getEnvironmentConfig().enableDebugMode;
  },
  get enableLogging(): boolean {
    return getEnvironmentConfig().enableLogging;
  },
  get enableAnalytics(): boolean {
    return getEnvironmentConfig().enableAnalytics;
  },
  get enableCrashReporting(): boolean {
    return getEnvironmentConfig().enableCrashReporting;
  },
  get apiTimeout(): number {
    return getEnvironmentConfig().apiTimeout;
  },
  get retryAttempts(): number {
    return getEnvironmentConfig().retryAttempts;
  },
  get emailConfig() {
    return getEnvironmentConfig().emailConfig;
  },
};

// Export for convenience
export default config;
