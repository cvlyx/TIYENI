import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator, FlatList, Platform,
  Pressable, StyleSheet, Text, View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StarRating } from "@/components/StarRating";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import { api } from "@/lib/api";
import { useColors } from "@/hooks/useColors";

export default function UserProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPadding = Platform.OS === "web" ? insets.top + 67 : insets.top;

  const [user, setUser] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    Promise.all([api.getUser(id), api.getUserReviews(id)])
      .then(([userRes, reviewsRes]) => {
        setUser(userRes.user);
        setReviews(reviewsRes.reviews ?? []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, alignItems: "center", justifyContent: "center" }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!user) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { paddingTop: topPadding + 12, backgroundColor: colors.card, borderBottomColor: colors.border }]}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={colors.foreground} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Profile</Text>
          <View style={{ width: 36 }} />
        </View>
        <View style={styles.center}>
          <Text style={{ color: colors.mutedForeground }}>User not found</Text>
        </View>
      </View>
    );
  }

  const initials = user.name.split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2);
  const avgRating = reviews.length > 0
    ? (reviews.reduce((s: number, r: any) => s + r.rating, 0) / reviews.length).toFixed(1)
    : user.rating?.toFixed(1) ?? "5.0";

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPadding + 12, backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Profile</Text>
        <View style={{ width: 36 }} />
      </View>

      <FlatList
        data={reviews}
        keyExtractor={(r) => r.id}
        ListHeaderComponent={
          <View>
            {/* Hero */}
            <View style={[styles.hero, { backgroundColor: colors.primary + "15" }]}>
              <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
                <Text style={styles.avatarText}>{initials}</Text>
              </View>
              <Text style={[styles.name, { color: colors.foreground }]}>{user.name}</Text>
              <View style={styles.metaRow}>
                <StarRating rating={parseFloat(avgRating)} size={16} />
                {user.isVerified && <VerifiedBadge size="md" />}
              </View>
              <Text style={[styles.memberSince, { color: colors.mutedForeground }]}>
                Member since {new Date(user.createdAt).getFullYear()}
              </Text>
            </View>

            {/* Stats */}
            <View style={[styles.statsRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.stat}>
                <Text style={[styles.statVal, { color: colors.foreground }]}>{user.tripsCompleted ?? 0}</Text>
                <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Trips</Text>
              </View>
              <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
              <View style={styles.stat}>
                <Text style={[styles.statVal, { color: colors.foreground }]}>{avgRating}</Text>
                <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Rating</Text>
              </View>
              <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
              <View style={styles.stat}>
                <Text style={[styles.statVal, { color: colors.foreground }]}>{reviews.length}</Text>
                <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Reviews</Text>
              </View>
            </View>

            {reviews.length > 0 && (
              <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>Reviews</Text>
            )}
          </View>
        }
        renderItem={({ item: review }) => (
          <View style={[styles.reviewCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.reviewHeader}>
              <StarRating rating={review.rating} size={14} />
              <Text style={[styles.reviewDate, { color: colors.mutedForeground }]}>
                {new Date(review.createdAt).toLocaleDateString("en-MW", { month: "short", day: "numeric", year: "numeric" })}
              </Text>
            </View>
            {review.comment && (
              <Text style={[styles.reviewComment, { color: colors.foreground }]}>{review.comment}</Text>
            )}
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.center}>
            <Ionicons name="star-outline" size={40} color={colors.border} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No reviews yet</Text>
          </View>
        }
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingBottom: 14, borderBottomWidth: 1 },
  backBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  headerTitle: { flex: 1, fontSize: 18, fontFamily: "Inter_700Bold", textAlign: "center" },
  hero: { alignItems: "center", padding: 28, gap: 8 },
  avatar: { width: 80, height: 80, borderRadius: 40, alignItems: "center", justifyContent: "center", marginBottom: 4 },
  avatarText: { color: "#fff", fontSize: 28, fontFamily: "Inter_700Bold" },
  name: { fontSize: 22, fontFamily: "Inter_700Bold" },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  memberSince: { fontSize: 13, fontFamily: "Inter_400Regular" },
  statsRow: { flexDirection: "row", marginHorizontal: 16, marginTop: 12, borderRadius: 14, borderWidth: 1, paddingVertical: 16 },
  stat: { flex: 1, alignItems: "center" },
  statVal: { fontSize: 20, fontFamily: "Inter_700Bold", marginBottom: 2 },
  statLabel: { fontSize: 12, fontFamily: "Inter_400Regular" },
  statDivider: { width: 1, alignSelf: "stretch", marginVertical: 4 },
  sectionTitle: { fontSize: 12, fontFamily: "Inter_600SemiBold", textTransform: "uppercase", letterSpacing: 0.5, marginHorizontal: 16, marginTop: 20, marginBottom: 10 },
  reviewCard: { marginHorizontal: 16, marginBottom: 10, borderRadius: 12, borderWidth: 1, padding: 14 },
  reviewHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  reviewDate: { fontSize: 12, fontFamily: "Inter_400Regular" },
  reviewComment: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 20 },
  center: { alignItems: "center", justifyContent: "center", paddingTop: 40, gap: 10 },
  emptyText: { fontSize: 14, fontFamily: "Inter_400Regular" },
});
