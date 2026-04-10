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
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { useColors } from "@/hooks/useColors";

export default function LoginScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { login } = useAuth();
  const { showToast } = useToast();
  const [phone, setPhone] = useState("");
  const [focusPhone, setFocusPhone] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const topPadding = Platform.OS === "web" ? insets.top + 67 : insets.top;

  const handleLogin = async () => {
    if (!phone || phone.length < 9) {
      showToast("Enter a valid phone number", "error");
      return;
    }
    setIsLoading(true);
    await new Promise((r) => setTimeout(r, 1000));
    router.push({ pathname: "/(auth)/otp", params: { phone, name: "" } } as any);
    setIsLoading(false);
  };

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
          <View style={[styles.iconCircle, { backgroundColor: colors.secondary }]}>
            <Ionicons name="phone-portrait-outline" size={32} color={colors.primary} />
          </View>
          <Text style={[styles.title, { color: colors.foreground }]}>Welcome back</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            Enter your phone number to continue
          </Text>
        </View>

        <View style={styles.form}>
          <View style={[styles.inputWrapper, { borderColor: focusPhone ? colors.primary : colors.border, backgroundColor: colors.card }]}>
            <Text style={[styles.countryCode, { color: colors.foreground }]}>+265</Text>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <TextInput
              style={[styles.input, { color: colors.foreground }]}
              placeholder="Phone number"
              placeholderTextColor={colors.mutedForeground}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              onFocus={() => setFocusPhone(true)}
              onBlur={() => setFocusPhone(false)}
              maxLength={10}
            />
          </View>

          <PressableButton
            label={isLoading ? "Sending code..." : "Send OTP Code"}
            onPress={handleLogin}
            disabled={isLoading}
          />

          <Pressable
            onPress={() => router.push("/(auth)/register")}
            style={styles.registerLink}
          >
            <Text style={[styles.linkText, { color: colors.mutedForeground }]}>
              Don't have an account?{" "}
              <Text style={{ color: colors.primary, fontFamily: "Inter_600SemiBold" }}>
                Register
              </Text>
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
  header: {
    alignItems: "center",
    marginBottom: 36,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 26,
    fontFamily: "Inter_700Bold",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
  form: { gap: 16 },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 1.5,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  countryCode: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
  divider: {
    width: 1,
    height: 20,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontFamily: "Inter_400Regular",
  },
  registerLink: { alignItems: "center" },
  linkText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
});
