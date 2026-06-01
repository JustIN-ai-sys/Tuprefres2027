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

import { Answer, useQuiz } from "@/contexts/QuizContext";
import { useColors } from "@/hooks/useColors";

export default function QuizScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { questions, currentIndex, answers, isFinished, answer, goBack, resetQuiz } = useQuiz();

  const cardAnim = useRef(new Animated.Value(0)).current;
  const cardSlide = useRef(new Animated.Value(24)).current;

  useEffect(() => {
    if (isFinished) {
      router.replace("/results");
      return;
    }
    cardAnim.setValue(0);
    cardSlide.setValue(24);
    Animated.parallel([
      Animated.timing(cardAnim, { toValue: 1, duration: 280, useNativeDriver: true }),
      Animated.timing(cardSlide, { toValue: 0, duration: 280, useNativeDriver: true }),
    ]).start();
  }, [currentIndex, isFinished]);

  useEffect(() => {
    if (questions.length === 0) router.replace("/");
  }, [questions]);

  const handleAnswer = (choice: Answer) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    answer(choice);
  };

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (currentIndex === 0) {
      resetQuiz();
      router.replace("/");
    } else {
      goBack();
    }
  };

  if (questions.length === 0 || !questions[currentIndex]) return null;

  const q = questions[currentIndex];
  const total = questions.length;
  const progressPct = (currentIndex / total) * 100;
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;
  const styles = makeStyles(colors);
  const prevAnswer = answers[q.id];

  return (
    <View style={[styles.container, { paddingTop: topPad + 8, paddingBottom: botPad + 16 }]}>
      {/* Background blobs */}
      <View style={[styles.blob, styles.blobTL, { backgroundColor: colors.gradientStart }]} />
      <View style={[styles.blob, styles.blobBR, { backgroundColor: colors.gradientEnd }]} />

      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={handleBack} hitSlop={12} testID="back-btn">
          <Ionicons name="arrow-back" size={20} color={colors.foreground} />
        </Pressable>
        <View style={styles.counterRow}>
          <Text style={[styles.counter, { color: colors.foreground }]}>{currentIndex + 1}</Text>
          <Text style={[styles.counterOf, { color: colors.mutedForeground }]}> / {total}</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* Progress */}
      <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
        <LinearGradient
          colors={[colors.gradientStart, colors.gradientEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.progressFill, { width: `${progressPct}%` as any }]}
        />
      </View>

      {/* Theme */}
      <Text style={[styles.theme, { color: colors.mutedForeground }]}>
        {q.theme}
      </Text>

      {/* Options + central sentence */}
      <Animated.View
        style={[styles.options, { opacity: cardAnim, transform: [{ translateY: cardSlide }] }]}
      >
        {/* Central sentence */}
        <Text style={[styles.questionText, { color: colors.foreground }]}>
          {"Tu préfères "}
          <Text style={styles.optionAInline}>{q.optionA}</Text>
          {" ou "}
          <Text style={styles.optionBInline}>{q.optionB}</Text>
          {" ?"}
        </Text>

        {/* Option A */}
        <OptionCard
          label="Option A"
          text={q.optionA}
          isSelected={prevAnswer === "A"}
          onPress={() => handleAnswer("A")}
          testID="option-A"
        />

        {/* Option B */}
        <OptionCard
          label="Option B"
          text={q.optionB}
          isSelected={prevAnswer === "B"}
          onPress={() => handleAnswer("B")}
          testID="option-B"
        />

        {/* Neutral */}
        <Pressable
          style={({ pressed }) => [
            styles.neutralBtn,
            {
              backgroundColor:
                prevAnswer === "N"
                  ? "rgba(148,163,184,0.35)"
                  : colors.optionN,
              borderColor:
                prevAnswer === "N"
                  ? "rgba(203,213,225,0.5)"
                  : "rgba(203,213,225,0.22)",
              opacity: pressed ? 0.7 : 1,
            },
          ]}
          onPress={() => handleAnswer("N")}
          testID="option-N"
        >
          <Text style={[styles.neutralText, { color: colors.optionNForeground }]}>
            Neutre / Sans opinion
          </Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

function OptionCard({
  label,
  text,
  isSelected,
  onPress,
  testID,
}: {
  label: string;
  text: string;
  isSelected: boolean;
  onPress: () => void;
  testID?: string;
}) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scale, { toValue: 0.97, duration: 70, useNativeDriver: true }),
      Animated.timing(scale, { toValue: 1, duration: 70, useNativeDriver: true }),
    ]).start();
    onPress();
  };

  return (
    <Animated.View style={[{ transform: [{ scale }] }, { flex: 1 }]}>
      <Pressable onPress={handlePress} testID={testID} style={{ flex: 1 }}>
        <LinearGradient
          colors={["rgba(37,99,235,0.92)", "rgba(14,165,233,0.78)"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            optionStyles.card,
            {
              borderColor: isSelected
                ? "rgba(219,234,254,0.86)"
                : "rgba(147,197,253,0.45)",
              opacity: isSelected ? 1 : 0.85,
            },
          ]}
        >
          <View style={optionStyles.labelBadge}>
            <Text style={optionStyles.labelText}>{label}</Text>
          </View>
          <Text style={optionStyles.text}>{text}</Text>
          {isSelected && (
            <View style={optionStyles.checkmark}>
              <Ionicons name="checkmark" size={14} color="#fff" />
            </View>
          )}
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
}

const optionStyles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: 20,
    borderWidth: 1.5,
    padding: 18,
    gap: 10,
    justifyContent: "space-between",
  },
  labelBadge: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.18)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  labelText: {
    fontSize: 11,
    fontFamily: "Inter_700Bold",
    color: "#fff",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  text: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    color: "#fff",
    lineHeight: 21,
    flex: 1,
  },
  checkmark: {
    alignSelf: "flex-end",
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.3)",
    alignItems: "center",
    justifyContent: "center",
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
      width: 250,
      height: 250,
      borderRadius: 125,
      opacity: 0.2,
    },
    blobTL: { top: -60, left: -60 },
    blobBR: { bottom: -60, right: -60 },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 14,
    },
    backBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: "rgba(255,255,255,0.1)",
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: colors.border,
    },
    counterRow: {
      flexDirection: "row",
      alignItems: "baseline",
    },
    counter: {
      fontSize: 22,
      fontFamily: "Inter_700Bold",
    },
    counterOf: {
      fontSize: 16,
      fontFamily: "Inter_400Regular",
    },
    progressTrack: {
      height: 6,
      borderRadius: 3,
      overflow: "hidden",
      marginBottom: 18,
    },
    progressFill: {
      height: 6,
      borderRadius: 3,
    },
    theme: {
      fontSize: 11,
      fontFamily: "Inter_700Bold",
      textTransform: "uppercase",
      letterSpacing: 1.2,
      marginBottom: 10,
    },
    questionText: {
      fontSize: 17,
      fontFamily: "Inter_500Medium",
      lineHeight: 26,
      letterSpacing: -0.2,
      marginBottom: 14,
    },
    optionAInline: {
      fontFamily: "Inter_700Bold",
      color: "#7eb8f7",
    },
    optionBInline: {
      fontFamily: "Inter_700Bold",
      color: "#67e8f9",
    },
    options: {
      flex: 1,
      gap: 12,
    },
    neutralBtn: {
      borderRadius: 999,
      borderWidth: 1,
      paddingVertical: 13,
      paddingHorizontal: 20,
      alignItems: "center",
      justifyContent: "center",
    },
    neutralText: {
      fontSize: 13,
      fontFamily: "Inter_600SemiBold",
    },
  });
}
