import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useState, useCallback } from "react";
import {
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AnimatedListItem } from "@/components/AnimatedListItem";
import { SkeletonCard } from "@/components/SkeletonCard";
import { TripCard } from "@/components/TripCard";
import { FeedItem, useAppData } from "@/contexts/AppDataContext";
import { useAuth } from "@/contexts/AuthContext";
import { useColors } from "@/hooks/useColors";

type FilterTab = "all" | "trips" | "parcels";

const FILTER_ICONS: Record<FilterTab, string> = {
  all: "apps-outline",
  trips: "car-outline",
  parcels: "cube-outline",
};

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { trips, parcelRequests, unreadNotifications, refresh, isLoading } = useAppData();
  const { user } = useAuth();
  const [filter, setFilter] = useState<FilterTab>("all");
  const [refreshing, setRefreshing] = useState(false);
  const topPadding = Platform.OS === "web" ? insets.top + 67 : insets.top;

  const feedItems: FeedItem[] =
    filter === "trips"
      ? trips
      : filter === "parcels"
      ? parcelRequests
      : [...trips, ...parcelRequests].sort((a, b) => b.createdAt - a.createdAt);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh().catch(() => {});
    setRefreshing(false);
  }, [refresh]);

  const renderItem = ({ item, index }: { item: FeedItem; index: number }) => (
    <AnimatedListItem index={index}>
      <TripCard item={item} />
    </AnimatedListItem>
  );

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header with gradient */}
      <LinearGradient
        colors={["#059669", "#10B981", "#34D399"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: topPadding + 16 }]}
      >
        <View style={styles.headerTop}>
          <View style={styles.greetingCol}>
            <Text style={styles.greetingSmall}>{greeting} 👋</Text>
            <Text style={styles.greeting}>
              {user ? user.name.split(" ")[0] : "Tiyeni"}
            </Text>
            <View style={styles.locationRow}>
              <Ionicons name="location" size={12} color="rgba(255,255,255,0.85)" />
              <Text style={styles.locationText}>Malawi</Text>
            </View>
          </View>
          <View style={styles.headerActions}>
            <Pressable
              onPress={() => router.push("/search" as any)}
              style={styles.iconBtn}
            >
              <Ionicons name="search" size={20} color="#fff" />
            </Pressable>
            <Pressable
              onPress={() => router.push("/notifications" as any)}
              style={styles.iconBtn}
            >
              <Ionicons name="notifications-outline" size={20} color="#fff" />
              {unreadNotifications > 0 && (
                <View style={styles.notifBadge}>
                  <Text style={styles.notifBadgeText}>
                    {unreadNotifications > 9 ? "9+" : unreadNotifications}
                  </Text>
                </View>
              )}
            </Pressable>
          </View>
        </View>

        {/* Quick action */}
        <Pressable
          onPress={() => router.push("/search" as any)}
          style={styles.searchBar}
        >
          <Ionicons name="search-outline" size={16} color="rgba(255,255,255,0.7)" />
          <Text style={styles.searchBarTxt}>Search trips or parcels...</Text>
        </Pressable>

        {/* Filter tabs */}
        <View style={styles.filterRow}>
          {(["all", "trips", "parcels"] as FilterTab[]).map((tab) => (
            <Pressable
              key={tab}
              onPress={() => setFilter(tab)}
              style={[styles.filterTab, filter === tab && styles.filterTabActive]}
            >
              <Ionicons
                name={FILTER_ICONS[tab] as any}
                size={14}
                color={filter === tab ? "#059669" : "rgba(255,255,255,0.8)"}
              />
              <Text
                style={[
                  styles.filterTabText,
                  filter === tab && styles.filterTabTextActive,
                ]}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
            </Pressable>
          ))}
        </View>
      </LinearGradient>

      {isLoading && !refreshing ? (
        <View style={styles.skeletonList}>
          {[0, 1, 2].map((i) => <SkeletonCard key={i} />)}
        </View>
      ) : (
        <FlatList
          data={feedItems}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
          contentContainerStyle={[
            styles.list,
            { paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 100) },
          ]}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <View style={[styles.emptyIcon, { backgroundColor: colors.secondary }]}>
                <Ionicons name="map-outline" size={40} color={colors.primary} />
              </View>
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No listings yet</Text>
              <Text style={[styles.emptySubtitle, { color: colors.mutedForeground }]}>
                Be the first to post a trip or parcel request
              </Text>
              <Pressable
                onPress={() => router.push("/(post)/" as any)}
                style={[styles.emptyBtn, { backgroundColor: colors.primary }]}
              >
                <Text style={styles.emptyBtnTxt}>Post now</Text>
              </Pressable>
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
  header: { paddingBottom: 0 },
  headerTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    marginBottom: 14,
  },
  greetingCol: { gap: 2 },
  greetingSmall: { color: "rgba(255,255,255,0.8)", fontSize: 13, fontFamily: "Inter_400Regular" },
  greeting: { color: "#fff", fontSize: 22, fontFamily: "Inter_700Bold", letterSpacing: -0.3 },
  locationRow: { flexDirection: "row", alignItems: "center", gap: 3, marginTop: 2 },
  locationText: { color: "rgba(255,255,255,0.8)", fontSize: 12, fontFamily: "Inter_400Regular" },
  headerActions: { flexDirection: "row", gap: 10, marginTop: 4 },
  iconBtn: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: "center", justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.18)",
    position: "relative",
  },
  notifBadge: {
    position: "absolute", top: -2, right: -2,
    minWidth: 16, height: 16, borderRadius: 8,
    backgroundColor: "#EF4444",
    alignItems: "center", justifyContent: "center",
    paddingHorizontal: 3,
  },
  notifBadgeText: { color: "#fff", fontSize: 9, fontFamily: "Inter_700Bold" },

  // Search bar
  searchBar: {
    flexDirection: "row", alignItems: "center", gap: 10,
    marginHorizontal: 18, marginBottom: 14,
    paddingHorizontal: 16, paddingVertical: 11,
    backgroundColor: "rgba(255,255,255,0.18)",
    borderRadius: 14,
    borderWidth: 1, borderColor: "rgba(255,255,255,0.25)",
  },
  searchBarTxt: { color: "rgba(255,255,255,0.7)", fontSize: 14, fontFamily: "Inter_400Regular" },

  // Filter
  filterRow: {
    flexDirection: "row",
    paddingHorizontal: 18,
    gap: 8,
    paddingBottom: 16,
  },
  filterTab: {
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  filterTabActive: { backgroundColor: "#fff" },
  filterTabText: { fontSize: 13, fontFamily: "Inter_500Medium", color: "rgba(255,255,255,0.85)" },
  filterTabTextActive: { color: "#059669", fontFamily: "Inter_600SemiBold" },

  skeletonList: { paddingTop: 16 },
  list: { paddingTop: 10 },
  emptyState: { alignItems: "center", justifyContent: "center", paddingTop: 80, gap: 14, paddingHorizontal: 40 },
  emptyIcon: { width: 80, height: 80, borderRadius: 24, alignItems: "center", justifyContent: "center" },
  emptyTitle: { fontSize: 18, fontFamily: "Inter_600SemiBold" },
  emptySubtitle: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 20 },
  emptyBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 14, marginTop: 4 },
  emptyBtnTxt: { color: "#fff", fontSize: 15, fontFamily: "Inter_600SemiBold" },
});

