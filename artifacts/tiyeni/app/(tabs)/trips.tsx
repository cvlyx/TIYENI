import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AnimatedListItem } from "@/components/AnimatedListItem";
import { TripCard } from "@/components/TripCard";
import { Trip, ParcelRequest, Booking, useAppData } from "@/contexts/AppDataContext";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { useColors } from "@/hooks/useColors";
import { api } from "@/lib/api";

type TabType = "trips" | "parcels" | "bookings";

function BookingCard({ booking }: { booking: Booking }) {
  const colors = useColors();
  const statusConfig = {
    pending: { label: "Awaiting Carrier", color: colors.accent, bg: colors.accent + "15" },
    accepted: { label: "Accepted", color: colors.success, bg: colors.success + "15" },
    declined: { label: "Declined", color: colors.destructive, bg: colors.destructive + "15" },
    collected: { label: "In Transit", color: colors.info, bg: colors.info + "15" },
    delivered: { label: "Delivered", color: colors.success, bg: colors.success + "15" },
  } as const;
  const s = statusConfig[booking.status];

  return (
    <Pressable
      onPress={() => router.push({ pathname: "/booking/[id]", params: { id: booking.id } } as any)}
      style={[styles.bookingCard, { backgroundColor: colors.card, borderColor: colors.border }]}
    >
      <View style={styles.bookingHeader}>
        <View style={styles.routeRow}>
          <Text style={[styles.routeCity, { color: colors.foreground }]}>{booking.from}</Text>
          <Ionicons name="arrow-forward" size={14} color={colors.mutedForeground} />
          <Text style={[styles.routeCity, { color: colors.foreground }]}>{booking.to}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: s.bg }]}>
          <Text style={[styles.statusText, { color: s.color }]}>{s.label}</Text>
        </View>
      </View>

      <View style={styles.bookingMeta}>
        <View style={styles.metaItem}>
          <Ionicons name="calendar-outline" size={13} color={colors.mutedForeground} />
          <Text style={[styles.metaText, { color: colors.mutedForeground }]}>{booking.date}</Text>
        </View>
        <View style={styles.metaItem}>
          <Ionicons name="car-outline" size={13} color={colors.mutedForeground} />
          <Text style={[styles.metaText, { color: colors.mutedForeground }]}>{booking.carrierName}</Text>
        </View>
        <Text style={[styles.price, { color: colors.primary }]}>MWK {booking.price.toLocaleString()}</Text>
      </View>

      {booking.status === "accepted" && (
        <View style={[styles.otpHint, { backgroundColor: colors.primary + "10", borderColor: colors.primary + "30" }]}>
          <Ionicons name="key-outline" size={13} color={colors.primary} />
          <Text style={[styles.otpHintText, { color: colors.primary }]}>
            Pickup code: {booking.pickupOtp} — show to carrier
          </Text>
        </View>
      )}

      <View style={styles.detailsBtn}>
        <Text style={[styles.detailsBtnText, { color: colors.primary }]}>View details →</Text>
      </View>
    </Pressable>
  );
}

export default function MyTripsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { myTrips, myParcels, bookings, refresh } = useAppData();
  const { showToast } = useToast();
  const { user } = useAuth();
  const [tab, setTab] = useState<TabType>("trips");
  const topPadding = Platform.OS === "web" ? insets.top + 67 : insets.top;

  if (!user) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.headerBar, { paddingTop: topPadding + 16, backgroundColor: colors.card }]}>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>My Activity</Text>
        </View>
        <View style={styles.center}>
          <Ionicons name="car-outline" size={52} color={colors.border} />
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Sign in to view your trips</Text>
          <Pressable onPress={() => router.push("/(auth)/login")} style={[styles.signInBtn, { backgroundColor: colors.primary }]}>
            <Text style={styles.signInText}>Sign In</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const myBookings = bookings.filter(
    (b) => b.requesterId === user.id || b.carrierId === user.id
  );

  const pendingBookingCount = myBookings.filter((b) => b.status === "pending").length;

  const renderParcelActions = (parcel: ParcelRequest) => {
    const statusColors: Record<ParcelRequest["status"], string> = {
      open: colors.mutedForeground,
      matched: colors.accent,
      in_transit: colors.info,
      delivered: colors.success,
    };
    const statusLabels: Record<ParcelRequest["status"], string> = {
      open: "Open",
      matched: "Matched",
      in_transit: "In Transit",
      delivered: "Delivered",
    };

    return (
      <View style={[styles.statusRow, { backgroundColor: statusColors[parcel.status] + "15" }]}>
        <View style={[styles.statusDot, { backgroundColor: statusColors[parcel.status] }]} />
        <Text style={[styles.statusText2, { color: statusColors[parcel.status] }]}>
          {statusLabels[parcel.status]}
        </Text>
        <Pressable
          onPress={() => router.push({ pathname: "/matched/[parcelId]", params: { parcelId: parcel.id } } as any)}
          style={[styles.matchBtn, { backgroundColor: colors.primary + "15" }]}
        >
          <Ionicons name="flash-outline" size={13} color={colors.primary} />
          <Text style={[styles.matchBtnText, { color: colors.primary }]}>
            {parcel.status === "open" ? "Find trips" : "View booking"}
          </Text>
        </Pressable>
        {parcel.status === "open" && (
          <Pressable
            onPress={async () => {
              try {
                await api.deleteParcel(parcel.id);
                await refresh();
                showToast("Parcel deleted", "info");
              } catch (e: any) {
                showToast(e?.message ?? "Failed to delete", "error");
              }
            }}
            style={[styles.matchBtn, { backgroundColor: colors.destructive + "15" }]}
          >
            <Ionicons name="trash-outline" size={13} color={colors.destructive} />
          </Pressable>
        )}
      </View>
    );
  };

  const tabData = {
    trips: myTrips,
    parcels: myParcels,
    bookings: myBookings,
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.headerBar, { paddingTop: topPadding + 16, backgroundColor: colors.card }]}>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>My Activity</Text>
      </View>

      <View style={[styles.tabs, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        {(["trips", "parcels", "bookings"] as TabType[]).map((t) => (
          <Pressable
            key={t}
            onPress={() => setTab(t)}
            style={[styles.tabBtn, tab === t && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
          >
            <View style={styles.tabLabelRow}>
              <Text style={[styles.tabText, { color: tab === t ? colors.primary : colors.mutedForeground }]}>
                {t === "trips" ? `Trips (${myTrips.length})` :
                 t === "parcels" ? `Parcels (${myParcels.length})` :
                 `Bookings`}
              </Text>
              {t === "bookings" && pendingBookingCount > 0 && (
                <View style={[styles.tabBadge, { backgroundColor: colors.accent }]}>
                  <Text style={styles.tabBadgeText}>{pendingBookingCount}</Text>
                </View>
              )}
            </View>
          </Pressable>
        ))}
      </View>

      {tab === "bookings" ? (
        <FlatList
          data={myBookings}
          keyExtractor={(b) => b.id}
          renderItem={({ item, index }) => (
            <AnimatedListItem index={index}>
              <BookingCard booking={item} />
            </AnimatedListItem>
          )}
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 100) }]}
          ListEmptyComponent={
            <View style={styles.center}>
              <Ionicons name="cube-outline" size={52} color={colors.border} />
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No bookings yet</Text>
              <Text style={[styles.emptySubtitle, { color: colors.mutedForeground }]}>
                Post a parcel and tap "Find trips" to book a carrier
              </Text>
            </View>
          }
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <FlatList
          data={(tab === "trips" ? myTrips : myParcels) as (Trip | ParcelRequest)[]}
          keyExtractor={(i) => i.id}
          renderItem={({ item, index }) => (
            <AnimatedListItem index={index}>
              <TripCard item={item as any} />
              {tab === "parcels" && renderParcelActions(item as ParcelRequest)}
            </AnimatedListItem>
          )}
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 100) }]}
          ListEmptyComponent={
            <View style={styles.center}>
              <Ionicons name={tab === "trips" ? "car-outline" : "cube-outline"} size={52} color={colors.border} />
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
                {tab === "trips" ? "No trips yet" : "No parcel requests yet"}
              </Text>
              <Text style={[styles.emptySubtitle, { color: colors.mutedForeground }]}>
                Tap the + button below to get started
              </Text>
            </View>
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerBar: { paddingHorizontal: 20, paddingBottom: 16 },
  headerTitle: { fontSize: 22, fontFamily: "Inter_700Bold" },
  tabs: { flexDirection: "row", borderBottomWidth: 1 },
  tabBtn: { flex: 1, alignItems: "center", paddingVertical: 12, borderBottomWidth: 2, borderBottomColor: "transparent" },
  tabLabelRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  tabText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  tabBadge: { width: 16, height: 16, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  tabBadgeText: { color: "#fff", fontSize: 9, fontFamily: "Inter_700Bold" },
  list: { paddingTop: 16 },
  statusRow: {
    flexDirection: "row", alignItems: "center",
    marginHorizontal: 16, marginTop: -8, marginBottom: 12,
    paddingHorizontal: 12, paddingVertical: 8,
    borderBottomLeftRadius: 12, borderBottomRightRadius: 12, gap: 8,
  },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText2: { fontSize: 13, fontFamily: "Inter_500Medium", flex: 1 },
  matchBtn: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  matchBtnText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  bookingCard: { marginHorizontal: 16, marginBottom: 12, borderRadius: 16, borderWidth: 1, padding: 16 },
  bookingHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  routeRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  routeCity: { fontSize: 15, fontFamily: "Inter_700Bold" },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  statusText: { fontSize: 12, fontFamily: "Inter_500Medium" },
  bookingMeta: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 10, flexWrap: "wrap" },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  metaText: { fontSize: 12, fontFamily: "Inter_400Regular" },
  price: { fontSize: 14, fontFamily: "Inter_700Bold", marginLeft: "auto" },
  otpHint: { flexDirection: "row", alignItems: "center", gap: 6, padding: 10, borderRadius: 10, borderWidth: 1, marginBottom: 10 },
  otpHintText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  detailsBtn: { alignItems: "flex-end" },
  detailsBtnText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  center: { alignItems: "center", justifyContent: "center", paddingTop: 80, gap: 12, paddingHorizontal: 40 },
  emptyTitle: { fontSize: 18, fontFamily: "Inter_600SemiBold" },
  emptySubtitle: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 20 },
  signInBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12, marginTop: 4 },
  signInText: { color: "#fff", fontSize: 15, fontFamily: "Inter_600SemiBold" },
});
