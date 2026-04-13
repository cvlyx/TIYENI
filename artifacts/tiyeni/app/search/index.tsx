import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  FlatList, Platform, Pressable, ScrollView,
  StyleSheet, Text, TextInput, View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AnimatedListItem } from "@/components/AnimatedListItem";
import { TripCard } from "@/components/TripCard";
import { FeedItem, useAppData } from "@/contexts/AppDataContext";
import { useColors } from "@/hooks/useColors";

const CITIES = ["Lilongwe", "Blantyre", "Mzuzu", "Zomba", "Salima", "Kasungu", "Mulanje", "Nkhata Bay", "Karonga", "Mangochi"];
const SIZE_OPTS = ["Any", "small", "medium", "large", "extra-large"] as const;
type SizeOpt = typeof SIZE_OPTS[number];

export default function SearchScreen() {
  const { from: initFrom, to: initTo } = useLocalSearchParams<{ from?: string; to?: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { trips, parcelRequests } = useAppData();
  const [query, setQuery] = useState("");
  const [fromCity, setFromCity] = useState(initFrom || "");
  const [toCity, setToCity] = useState(initTo || "");
  const [typeFilter, setTypeFilter] = useState<"all" | "trips" | "parcels">("all");
  const [sizeFilter, setSizeFilter] = useState<SizeOpt>("Any");
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);
  const topPadding = Platform.OS === "web" ? insets.top + 67 : insets.top;

  const allItems: FeedItem[] = useMemo(() => {
    return [...trips, ...parcelRequests].sort((a, b) => b.createdAt - a.createdAt);
  }, [trips, parcelRequests]);

  const filtered = useMemo(() => {
    return allItems.filter((item) => {
      if (typeFilter === "trips" && item.type !== "trip") return false;
      if (typeFilter === "parcels" && item.type !== "parcel") return false;
      if (fromCity && item.from.toLowerCase() !== fromCity.toLowerCase()) return false;
      if (toCity && item.to.toLowerCase() !== toCity.toLowerCase()) return false;
      if (verifiedOnly && !item.isVerified) return false;
      if (query) {
        const q = query.toLowerCase();
        if (!item.from.toLowerCase().includes(q) && !item.to.toLowerCase().includes(q) && !item.userName.toLowerCase().includes(q)) return false;
      }
      if (sizeFilter !== "Any" && item.type === "parcel" && (item as any).parcelSize !== sizeFilter) return false;
      return true;
    });
  }, [allItems, typeFilter, fromCity, toCity, verifiedOnly, query, sizeFilter]);

  const CityPicker = ({ value, onChange, onClose, exclude }: { value: string; onChange: (c: string) => void; onClose: () => void; exclude?: string }) => (
    <View style={[styles.cityPicker, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.pickerHeader}>
        <Text style={[styles.pickerTitle, { color: colors.foreground }]}>Select City</Text>
        <Pressable onPress={onClose}><Ionicons name="close" size={20} color={colors.foreground} /></Pressable>
      </View>
      {CITIES.filter((c) => c !== exclude).map((city) => (
        <Pressable key={city} onPress={() => { onChange(city); onClose(); }} style={[styles.cityOption, { borderBottomColor: colors.border }]}>
          <Text style={[styles.cityOptionText, { color: value === city ? colors.primary : colors.foreground }]}>{city}</Text>
          {value === city && <Ionicons name="checkmark" size={16} color={colors.primary} />}
        </Pressable>
      ))}
      <Pressable onPress={() => { onChange(""); onClose(); }} style={[styles.cityOption, { borderBottomColor: "transparent" }]}>
        <Text style={[styles.cityOptionText, { color: colors.mutedForeground }]}>Any city</Text>
      </Pressable>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPadding + 12, backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.foreground} />
        </Pressable>
        <View style={[styles.searchBar, { backgroundColor: colors.input, borderColor: colors.border }]}>
          <Ionicons name="search-outline" size={16} color={colors.mutedForeground} />
          <TextInput
            style={[styles.searchInput, { color: colors.foreground }]}
            value={query}
            onChangeText={setQuery}
            placeholder="Search people, cities..."
            placeholderTextColor={colors.mutedForeground}
          />
          {query.length > 0 && (
            <Pressable onPress={() => setQuery("")}>
              <Ionicons name="close-circle" size={16} color={colors.mutedForeground} />
            </Pressable>
          )}
        </View>
      </View>

      {/* Filters */}
      <View style={[styles.filterBar, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        {/* From / To pickers */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {/* Type */}
          {(["all", "trips", "parcels"] as const).map((t) => (
            <Pressable
              key={t}
              onPress={() => setTypeFilter(t)}
              style={[styles.chip, { backgroundColor: typeFilter === t ? colors.primary : colors.muted, borderColor: typeFilter === t ? colors.primary : colors.border }]}
            >
              <Text style={[styles.chipText, { color: typeFilter === t ? "#fff" : colors.foreground }]}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </Text>
            </Pressable>
          ))}

          {/* From */}
          <Pressable
            onPress={() => { setShowFromPicker(!showFromPicker); setShowToPicker(false); }}
            style={[styles.chip, { backgroundColor: fromCity ? colors.primary + "15" : colors.muted, borderColor: fromCity ? colors.primary : colors.border }]}
          >
            <Ionicons name="location-outline" size={12} color={fromCity ? colors.primary : colors.mutedForeground} />
            <Text style={[styles.chipText, { color: fromCity ? colors.primary : colors.foreground }]}>{fromCity || "From"}</Text>
          </Pressable>

          {/* To */}
          <Pressable
            onPress={() => { setShowToPicker(!showToPicker); setShowFromPicker(false); }}
            style={[styles.chip, { backgroundColor: toCity ? colors.primary + "15" : colors.muted, borderColor: toCity ? colors.primary : colors.border }]}
          >
            <Ionicons name="flag-outline" size={12} color={toCity ? colors.primary : colors.mutedForeground} />
            <Text style={[styles.chipText, { color: toCity ? colors.primary : colors.foreground }]}>{toCity || "To"}</Text>
          </Pressable>

          {/* Verified */}
          <Pressable
            onPress={() => setVerifiedOnly(!verifiedOnly)}
            style={[styles.chip, { backgroundColor: verifiedOnly ? colors.primary + "15" : colors.muted, borderColor: verifiedOnly ? colors.primary : colors.border }]}
          >
            <Ionicons name="shield-checkmark-outline" size={12} color={verifiedOnly ? colors.primary : colors.mutedForeground} />
            <Text style={[styles.chipText, { color: verifiedOnly ? colors.primary : colors.foreground }]}>Verified</Text>
          </Pressable>
        </ScrollView>
      </View>

      {/* City pickers */}
      {showFromPicker && (
        <View style={[StyleSheet.absoluteFill, styles.pickerOverlay]} pointerEvents="box-none">
          <CityPicker value={fromCity} onChange={setFromCity} onClose={() => setShowFromPicker(false)} exclude={toCity} />
        </View>
      )}
      {showToPicker && (
        <View style={[StyleSheet.absoluteFill, styles.pickerOverlay]} pointerEvents="box-none">
          <CityPicker value={toCity} onChange={setToCity} onClose={() => setShowToPicker(false)} exclude={fromCity} />
        </View>
      )}

      {/* Results */}
      <FlatList
        data={filtered}
        keyExtractor={(i) => i.id}
        renderItem={({ item, index }) => (
          <AnimatedListItem index={index}>
            <TripCard item={item} />
          </AnimatedListItem>
        )}
        contentContainerStyle={{ paddingTop: 8, paddingBottom: 100 }}
        ListHeaderComponent={
          <View style={styles.resultCount}>
            <Text style={[styles.resultText, { color: colors.mutedForeground }]}>
              {filtered.length} result{filtered.length !== 1 ? "s" : ""}
              {(fromCity || toCity) && ` · ${fromCity || "Any"} → ${toCity || "Any"}`}
            </Text>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="search-outline" size={48} color={colors.border} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No results</Text>
            <Text style={[styles.emptyBody, { color: colors.mutedForeground }]}>
              Try adjusting your filters or search term
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
  header: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 12, paddingBottom: 12, borderBottomWidth: 1 },
  backBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  searchBar: { flex: 1, flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12, borderWidth: 1 },
  searchInput: { flex: 1, fontSize: 14, fontFamily: "Inter_400Regular" },
  filterBar: { borderBottomWidth: 1 },
  filterScroll: { paddingHorizontal: 12, paddingVertical: 10, gap: 8 },
  chip: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1 },
  chipText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  resultCount: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4 },
  resultText: { fontSize: 13, fontFamily: "Inter_400Regular" },
  empty: { alignItems: "center", justifyContent: "center", paddingTop: 60, gap: 12, paddingHorizontal: 40 },
  emptyTitle: { fontSize: 18, fontFamily: "Inter_600SemiBold" },
  emptyBody: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 20 },
  pickerOverlay: { zIndex: 100, padding: 16, justifyContent: "flex-start", top: 110 },
  cityPicker: { borderRadius: 16, borderWidth: 1, overflow: "hidden", maxHeight: 360 },
  pickerHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 16, borderBottomWidth: 1 },
  pickerTitle: { fontSize: 16, fontFamily: "Inter_700Bold" },
  cityOption: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1 },
  cityOptionText: { fontSize: 15, fontFamily: "Inter_500Medium" },
});
