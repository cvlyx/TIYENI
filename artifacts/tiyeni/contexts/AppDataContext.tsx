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

interface AppDataContextValue {
  trips: Trip[];
  parcelRequests: ParcelRequest[];
  myTrips: Trip[];
  myParcels: ParcelRequest[];
  conversations: Conversation[];
  addTrip: (trip: Omit<Trip, "id" | "createdAt">) => void;
  addParcelRequest: (req: Omit<ParcelRequest, "id" | "createdAt">) => void;
  sendMessage: (conversationId: string, text: string, senderId: string) => void;
  startConversation: (item: FeedItem, currentUserId: string) => string;
  updateParcelStatus: (id: string, status: ParcelRequest["status"]) => void;
}

const AppDataContext = createContext<AppDataContextValue | null>(null);

const TRIPS_KEY = "tiyeni_trips";
const PARCELS_KEY = "tiyeni_parcels";
const CONVOS_KEY = "tiyeni_conversations";

const SAMPLE_TRIPS: Trip[] = [
  {
    id: "t1",
    userId: "u2",
    userName: "Tadala Phiri",
    userRating: 4.9,
    isVerified: true,
    from: "Lilongwe",
    to: "Blantyre",
    date: "2026-04-12",
    time: "07:00",
    seatsAvailable: 2,
    parcelCapacity: true,
    price: 15000,
    type: "trip",
    createdAt: Date.now() - 3600000,
  },
  {
    id: "t2",
    userId: "u3",
    userName: "Kondwani Mwale",
    userRating: 4.5,
    isVerified: true,
    from: "Mzuzu",
    to: "Lilongwe",
    date: "2026-04-13",
    time: "06:00",
    seatsAvailable: 3,
    parcelCapacity: false,
    price: 12000,
    type: "trip",
    createdAt: Date.now() - 7200000,
  },
  {
    id: "t3",
    userId: "u4",
    userName: "Mphatso Chirwa",
    userRating: 4.2,
    isVerified: false,
    from: "Blantyre",
    to: "Zomba",
    date: "2026-04-11",
    time: "09:30",
    seatsAvailable: 1,
    parcelCapacity: true,
    price: 5000,
    type: "trip",
    createdAt: Date.now() - 10800000,
  },
];

const SAMPLE_PARCELS: ParcelRequest[] = [
  {
    id: "p1",
    userId: "u5",
    userName: "Grace Kamwendo",
    userRating: 4.8,
    isVerified: true,
    from: "Lilongwe",
    to: "Blantyre",
    deadline: "2026-04-13",
    parcelSize: "medium",
    notes: "Documents — handle with care",
    price: 8000,
    type: "parcel",
    createdAt: Date.now() - 1800000,
    status: "open",
  },
  {
    id: "p2",
    userId: "u6",
    userName: "Blessings Nkosi",
    userRating: 4.6,
    isVerified: false,
    from: "Zomba",
    to: "Mzuzu",
    deadline: "2026-04-15",
    parcelSize: "small",
    notes: "Phone accessories",
    price: 6000,
    type: "parcel",
    createdAt: Date.now() - 5400000,
    status: "open",
  },
];

const SAMPLE_CONVOS: Conversation[] = [
  {
    id: "c1",
    participantId: "u2",
    participantName: "Tadala Phiri",
    participantRating: 4.9,
    isVerified: true,
    lastMessage: "I can take your parcel to Blantyre tomorrow",
    lastTimestamp: Date.now() - 1200000,
    unreadCount: 2,
    relatedItemId: "t1",
    messages: [
      { id: "m1", senderId: "u2", text: "Hello! I saw your parcel request", timestamp: Date.now() - 7200000 },
      { id: "m2", senderId: "current", text: "Hi! Yes, I need it in Blantyre by Friday", timestamp: Date.now() - 3600000 },
      { id: "m3", senderId: "u2", text: "I can take your parcel to Blantyre tomorrow", timestamp: Date.now() - 1200000 },
    ],
  },
];

export function AppDataProvider({ children }: { children: React.ReactNode }) {
  const [trips, setTrips] = useState<Trip[]>(SAMPLE_TRIPS);
  const [parcelRequests, setParcelRequests] = useState<ParcelRequest[]>(SAMPLE_PARCELS);
  const [myTrips, setMyTrips] = useState<Trip[]>([]);
  const [myParcels, setMyParcels] = useState<ParcelRequest[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>(SAMPLE_CONVOS);

  useEffect(() => {
    const load = async () => {
      try {
        const [tripsRaw, parcelsRaw, convosRaw] = await Promise.all([
          AsyncStorage.getItem(TRIPS_KEY),
          AsyncStorage.getItem(PARCELS_KEY),
          AsyncStorage.getItem(CONVOS_KEY),
        ]);
        if (tripsRaw) {
          const parsed = JSON.parse(tripsRaw);
          setTrips([...SAMPLE_TRIPS, ...parsed.filter((t: Trip) => !SAMPLE_TRIPS.find(s => s.id === t.id))]);
          setMyTrips(parsed);
        }
        if (parcelsRaw) {
          const parsed = JSON.parse(parcelsRaw);
          setParcelRequests([...SAMPLE_PARCELS, ...parsed.filter((p: ParcelRequest) => !SAMPLE_PARCELS.find(s => s.id === p.id))]);
          setMyParcels(parsed);
        }
        if (convosRaw) {
          setConversations(JSON.parse(convosRaw));
        }
      } catch {}
    };
    load();
  }, []);

  const addTrip = useCallback((trip: Omit<Trip, "id" | "createdAt">) => {
    const newTrip: Trip = {
      ...trip,
      id: "t_" + Date.now().toString() + Math.random().toString(36).substr(2, 5),
      createdAt: Date.now(),
    };
    setTrips((prev) => [newTrip, ...prev]);
    setMyTrips((prev) => {
      const updated = [newTrip, ...prev];
      AsyncStorage.setItem(TRIPS_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const addParcelRequest = useCallback((req: Omit<ParcelRequest, "id" | "createdAt">) => {
    const newReq: ParcelRequest = {
      ...req,
      id: "p_" + Date.now().toString() + Math.random().toString(36).substr(2, 5),
      createdAt: Date.now(),
    };
    setParcelRequests((prev) => [newReq, ...prev]);
    setMyParcels((prev) => {
      const updated = [newReq, ...prev];
      AsyncStorage.setItem(PARCELS_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const sendMessage = useCallback((conversationId: string, text: string, senderId: string) => {
    const msg: Message = {
      id: "msg_" + Date.now().toString() + Math.random().toString(36).substr(2, 5),
      senderId,
      text,
      timestamp: Date.now(),
    };
    setConversations((prev) => {
      const updated = prev.map((c) =>
        c.id === conversationId
          ? { ...c, messages: [...c.messages, msg], lastMessage: text, lastTimestamp: msg.timestamp, unreadCount: 0 }
          : c
      );
      AsyncStorage.setItem(CONVOS_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const startConversation = useCallback(
    (item: FeedItem, currentUserId: string): string => {
      const existingId = conversations.find(
        (c) => c.participantId === item.userId
      )?.id;
      if (existingId) return existingId;
      const newConvo: Conversation = {
        id: "c_" + Date.now().toString() + Math.random().toString(36).substr(2, 5),
        participantId: item.userId,
        participantName: item.userName,
        participantRating: item.userRating,
        isVerified: item.isVerified,
        lastMessage: "Say hello!",
        lastTimestamp: Date.now(),
        unreadCount: 0,
        relatedItemId: item.id,
        messages: [],
      };
      setConversations((prev) => {
        const updated = [newConvo, ...prev];
        AsyncStorage.setItem(CONVOS_KEY, JSON.stringify(updated));
        return updated;
      });
      return newConvo.id;
    },
    [conversations]
  );

  const updateParcelStatus = useCallback((id: string, status: ParcelRequest["status"]) => {
    const update = (prev: ParcelRequest[]) => prev.map((p) => p.id === id ? { ...p, status } : p);
    setParcelRequests(update);
    setMyParcels((prev) => {
      const updated = update(prev);
      AsyncStorage.setItem(PARCELS_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  return (
    <AppDataContext.Provider
      value={{
        trips,
        parcelRequests,
        myTrips,
        myParcels,
        conversations,
        addTrip,
        addParcelRequest,
        sendMessage,
        startConversation,
        updateParcelStatus,
      }}
    >
      {children}
    </AppDataContext.Provider>
  );
}

export function useAppData() {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error("useAppData must be used within AppDataProvider");
  return ctx;
}
