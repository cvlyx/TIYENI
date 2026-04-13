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
import { useToast } from "@/contexts/ToastContext";
import { useColors } from "@/hooks/useColors";

function GlassInput({
  value,
  onChangeText,
  placeholder,
  keyboardType,
  autoCapitalize,
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
        autoCapitalize={autoCapitalize}
        onFocus={handleFocus}
        onBlur={handleBlur}
      />
    </Animated.View>
  );
}

export default function RegisterScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { showToast } = useToast();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const topPadding = Platform.OS === "web" ? insets.top + 67 : insets.top;

  const handleRegister = async () => {
    if (!name.trim()) { showToast("Enter your full name", "error"); return; }
    if (!phone || phone.length < 9) { showToast("Enter a valid phone number", "error"); return; }
    setIsLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    router.push({ pathname: "/(auth)/otp", params: { phone, name } } as any);
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
          <Text style={styles.title}>Create account</Text>
          <Text style={styles.subtitle}>
            Join Tiyeni and start sending or carrying parcels across Malawi
          </Text>
        </View>

        <View style={styles.form}>
          <View>
            <Text style={styles.label}>Full name</Text>
            <GlassInput
              value={name}
              onChangeText={setName}
              placeholder="e.g. Chisomo Banda"
              autoCapitalize="words"
            />
          </View>
          <View>
            <Text style={styles.label}>Phone number</Text>
            <GlassInput
              value={phone}
              onChangeText={setPhone}
              placeholder="Phone number"
              keyboardType="phone-pad"
              prefix="+265"
            />
          </View>

          <View style={styles.infoBox}>
            <Ionicons name="shield-checkmark-outline" size={16} color="#81C784" />
            <Text style={styles.infoText}>
              To offer trips, upgrade to Verified after registration via your profile.
            </Text>
          </View>

          <Pressable
            onPress={handleRegister}
            disabled={isLoading}
            style={({ pressed }) => [styles.btn, { opacity: pressed || isLoading ? 0.8 : 1 }]}
          >
            <LinearGradient colors={["#388E3C", "#2E7D32"]} style={styles.btnGradient}>
              <Text style={styles.btnText}>
                {isLoading ? "Creating..." : "Create Account"}
              </Text>
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
  header: { marginBottom: 36 },
  title: {
    color: "#fff",
    fontSize: 28,
    fontFamily: "Inter_700Bold",
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    lineHeight: 22,
  },
  form: { gap: 16 },
  label: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginBottom: 6,
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
  prefixText: { color: "#fff", fontSize: 15, fontFamily: "Inter_600SemiBold" },
  prefixDivider: { width: 1, height: 18, backgroundColor: "rgba(255,255,255,0.2)" },
  textInput: { flex: 1, color: "#fff", fontSize: 16, fontFamily: "Inter_400Regular" },
  infoBox: {
    flexDirection: "row",
    gap: 10,
    padding: 14,
    borderRadius: 12,
    backgroundColor: "rgba(76,175,80,0.1)",
    borderWidth: 1,
    borderColor: "rgba(76,175,80,0.2)",
    alignItems: "center",
  },
  infoText: {
    flex: 1,
    color: "rgba(255,255,255,0.55)",
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    lineHeight: 18,
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
  btnGradient: { paddingVertical: 16, alignItems: "center" },
  btnText: { color: "#fff", fontSize: 16, fontFamily: "Inter_700Bold" },
  linkRow: { alignItems: "center", paddingTop: 4 },
  linkText: { color: "rgba(255,255,255,0.5)", fontSize: 14, fontFamily: "Inter_400Regular" },
});
