import ScreenHeader from '../components/ScreenHeader';
import ThemedText from '../components/themed/ThemedText';
import { useTheme } from '../theme/ThemeContext';
import React from "react";
import {
  StyleSheet,
  View,
  TouchableOpacity,
  Image,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

export default function MapScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = createStyles(colors);

  return (
    <SafeAreaView edges={["top", "bottom"]} style={styles.container}>
      <StatusBar style="light" />

      <ScreenHeader brand title="Live Map Tracking" onBack={() => router.back()} />

      <View style={styles.mapArea}>
        <Image
          source={require("../assets/hunter_green_tracking.jpg")}
          style={styles.mapIllustration}
          resizeMode="contain"
        />
        <View style={styles.mapOverlayCard}>
          <View style={styles.liveIndicatorRow}>
            <View style={styles.pulsingDot} />
            <ThemedText style={styles.liveText}>LIVE TRACKING</ThemedText>
          </View>
          <ThemedText style={styles.trackingLabel}>Doer is 5 mins away</ThemedText>
          <ThemedText style={styles.trackingSub}>Errand: Drop off documents at Unit 402</ThemedText>
        </View>
      </View>

      <View style={styles.bottomPanel}>
        <View style={styles.doerInfoRow}>
          <View style={styles.doerAvatarCircle}>
            <Ionicons name="person" size={22} color={colors.onPrimary} />
          </View>
          <View style={styles.doerMeta}>
            <ThemedText style={styles.doerName}>Alex M.</ThemedText>
            <ThemedText style={styles.doerRating}>4.9 - 231 errands done</ThemedText>
          </View>
          <TouchableOpacity style={styles.callButton} activeOpacity={0.7}>
            <Ionicons name="call" size={18} color={colors.onPrimary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.chatButton} activeOpacity={0.7}>
            <Ionicons name="chatbubble-ellipses" size={18} color={colors.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.progressRow}>
          <ThemedText style={styles.progressLabel}>Route progress</ThemedText>
          <ThemedText style={styles.progressPercent}>78%</ThemedText>
        </View>
        <View style={styles.progressTrack}>
          <View style={styles.progressFill} />
        </View>

        <TouchableOpacity style={styles.cancelButton} activeOpacity={0.8}>
          <Ionicons name="close-circle-outline" size={18} color={colors.danger} />
          <ThemedText style={styles.cancelText}>Cancel Suyo</ThemedText>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const createStyles = (colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.brand },
  mapArea: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
  mapIllustration: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.42,
  },
  mapOverlayCard: {
    position: "absolute",
    bottom: 16,
    left: 16,
    right: 16,
    backgroundColor: colors.primary,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
  liveIndicatorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  pulsingDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.accent },
  liveText: { fontSize: 10, fontWeight: "800", color: colors.accent, letterSpacing: 0.5 },
  trackingLabel: { fontSize: 16, fontWeight: "700", color: colors.onPrimary, marginBottom: 3 },
  trackingSub: { fontSize: 12.5, color: colors.onBrand },
  bottomPanel: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 10,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 8,
  },
  doerInfoRow: { flexDirection: "row", alignItems: "center", marginBottom: 18, gap: 12 },
  doerAvatarCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  doerMeta: { flex: 1 },
  doerName: { fontSize: 15, fontWeight: "800", color: colors.text, marginBottom: 2 },
  doerRating: { fontSize: 12, color: colors.muted },
  callButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  chatButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceAlt,
    alignItems: "center",
    justifyContent: "center",
  },
  progressRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  progressLabel: { fontSize: 12.5, color: colors.muted, fontWeight: "600" },
  progressPercent: { fontSize: 12.5, color: colors.link, fontWeight: "800" },
  progressTrack: {
    height: 6,
    backgroundColor: colors.surfaceAlt,
    borderRadius: 3,
    overflow: "hidden",
    marginBottom: 18,
  },
  progressFill: { width: "78%", height: "100%", backgroundColor: colors.accent, borderRadius: 3 },
  cancelButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: colors.dangerSurface,
    borderWidth: 1,
    borderColor: colors.dangerBorder,
  },
  cancelText: { fontSize: 13.5, fontWeight: "700", color: colors.danger },
});
