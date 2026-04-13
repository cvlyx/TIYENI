import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PressableButton } from "@/components/PressableButton";
import { useAppData, ParcelSize } from "@/contexts/AppDataContext";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { useColors } from "@/hooks/useColors";

const SIZES: { value: ParcelSize; label: string; desc: string; icon: string }[] = [
  { value: "small", label: "Small", desc: "Envelope, phone, docs", icon: "mail-outline" },
  { value: "medium", label: "Medium", desc: "Shoes, small electronics", icon: "cube-outline" },
  { value: "large", label: "Large", desc: "Luggage, clothes bag", icon: "briefcase-outline" },
  { value: "extra-large", label: "Extra Large", desc: "TV, furniture piece", icon: "file-tray-full-outline" },
];

const STEPS = ["Location", "Details", "Price"];

export default function SendParcelScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { addParcelRequest } = useAppData();
  const { showToast } = useToast();

  const [step, setStep] = useState(0);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [size, setSize] = useState<ParcelSize>("medium");
  const [notes, setNotes] = useState("");
  const [deadline, setDeadline] = useState("");
  const [price, setPrice] = useState("");
  const [focus, setFocus] = useState<string | null>(null);

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

  const handleNext = () => {
    if (step === 0) {
      if (!from.trim() || !to.trim()) {
        showToast("Enter pickup and drop-off locations", "error");
        return;
      }
    }
    if (step === 1) {
      if (!deadline.trim()) {
        showToast("Enter a deadline date (e.g. 2026-04-15)", "error");
        return;
      }
    }
    if (step < 2) {
      setStep((s) => s + 1);
    } else {
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    if (!user) {
      router.push("/(auth)/login");
      return;
    }
    try {
      await addParcelRequest({
        userId: user.id,
        userName: user.name,
        userRating: user.rating,
        isVerified: user.role === "verified",
        from: from.trim(),
        to: to.trim(),
        deadline: deadline.trim(),
        parcelSize: size,
        notes: notes.trim(),
        price: price ? parseInt(price) : undefined,
        type: "parcel",
        status: "open",
      });
      showToast("Parcel request posted!", "success");
      router.replace("/(tabs)/trips");
    } catch (e: any) {
      showToast(e?.message ?? "Failed to post parcel", "error");
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={[styles.header, { paddingTop: topPadding + 16, backgroundColor: colors.card }]}>
        <Pressable onPress={() => (step > 0 ? setStep((s) => s - 1) : router.back())}>
          <Ionicons name={step > 0 ? "arrow-back" : "close"} size={24} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Send a Parcel</Text>
        <Text style={[styles.stepIndicator, { color: colors.mutedForeground }]}>
          {step + 1} / {STEPS.length}
        </Text>
      </View>

      <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
        <View
          style={[
            styles.progressFill,
            { backgroundColor: colors.primary, width: `${((step + 1) / STEPS.length) * 100}%` },
          ]}
        />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: bottomPadding + 40 }]}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={[styles.stepTitle, { color: colors.foreground }]}>{STEPS[step]}</Text>

        {step === 0 && (
          <View style={styles.form}>
            <View>
              <Text style={[styles.label, { color: colors.mutedForeground }]}>Pickup location</Text>
              <TextInput
                style={inputStyle("from")}
                placeholder="e.g. Lilongwe, Area 18"
                placeholderTextColor={colors.mutedForeground}
                value={from}
                onChangeText={setFrom}
                onFocus={() => setFocus("from")}
                onBlur={() => setFocus(null)}
              />
            </View>
            <View style={styles.arrowRow}>
              <Ionicons name="arrow-down" size={20} color={colors.primary} />
            </View>
            <View>
              <Text style={[styles.label, { color: colors.mutedForeground }]}>Drop-off location</Text>
              <TextInput
                style={inputStyle("to")}
                placeholder="e.g. Blantyre, Limbe"
                placeholderTextColor={colors.mutedForeground}
                value={to}
                onChangeText={setTo}
                onFocus={() => setFocus("to")}
                onBlur={() => setFocus(null)}
              />
            </View>
          </View>
        )}

        {step === 1 && (
          <View style={styles.form}>
            <Text style={[styles.label, { color: colors.mutedForeground }]}>Parcel size</Text>
            <View style={styles.sizeGrid}>
              {SIZES.map((s) => (
                <Pressable
                  key={s.value}
                  onPress={() => setSize(s.value)}
                  style={[
                    styles.sizeCard,
                    {
                      borderColor: size === s.value ? colors.primary : colors.border,
                      backgroundColor: size === s.value ? colors.primary + "10" : colors.card,
                    },
                  ]}
                >
                  <Ionicons name={s.icon as any} size={22} color={size === s.value ? colors.primary : colors.mutedForeground} />
                  <Text style={[styles.sizeLabel, { color: size === s.value ? colors.primary : colors.foreground }]}>
                    {s.label}
                  </Text>
                  <Text style={[styles.sizeDesc, { color: colors.mutedForeground }]}>{s.desc}</Text>
                </Pressable>
              ))}
            </View>
            <View>
              <Text style={[styles.label, { color: colors.mutedForeground }]}>Special instructions (optional)</Text>
              <TextInput
                style={[inputStyle("notes"), styles.textarea]}
                placeholder="e.g. Fragile item, keep upright"
                placeholderTextColor={colors.mutedForeground}
                value={notes}
                onChangeText={setNotes}
                onFocus={() => setFocus("notes")}
                onBlur={() => setFocus(null)}
                multiline
                numberOfLines={3}
              />
            </View>
          </View>
        )}

        {step === 2 && (
          <View style={styles.form}>
            <View>
              <Text style={[styles.label, { color: colors.mutedForeground }]}>Deadline (YYYY-MM-DD)</Text>
              <TextInput
                style={inputStyle("deadline")}
                placeholder="e.g. 2026-04-15"
                placeholderTextColor={colors.mutedForeground}
                value={deadline}
                onChangeText={setDeadline}
                onFocus={() => setFocus("deadline")}
                onBlur={() => setFocus(null)}
              />
            </View>
            <View>
              <Text style={[styles.label, { color: colors.mutedForeground }]}>Offered price in MWK (optional)</Text>
              <TextInput
                style={inputStyle("price")}
                placeholder="e.g. 8000"
                placeholderTextColor={colors.mutedForeground}
                value={price}
                onChangeText={setPrice}
                onFocus={() => setFocus("price")}
                onBlur={() => setFocus(null)}
                keyboardType="numeric"
              />
            </View>

            <View style={[styles.summary, { backgroundColor: colors.secondary }]}>
              <Text style={[styles.summaryTitle, { color: colors.primary }]}>Summary</Text>
              <Text style={[styles.summaryText, { color: colors.foreground }]}>
                {from} → {to}
              </Text>
              <Text style={[styles.summaryText, { color: colors.mutedForeground }]}>
                {SIZES.find((s) => s.value === size)?.label} parcel
                {price ? ` • MWK ${parseInt(price).toLocaleString()}` : ""}
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: bottomPadding + 16, backgroundColor: colors.card }]}>
        <PressableButton
          label={step < 2 ? "Continue" : "Post Request"}
          onPress={handleNext}
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
  },
  headerTitle: { flex: 1, fontSize: 17, fontFamily: "Inter_600SemiBold" },
  stepIndicator: { fontSize: 13, fontFamily: "Inter_500Medium" },
  progressBar: { height: 3 },
  progressFill: { height: "100%", borderRadius: 2 },
  scroll: { paddingHorizontal: 16, paddingTop: 20 },
  stepTitle: { fontSize: 22, fontFamily: "Inter_700Bold", marginBottom: 20 },
  form: { gap: 16 },
  label: { fontSize: 13, fontFamily: "Inter_500Medium", marginBottom: 8 },
  input: {
    borderWidth: 1.5,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
  },
  textarea: { minHeight: 80, textAlignVertical: "top" },
  arrowRow: { alignItems: "center" },
  sizeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 4,
  },
  sizeCard: {
    width: "47%",
    padding: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    gap: 4,
  },
  sizeLabel: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  sizeDesc: { fontSize: 11, fontFamily: "Inter_400Regular" },
  summary: {
    padding: 16,
    borderRadius: 14,
    gap: 4,
  },
  summaryTitle: { fontSize: 12, fontFamily: "Inter_600SemiBold", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 },
  summaryText: { fontSize: 15, fontFamily: "Inter_500Medium" },
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
