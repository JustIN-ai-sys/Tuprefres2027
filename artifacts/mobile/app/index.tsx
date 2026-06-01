import { Ionicons } from "@expo/vector-icons";
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

import { useQuiz } from "@/contexts/QuizContext";
import { useColors } from "@/hooks/useColors";

const THEMES = [
  "Immigration · Sécurité",
  "Économie · Fiscalité",
  "Santé · Éducation",
  "Environnement · Énergie",
  "Europe · International",
  "Démocratie · Société",
];

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { startQuiz } = useQuiz();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const btnScale = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 700,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 700,
        useNativeDriver: true,
      }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.04,
          duration: 1800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const handleStart = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Animated.sequence([
      Animated.timing(btnScale, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(btnScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start(() => {
      startQuiz();
      router.push("/quiz");
    });
  };

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  const styles = makeStyles(colors);

  return (
    <View
      style={[
        styles.container,
        { paddingTop: topPad + 20, paddingBottom: botPad + 20 },
      ]}
    >
      {/* Flag accent bar */}
      <View style={styles.flagBar}>
        <View style={[styles.flagSegment, { backgroundColor: "#002395" }]} />
        <View style={[styles.flagSegment, { backgroundColor: "#EDEDED" }]} />
        <View style={[styles.flagSegment, { backgroundColor: "#ED2939" }]} />
      </View>

      <Animated.View
        style={[
          styles.content,
          { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
        ]}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.badge}>
            <Ionicons name="stats-chart" size={14} color={colors.primary} />
            <Text style={[styles.badgeText, { color: colors.primary }]}>
              Présidentielle 2027
            </Text>
          </View>

          <Text style={[styles.title, { color: colors.foreground }]}>
            Tu préfères{"\n"}
            <Text style={[styles.titleAccent, { color: colors.primary }]}>
              quel candidat ?
            </Text>
          </Text>

          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            40 questions · 23 candidats · Résultat immédiat
          </Text>
        </View>

        {/* Themes grid */}
        <View style={styles.themesContainer}>
          {THEMES.map((theme, i) => (
            <View
              key={i}
              style={[
                styles.themeChip,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                },
              ]}
            >
              <Text
                style={[styles.themeText, { color: colors.mutedForeground }]}
              >
                {theme}
              </Text>
            </View>
          ))}
        </View>

        {/* Info */}
        <View
          style={[
            styles.infoBox,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <View style={styles.infoRow}>
            <Ionicons
              name="checkmark-circle"
              size={18}
              color={colors.success}
            />
            <Text style={[styles.infoText, { color: colors.foreground }]}>
              Anonyme — aucune donnée personnelle collectée
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons
              name="time-outline"
              size={18}
              color={colors.mutedForeground}
            />
            <Text style={[styles.infoText, { color: colors.foreground }]}>
              Environ 5 minutes
            </Text>
          </View>
        </View>

        {/* CTA */}
        <Animated.View style={{ transform: [{ scale: btnScale }] }}>
          <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
            <Pressable
              style={[styles.startBtn, { backgroundColor: colors.primary }]}
              onPress={handleStart}
              testID="start-quiz-btn"
            >
              <Text
                style={[
                  styles.startBtnText,
                  { color: colors.primaryForeground },
                ]}
              >
                Commencer le test
              </Text>
              <Ionicons
                name="arrow-forward"
                size={22}
                color={colors.primaryForeground}
              />
            </Pressable>
          </Animated.View>
        </Animated.View>

        <Text style={[styles.disclaimer, { color: colors.mutedForeground }]}>
          Basé sur les positions publiques des candidats · 200 questions au total
        </Text>
      </Animated.View>
    </View>
  );
}

function makeStyles(colors: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    flagBar: {
      flexDirection: "row",
      height: 4,
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
    },
    flagSegment: {
      flex: 1,
    },
    content: {
      flex: 1,
      paddingHorizontal: 24,
      justifyContent: "center",
      gap: 24,
    },
    header: {
      gap: 12,
    },
    badge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      alignSelf: "flex-start",
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 20,
      paddingHorizontal: 12,
      paddingVertical: 5,
    },
    badgeText: {
      fontSize: 12,
      fontFamily: "Inter_600SemiBold",
      letterSpacing: 0.3,
    },
    title: {
      fontSize: 38,
      fontFamily: "Inter_700Bold",
      lineHeight: 46,
      letterSpacing: -0.5,
    },
    titleAccent: {
      fontSize: 38,
      fontFamily: "Inter_700Bold",
    },
    subtitle: {
      fontSize: 15,
      fontFamily: "Inter_400Regular",
      lineHeight: 22,
    },
    themesContainer: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
    },
    themeChip: {
      borderRadius: 20,
      borderWidth: 1,
      paddingHorizontal: 12,
      paddingVertical: 6,
    },
    themeText: {
      fontSize: 12,
      fontFamily: "Inter_500Medium",
    },
    infoBox: {
      borderRadius: colors.radius,
      borderWidth: 1,
      padding: 16,
      gap: 10,
    },
    infoRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    infoText: {
      fontSize: 14,
      fontFamily: "Inter_400Regular",
      flex: 1,
    },
    startBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      borderRadius: colors.radius,
      paddingVertical: 18,
      gap: 10,
    },
    startBtnText: {
      fontSize: 17,
      fontFamily: "Inter_700Bold",
      letterSpacing: 0.2,
    },
    disclaimer: {
      fontSize: 11,
      fontFamily: "Inter_400Regular",
      textAlign: "center",
      lineHeight: 16,
    },
  });
}
