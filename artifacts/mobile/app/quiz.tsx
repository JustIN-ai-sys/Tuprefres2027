import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Platform,
  Pressable,
  ScrollView,
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
  const cardSlide = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    if (isFinished) {
      router.replace("/results");
      return;
    }
    cardAnim.setValue(0);
    cardSlide.setValue(20);
    Animated.parallel([
      Animated.timing(cardAnim, { toValue: 1, duration: 260, useNativeDriver: true }),
      Animated.timing(cardSlide, { toValue: 0, duration: 260, useNativeDriver: true }),
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
  const prevAnswer = answers[q.id];

  return (
    <View style={[styles.container, { paddingTop: topPad + 8, paddingBottom: botPad + 16, backgroundColor: colors.background }]}>
      {/* Background blobs */}
      <View style={[styles.blob, styles.blobTL, { backgroundColor: colors.gradientStart }]} />
      <View style={[styles.blob, styles.blobBR, { backgroundColor: colors.gradientEnd }]} />

      {/* Header */}
      <View style={styles.header}>
        <Pressable
          style={[styles.backBtn, { backgroundColor: "rgba(255,255,255,0.1)", borderColor: colors.border }]}
          onPress={handleBack}
          hitSlop={12}
          testID="back-btn"
        >
          <Ionicons name="arrow-back" size={20} color={colors.foreground} />
        </Pressable>

        <View style={styles.counterRow}>
          <Text style={[styles.counter, { color: colors.foreground }]}>{currentIndex + 1}</Text>
          <Text style={[styles.counterOf, { color: colors.mutedForeground }]}> / {total}</Text>
        </View>

        {/* Theme pill */}
        <View style={[styles.themePill, { backgroundColor: "rgba(255,255,255,0.09)", borderColor: colors.border }]}>
          <Text style={[styles.themeText, { color: colors.mutedForeground }]} numberOfLines={1}>
            {q.theme}
          </Text>
        </View>
      </View>

      {/* Progress bar */}
      <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
        <LinearGradient
          colors={[colors.gradientStart, colors.gradientEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.progressFill, { width: `${progressPct}%` as any }]}
        />
      </View>

      {/* Scrollable content */}
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <Animated.View
          style={{ opacity: cardAnim, transform: [{ translateY: cardSlide }], gap: 14 }}
        >
          {/* "Tu préfères" prompt */}
          <Text style={[styles.prompt, { color: colors.mutedForeground }]}>
            Tu préfères
          </Text>

          {/* Card A */}
          <ChoiceCard
            text={q.optionA}
            isSelected={prevAnswer === "A"}
            onPress={() => handleAnswer("A")}
            testID="option-A"
          />

          {/* "ou" separator */}
          <View style={styles.ouRow}>
            <View style={[styles.ouLine, { backgroundColor: colors.border }]} />
            <Text style={[styles.ouText, { color: colors.mutedForeground }]}>ou</Text>
            <View style={[styles.ouLine, { backgroundColor: colors.border }]} />
          </View>

          {/* Card B */}
          <ChoiceCard
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
                    ? "rgba(255,255,255,0.95)"
                    : "rgba(255,255,255,0.88)",
                borderColor:
                  prevAnswer === "N"
                    ? "#fff"
                    : "rgba(255,255,255,0.7)",
                opacity: pressed ? 0.7 : 1,
              },
            ]}
            onPress={() => handleAnswer("N")}
            testID="option-N"
          >
            {prevAnswer === "N" && (
              <Ionicons name="checkmark-circle" size={16} color="#e2e8f0" style={{ marginRight: 6 }} />
            )}
            <Text style={[styles.neutralText, { color: "#07081f" }]}>
              Neutre / Sans opinion
            </Text>
          </Pressable>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

function ChoiceCard({
  text,
  isSelected,
  onPress,
  testID,
}: {
  text: string;
  isSelected: boolean;
  onPress: () => void;
  testID?: string;
}) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scale, { toValue: 0.975, duration: 70, useNativeDriver: true }),
      Animated.timing(scale, { toValue: 1, duration: 70, useNativeDriver: true }),
    ]).start();
    onPress();
  };

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable onPress={handlePress} testID={testID}>
        <LinearGradient
          colors={
            isSelected
              ? ["rgba(37,99,235,1)", "rgba(2,132,199,0.95)"]
              : ["rgba(37,99,235,0.78)", "rgba(14,165,233,0.65)"]
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            cardStyles.card,
            {
              borderColor: isSelected
                ? "rgba(219,234,254,0.9)"
                : "rgba(147,197,253,0.35)",
              borderWidth: isSelected ? 2 : 1,
            },
          ]}
        >
          <Text style={cardStyles.text}>{text}</Text>
          {isSelected && (
            <View style={cardStyles.check}>
              <Ionicons name="checkmark" size={16} color="#fff" />
            </View>
          )}
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
}

const cardStyles = StyleSheet.create({
  card: {
    borderRadius: 26,
    padding: 34,
    minHeight: 210,
    justifyContent: "center",
    gap: 16,
  },
  text: {
    fontSize: 26,
    fontFamily: "Inter_700Bold",
    color: "#fff",
    lineHeight: 36,
    letterSpacing: -0.4,
  },
  check: {
    alignSelf: "flex-end",
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.25)",
    alignItems: "center",
    justifyContent: "center",
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    overflow: "hidden",
  },
  blob: {
    position: "absolute",
    width: 240,
    height: 240,
    borderRadius: 120,
    opacity: 0.18,
  },
  blobTL: { top: -70, left: -70 },
  blobBR: { bottom: -70, right: -70 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    marginBottom: 14,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    flexShrink: 0,
  },
  counterRow: {
    flexDirection: "row",
    alignItems: "baseline",
    flexShrink: 0,
  },
  counter: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
  },
  counterOf: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
  },
  themePill: {
    flex: 1,
    alignItems: "flex-end",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    maxWidth: 160,
  },
  themeText: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
    marginBottom: 20,
  },
  progressFill: {
    height: 6,
    borderRadius: 3,
  },
  scroll: {
    flexGrow: 1,
    paddingBottom: 8,
  },
  prompt: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.2,
    marginBottom: 2,
  },
  ouRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginVertical: 2,
  },
  ouLine: {
    flex: 1,
    height: 1,
  },
  ouText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.3,
  },
  neutralBtn: {
    flexDirection: "row",
    borderRadius: 20,
    borderWidth: 1.5,
    paddingVertical: 20,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  neutralText: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
  },
});
