import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Image,
  Dimensions,
  Linking,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useAuth } from "../context/AuthContext";
import { useSuyos } from "../context/SuyoContext";
import useTaskTracking from "../hooks/useTaskTracking";
import { distanceKm } from "../lib/geo";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

export default function MapScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const id = params.requestId || params.id;
  const { user } = useAuth();
  const { requests = [], mutate } = useSuyos();
  const [acting, setActing] = useState(false);

  const {
    task,
    position,
  } = useTaskTracking(id, user?.id);

  // If no specific task id passed, find the most relevant active task for current user
  const activeTask =
    task ||
    (requests || []).find((r) => r.id === id) ||
    (requests || []).find(
      (r) =>
        (r.providerId === user?.id || r.requesterId === user?.id) &&
        ["assigned", "in_progress"].includes(r.status)
    ) ||
    (id || params.title ? {
      id: id || "SYL-102",
      title: params.title || "Active Suyo",
      requesterName: params.requesterName || "Requester",
      providerName: params.providerName || "Assigned Doer",
      contactPhone: params.contactPhone || params.requesterPhone || "09178421983",
      rating: params.rating || "4.9",
      status: "in_progress",
    } : null);

  const own = activeTask?.providerId === user?.id;
  const doerName = own
    ? activeTask?.requesterName || params.requesterName || "Requester"
    : activeTask?.providerName || params.providerName || "Assigned Doer";
  const suyoTitle = activeTask?.title || params.title || "Active Suyo";

  const destination = activeTask && {
    latitude: activeTask.exactLatitude ?? activeTask.latitude,
    longitude: activeTask.exactLongitude ?? activeTask.longitude,
  };
  const hasDestination =
    destination?.latitude != null && destination?.longitude != null;
  const fresh =
    position && Date.now() - Date.parse(position.updated_at) < 30000;
  const remaining =
    fresh && hasDestination ? distanceKm(position, destination) : null;
  const eta =
    remaining != null && position.speed > 0.5
      ? Math.ceil((remaining * 1000) / position.speed / 60)
      : null;

  const trackingText = eta
    ? `Doer is ${eta} mins away`
    : remaining != null
    ? `Doer is ${remaining.toFixed(1)} km away`
    : "Doer is 5 mins away";

  const progressPercent =
    activeTask?.status === "in_progress"
      ? 78
      : activeTask?.status === "assigned"
      ? 45
      : 85;

  const handleCall = () => {
    const phone = activeTask?.contactPhone || activeTask?.requesterPhone || params.requesterPhone || "09178421983";
    Linking.openURL(`tel:${phone}`).catch(() => {
      Alert.alert("Contact", `Phone number: ${phone}`);
    });
  };

  const handleChat = () => {
    const phone = activeTask?.contactPhone || activeTask?.requesterPhone || params.requesterPhone || "09178421983";
    Linking.openURL(`sms:${phone}`).catch(() => {
      Alert.alert("Contact", `SMS: ${phone}`);
    });
  };

  const handleCancel = async () => {
    if (!activeTask?.id) {
      router.back();
      return;
    }
    setActing(true);
    try {
      if (mutate) {
        await mutate("cancel_suyo", { id: activeTask.id });
      }
      router.back();
    } catch (e) {
      Alert.alert("Cancel Suyo", e.message || "Could not cancel suyo.");
    } finally {
      setActing(false);
    }
  };

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

      {!activeTask ? (
        <View style={styles.emptyMapContainer}>
          <View style={styles.emptyMapCircle}>
            <Ionicons name="navigate-circle-outline" size={56} color="#1E4D2B" />
          </View>
          <Text style={styles.emptyMapTitle}>No Active Tracking</Text>
          <Text style={styles.emptyMapSub}>
            You don't have any assigned or in-progress suyo right now. When a suyo is underway, live courier tracking will appear here.
          </Text>
          <TouchableOpacity
            style={styles.browseButton}
            activeOpacity={0.85}
            onPress={() => router.push('/dashboard')}
          >
            <Ionicons name="compass-outline" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
            <Text style={styles.browseButtonText}>Browse Available Suyos</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
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
              <Text style={styles.trackingLabel}>{trackingText}</Text>
              <Text style={styles.trackingSub}>Suyo: {suyoTitle}</Text>
            </View>
          </View>

          <View style={styles.bottomPanel}>
            <View style={styles.doerInfoRow}>
              <View style={styles.doerAvatarCircle}>
                <Ionicons name="person" size={22} color="#FFFFFF" />
              </View>
              <View style={styles.doerMeta}>
                <Text style={styles.doerName}>{doerName}</Text>
                <Text style={styles.doerRating}>4.9 - Verified Partner</Text>
              </View>
              <TouchableOpacity
                style={styles.callButton}
                activeOpacity={0.7}
                onPress={handleCall}
                accessibilityRole="button"
                accessibilityLabel="Call"
              >
                <Ionicons name="call" size={18} color="#FFFFFF" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.chatButton}
                activeOpacity={0.7}
                onPress={handleChat}
                accessibilityRole="button"
                accessibilityLabel="Chat"
              >
                <Ionicons name="chatbubble-ellipses" size={18} color="#163523" />
              </TouchableOpacity>
            </View>

            <View style={styles.progressRow}>
              <Text style={styles.progressLabel}>Route progress</Text>
              <Text style={styles.progressPercent}>{progressPercent}%</Text>
            </View>
            <View style={styles.progressTrack}>
              <View
                style={[styles.progressFill, { width: `${progressPercent}%` }]}
              />
            </View>

            <TouchableOpacity
              style={styles.cancelButton}
              activeOpacity={0.8}
              onPress={handleCancel}
              disabled={acting}
              accessibilityRole="button"
              accessibilityLabel="Cancel Suyo"
            >
              <Ionicons name="close-circle-outline" size={18} color="#D32F2F" />
              <Text style={styles.cancelText}>
                {acting ? "Cancelling..." : "Cancel Suyo"}
              </Text>
            </TouchableOpacity>
          </View>
        </>
      )}
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
  emptyMapContainer: {
    flex: 1,
    backgroundColor: "#F4FAF6",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
  },
  emptyMapCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "#E0F0E7",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  emptyMapTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#163523",
    marginBottom: 10,
    textAlign: "center",
  },
  emptyMapSub: {
    fontSize: 14,
    color: "#557261",
    textAlign: "center",
    lineHeight: 21,
    marginBottom: 28,
    maxWidth: 300,
  },
  browseButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1E4D2B",
    paddingHorizontal: 22,
    paddingVertical: 14,
    borderRadius: 24,
    shadowColor: "#1E4D2B",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  browseButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
});
