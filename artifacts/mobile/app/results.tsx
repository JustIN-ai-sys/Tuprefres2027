import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { CandidateResult, useQuiz } from "@/contexts/QuizContext";
import { useColors } from "@/hooks/useColors";

export default function ResultsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { results, resetQuiz } = useQuiz();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;

  useEffect(() => {
    if (!results) {
      router.replace("/");
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, [results]);

  const handleRestart = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    resetQuiz();
    router.replace("/");
  };

  if (!results) return null;

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  const styles = makeStyles(colors);
  const top3 = results.slice(0, 3);

  return (
    <View
      style={[
        styles.container,
        { paddingTop: topPad + 8 },
      ]}
    >
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          style={styles.resetBtn}
          onPress={handleRestart}
          hitSlop={12}
          testID="restart-btn"
        >
          <Ionicons name="refresh" size={20} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>
          Vos résultats
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <Animated.View
        style={{
          flex: 1,
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        }}
      >
        {/* Top 3 podium */}
        <View
          style={[
            styles.podiumCard,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <View style={styles.podiumHeader}>
            <Ionicons name="trophy" size={18} color="#f59e0b" />
            <Text style={[styles.podiumTitle, { color: colors.foreground }]}>
              Vos candidats les plus proches
            </Text>
          </View>
          {top3.map((c, i) => (
            <TopCandidateRow
              key={c.id}
              candidate={c}
              rank={i + 1}
              colors={colors}
              isFirst={i === 0}
            />
          ))}
        </View>

        {/* Full ranking */}
        <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>
          Classement complet
        </Text>

        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          scrollEnabled={!!results.length}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: botPad + 80 }}
          renderItem={({ item, index }) => (
            <RankingRow
              candidate={item}
              rank={index + 1}
              colors={colors}
              maxPercentage={results[0]?.percentage ?? 100}
            />
          )}
          ItemSeparatorComponent={() => (
            <View
              style={{ height: 1, backgroundColor: colors.border, marginHorizontal: 4 }}
            />
          )}
          style={[
            styles.rankingList,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        />
      </Animated.View>

      {/* Restart button */}
      <View
        style={[
          styles.bottomBar,
          {
            backgroundColor: colors.background,
            paddingBottom: botPad + 16,
            borderTopColor: colors.border,
          },
        ]}
      >
        <Pressable
          style={({ pressed }) => [
            styles.restartBtn,
            {
              backgroundColor: colors.primary,
              opacity: pressed ? 0.85 : 1,
            },
          ]}
          onPress={handleRestart}
          testID="restart-quiz-btn"
        >
          <Ionicons name="refresh" size={18} color="#fff" />
          <Text style={styles.restartBtnText}>Recommencer</Text>
        </Pressable>
      </View>
    </View>
  );
}

function TopCandidateRow({
  candidate,
  rank,
  colors,
  isFirst,
}: {
  candidate: CandidateResult;
  rank: number;
  colors: ReturnType<typeof useColors>;
  isFirst: boolean;
}) {
  const barAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(barAnim, {
      toValue: candidate.percentage,
      duration: 800,
      delay: rank * 120,
      useNativeDriver: false,
    }).start();
  }, []);

  const styles = StyleSheet.create({
    row: {
      paddingVertical: 12,
      gap: 8,
    },
    topRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    rankBadge: {
      width: 26,
      height: 26,
      borderRadius: 13,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: isFirst ? "#f59e0b" : colors.secondary,
    },
    rankText: {
      fontSize: 12,
      fontFamily: "Inter_700Bold",
      color: isFirst ? "#fff" : colors.mutedForeground,
    },
    colorDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
    },
    nameContainer: { flex: 1 },
    name: {
      fontSize: 15,
      fontFamily: "Inter_600SemiBold",
      color: colors.foreground,
    },
    party: {
      fontSize: 11,
      fontFamily: "Inter_400Regular",
      color: colors.mutedForeground,
    },
    pct: {
      fontSize: 20,
      fontFamily: "Inter_700Bold",
      color: colors.foreground,
    },
    barTrack: {
      height: 5,
      borderRadius: 3,
      backgroundColor: colors.border,
      overflow: "hidden",
    },
    bar: {
      height: 5,
      borderRadius: 3,
    },
  });

  return (
    <View style={styles.row}>
      <View style={styles.topRow}>
        <View style={styles.rankBadge}>
          <Text style={styles.rankText}>{rank}</Text>
        </View>
        <View style={[styles.colorDot, { backgroundColor: candidate.color }]} />
        <View style={styles.nameContainer}>
          <Text style={styles.name}>{candidate.name}</Text>
          <Text style={styles.party} numberOfLines={1}>
            {candidate.party}
          </Text>
        </View>
        <Text style={styles.pct}>{candidate.percentage}%</Text>
      </View>
      <View style={styles.barTrack}>
        <Animated.View
          style={[
            styles.bar,
            {
              backgroundColor: candidate.color,
              width: barAnim.interpolate({
                inputRange: [0, 100],
                outputRange: ["0%", "100%"],
              }),
            },
          ]}
        />
      </View>
    </View>
  );
}

function RankingRow({
  candidate,
  rank,
  colors,
  maxPercentage,
}: {
  candidate: CandidateResult;
  rank: number;
  colors: ReturnType<typeof useColors>;
  maxPercentage: number;
}) {
  const barAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(barAnim, {
      toValue: maxPercentage > 0 ? (candidate.percentage / maxPercentage) * 100 : 0,
      duration: 600,
      delay: rank * 30,
      useNativeDriver: false,
    }).start();
  }, []);

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingVertical: 10,
        gap: 10,
      }}
    >
      <Text
        style={{
          width: 24,
          fontSize: 12,
          fontFamily: "Inter_500Medium",
          color: colors.mutedForeground,
          textAlign: "center",
        }}
      >
        {rank}
      </Text>
      <View
        style={{
          width: 8,
          height: 8,
          borderRadius: 4,
          backgroundColor: candidate.color,
        }}
      />
      <View style={{ flex: 1, gap: 4 }}>
        <Text
          style={{
            fontSize: 13,
            fontFamily: "Inter_500Medium",
            color: colors.foreground,
          }}
        >
          {candidate.name}
        </Text>
        <View
          style={{
            height: 3,
            borderRadius: 2,
            backgroundColor: colors.border,
            overflow: "hidden",
          }}
        >
          <Animated.View
            style={{
              height: 3,
              borderRadius: 2,
              backgroundColor: candidate.color,
              width: barAnim.interpolate({
                inputRange: [0, 100],
                outputRange: ["0%", "100%"],
              }),
            }}
          />
        </View>
      </View>
      <Text
        style={{
          fontSize: 14,
          fontFamily: "Inter_700Bold",
          color: colors.foreground,
          minWidth: 40,
          textAlign: "right",
        }}
      >
        {candidate.percentage}%
      </Text>
    </View>
  );
}

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
    resetBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.card,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: colors.border,
    },
    headerTitle: {
      fontSize: 17,
      fontFamily: "Inter_700Bold",
    },
    podiumCard: {
      borderRadius: colors.radius,
      borderWidth: 1,
      padding: 16,
      marginBottom: 16,
      gap: 2,
    },
    podiumHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginBottom: 8,
    },
    podiumTitle: {
      fontSize: 14,
      fontFamily: "Inter_600SemiBold",
    },
    sectionTitle: {
      fontSize: 11,
      fontFamily: "Inter_600SemiBold",
      letterSpacing: 0.8,
      textTransform: "uppercase",
      marginBottom: 8,
    },
    rankingList: {
      borderRadius: colors.radius,
      borderWidth: 1,
      flex: 1,
    },
    bottomBar: {
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      paddingHorizontal: 20,
      paddingTop: 12,
      borderTopWidth: 1,
    },
    restartBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      borderRadius: colors.radius,
      paddingVertical: 16,
      gap: 8,
    },
    restartBtnText: {
      fontSize: 16,
      fontFamily: "Inter_700Bold",
      color: "#fff",
    },
  });
}
