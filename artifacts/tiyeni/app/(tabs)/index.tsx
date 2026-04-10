import { Ionicons } from "@expo/vector-icons";
import React, { useState, useCallback } from "react";
import {
  FlatList,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
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
  const { trips, parcelRequests } = useAppData();
  const { user } = useAuth();
  const [filter, setFilter] = useState<FilterTab>("all");
  const [loading, setLoading] = useState(false);
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
            <TouchableOpacity style={[styles.iconBtn, { backgroundColor: "rgba(255,255,255,0.15)" }]}>
              <Ionicons name="search" size={20} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.iconBtn, { backgroundColor: "rgba(255,255,255,0.15)" }]}>
              <Ionicons name="notifications-outline" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.filterRow}>
          {(["all", "trips", "parcels"] as FilterTab[]).map((tab) => (
            <TouchableOpacity
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
                  filter === tab && styles.filterTabTextActive,
                ]}
              >
                {tab === "all" ? "All" : tab === "trips" ? "Trips" : "Parcels"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {loading ? (
        <View style={styles.skeletons}>
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </View>
      ) : (
        <FlatList
          data={feedItems}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={[
            styles.list,
            { paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 100) },
          ]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="car-outline" size={48} color={colors.border} />
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                No listings yet. Be the first to post!
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
  header: {
    paddingHorizontal: 20,
    paddingBottom: 0,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  greeting: {
    color: "#fff",
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    marginBottom: 2,
  },
  locationText: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  headerActions: { flexDirection: "row", gap: 8 },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  filterRow: {
    flexDirection: "row",
    gap: 4,
    paddingBottom: 0,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderBottomWidth: 3,
    borderBottomColor: "transparent",
  },
  filterTabActive: {
    borderBottomColor: "#fff",
  },
  filterTabText: {
    color: "rgba(255,255,255,0.65)",
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
  filterTabTextActive: {
    color: "#fff",
    fontFamily: "Inter_700Bold",
  },
  list: { paddingTop: 16 },
  skeletons: { paddingTop: 16 },
  empty: {
    alignItems: "center",
    paddingTop: 80,
    gap: 12,
  },
  emptyText: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    maxWidth: 240,
  },
});
