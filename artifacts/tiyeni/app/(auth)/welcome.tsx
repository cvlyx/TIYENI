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

const { width, height } = Dimensions.get("window");

const SLIDES = [
  {
    tag: "TRANSPORT",
    emoji: "🚗",
    title: "Move anything,\nanywhere.",
    subtitle: "Connect with real people making real trips across Malawi. Fast, safe, and affordable.",
    accent: "#34D399",
  },
  {
    tag: "PARCELS",
    emoji: "📦",
    title: "Send parcels\nwith trust.",
    subtitle: "ID-verified carriers. Rating system. OTP delivery confirmation. Every package accountable.",
    accent: "#F59E0B",
  },
  {
    tag: "EARN",
    emoji: "💰",
    title: "Your trip,\nyour income.",
    subtitle: "Offer seats or parcel space on your next journey. Earn money you were leaving on the table.",
    accent: "#818CF8",
  },
];

// Palette
const C = {
  bg: "#071A0F",
  bgMid: "#0D2B18",
  green1: "#059669",
  green2: "#10B981",
  green3: "#34D399",
  amber: "#F59E0B",
  indigo: "#818CF8",
  white: "#FFFFFF",
  white60: "rgba(255,255,255,0.6)",
  white30: "rgba(255,255,255,0.3)",
  white12: "rgba(255,255,255,0.12)",
  white08: "rgba(255,255,255,0.08)",
  glass: "rgba(16,185,129,0.12)",
  glassBorder: "rgba(52,211,153,0.25)",
};

function Orb({ x, y, size, color, delay }: { x: number; y: number; size: number; color: string; delay: number }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 4000 + delay * 300, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 4000 + delay * 300, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [0, -22] });
  const scale = anim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 1.08, 1] });
  return (
    <Animated.View
      style={{
        position: "absolute", left: x, top: y,
        width: size, height: size, borderRadius: size / 2,
        backgroundColor: color,
        transform: [{ translateY }, { scale }],
      }}
    />
  );
}

function FeatureRow({ icon, text }: { icon: string; text: string }) {
  return (
    <View style={styles.featureRow}>
      <Text style={styles.featureIcon}>{icon}</Text>
      <Text style={styles.featureText}>{text}</Text>
    </View>
  );
}

export default function WelcomeScreen() {
  const insets = useSafeAreaInsets();
  const [slide, setSlide] = useState(0);

  const heroOpacity = useRef(new Animated.Value(0)).current;
  const heroY = useRef(new Animated.Value(50)).current;
  const sheetOpacity = useRef(new Animated.Value(0)).current;
  const sheetY = useRef(new Animated.Value(60)).current;
  const contentOpacity = useRef(new Animated.Value(1)).current;
  const contentY = useRef(new Animated.Value(0)).current;
  const emojiScale = useRef(new Animated.Value(0.5)).current;
  const emojiOpacity = useRef(new Animated.Value(0)).current;

  const topPad = Platform.OS === "web" ? insets.top + 67 : insets.top;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(heroOpacity, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.spring(heroY, { toValue: 0, tension: 55, friction: 10, useNativeDriver: true }),
    ]).start();
    Animated.parallel([
      Animated.timing(sheetOpacity, { toValue: 1, duration: 700, delay: 300, useNativeDriver: true }),
      Animated.spring(sheetY, { toValue: 0, tension: 55, friction: 10, delay: 300, useNativeDriver: true }),
    ]).start();
    animateEmoji();
  }, []);

  const animateEmoji = () => {
    emojiScale.setValue(0.5);
    emojiOpacity.setValue(0);
    Animated.parallel([
      Animated.spring(emojiScale, { toValue: 1, tension: 80, friction: 8, useNativeDriver: true }),
      Animated.timing(emojiOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start();
  };

  const goToSlide = (idx: number) => {
    Animated.parallel([
      Animated.timing(contentOpacity, { toValue: 0, duration: 150, useNativeDriver: true }),
      Animated.timing(contentY, { toValue: -12, duration: 150, useNativeDriver: true }),
    ]).start(() => {
      setSlide(idx);
      contentY.setValue(16);
      animateEmoji();
      Animated.parallel([
        Animated.timing(contentOpacity, { toValue: 1, duration: 250, useNativeDriver: true }),
        Animated.spring(contentY, { toValue: 0, tension: 80, friction: 10, useNativeDriver: true }),
      ]).start();
    });
  };

  const handleNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (slide < SLIDES.length - 1) {
      goToSlide(slide + 1);
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      router.push("/(auth)/register");
    }
  };

  const current = SLIDES[slide];

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={[C.bg, C.bgMid, "#0F3D22"]}
        locations={[0, 0.5, 1]}
        style={StyleSheet.absoluteFill}
      />

      {/* Background orbs */}
      <Orb x={-60} y={height * 0.08} size={220} color="rgba(16,185,129,0.12)" delay={0} />
      <Orb x={width * 0.6} y={height * 0.04} size={180} color="rgba(245,158,11,0.08)" delay={2} />
      <Orb x={width * 0.15} y={height * 0.3} size={140} color="rgba(129,140,248,0.07)" delay={1} />
      <Orb x={width * 0.65} y={height * 0.45} size={160} color="rgba(52,211,153,0.07)" delay={3} />
      <Orb x={-30} y={height * 0.6} size={120} color="rgba(16,185,129,0.08)" delay={4} />

      {/* Hero section */}
      <Animated.View
        style={[styles.hero, { paddingTop: topPad + 16, opacity: heroOpacity, transform: [{ translateY: heroY }] }]}
      >
        {/* Logo */}
        <View style={styles.logoRow}>
          <LinearGradient colors={[C.green2, C.green1]} style={styles.logoBadge}>
            <Text style={styles.logoLetter}>T</Text>
          </LinearGradient>
          <View>
            <Text style={styles.appName}>Tiyeni</Text>
            <Text style={styles.appTagline}>Malawi's ride & parcel network</Text>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          {[
            { v: "12K+", l: "Users" },
            { v: "38", l: "Districts" },
            { v: "4.8★", l: "Rating" },
          ].map((s) => (
            <View key={s.l} style={styles.statPill}>
              <Text style={styles.statVal}>{s.v}</Text>
              <Text style={styles.statLbl}>{s.l}</Text>
            </View>
          ))}
        </View>

        {/* Route card */}
        <View style={styles.routeCard}>
          <View style={styles.routeInner}>
            <View style={styles.routePoint}>
              <View style={[styles.routeDot, { backgroundColor: C.green3 }]} />
              <View>
                <Text style={styles.routeLabel}>FROM</Text>
                <Text style={styles.routeCity}>Lilongwe</Text>
              </View>
            </View>
            <View style={styles.routeMiddle}>
              <View style={styles.routeLine} />
              <View style={[styles.routeArrowBubble, { backgroundColor: C.amber }]}>
                <Text style={styles.routeArrow}>→</Text>
              </View>
              <View style={styles.routeLine} />
            </View>
            <View style={styles.routePoint}>
              <View style={[styles.routeDot, { backgroundColor: C.amber }]} />
              <View>
                <Text style={styles.routeLabel}>TO</Text>
                <Text style={styles.routeCity}>Blantyre</Text>
              </View>
            </View>
          </View>
          <View style={styles.routeTags}>
            <View style={[styles.routeTag, { backgroundColor: "rgba(52,211,153,0.18)" }]}>
              <Text style={[styles.routeTagTxt, { color: C.green3 }]}>2 seats</Text>
            </View>
            <View style={[styles.routeTag, { backgroundColor: "rgba(245,158,11,0.18)" }]}>
              <Text style={[styles.routeTagTxt, { color: C.amber }]}>MWK 15,000</Text>
            </View>
            <View style={[styles.routeTag, { backgroundColor: C.white08 }]}>
              <Text style={[styles.routeTagTxt, { color: C.white60 }]}>✓ Verified</Text>
            </View>
          </View>
        </View>
      </Animated.View>

      {/* Bottom sheet */}
      <Animated.View
        style={[styles.sheet, { opacity: sheetOpacity, transform: [{ translateY: sheetY }] }]}
      >
        <View style={styles.sheetHandle} />

        {/* Slide content */}
        <Animated.View style={{ opacity: contentOpacity, transform: [{ translateY: contentY }] }}>
          <View style={styles.slideTop}>
            <Animated.Text
              style={[styles.slideEmoji, { opacity: emojiOpacity, transform: [{ scale: emojiScale }] }]}
            >
              {current.emoji}
            </Animated.Text>
            <View style={[styles.slideBadge, { borderColor: current.accent + "55", backgroundColor: current.accent + "18" }]}>
              <Text style={[styles.slideBadgeTxt, { color: current.accent }]}>{current.tag}</Text>
            </View>
          </View>
          <Text style={styles.slideTitle}>{current.title}</Text>
          <Text style={styles.slideSub}>{current.subtitle}</Text>
        </Animated.View>

        {/* Dots */}
        <View style={styles.dotsRow}>
          {SLIDES.map((s, i) => (
            <Pressable key={i} onPress={() => goToSlide(i)} hitSlop={8}>
              <Animated.View
                style={[
                  styles.dot,
                  {
                    backgroundColor: i === slide ? s.accent : C.white30,
                    width: i === slide ? 28 : 8,
                  },
                ]}
              />
            </Pressable>
          ))}
        </View>

        {/* CTA */}
        <Pressable
          onPress={handleNext}
          style={({ pressed }) => [styles.primaryBtn, { opacity: pressed ? 0.85 : 1 }]}
        >
          <LinearGradient
            colors={[C.green2, C.green1]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.primaryBtnGrad}
          >
            <Text style={styles.primaryBtnTxt}>
              {slide < SLIDES.length - 1 ? "Continue →" : "Get Started"}
            </Text>
          </LinearGradient>
        </Pressable>

        <Pressable onPress={() => router.push("/(auth)/login")} style={styles.ghostBtn}>
          <Text style={styles.ghostBtnTxt}>
            Already have an account?{" "}
            <Text style={{ color: C.green3, fontFamily: "Inter_600SemiBold" }}>Sign in</Text>
          </Text>
        </Pressable>

        {/* Features */}
        <View style={styles.featuresBox}>
          <FeatureRow icon="🔒" text="OTP-verified deliveries" />
          <FeatureRow icon="⭐" text="Trusted rating system" />
          <FeatureRow icon="📍" text="All 38 districts covered" />
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },

  hero: {
    flex: 1,
    paddingHorizontal: 22,
    paddingBottom: 16,
  },

  // Logo
  logoRow: { flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 24 },
  logoBadge: {
    width: 48, height: 48, borderRadius: 15,
    alignItems: "center", justifyContent: "center",
    shadowColor: C.green2, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.5, shadowRadius: 10, elevation: 6,
  },
  logoLetter: { color: C.white, fontSize: 24, fontFamily: "Inter_700Bold" },
  appName: { color: C.white, fontSize: 22, fontFamily: "Inter_700Bold", letterSpacing: -0.4 },
  appTagline: { color: C.white60, fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 1 },

  // Stats
  statsRow: { flexDirection: "row", gap: 10, marginBottom: 20 },
  statPill: {
    flex: 1, alignItems: "center", paddingVertical: 10,
    backgroundColor: C.white08, borderRadius: 14,
    borderWidth: 1, borderColor: C.glassBorder,
  },
  statVal: { color: C.white, fontSize: 16, fontFamily: "Inter_700Bold" },
  statLbl: { color: C.white60, fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 1 },

  // Route card
  routeCard: {
    backgroundColor: C.white08,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.glassBorder,
    padding: 16,
  },
  routeInner: { flexDirection: "row", alignItems: "center", marginBottom: 14 },
  routePoint: { flex: 1, flexDirection: "row", alignItems: "center", gap: 10 },
  routeDot: { width: 10, height: 10, borderRadius: 5 },
  routeLabel: { color: C.white30, fontSize: 9, fontFamily: "Inter_600SemiBold", letterSpacing: 1.2 },
  routeCity: { color: C.white, fontSize: 15, fontFamily: "Inter_700Bold" },
  routeMiddle: { flex: 1, flexDirection: "row", alignItems: "center", gap: 4 },
  routeLine: { flex: 1, height: 1, backgroundColor: C.white12 },
  routeArrowBubble: { width: 26, height: 26, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  routeArrow: { color: C.white, fontSize: 13, fontFamily: "Inter_700Bold" },
  routeTags: { flexDirection: "row", gap: 8 },
  routeTag: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  routeTagTxt: { fontSize: 12, fontFamily: "Inter_500Medium" },

  // Sheet
  sheet: {
    backgroundColor: "rgba(7,26,15,0.96)",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    borderWidth: 1,
    borderColor: C.glassBorder,
    borderBottomWidth: 0,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 32,
  },
  sheetHandle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: C.white30,
    alignSelf: "center",
    marginBottom: 22,
  },

  // Slide
  slideTop: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 12 },
  slideEmoji: { fontSize: 36 },
  slideBadge: {
    paddingHorizontal: 12, paddingVertical: 4,
    borderRadius: 20, borderWidth: 1,
  },
  slideBadgeTxt: { fontSize: 11, fontFamily: "Inter_600SemiBold", letterSpacing: 1.5 },
  slideTitle: {
    color: C.white, fontSize: 28, fontFamily: "Inter_700Bold",
    lineHeight: 34, letterSpacing: -0.5, marginBottom: 8,
  },
  slideSub: {
    color: C.white60, fontSize: 14, fontFamily: "Inter_400Regular",
    lineHeight: 21, marginBottom: 20,
  },

  // Dots
  dotsRow: { flexDirection: "row", gap: 6, marginBottom: 22 },
  dot: { height: 6, borderRadius: 3 },

  // Buttons
  primaryBtn: {
    borderRadius: 16, overflow: "hidden", marginBottom: 14,
    shadowColor: C.green1, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.45, shadowRadius: 14, elevation: 8,
  },
  primaryBtnGrad: { paddingVertical: 16, alignItems: "center" },
  primaryBtnTxt: { color: C.white, fontSize: 16, fontFamily: "Inter_700Bold", letterSpacing: 0.3 },
  ghostBtn: { alignItems: "center", paddingVertical: 4, marginBottom: 20 },
  ghostBtnTxt: { color: C.white60, fontSize: 14, fontFamily: "Inter_400Regular" },

  // Features
  featuresBox: {
    backgroundColor: C.white08,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.glassBorder,
    padding: 14,
    gap: 10,
  },
  featureRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  featureIcon: { fontSize: 16 },
  featureText: { color: C.white60, fontSize: 13, fontFamily: "Inter_400Regular" },
});
