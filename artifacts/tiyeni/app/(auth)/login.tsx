import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useRef, useState } from "react";
import {
  Animated, KeyboardAvoidingView, Platform,
  Pressable, ScrollView, StyleSheet, Text, TextInput, View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";

const C = {
  bg: "#071A0F",
  green1: "#059669",
  green2: "#10B981",
  green3: "#34D399",
  amber: "#F59E0B",
  white: "#FFFFFF",
  white70: "rgba(255,255,255,0.7)",
  white50: "rgba(255,255,255,0.5)",
  white30: "rgba(255,255,255,0.3)",
  white12: "rgba(255,255,255,0.12)",
  white08: "rgba(255,255,255,0.08)",
  glassBorder: "rgba(52,211,153,0.25)",
};

function GlassInput({
  value, onChangeText, placeholder, keyboardType, secureTextEntry, rightElement, icon,
}: any) {
  const focusAnim = useRef(new Animated.Value(0)).current;
  const borderColor = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["rgba(255,255,255,0.12)", "rgba(52,211,153,0.7)"],
  });
  const bgColor = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["rgba(255,255,255,0.06)", "rgba(16,185,129,0.08)"],
  });
  return (
    <Animated.View style={[styles.inputWrap, { borderColor, backgroundColor: bgColor }]}>
      {icon && <Ionicons name={icon} size={18} color={C.white30} style={{ marginRight: 4 }} />}
      <TextInput
        style={styles.textInput}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={C.white30}
        keyboardType={keyboardType}
        autoCapitalize="none"
        secureTextEntry={secureTextEntry}
        onFocus={() => Animated.timing(focusAnim, { toValue: 1, duration: 200, useNativeDriver: false }).start()}
        onBlur={() => Animated.timing(focusAnim, { toValue: 0, duration: 200, useNativeDriver: false }).start()}
      />
      {rightElement}
    </Animated.View>
  );
}

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { showToast } = useToast();
  const { login } = useAuth();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const topPad = Platform.OS === "web" ? insets.top + 67 : insets.top;

  const handleLogin = async () => {
    if (!identifier.trim()) { showToast("Enter your email or username", "error"); return; }
    if (!password) { showToast("Enter your password", "error"); return; }
    setIsLoading(true);
    try {
      await login(identifier.trim(), password);
      router.replace("/(tabs)/");
    } catch (e: any) {
      if (e?.message?.includes("not verified") || e?.phone) {
        showToast("Please verify your phone first", "info");
        router.push({ pathname: "/(auth)/otp", params: { phone: e?.phone ?? "", name: "", devCode: e?.devCode ?? "" } } as any);
      } else {
        showToast(e?.message ?? "Login failed", "error");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <LinearGradient colors={[C.bg, "#0D2B18", "#0F3D22"]} style={StyleSheet.absoluteFill} />

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: topPad + 16 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <View style={styles.backCircle}>
            <Ionicons name="arrow-back" size={20} color={C.white} />
          </View>
        </Pressable>

        {/* Header */}
        <View style={styles.header}>
          <LinearGradient colors={[C.green2, C.green1]} style={styles.iconBadge}>
            <Ionicons name="lock-closed" size={26} color={C.white} />
          </LinearGradient>
          <Text style={styles.title}>Welcome back</Text>
          <Text style={styles.subtitle}>Sign in to your Tiyeni account</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <View>
            <Text style={styles.label}>Email or Username</Text>
            <GlassInput
              value={identifier}
              onChangeText={setIdentifier}
              placeholder="you@example.com or @username"
              keyboardType="email-address"
              icon="person-outline"
            />
          </View>
          <View>
            <Text style={styles.label}>Password</Text>
            <GlassInput
              value={password}
              onChangeText={setPassword}
              placeholder="Your password"
              secureTextEntry={!showPassword}
              icon="key-outline"
              rightElement={
                <Pressable onPress={() => setShowPassword(!showPassword)} hitSlop={8}>
                  <Ionicons
                    name={showPassword ? "eye-off-outline" : "eye-outline"}
                    size={18}
                    color={C.white50}
                  />
                </Pressable>
              }
            />
          </View>

          <Pressable
            onPress={handleLogin}
            disabled={isLoading}
            style={({ pressed }) => [styles.btn, { opacity: pressed || isLoading ? 0.8 : 1 }]}
          >
            <LinearGradient
              colors={[C.green2, C.green1]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.btnGrad}
            >
              <Text style={styles.btnTxt}>{isLoading ? "Signing in..." : "Sign In"}</Text>
            </LinearGradient>
          </Pressable>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerTxt}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          <Pressable onPress={() => router.push("/(auth)/register")} style={styles.outlineBtn}>
            <Text style={styles.outlineBtnTxt}>Create a new account</Text>
          </Pressable>
        </View>

        {/* Trust badges */}
        <View style={styles.trustRow}>
          {["🔒 Secure", "📱 OTP Verified", "🇲🇼 Malawi"].map((t) => (
            <View key={t} style={styles.trustBadge}>
              <Text style={styles.trustTxt}>{t}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flexGrow: 1, paddingHorizontal: 24, paddingBottom: 60 },
  backBtn: { marginBottom: 28 },
  backCircle: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: C.white08, borderWidth: 1, borderColor: C.white12,
    alignItems: "center", justifyContent: "center",
  },
  header: { alignItems: "center", marginBottom: 36 },
  iconBadge: {
    width: 72, height: 72, borderRadius: 22,
    alignItems: "center", justifyContent: "center",
    marginBottom: 20,
    shadowColor: C.green1, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.5, shadowRadius: 14, elevation: 8,
  },
  title: { color: C.white, fontSize: 26, fontFamily: "Inter_700Bold", marginBottom: 6, letterSpacing: -0.4 },
  subtitle: { color: C.white50, fontSize: 15, fontFamily: "Inter_400Regular", textAlign: "center" },
  form: { gap: 16 },
  label: {
    color: C.white50, fontSize: 11, fontFamily: "Inter_600SemiBold",
    letterSpacing: 1, textTransform: "uppercase", marginBottom: 7,
  },
  inputWrap: {
    flexDirection: "row", alignItems: "center",
    borderRadius: 14, borderWidth: 1,
    paddingHorizontal: 16, paddingVertical: 14,
    gap: 10,
  },
  textInput: { flex: 1, color: C.white, fontSize: 15, fontFamily: "Inter_400Regular" },
  btn: {
    borderRadius: 14, overflow: "hidden", marginTop: 4,
    shadowColor: C.green1, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.45, shadowRadius: 14, elevation: 8,
  },
  btnGrad: { paddingVertical: 16, alignItems: "center" },
  btnTxt: { color: C.white, fontSize: 16, fontFamily: "Inter_700Bold" },
  divider: { flexDirection: "row", alignItems: "center", gap: 12 },
  dividerLine: { flex: 1, height: 1, backgroundColor: C.white12 },
  dividerTxt: { color: C.white30, fontSize: 13, fontFamily: "Inter_400Regular" },
  outlineBtn: {
    borderRadius: 14, borderWidth: 1, borderColor: C.glassBorder,
    paddingVertical: 15, alignItems: "center",
    backgroundColor: C.white08,
  },
  outlineBtnTxt: { color: C.green3, fontSize: 15, fontFamily: "Inter_600SemiBold" },
  trustRow: { flexDirection: "row", gap: 8, justifyContent: "center", marginTop: 32, flexWrap: "wrap" },
  trustBadge: {
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 20, backgroundColor: C.white08,
    borderWidth: 1, borderColor: C.white12,
  },
  trustTxt: { color: C.white50, fontSize: 12, fontFamily: "Inter_400Regular" },
});
