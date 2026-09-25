import React from "react";
import {
  StyleSheet,
  Text,
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

  return (
    <SafeAreaView edges={["top", "bottom"]} style={styles.container}>
      <StatusBar style="light" />

      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Live Map Tracking</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.mapArea}>
        <Image
          source={require("../assets/hunter_green_tracking.jpg")}
          style={styles.mapIllustration}
          resizeMode="contain"
        />
        <View style={styles.mapOverlayCard}>
          <View style={styles.liveIndicatorRow}>
            <View style={styles.pulsingDot} />
            <Text style={styles.liveText}>LIVE TRACKING</Text>
          </View>
          <Text style={styles.trackingLabel}>Doer is 5 mins away</Text>
          <Text style={styles.trackingSub}>Errand: Drop off documents at Unit 402</Text>
        </View>
      </View>

      <View style={styles.bottomPanel}>
        <View style={styles.doerInfoRow}>
          <View style={styles.doerAvatarCircle}>
            <Ionicons name="person" size={22} color="#FFFFFF" />
          </View>
          <View style={styles.doerMeta}>
            <Text style={styles.doerName}>Alex M.</Text>
            <Text style={styles.doerRating}>4.9 - 231 errands done</Text>
          </View>
          <TouchableOpacity style={styles.callButton} activeOpacity={0.7}>
            <Ionicons name="call" size={18} color="#FFFFFF" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.chatButton} activeOpacity={0.7}>
            <Ionicons name="chatbubble-ellipses" size={18} color="#163523" />
          </TouchableOpacity>
        </View>

        <View style={styles.progressRow}>
          <Text style={styles.progressLabel}>Route progress</Text>
          <Text style={styles.progressPercent}>78%</Text>
        </View>
        <View style={styles.progressTrack}>
          <View style={styles.progressFill} />
        </View>

        <TouchableOpacity style={styles.cancelButton} activeOpacity={0.8}>
          <Ionicons name="close-circle-outline" size={18} color="#D32F2F" />
          <Text style={styles.cancelText}>Cancel Suyo</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#163523" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: -0.2,
  },
  headerSpacer: { width: 42 },
  mapArea: {
    flex: 1,
    backgroundColor: "#EDF5EF",
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
    backgroundColor: "#1E4D2B",
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
  pulsingDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#4ADE80" },
  liveText: { fontSize: 10, fontWeight: "800", color: "#4ADE80", letterSpacing: 0.5 },
  trackingLabel: { fontSize: 16, fontWeight: "700", color: "#FFFFFF", marginBottom: 3 },
  trackingSub: { fontSize: 12.5, color: "#C6DFD1" },
  bottomPanel: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 10,
    shadowColor: "#000",
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
    backgroundColor: "#1E4D2B",
    alignItems: "center",
    justifyContent: "center",
  },
  doerMeta: { flex: 1 },
  doerName: { fontSize: 15, fontWeight: "800", color: "#163523", marginBottom: 2 },
  doerRating: { fontSize: 12, color: "#718C7D" },
  callButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#1E4D2B",
    alignItems: "center",
    justifyContent: "center",
  },
  chatButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#D7EBE0",
    alignItems: "center",
    justifyContent: "center",
  },
  progressRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  progressLabel: { fontSize: 12.5, color: "#718C7D", fontWeight: "600" },
  progressPercent: { fontSize: 12.5, color: "#1E4D2B", fontWeight: "800" },
  progressTrack: {
    height: 6,
    backgroundColor: "#E8F0EC",
    borderRadius: 3,
    overflow: "hidden",
    marginBottom: 18,
  },
  progressFill: { width: "78%", height: "100%", backgroundColor: "#4ADE80", borderRadius: 3 },
  cancelButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  cancelText: { fontSize: 13.5, fontWeight: "700", color: "#D32F2F" },
});
