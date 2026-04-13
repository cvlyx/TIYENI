import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Platform, Pressable, ScrollView,
  StyleSheet, Switch, Text, View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { useColors } from "@/hooks/useColors";

export default function PrivacyScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { logout } = useAuth();
  const { showToast } = useToast();
  const topPadding = Platform.OS === "web" ? insets.top + 67 : insets.top;

  const [locationSharing, setLocationSharing] = useState(false);
  const [profileVisible, setProfileVisible] = useState(true);
  const [ratingVisible, setRatingVisible] = useState(true);

  const handleDeleteAccount = () => {
    showToast("Contact support@tiyeni.app to delete your account", "info");
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPadding + 12, backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Privacy & Security</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 100 }}>
        {/* Privacy */}
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>Privacy</Text>

          <View style={styles.row}>
            <View style={styles.rowInfo}>
              <Ionicons name="location-outline" size={18} color={colors.primary} />
              <View>
                <Text style={[styles.rowLabel, { color: colors.foreground }]}>Location sharing</Text>
                <Text style={[styles.rowSub, { color: colors.mutedForeground }]}>Share location during active trips</Text>
              </View>
            </View>
            <Switch value={locationSharing} onValueChange={setLocationSharing} trackColor={{ true: colors.primary }} thumbColor="#fff" />
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <View style={styles.row}>
            <View style={styles.rowInfo}>
              <Ionicons name="person-outline" size={18} color={colors.primary} />
              <View>
                <Text style={[styles.rowLabel, { color: colors.foreground }]}>Public profile</Text>
                <Text style={[styles.rowSub, { color: colors.mutedForeground }]}>Others can see your profile</Text>
              </View>
            </View>
            <Switch value={profileVisible} onValueChange={setProfileVisible} trackColor={{ true: colors.primary }} thumbColor="#fff" />
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <View style={styles.row}>
            <View style={styles.rowInfo}>
              <Ionicons name="star-outline" size={18} color={colors.primary} />
              <View>
                <Text style={[styles.rowLabel, { color: colors.foreground }]}>Show rating</Text>
                <Text style={[styles.rowSub, { color: colors.mutedForeground }]}>Display your rating publicly</Text>
              </View>
            </View>
            <Switch value={ratingVisible} onValueChange={setRatingVisible} trackColor={{ true: colors.primary }} thumbColor="#fff" />
          </View>
        </View>

        {/* Security */}
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>Security</Text>
          <Pressable style={styles.row} onPress={() => showToast("OTP is used for all logins — no password needed", "info")}>
            <View style={styles.rowInfo}>
              <Ionicons name="phone-portrait-outline" size={18} color={colors.primary} />
              <View>
                <Text style={[styles.rowLabel, { color: colors.foreground }]}>Two-factor auth</Text>
                <Text style={[styles.rowSub, { color: colors.mutedForeground }]}>OTP via SMS — always on</Text>
              </View>
            </View>
            <View style={[styles.activeBadge, { backgroundColor: colors.success + "20" }]}>
              <Text style={[styles.activeBadgeText, { color: colors.success }]}>Active</Text>
            </View>
          </Pressable>
        </View>

        {/* Danger zone */}
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>Danger Zone</Text>
          <Pressable style={styles.row} onPress={handleDeleteAccount}>
            <View style={styles.rowInfo}>
              <Ionicons name="trash-outline" size={18} color={colors.destructive} />
              <View>
                <Text style={[styles.rowLabel, { color: colors.destructive }]}>Delete account</Text>
                <Text style={[styles.rowSub, { color: colors.mutedForeground }]}>Permanently remove your data</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.mutedForeground} />
          </Pressable>
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
  section: { borderRadius: 14, borderWidth: 1, overflow: "hidden" },
  sectionTitle: { fontSize: 11, fontFamily: "Inter_600SemiBold", textTransform: "uppercase", letterSpacing: 0.8, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 8 },
  row: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14 },
  rowInfo: { flex: 1, flexDirection: "row", alignItems: "center", gap: 12 },
  rowLabel: { fontSize: 15, fontFamily: "Inter_500Medium", marginBottom: 2 },
  rowSub: { fontSize: 12, fontFamily: "Inter_400Regular" },
  divider: { height: 1, marginHorizontal: 16 },
  activeBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  activeBadgeText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
});
