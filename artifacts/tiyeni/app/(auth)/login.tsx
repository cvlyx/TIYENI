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
import { useColors } from "@/hooks/useColors";

function GlassInput({ value, onChangeText, placeholder, keyboardType, secureTextEntry, rightElement }: any) {
  const focusAnim = useRef(new Animated.Value(0)).current;
  const borderColor = focusAnim.interpolate({ inputRange: [0, 1], outputRange: ["rgba(255,255,255,0.15)", "rgba(76,175,80,0.8)"] });
  const backgroundColor = focusAnim.interpolate({ inputRange: [0, 1], outputRange: ["rgba(255,255,255,0.08)", "rgba(76,175,80,0.1)"] });
  return (
    <Animated.View style={[styles.inputWrap, { borderColor, backgroundColor }]}>
      <TextInput
        style={styles.textInput}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="rgba(255,255,255,0.35)"
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
  const topPadding = Platform.OS === "web" ? insets.top + 67 : insets.top;

  const handleLogin = async () => {
    if (!identifier.trim()) { showToast("Enter your email or username", "error"); return; }
    if (!password) { showToast("Enter your password", "error"); return; }
    setIsLoading(true);
    try {
      await login(identifier.trim(), password);
      router.replace("/(tabs)/");
    } catch (e: any) {
      // If phone not verified, redirect to OTP
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
      <LinearGradient colors={["#0D2B12", "#1A4A1E", "#2E7D32"]} style={StyleSheet.absoluteFill} />
      <ScrollView contentContainerStyle={[styles.scroll, { paddingTop: topPadding + 16 }]} keyboardShouldPersistTaps="handled">
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <View style={styles.backCircle}>
            <Ionicons name="arrow-back" size={20} color="#fff" />
          </View>
        </Pressable>

        <View style={styles.header}>
          <View style={styles.iconWrap}>
            <Ionicons name="lock-closed-outline" size={28} color="#4CAF50" />
          </View>
          <Text style={styles.title}>Welcome back</Text>
          <Text style={styles.subtitle}>Sign in with your email or username</Text>
        </View>

        <View style={styles.form}>
          <View>
            <Text style={styles.label}>Email or Username</Text>
            <GlassInput
              value={identifier}
              onChangeText={setIdentifier}
              placeholder="you@example.com or username"
              keyboardType="email-address"
            />
          </View>
          <View>
            <Text style={styles.label}>Password</Text>
            <GlassInput
              value={password}
              onChangeText={setPassword}
              placeholder="Your password"
              secureTextEntry={!showPassword}
              rightElement={
                <Pressable onPress={() => setShowPassword(!showPassword)}>
                  <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={18} color="rgba(255,255,255,0.5)" />
                </Pressable>
              }
            />
          </View>

          <Pressable onPress={handleLogin} disabled={isLoading} style={({ pressed }) => [styles.btn, { opacity: pressed || isLoading ? 0.8 : 1 }]}>
            <LinearGradient colors={["#388E3C", "#2E7D32"]} style={styles.btnGradient}>
              <Text style={styles.btnText}>{isLoading ? "Signing in..." : "Sign In"}</Text>
            </LinearGradient>
          </Pressable>

          <Pressable onPress={() => router.push("/(auth)/register")} style={styles.linkRow}>
            <Text style={styles.linkText}>
              No account?{" "}
              <Text style={{ color: "#81C784", fontFamily: "Inter_600SemiBold" }}>Create one</Text>
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flexGrow: 1, paddingHorizontal: 24, paddingBottom: 60 },
  backBtn: { marginBottom: 32 },
  backCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.12)", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "rgba(255,255,255,0.15)" },
  header: { alignItems: "center", marginBottom: 40 },
  iconWrap: { width: 64, height: 64, borderRadius: 20, backgroundColor: "rgba(76,175,80,0.15)", borderWidth: 1, borderColor: "rgba(76,175,80,0.3)", alignItems: "center", justifyContent: "center", marginBottom: 20 },
  title: { color: "#fff", fontSize: 26, fontFamily: "Inter_700Bold", marginBottom: 8, letterSpacing: -0.3 },
  subtitle: { color: "rgba(255,255,255,0.55)", fontSize: 15, fontFamily: "Inter_400Regular", textAlign: "center" },
  form: { gap: 14 },
  label: { color: "rgba(255,255,255,0.5)", fontSize: 12, fontFamily: "Inter_600SemiBold", letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 6 },
  inputWrap: { flexDirection: "row", alignItems: "center", borderRadius: 14, borderWidth: 1, paddingHorizontal: 16, paddingVertical: 14, overflow: "hidden", gap: 12 },
  textInput: { flex: 1, color: "#fff", fontSize: 16, fontFamily: "Inter_400Regular" },
  btn: { borderRadius: 14, overflow: "hidden", marginTop: 4, shadowColor: "#2E7D32", shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.5, shadowRadius: 12, elevation: 6 },
  btnGradient: { paddingVertical: 16, alignItems: "center" },
  btnText: { color: "#fff", fontSize: 16, fontFamily: "Inter_700Bold" },
  linkRow: { alignItems: "center", paddingTop: 8 },
  linkText: { color: "rgba(255,255,255,0.5)", fontSize: 14, fontFamily: "Inter_400Regular" },
});
