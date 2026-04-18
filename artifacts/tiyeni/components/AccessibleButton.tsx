import React, { useRef } from 'react';
import { Pressable, PressableProps, StyleSheet, ViewStyle } from 'react-native';

interface AccessibleButtonProps extends PressableProps {
  accessibilityLabel: string;
  accessibilityHint?: string;
  accessibilityRole?: 'button' | 'link' | 'tab';
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'small' | 'medium' | 'large';
}

export function AccessibleButton({
  accessibilityLabel,
  accessibilityHint,
  accessibilityRole = 'button',
  children,
  variant = 'primary',
  size = 'medium',
  style,
  ...props
}: AccessibleButtonProps) {
  const buttonRef = useRef<View>(null);

  const getVariantStyle = (): ViewStyle => {
    switch (variant) {
      case 'secondary':
        return styles.secondary;
      case 'ghost':
        return styles.ghost;
      default:
        return styles.primary;
    }
  };

  const getSizeStyle = (): ViewStyle => {
    switch (size) {
      case 'small':
        return styles.small;
      case 'large':
        return styles.large;
      default:
        return styles.medium;
    }
  };

  return (
    <Pressable
      ref={buttonRef}
      style={[styles.button, getVariantStyle(), getSizeStyle(), style]}
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      accessibilityRole={accessibilityRole}
      accessible={true}
      focusable={true}
      {...props}
    >
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    minWidth: 44,
    minHeight: 44,
  },
  primary: {
    backgroundColor: '#059669',
  },
  secondary: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#059669',
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  small: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  medium: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  large: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
});
