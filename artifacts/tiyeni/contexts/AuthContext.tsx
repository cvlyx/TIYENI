import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { api } from "@/lib/api";

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
  requestOtp: (phone: string, name?: string) => Promise<void>;
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
        const token = await AsyncStorage.getItem(TOKEN_KEY);
        if (token) {
          const { user: u } = await api.me();
          setUser(u);
        } else {
          // Fallback to cached user for offline
          const raw = await AsyncStorage.getItem(USER_KEY);
          if (raw) setUser(JSON.parse(raw));
        }
      } catch {
        const raw = await AsyncStorage.getItem(USER_KEY);
        if (raw) setUser(JSON.parse(raw));
      } finally {
        setIsLoading(false);
      }
    };
    restore();
  }, []);

  const requestOtp = useCallback(async (phone: string, name?: string) => {
    await api.requestOtp(phone, name);
  }, []);

  const verifyOtp = useCallback(async (phone: string, otp: string, name?: string) => {
    const { user: u, accessToken, refreshToken, token } = await api.verifyOtp(phone, otp, name);
    await AsyncStorage.setItem(TOKEN_KEY, accessToken || token);
    await AsyncStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(u));
    setUser(u);
  }, []);

  const login = useCallback(async (phone: string, name: string) => {
    const { user: u, accessToken, refreshToken, token } = await api.login(phone, name);
    await AsyncStorage.setItem(TOKEN_KEY, accessToken || token);
    await AsyncStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(u));
    setUser(u);
  }, []);

  const logout = useCallback(async () => {
    await api.logout().catch(() => undefined);
    await AsyncStorage.multiRemove([TOKEN_KEY, REFRESH_TOKEN_KEY, USER_KEY]);
    setUser(null);
  }, []);

  const updateUser = useCallback(async (updates: Partial<User>) => {
    if (!user) return;
    const updated = { ...user, ...updates };
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(updated));
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
