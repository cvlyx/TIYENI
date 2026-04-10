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
import { useToast } from "@/contexts/ToastContext";
import { useColors } from "@/hooks/useColors";

export default function RegisterScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { showToast } = useToast();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [focus, setFocus] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const topPadding = Platform.OS === "web" ? insets.top + 67 : insets.top;

  const handleRegister = async () => {
    if (!name.trim()) { showToast("Enter your full name", "error"); return; }
    if (!phone || phone.length < 9) { showToast("Enter a valid phone number", "error"); return; }
    setIsLoading(true);
    await new Promise((r) => setTimeout(r, 1000));
    router.push({ pathname: "/(auth)/otp", params: { phone, name } } as any);
    setIsLoading(false);
  };

  const inputStyle = (field: string) => [
    styles.input,
    {
      borderColor: focus === field ? colors.primary : colors.border,
      backgroundColor: colors.card,
      color: colors.foreground,
    },
  ];

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: topPadding + 20 }]}
        keyboardShouldPersistTaps="handled"
      >
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.foreground} />
        </Pressable>

        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.foreground }]}>Create account</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            Join Tiyeni and start sending or carrying parcels across Malawi
          </Text>
        </View>

        <View style={styles.form}>
          <View>
            <Text style={[styles.label, { color: colors.mutedForeground }]}>Full name</Text>
            <TextInput
              style={inputStyle("name")}
              placeholder="e.g. Chisomo Banda"
              placeholderTextColor={colors.mutedForeground}
              value={name}
              onChangeText={setName}
              onFocus={() => setFocus("name")}
              onBlur={() => setFocus(null)}
              autoCapitalize="words"
            />
          </View>

          <View>
            <Text style={[styles.label, { color: colors.mutedForeground }]}>Phone number</Text>
            <View style={[styles.phoneRow, { borderColor: focus === "phone" ? colors.primary : colors.border, backgroundColor: colors.card }]}>
              <Text style={[styles.countryCode, { color: colors.foreground }]}>+265</Text>
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
              <TextInput
                style={[styles.phoneInput, { color: colors.foreground }]}
                placeholder="Phone number"
                placeholderTextColor={colors.mutedForeground}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                onFocus={() => setFocus("phone")}
                onBlur={() => setFocus(null)}
                maxLength={10}
              />
            </View>
          </View>

          <View style={[styles.infoBox, { backgroundColor: colors.secondary }]}>
            <Ionicons name="information-circle-outline" size={16} color={colors.primary} />
            <Text style={[styles.infoText, { color: colors.primary }]}>
              To offer trips or carry parcels, you can upgrade to a Verified account after registration.
            </Text>
          </View>

          <PressableButton
            label={isLoading ? "Creating account..." : "Create Account"}
            onPress={handleRegister}
            disabled={isLoading}
          />

          <Pressable onPress={() => router.back()} style={styles.loginLink}>
            <Text style={[styles.linkText, { color: colors.mutedForeground }]}>
              Already have an account?{" "}
              <Text style={{ color: colors.primary, fontFamily: "Inter_600SemiBold" }}>Sign in</Text>
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  backBtn: { marginBottom: 24 },
  header: { marginBottom: 32 },
  title: { fontSize: 26, fontFamily: "Inter_700Bold", marginBottom: 8 },
  subtitle: { fontSize: 15, fontFamily: "Inter_400Regular", lineHeight: 22 },
  form: { gap: 20 },
  label: { fontSize: 13, fontFamily: "Inter_500Medium", marginBottom: 8 },
  input: {
    borderWidth: 1.5,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    fontFamily: "Inter_400Regular",
  },
  phoneRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  countryCode: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  divider: { width: 1, height: 20 },
  phoneInput: { flex: 1, fontSize: 16, fontFamily: "Inter_400Regular" },
  infoBox: {
    flexDirection: "row",
    gap: 8,
    padding: 12,
    borderRadius: 10,
    alignItems: "flex-start",
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    lineHeight: 18,
  },
  loginLink: { alignItems: "center" },
  linkText: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center" },
});
