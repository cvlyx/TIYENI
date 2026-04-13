import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

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

  addTrip: (trip: Omit<Trip, "id" | "createdAt">) => void;
  addParcelRequest: (req: Omit<ParcelRequest, "id" | "createdAt">) => void;
  sendMessage: (conversationId: string, text: string, senderId: string) => void;
  startConversation: (item: FeedItem, currentUserId: string) => string;
  updateParcelStatus: (id: string, status: ParcelRequest["status"]) => void;

  createBooking: (tripId: string, parcelId: string, trip: Trip, parcel: ParcelRequest, currentUserId: string, currentUserName: string) => Booking;
  acceptBooking: (bookingId: string) => void;
  declineBooking: (bookingId: string) => void;
  collectParcel: (bookingId: string, otp: string) => boolean;
  confirmDelivery: (bookingId: string) => void;

  addReview: (review: Omit<Review, "id" | "createdAt">) => void;
  markNotificationsRead: () => void;
  addNotification: (n: Omit<AppNotification, "id" | "createdAt" | "read">) => void;

  topUpWallet: (amount: number, method: string) => void;
  getMatchedTrips: (parcel: ParcelRequest) => Trip[];
}

const AppDataContext = createContext<AppDataContextValue | null>(null);

const TRIPS_KEY = "tiyeni_trips";
const PARCELS_KEY = "tiyeni_parcels";
const CONVOS_KEY = "tiyeni_conversations";
const BOOKINGS_KEY = "tiyeni_bookings";
const REVIEWS_KEY = "tiyeni_reviews";
const NOTIFS_KEY = "tiyeni_notifications";
const WALLET_KEY = "tiyeni_wallet";
const TXNS_KEY = "tiyeni_transactions";

const SAMPLE_TRIPS: Trip[] = [
  {
    id: "t1", userId: "u2", userName: "Tadala Phiri", userRating: 4.9, isVerified: true,
    from: "Lilongwe", to: "Blantyre", date: "2026-04-12", time: "07:00",
    seatsAvailable: 2, parcelCapacity: true, price: 15000, type: "trip", createdAt: Date.now() - 3600000,
  },
  {
    id: "t2", userId: "u3", userName: "Kondwani Mwale", userRating: 4.5, isVerified: true,
    from: "Mzuzu", to: "Lilongwe", date: "2026-04-13", time: "06:00",
    seatsAvailable: 3, parcelCapacity: false, price: 12000, type: "trip", createdAt: Date.now() - 7200000,
  },
  {
    id: "t3", userId: "u4", userName: "Mphatso Chirwa", userRating: 4.2, isVerified: false,
    from: "Blantyre", to: "Zomba", date: "2026-04-11", time: "09:30",
    seatsAvailable: 1, parcelCapacity: true, price: 5000, type: "trip", createdAt: Date.now() - 10800000,
  },
  {
    id: "t4", userId: "u7", userName: "Salome Banda", userRating: 4.7, isVerified: true,
    from: "Lilongwe", to: "Mzuzu", date: "2026-04-14", time: "05:30",
    seatsAvailable: 4, parcelCapacity: true, price: 18000, type: "trip", createdAt: Date.now() - 900000,
  },
  {
    id: "t5", userId: "u8", userName: "Chisomo Dube", userRating: 4.3, isVerified: true,
    from: "Blantyre", to: "Lilongwe", date: "2026-04-13", time: "08:00",
    seatsAvailable: 2, parcelCapacity: true, price: 14000, type: "trip", createdAt: Date.now() - 1800000,
  },
];

const SAMPLE_PARCELS: ParcelRequest[] = [
  {
    id: "p1", userId: "u5", userName: "Grace Kamwendo", userRating: 4.8, isVerified: true,
    from: "Lilongwe", to: "Blantyre", deadline: "2026-04-13", parcelSize: "medium",
    notes: "Documents — handle with care", price: 8000, type: "parcel", createdAt: Date.now() - 1800000, status: "open",
  },
  {
    id: "p2", userId: "u6", userName: "Blessings Nkosi", userRating: 4.6, isVerified: false,
    from: "Zomba", to: "Mzuzu", deadline: "2026-04-15", parcelSize: "small",
    notes: "Phone accessories", price: 6000, type: "parcel", createdAt: Date.now() - 5400000, status: "open",
  },
];

const SAMPLE_CONVOS: Conversation[] = [
  {
    id: "c1", participantId: "u2", participantName: "Tadala Phiri",
    participantRating: 4.9, isVerified: true,
    lastMessage: "I can take your parcel to Blantyre tomorrow",
    lastTimestamp: Date.now() - 1200000, unreadCount: 2, relatedItemId: "t1",
    messages: [
      { id: "m1", senderId: "u2", text: "Hello! I saw your parcel request", timestamp: Date.now() - 7200000 },
      { id: "m2", senderId: "current", text: "Hi! Yes, I need it in Blantyre by Friday", timestamp: Date.now() - 3600000 },
      { id: "m3", senderId: "u2", text: "I can take your parcel to Blantyre tomorrow", timestamp: Date.now() - 1200000 },
    ],
  },
];

const SAMPLE_NOTIFICATIONS: AppNotification[] = [
  {
    id: "n1", type: "match", title: "New match found!", read: false,
    body: "Tadala Phiri is heading Lilongwe → Blantyre and can take your parcel",
    relatedId: "t1", createdAt: Date.now() - 900000,
  },
  {
    id: "n2", type: "message", title: "New message from Kondwani", read: false,
    body: "Yes I can pick it up at 6am from Area 25", relatedId: "c1", createdAt: Date.now() - 1800000,
  },
  {
    id: "n3", type: "wallet", title: "Wallet credited", read: true,
    body: "MWK 5,000 added to your Tiyeni wallet via Airtel Money", createdAt: Date.now() - 86400000,
  },
];

const SAMPLE_TRANSACTIONS: Transaction[] = [
  { id: "tx1", type: "topup", amount: 5000, description: "Airtel Money top-up", createdAt: Date.now() - 86400000 },
  { id: "tx2", type: "received", amount: 8000, description: "Parcel delivery payment", counterparty: "Grace Kamwendo", createdAt: Date.now() - 172800000 },
];

function genId(prefix = "id") {
  return prefix + "_" + Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

function genOtp() {
  return String(Math.floor(1000 + Math.random() * 9000));
}

export function AppDataProvider({ children }: { children: React.ReactNode }) {
  const [trips, setTrips] = useState<Trip[]>(SAMPLE_TRIPS);
  const [parcelRequests, setParcelRequests] = useState<ParcelRequest[]>(SAMPLE_PARCELS);
  const [myTrips, setMyTrips] = useState<Trip[]>([]);
  const [myParcels, setMyParcels] = useState<ParcelRequest[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>(SAMPLE_CONVOS);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>(SAMPLE_NOTIFICATIONS);
  const [walletBalance, setWalletBalance] = useState(5000);
  const [transactions, setTransactions] = useState<Transaction[]>(SAMPLE_TRANSACTIONS);

  const unreadNotifications = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    const load = async () => {
      try {
        const [tripsRaw, parcelsRaw, convosRaw, bookingsRaw, reviewsRaw, notifsRaw, walletRaw, txnsRaw] =
          await Promise.all([
            AsyncStorage.getItem(TRIPS_KEY),
            AsyncStorage.getItem(PARCELS_KEY),
            AsyncStorage.getItem(CONVOS_KEY),
            AsyncStorage.getItem(BOOKINGS_KEY),
            AsyncStorage.getItem(REVIEWS_KEY),
            AsyncStorage.getItem(NOTIFS_KEY),
            AsyncStorage.getItem(WALLET_KEY),
            AsyncStorage.getItem(TXNS_KEY),
          ]);
        if (tripsRaw) {
          const parsed = JSON.parse(tripsRaw);
          setTrips([...SAMPLE_TRIPS, ...parsed.filter((t: Trip) => !SAMPLE_TRIPS.find((s) => s.id === t.id))]);
          setMyTrips(parsed);
        }
        if (parcelsRaw) {
          const parsed = JSON.parse(parcelsRaw);
          setParcelRequests([...SAMPLE_PARCELS, ...parsed.filter((p: ParcelRequest) => !SAMPLE_PARCELS.find((s) => s.id === p.id))]);
          setMyParcels(parsed);
        }
        if (convosRaw) setConversations(JSON.parse(convosRaw));
        if (bookingsRaw) setBookings(JSON.parse(bookingsRaw));
        if (reviewsRaw) setReviews(JSON.parse(reviewsRaw));
        if (notifsRaw) setNotifications(JSON.parse(notifsRaw));
        if (walletRaw) setWalletBalance(JSON.parse(walletRaw));
        if (txnsRaw) setTransactions(JSON.parse(txnsRaw));
      } catch {}
    };
    load();
  }, []);

  const persist = useCallback(async (key: string, value: any) => {
    try { await AsyncStorage.setItem(key, JSON.stringify(value)); } catch {}
  }, []);

  const addNotification = useCallback((n: Omit<AppNotification, "id" | "createdAt" | "read">) => {
    setNotifications((prev) => {
      const updated = [{ ...n, id: genId("n"), createdAt: Date.now(), read: false }, ...prev];
      persist(NOTIFS_KEY, updated);
      return updated;
    });
  }, [persist]);

  const markNotificationsRead = useCallback(() => {
    setNotifications((prev) => {
      const updated = prev.map((n) => ({ ...n, read: true }));
      persist(NOTIFS_KEY, updated);
      return updated;
    });
  }, [persist]);

  const addTrip = useCallback((trip: Omit<Trip, "id" | "createdAt">) => {
    const newTrip: Trip = { ...trip, id: genId("t"), createdAt: Date.now() };
    setTrips((prev) => [newTrip, ...prev]);
    setMyTrips((prev) => {
      const updated = [newTrip, ...prev];
      persist(TRIPS_KEY, updated);
      return updated;
    });
    addNotification({ type: "match", title: "Trip posted!", body: `Your ${trip.from} → ${trip.to} trip is now live`, relatedId: newTrip.id });
  }, [persist, addNotification]);

  const addParcelRequest = useCallback((req: Omit<ParcelRequest, "id" | "createdAt">) => {
    const newReq: ParcelRequest = { ...req, id: genId("p"), createdAt: Date.now() };
    setParcelRequests((prev) => [newReq, ...prev]);
    setMyParcels((prev) => {
      const updated = [newReq, ...prev];
      persist(PARCELS_KEY, updated);
      return updated;
    });
    addNotification({ type: "match", title: "Parcel request posted!", body: `Looking for carriers ${req.from} → ${req.to}`, relatedId: newReq.id });
  }, [persist, addNotification]);

  const sendMessage = useCallback((conversationId: string, text: string, senderId: string) => {
    const msg: Message = { id: genId("msg"), senderId, text, timestamp: Date.now() };
    setConversations((prev) => {
      const updated = prev.map((c) =>
        c.id === conversationId
          ? { ...c, messages: [...c.messages, msg], lastMessage: text, lastTimestamp: msg.timestamp, unreadCount: 0 }
          : c
      );
      persist(CONVOS_KEY, updated);
      return updated;
    });
  }, [persist]);

  const startConversation = useCallback(
    (item: FeedItem, currentUserId: string): string => {
      const existingId = conversations.find((c) => c.participantId === item.userId)?.id;
      if (existingId) return existingId;
      const newConvo: Conversation = {
        id: genId("c"), participantId: item.userId, participantName: item.userName,
        participantRating: item.userRating, isVerified: item.isVerified,
        lastMessage: "Say hello!", lastTimestamp: Date.now(), unreadCount: 0,
        relatedItemId: item.id, messages: [],
      };
      setConversations((prev) => {
        const updated = [newConvo, ...prev];
        persist(CONVOS_KEY, updated);
        return updated;
      });
      return newConvo.id;
    },
    [conversations, persist]
  );

  const updateParcelStatus = useCallback((id: string, status: ParcelRequest["status"]) => {
    const update = (prev: ParcelRequest[]) => prev.map((p) => p.id === id ? { ...p, status } : p);
    setParcelRequests(update);
    setMyParcels((prev) => {
      const updated = update(prev);
      persist(PARCELS_KEY, updated);
      return updated;
    });
  }, [persist]);

  const createBooking = useCallback((
    tripId: string, parcelId: string, trip: Trip, parcel: ParcelRequest,
    currentUserId: string, currentUserName: string
  ): Booking => {
    const booking: Booking = {
      id: genId("b"), tripId, parcelId,
      requesterId: currentUserId, requesterName: currentUserName,
      carrierId: trip.userId, carrierName: trip.userName,
      from: trip.from, to: trip.to, date: trip.date,
      status: "pending", pickupOtp: genOtp(),
      price: parcel.price || trip.price || 0, createdAt: Date.now(),
    };
    setBookings((prev) => {
      const updated = [booking, ...prev];
      persist(BOOKINGS_KEY, updated);
      return updated;
    });
    updateParcelStatus(parcelId, "matched");
    addNotification({
      type: "booking_request", title: "Booking request sent",
      body: `Your parcel request has been sent to ${trip.userName}`, relatedId: booking.id,
    });
    return booking;
  }, [persist, updateParcelStatus, addNotification]);

  const acceptBooking = useCallback((bookingId: string) => {
    setBookings((prev) => {
      const updated = prev.map((b) => b.id === bookingId ? { ...b, status: "accepted" as const } : b);
      persist(BOOKINGS_KEY, updated);
      return updated;
    });
    addNotification({
      type: "booking_accepted", title: "Booking accepted!",
      body: "Your carrier accepted the parcel request", relatedId: bookingId,
    });
  }, [persist, addNotification]);

  const declineBooking = useCallback((bookingId: string) => {
    setBookings((prev) => {
      const b = prev.find((x) => x.id === bookingId);
      if (b) updateParcelStatus(b.parcelId, "open");
      const updated = prev.map((x) => x.id === bookingId ? { ...x, status: "declined" as const } : x);
      persist(BOOKINGS_KEY, updated);
      return updated;
    });
    addNotification({
      type: "booking_declined", title: "Booking declined",
      body: "The carrier declined the parcel request", relatedId: bookingId,
    });
  }, [persist, updateParcelStatus, addNotification]);

  const collectParcel = useCallback((bookingId: string, otp: string): boolean => {
    const booking = bookings.find((b) => b.id === bookingId);
    if (!booking || booking.pickupOtp !== otp) return false;
    setBookings((prev) => {
      const updated = prev.map((b) => b.id === bookingId ? { ...b, status: "collected" as const } : b);
      persist(BOOKINGS_KEY, updated);
      return updated;
    });
    updateParcelStatus(booking.parcelId, "in_transit");
    addNotification({ type: "delivery_confirmed", title: "Parcel collected!", body: "Your parcel is now in transit", relatedId: bookingId });
    return true;
  }, [bookings, persist, updateParcelStatus, addNotification]);

  const confirmDelivery = useCallback((bookingId: string) => {
    const booking = bookings.find((b) => b.id === bookingId);
    setBookings((prev) => {
      const updated = prev.map((b) => b.id === bookingId ? { ...b, status: "delivered" as const } : b);
      persist(BOOKINGS_KEY, updated);
      return updated;
    });
    if (booking) {
      updateParcelStatus(booking.parcelId, "delivered");
      setWalletBalance((prev) => {
        const next = prev + booking.price;
        persist(WALLET_KEY, next);
        return next;
      });
      setTransactions((prev) => {
        const tx: Transaction = {
          id: genId("tx"), type: "received", amount: booking.price,
          description: "Delivery completed", counterparty: booking.requesterName, createdAt: Date.now(),
        };
        const updated = [tx, ...prev];
        persist(TXNS_KEY, updated);
        return updated;
      });
      addNotification({ type: "delivery_confirmed", title: "Delivery confirmed!", body: `MWK ${booking.price.toLocaleString()} added to your wallet`, relatedId: bookingId });
    }
  }, [bookings, persist, updateParcelStatus, addNotification]);

  const addReview = useCallback((review: Omit<Review, "id" | "createdAt">) => {
    const newReview: Review = { ...review, id: genId("r"), createdAt: Date.now() };
    setReviews((prev) => {
      const updated = [newReview, ...prev];
      persist(REVIEWS_KEY, updated);
      return updated;
    });
  }, [persist]);

  const topUpWallet = useCallback((amount: number, method: string) => {
    setWalletBalance((prev) => {
      const next = prev + amount;
      persist(WALLET_KEY, next);
      return next;
    });
    setTransactions((prev) => {
      const tx: Transaction = { id: genId("tx"), type: "topup", amount, description: `${method} top-up`, createdAt: Date.now() };
      const updated = [tx, ...prev];
      persist(TXNS_KEY, updated);
      return updated;
    });
    addNotification({ type: "wallet", title: "Wallet topped up", body: `MWK ${amount.toLocaleString()} added via ${method}` });
  }, [persist, addNotification]);

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
      bookings, reviews, notifications, unreadNotifications, walletBalance, transactions,
      addTrip, addParcelRequest, sendMessage, startConversation, updateParcelStatus,
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
