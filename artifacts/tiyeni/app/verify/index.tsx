import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator, Image, Platform, Pressable,
  ScrollView, StyleSheet, Text, View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { useColors } from "@/hooks/useColors";

const STEPS = [
  { icon: "card-outline", title: "National ID / NRC", desc: "A clear photo of your Malawi National Registration Card (front)" },
  { icon: "person-outline", title: "Selfie with ID", desc: "A selfie holding your ID next to your face" },
  { icon: "shield-checkmark-outline", title: "Admin review", desc: "Our team reviews within 24 hours and notifies you" },
];

async function pickImage(type: "camera" | "library"): Promise<string | null> {
  const perm = type === "camera"
    ? await ImagePicker.requestCameraPermissionsAsync()
    : await ImagePicker.requestMediaLibraryPermissionsAsync();

  if (!perm.granted) return null;

  const result = type === "camera"
    ? await ImagePicker.launchCameraAsync({ quality: 0.7, base64: true })
    : await ImagePicker.launchImageLibraryAsync({ quality: 0.7, base64: true, mediaTypes: ImagePicker.MediaTypeOptions.Images });

  if (result.canceled || !result.assets[0]) return null;
  // Return as data URI for now (in production, upload to S3/Cloudinary and return URL)
  return `data:image/jpeg;base64,${result.assets[0].base64}`;
}

export default function VerifyScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, updateUser } = useAuth();
  const { showToast } = useToast();
  const topPadding = Platform.OS === "web" ? insets.top + 67 : insets.top;

  const [idImageUri, setIdImageUri] = useState<string | null>(null);
  const [selfieUri, setSelfieUri] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const isVerified = user?.role === "verified" || user?.verificationStatus === "approved";
  const isPending = user?.verificationStatus === "pending";

  const handlePickId = async () => {
    const uri = await pickImage("library");
    if (uri) setIdImageUri(uri);
  };

  const handlePickSelfie = async () => {
    const uri = await pickImage("camera");
    if (uri) setSelfieUri(uri);
  };

  const handleSubmit = async () => {
    if (!idImageUri) { showToast("Please upload your NRC photo", "error"); return; }
    if (!selfieUri) { showToast("Please take a selfie with your ID", "error"); return; }
    setIsUploading(true);
    try {
      // In production: upload images to cloud storage and get URLs
      // For now we send placeholder URLs and mark as pending
      await api.verifyIdentity(idImageUri, selfieUri);
      await updateUser({ verificationStatus: "pending" });
      setSubmitted(true);
      showToast("Verification submitted!", "success");
    } catch (e: any) {
      showToast(e?.message ?? "Submission failed", "error");
    } finally {
      setIsUploading(false);
    }
  };

  if (isVerified) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { paddingTop: topPadding + 12, backgroundColor: colors.card, borderBottomColor: colors.border }]}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}><Ionicons name="arrow-back" size={22} color={colors.foreground} /></Pressable>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Verification</Text>
          <View style={{ width: 36 }} />
        </View>
        <View style={styles.center}>
          <Ionicons name="checkmark-circle" size={72} color={colors.success} />
          <Text style={[styles.doneTitle, { color: colors.foreground }]}>You're Verified!</Text>
          <Text style={[styles.doneBody, { color: colors.mutedForeground }]}>Your account is verified. You can offer trips and carry parcels.</Text>
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
          <Pressable onPress={() => router.back()} style={styles.backBtn}><Ionicons name="arrow-back" size={22} color={colors.foreground} /></Pressable>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Verification</Text>
          <View style={{ width: 36 }} />
        </View>
        <View style={styles.center}>
          <View style={[styles.pendingIcon, { backgroundColor: colors.accent + "15" }]}>
            <Ionicons name="time-outline" size={52} color={colors.accent} />
          </View>
          <Text style={[styles.doneTitle, { color: colors.foreground }]}>Under Review</Text>
          <Text style={[styles.doneBody, { color: colors.mutedForeground }]}>Your documents have been submitted. Our team will review within 24 hours.</Text>
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
        <Pressable onPress={() => router.back()} style={styles.backBtn}><Ionicons name="arrow-back" size={22} color={colors.foreground} /></Pressable>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Become Verified</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>
        <View style={[styles.heroBanner, { backgroundColor: colors.primary + "10", borderColor: colors.primary + "30" }]}>
          <Ionicons name="shield-checkmark-outline" size={32} color={colors.primary} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.heroTitle, { color: colors.foreground }]}>ID Verification</Text>
            <Text style={[styles.heroBody, { color: colors.mutedForeground }]}>Get the blue check. Build trust with senders and carriers across Malawi.</Text>
          </View>
        </View>

        {/* Steps */}
        {STEPS.map((s, i) => {
          const done = (i === 0 && !!idImageUri) || (i === 1 && !!selfieUri) || i === 2;
          return (
            <View key={i} style={[styles.stepRow, { opacity: i === 2 && (!idImageUri || !selfieUri) ? 0.4 : 1 }]}>
              <View style={[styles.stepNum, { backgroundColor: done ? colors.primary : colors.muted, borderColor: done ? colors.primary : colors.border }]}>
                {done && i < 2 ? <Ionicons name="checkmark" size={14} color="#fff" /> : <Text style={[styles.stepNumText, { color: done ? "#fff" : colors.mutedForeground }]}>{i + 1}</Text>}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.stepTitle, { color: colors.foreground }]}>{s.title}</Text>
                <Text style={[styles.stepDesc, { color: colors.mutedForeground }]}>{s.desc}</Text>
              </View>
              <Ionicons name={s.icon as any} size={22} color={done ? colors.primary : colors.border} />
            </View>
          );
        })}

        {/* NRC Upload */}
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>Step 1: Upload NRC Photo</Text>
        <Pressable onPress={handlePickId} style={[styles.uploadArea, { borderColor: idImageUri ? colors.primary : colors.border, backgroundColor: idImageUri ? colors.primary + "08" : colors.muted }]}>
          {idImageUri ? (
            <Image source={{ uri: idImageUri }} style={styles.previewImage} />
          ) : (
            <>
              <Ionicons name="card-outline" size={40} color={colors.mutedForeground} />
              <Text style={[styles.uploadTitle, { color: colors.foreground }]}>Tap to upload NRC</Text>
              <Text style={[styles.uploadSubtitle, { color: colors.mutedForeground }]}>Choose from gallery</Text>
            </>
          )}
        </Pressable>
        {idImageUri && (
          <Pressable onPress={handlePickId} style={styles.retakeBtn}>
            <Text style={[styles.retakeText, { color: colors.primary }]}>Change photo</Text>
          </Pressable>
        )}

        {/* Selfie */}
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground, marginTop: 16 }]}>Step 2: Selfie with ID</Text>
        <Pressable onPress={handlePickSelfie} style={[styles.uploadArea, { borderColor: selfieUri ? colors.primary : colors.border, backgroundColor: selfieUri ? colors.primary + "08" : colors.muted }]}>
          {selfieUri ? (
            <Image source={{ uri: selfieUri }} style={styles.previewImage} />
          ) : (
            <>
              <Ionicons name="camera-outline" size={40} color={colors.mutedForeground} />
              <Text style={[styles.uploadTitle, { color: colors.foreground }]}>Take selfie with ID</Text>
              <Text style={[styles.uploadSubtitle, { color: colors.mutedForeground }]}>Hold your NRC next to your face</Text>
            </>
          )}
        </Pressable>
        {selfieUri && (
          <Pressable onPress={handlePickSelfie} style={styles.retakeBtn}>
            <Text style={[styles.retakeText, { color: colors.primary }]}>Retake selfie</Text>
          </Pressable>
        )}

        <Pressable
          onPress={handleSubmit}
          disabled={isUploading || !idImageUri || !selfieUri}
          style={[styles.submitBtn, { backgroundColor: colors.primary, opacity: (!idImageUri || !selfieUri || isUploading) ? 0.5 : 1 }]}
        >
          {isUploading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>Submit for Review</Text>}
        </Pressable>

        <View style={[styles.infoBox, { backgroundColor: colors.muted, borderColor: colors.border }]}>
          <Ionicons name="lock-closed-outline" size={16} color={colors.mutedForeground} />
          <Text style={[styles.infoText, { color: colors.mutedForeground }]}>Your documents are encrypted and only used for identity verification.</Text>
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
  stepRow: { flexDirection: "row", alignItems: "flex-start", gap: 14, marginBottom: 20 },
  stepNum: { width: 28, height: 28, borderRadius: 14, borderWidth: 1.5, alignItems: "center", justifyContent: "center" },
  stepNumText: { fontSize: 13, fontFamily: "Inter_700Bold" },
  stepTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold", marginBottom: 2 },
  stepDesc: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 18 },
  sectionLabel: { fontSize: 12, fontFamily: "Inter_600SemiBold", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 },
  uploadArea: { borderWidth: 2, borderStyle: "dashed", borderRadius: 16, padding: 24, alignItems: "center", gap: 10, marginBottom: 8, minHeight: 140, justifyContent: "center" },
  uploadTitle: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  uploadSubtitle: { fontSize: 13, fontFamily: "Inter_400Regular" },
  previewImage: { width: "100%", height: 160, borderRadius: 12, resizeMode: "cover" },
  retakeBtn: { alignItems: "center", marginBottom: 8 },
  retakeText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  submitBtn: { paddingVertical: 16, borderRadius: 14, alignItems: "center", marginTop: 16, marginBottom: 16 },
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
