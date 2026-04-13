import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Platform, Pressable, ScrollView,
  StyleSheet, Text, View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { useColors } from "@/hooks/useColors";

const STEPS = [
  { icon: "card-outline", title: "National ID / NRC", desc: "A clear photo of your Malawi National Registration Card (front)" },
  { icon: "person-outline", title: "Selfie verification", desc: "A selfie holding your ID next to your face" },
  { icon: "shield-checkmark-outline", title: "Admin review", desc: "Our team reviews within 24 hours and notifies you" },
];

export default function VerifyScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, requestVerification } = useAuth();
  const { showToast } = useToast();
  const [step, setStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const topPadding = Platform.OS === "web" ? insets.top + 67 : insets.top;

  const isVerified = user?.role === "verified" || user?.verificationStatus === "approved";
  const isPending = user?.verificationStatus === "pending";

  const handleSimulateUpload = async () => {
    setIsLoading(true);
    await new Promise((r) => setTimeout(r, 1500));
    if (step < 1) {
      setStep(1);
      setIsLoading(false);
      return;
    }
    await requestVerification();
    setSubmitted(true);
    setIsLoading(false);
    showToast("Verification submitted!", "success");
  };

  if (isVerified) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { paddingTop: topPadding + 12, backgroundColor: colors.card, borderBottomColor: colors.border }]}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={colors.foreground} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Verification</Text>
          <View style={{ width: 36 }} />
        </View>
        <View style={styles.center}>
          <Ionicons name="checkmark-circle" size={72} color={colors.success} />
          <Text style={[styles.doneTitle, { color: colors.foreground }]}>You're Verified!</Text>
          <Text style={[styles.doneBody, { color: colors.mutedForeground }]}>
            Your account is verified. You can offer trips and carry parcels.
          </Text>
          <Pressable onPress={() => router.back()} style={[styles.doneBtn, { backgroundColor: colors.primary }]}>
            <Text style={styles.doneBtnText}>Back to Profile</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  if (isPending || submitted) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { paddingTop: topPadding + 12, backgroundColor: colors.card, borderBottomColor: colors.border }]}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={colors.foreground} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Verification</Text>
          <View style={{ width: 36 }} />
        </View>
        <View style={styles.center}>
          <View style={[styles.pendingIcon, { backgroundColor: colors.accent + "15" }]}>
            <Ionicons name="time-outline" size={52} color={colors.accent} />
          </View>
          <Text style={[styles.doneTitle, { color: colors.foreground }]}>Under Review</Text>
          <Text style={[styles.doneBody, { color: colors.mutedForeground }]}>
            Your documents have been submitted. Our team will review within 24 hours and you'll be notified.
          </Text>
          <Pressable onPress={() => router.back()} style={[styles.doneBtn, { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }]}>
            <Text style={[styles.doneBtnText, { color: colors.foreground }]}>Back to Profile</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPadding + 12, backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Become Verified</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>
        <View style={[styles.heroBanner, { backgroundColor: colors.primary + "10", borderColor: colors.primary + "30" }]}>
          <Ionicons name="shield-checkmark-outline" size={32} color={colors.primary} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.heroTitle, { color: colors.foreground }]}>ID Verification</Text>
            <Text style={[styles.heroBody, { color: colors.mutedForeground }]}>
              Get the blue check. Earn more. Build trust with senders and carriers across Malawi.
            </Text>
          </View>
        </View>

        <Text style={[styles.stepsTitle, { color: colors.mutedForeground }]}>How it works</Text>
        {STEPS.map((s, i) => (
          <View key={i} style={[styles.stepRow, { opacity: i > step ? 0.4 : 1 }]}>
            <View style={[styles.stepNum, { backgroundColor: i <= step ? colors.primary : colors.muted, borderColor: i <= step ? colors.primary : colors.border }]}>
              {i < step ? (
                <Ionicons name="checkmark" size={14} color="#fff" />
              ) : (
                <Text style={[styles.stepNumText, { color: i === step ? "#fff" : colors.mutedForeground }]}>{i + 1}</Text>
              )}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.stepTitle, { color: colors.foreground }]}>{s.title}</Text>
              <Text style={[styles.stepDesc, { color: colors.mutedForeground }]}>{s.desc}</Text>
            </View>
            <Ionicons name={s.icon as any} size={22} color={i <= step ? colors.primary : colors.border} />
          </View>
        ))}

        {/* Simulated upload area */}
        {step < 2 && (
          <Pressable
            onPress={handleSimulateUpload}
            disabled={isLoading}
            style={[styles.uploadArea, { borderColor: colors.primary + "50", backgroundColor: colors.primary + "08" }]}
          >
            <Ionicons name={step === 0 ? "camera-outline" : "person-outline"} size={40} color={colors.primary} />
            <Text style={[styles.uploadTitle, { color: colors.foreground }]}>
              {step === 0 ? "Upload NRC Photo" : "Take Selfie with ID"}
            </Text>
            <Text style={[styles.uploadSubtitle, { color: colors.mutedForeground }]}>
              {isLoading ? "Uploading..." : "Tap to choose photo"}
            </Text>
          </Pressable>
        )}

        {step >= 1 && (
          <Pressable
            onPress={handleSimulateUpload}
            disabled={isLoading}
            style={[styles.submitBtn, { backgroundColor: colors.primary, opacity: isLoading ? 0.7 : 1 }]}
          >
            <Text style={styles.submitBtnText}>
              {isLoading ? "Submitting..." : "Submit for Review"}
            </Text>
          </Pressable>
        )}

        <View style={[styles.infoBox, { backgroundColor: colors.muted, borderColor: colors.border }]}>
          <Ionicons name="lock-closed-outline" size={16} color={colors.mutedForeground} />
          <Text style={[styles.infoText, { color: colors.mutedForeground }]}>
            Your documents are encrypted and only used for identity verification. We never share them.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingBottom: 14, borderBottomWidth: 1 },
  backBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  headerTitle: { flex: 1, fontSize: 18, fontFamily: "Inter_700Bold", textAlign: "center" },
  heroBanner: { flexDirection: "row", gap: 14, padding: 16, borderRadius: 16, borderWidth: 1, marginBottom: 24, alignItems: "center" },
  heroTitle: { fontSize: 16, fontFamily: "Inter_700Bold", marginBottom: 4 },
  heroBody: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 18 },
  stepsTitle: { fontSize: 12, fontFamily: "Inter_600SemiBold", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 14 },
  stepRow: { flexDirection: "row", alignItems: "flex-start", gap: 14, marginBottom: 20 },
  stepNum: { width: 28, height: 28, borderRadius: 14, borderWidth: 1.5, alignItems: "center", justifyContent: "center" },
  stepNumText: { fontSize: 13, fontFamily: "Inter_700Bold" },
  stepTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold", marginBottom: 2 },
  stepDesc: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 18 },
  uploadArea: {
    borderWidth: 2, borderStyle: "dashed", borderRadius: 16,
    padding: 32, alignItems: "center", gap: 10, marginBottom: 16, marginTop: 4,
  },
  uploadTitle: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  uploadSubtitle: { fontSize: 13, fontFamily: "Inter_400Regular" },
  submitBtn: { paddingVertical: 16, borderRadius: 14, alignItems: "center", marginBottom: 16 },
  submitBtnText: { color: "#fff", fontSize: 16, fontFamily: "Inter_700Bold" },
  infoBox: { flexDirection: "row", gap: 10, padding: 14, borderRadius: 12, borderWidth: 1, alignItems: "flex-start" },
  infoText: { flex: 1, fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 18 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 40, gap: 16 },
  pendingIcon: { width: 100, height: 100, borderRadius: 50, alignItems: "center", justifyContent: "center" },
  doneTitle: { fontSize: 24, fontFamily: "Inter_700Bold", textAlign: "center" },
  doneBody: { fontSize: 15, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 22 },
  doneBtn: { paddingHorizontal: 40, paddingVertical: 14, borderRadius: 14 },
  doneBtnText: { color: "#fff", fontSize: 16, fontFamily: "Inter_700Bold" },
});
