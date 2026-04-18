import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { secureStorage, SecureStorage } from "@/lib/secureStorageFixed";
import { notificationService } from "@/lib/emailService";

export type UserRole = "guest" | "basic" | "verified" | "admin";

export interface User {
  id: string;
  name: string;
  phone: string;
  role: UserRole;
  rating: number;
  tripsCompleted: number;
  avatarUrl?: string;
  verificationStatus?: "pending" | "approved" | "rejected";
}

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  requestOtp: (phone: string, name?: string) => Promise<string | undefined>;
  verifyOtp: (phone: string, otp: string, name?: string) => Promise<void>;
  login: (phone: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (updates: Partial<User>) => Promise<void>;
  requestVerification: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);
const TOKEN_KEY = "tiyeni_token";
const REFRESH_TOKEN_KEY = "tiyeni_refresh_token";
const USER_KEY = "tiyeni_user";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const restore = async () => {
      try {
        // Try to get user from secure storage first
        const userData = await secureStorage.getUserData();
        if (userData) {
          setUser(userData);
        }
        
        // Try to get tokens and validate them
        const accessToken = await secureStorage.getAccessToken();
        if (accessToken) {
          try {
            const { user: u } = await api.me();
            setUser(u);
            await secureStorage.setUserData(u);
          } catch (error) {
            // Token might be expired, try refresh
            console.log('Token validation failed, clearing tokens');
            await secureStorage.clearTokens();
          }
        }
      } catch (error) {
        console.error('Auth restoration failed:', error);
      } finally {
        setIsLoading(false);
      }
    };
    restore();
  }, []);

  const requestOtp = useCallback(async (phone: string, name?: string) => {
    const res = await api.resendOtp(phone);
    return (res as any).devCode as string | undefined;
  }, []);

  const verifyOtp = useCallback(async (phone: string, otp: string, name?: string) => {
    // Validate inputs
    const phoneValidation = SecureStorage.validatePhone(phone);
    const otpValidation = SecureStorage.validateOTP(otp);
    
    if (!phoneValidation.isValid) {
      throw new Error(phoneValidation.errors.join(', '));
    }
    
    if (!otpValidation.isValid) {
      throw new Error(otpValidation.errors.join(', '));
    }

    const { user: u, accessToken, refreshToken, token } = await api.verifyPhone(phone, otp);
    
    // Store tokens securely
    await secureStorage.setTokens(accessToken || token, refreshToken);
    await secureStorage.setUserData(u);
    setUser(u);
    
    // Send welcome email if user is newly verified
    if (u.email) {
      await notificationService.sendWelcomeEmail(u.email, u.name);
    }
  }, []);

  const login = useCallback(async (identifier: string, password: string) => {
    // Validate inputs
    if (!identifier.trim()) {
      throw new Error('Email or username is required');
    }
    
    const passwordValidation = SecureStorage.validatePassword(password);
    if (!passwordValidation.isValid) {
      throw new Error(passwordValidation.errors.join(', '));
    }

    const res = await api.login(identifier, password) as any;
    if (res.error) {
      const err: any = new Error(res.error);
      err.phone = res.phone;
      err.devCode = res.devCode;
      throw err;
    }
    
    const { user: u, accessToken, refreshToken, token } = res;
    
    // Store tokens securely
    await secureStorage.setTokens(accessToken || token, refreshToken);
    await secureStorage.setUserData(u);
    setUser(u);
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.logout();
    } catch (error) {
      console.error('Logout API call failed:', error);
    }
    
    // Clear all secure storage
    await secureStorage.clearTokens();
    await secureStorage.clearUserData();
    setUser(null);
  }, []);

  const updateUser = useCallback(async (updates: Partial<User>) => {
    if (!user) return;
    try {
      if (updates.name) {
        const { user: updated } = await api.updateProfile({ name: updates.name });
        const merged = { ...user, ...updated };
        await secureStorage.setUserData(merged);
        setUser(merged);
        return;
      }
    } catch (error) {
      console.error('Profile update failed:', error);
    }
    // Fallback to local update
    const updated = { ...user, ...updates };
    await secureStorage.setUserData(updated);
    setUser(updated);
  }, [user]);

  const requestVerification = useCallback(async () => {
    if (!user) return;
    await updateUser({ verificationStatus: "pending" });
  }, [user, updateUser]);

  return (
    <AuthContext.Provider value={{ user, isLoading, requestOtp, verifyOtp, login, logout, updateUser, requestVerification }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
