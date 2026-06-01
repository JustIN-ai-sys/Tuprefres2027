import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  FlatList,
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import candidatePhotos from "@/constants/candidatePhotos";
import { CandidateResult, useQuiz } from "@/contexts/QuizContext";
import { useColors } from "@/hooks/useColors";

export default function ResultsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { results, resetQuiz } = useQuiz();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const heroScale = useRef(new Animated.Value(0.85)).current;

  useEffect(() => {
    if (!results) {
      router.replace("/");
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Animated.parallel([
      Animated.spring(heroScale, {
        toValue: 1,
        tension: 60,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
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
  const top1 = results[0];
  const top3 = results.slice(0, 3);

  return (
    <View style={[styles.container, { paddingTop: topPad + 8 }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.iconBtn} onPress={handleRestart} hitSlop={12} testID="restart-btn">
          <Ionicons name="close" size={20} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Vos résultats</Text>
        <View style={{ width: 40 }} />
      </View>

      <Animated.View style={{ flex: 1, opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
        {/* Hero card — winner */}
        <Animated.View
          style={[
            styles.heroCard,
            { backgroundColor: colors.card, borderColor: top1.color },
            { transform: [{ scale: heroScale }] },
          ]}
        >
          <View style={styles.heroLeft}>
            <CandidateAvatar id={top1.id} color={top1.color} size={72} />
          </View>
          <View style={styles.heroRight}>
            <View style={[styles.winnerBadge, { backgroundColor: "#f59e0b" }]}>
              <Ionicons name="trophy" size={11} color="#fff" />
              <Text style={styles.winnerBadgeText}>Votre candidat</Text>
            </View>
            <Text style={[styles.heroName, { color: colors.foreground }]}>{top1.name}</Text>
            <Text style={[styles.heroParty, { color: colors.mutedForeground }]} numberOfLines={2}>
              {top1.party}
            </Text>
            <View style={styles.heroScoreRow}>
              <Text style={[styles.heroPercent, { color: top1.color }]}>{top1.percentage}%</Text>
              <Text style={[styles.heroMatches, { color: colors.mutedForeground }]}>
                de compatibilité
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* Top 3 */}
        <View style={[styles.podiumCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>Top 3</Text>
          {top3.map((c, i) => (
            <TopRow key={c.id} candidate={c} rank={i + 1} colors={colors} />
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
            <View style={{ height: 1, backgroundColor: colors.border, marginHorizontal: 16 }} />
          )}
          style={[styles.rankingList, { backgroundColor: colors.card, borderColor: colors.border }]}
        />
      </Animated.View>

      {/* Bottom bar */}
      <View
        style={[
          styles.bottomBar,
          { backgroundColor: colors.background, paddingBottom: botPad + 16, borderTopColor: colors.border },
        ]}
      >
        <Pressable
          style={({ pressed }) => [
            styles.restartBtn,
            { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 },
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

/* ── CandidateAvatar ─────────────────────────────────── */
function CandidateAvatar({ id, color, size }: { id: string; color: string; size: number }) {
  const photo = candidatePhotos[id];
  const radius = size / 2;
  if (photo) {
    return (
      <Image
        source={photo}
        style={{
          width: size,
          height: size,
          borderRadius: radius,
          borderWidth: 2.5,
          borderColor: color,
        }}
        resizeMode="cover"
      />
    );
  }
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        backgroundColor: color + "33",
        borderWidth: 2,
        borderColor: color,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Ionicons name="person" size={size * 0.45} color={color} />
    </View>
  );
}

/* ── TopRow ──────────────────────────────────────────── */
function TopRow({
  candidate,
  rank,
  colors,
}: {
  candidate: CandidateResult;
  rank: number;
  colors: ReturnType<typeof useColors>;
}) {
  const barAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(barAnim, {
      toValue: candidate.percentage,
      duration: 800,
      delay: rank * 150,
      useNativeDriver: false,
    }).start();
  }, []);

  return (
    <View style={{ paddingVertical: 10, gap: 8 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
        <View
          style={{
            width: 24,
            height: 24,
            borderRadius: 12,
            backgroundColor: rank === 1 ? "#f59e0b" : colors.secondary,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={{ fontSize: 11, fontFamily: "Inter_700Bold", color: rank === 1 ? "#fff" : colors.mutedForeground }}>
            {rank}
          </Text>
        </View>
        <CandidateAvatar id={candidate.id} color={candidate.color} size={36} />
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 14, fontFamily: "Inter_600SemiBold", color: colors.foreground }}>
            {candidate.name}
          </Text>
          <Text style={{ fontSize: 11, fontFamily: "Inter_400Regular", color: colors.mutedForeground }} numberOfLines={1}>
            {candidate.party}
          </Text>
        </View>
        <Text style={{ fontSize: 18, fontFamily: "Inter_700Bold", color: candidate.color }}>
          {candidate.percentage}%
        </Text>
      </View>
      <View style={{ height: 4, borderRadius: 2, backgroundColor: colors.border, overflow: "hidden" }}>
        <Animated.View
          style={{
            height: 4,
            borderRadius: 2,
            backgroundColor: candidate.color,
            width: barAnim.interpolate({ inputRange: [0, 100], outputRange: ["0%", "100%"] }),
          }}
        />
      </View>
    </View>
  );
}

/* ── RankingRow ──────────────────────────────────────── */
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
      duration: 500,
      delay: rank * 25,
      useNativeDriver: false,
    }).start();
  }, []);

  return (
    <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 8, gap: 10 }}>
      <Text style={{ width: 20, fontSize: 11, fontFamily: "Inter_500Medium", color: colors.mutedForeground, textAlign: "center" }}>
        {rank}
      </Text>
      <CandidateAvatar id={candidate.id} color={candidate.color} size={32} />
      <View style={{ flex: 1, gap: 3 }}>
        <Text style={{ fontSize: 13, fontFamily: "Inter_500Medium", color: colors.foreground }}>
          {candidate.name}
        </Text>
        <View style={{ height: 3, borderRadius: 2, backgroundColor: colors.border, overflow: "hidden" }}>
          <Animated.View
            style={{
              height: 3,
              borderRadius: 2,
              backgroundColor: candidate.color,
              width: barAnim.interpolate({ inputRange: [0, 100], outputRange: ["0%", "100%"] }),
            }}
          />
        </View>
      </View>
      <Text style={{ fontSize: 14, fontFamily: "Inter_700Bold", color: colors.foreground, minWidth: 38, textAlign: "right" }}>
        {candidate.percentage}%
      </Text>
    </View>
  );
}

/* ── Styles ──────────────────────────────────────────── */
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
      marginBottom: 14,
    },
    iconBtn: {
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
    heroCard: {
      borderRadius: colors.radius,
      borderWidth: 2,
      padding: 16,
      flexDirection: "row",
      gap: 14,
      alignItems: "center",
      marginBottom: 12,
    },
    heroLeft: {},
    heroRight: {
      flex: 1,
      gap: 4,
    },
    winnerBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      alignSelf: "flex-start",
      borderRadius: 10,
      paddingHorizontal: 8,
      paddingVertical: 3,
    },
    winnerBadgeText: {
      fontSize: 10,
      fontFamily: "Inter_700Bold",
      color: "#fff",
      letterSpacing: 0.3,
    },
    heroName: {
      fontSize: 18,
      fontFamily: "Inter_700Bold",
      letterSpacing: -0.3,
    },
    heroParty: {
      fontSize: 12,
      fontFamily: "Inter_400Regular",
      lineHeight: 16,
    },
    heroScoreRow: {
      flexDirection: "row",
      alignItems: "baseline",
      gap: 6,
      marginTop: 2,
    },
    heroPercent: {
      fontSize: 28,
      fontFamily: "Inter_700Bold",
      letterSpacing: -1,
    },
    heroMatches: {
      fontSize: 12,
      fontFamily: "Inter_400Regular",
    },
    podiumCard: {
      borderRadius: colors.radius,
      borderWidth: 1,
      padding: 14,
      marginBottom: 14,
      gap: 2,
    },
    sectionLabel: {
      fontSize: 10,
      fontFamily: "Inter_600SemiBold",
      letterSpacing: 1,
      textTransform: "uppercase",
      marginBottom: 4,
    },
    sectionTitle: {
      fontSize: 10,
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
