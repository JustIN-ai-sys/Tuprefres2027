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

import { Answer, useQuiz } from "@/contexts/QuizContext";
import { useColors } from "@/hooks/useColors";

export default function QuizScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { questions, currentIndex, answers, isFinished, answer, goBack, resetQuiz } =
    useQuiz();

  const cardAnim = useRef(new Animated.Value(0)).current;
  const cardSlide = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    if (isFinished) {
      router.replace("/results");
      return;
    }
    cardAnim.setValue(0);
    cardSlide.setValue(30);
    Animated.parallel([
      Animated.timing(cardAnim, {
        toValue: 1,
        duration: 320,
        useNativeDriver: true,
      }),
      Animated.timing(cardSlide, {
        toValue: 0,
        duration: 320,
        useNativeDriver: true,
      }),
    ]).start();
  }, [currentIndex, isFinished]);

  useEffect(() => {
    if (questions.length === 0) {
      router.replace("/");
    }
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
  const progressWidth = ((currentIndex) / total) * 100;
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  const styles = makeStyles(colors);

  const previousAnswer = answers[q.id];

  return (
    <View
      style={[
        styles.container,
        { paddingTop: topPad + 8, paddingBottom: botPad + 16 },
      ]}
    >
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          style={styles.backBtn}
          onPress={handleBack}
          hitSlop={12}
          testID="back-btn"
        >
          <Ionicons name="arrow-back" size={22} color={colors.foreground} />
        </Pressable>

        <View style={styles.counterContainer}>
          <Text style={[styles.counter, { color: colors.foreground }]}>
            {currentIndex + 1}
          </Text>
          <Text style={[styles.counterTotal, { color: colors.mutedForeground }]}>
            /{total}
          </Text>
        </View>

        <View style={styles.headerRight} />
      </View>

      {/* Progress bar */}
      <View
        style={[styles.progressTrack, { backgroundColor: colors.border }]}
      >
        <Animated.View
          style={[
            styles.progressFill,
            {
              backgroundColor: colors.primary,
              width: `${progressWidth}%` as any,
            },
          ]}
        />
      </View>

      {/* Bloc label */}
      <View style={styles.blocContainer}>
        <Text style={[styles.blocText, { color: colors.mutedForeground }]}>
          {q.bloc || q.theme}
        </Text>
      </View>

      {/* Card */}
      <Animated.View
        style={[
          styles.card,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
            opacity: cardAnim,
            transform: [{ translateY: cardSlide }],
          },
        ]}
      >
        <Text style={[styles.questionTheme, { color: colors.primary }]}>
          {q.theme}
        </Text>
        <Text style={[styles.questionText, { color: colors.foreground }]}>
          {q.enonce}
        </Text>
      </Animated.View>

      {/* Options */}
      <View style={styles.options}>
        <OptionButton
          label="A"
          text={q.optionA}
          color={colors.optionA}
          textColor={colors.optionAForeground}
          backgroundColor={colors.card}
          borderColor={colors.border}
          isSelected={previousAnswer === "A"}
          onPress={() => handleAnswer("A")}
          testID="option-A"
        />

        <OptionButton
          label="B"
          text={q.optionB}
          color={colors.optionB}
          textColor={colors.optionBForeground}
          backgroundColor={colors.card}
          borderColor={colors.border}
          isSelected={previousAnswer === "B"}
          onPress={() => handleAnswer("B")}
          testID="option-B"
        />

        {/* Neutral */}
        <Pressable
          style={({ pressed }) => [
            styles.neutralBtn,
            {
              borderColor:
                previousAnswer === "N" ? colors.mutedForeground : colors.border,
              backgroundColor:
                previousAnswer === "N"
                  ? colors.secondary
                  : colors.background,
              opacity: pressed ? 0.7 : 1,
            },
          ]}
          onPress={() => handleAnswer("N")}
          testID="option-N"
        >
          <Text
            style={[styles.neutralText, { color: colors.mutedForeground }]}
          >
            Neutre / Sans opinion
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

interface OptionButtonProps {
  label: string;
  text: string;
  color: string;
  textColor: string;
  backgroundColor: string;
  borderColor: string;
  isSelected: boolean;
  onPress: () => void;
  testID?: string;
}

function OptionButton({
  label,
  text,
  color,
  textColor,
  backgroundColor,
  borderColor,
  isSelected,
  onPress,
  testID,
}: OptionButtonProps) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scale, {
        toValue: 0.97,
        duration: 80,
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 1,
        duration: 80,
        useNativeDriver: true,
      }),
    ]).start();
    onPress();
  };

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        onPress={handlePress}
        testID={testID}
        style={({ pressed }) => [
          optionStyles.btn,
          {
            backgroundColor: isSelected ? color : backgroundColor,
            borderColor: isSelected ? color : borderColor,
            opacity: pressed ? 0.85 : 1,
          },
        ]}
      >
        <View
          style={[
            optionStyles.badge,
            {
              backgroundColor: isSelected ? "rgba(255,255,255,0.25)" : color,
            },
          ]}
        >
          <Text
            style={[
              optionStyles.badgeLabel,
              { color: isSelected ? color : textColor, opacity: isSelected ? 0.9 : 1 },
              isSelected && { color: "#fff" },
            ]}
          >
            {label}
          </Text>
        </View>
        <Text
          style={[
            optionStyles.optionText,
            {
              color: isSelected ? "#fff" : optionTextColor(color),
              flex: 1,
            },
          ]}
        >
          {text}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

function optionTextColor(color: string) {
  return "#1a2540";
}

const optionStyles = StyleSheet.create({
  btn: {
    flexDirection: "row",
    alignItems: "flex-start",
    borderRadius: 14,
    borderWidth: 2,
    padding: 16,
    gap: 12,
  },
  badge: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  badgeLabel: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
  },
  optionText: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    lineHeight: 20,
    flexShrink: 1,
  },
});

function makeStyles(colors: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      paddingHorizontal: 20,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 16,
    },
    backBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.card,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: colors.border,
    },
    counterContainer: {
      flexDirection: "row",
      alignItems: "baseline",
    },
    counter: {
      fontSize: 22,
      fontFamily: "Inter_700Bold",
    },
    counterTotal: {
      fontSize: 16,
      fontFamily: "Inter_400Regular",
    },
    headerRight: {
      width: 40,
    },
    progressTrack: {
      height: 4,
      borderRadius: 2,
      overflow: "hidden",
      marginBottom: 16,
    },
    progressFill: {
      height: 4,
      borderRadius: 2,
    },
    blocContainer: {
      marginBottom: 12,
    },
    blocText: {
      fontSize: 11,
      fontFamily: "Inter_600SemiBold",
      letterSpacing: 1,
      textTransform: "uppercase",
    },
    card: {
      borderRadius: colors.radius,
      borderWidth: 1,
      padding: 20,
      marginBottom: 16,
      gap: 10,
    },
    questionTheme: {
      fontSize: 12,
      fontFamily: "Inter_600SemiBold",
      letterSpacing: 0.5,
      textTransform: "uppercase",
    },
    questionText: {
      fontSize: 18,
      fontFamily: "Inter_600SemiBold",
      lineHeight: 26,
      letterSpacing: -0.2,
    },
    options: {
      gap: 10,
      flex: 1,
      justifyContent: "flex-start",
    },
    neutralBtn: {
      borderRadius: 14,
      borderWidth: 1,
      paddingVertical: 14,
      paddingHorizontal: 16,
      alignItems: "center",
      justifyContent: "center",
    },
    neutralText: {
      fontSize: 13,
      fontFamily: "Inter_500Medium",
    },
  });
}
