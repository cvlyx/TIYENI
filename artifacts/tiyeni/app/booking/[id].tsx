import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import {
  Alert, Platform, Pressable, ScrollView,
  StyleSheet, Text, TextInput, View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAppData } from "@/contexts/AppDataContext";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { useColors } from "@/hooks/useColors";

export default function BookingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { bookings, acceptBooking, declineBooking, collectParcel, confirmDelivery } = useAppData();
  const { showToast } = useToast();
  const [otpInput, setOtpInput] = useState("");
  const [showOtp, setShowOtp] = useState(false);
  const topPadding = Platform.OS === "web" ? insets.top + 67 : insets.top;

  const booking = bookings.find((b) => b.id === id);

  if (!booking) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { paddingTop: topPadding + 12, backgroundColor: colors.card }]}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={colors.foreground} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Booking</Text>
        </View>
        <View style={styles.center}>
          <Text style={{ color: colors.mutedForeground }}>Booking not found</Text>
        </View>
      </View>
    );
  }

  const isCarrier = user?.id !== booking.requesterId;
  const isRequester = user?.id === booking.requesterId || !user;

  const statusConfig = {
    pending: { label: "Awaiting Carrier", color: colors.accent, icon: "time-outline" },
    accepted: { label: "Accepted", color: colors.success, icon: "checkmark-circle-outline" },
    declined: { label: "Declined", color: colors.destructive, icon: "close-circle-outline" },
    collected: { label: "In Transit", color: colors.info, icon: "car-outline" },
    delivered: { label: "Delivered", color: colors.success, icon: "bag-check-outline" },
  } as const;

  const status = statusConfig[booking.status];

  const handleAccept = () => {
    acceptBooking(booking.id);
    showToast("Booking accepted!", "success");
  };

  const handleDecline = () => {
    declineBooking(booking.id);
    showToast("Booking declined", "info");
  };

  const handleCollect = () => {
    const ok = collectParcel(booking.id, otpInput.trim());
    if (ok) {
      showToast("Parcel collected! In transit.", "success");
      setShowOtp(false);
    } else {
      showToast("Wrong OTP code", "error");
    }
  };

  const handleDelivered = () => {
    confirmDelivery(booking.id);
    showToast(`MWK ${booking.price.toLocaleString()} added to wallet!`, "success");
    setTimeout(() => {
      router.replace({ pathname: "/rating/[bookingId]", params: { bookingId: booking.id } } as any);
    }, 800);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPadding + 12, backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Booking Details</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
        {/* Status badge */}
        <View style={[styles.statusCard, { backgroundColor: status.color + "15", borderColor: status.color + "40" }]}>
          <Ionicons name={status.icon as any} size={22} color={status.color} />
          <Text style={[styles.statusLabel, { color: status.color }]}>{status.label}</Text>
        </View>

        {/* Route card */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>Route</Text>
          <View style={styles.routeRow}>
            <View style={styles.routePoint}>
              <View style={[styles.dot, { backgroundColor: colors.primary }]} />
              <Text style={[styles.routeCity, { color: colors.foreground }]}>{booking.from}</Text>
            </View>
            <View style={[styles.routeLine, { backgroundColor: colors.border }]} />
            <View style={styles.routePoint}>
              <View style={[styles.dot, { backgroundColor: colors.accent }]} />
              <Text style={[styles.routeCity, { color: colors.foreground }]}>{booking.to}</Text>
            </View>
          </View>
          <Text style={[styles.dateText, { color: colors.mutedForeground }]}>
            <Ionicons name="calendar-outline" size={13} /> {booking.date}
          </Text>
        </View>

        {/* Parties */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>People</Text>
          <View style={styles.partyRow}>
            <Ionicons name="person-outline" size={16} color={colors.primary} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.partyRole, { color: colors.mutedForeground }]}>Sender</Text>
              <Text style={[styles.partyName, { color: colors.foreground }]}>{booking.requesterName}</Text>
            </View>
          </View>
          <View style={[styles.partyRow, { marginTop: 10 }]}>
            <Ionicons name="car-outline" size={16} color={colors.accent} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.partyRole, { color: colors.mutedForeground }]}>Carrier</Text>
              <Text style={[styles.partyName, { color: colors.foreground }]}>{booking.carrierName}</Text>
            </View>
          </View>
        </View>

        {/* Price */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>Payment</Text>
          <Text style={[styles.priceText, { color: colors.foreground }]}>
            MWK {booking.price.toLocaleString()}
          </Text>
          <Text style={[styles.priceNote, { color: colors.mutedForeground }]}>Paid to carrier on delivery</Text>
        </View>

        {/* Pickup OTP (shown to sender for accepted bookings) */}
        {isRequester && booking.status === "accepted" && (
          <View style={[styles.otpCard, { backgroundColor: colors.primary + "15", borderColor: colors.primary + "40" }]}>
            <Ionicons name="key-outline" size={20} color={colors.primary} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.otpCardTitle, { color: colors.foreground }]}>Pickup Code</Text>
              <Text style={[styles.otpCardCode, { color: colors.primary }]}>{booking.pickupOtp}</Text>
              <Text style={[styles.otpCardNote, { color: colors.mutedForeground }]}>
                Show this to the carrier when they collect your parcel
              </Text>
            </View>
          </View>
        )}

        {/* Carrier actions */}
        {isCarrier && booking.status === "pending" && (
          <View style={styles.actionRow}>
            <Pressable onPress={handleDecline} style={[styles.actionBtn, styles.declineBtn, { borderColor: colors.destructive }]}>
              <Text style={[styles.actionBtnText, { color: colors.destructive }]}>Decline</Text>
            </Pressable>
            <Pressable onPress={handleAccept} style={[styles.actionBtn, { backgroundColor: colors.primary }]}>
              <Text style={[styles.actionBtnText, { color: "#fff" }]}>Accept Booking</Text>
            </Pressable>
          </View>
        )}

        {/* Carrier collect OTP entry */}
        {isCarrier && booking.status === "accepted" && (
          <View style={styles.collectSection}>
            <Text style={[styles.sectionLabel, { color: colors.mutedForeground, marginBottom: 12 }]}>Enter Sender's Pickup Code</Text>
            <View style={styles.otpInputRow}>
              <TextInput
                style={[styles.otpInputField, { color: colors.foreground, backgroundColor: colors.input, borderColor: colors.border }]}
                value={otpInput}
                onChangeText={setOtpInput}
                placeholder="4-digit code"
                placeholderTextColor={colors.mutedForeground}
                keyboardType="number-pad"
                maxLength={4}
              />
              <Pressable onPress={handleCollect} style={[styles.collectBtn, { backgroundColor: colors.primary }]}>
                <Text style={styles.collectBtnText}>Collect</Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* Carrier deliver */}
        {isCarrier && booking.status === "collected" && (
          <Pressable onPress={handleDelivered} style={[styles.fullBtn, { backgroundColor: colors.success }]}>
            <Ionicons name="checkmark-circle" size={20} color="#fff" />
            <Text style={styles.fullBtnText}>Confirm Delivery</Text>
          </Pressable>
        )}

        {/* Requester — rate after delivered */}
        {isRequester && booking.status === "delivered" && (
          <Pressable
            onPress={() => router.push({ pathname: "/rating/[bookingId]", params: { bookingId: booking.id } } as any)}
            style={[styles.fullBtn, { backgroundColor: colors.accent }]}
          >
            <Ionicons name="star" size={20} color="#fff" />
            <Text style={styles.fullBtnText}>Rate Your Experience</Text>
          </Pressable>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  backBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  headerTitle: { flex: 1, fontSize: 18, fontFamily: "Inter_700Bold", textAlign: "center" },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  statusCard: {
    flexDirection: "row", alignItems: "center", gap: 10,
    padding: 14, borderRadius: 14, borderWidth: 1, marginBottom: 14,
  },
  statusLabel: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  card: { borderRadius: 14, borderWidth: 1, padding: 16, marginBottom: 12 },
  sectionLabel: { fontSize: 11, fontFamily: "Inter_600SemiBold", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 10 },
  routeRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 8 },
  routePoint: { flexDirection: "row", alignItems: "center", gap: 8 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  routeCity: { fontSize: 16, fontFamily: "Inter_700Bold" },
  routeLine: { flex: 1, height: 1 },
  dateText: { fontSize: 13, fontFamily: "Inter_400Regular" },
  partyRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  partyRole: { fontSize: 11, fontFamily: "Inter_400Regular" },
  partyName: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  priceText: { fontSize: 24, fontFamily: "Inter_700Bold", marginBottom: 4 },
  priceNote: { fontSize: 13, fontFamily: "Inter_400Regular" },
  otpCard: { flexDirection: "row", gap: 14, padding: 16, borderRadius: 14, borderWidth: 1, marginBottom: 12, alignItems: "flex-start" },
  otpCardTitle: { fontSize: 13, fontFamily: "Inter_500Medium", marginBottom: 4 },
  otpCardCode: { fontSize: 32, fontFamily: "Inter_700Bold", letterSpacing: 6, marginBottom: 6 },
  otpCardNote: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 17 },
  actionRow: { flexDirection: "row", gap: 12, marginTop: 8 },
  actionBtn: { flex: 1, paddingVertical: 15, borderRadius: 14, alignItems: "center" },
  declineBtn: { borderWidth: 1.5, backgroundColor: "transparent" },
  actionBtnText: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  collectSection: { marginTop: 8 },
  otpInputRow: { flexDirection: "row", gap: 12 },
  otpInputField: { flex: 1, borderWidth: 1, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 18, fontFamily: "Inter_700Bold", letterSpacing: 4 },
  collectBtn: { paddingHorizontal: 20, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  collectBtnText: { color: "#fff", fontSize: 15, fontFamily: "Inter_600SemiBold" },
  fullBtn: { flexDirection: "row", gap: 10, paddingVertical: 16, borderRadius: 14, alignItems: "center", justifyContent: "center", marginTop: 8 },
  fullBtnText: { color: "#fff", fontSize: 16, fontFamily: "Inter_700Bold" },
});
