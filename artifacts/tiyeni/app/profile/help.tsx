import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Linking, Platform, Pressable, ScrollView,
  StyleSheet, Text, View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";

const FAQS = [
  { q: "How do I send a parcel?", a: "Tap the + button, choose 'Send a Parcel', fill in pickup and drop-off locations, select parcel size, and post your request. Carriers heading that way will see it and can accept." },
  { q: "How do I offer a trip?", a: "Tap the + button, choose 'Offer a Trip', enter your route, date, time and available seats. Enable 'Accept parcels' if you're willing to carry items." },
  { q: "How does payment work?", a: "Payments are handled through your Tiyeni Wallet. Top up via PayChangu (Airtel Money, TNM Mpamba, or bank transfer). Funds are released to the carrier after delivery is confirmed." },
  { q: "What is the pickup OTP?", a: "When a booking is accepted, the sender receives a 4-digit OTP. The carrier must enter this code when collecting the parcel to confirm pickup." },
  { q: "How do I become verified?", a: "Go to Profile → Verify My Identity. Upload your NRC (National Registration Card) and a selfie. Our team reviews within 24 hours." },
  { q: "Is my money safe?", a: "Yes. Funds are held in escrow until delivery is confirmed by both parties. If a booking is declined, funds are returned immediately." },
];

function FAQItem({ q, a }: { q: string; a: string }) {
  const colors = useColors();
  const [open, setOpen] = useState(false);
  return (
    <Pressable onPress={() => setOpen(!open)} style={[styles.faqItem, { borderColor: colors.border }]}>
      <View style={styles.faqHeader}>
        <Text style={[styles.faqQ, { color: colors.foreground }]}>{q}</Text>
        <Ionicons name={open ? "chevron-up" : "chevron-down"} size={16} color={colors.mutedForeground} />
      </View>
      {open && <Text style={[styles.faqA, { color: colors.mutedForeground }]}>{a}</Text>}
    </Pressable>
  );
}

export default function HelpScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPadding = Platform.OS === "web" ? insets.top + 67 : insets.top;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPadding + 12, backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Help Center</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
        <View style={[styles.contactCard, { backgroundColor: colors.primary + "10", borderColor: colors.primary + "30" }]}>
          <Ionicons name="chatbubble-ellipses-outline" size={28} color={colors.primary} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.contactTitle, { color: colors.foreground }]}>Need more help?</Text>
            <Text style={[styles.contactSub, { color: colors.mutedForeground }]}>Email us at support@tiyeni.app</Text>
          </View>
          <Pressable onPress={() => Linking.openURL("mailto:support@tiyeni.app")} style={[styles.contactBtn, { backgroundColor: colors.primary }]}>
            <Text style={styles.contactBtnText}>Email</Text>
          </Pressable>
        </View>

        <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>Frequently Asked Questions</Text>
        {FAQS.map((faq, i) => <FAQItem key={i} q={faq.q} a={faq.a} />)}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingBottom: 14, borderBottomWidth: 1 },
  backBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  headerTitle: { flex: 1, fontSize: 18, fontFamily: "Inter_700Bold", textAlign: "center" },
  contactCard: { flexDirection: "row", alignItems: "center", gap: 14, padding: 16, borderRadius: 16, borderWidth: 1, marginBottom: 24 },
  contactTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold", marginBottom: 2 },
  contactSub: { fontSize: 13, fontFamily: "Inter_400Regular" },
  contactBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  contactBtnText: { color: "#fff", fontSize: 13, fontFamily: "Inter_600SemiBold" },
  sectionTitle: { fontSize: 12, fontFamily: "Inter_600SemiBold", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 12 },
  faqItem: { borderBottomWidth: 1, paddingVertical: 16 },
  faqHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 12 },
  faqQ: { flex: 1, fontSize: 15, fontFamily: "Inter_600SemiBold" },
  faqA: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 20, marginTop: 10 },
});
