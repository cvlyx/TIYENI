import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { View, StyleSheet, ViewStyle } from 'react-native';

interface AccessibleIconProps {
  name: keyof typeof Ionicons.glyphMap;
  size?: number;
  color?: string;
  accessibilityLabel: string;
  accessibilityHint?: string;
  accessibilityRole?: 'image' | 'button' | 'switch';
  onPress?: () => void;
  disabled?: boolean;
  style?: ViewStyle;
}

export function AccessibleIcon({
  name,
  size = 24,
  color = '#059669',
  accessibilityLabel,
  accessibilityHint,
  accessibilityRole = 'image',
  onPress,
  disabled = false,
  style,
}: AccessibleIconProps) {
  const IconComponent = onPress ? (
    <View
      accessible={true}
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      accessibilityRole={accessibilityRole}
      accessibilityState={{ disabled }}
      style={[styles.iconContainer, style]}
      onStartShouldSetResponder={() => !disabled && !!onPress}
      onResponderRelease={() => onPress?.()}
    >
      <Ionicons
        name={name}
        size={size}
        color={disabled ? '#9CA3AF' : color}
        style={styles.icon}
      />
    </View>
  ) : (
    <View
      accessible={true}
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      accessibilityRole={accessibilityRole}
      style={[styles.iconContainer, style]}
    >
      <Ionicons
        name={name}
        size={size}
        color={color}
        style={styles.icon}
      />
    </View>
  );

  return IconComponent;
}

const styles = StyleSheet.create({
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 44,
    minHeight: 44,
  },
  icon: {
    // Ensure icon is properly sized for accessibility
  },
});
