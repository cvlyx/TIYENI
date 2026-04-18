import * as Keychain from 'react-native-keychain';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Storage keys - keep these private
const STORAGE_KEYS = {
  ACCESS_TOKEN: 'tiyeni_access_token',
  REFRESH_TOKEN: 'tiyeni_refresh_token',
  USER_DATA: 'tiyeni_user_data',
  BIOMETRIC_ENABLED: 'tiyeni_biometric_enabled',
} as const;

// Validation schemas
const PHONE_REGEX = /^\+265\d{9}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export class SecureStorage {
  private static instance: SecureStorage;
  private isSecureStorageAvailable: boolean = false;

  private constructor() {
    this.checkSecureStorageAvailability();
  }

  static getInstance(): SecureStorage {
    if (!SecureStorage.instance) {
      SecureStorage.instance = new SecureStorage();
    }
    return SecureStorage.instance;
  }

  private async checkSecureStorageAvailability(): Promise<void> {
    try {
      // Test if secure storage is available
      await Keychain.getSupportedBiometryType();
      this.isSecureStorageAvailable = true;
    } catch (error) {
      console.warn('Secure storage not available, falling back to AsyncStorage');
      this.isSecureStorageAvailable = false;
    }
  }

  // Token Management
  async setTokens(accessToken: string, refreshToken: string): Promise<void> {
    if (!this.validateToken(accessToken) || !this.validateToken(refreshToken)) {
      throw new Error('Invalid token format');
    }

    try {
      if (this.isSecureStorageAvailable) {
        await Keychain.setInternetCredentials(
          'tiyeni_tokens',
          'access_token',
          accessToken
        );
        await Keychain.setInternetCredentials(
          'tiyeni_refresh',
          'refresh_token',
          refreshToken
        );
      } else {
        // Fallback to encrypted AsyncStorage
        await AsyncStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, this.encryptToken(accessToken));
        await AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, this.encryptToken(refreshToken));
      }
    } catch (error) {
      console.error('Failed to store tokens securely:', error);
      throw new Error('Failed to store tokens');
    }
  }

  async getAccessToken(): Promise<string | null> {
    try {
      if (this.isSecureStorageAvailable) {
        const credentials = await Keychain.getInternetCredentials('tiyeni_tokens');
        if (credentials && typeof credentials !== 'boolean') {
          return credentials.password;
        }
      } else {
        const encryptedToken = await AsyncStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
        if (encryptedToken) {
          return this.decryptToken(encryptedToken);
        }
      }
      return null;
    } catch (error) {
      console.error('Failed to retrieve access token:', error);
      return null;
    }
  }

  async getRefreshToken(): Promise<string | null> {
    try {
      if (this.isSecureStorageAvailable) {
        const credentials = await Keychain.getInternetCredentials('tiyeni_refresh');
        if (credentials && typeof credentials !== 'boolean') {
          return credentials.password;
        }
      } else {
        const encryptedToken = await AsyncStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
        if (encryptedToken) {
          return this.decryptToken(encryptedToken);
        }
      }
      return null;
    } catch (error) {
      console.error('Failed to retrieve refresh token:', error);
      return null;
    }
  }

  async clearTokens(): Promise<void> {
    try {
      if (this.isSecureStorageAvailable) {
        await Keychain.resetInternetCredentials('tiyeni_tokens');
        await Keychain.resetInternetCredentials('tiyeni_refresh');
      } else {
        await AsyncStorage.multiRemove([
          STORAGE_KEYS.ACCESS_TOKEN,
          STORAGE_KEYS.REFRESH_TOKEN,
        ]);
      }
    } catch (error) {
      console.error('Failed to clear tokens:', error);
    }
  }

  // User Data Management
  async setUserData(userData: any): Promise<void> {
    try {
      const userDataString = JSON.stringify(userData);
      if (this.isSecureStorageAvailable) {
        await Keychain.setInternetCredentials(
          'tiyeni_user',
          'user_data',
          userDataString
        );
      } else {
        await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, userDataString);
      }
    } catch (error) {
      console.error('Failed to store user data:', error);
    }
  }

  async getUserData(): Promise<any | null> {
    try {
      if (this.isSecureStorageAvailable) {
        const credentials = await Keychain.getInternetCredentials('tiyeni_user');
        if (credentials && typeof credentials !== 'boolean') {
          return JSON.parse(credentials.password);
        }
      } else {
        const userDataString = await AsyncStorage.getItem(STORAGE_KEYS.USER_DATA);
        if (userDataString) {
          return JSON.parse(userDataString);
        }
      }
      return null;
    } catch (error) {
      console.error('Failed to retrieve user data:', error);
      return null;
    }
  }

  async clearUserData(): Promise<void> {
    try {
      if (this.isSecureStorageAvailable) {
        await Keychain.resetInternetCredentials('tiyeni_user');
      } else {
        await AsyncStorage.removeItem(STORAGE_KEYS.USER_DATA);
      }
    } catch (error) {
      console.error('Failed to clear user data:', error);
    }
  }

  // Biometric Authentication
  async enableBiometric(): Promise<void> {
    try {
      const biometryType = await Keychain.getSupportedBiometryType();
      if (!biometryType) {
        throw new Error('Biometric authentication not supported');
      }

      if (this.isSecureStorageAvailable) {
        await Keychain.setInternetCredentials(
          'tiyeni_biometric',
          'enabled',
          'true'
        );
      } else {
        await AsyncStorage.setItem(STORAGE_KEYS.BIOMETRIC_ENABLED, 'true');
      }
    } catch (error) {
      console.error('Failed to enable biometric:', error);
      throw error;
    }
  }

  async isBiometricEnabled(): Promise<boolean> {
    try {
      if (this.isSecureStorageAvailable) {
        const credentials = await Keychain.getInternetCredentials('tiyeni_biometric');
        return credentials && typeof credentials !== 'boolean' && credentials.password === 'true';
      } else {
        const enabled = await AsyncStorage.getItem(STORAGE_KEYS.BIOMETRIC_ENABLED);
        return enabled === 'true';
      }
    } catch (error) {
      return false;
    }
  }

  async authenticateWithBiometric(): Promise<boolean> {
    try {
      const biometryType = await Keychain.getSupportedBiometryType();
      if (!biometryType) {
        return false;
      }

      // Test biometric authentication using canImplyAuthentication
      const result = await Keychain.canImplyAuthentication({
        authenticationType: Keychain.AUTHENTICATION_TYPE.BIOMETRICS,
      });

      return result;
    } catch (error) {
      console.error('Biometric authentication failed:', error);
      return false;
    }
  }

  // Validation Methods
  static validatePhone(phone: string): ValidationResult {
    const errors: string[] = [];
    
    if (!phone) {
      errors.push('Phone number is required');
    } else if (!PHONE_REGEX.test(phone)) {
      errors.push('Phone number must be in format: +265XXXXXXXXX');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  static validateEmail(email: string): ValidationResult {
    const errors: string[] = [];
    
    if (!email) {
      errors.push('Email is required');
    } else if (!EMAIL_REGEX.test(email)) {
      errors.push('Please enter a valid email address');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  static validatePassword(password: string): ValidationResult {
    const errors: string[] = [];
    
    if (!password) {
      errors.push('Password is required');
    } else {
      if (password.length < 8) {
        errors.push('Password must be at least 8 characters long');
      }
      if (!/(?=.*[a-z])/.test(password)) {
        errors.push('Password must contain at least one lowercase letter');
      }
      if (!/(?=.*[A-Z])/.test(password)) {
        errors.push('Password must contain at least one uppercase letter');
      }
      if (!/(?=.*\d)/.test(password)) {
        errors.push('Password must contain at least one number');
      }
      if (!/(?=.*[@$!%*?&])/.test(password)) {
        errors.push('Password must contain at least one special character (@$!%*?&)');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  static validateOTP(otp: string): ValidationResult {
    const errors: string[] = [];
    
    if (!otp) {
      errors.push('OTP is required');
    } else if (!/^\d{6}$/.test(otp)) {
      errors.push('OTP must be exactly 6 digits');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  // Private helper methods
  private validateToken(token: string): boolean {
    // Basic JWT token validation
    const parts = token.split('.');
    return parts.length === 3 && parts.every(part => part.length > 0);
  }

  private encryptToken(token: string): string {
    // Simple XOR encryption for fallback storage
    // In production, use a proper encryption library
    const key = 'tiyeni_secure_key_2024';
    let encrypted = '';
    for (let i = 0; i < token.length; i++) {
      encrypted += String.fromCharCode(
        token.charCodeAt(i) ^ key.charCodeAt(i % key.length)
      );
    }
    return btoa(encrypted);
  }

  private decryptToken(encryptedToken: string): string {
    // Simple XOR decryption for fallback storage
    // In production, use a proper encryption library
    const key = 'tiyeni_secure_key_2024';
    let decrypted = '';
    const encrypted = atob(encryptedToken);
    for (let i = 0; i < encrypted.length; i++) {
      decrypted += String.fromCharCode(
        encrypted.charCodeAt(i) ^ key.charCodeAt(i % key.length)
      );
    }
    return decrypted;
  }
}

// Export singleton instance
export const secureStorage = SecureStorage.getInstance();
