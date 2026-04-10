import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useColors } from "@/hooks/useColors";

interface VerifiedBadgeProps {
  size?: "sm" | "md";
}

export function VerifiedBadge({ size = "sm" }: VerifiedBadgeProps) {
  const colors = useColors();
  const isSmall = size === "sm";

  return (
    <View style={[styles.badge, { backgroundColor: colors.primary + "18" }]}>
      <Ionicons name="checkmark-circle" size={isSmall ? 12 : 14} color={colors.primary} />
      <Text style={[styles.text, { color: colors.primary, fontSize: isSmall ? 10 : 12 }]}>
        Verified
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 20,
  },
  text: {
    fontFamily: "Inter_600SemiBold",
  },
});
