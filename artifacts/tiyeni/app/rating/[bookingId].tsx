import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import {
  Animated, Platform, Pressable, ScrollView,
  StyleSheet, Text, TextInput, View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAppData } from "@/contexts/AppDataContext";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { useColors } from "@/hooks/useColors";

function StarPicker({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  const colors = useColors();
  return (
    <View style={styles.starRow}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Pressable key={n} onPress={() => onChange(n)} style={styles.starBtn}>
          <Ionicons
            name={n <= value ? "star" : "star-outline"}
            size={40}
            color={n <= value ? "#F59E0B" : colors.border}
          />
        </Pressable>
      ))}
    </View>
  );
}

const TAGS = ["On time", "Careful handling", "Good comms", "Friendly", "Professional", "Trustworthy"];

export default function RatingScreen() {
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { bookings, addReview } = useAppData();
  const { showToast } = useToast();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const topPadding = Platform.OS === "web" ? insets.top + 67 : insets.top;

  const booking = bookings.find((b) => b.id === bookingId);
  const revieweeName = user?.id === booking?.requesterId ? booking?.carrierName : booking?.requesterName;
  const revieweeId = user?.id === booking?.requesterId ? booking?.carrierId : booking?.requesterId;

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = async () => {
    if (rating === 0) { showToast("Please select a star rating", "error"); return; }
    if (!user || !booking) return;
    try {
      await addReview({
        bookingId: booking.id,
        reviewerId: user.id,
        revieweeId: revieweeId || "",
        revieweeName: revieweeName || "",
        rating,
        comment: [selectedTags.join(", "), comment].filter(Boolean).join(" — "),
      });
      setSubmitted(true);
    } catch {
      showToast("Failed to submit review", "error");
    }
  };

  if (submitted) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <LinearGradient colors={[colors.primary, colors.background]} style={styles.successGrad} />
        <View style={styles.successContent}>
          <View style={[styles.successIcon, { backgroundColor: colors.success + "20" }]}>
            <Ionicons name="checkmark-circle" size={64} color={colors.success} />
          </View>
          <Text style={[styles.successTitle, { color: colors.foreground }]}>Review submitted!</Text>
          <Text style={[styles.successBody, { color: colors.mutedForeground }]}>
            Thank you for helping build trust in the Tiyeni community.
          </Text>
          <Pressable
            onPress={() => router.replace("/(tabs)/")}
            style={[styles.doneBtn, { backgroundColor: colors.primary }]}
          >
            <Text style={styles.doneBtnText}>Back to Home</Text>
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
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Rate Experience</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 100 }}>
        <View style={styles.revieweeSection}>
          <View style={[styles.bigAvatar, { backgroundColor: colors.primary }]}>
            <Text style={styles.bigAvatarText}>{revieweeName?.[0] || "?"}</Text>
          </View>
          <Text style={[styles.revieweeLabel, { color: colors.mutedForeground }]}>Rate your experience with</Text>
          <Text style={[styles.revieweeName, { color: colors.foreground }]}>{revieweeName}</Text>
        </View>

        <StarPicker value={rating} onChange={setRating} />

        {rating > 0 && (
          <Text style={[styles.ratingLabel, { color: colors.accent }]}>
            {["", "Poor", "Fair", "Good", "Great", "Excellent"][rating]}
          </Text>
        )}

        <Text style={[styles.tagsLabel, { color: colors.mutedForeground }]}>What stood out?</Text>
        <View style={styles.tagsRow}>
          {TAGS.map((tag) => (
            <Pressable
              key={tag}
              onPress={() => toggleTag(tag)}
              style={[
                styles.tag,
                {
                  backgroundColor: selectedTags.includes(tag) ? colors.primary + "20" : colors.muted,
                  borderColor: selectedTags.includes(tag) ? colors.primary : colors.border,
                },
              ]}
            >
              <Text style={[styles.tagText, { color: selectedTags.includes(tag) ? colors.primary : colors.mutedForeground }]}>
                {tag}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text style={[styles.tagsLabel, { color: colors.mutedForeground }]}>Add a comment (optional)</Text>
        <TextInput
          style={[styles.commentInput, { color: colors.foreground, backgroundColor: colors.input, borderColor: colors.border }]}
          value={comment}
          onChangeText={setComment}
          placeholder="Share your experience..."
          placeholderTextColor={colors.mutedForeground}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />

        <Pressable
          onPress={handleSubmit}
          style={[styles.submitBtn, { backgroundColor: rating > 0 ? colors.primary : colors.muted }]}
        >
          <Text style={[styles.submitBtnText, { color: rating > 0 ? "#fff" : colors.mutedForeground }]}>
            Submit Review
          </Text>
        </Pressable>

        <Pressable onPress={() => router.replace("/(tabs)/")} style={styles.skipBtn}>
          <Text style={[styles.skipText, { color: colors.mutedForeground }]}>Skip for now</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 16, paddingBottom: 14, borderBottomWidth: 1,
  },
  backBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  headerTitle: { flex: 1, fontSize: 18, fontFamily: "Inter_700Bold", textAlign: "center" },
  revieweeSection: { alignItems: "center", marginBottom: 28 },
  bigAvatar: { width: 72, height: 72, borderRadius: 36, alignItems: "center", justifyContent: "center", marginBottom: 12 },
  bigAvatarText: { color: "#fff", fontSize: 28, fontFamily: "Inter_700Bold" },
  revieweeLabel: { fontSize: 13, fontFamily: "Inter_400Regular", marginBottom: 4 },
  revieweeName: { fontSize: 20, fontFamily: "Inter_700Bold" },
  starRow: { flexDirection: "row", justifyContent: "center", gap: 8, marginBottom: 10 },
  starBtn: { padding: 4 },
  ratingLabel: { textAlign: "center", fontSize: 16, fontFamily: "Inter_600SemiBold", marginBottom: 24 },
  tagsLabel: { fontSize: 13, fontFamily: "Inter_600SemiBold", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 },
  tagsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 24 },
  tag: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  tagText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  commentInput: {
    borderWidth: 1, borderRadius: 14, padding: 14,
    fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 22,
    marginBottom: 24, minHeight: 100,
  },
  submitBtn: { paddingVertical: 16, borderRadius: 14, alignItems: "center", marginBottom: 12 },
  submitBtnText: { fontSize: 16, fontFamily: "Inter_700Bold" },
  skipBtn: { alignItems: "center" },
  skipText: { fontSize: 14, fontFamily: "Inter_400Regular" },
  successGrad: { position: "absolute", top: 0, left: 0, right: 0, height: 300 },
  successContent: { flex: 1, alignItems: "center", justifyContent: "center", padding: 40, gap: 16 },
  successIcon: { width: 120, height: 120, borderRadius: 60, alignItems: "center", justifyContent: "center", marginBottom: 8 },
  successTitle: { fontSize: 26, fontFamily: "Inter_700Bold" },
  successBody: { fontSize: 15, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 22 },
  doneBtn: { paddingHorizontal: 40, paddingVertical: 16, borderRadius: 14, marginTop: 8 },
  doneBtnText: { color: "#fff", fontSize: 16, fontFamily: "Inter_700Bold" },
});
