import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import {
  Pressable,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StarRating } from "@/components/StarRating";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { useColors } from "@/hooks/useColors";

interface SettingRowProps {
  icon: string;
  label: string;
  onPress: () => void;
  danger?: boolean;
}

function SettingRow({ icon, label, onPress, danger = false }: SettingRowProps) {
  const colors = useColors();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.settingRow,
        { backgroundColor: pressed ? colors.muted : "transparent" },
      ]}
    >
      <View style={[styles.settingIcon, { backgroundColor: danger ? colors.destructive + "15" : colors.muted }]}>
        <Ionicons
          name={icon as any}
          size={18}
          color={danger ? colors.destructive : colors.primary}
        />
      </View>
      <Text style={[styles.settingLabel, { color: danger ? colors.destructive : colors.foreground }]}>
        {label}
      </Text>
      <Ionicons name="chevron-forward" size={16} color={colors.mutedForeground} />
    </Pressable>
  );
}

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, logout, requestVerification } = useAuth();
  const { showToast } = useToast();

  const topPadding = Platform.OS === "web" ? insets.top + 67 : insets.top;
  const bottomPadding = Platform.OS === "web" ? 34 : insets.bottom;

  const handleLogout = async () => {
    await logout();
    showToast("Signed out successfully", "info");
    router.replace("/(auth)/welcome");
  };

  const handleRequestVerification = async () => {
    await requestVerification();
    showToast("Verification request submitted!", "success");
  };

  if (!user) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.headerBar, { paddingTop: topPadding + 16, backgroundColor: colors.card }]}>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Profile</Text>
        </View>
        <View style={styles.center}>
          <Ionicons name="person-circle-outline" size={64} color={colors.border} />
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Sign in to view profile</Text>
          <Pressable onPress={() => router.push("/(auth)/login")} style={[styles.signInBtn, { backgroundColor: colors.primary }]}>
            <Text style={styles.signInText}>Sign In</Text>
          </Pressable>
          <Pressable onPress={() => router.push("/(auth)/register")}>
            <Text style={[styles.registerLink, { color: colors.primary }]}>Create account</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const initials = user.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const verificationPending = user.verificationStatus === "pending";
  const isVerified = user.role === "verified" || user.verificationStatus === "approved";

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: bottomPadding + 100 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.heroSection, { paddingTop: topPadding + 20, backgroundColor: colors.primary }]}>
          <View style={[styles.avatarCircle, { backgroundColor: "rgba(255,255,255,0.25)" }]}>
            <Text style={styles.avatarInitials}>{initials}</Text>
          </View>
          <Text style={styles.userName}>{user.name}</Text>
          <Text style={styles.userPhone}>{user.phone}</Text>
          <View style={styles.metaRow}>
            <StarRating rating={user.rating} size={14} />
            {isVerified && <VerifiedBadge size="md" />}
          </View>
        </View>

        <View style={[styles.statsRow, { backgroundColor: colors.card }]}>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.foreground }]}>{user.tripsCompleted}</Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Trips</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.foreground }]}>{user.rating}</Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Rating</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.foreground }]}>
              {isVerified ? "Yes" : "No"}
            </Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Verified</Text>
          </View>
        </View>

        {!isVerified && !verificationPending && (
          <Pressable
            onPress={handleRequestVerification}
            style={[styles.verifyBanner, { backgroundColor: colors.accent + "18", borderColor: colors.accent }]}
          >
            <View style={styles.verifyBannerContent}>
              <Ionicons name="shield-checkmark-outline" size={24} color={colors.accent} />
              <View style={styles.verifyBannerText}>
                <Text style={[styles.verifyBannerTitle, { color: colors.foreground }]}>Become Verified</Text>
                <Text style={[styles.verifyBannerSubtitle, { color: colors.mutedForeground }]}>
                  Upload your ID to offer trips and carry parcels
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.accent} />
          </Pressable>
        )}

        {verificationPending && (
          <View style={[styles.verifyBanner, { backgroundColor: colors.warning + "15", borderColor: colors.warning }]}>
            <View style={styles.verifyBannerContent}>
              <Ionicons name="time-outline" size={24} color={colors.warning} />
              <View style={styles.verifyBannerText}>
                <Text style={[styles.verifyBannerTitle, { color: colors.foreground }]}>Verification Pending</Text>
                <Text style={[styles.verifyBannerSubtitle, { color: colors.mutedForeground }]}>
                  Our team is reviewing your submission
                </Text>
              </View>
            </View>
          </View>
        )}

        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>Account</Text>
          <SettingRow icon="person-outline" label="Edit Profile" onPress={() => showToast("Coming soon", "info")} />
          <SettingRow icon="notifications-outline" label="Notifications" onPress={() => showToast("Coming soon", "info")} />
          <SettingRow icon="lock-closed-outline" label="Privacy & Security" onPress={() => showToast("Coming soon", "info")} />
        </View>

        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>Support</Text>
          <SettingRow icon="help-circle-outline" label="Help Center" onPress={() => showToast("Coming soon", "info")} />
          <SettingRow icon="star-outline" label="Rate the App" onPress={() => showToast("Thank you!", "success")} />
          <SettingRow icon="document-text-outline" label="Terms & Privacy" onPress={() => showToast("Coming soon", "info")} />
        </View>

        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <SettingRow icon="log-out-outline" label="Sign Out" onPress={handleLogout} danger />
        </View>

        <Text style={[styles.version, { color: colors.mutedForeground }]}>Tiyeni v1.0.0</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerBar: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  headerTitle: { fontSize: 22, fontFamily: "Inter_700Bold" },
  heroSection: {
    alignItems: "center",
    paddingBottom: 28,
    paddingHorizontal: 20,
  },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  avatarInitials: {
    color: "#fff",
    fontSize: 28,
    fontFamily: "Inter_700Bold",
  },
  userName: {
    color: "#fff",
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    marginBottom: 4,
  },
  userPhone: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    marginBottom: 10,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  statsRow: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    paddingVertical: 16,
  },
  statItem: { flex: 1, alignItems: "center" },
  statValue: { fontSize: 20, fontFamily: "Inter_700Bold", marginBottom: 2 },
  statLabel: { fontSize: 12, fontFamily: "Inter_400Regular" },
  statDivider: { width: 1, alignSelf: "stretch", marginVertical: 4 },
  verifyBanner: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginTop: 16,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  verifyBannerContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  verifyBannerText: { flex: 1 },
  verifyBannerTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold", marginBottom: 2 },
  verifyBannerSubtitle: { fontSize: 13, fontFamily: "Inter_400Regular" },
  section: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 14,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  sectionTitle: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 4,
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  settingIcon: {
    width: 34,
    height: 34,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  settingLabel: { flex: 1, fontSize: 15, fontFamily: "Inter_400Regular" },
  version: { textAlign: "center", fontSize: 12, marginTop: 24, marginBottom: 8 },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 80,
    gap: 12,
  },
  emptyTitle: { fontSize: 18, fontFamily: "Inter_600SemiBold" },
  signInBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  signInText: { color: "#fff", fontSize: 15, fontFamily: "Inter_600SemiBold" },
  registerLink: { fontSize: 14, fontFamily: "Inter_500Medium" },
});
