import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useRef, useEffect } from "react";
import {
  Animated,
  Dimensions,
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PressableButton } from "@/components/PressableButton";
import { useColors } from "@/hooks/useColors";

const { width, height } = Dimensions.get("window");

const SLIDES = [
  {
    title: "Send parcels\nacross Malawi",
    subtitle: "Connect with trusted drivers and travelers to get your packages delivered safely.",
    icon: "📦",
  },
  {
    title: "Offer trips &\nearn money",
    subtitle: "Have empty seats? Carry parcels along your route and earn extra income.",
    icon: "🚗",
  },
  {
    title: "Safe, verified\ncommunity",
    subtitle: "All verified users are ID-checked. Ratings and reviews keep everyone accountable.",
    icon: "✅",
  },
];

export default function WelcomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [currentSlide, setCurrentSlide] = React.useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  const goToSlide = (idx: number) => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: -30, duration: 200, useNativeDriver: true }),
    ]).start(() => {
      setCurrentSlide(idx);
      slideAnim.setValue(30);
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true }),
      ]).start();
    });
  };

  const handleNext = () => {
    if (currentSlide < SLIDES.length - 1) {
      goToSlide(currentSlide + 1);
    } else {
      router.push("/(auth)/login");
    }
  };

  const slide = SLIDES[currentSlide];

  const topPadding = Platform.OS === "web" ? insets.top + 67 : insets.top;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={[colors.primary, "#1B5E20"]}
        style={[styles.heroSection, { paddingTop: topPadding + 20 }]}
      >
        <View style={styles.logoRow}>
          <View style={[styles.logoBg, { backgroundColor: "rgba(255,255,255,0.2)" }]}>
            <Text style={styles.logoText}>T</Text>
          </View>
          <Text style={styles.appName}>Tiyeni</Text>
        </View>

        <View style={styles.illustrationContainer}>
          <Image
            source={require("@/assets/images/parcel_illustration.png")}
            style={styles.illustration}
            resizeMode="contain"
          />
        </View>
      </LinearGradient>

      <View style={[styles.contentSection, { backgroundColor: colors.card }]}>
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          <Text style={[styles.title, { color: colors.foreground }]}>{slide.title}</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>{slide.subtitle}</Text>
        </Animated.View>

        <View style={styles.dots}>
          {SLIDES.map((_, i) => (
            <Pressable key={i} onPress={() => goToSlide(i)}>
              <View
                style={[
                  styles.dot,
                  {
                    backgroundColor:
                      i === currentSlide ? colors.primary : colors.border,
                    width: i === currentSlide ? 24 : 8,
                  },
                ]}
              />
            </Pressable>
          ))}
        </View>

        <View style={styles.btnGroup}>
          <PressableButton
            label={currentSlide < SLIDES.length - 1 ? "Next" : "Get Started"}
            onPress={handleNext}
          />
          <Pressable onPress={() => router.push("/(auth)/login")} style={styles.skipBtn}>
            <Text style={[styles.skipText, { color: colors.mutedForeground }]}>
              Already have an account? Sign in
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  heroSection: {
    flex: 1,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  logoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 24,
  },
  logoBg: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  logoText: {
    color: "#fff",
    fontSize: 20,
    fontFamily: "Inter_700Bold",
  },
  appName: {
    color: "#fff",
    fontSize: 22,
    fontFamily: "Inter_700Bold",
  },
  illustrationContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  illustration: {
    width: width * 0.7,
    height: width * 0.5,
  },
  contentSection: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 28,
    paddingBottom: 40,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 10,
  },
  title: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
    lineHeight: 36,
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    lineHeight: 22,
    marginBottom: 24,
  },
  dots: {
    flexDirection: "row",
    gap: 6,
    marginBottom: 28,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  btnGroup: { gap: 16 },
  skipBtn: { alignItems: "center" },
  skipText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
});
