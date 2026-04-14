import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator, Image, KeyboardAvoidingView, Platform,
  Pressable, ScrollView, StyleSheet, Text, TextInput, View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { useColors } from "@/hooks/useColors";

export default function EditProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, updateUser } = useAuth();
  const { showToast } = useToast();
  const topPadding = Platform.OS === "web" ? insets.top + 67 : insets.top;

  const [name, setName] = useState(user?.name ?? "");
  const [avatarUri, setAvatarUri] = useState<string | null>(user?.avatarUrl ?? null);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  const handlePickPhoto = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) { showToast("Camera roll permission required", "error"); return; }

    const result = await ImagePicker.launchImageLibraryAsync({
      quality: 0.7,
      base64: true,
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
    });

    if (result.canceled || !result.assets[0]) return;

    setIsUploadingPhoto(true);
    try {
      // In production: upload to cloud storage and get URL
      // For now use base64 data URI
      const dataUri = `data:image/jpeg;base64,${result.assets[0].base64}`;
      setAvatarUri(dataUri);
      await api.updateProfile({ avatarUrl: dataUri });
      await updateUser({ avatarUrl: dataUri });
      showToast("Photo updated", "success");
    } catch {
      showToast("Failed to upload photo", "error");
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) { showToast("Name cannot be empty", "error"); return; }
    setIsSaving(true);
    try {
      await updateUser({ name: name.trim() });
      showToast("Profile updated", "success");
      router.back();
    } catch {
      showToast("Failed to update profile", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const initials = name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);

  return (
    <KeyboardAvoidingView style={[styles.container, { backgroundColor: colors.background }]} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={[styles.header, { paddingTop: topPadding + 12, backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Edit Profile</Text>
        <Pressable onPress={handleSave} disabled={isSaving} style={styles.saveBtn}>
          <Text style={[styles.saveBtnText, { color: isSaving ? colors.mutedForeground : colors.primary }]}>
            {isSaving ? "Saving..." : "Save"}
          </Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, gap: 20 }}>
        {/* Avatar */}
        <View style={styles.avatarSection}>
          <Pressable onPress={handlePickPhoto} style={styles.avatarWrap}>
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
            ) : (
              <View style={[styles.avatarFallback, { backgroundColor: colors.primary }]}>
                <Text style={styles.avatarText}>{initials}</Text>
              </View>
            )}
            <View style={[styles.cameraOverlay, { backgroundColor: colors.primary }]}>
              {isUploadingPhoto
                ? <ActivityIndicator size="small" color="#fff" />
                : <Ionicons name="camera" size={16} color="#fff" />
              }
            </View>
          </Pressable>
          <Text style={[styles.avatarHint, { color: colors.mutedForeground }]}>Tap to change photo</Text>
        </View>

        {/* Name */}
        <View>
          <Text style={[styles.label, { color: colors.mutedForeground }]}>Full Name</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
            value={name}
            onChangeText={setName}
            placeholder="Your full name"
            placeholderTextColor={colors.mutedForeground}
            autoCapitalize="words"
          />
        </View>

        {/* Phone (read-only) */}
        <View>
          <Text style={[styles.label, { color: colors.mutedForeground }]}>Phone Number</Text>
          <View style={[styles.readOnly, { backgroundColor: colors.muted, borderColor: colors.border }]}>
            <Text style={[styles.readOnlyText, { color: colors.mutedForeground }]}>{user?.phone}</Text>
            <Ionicons name="lock-closed-outline" size={14} color={colors.mutedForeground} />
          </View>
        </View>

        {/* Email (read-only) */}
        {(user as any)?.email && (
          <View>
            <Text style={[styles.label, { color: colors.mutedForeground }]}>Email</Text>
            <View style={[styles.readOnly, { backgroundColor: colors.muted, borderColor: colors.border }]}>
              <Text style={[styles.readOnlyText, { color: colors.mutedForeground }]}>{(user as any).email}</Text>
              <Ionicons name="lock-closed-outline" size={14} color={colors.mutedForeground} />
            </View>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingBottom: 14, borderBottomWidth: 1 },
  backBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  headerTitle: { flex: 1, fontSize: 18, fontFamily: "Inter_700Bold", textAlign: "center" },
  saveBtn: { minWidth: 50, alignItems: "flex-end" },
  saveBtnText: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  avatarSection: { alignItems: "center", gap: 10, paddingVertical: 10 },
  avatarWrap: { position: "relative" },
  avatarImage: { width: 90, height: 90, borderRadius: 45 },
  avatarFallback: { width: 90, height: 90, borderRadius: 45, alignItems: "center", justifyContent: "center" },
  avatarText: { color: "#fff", fontSize: 32, fontFamily: "Inter_700Bold" },
  cameraOverlay: { position: "absolute", bottom: 0, right: 0, width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: "#fff" },
  avatarHint: { fontSize: 13, fontFamily: "Inter_400Regular" },
  label: { fontSize: 12, fontFamily: "Inter_600SemiBold", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, fontFamily: "Inter_400Regular" },
  readOnly: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderWidth: 1, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14 },
  readOnlyText: { fontSize: 15, fontFamily: "Inter_400Regular" },
});
