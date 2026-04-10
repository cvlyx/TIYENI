import * as Haptics from "expo-haptics";
import React, { useRef } from "react";
import { Animated, Pressable, StyleSheet, Text, ViewStyle } from "react-native";
import { useColors } from "@/hooks/useColors";

interface PressableButtonProps {
  onPress: () => void;
  label: string;
  variant?: "primary" | "secondary" | "outline" | "ghost";
  disabled?: boolean;
  style?: ViewStyle;
  fullWidth?: boolean;
}

export function PressableButton({
  onPress,
  label,
  variant = "primary",
  disabled = false,
  style,
  fullWidth = true,
}: PressableButtonProps) {
  const colors = useColors();
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scale, { toValue: 0.96, useNativeDriver: true }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, tension: 300, friction: 10 }).start();
  };

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  const bgColor =
    variant === "primary"
      ? disabled ? colors.muted : colors.primary
      : variant === "secondary"
      ? colors.secondary
      : "transparent";

  const textColor =
    variant === "primary"
      ? disabled ? colors.mutedForeground : colors.primaryForeground
      : variant === "secondary"
      ? colors.secondaryForeground
      : colors.primary;

  const borderColor = variant === "outline" ? colors.primary : "transparent";

  return (
    <Animated.View style={[fullWidth && styles.fullWidth, { transform: [{ scale }] }, style]}>
      <Pressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        style={[
          styles.button,
          { backgroundColor: bgColor, borderColor, borderWidth: variant === "outline" ? 1.5 : 0 },
        ]}
      >
        <Text style={[styles.label, { color: textColor }]}>{label}</Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  fullWidth: { width: "100%" },
  button: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
});
