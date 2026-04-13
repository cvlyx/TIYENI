import AsyncStorage from "@react-native-async-storage/async-storage";

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:8080/api";
const REFRESH_TOKEN_KEY = "tiyeni_refresh_token";
const TOKEN_KEY = "tiyeni_token";

async function getToken(): Promise<string | null> {
  return AsyncStorage.getItem(TOKEN_KEY);
}

async function getRefreshToken(): Promise<string | null> {
  return AsyncStorage.getItem(REFRESH_TOKEN_KEY);
}

async function request<T>(path: string, options: RequestInit = {}, retries = 1): Promise<T> {
  const token = await getToken();
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {}),
    },
  });

  // Auto-refresh on 401
  if (res.status === 401 && retries > 0) {
    try {
      const refreshToken = await getRefreshToken();
      if (refreshToken) {
        const refreshRes = await fetch(`${BASE_URL}/auth/refresh`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken }),
        });
        if (refreshRes.ok) {
          const { accessToken, refreshToken: newRefresh } = await refreshRes.json();
          await AsyncStorage.setItem(TOKEN_KEY, accessToken);
          await AsyncStorage.setItem(REFRESH_TOKEN_KEY, newRefresh);
          return request<T>(path, options, 0);
        }
      }
    } catch {}
    // Clear tokens if refresh failed
    await AsyncStorage.multiRemove([TOKEN_KEY, REFRESH_TOKEN_KEY]);
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error ?? "Request failed");
  }
  return res.json() as Promise<T>;
}

export const api = {
  // Auth
  login: (phone: string, name: string) =>
    request<{ user: any; token: string; accessToken: string; refreshToken: string; expiresIn: number }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ phone, name }),
    }),
  requestOtp: (phone: string, name?: string) =>
    request<{ success: boolean; expiresIn: number; devCode?: string }>("/auth/request-otp", {
      method: "POST",
      body: JSON.stringify({ phone, name }),
    }),
  verifyOtp: (phone: string, otp: string, name?: string) =>
    request<{ user: any; token: string; accessToken: string; refreshToken: string; expiresIn: number }>("/auth/verify-otp", {
      method: "POST",
      body: JSON.stringify({ phone, otp, name }),
    }),
  refresh: async (refreshToken?: string) => {
    const token = refreshToken ?? (await getRefreshToken());
    if (!token) throw new Error("Missing refresh token");
    return request<{ accessToken: string; refreshToken: string; expiresIn: number }>("/auth/refresh", {
      method: "POST",
      body: JSON.stringify({ refreshToken: token }),
    });
  },
  logout: async () => {
    const token = await getRefreshToken();
    if (!token) return { success: true };
    return request<{ success: boolean }>("/auth/logout", {
      method: "POST",
      body: JSON.stringify({ refreshToken: token }),
    });
  },
  me: () => request<{ user: any }>("/auth/me"),

  // Users
  getUser: (id: string) => request<{ user: any }>(`/users/${id}`),
  getUserReviews: (id: string) => request<{ reviews: any[] }>(`/users/${id}/reviews`),
  updateProfile: (data: { name?: string }) =>
    request<{ user: any }>("/users/me", { method: "PATCH", body: JSON.stringify(data) }),

  // Trips
  getTrips: (from?: string, to?: string) =>
    request<{ trips: any[] }>(`/trips${from || to ? `?from=${from ?? ""}&to=${to ?? ""}` : ""}`),
  createTrip: (data: any) =>
    request<{ trip: any }>("/trips", { method: "POST", body: JSON.stringify(data) }),
  updateTrip: (id: string, data: any) =>
    request<{ trip: any }>(`/trips/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  deleteTrip: (id: string) =>
    request<{ success: boolean }>(`/trips/${id}`, { method: "DELETE" }),

  // Parcels
  getParcels: () => request<{ parcels: any[] }>("/parcels"),
  createParcel: (data: any) =>
    request<{ parcel: any }>("/parcels", { method: "POST", body: JSON.stringify(data) }),
  updateParcel: (id: string, data: any) =>
    request<{ parcel: any }>(`/parcels/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  deleteParcel: (id: string) =>
    request<{ success: boolean }>(`/parcels/${id}`, { method: "DELETE" }),
  getParcelMatches: (id: string) =>
    request<{ matches: any[] }>(`/parcels/${id}/matches`),

  // Bookings
  getBookings: () => request<{ bookings: any[] }>("/bookings"),
  createBooking: (data: any) =>
    request<{ booking: any }>("/bookings", { method: "POST", body: JSON.stringify(data) }),
  acceptBooking: (id: string) =>
    request<{ success: boolean }>(`/bookings/${id}/accept`, { method: "PATCH" }),
  declineBooking: (id: string) =>
    request<{ success: boolean }>(`/bookings/${id}/decline`, { method: "PATCH" }),
  cancelBooking: (id: string) =>
    request<{ success: boolean }>(`/bookings/${id}/cancel`, { method: "PATCH" }),
  collectParcel: (id: string, otp: string) =>
    request<{ success: boolean }>(`/bookings/${id}/collect`, { method: "PATCH", body: JSON.stringify({ otp }) }),
  confirmDelivery: (id: string) =>
    request<{ success: boolean }>(`/bookings/${id}/deliver`, { method: "PATCH" }),

  // Wallet & Payments
  getWallet: () => request<{ balance: number; transactions: any[] }>("/wallet"),
  initiateTopUp: (amount: number, currency = "MWK") =>
    request<{ checkoutUrl: string; txRef: string }>("/wallet/topup", { method: "POST", body: JSON.stringify({ amount, currency }) }),
  withdraw: (amount: number, method: string) =>
    request<{ success: boolean; newBalance: number }>("/wallet/withdraw", { method: "POST", body: JSON.stringify({ amount, method }) }),

  // Messages
  getConversations: () => request<{ conversations: any[] }>("/conversations"),
  startConversation: (participantId: string, relatedItemId?: string) =>
    request<{ conversation: any }>("/conversations", { method: "POST", body: JSON.stringify({ participantId, relatedItemId }) }),
  sendMessage: (conversationId: string, text: string) =>
    request<{ message: any }>(`/conversations/${conversationId}/messages`, { method: "POST", body: JSON.stringify({ text }) }),

  // Reviews
  createReview: (data: any) =>
    request<{ success: boolean }>("/reviews", { method: "POST", body: JSON.stringify(data) }),

  // Notifications
  getNotifications: () => request<{ notifications: any[] }>("/notifications"),
  markNotificationsRead: () =>
    request<{ success: boolean }>("/notifications/read-all", { method: "PATCH" }),

  // Polling
  poll: () => request<{ unreadNotifications: number; pendingBookings: number; timestamp: string }>("/poll"),
};
