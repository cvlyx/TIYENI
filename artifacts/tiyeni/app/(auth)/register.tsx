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
  errorBorder: "rgba(239,68,68,0.6)",
};

function GlassInput({
  value, onChangeText, placeholder, keyboardType, autoCapitalize,
  secureTextEntry, prefix, rightElement, icon, error,
}: any) {
  const focusAnim = useRef(new Animated.Value(0)).current;
  const borderColor = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [error ? C.errorBorder : "rgba(255,255,255,0.12)", "rgba(52,211,153,0.7)"],
  });
  const bgColor = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["rgba(255,255,255,0.06)", "rgba(16,185,129,0.08)"],
  });
  return (
    <Animated.View style={[styles.inputWrap, { borderColor, backgroundColor: bgColor }]}>
      {icon && <Ionicons name={icon} size={17} color={C.white30} />}
      {prefix && (
        <>
          <Text style={styles.prefixTxt}>{prefix}</Text>
          <View style={styles.prefixDivider} />
        </>
      )}
      <TextInput
        style={styles.textInput}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={C.white30}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize ?? "none"}
        secureTextEntry={secureTextEntry}
        onFocus={() => Animated.timing(focusAnim, { toValue: 1, duration: 200, useNativeDriver: false }).start()}
        onBlur={() => Animated.timing(focusAnim, { toValue: 0, duration: 200, useNativeDriver: false }).start()}
      />
      {rightElement}
    </Animated.View>
  );
}

function StepIndicator({ step, total }: { step: number; total: number }) {
  return (
    <View style={styles.stepRow}>
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          style={[
            styles.stepDot,
            {
              backgroundColor: i < step ? C.green2 : i === step ? C.green3 : C.white12,
              flex: i === step ? 2 : 1,
            },
          ]}
        />
      ))}
    </View>
  );
}

export default function RegisterScreen() {
  const insets = useSafeAreaInsets();
  const { showToast } = useToast();
  const topPad = Platform.OS === "web" ? insets.top + 67 : insets.top;

  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const passwordStrength = password.length === 0 ? 0 : password.length < 6 ? 1 : password.length < 10 ? 2 : 3;
  const strengthColors = ["transparent", C.amber, C.green2, C.green3];
  const strengthLabels = ["", "Weak", "Good", "Strong"];

  const handleRegister = async () => {
    if (!name.trim()) { showToast("Enter your full name", "error"); return; }
    if (!username.trim() || username.length < 3) { showToast("Username must be at least 3 characters", "error"); return; }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) { showToast("Username: letters, numbers and _ only", "error"); return; }
    if (!email.includes("@")) { showToast("Enter a valid email address", "error"); return; }
    if (!phone || phone.length < 9) { showToast("Enter a valid phone number", "error"); return; }
    if (password.length < 8) { showToast("Password must be at least 8 characters", "error"); return; }
    if (password !== confirmPassword) { showToast("Passwords do not match", "error"); return; }

    setIsLoading(true);
    const digits = phone.replace(/^\+265/, "").replace(/^0/, "");
    const normalized = "+265" + digits;

    try {
      const res = await api.register({
        name: name.trim(),
        username: username.trim().toLowerCase(),
        email: email.trim().toLowerCase(),
        phone: normalized,
        password,
      });
      showToast("Account created! Check your phone for the OTP.", "success");
      router.push({
        pathname: "/(auth)/otp",
        params: { phone: normalized, name: name.trim(), devCode: (res as any).devCode ?? "" },
      } as any);
    } catch (e: any) {
      showToast(e?.message ?? "Registration failed", "error");
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
            <Ionicons name="person-add" size={26} color={C.white} />
          </LinearGradient>
          <Text style={styles.title}>Create account</Text>
          <Text style={styles.subtitle}>Join Tiyeni — Malawi's ride & parcel network</Text>
        </View>

        <StepIndicator step={1} total={3} />

        {/* Form */}
        <View style={styles.form}>
          {/* Section: Personal */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>👤 Personal Info</Text>
            <View>
              <Text style={styles.label}>Full Name</Text>
              <GlassInput
                value={name} onChangeText={setName}
                placeholder="e.g. Chisomo Banda"
                autoCapitalize="words" icon="person-outline"
              />
            </View>
            <View>
              <Text style={styles.label}>Username</Text>
              <GlassInput
                value={username} onChangeText={setUsername}
                placeholder="e.g. chisomo_banda" icon="at-outline"
              />
            </View>
          </View>

          {/* Section: Contact */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>📬 Contact</Text>
            <View>
              <Text style={styles.label}>Email Address</Text>
              <GlassInput
                value={email} onChangeText={setEmail}
                placeholder="you@example.com"
                keyboardType="email-address" icon="mail-outline"
              />
            </View>
            <View>
              <Text style={styles.label}>Phone Number</Text>
              <GlassInput
                value={phone} onChangeText={setPhone}
                placeholder="Phone number"
                keyboardType="phone-pad" prefix="+265"
              />
            </View>
          </View>

          {/* Section: Security */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>🔒 Security</Text>
            <View>
              <Text style={styles.label}>Password</Text>
              <GlassInput
                value={password} onChangeText={setPassword}
                placeholder="Min. 8 characters"
                secureTextEntry={!showPassword} icon="key-outline"
                rightElement={
                  <Pressable onPress={() => setShowPassword(!showPassword)} hitSlop={8}>
                    <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={18} color={C.white50} />
                  </Pressable>
                }
              />
              {password.length > 0 && (
                <View style={styles.strengthRow}>
                  {[1, 2, 3].map((i) => (
                    <View
                      key={i}
                      style={[
                        styles.strengthBar,
                        { backgroundColor: passwordStrength >= i ? strengthColors[passwordStrength] : C.white12 },
                      ]}
                    />
                  ))}
                  <Text style={[styles.strengthLabel, { color: strengthColors[passwordStrength] }]}>
                    {strengthLabels[passwordStrength]}
                  </Text>
                </View>
              )}
            </View>
            <View>
              <Text style={styles.label}>Confirm Password</Text>
              <GlassInput
                value={confirmPassword} onChangeText={setConfirmPassword}
                placeholder="Repeat password"
                secureTextEntry={!showPassword} icon="shield-checkmark-outline"
                error={confirmPassword.length > 0 && confirmPassword !== password}
              />
            </View>
          </View>

          {/* OTP notice */}
          <View style={styles.noticeBox}>
            <Ionicons name="phone-portrait-outline" size={18} color={C.green3} />
            <Text style={styles.noticeTxt}>
              An OTP will be sent to your phone to verify your account.
            </Text>
          </View>

          <Pressable
            onPress={handleRegister}
            disabled={isLoading}
            style={({ pressed }) => [styles.btn, { opacity: pressed || isLoading ? 0.8 : 1 }]}
          >
            <LinearGradient
              colors={[C.green2, C.green1]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.btnGrad}
            >
              <Text style={styles.btnTxt}>{isLoading ? "Creating account..." : "Create Account →"}</Text>
            </LinearGradient>
          </Pressable>

          <Pressable onPress={() => router.back()} style={styles.linkRow}>
            <Text style={styles.linkTxt}>
              Already have an account?{" "}
              <Text style={{ color: C.green3, fontFamily: "Inter_600SemiBold" }}>Sign in</Text>
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
  backBtn: { marginBottom: 24 },
  backCircle: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: "rgba(255,255,255,0.08)", borderWidth: 1, borderColor: "rgba(255,255,255,0.12)",
    alignItems: "center", justifyContent: "center",
  },
  header: { alignItems: "center", marginBottom: 24 },
  iconBadge: {
    width: 72, height: 72, borderRadius: 22,
    alignItems: "center", justifyContent: "center",
    marginBottom: 18,
    shadowColor: "#059669", shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.5, shadowRadius: 14, elevation: 8,
  },
  title: { color: C.white, fontSize: 26, fontFamily: "Inter_700Bold", marginBottom: 6, letterSpacing: -0.4 },
  subtitle: { color: C.white50, fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center" },

  // Step indicator
  stepRow: { flexDirection: "row", gap: 6, marginBottom: 28, height: 4 },
  stepDot: { height: 4, borderRadius: 2 },

  // Sections
  section: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 18, borderWidth: 1, borderColor: "rgba(52,211,153,0.15)",
    padding: 16, gap: 14,
  },
  sectionLabel: { color: C.white70, fontSize: 13, fontFamily: "Inter_600SemiBold" },

  form: { gap: 16 },
  label: {
    color: C.white50, fontSize: 11, fontFamily: "Inter_600SemiBold",
    letterSpacing: 1, textTransform: "uppercase", marginBottom: 7,
  },
  inputWrap: {
    flexDirection: "row", alignItems: "center",
    borderRadius: 13, borderWidth: 1,
    paddingHorizontal: 14, paddingVertical: 13,
    gap: 10,
  },
  prefixTxt: { color: C.white, fontSize: 15, fontFamily: "Inter_600SemiBold" },
  prefixDivider: { width: 1, height: 18, backgroundColor: "rgba(255,255,255,0.2)" },
  textInput: { flex: 1, color: C.white, fontSize: 15, fontFamily: "Inter_400Regular" },

  // Password strength
  strengthRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 8 },
  strengthBar: { flex: 1, height: 3, borderRadius: 2 },
  strengthLabel: { fontSize: 11, fontFamily: "Inter_600SemiBold", minWidth: 40 },

  // Notice
  noticeBox: {
    flexDirection: "row", gap: 10, padding: 14,
    borderRadius: 14, backgroundColor: "rgba(52,211,153,0.08)",
    borderWidth: 1, borderColor: "rgba(52,211,153,0.2)",
    alignItems: "flex-start",
  },
  noticeTxt: { flex: 1, color: C.white50, fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 19 },

  btn: {
    borderRadius: 14, overflow: "hidden", marginTop: 4,
    shadowColor: "#059669", shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.45, shadowRadius: 14, elevation: 8,
  },
  btnGrad: { paddingVertical: 16, alignItems: "center" },
  btnTxt: { color: C.white, fontSize: 16, fontFamily: "Inter_700Bold" },
  linkRow: { alignItems: "center", paddingTop: 4 },
  linkTxt: { color: C.white50, fontSize: 14, fontFamily: "Inter_400Regular" },
});
