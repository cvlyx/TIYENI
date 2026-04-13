import { Ionicons } from "@expo/vector-icons";
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

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { trips, parcelRequests, unreadNotifications } = useAppData();
  const { user } = useAuth();
  const [filter, setFilter] = useState<FilterTab>("all");
  const [loading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const topPadding = Platform.OS === "web" ? insets.top + 67 : insets.top;

  const feedItems: FeedItem[] =
    filter === "trips"
      ? trips
      : filter === "parcels"
      ? parcelRequests
      : [...trips, ...parcelRequests].sort((a, b) => b.createdAt - a.createdAt);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1200);
  }, []);

  const renderItem = ({ item, index }: { item: FeedItem; index: number }) => (
    <AnimatedListItem index={index}>
      <TripCard item={item} />
    </AnimatedListItem>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPadding + 16, backgroundColor: colors.primary }]}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.greeting}>
              {user ? `Hello, ${user.name.split(" ")[0]}` : "Browse Tiyeni"}
            </Text>
            <Text style={styles.locationText}>
              <Ionicons name="location" size={13} color="rgba(255,255,255,0.8)" /> Malawi
            </Text>
          </View>
          <View style={styles.headerActions}>
            <Pressable
              onPress={() => router.push("/search/index" as any)}
              style={[styles.iconBtn, { backgroundColor: "rgba(255,255,255,0.15)" }]}
            >
              <Ionicons name="search" size={20} color="#fff" />
            </Pressable>
            <Pressable
              onPress={() => router.push("/notifications/index" as any)}
              style={[styles.iconBtn, { backgroundColor: "rgba(255,255,255,0.15)" }]}
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

        {/* Quick route browse chips */}
        <Pressable
          onPress={() => router.push("/routes/index" as any)}
          style={styles.routeBrowseBtn}
        >
          <Ionicons name="map-outline" size={14} color="rgba(255,255,255,0.9)" />
          <Text style={styles.routeBrowseText}>Browse popular routes →</Text>
        </Pressable>

        <View style={styles.filterRow}>
          {(["all", "trips", "parcels"] as FilterTab[]).map((tab) => (
            <Pressable
              key={tab}
              onPress={() => setFilter(tab)}
              style={[
                styles.filterTab,
                filter === tab && styles.filterTabActive,
              ]}
            >
              <Text
                style={[
                  styles.filterTabText,
                  { color: filter === tab ? colors.primary : "rgba(255,255,255,0.75)" },
                  filter === tab && styles.filterTabTextActive,
                ]}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {loading ? (
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
              <Ionicons name="search-outline" size={52} color={colors.border} />
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Nothing here yet</Text>
              <Text style={[styles.emptySubtitle, { color: colors.mutedForeground }]}>
                Be the first to post a trip or parcel request
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
  header: { paddingBottom: 0 },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  greeting: { color: "#fff", fontSize: 20, fontFamily: "Inter_700Bold", marginBottom: 2 },
  locationText: { color: "rgba(255,255,255,0.75)", fontSize: 13, fontFamily: "Inter_400Regular" },
  headerActions: { flexDirection: "row", gap: 10 },
  iconBtn: {
    width: 38, height: 38, borderRadius: 19,
    alignItems: "center", justifyContent: "center",
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
  routeBrowseBtn: {
    flexDirection: "row", alignItems: "center", gap: 6,
    marginHorizontal: 16, marginBottom: 12,
    paddingHorizontal: 14, paddingVertical: 8,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 20,
    alignSelf: "flex-start",
  },
  routeBrowseText: { color: "rgba(255,255,255,0.9)", fontSize: 13, fontFamily: "Inter_500Medium" },
  filterRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 8,
    paddingBottom: 14,
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  filterTabActive: { backgroundColor: "#fff" },
  filterTabText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  filterTabTextActive: { color: "#2E7D32", fontFamily: "Inter_600SemiBold" },
  skeletonList: { paddingTop: 16 },
  list: { paddingTop: 8 },
  emptyState: { alignItems: "center", justifyContent: "center", paddingTop: 80, gap: 12, paddingHorizontal: 40 },
  emptyTitle: { fontSize: 18, fontFamily: "Inter_600SemiBold" },
  emptySubtitle: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 20 },
});
