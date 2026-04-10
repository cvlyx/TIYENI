import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useRef } from "react";
import {
  Animated,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/contexts/AuthContext";
import { useColors } from "@/hooks/useColors";

interface OptionCardProps {
  icon: string;
  title: string;
  description: string;
  color: string;
  onPress: () => void;
  delay: number;
}

function OptionCard({ icon, title, description, color, onPress, delay }: OptionCardProps) {
  const colors = useColors();
  const scale = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(60)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 300, delay, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, delay, useNativeDriver: true }),
    ]).start();
  }, []);

  const handlePressIn = () => Animated.spring(scale, { toValue: 0.96, useNativeDriver: true }).start();
  const handlePressOut = () => Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start();

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress();
  };

  return (
    <Animated.View style={{ opacity, transform: [{ scale }, { translateY: slideAnim }] }}>
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
        style={[styles.optionCard, { backgroundColor: colors.card }]}
      >
        <View style={[styles.optionIcon, { backgroundColor: color + "18" }]}>
          <Ionicons name={icon as any} size={32} color={color} />
        </View>
        <View style={styles.optionContent}>
          <Text style={[styles.optionTitle, { color: colors.foreground }]}>{title}</Text>
          <Text style={[styles.optionDesc, { color: colors.mutedForeground }]}>{description}</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.mutedForeground} />
      </Pressable>
    </Animated.View>
  );
}

export default function PostIndex() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const topPadding = Platform.OS === "web" ? insets.top + 67 : insets.top;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPadding + 16, backgroundColor: colors.card }]}>
        <Pressable onPress={() => router.back()} style={styles.closeBtn}>
          <Ionicons name="close" size={24} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>What do you want to post?</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        <Text style={[styles.subheading, { color: colors.mutedForeground }]}>
          Choose an option below to get started
        </Text>

        <OptionCard
          icon="cube-outline"
          title="Send a Parcel"
          description="Find someone to deliver your package to any destination in Malawi"
          color={colors.accent}
          onPress={() => router.push("/(post)/send-parcel")}
          delay={100}
        />

        <OptionCard
          icon="car-sport-outline"
          title="Offer a Trip"
          description="Traveling soon? Offer seats or parcel space and earn along the way"
          color={colors.primary}
          onPress={() => {
            if (!user) {
              router.push("/(auth)/login");
              return;
            }
            if (user.role !== "verified" && user.verificationStatus !== "approved") {
              router.push("/(post)/offer-trip");
            } else {
              router.push("/(post)/offer-trip");
            }
          }}
          delay={200}
        />

        {(!user || (user.role !== "verified" && user.verificationStatus !== "approved")) && (
          <View style={[styles.infoBox, { backgroundColor: colors.secondary }]}>
            <Ionicons name="shield-checkmark-outline" size={18} color={colors.primary} />
            <Text style={[styles.infoText, { color: colors.primary }]}>
              Anyone can send parcels. Become Verified to offer trips.
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  closeBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  headerTitle: { flex: 1, textAlign: "center", fontSize: 17, fontFamily: "Inter_600SemiBold" },
  content: { flex: 1, paddingHorizontal: 16, paddingTop: 20, gap: 14 },
  subheading: { fontSize: 14, fontFamily: "Inter_400Regular", marginBottom: 4 },
  optionCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 18,
    borderRadius: 18,
    gap: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  optionIcon: {
    width: 60,
    height: 60,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  optionContent: { flex: 1 },
  optionTitle: { fontSize: 17, fontFamily: "Inter_700Bold", marginBottom: 4 },
  optionDesc: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 18 },
  infoBox: {
    flexDirection: "row",
    gap: 10,
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  infoText: { flex: 1, fontSize: 13, fontFamily: "Inter_400Regular" },
});
