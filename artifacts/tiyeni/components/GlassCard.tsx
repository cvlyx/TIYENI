import React from "react";
import { View, StyleSheet, ViewStyle, Platform, AccessibilityRole } from "react-native";
import { useColors } from "@/hooks/useColors";
import { LinearGradient } from "expo-linear-gradient";

interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  glow?: boolean;
  variant?: "default" | "elevated" | "subtle";
  accessibilityLabel?: string;
  accessibilityHint?: string;
  accessibilityRole?: AccessibilityRole;
}

export function GlassCard({ 
  children, 
  style, 
  glow = false, 
  variant = "default",
  accessibilityLabel,
  accessibilityHint,
  accessibilityRole
}: GlassCardProps) {
  const colors = useColors();

  const getGlassStyle = () => {
    switch (variant) {
      case "elevated":
        return {
          backgroundColor: colors.glass,
          borderColor: colors.glassBorder,
          borderWidth: 1.5,
          shadowColor: colors.emerald,
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.3,
          shadowRadius: 16,
          elevation: 12,
        };
      case "subtle":
        return {
          backgroundColor: colors.glass,
          borderColor: colors.glassBorder,
          borderWidth: 0.5,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 2,
        };
      default:
        return {
          backgroundColor: colors.glass,
          borderColor: colors.glassBorder,
          borderWidth: 1,
          shadowColor: glow ? colors.emerald : "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: glow ? 0.4 : 0.15,
          shadowRadius: glow ? 12 : 8,
          elevation: 6,
        };
    }
  };

  // Optimize blur effect for performance
  const getBlurStyle = () => {
    if (Platform.OS === 'android') {
      // Reduce blur complexity on older Android devices
      return { backdropFilter: 'blur(6px)' };
    } else if (Platform.OS === 'ios') {
      return { backdropFilter: 'blur(8px)' };
    } else {
      // Web - use CSS blur
      return { backdropFilter: 'blur(10px)' };
    }
  };

  return (
    <View
      style={[
        styles.container,
        getGlassStyle(),
        getBlurStyle(),
        { borderRadius: colors.radius },
        style,
      ]}
      accessible={!!accessibilityLabel}
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      accessibilityRole={accessibilityRole}
    >
      {glow && (
        <View
          style={[
            StyleSheet.absoluteFill,
            {
              borderRadius: colors.radius,
              backgroundColor: colors.glow,
              opacity: 0.5,
            },
          ]}
        />
      )}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: "hidden",
    backdropFilter: "blur(10px)",
  },
});
