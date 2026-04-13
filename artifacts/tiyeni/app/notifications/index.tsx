import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AppNotification, useAppData } from "@/contexts/AppDataContext";
import { useColors } from "@/hooks/useColors";

const notifConfig: Record<string, { icon: string; color: string }> = {
  booking_request: { icon: "cube-outline", color: "#F59E0B" },
  booking_accepted: { icon: "checkmark-circle-outline", color: "#22C55E" },
  booking_declined: { icon: "close-circle-outline", color: "#EF4444" },
  message: { icon: "chatbubble-outline", color: "#3B82F6" },
  delivery_confirmed: { icon: "bag-check-outline", color: "#22C55E" },
  match: { icon: "flash-outline", color: "#8B5CF6" },
  wallet: { icon: "wallet-outline", color: "#10B981" },
};

function timeAgo(ts: number) {
  const diff = (Date.now() - ts) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function NotifRow({ item, colors }: { item: AppNotification; colors: any }) {
  const cfg = notifConfig[item.type] ?? { icon: "notifications-outline", color: "#6B7280" };

  const handlePress = () => {
    if (!item.relatedId) return;
    if (item.type === "message") router.push({ pathname: "/chat/[id]", params: { id: item.relatedId } } as any);
    else if (item.type === "booking_request" || item.type === "booking_accepted" || item.type === "booking_declined")
      router.push({ pathname: "/booking/[id]", params: { id: item.relatedId } } as any);
    else if (item.type === "match") router.push({ pathname: "/matched/[parcelId]", params: { parcelId: item.relatedId } } as any);
    else if (item.type === "wallet") router.push("/wallet/index" as any);
  };

  return (
    <Pressable
      onPress={handlePress}
      style={[
        styles.row,
        {
          backgroundColor: item.read ? colors.card : colors.primary + "0A",
          borderColor: item.read ? colors.border : colors.primary + "30",
        },
      ]}
    >
      <View style={[styles.iconWrap, { backgroundColor: cfg.color + "18" }]}>
        <Ionicons name={cfg.icon as any} size={22} color={cfg.color} />
      </View>
      <View style={{ flex: 1 }}>
        <View style={styles.titleRow}>
          <Text style={[styles.title, { color: colors.foreground }]} numberOfLines={1}>
            {item.title}
          </Text>
          {!item.read && <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} />}
        </View>
        <Text style={[styles.body, { color: colors.mutedForeground }]} numberOfLines={2}>
          {item.body}
        </Text>
        <Text style={[styles.time, { color: colors.mutedForeground }]}>{timeAgo(item.createdAt)}</Text>
      </View>
      {item.relatedId && (
        <Ionicons name="chevron-forward" size={16} color={colors.mutedForeground} style={{ marginTop: 2 }} />
      )}
    </Pressable>
  );
}

export default function NotificationsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { notifications, markNotificationsRead, refresh, unreadNotifications } = useAppData();
  const [refreshing, setRefreshing] = useState(false);
  const [markingRead, setMarkingRead] = useState(false);
  const topPadding = Platform.OS === "web" ? insets.top + 67 : insets.top;

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh().catch(() => {});
    setRefreshing(false);
  }, [refresh]);

  const handleMarkAllRead = useCallback(async () => {
    if (unreadNotifications === 0) return;
    setMarkingRead(true);
    await markNotificationsRead().catch(() => {});
    setMarkingRead(false);
  }, [markNotificationsRead, unreadNotifications]);

  const unread = notifications.filter((n) => !n.read);
  const read = notifications.filter((n) => n.read);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPadding + 12, backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Notifications</Text>
        <Pressable onPress={handleMarkAllRead} style={styles.markReadBtn} disabled={unreadNotifications === 0 || markingRead}>
          {markingRead ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Text style={[styles.markReadText, { color: unreadNotifications > 0 ? colors.primary : colors.mutedForeground }]}>
              Mark all read
            </Text>
          )}
        </Pressable>
      </View>

      <FlatList
        data={notifications}
        keyExtractor={(n) => n.id}
        renderItem={({ item }) => <NotifRow item={item} colors={colors} />}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} colors={[colors.primary]} />
        }
        contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 100 }}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        ListHeaderComponent={
          unread.length > 0 ? (
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionDot, { backgroundColor: colors.primary }]} />
              <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
                {unread.length} unread
              </Text>
            </View>
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={[styles.emptyIcon, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Ionicons name="notifications-off-outline" size={40} color={colors.mutedForeground} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>All caught up</Text>
            <Text style={[styles.emptyBody, { color: colors.mutedForeground }]}>
              No notifications yet. Post a trip or parcel to get started.
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  backBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  headerTitle: { flex: 1, fontSize: 18, fontFamily: "Inter_700Bold", textAlign: "center" },
  markReadBtn: { minWidth: 80, alignItems: "flex-end", justifyContent: "center", height: 36 },
  markReadText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 12 },
  sectionDot: { width: 8, height: 8, borderRadius: 4 },
  sectionLabel: { fontSize: 12, fontFamily: "Inter_600SemiBold", textTransform: "uppercase", letterSpacing: 0.5 },
  row: {
    flexDirection: "row",
    gap: 14,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "flex-start",
  },
  iconWrap: { width: 44, height: 44, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 3 },
  title: { flex: 1, fontSize: 14, fontFamily: "Inter_600SemiBold" },
  unreadDot: { width: 8, height: 8, borderRadius: 4 },
  body: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 18, marginBottom: 4 },
  time: { fontSize: 11, fontFamily: "Inter_400Regular" },
  empty: { alignItems: "center", justifyContent: "center", paddingTop: 80, gap: 16, paddingHorizontal: 40 },
  emptyIcon: {
    width: 80, height: 80, borderRadius: 24,
    alignItems: "center", justifyContent: "center",
    borderWidth: 1,
  },
  emptyTitle: { fontSize: 18, fontFamily: "Inter_600SemiBold" },
  emptyBody: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 20 },
});
