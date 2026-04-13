import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  KeyboardAvoidingView, Platform, Pressable,
  ScrollView, StyleSheet, Text, TextInput, View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
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
  const [isSaving, setIsSaving] = useState(false);

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

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
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
          <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
            <Text style={styles.avatarText}>
              {name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2)}
            </Text>
          </View>
          <Text style={[styles.avatarHint, { color: colors.mutedForeground }]}>
            Profile photo coming soon
          </Text>
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
          <Text style={[styles.hint, { color: colors.mutedForeground }]}>Phone number cannot be changed</Text>
        </View>
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
  avatar: { width: 80, height: 80, borderRadius: 40, alignItems: "center", justifyContent: "center" },
  avatarText: { color: "#fff", fontSize: 28, fontFamily: "Inter_700Bold" },
  avatarHint: { fontSize: 13, fontFamily: "Inter_400Regular" },
  label: { fontSize: 12, fontFamily: "Inter_600SemiBold", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, fontFamily: "Inter_400Regular" },
  readOnly: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderWidth: 1, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14 },
  readOnlyText: { fontSize: 15, fontFamily: "Inter_400Regular" },
  hint: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 6 },
});
