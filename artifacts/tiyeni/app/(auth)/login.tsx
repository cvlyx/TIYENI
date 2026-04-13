import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useRef, useState } from "react";
import {
  Animated,
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
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { useColors } from "@/hooks/useColors";

function GlassInput({
  value,
  onChangeText,
  placeholder,
  keyboardType,
  maxLength,
  prefix,
}: any) {
  const focusAnim = useRef(new Animated.Value(0)).current;

  const handleFocus = () => {
    Animated.timing(focusAnim, { toValue: 1, duration: 200, useNativeDriver: false }).start();
  };
  const handleBlur = () => {
    Animated.timing(focusAnim, { toValue: 0, duration: 200, useNativeDriver: false }).start();
  };

  const borderColor = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["rgba(255,255,255,0.15)", "rgba(76,175,80,0.8)"],
  });

  const backgroundColor = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["rgba(255,255,255,0.08)", "rgba(76,175,80,0.1)"],
  });

  return (
    <Animated.View style={[styles.inputWrap, { borderColor, backgroundColor }]}>
      {prefix && (
        <>
          <Text style={styles.prefixText}>{prefix}</Text>
          <View style={styles.prefixDivider} />
        </>
      )}
      <TextInput
        style={styles.textInput}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="rgba(255,255,255,0.35)"
        keyboardType={keyboardType}
        maxLength={maxLength}
        onFocus={handleFocus}
        onBlur={handleBlur}
      />
    </Animated.View>
  );
}

export default function LoginScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { showToast } = useToast();
  const { requestOtp } = useAuth();
  const [phone, setPhone] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const topPadding = Platform.OS === "web" ? insets.top + 67 : insets.top;

  const handleLogin = async () => {
    if (!phone || phone.length < 9) {
      showToast("Enter a valid phone number", "error");
      return;
    }
    setIsLoading(true);
    try {
      await requestOtp(phone);
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Failed to send OTP", "error");
      setIsLoading(false);
      return;
    }
    router.push({ pathname: "/(auth)/otp", params: { phone, name: "" } } as any);
    setIsLoading(false);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <LinearGradient
        colors={["#0D2B12", "#1A4A1E", "#2E7D32"]}
        style={StyleSheet.absoluteFill}
      />

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: topPadding + 16 }]}
        keyboardShouldPersistTaps="handled"
      >
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <View style={styles.backCircle}>
            <Ionicons name="arrow-back" size={20} color="#fff" />
          </View>
        </Pressable>

        <View style={styles.header}>
          <View style={styles.iconWrap}>
            <Ionicons name="phone-portrait-outline" size={28} color="#4CAF50" />
          </View>
          <Text style={styles.title}>Welcome back</Text>
          <Text style={styles.subtitle}>Enter your Malawian number to continue</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>Phone number</Text>
          <GlassInput
            value={phone}
            onChangeText={setPhone}
            placeholder="Phone number"
            keyboardType="phone-pad"
            maxLength={10}
            prefix="+265"
            colors={colors}
          />

          <Pressable
            onPress={handleLogin}
            disabled={isLoading}
            style={({ pressed }) => [
              styles.btn,
              { opacity: pressed || isLoading ? 0.8 : 1 },
            ]}
          >
            <LinearGradient
              colors={["#388E3C", "#2E7D32"]}
              style={styles.btnGradient}
            >
              <Text style={styles.btnText}>
                {isLoading ? "Sending..." : "Send OTP Code"}
              </Text>
            </LinearGradient>
          </Pressable>

          <Pressable onPress={() => router.push("/(auth)/register")} style={styles.linkRow}>
            <Text style={styles.linkText}>
              No account?{" "}
              <Text style={{ color: "#81C784", fontFamily: "Inter_600SemiBold" }}>
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
  scroll: { flexGrow: 1, paddingHorizontal: 24, paddingBottom: 60 },
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
  header: { alignItems: "center", marginBottom: 40 },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: "rgba(76,175,80,0.15)",
    borderWidth: 1,
    borderColor: "rgba(76,175,80,0.3)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  title: {
    color: "#fff",
    fontSize: 26,
    fontFamily: "Inter_700Bold",
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  subtitle: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
  form: { gap: 14 },
  label: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginBottom: -4,
  },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    overflow: "hidden",
    gap: 12,
  },
  prefixText: {
    color: "#fff",
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  prefixDivider: {
    width: 1,
    height: 18,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  textInput: {
    flex: 1,
    color: "#fff",
    fontSize: 16,
    fontFamily: "Inter_400Regular",
  },
  btn: {
    borderRadius: 14,
    overflow: "hidden",
    marginTop: 4,
    shadowColor: "#2E7D32",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 6,
  },
  btnGradient: {
    paddingVertical: 16,
    alignItems: "center",
  },
  btnText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "Inter_700Bold",
  },
  linkRow: { alignItems: "center", paddingTop: 8 },
  linkText: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
});
