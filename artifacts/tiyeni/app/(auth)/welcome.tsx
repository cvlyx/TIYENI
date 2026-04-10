import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";

const { width, height } = Dimensions.get("window");

const SLIDES = [
  {
    tag: "TRANSPORT",
    title: "Move anything,\nanywhere.",
    subtitle:
      "Connect with real people making real trips across Malawi. Fast, safe, and affordable.",
    icon: "car",
  },
  {
    tag: "PARCELS",
    title: "Send parcels\nwith trust.",
    subtitle:
      "ID-verified carriers. Rating system. OTP delivery confirmation. Every package accountable.",
    icon: "box",
  },
  {
    tag: "EARN",
    title: "Your trip,\nyour income.",
    subtitle:
      "Offer seats or parcel space on your next journey. Earn money you were leaving on the table.",
    icon: "profit",
  },
];

function FloatingOrb({
  x,
  y,
  size,
  color,
  delay,
}: {
  x: number;
  y: number;
  size: number;
  color: string;
  delay: number;
}) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, {
          toValue: 1,
          duration: 3000 + delay * 200,
          useNativeDriver: false,
        }),
        Animated.timing(anim, {
          toValue: 0,
          duration: 3000 + delay * 200,
          useNativeDriver: false,
        }),
      ])
    ).start();
  }, []);

  const translateY = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -18],
  });

  return (
    <Animated.View
      style={[
        styles.orb,
        {
          left: x,
          top: y,
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
          transform: [{ translateY }],
        },
      ]}
    />
  );
}

function GlassCard({ children, style }: { children: React.ReactNode; style?: any }) {
  if (Platform.OS === "ios") {
    return (
      <BlurView intensity={18} tint="light" style={[styles.glassCard, style]}>
        {children}
      </BlurView>
    );
  }
  return (
    <View style={[styles.glassCard, styles.glassCardFallback, style]}>
      {children}
    </View>
  );
}

function StatChip({ value, label }: { value: string; label: string }) {
  const scale = useRef(new Animated.Value(0.6)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, useNativeDriver: false, delay: 600 }),
      Animated.timing(opacity, { toValue: 1, duration: 500, delay: 600, useNativeDriver: false }),
    ]).start();
  }, []);

  return (
    <Animated.View style={{ transform: [{ scale }], opacity }}>
      <GlassCard style={styles.statChip}>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statLabel}>{label}</Text>
      </GlassCard>
    </Animated.View>
  );
}

export default function WelcomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [currentSlide, setCurrentSlide] = useState(0);

  const contentOpacity = useRef(new Animated.Value(1)).current;
  const contentY = useRef(new Animated.Value(0)).current;
  const tagScale = useRef(new Animated.Value(1)).current;
  const heroOpacity = useRef(new Animated.Value(0)).current;
  const heroY = useRef(new Animated.Value(40)).current;
  const btnOpacity = useRef(new Animated.Value(0)).current;
  const btnY = useRef(new Animated.Value(30)).current;

  const topPadding = Platform.OS === "web" ? insets.top + 67 : insets.top;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(heroOpacity, { toValue: 1, duration: 700, useNativeDriver: false }),
      Animated.spring(heroY, { toValue: 0, useNativeDriver: false, tension: 60, friction: 10 }),
    ]).start();
    Animated.parallel([
      Animated.timing(btnOpacity, { toValue: 1, duration: 600, delay: 400, useNativeDriver: false }),
      Animated.spring(btnY, { toValue: 0, delay: 400, useNativeDriver: false }),
    ]).start();
  }, []);

  const goToSlide = (idx: number) => {
    Animated.parallel([
      Animated.timing(contentOpacity, { toValue: 0, duration: 180, useNativeDriver: false }),
      Animated.timing(contentY, { toValue: -16, duration: 180, useNativeDriver: false }),
    ]).start(() => {
      setCurrentSlide(idx);
      contentY.setValue(20);
      Animated.parallel([
        Animated.timing(contentOpacity, { toValue: 1, duration: 280, useNativeDriver: false }),
        Animated.spring(contentY, { toValue: 0, useNativeDriver: false, tension: 80, friction: 10 }),
      ]).start();
    });
  };

  const handleNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (currentSlide < SLIDES.length - 1) {
      goToSlide(currentSlide + 1);
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      router.push("/(auth)/login");
    }
  };

  const slide = SLIDES[currentSlide];

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#0D2B12", "#1A4A1E", "#2E7D32", "#388E3C"]}
        locations={[0, 0.35, 0.7, 1]}
        style={StyleSheet.absoluteFill}
      />

      {/* Decorative floating orbs */}
      <FloatingOrb x={-40} y={height * 0.1} size={200} color="rgba(76,175,80,0.18)" delay={0} />
      <FloatingOrb x={width * 0.55} y={height * 0.05} size={160} color="rgba(245,158,11,0.12)" delay={2} />
      <FloatingOrb x={width * 0.2} y={height * 0.35} size={120} color="rgba(255,255,255,0.06)" delay={1} />
      <FloatingOrb x={-20} y={height * 0.55} size={100} color="rgba(76,175,80,0.1)" delay={3} />
      <FloatingOrb x={width * 0.7} y={height * 0.5} size={140} color="rgba(245,158,11,0.08)" delay={1} />

      {/* Top section */}
      <View style={[styles.topSection, { paddingTop: topPadding + 12 }]}>
        <Animated.View style={{ opacity: heroOpacity, transform: [{ translateY: heroY }] }}>
          <View style={styles.logoRow}>
            <GlassCard style={styles.logoBubble}>
              <View style={styles.logoInner}>
                <Text style={styles.logoLetter}>T</Text>
              </View>
            </GlassCard>
            <Text style={styles.appName}>Tiyeni</Text>
          </View>

          {/* Stats row */}
          <View style={styles.statsRow}>
            <StatChip value="12K+" label="Users" />
            <StatChip value="38" label="Districts" />
            <StatChip value="4.8★" label="Rated" />
          </View>

          {/* Route visual */}
          <Animated.View style={{ opacity: heroOpacity }}>
            <GlassCard style={styles.routeCard}>
              <View style={styles.routeRow}>
                <View style={styles.routePoint}>
                  <View style={[styles.routeDot, { backgroundColor: "#4CAF50" }]} />
                  <View style={styles.routeTextCol}>
                    <Text style={styles.routeSmall}>FROM</Text>
                    <Text style={styles.routeCity}>Lilongwe</Text>
                  </View>
                </View>

                <View style={styles.routeLineContainer}>
                  <View style={styles.routeLineTrack} />
                  <View style={[styles.routeArrow, { backgroundColor: "rgba(245,158,11,0.9)" }]}>
                    <Text style={styles.routeArrowText}>→</Text>
                  </View>
                </View>

                <View style={styles.routePoint}>
                  <View style={[styles.routeDot, { backgroundColor: "#F59E0B" }]} />
                  <View style={styles.routeTextCol}>
                    <Text style={styles.routeSmall}>TO</Text>
                    <Text style={styles.routeCity}>Blantyre</Text>
                  </View>
                </View>
              </View>

              <View style={styles.routeFooter}>
                <View style={[styles.routeTag, { backgroundColor: "rgba(76,175,80,0.25)" }]}>
                  <Text style={styles.routeTagText}>2 seats</Text>
                </View>
                <View style={[styles.routeTag, { backgroundColor: "rgba(245,158,11,0.2)" }]}>
                  <Text style={[styles.routeTagText, { color: "#F59E0B" }]}>MWK 15,000</Text>
                </View>
                <View style={[styles.routeTag, { backgroundColor: "rgba(255,255,255,0.12)" }]}>
                  <Text style={styles.routeTagText}>Verified ✓</Text>
                </View>
              </View>
            </GlassCard>
          </Animated.View>
        </Animated.View>
      </View>

      {/* Bottom sheet */}
      <Animated.View style={[styles.sheet, { opacity: btnOpacity, transform: [{ translateY: btnY }] }]}>
        {Platform.OS === "ios" ? (
          <BlurView intensity={30} tint="light" style={StyleSheet.absoluteFill} />
        ) : (
          <View style={[StyleSheet.absoluteFill, styles.sheetFallback]} />
        )}

        <View style={styles.sheetContent}>
          <View style={styles.sheetHandle} />

          {/* Slide content */}
          <Animated.View style={{ opacity: contentOpacity, transform: [{ translateY: contentY }] }}>
            <View style={[styles.tagRow]}>
              <View style={styles.slideBadge}>
                <Text style={styles.slideBadgeText}>{slide.tag}</Text>
              </View>
            </View>
            <Text style={styles.slideTitle}>{slide.title}</Text>
            <Text style={styles.slideSubtitle}>{slide.subtitle}</Text>
          </Animated.View>

          {/* Dots */}
          <View style={styles.dotsRow}>
            {SLIDES.map((_, i) => (
              <Pressable key={i} onPress={() => goToSlide(i)}>
                <Animated.View
                  style={[
                    styles.dot,
                    {
                      backgroundColor:
                        i === currentSlide ? colors.primary : colors.border,
                      width: i === currentSlide ? 28 : 8,
                    },
                  ]}
                />
              </Pressable>
            ))}
          </View>

          {/* CTA Buttons */}
          <Pressable
            onPress={handleNext}
            style={({ pressed }) => [
              styles.primaryBtn,
              { backgroundColor: colors.primary, opacity: pressed ? 0.88 : 1 },
            ]}
          >
            <Text style={styles.primaryBtnText}>
              {currentSlide < SLIDES.length - 1 ? "Continue" : "Get Started"}
            </Text>
          </Pressable>

          <Pressable
            onPress={() => router.push("/(auth)/login")}
            style={styles.ghostBtn}
          >
            <Text style={[styles.ghostBtnText, { color: colors.mutedForeground }]}>
              Already have an account?{" "}
              <Text style={{ color: colors.primary, fontFamily: "Inter_600SemiBold" }}>
                Sign in
              </Text>
            </Text>
          </Pressable>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0D2B12" },
  topSection: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },

  // Orbs
  orb: {
    position: "absolute",
  },

  // Logo
  logoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 28,
  },
  logoBubble: {
    width: 42,
    height: 42,
    borderRadius: 13,
    padding: 0,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  logoInner: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
  },
  logoLetter: {
    color: "#fff",
    fontSize: 22,
    fontFamily: "Inter_700Bold",
  },
  appName: {
    color: "#fff",
    fontSize: 26,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.5,
  },

  // Stats
  statsRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 20,
  },
  statChip: {
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    gap: 2,
  },
  statValue: {
    color: "#fff",
    fontSize: 17,
    fontFamily: "Inter_700Bold",
  },
  statLabel: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },

  // Route card
  routeCard: {
    borderRadius: 20,
    padding: 16,
  },
  routeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
  },
  routePoint: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  routeDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  routeTextCol: { gap: 1 },
  routeSmall: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 9,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 1,
  },
  routeCity: {
    color: "#fff",
    fontSize: 15,
    fontFamily: "Inter_700Bold",
  },
  routeLineContainer: {
    flex: 1,
    alignItems: "center",
    flexDirection: "row",
    gap: 4,
  },
  routeLineTrack: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  routeArrow: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  routeArrowText: {
    color: "#fff",
    fontSize: 14,
  },
  routeFooter: {
    flexDirection: "row",
    gap: 8,
  },
  routeTag: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  routeTagText: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 12,
    fontFamily: "Inter_500Medium",
  },

  // Glass card
  glassCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
    overflow: "hidden",
  },
  glassCardFallback: {
    backgroundColor: "rgba(255,255,255,0.12)",
  },

  // Bottom sheet
  sheet: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    borderBottomWidth: 0,
  },
  sheetFallback: {
    backgroundColor: "rgba(10,30,12,0.88)",
  },
  sheetContent: {
    padding: 24,
    paddingBottom: 36,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.25)",
    alignSelf: "center",
    marginBottom: 24,
  },

  // Slide content
  tagRow: {
    flexDirection: "row",
    marginBottom: 12,
  },
  slideBadge: {
    backgroundColor: "rgba(46,125,50,0.4)",
    borderWidth: 1,
    borderColor: "rgba(76,175,80,0.4)",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  slideBadgeText: {
    color: "#81C784",
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 1.5,
  },
  slideTitle: {
    color: "#fff",
    fontSize: 30,
    fontFamily: "Inter_700Bold",
    lineHeight: 36,
    marginBottom: 10,
    letterSpacing: -0.5,
  },
  slideSubtitle: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    lineHeight: 22,
    marginBottom: 24,
  },

  // Dots
  dotsRow: {
    flexDirection: "row",
    gap: 6,
    marginBottom: 24,
  },
  dot: {
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.3)",
  },

  // Buttons
  primaryBtn: {
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: 14,
    shadowColor: "#2E7D32",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 6,
  },
  primaryBtnText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.3,
  },
  ghostBtn: {
    alignItems: "center",
    paddingVertical: 4,
  },
  ghostBtnText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
});
