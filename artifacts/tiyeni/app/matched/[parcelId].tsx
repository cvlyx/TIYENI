import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React from "react";
import {
  FlatList, Platform, Pressable,
  StyleSheet, Text, View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAppData } from "@/contexts/AppDataContext";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { useColors } from "@/hooks/useColors";
import { StarRating } from "@/components/StarRating";
import { VerifiedBadge } from "@/components/VerifiedBadge";

export default function MatchedTripsScreen() {
  const { parcelId } = useLocalSearchParams<{ parcelId: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { parcelRequests, myParcels, getMatchedTrips, createBooking } = useAppData();
  const { showToast } = useToast();
  const topPadding = Platform.OS === "web" ? insets.top + 67 : insets.top;

  const parcel =
    [...parcelRequests, ...myParcels].find((p) => p.id === parcelId);
  const matchedTrips = parcel ? getMatchedTrips(parcel) : [];

  const handleBook = async (tripId: string) => {
    if (!user || !parcel) {
      showToast("Sign in to book", "error");
      return;
    }
    const trip = matchedTrips.find((t) => t.id === tripId);
    if (!trip) return;
    const booking = await createBooking(tripId, parcel.id, trip, parcel, user.id, user.name);
    showToast("Booking request sent!", "success");
    router.push({ pathname: "/booking/[id]", params: { id: booking.id } } as any);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPadding + 12, backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.foreground} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Matched Trips</Text>
          {parcel && (
            <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>
              {parcel.from} → {parcel.to}
            </Text>
          )}
        </View>
      </View>

      {matchedTrips.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="search-outline" size={52} color={colors.border} />
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No matches yet</Text>
          <Text style={[styles.emptyBody, { color: colors.mutedForeground }]}>
            No trips going {parcel?.from} → {parcel?.to} right now.{"\n"}Check back soon!
          </Text>
        </View>
      ) : (
        <FlatList
          data={matchedTrips}
          keyExtractor={(t) => t.id}
          contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 100 }}
          renderItem={({ item: trip }) => (
            <View style={[styles.tripCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.tripTop}>
                <View style={styles.userRow}>
                  <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
                    <Text style={styles.avatarText}>{trip.userName[0]}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={styles.nameRow}>
                      <Text style={[styles.userName, { color: colors.foreground }]}>{trip.userName}</Text>
                      {trip.isVerified && <VerifiedBadge size="sm" />}
                    </View>
                    <StarRating rating={trip.userRating} size={12} />
                  </View>
                  <View style={[styles.priceBadge, { backgroundColor: colors.primary + "15" }]}>
                    <Text style={[styles.priceText, { color: colors.primary }]}>
                      MWK {(trip.price || 0).toLocaleString()}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.detailRow}>
                <View style={styles.detail}>
                  <Ionicons name="calendar-outline" size={14} color={colors.mutedForeground} />
                  <Text style={[styles.detailText, { color: colors.mutedForeground }]}>{trip.date} at {trip.time}</Text>
                </View>
                <View style={styles.detail}>
                  <Ionicons name="people-outline" size={14} color={colors.mutedForeground} />
                  <Text style={[styles.detailText, { color: colors.mutedForeground }]}>{trip.seatsAvailable} seats</Text>
                </View>
                <View style={[styles.parcelBadge, { backgroundColor: colors.success + "15" }]}>
                  <Ionicons name="cube-outline" size={12} color={colors.success} />
                  <Text style={[styles.detailText, { color: colors.success }]}>Parcels OK</Text>
                </View>
              </View>

              {trip.notes && (
                <Text style={[styles.notes, { color: colors.mutedForeground }]}>{trip.notes}</Text>
              )}

              <Pressable
                onPress={() => handleBook(trip.id)}
                style={[styles.bookBtn, { backgroundColor: colors.primary }]}
              >
                <Text style={styles.bookBtnText}>Request This Trip</Text>
              </Pressable>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 16, paddingBottom: 14, borderBottomWidth: 1,
  },
  backBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center", marginRight: 8 },
  headerTitle: { fontSize: 18, fontFamily: "Inter_700Bold" },
  headerSub: { fontSize: 13, fontFamily: "Inter_400Regular", marginTop: 1 },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 40, gap: 12 },
  emptyTitle: { fontSize: 18, fontFamily: "Inter_600SemiBold" },
  emptyBody: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 20 },
  tripCard: { borderRadius: 16, borderWidth: 1, padding: 16 },
  tripTop: { marginBottom: 12 },
  userRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  avatar: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  avatarText: { color: "#fff", fontSize: 16, fontFamily: "Inter_700Bold" },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 2 },
  userName: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  priceBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  priceText: { fontSize: 13, fontFamily: "Inter_700Bold" },
  detailRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 12 },
  detail: { flexDirection: "row", alignItems: "center", gap: 4 },
  parcelBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  detailText: { fontSize: 12, fontFamily: "Inter_400Regular" },
  notes: { fontSize: 13, fontFamily: "Inter_400Regular", marginBottom: 12, fontStyle: "italic" },
  bookBtn: { paddingVertical: 13, borderRadius: 12, alignItems: "center" },
  bookBtnText: { color: "#fff", fontSize: 15, fontFamily: "Inter_600SemiBold" },
});
