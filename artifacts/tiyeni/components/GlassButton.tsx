import React, { useRef } from "react";
import { Pressable, Text, StyleSheet, Animated, ViewStyle, TextStyle } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useColors } from "@/hooks/useColors";

interface GlassButtonProps {
  onPress: () => void;
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "accent" | "ghost";
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  fullWidth?: boolean;
}

export function GlassButton({
  onPress,
  children,
  variant = "primary",
  size = "md",
  disabled = false,
  style,
  textStyle,
  fullWidth = false,
}: GlassButtonProps) {
  const colors = useColors();
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  const handlePressIn = () => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 0.96,
        useNativeDriver: true,
        tension: 300,
        friction: 10,
      }),
      Animated.timing(glowAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: false,
      }),
    ]).start();
  };

  const handlePressOut = () => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 300,
        friction: 10,
      }),
      Animated.timing(glowAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }),
    ]).start();
  };

  const getGradientColors = () => {
    switch (variant) {
      case "primary":
        return [colors.emerald, colors.primary];
      case "secondary":
        return [colors.indigo, "#6366F1"];
      case "accent":
        return [colors.amber, "#F59E0B"];
      case "ghost":
        return [colors.glass, colors.glass];
      default:
        return [colors.primary, colors.primary];
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case "sm":
        return { paddingVertical: 10, paddingHorizontal: 16 };
      case "lg":
        return { paddingVertical: 18, paddingHorizontal: 32 };
      default:
        return { paddingVertical: 14, paddingHorizontal: 24 };
    }
  };

  const getTextSize = () => {
    switch (size) {
      case "sm":
        return 14;
      case "lg":
        return 18;
      default:
        return 16;
    }
  };

  return (
    <Animated.View
      style={[
        { transform: [{ scale: scaleAnim }] },
        fullWidth && { width: "100%" },
      ]}
    >
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        style={[
          styles.button,
          getSizeStyles(),
          {
            borderRadius: colors.radius - 4,
            opacity: disabled ? 0.5 : 1,
          },
          style,
        ]}
      >
        <LinearGradient
          colors={getGradientColors()}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[StyleSheet.absoluteFill, { borderRadius: colors.radius - 4 }]}
        />
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            {
              borderRadius: colors.radius - 4,
              backgroundColor: colors.glow,
              opacity: glowAnim,
            },
          ]}
        />
        <Text
          style={[
            styles.text,
            {
              fontSize: getTextSize(),
              color: variant === "ghost" ? colors.foreground : "#FFFFFF",
            },
            textStyle,
          ]}
        >
          {children}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  text: {
    fontFamily: "Inter_700Bold",
    fontWeight: "800",
    letterSpacing: 0.5,
  },
});
