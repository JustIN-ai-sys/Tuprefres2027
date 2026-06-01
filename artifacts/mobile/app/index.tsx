import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { QuizMode, useQuiz } from "@/contexts/QuizContext";
import { useColors } from "@/hooks/useColors";

const MODES: {
  mode: QuizMode;
  label: string;
  questions: string;
  time: string;
  desc: string;
  recommended?: boolean;
}[] = [
  {
    mode: 10,
    label: "Test rapide",
    questions: "10 questions",
    time: "≈ 1 minute",
    desc: "Pour découvrir une première tendance.",
  },
  {
    mode: 40,
    label: "Test standard",
    questions: "40 questions",
    time: "≈ 4 à 6 min",
    desc: "Le meilleur équilibre entre rapidité et fiabilité.",
    recommended: true,
  },
  {
    mode: 100,
    label: "Test complet",
    questions: "100 questions",
    time: "≈ 10 à 15 min",
    desc: "Pour un résultat plus détaillé et plus stable.",
  },
];

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { startQuiz } = useQuiz();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start();
  }, []);

  const handleStart = (mode: QuizMode) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    startQuiz(mode);
    router.push("/quiz");
  };

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;
  const styles = makeStyles(colors);

  return (
    <View style={[styles.container, { paddingTop: topPad + 16, paddingBottom: botPad + 20 }]}>
      {/* Background glow blobs */}
      <View style={[styles.blob, styles.blobTL, { backgroundColor: colors.gradientStart }]} />
      <View style={[styles.blob, styles.blobBR, { backgroundColor: colors.gradientEnd }]} />

      <Animated.View
        style={[styles.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
      >
        {/* Badge */}
        <LinearGradient
          colors={[colors.gradientStart, colors.gradientEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.badge}
        >
          <Text style={styles.badgeText}>Présidentielle 2027</Text>
        </LinearGradient>

        {/* Title */}
        <Text style={[styles.title, { color: colors.foreground }]}>
          Tu préfères{"\n"}
          <Text style={styles.titleGrad}>2027</Text>
        </Text>

        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          Le jeu politique qui te fait choisir entre deux propositions opposées. Choisis un format, réponds aux dilemmes, puis découvre ton classement.
        </Text>

        {/* Mode cards */}
        <View style={styles.modesGrid}>
          {MODES.map((m) => (
            <ModeCard
              key={m.mode}
              item={m}
              onPress={() => handleStart(m.mode)}
              colors={colors}
            />
          ))}
        </View>

        <Text style={[styles.footer, { color: colors.mutedForeground }]}>
          Anonyme · 23 candidats · 200 questions au total
        </Text>
      </Animated.View>
    </View>
  );
}

function ModeCard({
  item,
  onPress,
  colors,
}: {
  item: (typeof MODES)[0];
  onPress: () => void;
  colors: ReturnType<typeof useColors>;
}) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scale, { toValue: 0.97, duration: 80, useNativeDriver: true }),
      Animated.timing(scale, { toValue: 1, duration: 80, useNativeDriver: true }),
    ]).start();
    onPress();
  };

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        onPress={handlePress}
        style={({ pressed }) => [
          cardStyles.card,
          {
            borderColor: item.recommended
              ? "rgba(147,197,253,0.55)"
              : colors.border,
            opacity: pressed ? 0.88 : 1,
          },
          item.recommended && { borderWidth: 1.5 },
        ]}
        testID={`mode-${item.mode}`}
      >
        {item.recommended && (
          <LinearGradient
            colors={[colors.gradientStart, colors.gradientEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[StyleSheet.absoluteFillObject, { borderRadius: 20, opacity: 0.18 }]}
          />
        )}

        {item.recommended && (
          <LinearGradient
            colors={[colors.gradientStart, colors.gradientEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={cardStyles.pill}
          >
            <Text style={cardStyles.pillText}>Recommandé</Text>
          </LinearGradient>
        )}

        <Text style={[cardStyles.label, { color: colors.mutedForeground }]}>
          {item.label}
        </Text>
        <Text style={[cardStyles.questions, { color: colors.foreground }]}>
          {item.questions}
        </Text>
        <View style={[cardStyles.timeBadge, { backgroundColor: "rgba(255,255,255,0.13)" }]}>
          <Ionicons name="time-outline" size={12} color={colors.mutedForeground} />
          <Text style={[cardStyles.timeText, { color: colors.foreground }]}>
            {item.time}
          </Text>
        </View>
        <Text style={[cardStyles.desc, { color: colors.mutedForeground }]}>
          {item.desc}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

const cardStyles = StyleSheet.create({
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
    gap: 8,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.09)",
    minHeight: 160,
  },
  pill: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    marginBottom: 2,
  },
  pillText: {
    fontSize: 10,
    fontFamily: "Inter_700Bold",
    color: "#fff",
    letterSpacing: 0.3,
  },
  label: {
    fontSize: 11,
    fontFamily: "Inter_700Bold",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  questions: {
    fontSize: 24,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.5,
  },
  timeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  timeText: {
    fontSize: 12,
    fontFamily: "Inter_700Bold",
  },
  desc: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    lineHeight: 18,
  },
});

function makeStyles(colors: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      paddingHorizontal: 20,
      overflow: "hidden",
    },
    blob: {
      position: "absolute",
      width: 300,
      height: 300,
      borderRadius: 150,
      opacity: 0.25,
    },
    blobTL: { top: -80, left: -80 },
    blobBR: { bottom: -80, right: -80 },
    content: {
      flex: 1,
      gap: 18,
      justifyContent: "center",
    },
    badge: {
      alignSelf: "flex-start",
      paddingHorizontal: 14,
      paddingVertical: 7,
      borderRadius: 999,
    },
    badgeText: {
      fontSize: 12,
      fontFamily: "Inter_700Bold",
      color: "#fff",
      letterSpacing: 0.4,
    },
    title: {
      fontSize: 36,
      fontFamily: "Inter_700Bold",
      lineHeight: 42,
      letterSpacing: -0.5,
    },
    titleGrad: {
      color: "#8b5cf6",
    },
    subtitle: {
      fontSize: 14,
      fontFamily: "Inter_400Regular",
      lineHeight: 20,
    },
    modesGrid: {
      gap: 12,
    },
    footer: {
      fontSize: 11,
      fontFamily: "Inter_400Regular",
      textAlign: "center",
    },
  });
}
