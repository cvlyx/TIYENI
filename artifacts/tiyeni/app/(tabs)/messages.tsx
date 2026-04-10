import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import {
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AnimatedListItem } from "@/components/AnimatedListItem";
import { StarRating } from "@/components/StarRating";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import { Conversation, useAppData } from "@/contexts/AppDataContext";
import { useAuth } from "@/contexts/AuthContext";
import { useColors } from "@/hooks/useColors";

function ConversationCard({ convo, index }: { convo: Conversation; index: number }) {
  const colors = useColors();
  const { user } = useAuth();

  const initials = convo.participantName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const timeAgo = () => {
    const diff = Date.now() - convo.lastTimestamp;
    if (diff < 60000) return "now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;
    return `${Math.floor(diff / 86400000)}d`;
  };

  return (
    <AnimatedListItem index={index}>
      <Pressable
        onPress={() => router.push({ pathname: "/chat/[id]", params: { id: convo.id } } as any)}
        style={({ pressed }) => [styles.card, { backgroundColor: colors.card, opacity: pressed ? 0.85 : 1 }]}
      >
        <View style={[styles.avatar, { backgroundColor: colors.secondary }]}>
          <Text style={[styles.initials, { color: colors.primary }]}>{initials}</Text>
          {convo.isVerified && (
            <View style={[styles.verifiedDot, { backgroundColor: colors.primary }]}>
              <Ionicons name="checkmark" size={8} color="#fff" />
            </View>
          )}
        </View>

        <View style={styles.content}>
          <View style={styles.topRow}>
            <View style={styles.nameRow}>
              <Text style={[styles.name, { color: colors.foreground }]}>{convo.participantName}</Text>
              <StarRating rating={convo.participantRating} size={11} />
            </View>
            <Text style={[styles.time, { color: colors.mutedForeground }]}>{timeAgo()}</Text>
          </View>
          <Text
            style={[styles.lastMsg, { color: convo.unreadCount > 0 ? colors.foreground : colors.mutedForeground }]}
            numberOfLines={1}
          >
            {convo.lastMessage}
          </Text>
        </View>

        {convo.unreadCount > 0 && (
          <View style={[styles.badge, { backgroundColor: colors.primary }]}>
            <Text style={styles.badgeText}>{convo.unreadCount}</Text>
          </View>
        )}
      </Pressable>
    </AnimatedListItem>
  );
}

export default function MessagesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { conversations } = useAppData();
  const { user } = useAuth();

  const topPadding = Platform.OS === "web" ? insets.top + 67 : insets.top;

  if (!user) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.headerBar, { paddingTop: topPadding + 16, backgroundColor: colors.card }]}>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Messages</Text>
        </View>
        <View style={styles.center}>
          <Ionicons name="chatbubbles-outline" size={52} color={colors.border} />
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Sign in to chat</Text>
          <Pressable onPress={() => router.push("/(auth)/login")} style={[styles.signInBtn, { backgroundColor: colors.primary }]}>
            <Text style={styles.signInText}>Sign In</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.headerBar, { paddingTop: topPadding + 16, backgroundColor: colors.card }]}>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Messages</Text>
        <View style={[styles.countBadge, { backgroundColor: colors.secondary }]}>
          <Text style={[styles.countText, { color: colors.primary }]}>{conversations.length}</Text>
        </View>
      </View>

      <FlatList
        data={conversations}
        keyExtractor={(c) => c.id}
        renderItem={({ item, index }) => <ConversationCard convo={item} index={index} />}
        contentContainerStyle={[
          styles.list,
          { paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 100) },
        ]}
        ListEmptyComponent={
          <View style={styles.center}>
            <Ionicons name="chatbubbles-outline" size={52} color={colors.border} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No messages yet</Text>
            <Text style={[styles.emptySubtitle, { color: colors.mutedForeground }]}>
              Contact someone from the home feed to start chatting
            </Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    gap: 10,
  },
  headerTitle: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    flex: 1,
  },
  countBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  countText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  list: { paddingTop: 8 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 14,
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  initials: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
  },
  verifiedDot: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  content: { flex: 1 },
  topRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  name: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  time: { fontSize: 12, fontFamily: "Inter_400Regular" },
  lastMsg: { fontSize: 13, fontFamily: "Inter_400Regular" },
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 5,
  },
  badgeText: { color: "#fff", fontSize: 11, fontFamily: "Inter_700Bold" },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 80,
    gap: 12,
    paddingHorizontal: 40,
  },
  emptyTitle: { fontSize: 18, fontFamily: "Inter_600SemiBold" },
  emptySubtitle: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 20 },
  signInBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 4,
  },
  signInText: { color: "#fff", fontSize: 15, fontFamily: "Inter_600SemiBold" },
});
