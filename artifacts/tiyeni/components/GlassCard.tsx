import React from "react";
import { View, StyleSheet, ViewStyle } from "react-native";
import { useColors } from "@/hooks/useColors";
import { LinearGradient } from "expo-linear-gradient";

interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  glow?: boolean;
  variant?: "default" | "elevated" | "subtle";
}

export function GlassCard({ children, style, glow = false, variant = "default" }: GlassCardProps) {
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

  return (
    <View
      style={[
        styles.container,
        getGlassStyle(),
        { borderRadius: colors.radius },
        style,
      ]}
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
