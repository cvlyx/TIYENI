import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useRef } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";
import { Trip, ParcelRequest } from "@/contexts/AppDataContext";
import { useColors } from "@/hooks/useColors";
import { useAppData } from "@/contexts/AppDataContext";
import { useAuth } from "@/contexts/AuthContext";
import { VerifiedBadge } from "./VerifiedBadge";
import { StarRating } from "./StarRating";

type CardItem = Trip | ParcelRequest;

interface TripCardProps {
  item: CardItem;
  onMessage?: (id: string) => void;
}

function UserInitials({ name }: { name: string }) {
  const colors = useColors();
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
  return (
    <View style={[styles.avatar, { backgroundColor: colors.secondary }]}>
      <Text style={[styles.avatarText, { color: colors.primary }]}>{initials}</Text>
    </View>
  );
}

export function TripCard({ item }: TripCardProps) {
  const colors = useColors();
  const { startConversation } = useAppData();
  const { user } = useAuth();
  const scale = useRef(new Animated.Value(1)).current;

  const isTrip = item.type === "trip";
  const trip = isTrip ? (item as Trip) : null;
  const parcel = !isTrip ? (item as ParcelRequest) : null;

  const handlePressIn = () =>
    Animated.spring(scale, { toValue: 0.97, useNativeDriver: true }).start();
  const handlePressOut = () =>
    Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start();

  const handleMessage = async () => {
    if (!user) { router.push("/(auth)/login" as any); return; }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const convoId = await startConversation(item, user.id);
    router.push({ pathname: "/chat/[id]", params: { id: convoId } } as any);
  };

  const handleViewProfile = () => {
    router.push({ pathname: "/user/[id]", params: { id: item.userId } } as any);
  };

  const sizeLabel: Record<string, string> = {
    small: "Small",
    medium: "Medium",
    large: "Large",
    "extra-large": "Extra Large",
  };

  return (
    <Animated.View style={[{ transform: [{ scale }] }]}>
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[styles.card, { backgroundColor: colors.card }]}
      >
        <View style={styles.header}>
          <UserInitials name={item.userName} />
          <View style={styles.headerInfo}>
            <Pressable onPress={handleViewProfile}>
              <Text style={[styles.userName, { color: colors.foreground }]}>{item.userName}</Text>
            </Pressable>
            <View style={styles.metaRow}>
              <StarRating rating={item.userRating} />
              {item.isVerified && <VerifiedBadge />}
            </View>
          </View>
          <View style={[styles.typeBadge, { backgroundColor: isTrip ? colors.primary + "15" : colors.accent + "20" }]}>
            <Ionicons
              name={isTrip ? "car-outline" : "cube-outline"}
              size={14}
              color={isTrip ? colors.primary : colors.accent}
            />
            <Text style={[styles.typeText, { color: isTrip ? colors.primary : colors.accent }]}>
              {isTrip ? "Trip" : "Parcel"}
            </Text>
          </View>
        </View>

        <View style={[styles.routeContainer, { backgroundColor: colors.muted }]}>
          <View style={styles.routePoint}>
            <View style={[styles.dot, { backgroundColor: colors.primary }]} />
            <Text style={[styles.routeText, { color: colors.foreground }]}>{item.from}</Text>
          </View>
          <View style={[styles.routeLine, { backgroundColor: colors.border }]} />
          <Ionicons name="chevron-forward" size={16} color={colors.mutedForeground} />
          <View style={[styles.routeLine, { backgroundColor: colors.border }]} />
          <View style={styles.routePoint}>
            <View style={[styles.dotEnd, { borderColor: colors.primary }]} />
            <Text style={[styles.routeText, { color: colors.foreground }]}>{item.to}</Text>
          </View>
        </View>

        <View style={styles.details}>
          {isTrip && trip ? (
            <>
              <View style={styles.detailChip}>
                <Ionicons name="calendar-outline" size={13} color={colors.mutedForeground} />
                <Text style={[styles.detailText, { color: colors.mutedForeground }]}>
                  {trip.date} • {trip.time}
                </Text>
              </View>
              <View style={styles.detailChip}>
                <Ionicons name="people-outline" size={13} color={colors.mutedForeground} />
                <Text style={[styles.detailText, { color: colors.mutedForeground }]}>
                  {trip.seatsAvailable} seat{trip.seatsAvailable !== 1 ? "s" : ""}
                </Text>
              </View>
            </>
          ) : (
            parcel && (
              <>
                <View style={styles.detailChip}>
                  <Ionicons name="time-outline" size={13} color={colors.mutedForeground} />
                  <Text style={[styles.detailText, { color: colors.mutedForeground }]}>
                    By {parcel.deadline}
                  </Text>
                </View>
                <View style={styles.detailChip}>
                  <Ionicons name="cube-outline" size={13} color={colors.mutedForeground} />
                  <Text style={[styles.detailText, { color: colors.mutedForeground }]}>
                    {sizeLabel[parcel.parcelSize] || parcel.parcelSize}
                  </Text>
                </View>
              </>
            )
          )}
        </View>

        <View style={styles.footer}>
          {item.price ? (
            <Text style={[styles.price, { color: colors.primary }]}>
              MWK {item.price.toLocaleString()}
            </Text>
          ) : (
            <Text style={[styles.price, { color: colors.mutedForeground }]}>Price negotiable</Text>
          )}
          {item.userId !== user?.id && (
            <Pressable
              onPress={handleMessage}
              style={[styles.messageBtn, { backgroundColor: colors.primary }]}
            >
              <Ionicons name="chatbubble-outline" size={14} color="#fff" />
              <Text style={styles.messageBtnText}>Contact</Text>
            </Pressable>
          )}
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 3,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
  },
  headerInfo: { flex: 1 },
  userName: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 2,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  typeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
  },
  typeText: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
  },
  routeContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
  },
  routePoint: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotEnd: {
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 2,
  },
  routeLine: {
    flex: 1,
    height: 1,
    marginHorizontal: 4,
  },
  routeText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  details: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  detailChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  detailText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: 1,
    paddingTop: 12,
    borderTopColor: "#00000010",
  },
  price: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
  },
  messageBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  messageBtnText: {
    color: "#fff",
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
});
