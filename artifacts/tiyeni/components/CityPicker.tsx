import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  Pressable, ScrollView, StyleSheet, Text,
  TextInput, View,
} from "react-native";
import { useColors } from "@/hooks/useColors";

const MALAWI_CITIES = [
  "Lilongwe", "Blantyre", "Mzuzu", "Zomba", "Salima",
  "Kasungu", "Mulanje", "Nkhata Bay", "Karonga", "Mangochi",
  "Dedza", "Ntcheu", "Balaka", "Liwonde", "Monkey Bay",
  "Nkhotakota", "Rumphi", "Chitipa", "Mchinji", "Dowa",
];

interface CityPickerProps {
  value: string;
  onChange: (city: string) => void;
  placeholder?: string;
  exclude?: string;
}

export function CityPicker({ value, onChange, placeholder = "Select city", exclude }: CityPickerProps) {
  const colors = useColors();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const filtered = MALAWI_CITIES.filter(
    (c) => c !== exclude && c.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <View>
      <Pressable
        onPress={() => setOpen(!open)}
        style={[styles.trigger, { backgroundColor: colors.card, borderColor: open ? colors.primary : colors.border }]}
      >
        <Ionicons name="location-outline" size={16} color={value ? colors.primary : colors.mutedForeground} />
        <Text style={[styles.triggerText, { color: value ? colors.foreground : colors.mutedForeground }]}>
          {value || placeholder}
        </Text>
        <Ionicons name={open ? "chevron-up" : "chevron-down"} size={16} color={colors.mutedForeground} />
      </Pressable>

      {open && (
        <View style={[styles.dropdown, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.searchRow, { borderBottomColor: colors.border }]}>
            <Ionicons name="search-outline" size={14} color={colors.mutedForeground} />
            <TextInput
              style={[styles.searchInput, { color: colors.foreground }]}
              value={query}
              onChangeText={setQuery}
              placeholder="Search city..."
              placeholderTextColor={colors.mutedForeground}
              autoFocus
            />
          </View>
          <ScrollView style={{ maxHeight: 200 }} keyboardShouldPersistTaps="handled" nestedScrollEnabled>
            {filtered.length === 0 ? (
              <Text style={[styles.noResults, { color: colors.mutedForeground }]}>No cities found</Text>
            ) : (
              filtered.map((city) => (
                <Pressable
                  key={city}
                  onPress={() => { onChange(city); setOpen(false); setQuery(""); }}
                  style={[styles.option, { borderBottomColor: colors.border }]}
                >
                  <Text style={[styles.optionText, { color: city === value ? colors.primary : colors.foreground }]}>
                    {city}
                  </Text>
                  {city === value && <Ionicons name="checkmark" size={16} color={colors.primary} />}
                </Pressable>
              ))
            )}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  trigger: {
    flexDirection: "row", alignItems: "center", gap: 10,
    borderWidth: 1.5, borderRadius: 14,
    paddingHorizontal: 16, paddingVertical: 14,
  },
  triggerText: { flex: 1, fontSize: 15, fontFamily: "Inter_400Regular" },
  dropdown: {
    borderWidth: 1, borderRadius: 14, marginTop: 4,
    overflow: "hidden", zIndex: 100,
  },
  searchRow: {
    flexDirection: "row", alignItems: "center", gap: 8,
    paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 1,
  },
  searchInput: { flex: 1, fontSize: 14, fontFamily: "Inter_400Regular" },
  option: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 13, borderBottomWidth: 1,
  },
  optionText: { fontSize: 15, fontFamily: "Inter_500Medium" },
  noResults: { padding: 16, fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center" },
});
