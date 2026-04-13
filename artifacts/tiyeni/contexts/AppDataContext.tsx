import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

export type ParcelSize = "small" | "medium" | "large" | "extra-large";

export interface Trip {
  id: string;
  userId: string;
  userName: string;
  userRating: number;
  isVerified: boolean;
  from: string;
  to: string;
  date: string;
  time: string;
  seatsAvailable: number;
  parcelCapacity: boolean;
  price?: number;
  notes?: string;
  type: "trip";
  createdAt: number;
}

export interface ParcelRequest {
  id: string;
  userId: string;
  userName: string;
  userRating: number;
  isVerified: boolean;
  from: string;
  to: string;
  deadline: string;
  parcelSize: ParcelSize;
  notes?: string;
  price?: number;
  type: "parcel";
  createdAt: number;
  status: "open" | "matched" | "in_transit" | "delivered";
}

export type FeedItem = Trip | ParcelRequest;

export interface Message {
  id: string;
  senderId: string;
  text: string;
  timestamp: number;
}

export interface Conversation {
  id: string;
  participantId: string;
  participantName: string;
  participantRating: number;
  isVerified: boolean;
  lastMessage: string;
  lastTimestamp: number;
  unreadCount: number;
  messages: Message[];
  relatedItemId?: string;
}

export interface Booking {
  id: string;
  tripId: string;
  parcelId: string;
  requesterId: string;
  requesterName: string;
  carrierId: string;
  carrierName: string;
  from: string;
  to: string;
  date: string;
  status: "pending" | "accepted" | "declined" | "collected" | "delivered";
  pickupOtp: string;
  price: number;
  createdAt: number;
}

export interface Review {
  id: string;
  bookingId: string;
  reviewerId: string;
  revieweeId: string;
  revieweeName: string;
  rating: number;
  comment: string;
  createdAt: number;
}

export interface AppNotification {
  id: string;
  type: "booking_request" | "booking_accepted" | "booking_declined" | "message" | "delivery_confirmed" | "match" | "wallet";
  title: string;
  body: string;
  relatedId?: string;
  read: boolean;
  createdAt: number;
}

export interface Transaction {
  id: string;
  type: "topup" | "payment" | "received" | "withdrawal";
  amount: number;
  description: string;
  counterparty?: string;
  createdAt: number;
}

interface AppDataContextValue {
  trips: Trip[];
  parcelRequests: ParcelRequest[];
  myTrips: Trip[];
  myParcels: ParcelRequest[];
  conversations: Conversation[];
  bookings: Booking[];
  reviews: Review[];
  notifications: AppNotification[];
  unreadNotifications: number;
  walletBalance: number;
  transactions: Transaction[];
  isLoading: boolean;

  refresh: () => Promise<void>;
  addTrip: (trip: Omit<Trip, "id" | "createdAt">) => Promise<void>;
  addParcelRequest: (req: Omit<ParcelRequest, "id" | "createdAt">) => Promise<void>;
  sendMessage: (conversationId: string, text: string, senderId: string) => Promise<void>;
  startConversation: (item: FeedItem, currentUserId: string) => Promise<string>;
  updateParcelStatus: (id: string, status: ParcelRequest["status"]) => void;

  createBooking: (tripId: string, parcelId: string, trip: Trip, parcel: ParcelRequest, currentUserId: string, currentUserName: string) => Promise<Booking>;
  acceptBooking: (bookingId: string) => Promise<void>;
  declineBooking: (bookingId: string) => Promise<void>;
  collectParcel: (bookingId: string, otp: string) => Promise<boolean>;
  confirmDelivery: (bookingId: string) => Promise<void>;

  addReview: (review: Omit<Review, "id" | "createdAt">) => Promise<void>;
  markNotificationsRead: () => Promise<void>;
  addNotification: (n: Omit<AppNotification, "id" | "createdAt" | "read">) => void;

  topUpWallet: (amount: number, method: string) => Promise<void>;
  getMatchedTrips: (parcel: ParcelRequest) => Trip[];
}

const AppDataContext = createContext<AppDataContextValue | null>(null);

function normalizeTrip(t: any): Trip {
  return {
    id: t.id,
    userId: t.userId ?? t.user_id ?? "",
    userName: t.userName ?? t.user?.name ?? "Unknown",
    userRating: t.userRating ?? t.user?.rating ?? 0,
    isVerified: t.isVerified !== undefined ? t.isVerified : (t.user?.role === "verified"),
    from: t.from ?? t.origin ?? "",
    to: t.to ?? t.destination ?? "",
    date: t.date ?? t.departureDate ?? "",
    time: t.time ?? t.departureTime ?? "",
    seatsAvailable: t.seatsAvailable ?? t.seats ?? 0,
    parcelCapacity: t.parcelCapacity ?? t.acceptsParcels ?? false,
    price: t.price,
    notes: t.notes,
    type: "trip",
    createdAt: t.createdAt ? new Date(t.createdAt).getTime() : Date.now(),
  };
}

function normalizeParcel(p: any): ParcelRequest {
  return {
    id: p.id,
    userId: p.userId ?? p.user_id ?? "",
    userName: p.userName ?? p.user?.name ?? "Unknown",
    userRating: p.userRating ?? p.user?.rating ?? 0,
    isVerified: p.isVerified !== undefined ? p.isVerified : (p.user?.role === "verified"),
    from: p.from ?? p.origin ?? "",
    to: p.to ?? p.destination ?? "",
    deadline: p.deadline ?? p.deliveryDeadline ?? "",
    parcelSize: p.parcelSize ?? p.size ?? "medium",
    notes: p.notes,
    price: p.price,
    type: "parcel",
    createdAt: p.createdAt ? new Date(p.createdAt).getTime() : Date.now(),
    status: p.status ?? "open",
  };
}

function normalizeBooking(b: any): Booking {
  return {
    id: b.id,
    tripId: b.tripId ?? b.trip_id ?? "",
    parcelId: b.parcelId ?? b.parcel_id ?? "",
    requesterId: b.requesterId ?? b.requester_id ?? "",
    requesterName: b.requesterName ?? b.requester?.name ?? "Unknown",
    carrierId: b.carrierId ?? b.carrier_id ?? "",
    carrierName: b.carrierName ?? b.carrier?.name ?? "Unknown",
    from: b.from ?? "",
    to: b.to ?? "",
    date: b.date ?? "",
    status: b.status ?? "pending",
    pickupOtp: b.pickupOtp ?? b.pickup_otp ?? "",
    price: b.price ?? 0,
    createdAt: b.createdAt ? new Date(b.createdAt).getTime() : Date.now(),
  };
}

function normalizeNotification(n: any): AppNotification {
  return {
    id: n.id,
    type: n.type ?? "match",
    title: n.title ?? "",
    body: n.body ?? n.message ?? "",
    relatedId: n.relatedId ?? n.related_id,
    read: n.read ?? false,
    createdAt: n.createdAt ? new Date(n.createdAt).getTime() : Date.now(),
  };
}

function normalizeConversation(c: any): Conversation {
  return {
    id: c.id,
    participantId: c.participantId ?? c.participant?.id ?? "",
    participantName: c.participantName ?? c.participant?.name ?? "Unknown",
    participantRating: c.participantRating ?? c.participant?.rating ?? 0,
    isVerified: c.isVerified !== undefined ? c.isVerified : (c.participant?.role === "verified"),
    lastMessage: c.lastMessage ?? c.last_message ?? "",
    lastTimestamp: c.lastTimestamp ? new Date(c.lastTimestamp).getTime() : Date.now(),
    unreadCount: c.unreadCount ?? 0,
    messages: (c.messages ?? []).map((m: any) => ({
      id: m.id,
      senderId: m.senderId ?? m.sender_id ?? "",
      text: m.text ?? m.content ?? "",
      timestamp: m.timestamp ? new Date(m.timestamp).getTime() : Date.now(),
    })),
    relatedItemId: c.relatedItemId ?? c.related_item_id,
  };
}

export function AppDataProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  const [trips, setTrips] = useState<Trip[]>([]);
  const [parcelRequests, setParcelRequests] = useState<ParcelRequest[]>([]);
  const [myTrips, setMyTrips] = useState<Trip[]>([]);
  const [myParcels, setMyParcels] = useState<ParcelRequest[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [walletBalance, setWalletBalance] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [localNotifs, setLocalNotifs] = useState<AppNotification[]>([]);

  const unreadNotifications = [...notifications, ...localNotifs].filter((n) => !n.read).length;
  const allNotifications = [...localNotifs, ...notifications];

  const refresh = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const [tripsRes, parcelsRes, bookingsRes, notifsRes, walletRes, convosRes] = await Promise.allSettled([
        api.getTrips(),
        api.getParcels(),
        api.getBookings(),
        api.getNotifications(),
        api.getWallet(),
        api.getConversations(),
      ]);

      if (tripsRes.status === "fulfilled") {
        const all = (tripsRes.value.trips ?? []).map(normalizeTrip);
        setTrips(all);
        setMyTrips(all.filter((t) => t.userId === user.id));
      }
      if (parcelsRes.status === "fulfilled") {
        const all = (parcelsRes.value.parcels ?? []).map(normalizeParcel);
        setParcelRequests(all);
        setMyParcels(all.filter((p) => p.userId === user.id));
      }
      if (bookingsRes.status === "fulfilled") {
        setBookings((bookingsRes.value.bookings ?? []).map(normalizeBooking));
      }
      if (notifsRes.status === "fulfilled") {
        setNotifications((notifsRes.value.notifications ?? []).map(normalizeNotification));
      }
      if (walletRes.status === "fulfilled") {
        setWalletBalance(walletRes.value.balance ?? 0);
        setTransactions(walletRes.value.transactions ?? []);
      }
      if (convosRes.status === "fulfilled") {
        setConversations((convosRes.value.conversations ?? []).map(normalizeConversation));
      }
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Also load trips/parcels for unauthenticated browsing
  const loadPublicFeed = useCallback(async () => {
    try {
      const [tripsRes, parcelsRes] = await Promise.allSettled([
        api.getTrips(),
        api.getParcels(),
      ]);
      if (tripsRes.status === "fulfilled") setTrips((tripsRes.value.trips ?? []).map(normalizeTrip));
      if (parcelsRes.status === "fulfilled") setParcelRequests((parcelsRes.value.parcels ?? []).map(normalizeParcel));
    } catch {}
  }, []);

  useEffect(() => {
    if (user) {
      refresh();
    } else {
      loadPublicFeed();
    }
  }, [user]);

  const addNotification = useCallback((n: Omit<AppNotification, "id" | "createdAt" | "read">) => {
    const notif: AppNotification = {
      ...n,
      id: "local_" + Date.now(),
      createdAt: Date.now(),
      read: false,
    };
    setLocalNotifs((prev) => [notif, ...prev]);
  }, []);

  const markNotificationsRead = useCallback(async () => {
    setLocalNotifs((prev) => prev.map((n) => ({ ...n, read: true })));
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    try {
      await api.markNotificationsRead();
    } catch {}
  }, []);

  const addTrip = useCallback(async (trip: Omit<Trip, "id" | "createdAt">) => {
    const res = await api.createTrip(trip);
    const newTrip = normalizeTrip({ ...res.trip, type: "trip" });
    setTrips((prev) => [newTrip, ...prev]);
    setMyTrips((prev) => [newTrip, ...prev]);
    addNotification({ type: "match", title: "Trip posted!", body: `Your ${trip.from} → ${trip.to} trip is now live`, relatedId: newTrip.id });
  }, [addNotification]);

  const addParcelRequest = useCallback(async (req: Omit<ParcelRequest, "id" | "createdAt">) => {
    const res = await api.createParcel(req);
    const newParcel = normalizeParcel({ ...res.parcel, type: "parcel" });
    setParcelRequests((prev) => [newParcel, ...prev]);
    setMyParcels((prev) => [newParcel, ...prev]);
    addNotification({ type: "match", title: "Parcel request posted!", body: `Looking for carriers ${req.from} → ${req.to}`, relatedId: newParcel.id });
  }, [addNotification]);

  const sendMessage = useCallback(async (conversationId: string, text: string, _senderId: string) => {
    await api.sendMessage(conversationId, text);
    setConversations((prev) =>
      prev.map((c) =>
        c.id === conversationId
          ? { ...c, lastMessage: text, lastTimestamp: Date.now(), unreadCount: 0 }
          : c
      )
    );
  }, []);

  const startConversation = useCallback(async (item: FeedItem, _currentUserId: string): Promise<string> => {
    const existing = conversations.find((c) => c.participantId === item.userId);
    if (existing) return existing.id;
    const res = await api.startConversation(item.userId, item.id);
    const newConvo = normalizeConversation(res.conversation);
    setConversations((prev) => [newConvo, ...prev]);
    return newConvo.id;
  }, [conversations]);

  const updateParcelStatus = useCallback((id: string, status: ParcelRequest["status"]) => {
    const update = (prev: ParcelRequest[]) => prev.map((p) => p.id === id ? { ...p, status } : p);
    setParcelRequests(update);
    setMyParcels(update);
  }, []);

  const createBooking = useCallback(async (
    tripId: string, parcelId: string, trip: Trip, parcel: ParcelRequest,
    _currentUserId: string, _currentUserName: string
  ): Promise<Booking> => {
    const res = await api.createBooking({ tripId, parcelId });
    const booking = normalizeBooking(res.booking);
    setBookings((prev) => [booking, ...prev]);
    updateParcelStatus(parcelId, "matched");
    addNotification({ type: "booking_request", title: "Booking request sent", body: `Your parcel request has been sent to ${trip.userName}`, relatedId: booking.id });
    return booking;
  }, [updateParcelStatus, addNotification]);

  const acceptBooking = useCallback(async (bookingId: string) => {
    await api.acceptBooking(bookingId);
    setBookings((prev) => prev.map((b) => b.id === bookingId ? { ...b, status: "accepted" as const } : b));
    addNotification({ type: "booking_accepted", title: "Booking accepted!", body: "Your carrier accepted the parcel request", relatedId: bookingId });
  }, [addNotification]);

  const declineBooking = useCallback(async (bookingId: string) => {
    await api.declineBooking(bookingId);
    setBookings((prev) => {
      const b = prev.find((x) => x.id === bookingId);
      if (b) updateParcelStatus(b.parcelId, "open");
      return prev.map((x) => x.id === bookingId ? { ...x, status: "declined" as const } : x);
    });
    addNotification({ type: "booking_declined", title: "Booking declined", body: "The carrier declined the parcel request", relatedId: bookingId });
  }, [updateParcelStatus, addNotification]);

  const collectParcel = useCallback(async (bookingId: string, otp: string): Promise<boolean> => {
    try {
      await api.collectParcel(bookingId, otp);
      setBookings((prev) => prev.map((b) => b.id === bookingId ? { ...b, status: "collected" as const } : b));
      const booking = bookings.find((b) => b.id === bookingId);
      if (booking) updateParcelStatus(booking.parcelId, "in_transit");
      addNotification({ type: "delivery_confirmed", title: "Parcel collected!", body: "Your parcel is now in transit", relatedId: bookingId });
      return true;
    } catch {
      return false;
    }
  }, [bookings, updateParcelStatus, addNotification]);

  const confirmDelivery = useCallback(async (bookingId: string) => {
    await api.confirmDelivery(bookingId);
    const booking = bookings.find((b) => b.id === bookingId);
    setBookings((prev) => prev.map((b) => b.id === bookingId ? { ...b, status: "delivered" as const } : b));
    if (booking) {
      updateParcelStatus(booking.parcelId, "delivered");
      addNotification({ type: "delivery_confirmed", title: "Delivery confirmed!", body: `MWK ${booking.price.toLocaleString()} added to your wallet`, relatedId: bookingId });
      // Refresh wallet balance
      try {
        const walletRes = await api.getWallet();
        setWalletBalance(walletRes.balance ?? 0);
        setTransactions(walletRes.transactions ?? []);
      } catch {}
    }
  }, [bookings, updateParcelStatus, addNotification]);

  const addReview = useCallback(async (review: Omit<Review, "id" | "createdAt">) => {
    await api.createReview(review);
  }, []);

  const topUpWallet = useCallback(async (amount: number, method: string): Promise<void> => {
    await api.initiateTopUp(amount);
    addNotification({ type: "wallet", title: "Top-up initiated", body: `MWK ${amount.toLocaleString()} top-up via ${method} started` });
  }, [addNotification]);

  const getMatchedTrips = useCallback((parcel: ParcelRequest): Trip[] => {
    return trips.filter((t) =>
      t.parcelCapacity &&
      t.from.toLowerCase() === parcel.from.toLowerCase() &&
      t.to.toLowerCase() === parcel.to.toLowerCase() &&
      t.userId !== parcel.userId
    );
  }, [trips]);

  return (
    <AppDataContext.Provider value={{
      trips, parcelRequests, myTrips, myParcels, conversations,
      bookings, reviews, notifications: allNotifications, unreadNotifications,
      walletBalance, transactions, isLoading,
      refresh, addTrip, addParcelRequest, sendMessage, startConversation, updateParcelStatus,
      createBooking, acceptBooking, declineBooking, collectParcel, confirmDelivery,
      addReview, markNotificationsRead, addNotification,
      topUpWallet, getMatchedTrips,
    }}>
      {children}
    </AppDataContext.Provider>
  );
}

export function useAppData() {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error("useAppData must be used within AppDataProvider");
  return ctx;
}
