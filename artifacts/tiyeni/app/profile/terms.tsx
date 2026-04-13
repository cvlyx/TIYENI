import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import {
  Platform, Pressable, ScrollView,
  StyleSheet, Text, View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";

const SECTIONS = [
  {
    title: "1. Acceptance of Terms",
    body: "By using Tiyeni, you agree to these terms. Tiyeni is a peer-to-peer parcel delivery and ride-sharing platform connecting senders and carriers across Malawi.",
  },
  {
    title: "2. User Responsibilities",
    body: "Users must provide accurate information, treat other users with respect, and comply with all applicable Malawian laws. You are responsible for the parcels you send and carry.",
  },
  {
    title: "3. Payments & Wallet",
    body: "All payments are processed through the Tiyeni Wallet via PayChangu. Funds are held in escrow until delivery is confirmed. Tiyeni charges a platform fee on completed transactions.",
  },
  {
    title: "4. Verification",
    body: "Verified users have submitted government-issued ID. Verification does not guarantee the safety of any transaction. Always exercise caution.",
  },
  {
    title: "5. Prohibited Items",
    body: "You may not send illegal items, hazardous materials, weapons, drugs, or any items prohibited under Malawian law. Violations will result in account suspension.",
  },
  {
    title: "6. Liability",
    body: "Tiyeni is a platform connecting users and is not liable for loss, damage, or theft of parcels. Users are encouraged to insure high-value items.",
  },
  {
    title: "7. Privacy",
    body: "We collect minimal data necessary to operate the platform. Your phone number is used for authentication. We do not sell your data to third parties.",
  },
  {
    title: "8. Changes",
    body: "We may update these terms. Continued use of Tiyeni after changes constitutes acceptance of the new terms.",
  },
];

export default function TermsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPadding = Platform.OS === "web" ? insets.top + 67 : insets.top;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPadding + 12, backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Terms & Privacy</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>
        <Text style={[styles.lastUpdated, { color: colors.mutedForeground }]}>Last updated: April 2026</Text>
        {SECTIONS.map((s, i) => (
          <View key={i} style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{s.title}</Text>
            <Text style={[styles.sectionBody, { color: colors.mutedForeground }]}>{s.body}</Text>
          </View>
        ))}
        <Text style={[styles.footer, { color: colors.mutedForeground }]}>
          Questions? Contact us at support@tiyeni.app
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingBottom: 14, borderBottomWidth: 1 },
  backBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  headerTitle: { flex: 1, fontSize: 18, fontFamily: "Inter_700Bold", textAlign: "center" },
  lastUpdated: { fontSize: 12, fontFamily: "Inter_400Regular", marginBottom: 20 },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 15, fontFamily: "Inter_700Bold", marginBottom: 8 },
  sectionBody: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 22 },
  footer: { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center", marginTop: 10 },
});
