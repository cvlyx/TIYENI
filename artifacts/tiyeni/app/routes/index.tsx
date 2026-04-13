import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import {
  FlatList, Platform, Pressable,
  StyleSheet, Text, View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAppData } from "@/contexts/AppDataContext";
import { useColors } from "@/hooks/useColors";

const POPULAR_ROUTES = [
  { from: "Lilongwe", to: "Blantyre", distance: "310 km", avgPrice: 14000, emoji: "🛣️" },
  { from: "Blantyre", to: "Lilongwe", distance: "310 km", avgPrice: 14000, emoji: "🛣️" },
  { from: "Lilongwe", to: "Mzuzu", distance: "390 km", avgPrice: 20000, emoji: "🏔️" },
  { from: "Mzuzu", to: "Lilongwe", distance: "390 km", avgPrice: 20000, emoji: "🏔️" },
  { from: "Blantyre", to: "Zomba", distance: "60 km", avgPrice: 5000, emoji: "🌿" },
  { from: "Zomba", to: "Blantyre", distance: "60 km", avgPrice: 5000, emoji: "🌿" },
  { from: "Lilongwe", to: "Salima", distance: "100 km", avgPrice: 6000, emoji: "🌊" },
  { from: "Blantyre", to: "Mulanje", distance: "80 km", avgPrice: 5500, emoji: "⛰️" },
  { from: "Mzuzu", to: "Nkhata Bay", distance: "60 km", avgPrice: 4000, emoji: "🏖️" },
  { from: "Lilongwe", to: "Kasungu", distance: "122 km", avgPrice: 7000, emoji: "🌾" },
];

export default function RoutesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { trips, parcelRequests } = useAppData();
  const topPadding = Platform.OS === "web" ? insets.top + 67 : insets.top;

  const getRouteCounts = (from: string, to: string) => {
    const tripCount = trips.filter((t) => t.from === from && t.to === to).length;
    const parcelCount = parcelRequests.filter((p) => p.from === from && p.to === to && p.status === "open").length;
    return { tripCount, parcelCount };
  };

  const handleBrowseRoute = (from: string, to: string) => {
    router.push({ pathname: "/search/index", params: { from, to } } as any);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPadding + 12, backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Browse Routes</Text>
        <View style={{ width: 36 }} />
      </View>

      <FlatList
        data={POPULAR_ROUTES}
        keyExtractor={(r) => `${r.from}-${r.to}`}
        numColumns={1}
        contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: 100 }}
        ListHeaderComponent={
          <View style={[styles.infoCard, { backgroundColor: colors.primary + "10", borderColor: colors.primary + "30" }]}>
            <Ionicons name="map-outline" size={20} color={colors.primary} />
            <Text style={[styles.infoText, { color: colors.mutedForeground }]}>
              Browse popular corridors across Malawi. Tap a route to see live trips and parcel requests.
            </Text>
          </View>
        }
        renderItem={({ item: route }) => {
          const { tripCount, parcelCount } = getRouteCounts(route.from, route.to);
          return (
            <Pressable
              onPress={() => handleBrowseRoute(route.from, route.to)}
              style={({ pressed }) => [
                styles.routeCard,
                { backgroundColor: pressed ? colors.muted : colors.card, borderColor: colors.border },
              ]}
            >
              <View style={styles.routeEmoji}>
                <Text style={styles.emojiText}>{route.emoji}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.routeNameRow}>
                  <Text style={[styles.routeFrom, { color: colors.foreground }]}>{route.from}</Text>
                  <Ionicons name="arrow-forward" size={14} color={colors.mutedForeground} />
                  <Text style={[styles.routeFrom, { color: colors.foreground }]}>{route.to}</Text>
                </View>
                <View style={styles.routeMeta}>
                  <Text style={[styles.metaText, { color: colors.mutedForeground }]}>{route.distance}</Text>
                  <Text style={[styles.metaDot, { color: colors.border }]}>•</Text>
                  <Text style={[styles.metaText, { color: colors.mutedForeground }]}>
                    ~MWK {route.avgPrice.toLocaleString()}
                  </Text>
                </View>
                <View style={styles.countRow}>
                  {tripCount > 0 && (
                    <View style={[styles.countBadge, { backgroundColor: colors.primary + "15" }]}>
                      <Ionicons name="car-outline" size={11} color={colors.primary} />
                      <Text style={[styles.countText, { color: colors.primary }]}>{tripCount} trip{tripCount !== 1 ? "s" : ""}</Text>
                    </View>
                  )}
                  {parcelCount > 0 && (
                    <View style={[styles.countBadge, { backgroundColor: colors.accent + "15" }]}>
                      <Ionicons name="cube-outline" size={11} color={colors.accent} />
                      <Text style={[styles.countText, { color: colors.accent }]}>{parcelCount} parcel{parcelCount !== 1 ? "s" : ""}</Text>
                    </View>
                  )}
                  {tripCount === 0 && parcelCount === 0 && (
                    <Text style={[styles.noActivity, { color: colors.mutedForeground }]}>No active listings</Text>
                  )}
                </View>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.border} />
            </Pressable>
          );
        }}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingBottom: 14, borderBottomWidth: 1 },
  backBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  headerTitle: { flex: 1, fontSize: 18, fontFamily: "Inter_700Bold", textAlign: "center" },
  infoCard: { flexDirection: "row", gap: 12, padding: 14, borderRadius: 14, borderWidth: 1, marginBottom: 8, alignItems: "center" },
  infoText: { flex: 1, fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 18 },
  routeCard: { flexDirection: "row", alignItems: "center", gap: 14, padding: 16, borderRadius: 16, borderWidth: 1 },
  routeEmoji: { width: 44, height: 44, borderRadius: 14, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(0,0,0,0.05)" },
  emojiText: { fontSize: 22 },
  routeNameRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 3 },
  routeFrom: { fontSize: 15, fontFamily: "Inter_700Bold" },
  routeMeta: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 6 },
  metaText: { fontSize: 12, fontFamily: "Inter_400Regular" },
  metaDot: { fontSize: 12 },
  countRow: { flexDirection: "row", gap: 6, flexWrap: "wrap" },
  countBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  countText: { fontSize: 11, fontFamily: "Inter_500Medium" },
  noActivity: { fontSize: 12, fontFamily: "Inter_400Regular" },
});

