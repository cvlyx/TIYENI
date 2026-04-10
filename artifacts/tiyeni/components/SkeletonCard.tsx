import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, View } from "react-native";
import { useColors } from "@/hooks/useColors";

export function SkeletonCard() {
  const colors = useColors();
  const pulse = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.4, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const bg = colors.muted;

  return (
    <Animated.View style={[styles.card, { backgroundColor: colors.card, opacity: pulse }]}>
      <View style={styles.header}>
        <View style={[styles.avatar, { backgroundColor: bg }]} />
        <View style={styles.headerText}>
          <View style={[styles.line, { width: 120, backgroundColor: bg }]} />
          <View style={[styles.line, { width: 80, backgroundColor: bg, marginTop: 6 }]} />
        </View>
        <View style={[styles.badge, { backgroundColor: bg }]} />
      </View>
      <View style={[styles.routeBar, { backgroundColor: bg }]} />
      <View style={styles.footer}>
        <View style={[styles.line, { width: 90, backgroundColor: bg }]} />
        <View style={[styles.line, { width: 60, backgroundColor: bg }]} />
      </View>
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
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
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
  },
  headerText: { flex: 1 },
  badge: {
    width: 60,
    height: 20,
    borderRadius: 10,
  },
  line: {
    height: 12,
    borderRadius: 6,
  },
  routeBar: {
    height: 40,
    borderRadius: 10,
    marginBottom: 12,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
});
