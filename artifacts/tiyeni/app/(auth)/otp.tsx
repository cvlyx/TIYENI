import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
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

const OTP_LENGTH = 6;
const DEMO_OTP = "123456";

export default function OTPScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { login } = useAuth();
  const { showToast } = useToast();
  const params = useLocalSearchParams<{ phone: string; name: string }>();
  const [otp, setOtp] = useState(Array(OTP_LENGTH).fill(""));
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(30);
  const inputs = useRef<(TextInput | null)[]>([]);

  const topPadding = Platform.OS === "web" ? insets.top + 67 : insets.top;

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((c) => (c > 0 ? c - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleChange = (val: string, idx: number) => {
    const digit = val.replace(/[^0-9]/g, "").slice(-1);
    const newOtp = [...otp];
    newOtp[idx] = digit;
    setOtp(newOtp);
    if (digit && idx < OTP_LENGTH - 1) {
      inputs.current[idx + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, idx: number) => {
    if (e.nativeEvent.key === "Backspace" && !otp[idx] && idx > 0) {
      inputs.current[idx - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const code = otp.join("");
    if (code.length < OTP_LENGTH) {
      showToast("Enter the 6-digit code", "error");
      return;
    }
    if (code !== DEMO_OTP) {
      showToast("Wrong code. Try 123456", "error");
      return;
    }
    setIsLoading(true);
    await new Promise((r) => setTimeout(r, 1000));
    await login(params.phone || "", params.name || "");
    showToast("Welcome to Tiyeni!", "success");
    router.replace("/(tabs)/");
    setIsLoading(false);
  };

  const handleResend = () => {
    if (countdown > 0) return;
    setCountdown(30);
    setOtp(Array(OTP_LENGTH).fill(""));
    showToast("Code sent!", "info");
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={[styles.inner, { paddingTop: topPadding + 20 }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.foreground} />
        </Pressable>

        <View style={styles.header}>
          <View style={[styles.iconCircle, { backgroundColor: colors.secondary }]}>
            <Ionicons name="lock-closed-outline" size={32} color={colors.primary} />
          </View>
          <Text style={[styles.title, { color: colors.foreground }]}>Verify your number</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            Enter the 6-digit code sent to{"\n"}
            <Text style={{ color: colors.primary, fontFamily: "Inter_600SemiBold" }}>
              +265 {params.phone}
            </Text>
          </Text>
          <View style={[styles.demoHint, { backgroundColor: colors.accent + "20" }]}>
            <Ionicons name="information-circle" size={14} color={colors.accent} />
            <Text style={[styles.demoText, { color: colors.accent }]}>Demo: use code 123456</Text>
          </View>
        </View>

        <View style={styles.otpRow}>
          {otp.map((digit, idx) => (
            <TextInput
              key={idx}
              ref={(r) => { inputs.current[idx] = r; }}
              style={[
                styles.otpBox,
                {
                  borderColor: digit ? colors.primary : colors.border,
                  backgroundColor: colors.card,
                  color: colors.foreground,
                },
              ]}
              value={digit}
              onChangeText={(v) => handleChange(v, idx)}
              onKeyPress={(e) => handleKeyPress(e, idx)}
              keyboardType="number-pad"
              maxLength={1}
              textAlign="center"
            />
          ))}
        </View>

        <PressableButton
          label={isLoading ? "Verifying..." : "Verify & Continue"}
          onPress={handleVerify}
          disabled={isLoading}
        />

        <Pressable onPress={handleResend} style={styles.resend} disabled={countdown > 0}>
          <Text style={[styles.resendText, { color: countdown > 0 ? colors.mutedForeground : colors.primary }]}>
            {countdown > 0 ? `Resend code in ${countdown}s` : "Resend code"}
          </Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  inner: { flex: 1, paddingHorizontal: 24 },
  backBtn: { marginBottom: 24 },
  header: { alignItems: "center", marginBottom: 36 },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  title: { fontSize: 26, fontFamily: "Inter_700Bold", marginBottom: 8 },
  subtitle: { fontSize: 15, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 22, marginBottom: 12 },
  demoHint: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  demoText: { fontSize: 12, fontFamily: "Inter_500Medium" },
  otpRow: {
    flexDirection: "row",
    gap: 10,
    justifyContent: "center",
    marginBottom: 28,
  },
  otpBox: {
    width: 48,
    height: 56,
    borderRadius: 12,
    borderWidth: 1.5,
    fontSize: 22,
    fontFamily: "Inter_700Bold",
  },
  resend: { alignItems: "center", marginTop: 20 },
  resendText: { fontSize: 14, fontFamily: "Inter_500Medium" },
});
