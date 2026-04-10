import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";

const OTP_LENGTH = 6;
const DEMO_OTP = "123456";

export default function OTPScreen() {
  const insets = useSafeAreaInsets();
  const { login } = useAuth();
  const { showToast } = useToast();
  const params = useLocalSearchParams<{ phone: string; name: string }>();
  const [otp, setOtp] = useState(Array(OTP_LENGTH).fill(""));
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(30);
  const inputs = useRef<(TextInput | null)[]>([]);
  const successAnim = useRef(new Animated.Value(0)).current;
  const topPadding = Platform.OS === "web" ? insets.top + 67 : insets.top;

  useEffect(() => {
    const timer = setInterval(() => setCountdown((c) => (c > 0 ? c - 1 : 0)), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleChange = (val: string, idx: number) => {
    const digit = val.replace(/[^0-9]/g, "").slice(-1);
    const newOtp = [...otp];
    newOtp[idx] = digit;
    setOtp(newOtp);
    if (digit && idx < OTP_LENGTH - 1) inputs.current[idx + 1]?.focus();
  };

  const handleKeyPress = (e: any, idx: number) => {
    if (e.nativeEvent.key === "Backspace" && !otp[idx] && idx > 0) {
      inputs.current[idx - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const code = otp.join("");
    if (code.length < OTP_LENGTH) { showToast("Enter the 6-digit code", "error"); return; }
    if (code !== DEMO_OTP) { showToast("Wrong code. Try 123456", "error"); return; }
    setIsLoading(true);
    Animated.spring(successAnim, { toValue: 1, useNativeDriver: false }).start();
    await new Promise((r) => setTimeout(r, 800));
    await login(params.phone || "", params.name || "");
    showToast("Welcome to Tiyeni!", "success");
    router.replace("/(tabs)/");
    setIsLoading(false);
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <LinearGradient colors={["#0D2B12", "#1A4A1E", "#2E7D32"]} style={StyleSheet.absoluteFill} />

      <View style={[styles.inner, { paddingTop: topPadding + 16 }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <View style={styles.backCircle}>
            <Ionicons name="arrow-back" size={20} color="#fff" />
          </View>
        </Pressable>

        <View style={styles.header}>
          <Animated.View
            style={[
              styles.checkCircle,
              {
                transform: [{ scale: successAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.2] }) }],
                backgroundColor: successAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ["rgba(76,175,80,0.15)" as any, "rgba(76,175,80,0.4)" as any],
                }),
              },
            ]}
          >
            <Ionicons name="lock-closed-outline" size={28} color="#4CAF50" />
          </Animated.View>
          <Text style={styles.title}>Verify your number</Text>
          <Text style={styles.subtitle}>
            6-digit code sent to{"\n"}
            <Text style={styles.phoneHighlight}>+265 {params.phone}</Text>
          </Text>
          <View style={styles.demoHint}>
            <Ionicons name="information-circle" size={14} color="#F59E0B" />
            <Text style={styles.demoText}>Demo: use code 123456</Text>
          </View>
        </View>

        <View style={styles.otpRow}>
          {otp.map((digit, idx) => (
            <View key={idx} style={[styles.otpWrap, digit ? styles.otpFilled : {}]}>
              {Platform.OS === "ios" && (
                <BlurView intensity={10} tint="dark" style={StyleSheet.absoluteFill} />
              )}
              <TextInput
                ref={(r) => { inputs.current[idx] = r; }}
                style={styles.otpInput}
                value={digit}
                onChangeText={(v) => handleChange(v, idx)}
                onKeyPress={(e) => handleKeyPress(e, idx)}
                keyboardType="number-pad"
                maxLength={1}
                textAlign="center"
                selectionColor="#4CAF50"
              />
            </View>
          ))}
        </View>

        <Pressable
          onPress={handleVerify}
          disabled={isLoading}
          style={({ pressed }) => [styles.btn, { opacity: pressed || isLoading ? 0.8 : 1 }]}
        >
          <LinearGradient colors={["#388E3C", "#2E7D32"]} style={styles.btnGradient}>
            <Text style={styles.btnText}>{isLoading ? "Verifying..." : "Verify & Continue"}</Text>
          </LinearGradient>
        </Pressable>

        <Pressable onPress={() => countdown === 0 && setCountdown(30)} style={styles.resend}>
          <Text style={[styles.resendText, { color: countdown > 0 ? "rgba(255,255,255,0.35)" : "#81C784" }]}>
            {countdown > 0 ? `Resend in ${countdown}s` : "Resend code"}
          </Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  inner: { flex: 1, paddingHorizontal: 24 },
  backBtn: { marginBottom: 32 },
  backCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
  header: { alignItems: "center", marginBottom: 36 },
  checkCircle: {
    width: 72,
    height: 72,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(76,175,80,0.3)",
    marginBottom: 20,
  },
  title: { color: "#fff", fontSize: 26, fontFamily: "Inter_700Bold", marginBottom: 8, letterSpacing: -0.3 },
  subtitle: { color: "rgba(255,255,255,0.55)", fontSize: 15, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 22, marginBottom: 12 },
  phoneHighlight: { color: "#81C784", fontFamily: "Inter_600SemiBold" },
  demoHint: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(245,158,11,0.12)",
    borderWidth: 1,
    borderColor: "rgba(245,158,11,0.25)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  demoText: { color: "#F59E0B", fontSize: 12, fontFamily: "Inter_500Medium" },
  otpRow: { flexDirection: "row", gap: 10, justifyContent: "center", marginBottom: 32 },
  otpWrap: {
    width: 46,
    height: 54,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.15)",
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.06)",
    alignItems: "center",
    justifyContent: "center",
  },
  otpFilled: {
    borderColor: "rgba(76,175,80,0.7)",
    backgroundColor: "rgba(76,175,80,0.12)",
  },
  otpInput: {
    width: "100%",
    height: "100%",
    color: "#fff",
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    textAlign: "center",
  },
  btn: {
    borderRadius: 14,
    overflow: "hidden",
    shadowColor: "#2E7D32",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 6,
  },
  btnGradient: { paddingVertical: 16, alignItems: "center" },
  btnText: { color: "#fff", fontSize: 16, fontFamily: "Inter_700Bold" },
  resend: { alignItems: "center", marginTop: 20 },
  resendText: { fontSize: 14, fontFamily: "Inter_500Medium" },
});
