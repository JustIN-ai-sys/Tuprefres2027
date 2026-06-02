import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import * as Sharing from "expo-sharing";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  FlatList,
  Image,
  Linking,
  Platform,
  Pressable,
  Share,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { captureRef } from "react-native-view-shot";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import candidatePhotos from "@/constants/candidatePhotos";
import { CandidateResult, useQuiz } from "@/contexts/QuizContext";
import { useColors } from "@/hooks/useColors";

const APP_URL = process.env.EXPO_PUBLIC_DOMAIN
  ? `https://${process.env.EXPO_PUBLIC_DOMAIN}`
  : "https://tu-preferes-2027.replit.app";

const MEDALS = ["🥇", "🥈", "🥉"];

function buildShareText(top3: CandidateResult[], questionCount: number): string {
  const lines = [
    "J'ai fait le test Tu préfères 2027 🇫🇷",
    "",
    `Mon candidat le plus proche est : ${top3[0]?.name ?? ""}`,
    "",
    "Top 3 :",
    ...top3.map((c, i) => `${MEDALS[i]} ${c.name}`),
    "",
    `Test réalisé sur ${questionCount} questions.`,
    "",
    "Fais le test ici :",
    APP_URL,
  ];
  return lines.join("\n");
}

export default function ResultsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { results, questions, resetQuiz } = useQuiz();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const heroScale = useRef(new Animated.Value(0.85)).current;
  const cardRef = useRef<View>(null);

  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!results) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Animated.parallel([
      Animated.spring(heroScale, { toValue: 1, tension: 60, friction: 8, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
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
  const questionCount = questions.length || top1.maxScore;
  const shareText = buildShareText(top3, questionCount);

  /* ── Share handlers ─────────────────────────────────── */
  const handleNativeShare = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await Share.share({ message: shareText });
    } catch {
      await handleCopy();
    }
  };

  const handleCopy = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await Clipboard.setStringAsync(shareText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const openSocial = (platform: "whatsapp" | "x" | "linkedin" | "facebook") => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const encodedText = encodeURIComponent(shareText);
    const encodedUrl = encodeURIComponent(APP_URL);
    let url = "";
    switch (platform) {
      case "whatsapp":
        url = `https://wa.me/?text=${encodedText}`;
        break;
      case "x":
        url = `https://twitter.com/intent/tweet?text=${encodedText}`;
        break;
      case "linkedin":
        url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
        break;
      case "facebook":
        url = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedText}`;
        break;
    }
    Linking.openURL(url).catch(() => {
      handleCopy();
    });
  };

  const handleDownload = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      if (Platform.OS === "web") {
        const { toPng } = await import("html-to-image");
        const node = cardRef.current as unknown as HTMLElement;
        const dataUrl = await toPng(node, { pixelRatio: 2 });
        const link = document.createElement("a");
        link.href = dataUrl;
        link.download = "tu-preferes-2027.png";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        const uri = await captureRef(cardRef, { format: "png", quality: 1, result: "tmpfile" });
        const available = await Sharing.isAvailableAsync();
        if (available) {
          await Sharing.shareAsync(uri, { mimeType: "image/png", dialogTitle: "Télécharger mon résultat" });
        }
      }
    } catch (e) {
      console.warn("Capture failed", e);
    }
  };

  /* ── Footer (share section) ─────────────────────────── */
  const ListFooter = (
    <View style={{ paddingBottom: botPad + 90, gap: 14 }}>
      {/* Share block */}
      <View style={[styles.shareBlock, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.shareTitle, { color: colors.foreground }]}>Partager mon résultat</Text>
        <Text style={[styles.shareDesc, { color: colors.mutedForeground }]}>
          Montre à tes amis quel candidat est le plus proche de tes réponses.
        </Text>

        {/* Main share button */}
        <Pressable onPress={handleNativeShare} testID="share-main">
          <LinearGradient
            colors={[colors.gradientStart, colors.gradientEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.shareMainBtn}
          >
            <Ionicons name="share-social" size={18} color="#fff" />
            <Text style={styles.shareMainText}>Partager mon résultat</Text>
          </LinearGradient>
        </Pressable>

        {/* Fallback social buttons */}
        <View style={styles.socialGrid}>
          <SocialBtn
            label={copied ? "Copié !" : "Copier"}
            icon={copied ? "checkmark" : "copy-outline"}
            bg="rgba(255,255,255,0.12)"
            onPress={handleCopy}
            colors={colors}
            testID="share-copy"
          />
          <SocialBtn
            label="WhatsApp"
            icon="logo-whatsapp"
            bg="#25D366"
            onPress={() => openSocial("whatsapp")}
            colors={colors}
            testID="share-whatsapp"
          />
          <SocialBtn
            label="X"
            icon="logo-twitter"
            bg="#000000"
            onPress={() => openSocial("x")}
            colors={colors}
            testID="share-x"
          />
          <SocialBtn
            label="LinkedIn"
            icon="logo-linkedin"
            bg="#0A66C2"
            onPress={() => openSocial("linkedin")}
            colors={colors}
            testID="share-linkedin"
          />
          <SocialBtn
            label="Facebook"
            icon="logo-facebook"
            bg="#1877F2"
            onPress={() => openSocial("facebook")}
            colors={colors}
            testID="share-facebook"
          />
        </View>
      </View>

      {/* Shareable visual card (captured for PNG) */}
      <View collapsable={false} ref={cardRef} style={styles.shareCardWrap}>
        <LinearGradient
          colors={["#1e1b4b", "#07081f"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.shareCard}
        >
          <View style={styles.shareCardHeader}>
            <LinearGradient
              colors={[colors.gradientStart, colors.gradientEnd]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.shareCardBadge}
            >
              <Text style={styles.shareCardBadgeText}>Présidentielle 2027</Text>
            </LinearGradient>
            <Text style={styles.shareCardBrand}>Tu préfères 2027</Text>
          </View>

          <View style={styles.shareCardWinner}>
            <CandidateAvatar id={top1.id} color={top1.color} size={64} />
            <View style={{ flex: 1 }}>
              <Text style={styles.shareCardWinnerLabel}>Mon candidat le plus proche</Text>
              <Text style={styles.shareCardWinnerName} numberOfLines={2}>{top1.name}</Text>
              <Text style={styles.shareCardWinnerScore}>{top1.percentage}% de compatibilité</Text>
            </View>
          </View>

          <View style={styles.shareCardTop3}>
            {top3.map((c, i) => (
              <View key={c.id} style={styles.shareCardTop3Row}>
                <Text style={styles.shareCardMedal}>{MEDALS[i]}</Text>
                <Text style={styles.shareCardTop3Name} numberOfLines={1}>{c.name}</Text>
                <Text style={styles.shareCardTop3Pct}>{c.percentage}%</Text>
              </View>
            ))}
          </View>

          <View style={styles.shareCardFooter}>
            <Text style={styles.shareCardFooterText}>{questionCount} questions répondues</Text>
            <Text style={styles.shareCardUrl}>{APP_URL.replace(/^https?:\/\//, "")}</Text>
          </View>
        </LinearGradient>
      </View>

      {/* Download button */}
      <Pressable
        style={({ pressed }) => [
          styles.downloadBtn,
          { borderColor: colors.border, backgroundColor: colors.card, opacity: pressed ? 0.85 : 1 },
        ]}
        onPress={handleDownload}
        testID="download-btn"
      >
        <Ionicons name="download-outline" size={18} color={colors.foreground} />
        <Text style={[styles.downloadText, { color: colors.foreground }]}>Télécharger mon résultat</Text>
      </Pressable>
    </View>
  );

  /* ── Header (hero + top3) ───────────────────────────── */
  const ListHeader = (
    <View>
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

      {/* Full ranking title */}
      <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>
        Classement complet
      </Text>
    </View>
  );

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
        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={ListHeader}
          ListFooterComponent={ListFooter}
          renderItem={({ item, index }) => (
            <View style={[styles.rankWrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <RankingRow
                candidate={item}
                rank={index + 1}
                colors={colors}
                maxPercentage={results[0]?.percentage ?? 100}
                isFirst={index === 0}
              />
            </View>
          )}
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

/* ── SocialBtn ───────────────────────────────────────── */
function SocialBtn({
  label,
  icon,
  bg,
  onPress,
  colors,
  testID,
}: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  bg: string;
  onPress: () => void;
  colors: ReturnType<typeof useColors>;
  testID?: string;
}) {
  return (
    <Pressable
      style={({ pressed }) => [socialStyles.btn, { opacity: pressed ? 0.8 : 1 }]}
      onPress={onPress}
      testID={testID}
    >
      <View style={[socialStyles.iconCircle, { backgroundColor: bg }]}>
        <Ionicons name={icon} size={18} color="#fff" />
      </View>
      <Text style={[socialStyles.label, { color: colors.mutedForeground }]} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

const socialStyles = StyleSheet.create({
  btn: {
    alignItems: "center",
    gap: 6,
    width: 60,
  },
  iconCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
  },
});

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
  isFirst,
}: {
  candidate: CandidateResult;
  rank: number;
  colors: ReturnType<typeof useColors>;
  maxPercentage: number;
  isFirst: boolean;
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
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 14,
        paddingVertical: 8,
        gap: 10,
        borderTopWidth: isFirst ? 0 : 1,
        borderTopColor: colors.border,
      }}
    >
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
    rankWrap: {
      borderLeftWidth: 1,
      borderRightWidth: 1,
      borderColor: colors.border,
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
    /* Share section */
    shareBlock: {
      borderRadius: colors.radius,
      borderWidth: 1,
      padding: 18,
      gap: 12,
      marginTop: 16,
    },
    shareTitle: {
      fontSize: 18,
      fontFamily: "Inter_700Bold",
      letterSpacing: -0.3,
    },
    shareDesc: {
      fontSize: 13,
      fontFamily: "Inter_400Regular",
      lineHeight: 18,
    },
    shareMainBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      borderRadius: 16,
      paddingVertical: 15,
      marginTop: 2,
    },
    shareMainText: {
      fontSize: 15,
      fontFamily: "Inter_700Bold",
      color: "#fff",
    },
    socialGrid: {
      flexDirection: "row",
      justifyContent: "space-between",
      flexWrap: "wrap",
      gap: 10,
      marginTop: 4,
    },
    /* Shareable card */
    shareCardWrap: {
      borderRadius: 24,
      overflow: "hidden",
    },
    shareCard: {
      padding: 22,
      gap: 18,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: "rgba(139,92,246,0.4)",
    },
    shareCardHeader: {
      gap: 10,
    },
    shareCardBadge: {
      alignSelf: "flex-start",
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 999,
    },
    shareCardBadgeText: {
      fontSize: 11,
      fontFamily: "Inter_700Bold",
      color: "#fff",
      letterSpacing: 0.3,
    },
    shareCardBrand: {
      fontSize: 26,
      fontFamily: "Inter_700Bold",
      color: "#fff",
      letterSpacing: -0.5,
    },
    shareCardWinner: {
      flexDirection: "row",
      alignItems: "center",
      gap: 14,
      backgroundColor: "rgba(255,255,255,0.06)",
      borderRadius: 18,
      padding: 14,
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.1)",
    },
    shareCardWinnerLabel: {
      fontSize: 11,
      fontFamily: "Inter_500Medium",
      color: "#cbd5e1",
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    shareCardWinnerName: {
      fontSize: 18,
      fontFamily: "Inter_700Bold",
      color: "#fff",
      marginVertical: 2,
    },
    shareCardWinnerScore: {
      fontSize: 13,
      fontFamily: "Inter_600SemiBold",
      color: "#a5b4fc",
    },
    shareCardTop3: {
      gap: 8,
    },
    shareCardTop3Row: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    shareCardMedal: {
      fontSize: 18,
      width: 24,
      textAlign: "center",
    },
    shareCardTop3Name: {
      flex: 1,
      fontSize: 14,
      fontFamily: "Inter_600SemiBold",
      color: "#f8fafc",
    },
    shareCardTop3Pct: {
      fontSize: 14,
      fontFamily: "Inter_700Bold",
      color: "#67e8f9",
    },
    shareCardFooter: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      borderTopWidth: 1,
      borderTopColor: "rgba(255,255,255,0.1)",
      paddingTop: 14,
    },
    shareCardFooterText: {
      fontSize: 12,
      fontFamily: "Inter_500Medium",
      color: "#cbd5e1",
    },
    shareCardUrl: {
      fontSize: 12,
      fontFamily: "Inter_700Bold",
      color: "#8b5cf6",
    },
    downloadBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      borderRadius: 16,
      borderWidth: 1,
      paddingVertical: 15,
    },
    downloadText: {
      fontSize: 15,
      fontFamily: "Inter_700Bold",
    },
  });
}
