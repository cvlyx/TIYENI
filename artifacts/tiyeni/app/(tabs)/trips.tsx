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
import { Trip, ParcelRequest, useAppData } from "@/contexts/AppDataContext";
import { useAuth } from "@/contexts/AuthContext";
import { useColors } from "@/hooks/useColors";

type TabType = "trips" | "parcels";

export default function MyTripsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { myTrips, myParcels, updateParcelStatus } = useAppData();
  const { user } = useAuth();
  const [tab, setTab] = useState<TabType>("trips");

  const topPadding = Platform.OS === "web" ? insets.top + 67 : insets.top;

  if (!user) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.headerBar, { paddingTop: topPadding + 16, backgroundColor: colors.card }]}>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>My Trips</Text>
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

  const items = tab === "trips"
    ? myTrips.map((t): { item: Trip | ParcelRequest; key: string } => ({ item: t, key: t.id }))
    : myParcels.map((p): { item: Trip | ParcelRequest; key: string } => ({ item: p, key: p.id }));

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
        <Text style={[styles.statusText, { color: statusColors[parcel.status] }]}>
          {statusLabels[parcel.status]}
        </Text>
        {parcel.status === "in_transit" && (
          <Pressable
            onPress={() => updateParcelStatus(parcel.id, "delivered")}
            style={[styles.confirmBtn, { backgroundColor: colors.success }]}
          >
            <Text style={styles.confirmBtnText}>Mark Delivered</Text>
          </Pressable>
        )}
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.headerBar, { paddingTop: topPadding + 16, backgroundColor: colors.card }]}>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>My Activity</Text>
      </View>

      <View style={[styles.tabs, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        {(["trips", "parcels"] as TabType[]).map((t) => (
          <Pressable
            key={t}
            onPress={() => setTab(t)}
            style={[styles.tabBtn, tab === t && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
          >
            <Text style={[styles.tabText, { color: tab === t ? colors.primary : colors.mutedForeground }]}>
              {t === "trips" ? `Trips (${myTrips.length})` : `Parcels (${myParcels.length})`}
            </Text>
          </Pressable>
        ))}
      </View>

      <FlatList
        data={items}
        keyExtractor={(i) => i.key}
        renderItem={({ item: { item }, index }) => (
          <AnimatedListItem index={index}>
            <TripCard item={item} />
            {item.type === "parcel" && renderParcelActions(item as ParcelRequest)}
          </AnimatedListItem>
        )}
        contentContainerStyle={[
          styles.list,
          { paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 100) },
        ]}
        ListEmptyComponent={
          <View style={styles.center}>
            <Ionicons name={tab === "trips" ? "car-outline" : "cube-outline"} size={52} color={colors.border} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
              {tab === "trips" ? "No trips yet" : "No parcel requests yet"}
            </Text>
            <Text style={[styles.emptySubtitle, { color: colors.mutedForeground }]}>
              Tap the Post button below to get started
            </Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerBar: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  headerTitle: { fontSize: 22, fontFamily: "Inter_700Bold" },
  tabs: {
    flexDirection: "row",
    borderBottomWidth: 1,
  },
  tabBtn: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  list: { paddingTop: 16 },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginTop: -8,
    marginBottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    gap: 8,
  },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontSize: 13, fontFamily: "Inter_500Medium", flex: 1 },
  confirmBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  confirmBtnText: { color: "#fff", fontSize: 12, fontFamily: "Inter_600SemiBold" },
  center: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 80,
    gap: 12,
    paddingHorizontal: 40,
  },
  emptyTitle: { fontSize: 18, fontFamily: "Inter_600SemiBold" },
  emptySubtitle: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 20 },
  signInBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12, marginTop: 4 },
  signInText: { color: "#fff", fontSize: 15, fontFamily: "Inter_600SemiBold" },
});
