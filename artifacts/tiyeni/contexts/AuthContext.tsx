import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

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
  login: (phone: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (updates: Partial<User>) => Promise<void>;
  requestVerification: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const STORAGE_KEY = "tiyeni_user";

const DEMO_USER: User = {
  id: "user_" + Date.now(),
  name: "Chisomo Banda",
  phone: "+265 999 123 456",
  role: "basic",
  rating: 4.7,
  tripsCompleted: 12,
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (raw) setUser(JSON.parse(raw));
      })
      .finally(() => setIsLoading(false));
  }, []);

  const persist = useCallback(async (u: User | null) => {
    if (u) {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(u));
    } else {
      await AsyncStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const login = useCallback(
    async (phone: string, name: string) => {
      const newUser: User = {
        ...DEMO_USER,
        id: "user_" + Date.now().toString() + Math.random().toString(36).substr(2, 5),
        phone,
        name: name || DEMO_USER.name,
      };
      setUser(newUser);
      await persist(newUser);
    },
    [persist]
  );

  const logout = useCallback(async () => {
    setUser(null);
    await persist(null);
  }, [persist]);

  const updateUser = useCallback(
    async (updates: Partial<User>) => {
      if (!user) return;
      const updated = { ...user, ...updates };
      setUser(updated);
      await persist(updated);
    },
    [user, persist]
  );

  const requestVerification = useCallback(async () => {
    if (!user) return;
    const updated: User = { ...user, verificationStatus: "pending" };
    setUser(updated);
    await persist(updated);
  }, [user, persist]);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, updateUser, requestVerification }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
