import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PressableButton } from "@/components/PressableButton";
import { useAppData } from "@/contexts/AppDataContext";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { useColors } from "@/hooks/useColors";

export default function OfferTripScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { addTrip } = useAppData();
  const { showToast } = useToast();

  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [seats, setSeats] = useState("1");
  const [parcelCapacity, setParcelCapacity] = useState(false);
  const [price, setPrice] = useState("");
  const [focus, setFocus] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const topPadding = Platform.OS === "web" ? insets.top + 67 : insets.top;
  const bottomPadding = Platform.OS === "web" ? insets.bottom + 34 : insets.bottom;

  const inputStyle = (field: string) => [
    styles.input,
    {
      borderColor: focus === field ? colors.primary : colors.border,
      backgroundColor: colors.card,
      color: colors.foreground,
    },
  ];

  const handleSubmit = async () => {
    if (!user) {
      router.push("/(auth)/login");
      return;
    }
    if (!from.trim() || !to.trim()) {
      showToast("Enter from and to locations", "error");
      return;
    }
    if (!date.trim()) {
      showToast("Enter the trip date", "error");
      return;
    }
    if (!time.trim()) {
      showToast("Enter the departure time", "error");
      return;
    }

    setIsLoading(true);
    try {
      await addTrip({
        userId: user.id,
        userName: user.name,
        userRating: user.rating,
        isVerified: user.role === "verified",
        from: from.trim(),
        to: to.trim(),
        date: date.trim(),
        time: time.trim(),
        seatsAvailable: parseInt(seats) || 1,
        parcelCapacity,
        price: price ? parseInt(price) : undefined,
        type: "trip",
      });
      showToast("Trip posted successfully!", "success");
      router.replace("/(tabs)/trips");
    } catch (e: any) {
      showToast(e?.message ?? "Failed to post trip", "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={[styles.header, { paddingTop: topPadding + 16, backgroundColor: colors.card }]}>
        <Pressable onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Offer a Trip</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: bottomPadding + 100 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.stepTitle, { color: colors.foreground }]}>Trip details</Text>

        <View style={styles.form}>
          <View style={styles.routeCard}>
            <View>
              <Text style={[styles.label, { color: colors.mutedForeground }]}>From</Text>
              <TextInput
                style={inputStyle("from")}
                placeholder="e.g. Lilongwe"
                placeholderTextColor={colors.mutedForeground}
                value={from}
                onChangeText={setFrom}
                onFocus={() => setFocus("from")}
                onBlur={() => setFocus(null)}
              />
            </View>
            <View style={styles.arrowCenter}>
              <Ionicons name="arrow-down" size={20} color={colors.primary} />
            </View>
            <View>
              <Text style={[styles.label, { color: colors.mutedForeground }]}>To</Text>
              <TextInput
                style={inputStyle("to")}
                placeholder="e.g. Blantyre"
                placeholderTextColor={colors.mutedForeground}
                value={to}
                onChangeText={setTo}
                onFocus={() => setFocus("to")}
                onBlur={() => setFocus(null)}
              />
            </View>
          </View>

          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.label, { color: colors.mutedForeground }]}>Date</Text>
              <TextInput
                style={inputStyle("date")}
                placeholder="2026-04-15"
                placeholderTextColor={colors.mutedForeground}
                value={date}
                onChangeText={setDate}
                onFocus={() => setFocus("date")}
                onBlur={() => setFocus(null)}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.label, { color: colors.mutedForeground }]}>Time</Text>
              <TextInput
                style={inputStyle("time")}
                placeholder="07:00"
                placeholderTextColor={colors.mutedForeground}
                value={time}
                onChangeText={setTime}
                onFocus={() => setFocus("time")}
                onBlur={() => setFocus(null)}
              />
            </View>
          </View>

          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.label, { color: colors.mutedForeground }]}>Seats available</Text>
              <TextInput
                style={inputStyle("seats")}
                placeholder="1"
                placeholderTextColor={colors.mutedForeground}
                value={seats}
                onChangeText={setSeats}
                onFocus={() => setFocus("seats")}
                onBlur={() => setFocus(null)}
                keyboardType="number-pad"
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.label, { color: colors.mutedForeground }]}>Price per seat (MWK)</Text>
              <TextInput
                style={inputStyle("price")}
                placeholder="Optional"
                placeholderTextColor={colors.mutedForeground}
                value={price}
                onChangeText={setPrice}
                onFocus={() => setFocus("price")}
                onBlur={() => setFocus(null)}
                keyboardType="numeric"
              />
            </View>
          </View>

          <View style={[styles.switchRow, { backgroundColor: colors.card }]}>
            <View style={styles.switchInfo}>
              <Ionicons name="cube-outline" size={20} color={colors.primary} />
              <View>
                <Text style={[styles.switchLabel, { color: colors.foreground }]}>Accept parcels</Text>
                <Text style={[styles.switchSub, { color: colors.mutedForeground }]}>
                  Allow users to send parcels with you
                </Text>
              </View>
            </View>
            <Switch
              value={parcelCapacity}
              onValueChange={setParcelCapacity}
              trackColor={{ true: colors.primary, false: colors.border }}
              thumbColor="#fff"
            />
          </View>
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: bottomPadding + 16, backgroundColor: colors.card }]}>
        <PressableButton
          label={isLoading ? "Posting..." : "Post Trip"}
          onPress={handleSubmit}
          disabled={isLoading}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  headerTitle: { flex: 1, fontSize: 17, fontFamily: "Inter_600SemiBold" },
  scroll: { paddingHorizontal: 16, paddingTop: 20 },
  stepTitle: { fontSize: 22, fontFamily: "Inter_700Bold", marginBottom: 20 },
  form: { gap: 16 },
  routeCard: { gap: 4 },
  label: { fontSize: 13, fontFamily: "Inter_500Medium", marginBottom: 8 },
  input: {
    borderWidth: 1.5,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
  },
  arrowCenter: { alignItems: "center", paddingVertical: 4 },
  row: { flexDirection: "row", gap: 12 },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderRadius: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  switchInfo: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
  switchLabel: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  switchSub: { fontSize: 12, fontFamily: "Inter_400Regular" },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 4,
  },
});
