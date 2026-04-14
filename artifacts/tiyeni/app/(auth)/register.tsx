import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useRef, useState } from "react";
import {
  Animated, KeyboardAvoidingView, Platform,
  Pressable, ScrollView, StyleSheet, Text, TextInput, View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { api } from "@/lib/api";
import { useToast } from "@/contexts/ToastContext";
import { useColors } from "@/hooks/useColors";

function GlassInput({ value, onChangeText, placeholder, keyboardType, autoCapitalize, secureTextEntry, prefix }: any) {
  const focusAnim = useRef(new Animated.Value(0)).current;
  const borderColor = focusAnim.interpolate({ inputRange: [0, 1], outputRange: ["rgba(255,255,255,0.15)", "rgba(76,175,80,0.8)"] });
  const backgroundColor = focusAnim.interpolate({ inputRange: [0, 1], outputRange: ["rgba(255,255,255,0.08)", "rgba(76,175,80,0.1)"] });
  return (
    <Animated.View style={[styles.inputWrap, { borderColor, backgroundColor }]}>
      {prefix && <><Text style={styles.prefixText}>{prefix}</Text><View style={styles.prefixDivider} /></>}
      <TextInput
        style={styles.textInput}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="rgba(255,255,255,0.35)"
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize ?? "none"}
        secureTextEntry={secureTextEntry}
        onFocus={() => Animated.timing(focusAnim, { toValue: 1, duration: 200, useNativeDriver: false }).start()}
        onBlur={() => Animated.timing(focusAnim, { toValue: 0, duration: 200, useNativeDriver: false }).start()}
      />
    </Animated.View>
  );
}

export default function RegisterScreen() {
  const insets = useSafeAreaInsets();
  const { showToast } = useToast();
  const topPadding = Platform.OS === "web" ? insets.top + 67 : insets.top;

  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async () => {
    if (!name.trim()) { showToast("Enter your full name", "error"); return; }
    if (!username.trim() || username.length < 3) { showToast("Username must be at least 3 characters", "error"); return; }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) { showToast("Username can only contain letters, numbers and underscores", "error"); return; }
    if (!email.includes("@")) { showToast("Enter a valid email address", "error"); return; }
    if (!phone || phone.length < 9) { showToast("Enter a valid phone number", "error"); return; }
    if (password.length < 8) { showToast("Password must be at least 8 characters", "error"); return; }
    if (password !== confirmPassword) { showToast("Passwords do not match", "error"); return; }

    setIsLoading(true);
    const digits = phone.replace(/^\+265/, "").replace(/^0/, "");
    const normalized = "+265" + digits;

    try {
      const res = await api.register({ name: name.trim(), username: username.trim().toLowerCase(), email: email.trim().toLowerCase(), phone: normalized, password });
      showToast("Account created! Check your phone for the OTP.", "success");
      router.push({ pathname: "/(auth)/otp", params: { phone: normalized, name: name.trim(), devCode: (res as any).devCode ?? "" } } as any);
    } catch (e: any) {
      showToast(e?.message ?? "Registration failed", "error");
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
          <Text style={styles.title}>Create account</Text>
          <Text style={styles.subtitle}>Join Tiyeni and start sending or carrying parcels across Malawi</Text>
        </View>

        <View style={styles.form}>
          <View>
            <Text style={styles.label}>Full Name</Text>
            <GlassInput value={name} onChangeText={setName} placeholder="e.g. Chisomo Banda" autoCapitalize="words" />
          </View>
          <View>
            <Text style={styles.label}>Username</Text>
            <GlassInput value={username} onChangeText={setUsername} placeholder="e.g. chisomo_banda" />
          </View>
          <View>
            <Text style={styles.label}>Email Address</Text>
            <GlassInput value={email} onChangeText={setEmail} placeholder="you@example.com" keyboardType="email-address" />
          </View>
          <View>
            <Text style={styles.label}>Phone Number</Text>
            <GlassInput value={phone} onChangeText={setPhone} placeholder="Phone number" keyboardType="phone-pad" prefix="+265" />
          </View>
          <View>
            <Text style={styles.label}>Password</Text>
            <Animated.View style={[styles.inputWrap, { borderColor: "rgba(255,255,255,0.15)", backgroundColor: "rgba(255,255,255,0.08)" }]}>
              <TextInput
                style={styles.textInput}
                value={password}
                onChangeText={setPassword}
                placeholder="Min. 8 characters"
                placeholderTextColor="rgba(255,255,255,0.35)"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              <Pressable onPress={() => setShowPassword(!showPassword)}>
                <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={18} color="rgba(255,255,255,0.5)" />
              </Pressable>
            </Animated.View>
          </View>
          <View>
            <Text style={styles.label}>Confirm Password</Text>
            <GlassInput value={confirmPassword} onChangeText={setConfirmPassword} placeholder="Repeat password" secureTextEntry={!showPassword} />
          </View>

          <View style={styles.infoBox}>
            <Ionicons name="phone-portrait-outline" size={16} color="#81C784" />
            <Text style={styles.infoText}>An OTP will be sent to your phone to verify your account.</Text>
          </View>

          <Pressable onPress={handleRegister} disabled={isLoading} style={({ pressed }) => [styles.btn, { opacity: pressed || isLoading ? 0.8 : 1 }]}>
            <LinearGradient colors={["#388E3C", "#2E7D32"]} style={styles.btnGradient}>
              <Text style={styles.btnText}>{isLoading ? "Creating account..." : "Create Account"}</Text>
            </LinearGradient>
          </Pressable>

          <Pressable onPress={() => router.back()} style={styles.linkRow}>
            <Text style={styles.linkText}>
              Already have an account?{" "}
              <Text style={{ color: "#81C784", fontFamily: "Inter_600SemiBold" }}>Sign in</Text>
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
  header: { marginBottom: 28 },
  title: { color: "#fff", fontSize: 28, fontFamily: "Inter_700Bold", marginBottom: 8, letterSpacing: -0.5 },
  subtitle: { color: "rgba(255,255,255,0.5)", fontSize: 15, fontFamily: "Inter_400Regular", lineHeight: 22 },
  form: { gap: 14 },
  label: { color: "rgba(255,255,255,0.5)", fontSize: 12, fontFamily: "Inter_600SemiBold", letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 6 },
  inputWrap: { flexDirection: "row", alignItems: "center", borderRadius: 14, borderWidth: 1, paddingHorizontal: 16, paddingVertical: 14, overflow: "hidden", gap: 12 },
  prefixText: { color: "#fff", fontSize: 15, fontFamily: "Inter_600SemiBold" },
  prefixDivider: { width: 1, height: 18, backgroundColor: "rgba(255,255,255,0.2)" },
  textInput: { flex: 1, color: "#fff", fontSize: 16, fontFamily: "Inter_400Regular" },
  infoBox: { flexDirection: "row", gap: 10, padding: 14, borderRadius: 12, backgroundColor: "rgba(76,175,80,0.1)", borderWidth: 1, borderColor: "rgba(76,175,80,0.2)", alignItems: "center" },
  infoText: { flex: 1, color: "rgba(255,255,255,0.55)", fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 18 },
  btn: { borderRadius: 14, overflow: "hidden", marginTop: 4, shadowColor: "#2E7D32", shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.5, shadowRadius: 12, elevation: 6 },
  btnGradient: { paddingVertical: 16, alignItems: "center" },
  btnText: { color: "#fff", fontSize: 16, fontFamily: "Inter_700Bold" },
  linkRow: { alignItems: "center", paddingTop: 4 },
  linkText: { color: "rgba(255,255,255,0.5)", fontSize: 14, fontFamily: "Inter_400Regular" },
});
