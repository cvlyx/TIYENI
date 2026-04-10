import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

interface StarRatingProps {
  rating: number;
  showNumber?: boolean;
  size?: number;
}

export function StarRating({ rating, showNumber = true, size = 12 }: StarRatingProps) {
  return (
    <View style={styles.row}>
      <Ionicons name="star" size={size} color="#F59E0B" />
      {showNumber && (
        <Text style={[styles.text, { fontSize: size }]}>{rating.toFixed(1)}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  text: {
    color: "#6B7280",
    fontFamily: "Inter_500Medium",
  },
});
