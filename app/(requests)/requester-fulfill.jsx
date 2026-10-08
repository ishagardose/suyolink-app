import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Linking,
  Modal,
  Image,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import TaskMap from '../../components/maps/TaskMap';
import { useAuth } from '../../context/AuthContext';
import { useSuyos } from '../../context/SuyoContext';
import { supabase } from '../../lib/supabase';
import { distanceKm, formatDistance } from '../../lib/geo';

export default function RequesterFulfillScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { requests = [], refresh } = useSuyos();

  // Find active task from context or params
  const targetId = params.id || params.requestId;
  const activeSuyo = useMemo(() => {
    return (
      (requests || []).find((r) => r.id === targetId) ||
      (requests || []).find(
        (r) =>
          (r.requesterId === user?.id || r.userId === user?.id) &&
          ['assigned', 'in_progress', 'accepted', 'active'].includes(r.status)
      ) ||
      (requests || []).find((r) => ['in_progress', 'assigned', 'accepted'].includes(r.status))
    );
  }, [requests, targetId, user?.id]);

  // Dynamic task details with real-world fallbacks
  const task = useMemo(() => {
    return {
      id: activeSuyo?.id || targetId || 'SYL-102',
      title: activeSuyo?.title || params.title || 'Drop off documents - Unit 402',
      category: activeSuyo?.category || params.category || 'Documents',
      location:
        activeSuyo?.exactAddress ||
        activeSuyo?.location ||
        params.location ||
        'Unit 402, Makati CBD',
      distanceText: activeSuyo?.distanceText || params.distanceText || '0.8 km away',
      reward:
        activeSuyo?.reward ||
        (activeSuyo?.offerCentavos
          ? `₱${(activeSuyo.offerCentavos / 100).toFixed(0)}`
          : null) ||
        (activeSuyo?.price ? `₱${activeSuyo.price}` : null) ||
        params.reward ||
        '₱300',
      doerName:
        activeSuyo?.assignedDoer ||
        activeSuyo?.doer?.name ||
        activeSuyo?.doerName ||
        params.doerName ||
        'Alex M.',
      doerRating: (
        activeSuyo?.doer?.rating ||
        activeSuyo?.doerRating ||
        params.doerRating ||
        '4.9'
      )
        .replace(/[★*]/g, '')
        .trim(),
      doerSuyosCount:
        activeSuyo?.doer?.completedCount ||
        activeSuyo?.doerSuyosCount ||
        params.doerSuyosCount ||
        '231 suyos done',
      doerPhone:
        activeSuyo?.doer?.phone ||
        activeSuyo?.doerPhone ||
        params.doerPhone ||
        '0917 552 8910',
      details:
        activeSuyo?.details ||
        params.details ||
        'Delivery of notarized legal documents to Unit 402.',
      arrivalWindow:
        activeSuyo?.timeBadge ||
        activeSuyo?.deadline ||
        params.arrivalWindow ||
        '11:00 AM - 11:30 AM',
      latitude:
        activeSuyo?.exactLatitude ??
        activeSuyo?.latitude ??
        (params.latitude ? parseFloat(params.latitude) : 7.4528),
      longitude:
        activeSuyo?.exactLongitude ??
        activeSuyo?.longitude ??
        (params.longitude ? parseFloat(params.longitude) : 125.8035),
      status: activeSuyo?.status || 'in_progress',
    };
  }, [activeSuyo, targetId, params]);

  // 4 Progress Steps: Accepted (0) -> En Route (1) -> Working (2) -> Completed (3)
  const STEPS = [
    { key: 'Accepted', label: 'Accepted', icon: 'checkmark-circle' },
    { key: 'En Route', label: 'En Route', icon: 'bicycle' },
    { key: 'Working', label: 'Working', icon: 'bag-handle' },
    { key: 'Completed', label: 'Completed', icon: 'flag' },
  ];

  const getStepFromStatus = (st) => {
    if (st === 'completed') return 3;
    if (st === 'working') return 2;
    if (st === 'in_progress' || st === 'en_route') return 1;
    return 0; // 'assigned' or 'accepted'
  };

  const [currentStepIndex, setCurrentStepIndex] = useState(() =>
    getStepFromStatus(task.status)
  );

  const [liveDistanceText, setLiveDistanceText] = useState(task.distanceText);
  const [proofData, setProofData] = useState(null);
  const [isProofPreviewOpen, setIsProofPreviewOpen] = useState(false);

  // Live GPS Coordinates of Doer & Destination
  const dropoffLocation = useMemo(
    () => ({ latitude: task.latitude, longitude: task.longitude }),
    [task.latitude, task.longitude]
  );

  const [doerLocation, setDoerLocation] = useState(() => ({
    latitude: task.latitude - 0.0053,
    longitude: task.longitude + 0.0043,
  }));

  // Dynamic timestamps
  const [timelineTimes, setTimelineTimes] = useState(() => {
    const now = new Date();
    const t0 = new Date(now.getTime() - 40 * 60000).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
    const t1 = new Date(now.getTime() - 20 * 60000).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
    const t2 = new Date(now.getTime() - 5 * 60000).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
    const t3 = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return {
      accepted: `Today, ${t0}`,
      enRoute: `Today, ${t1}`,
      working: `Today, ${t2}`,
      completed: `Today, ${t3}`,
    };
  });

  // Supabase Real-Time duplex channel subscriber
  useEffect(() => {
    if (!supabase || !task.id) return;

    const channelName = `suyo_live_tracking_${task.id}`;
    const channel = supabase.channel(channelName);

    channel
      .on('broadcast', { event: 'step_change' }, (payload) => {
        if (payload?.payload?.stepIndex !== undefined) {
          const newIdx = payload.payload.stepIndex;
          setCurrentStepIndex(newIdx);
          const nowStr = `Today, ${new Date().toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}`;
          setTimelineTimes((prev) => ({
            ...prev,
            [newIdx === 1 ? 'enRoute' : newIdx === 2 ? 'working' : 'completed']: nowStr,
          }));
        }
      })
      .on('broadcast', { event: 'location_update' }, (payload) => {
        if (payload?.payload?.latitude && payload?.payload?.longitude) {
          const newCoords = {
            latitude: payload.payload.latitude,
            longitude: payload.payload.longitude,
          };
          setDoerLocation(newCoords);
          if (payload.payload.distanceText) {
            setLiveDistanceText(payload.payload.distanceText);
          } else {
            const d = distanceKm(newCoords, dropoffLocation);
            if (d !== null) setLiveDistanceText(formatDistance(d));
          }
        }
      })
      .on('broadcast', { event: 'proof_submitted' }, (payload) => {
        if (payload?.payload) {
          setProofData(payload.payload);
          setCurrentStepIndex(3); // Completed
        }
      })
      .subscribe();

    // Also listen to database row updates on suyo_requests
    const dbSub = supabase
      .channel(`suyo_db_${task.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'suyo_requests',
          filter: `id=eq.${task.id}`,
        },
        (payload) => {
          if (payload?.new?.status) {
            const st = payload.new.status;
            if (st === 'completed') setCurrentStepIndex(3);
            else if (st === 'in_progress') setCurrentStepIndex(1);
          }
          if (refresh) refresh();
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
      dbSub.unsubscribe();
    };
  }, [task.id, dropoffLocation, refresh]);

  // Map markers: Doer (Moving GPS) & Destination
  const mapMarkers = useMemo(
    () => [
      {
        id: 'doer-live',
        latitude: doerLocation.latitude,
        longitude: doerLocation.longitude,
        title: `Doer: ${task.doerName}`,
        isMe: false,
      },
      {
        id: 'dropoff-location',
        latitude: dropoffLocation.latitude,
        longitude: dropoffLocation.longitude,
        title: `Destination: ${task.location}`,
        isMe: true,
      },
    ],
    [doerLocation, dropoffLocation, task.doerName, task.location]
  );

  const handleCallDoer = () => {
    const cleanPhone = task.doerPhone.replace(/\s+/g, '');
    if (Platform.OS !== 'web') {
      Linking.openURL(`tel:${cleanPhone}`);
    } else {
      if (typeof window !== 'undefined' && window.alert) {
        window.alert(`Calling assigned doer ${task.doerName} at ${task.doerPhone}`);
      }
    }
  };

  return (
    <SafeAreaView style={styles.safeContainer} edges={['top', 'left', 'right']}>
      <StatusBar style="dark" />

      {/* TOP APP HEADER */}
      <View style={styles.navBar}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace('/dashboard');
            }
          }}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={22} color="#163523" />
        </TouchableOpacity>
        <Text style={styles.navBarTitle}>Suyo Request Fulfillment</Text>
        <TouchableOpacity
          style={styles.headerRightAction}
          onPress={handleCallDoer}
          activeOpacity={0.7}
        >
          <Ionicons name="call-outline" size={19} color="#1E4D2B" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: 40 + insets.bottom },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* 1. TITLE HEADER SECTION */}
        <View style={styles.titleHeaderSection}>
          <View style={styles.activeBadgeRow}>
            <View style={styles.activeTagBadge}>
              <View style={styles.pulsingActiveDot} />
              <Text style={styles.activeSuyoTaskSubtitle}>ACTIVE SUYO TASK</Text>
            </View>
            <View style={styles.rewardBadge}>
              <Text style={styles.rewardBadgeText}>{task.reward}</Text>
            </View>
          </View>
          <Text style={styles.taskHeadlineTitle}>{task.title}</Text>

          {/* Under Title: Arrives Between and Assigned Doer */}
          <View style={styles.headerArrivalRequesterBlock}>
            <Text style={styles.headerEstimatedArrivalTime}>
              Arrives Between {task.arrivalWindow}
            </Text>
            <Text style={styles.headerRequesterNameText}>
              Assigned Doer: {task.doerName}
            </Text>
          </View>

          <View style={styles.taskMetaRow}>
            <View style={styles.metaPill}>
              <Ionicons name="pricetag-outline" size={12} color="#1E4D2B" />
              <Text style={styles.metaPillText}>{task.category}</Text>
            </View>
            <View style={styles.metaPill}>
              <Ionicons name="location-outline" size={12} color="#1E4D2B" />
              <Text style={styles.metaPillText}>{task.location}</Text>
            </View>
            <View style={styles.metaPill}>
              <Ionicons name="navigate-outline" size={12} color="#1E4D2B" />
              <Text style={styles.metaPillText}>{liveDistanceText}</Text>
            </View>
          </View>
        </View>

        {/* 2. PROGRESS DIAGRAM (Accepted -> En Route -> Working -> Completed) */}
        <View style={styles.progressDiagramCard}>
          <View style={styles.diagramTrackContainer}>
            {STEPS.map((step, index) => {
              const isPast = index < currentStepIndex;
              const isCurrent = index === currentStepIndex;
              const isCompleted = index <= currentStepIndex;

              return (
                <React.Fragment key={step.key}>
                  {/* Step Item */}
                  <View style={styles.stepNodeBlock}>
                    <View
                      style={[
                        styles.stepCircle,
                        isCurrent && styles.stepCircleActive,
                        isPast && styles.stepCirclePast,
                        !isCompleted && styles.stepCirclePending,
                      ]}
                    >
                      {isPast ? (
                        <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                      ) : isCurrent ? (
                        <Ionicons name={step.icon} size={13} color="#FFFFFF" />
                      ) : (
                        <Text style={styles.stepNumberPendingText}>
                          {index + 1}
                        </Text>
                      )}
                    </View>
                    <Text
                      style={[
                        styles.stepNodeLabel,
                        isCurrent && styles.stepNodeLabelActive,
                        isPast && styles.stepNodeLabelPast,
                      ]}
                      numberOfLines={1}
                    >
                      {step.label}
                    </Text>
                  </View>

                  {/* Connecting Line between steps */}
                  {index < STEPS.length - 1 && (
                    <View
                      style={[
                        styles.stepConnectorLine,
                        index < currentStepIndex
                          ? styles.stepConnectorLineActive
                          : styles.stepConnectorLineInactive,
                      ]}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </View>
        </View>

        {/* 3. LIVE ROUTE MAP */}
        <View style={styles.mapSectionCard}>
          <View style={styles.mapHeaderRow}>
            <View style={styles.mapTitleBlock}>
              <View style={styles.liveIndicatorDot} />
              <Text style={styles.mapSectionTitle}>Live Doer GPS Route</Text>
            </View>
            <View style={styles.distanceBadgePill}>
              <Ionicons name="speedometer-outline" size={13} color="#1E4D2B" />
              <Text style={styles.distanceBadgeText}>{liveDistanceText}</Text>
            </View>
          </View>

          {/* Interactive Map with live doer pin */}
          <View style={styles.mapViewportWrapper}>
            <TaskMap
              center={dropoffLocation}
              markers={mapMarkers}
              pickup={doerLocation}
              dropoff={dropoffLocation}
              interactive={true}
              height={220}
              style={styles.mapCanvas}
            />
          </View>

          {/* Route Footnote */}
          <View style={styles.routeFooterRow}>
            <View style={styles.routePointItem}>
              <View
                style={[styles.routePointBadge, { backgroundColor: '#2563EB' }]}
              >
                <Ionicons name="navigate" size={11} color="#FFFFFF" />
              </View>
              <Text style={styles.routePointText} numberOfLines={1}>
                {task.doerName}'s Real GPS
              </Text>
            </View>
            <View style={styles.routePointItem}>
              <View
                style={[styles.routePointBadge, { backgroundColor: '#1E4D2B' }]}
              >
                <Ionicons name="flag" size={11} color="#FFFFFF" />
              </View>
              <Text style={styles.routePointText} numberOfLines={1}>
                {task.location}
              </Text>
            </View>
          </View>
        </View>

        {/* PROOF BADGE (If uploaded by Doer) */}
        {proofData?.proofImageUri && (
          <TouchableOpacity
            style={styles.proofUploadedBanner}
            activeOpacity={0.85}
            onPress={() => setIsProofPreviewOpen(true)}
          >
            <Ionicons name="shield-checkmark" size={18} color="#1E4D2B" />
            <Text style={styles.proofUploadedBannerText}>
              Delivery proof photo submitted by {task.doerName}. Tap to view.
            </Text>
            <Ionicons name="chevron-forward" size={16} color="#1E4D2B" />
          </TouchableOpacity>
        )}

        {/* 4. TRACK & TRACE TIMELINE */}
        <View style={styles.trackTraceSection}>
          <View style={styles.trackTraceHeader}>
            <Ionicons name="git-network-outline" size={18} color="#1E4D2B" />
            <Text style={styles.trackTraceTitle}>TRACK & TRACE</Text>
          </View>

          <View style={styles.timelineList}>
            {/* Step 4: Drop-off & Completed */}
            <View style={styles.timelineItem}>
              <View style={styles.timelineLeftColumn}>
                <View
                  style={[
                    styles.timelineDotCircle,
                    currentStepIndex >= 3
                      ? styles.timelineDotCircleCompleted
                      : styles.timelineDotCirclePending,
                  ]}
                >
                  {currentStepIndex >= 3 && (
                    <View style={styles.timelineInnerDotCompleted} />
                  )}
                </View>
                <View
                  style={[
                    styles.timelineVerticalLine,
                    currentStepIndex >= 3
                      ? styles.timelineVerticalLineActive
                      : styles.timelineVerticalLineInactive,
                  ]}
                />
              </View>

              <View style={styles.timelineContentBlock}>
                <Text
                  style={[
                    styles.timelineItemTitle,
                    currentStepIndex < 3 && styles.timelineItemTitleMuted,
                  ]}
                >
                  4. Drop off & Complete
                </Text>
                <Text style={styles.timelineItemRoute}>
                  RECIPIENT CONFIRMATION → RELEASE ESCROW
                </Text>
                <Text style={styles.timelineItemActor}>
                  Delivered at {task.location} Doorstep
                </Text>
                <Text style={styles.timelineItemQuote}>
                  "Package delivered. Waiting for your confirmation to complete."
                </Text>
                <Text style={styles.timelineItemTime}>
                  {timelineTimes.completed}
                </Text>
              </View>
            </View>

            {/* Step 3: Documents secured & verified */}
            <View style={styles.timelineItem}>
              <View style={styles.timelineLeftColumn}>
                <View
                  style={[
                    styles.timelineDotCircle,
                    currentStepIndex >= 2
                      ? styles.timelineDotCircleCompleted
                      : styles.timelineDotCirclePending,
                  ]}
                >
                  {currentStepIndex >= 2 && (
                    <View style={styles.timelineInnerDotCompleted} />
                  )}
                </View>
                <View
                  style={[
                    styles.timelineVerticalLine,
                    currentStepIndex >= 2
                      ? styles.timelineVerticalLineActive
                      : styles.timelineVerticalLineInactive,
                  ]}
                />
              </View>

              <View style={styles.timelineContentBlock}>
                <Text
                  style={[
                    styles.timelineItemTitle,
                    currentStepIndex < 2 && styles.timelineItemTitleMuted,
                  ]}
                >
                  3. Task items handled & in progress
                </Text>
                <Text style={styles.timelineItemRoute}>
                  {task.category.toUpperCase()} CHECKED → SECURE TRANSIT
                </Text>
                <Text style={styles.timelineItemActor}>
                  By {task.doerName} • Verified safe handling
                </Text>
                <Text style={styles.timelineItemQuote}>
                  "All task items secured and transported carefully."
                </Text>
                <Text style={styles.timelineItemTime}>
                  {timelineTimes.working}
                </Text>
              </View>
            </View>

            {/* Step 2: En Route */}
            <View style={styles.timelineItem}>
              <View style={styles.timelineLeftColumn}>
                <View
                  style={[
                    styles.timelineDotCircle,
                    currentStepIndex >= 1
                      ? styles.timelineDotCircleCompleted
                      : styles.timelineDotCirclePending,
                  ]}
                >
                  {currentStepIndex >= 1 && (
                    <View style={styles.timelineInnerDotCompleted} />
                  )}
                </View>
                <View
                  style={[
                    styles.timelineVerticalLine,
                    currentStepIndex >= 1
                      ? styles.timelineVerticalLineActive
                      : styles.timelineVerticalLineInactive,
                  ]}
                />
              </View>

              <View style={styles.timelineContentBlock}>
                <Text
                  style={[
                    styles.timelineItemTitle,
                    currentStepIndex < 1 && styles.timelineItemTitleMuted,
                  ]}
                >
                  2. Doer en route to location
                </Text>
                <Text style={styles.timelineItemRoute}>
                  IN TRANSIT → {task.location.toUpperCase()}
                </Text>
                <Text style={styles.timelineItemActor}>
                  Live GPS tracking active • Distance {liveDistanceText}
                </Text>
                <Text style={styles.timelineItemQuote}>
                  "Doer is moving towards the destination address."
                </Text>
                <Text style={styles.timelineItemTime}>
                  {timelineTimes.enRoute}
                </Text>
              </View>
            </View>

            {/* Step 1: Accepted */}
            <View style={styles.timelineItem}>
              <View style={styles.timelineLeftColumn}>
                <View
                  style={[
                    styles.timelineDotCircle,
                    styles.timelineDotCircleCompleted,
                  ]}
                >
                  <View style={styles.timelineInnerDotCompleted} />
                </View>
              </View>

              <View style={styles.timelineContentBlock}>
                <Text style={styles.timelineItemTitle}>
                  1. Suyo request accepted
                </Text>
                <Text style={styles.timelineItemRoute}>
                  DOER MATCHED → TASK INITIATED
                </Text>
                <Text style={styles.timelineItemActor}>
                  Assigned: {task.doerName} • SuyoLink Dispatch
                </Text>
                <Text style={styles.timelineItemQuote}>
                  "Doer accepted your {task.category.toLowerCase()} suyo.
                  Preparing route."
                </Text>
                <Text style={styles.timelineItemTime}>
                  {timelineTimes.accepted}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* 5. REQUESTER BUTTON: "Mark as Received & Rate the Doer" */}
        <TouchableOpacity
          style={styles.markReceivedButton}
          activeOpacity={0.88}
          onPress={() => {
            router.push({
              pathname: '/rate-doer',
              params: {
                id: task.id,
                title: task.title,
                reward: task.reward,
                category: task.category,
                location: task.location,
                doerName: task.doerName,
                doerRating: task.doerRating,
                doerSuyosCount: task.doerSuyosCount,
                doerPhone: task.doerPhone,
              },
            });
          }}
        >
          <Ionicons name="star" size={20} color="#FFFFFF" />
          <Text style={styles.markReceivedButtonText}>
            Mark as Received & Rate the Doer
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* PROOF PHOTO PREVIEW MODAL */}
      <Modal
        visible={isProofPreviewOpen}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setIsProofPreviewOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.previewModalCard}>
            <View style={styles.previewModalHeader}>
              <Text style={styles.previewModalTitle}>Handoff Delivery Proof</Text>
              <TouchableOpacity
                onPress={() => setIsProofPreviewOpen(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={20} color="#556E60" />
              </TouchableOpacity>
            </View>

            {proofData?.proofImageUri && (
              <Image
                source={{ uri: proofData.proofImageUri }}
                style={styles.proofModalImage}
                resizeMode="cover"
              />
            )}

            {proofData?.notes ? (
              <Text style={styles.proofNotesText}>"{proofData.notes}"</Text>
            ) : null}

            <TouchableOpacity
              style={styles.closePreviewBtn}
              onPress={() => setIsProofPreviewOpen(false)}
            >
              <Text style={styles.closePreviewBtnText}>Close Preview</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: '#F6F9F7',
  },

  /* TOP APP HEADER */
  navBar: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2ECE5',
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0F5F2',
  },
  navBarTitle: {
    fontSize: 16.5,
    fontWeight: '800',
    color: '#163523',
    letterSpacing: -0.2,
  },
  headerRightAction: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EBF5EF',
  },

  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 16,
  },

  /* 1. TITLE HEADER */
  titleHeaderSection: {
    marginBottom: 16,
  },
  activeBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  activeTagBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EBF5EF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 6,
  },
  pulsingActiveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#1E4D2B',
  },
  activeSuyoTaskSubtitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#1E4D2B',
    letterSpacing: 0.8,
  },
  rewardBadge: {
    backgroundColor: '#1E4D2B',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  rewardBadgeText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  taskHeadlineTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#163523',
    letterSpacing: -0.3,
    lineHeight: 28,
    marginBottom: 6,
  },
  headerArrivalRequesterBlock: {
    marginBottom: 12,
  },
  headerEstimatedArrivalTime: {
    fontSize: 16,
    fontWeight: '800',
    color: '#163523',
    letterSpacing: -0.2,
    marginBottom: 2,
  },
  headerRequesterNameText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#52695C',
  },
  taskMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  metaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D8E5DF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  metaPillText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#334B3D',
  },

  /* 2. PROGRESS DIAGRAM */
  progressDiagramCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E1ECE5',
    paddingVertical: 16,
    paddingHorizontal: 14,
    marginBottom: 16,
    ...(Platform.OS === 'web'
      ? { boxShadow: '0 2px 6px rgba(0,0,0,0.04)' }
      : {
          shadowColor: '#000000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.04,
          shadowRadius: 6,
          elevation: 2,
        }),
  },
  diagramTrackContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  stepNodeBlock: {
    alignItems: 'center',
    minWidth: 54,
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  stepCircleActive: {
    backgroundColor: '#1E4D2B',
    ...(Platform.OS === 'web'
      ? { boxShadow: '0 2px 4px rgba(30,77,43,0.28)' }
      : {
          shadowColor: '#1E4D2B',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.28,
          shadowRadius: 4,
          elevation: 3,
        }),
  },
  stepCirclePast: {
    backgroundColor: '#2F6A42',
  },
  stepCirclePending: {
    backgroundColor: '#EEF4F0',
    borderWidth: 1.5,
    borderColor: '#D4E2D9',
  },
  stepNumberPendingText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#718A7C',
  },
  stepNodeLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#718A7C',
    textAlign: 'center',
  },
  stepNodeLabelActive: {
    color: '#1E4D2B',
    fontWeight: '800',
  },
  stepNodeLabelPast: {
    color: '#2F6A42',
    fontWeight: '700',
  },
  stepConnectorLine: {
    flex: 1,
    height: 3,
    borderRadius: 2,
    marginHorizontal: 4,
    marginBottom: 18,
  },
  stepConnectorLineActive: {
    backgroundColor: '#2F6A42',
  },
  stepConnectorLineInactive: {
    backgroundColor: '#E2ECE5',
  },

  /* 3. LIVE ROUTE MAP */
  mapSectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E1ECE5',
    padding: 12,
    marginBottom: 18,
    ...(Platform.OS === 'web'
      ? { boxShadow: '0 2px 6px rgba(0,0,0,0.04)' }
      : {
          shadowColor: '#000000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.04,
          shadowRadius: 6,
          elevation: 2,
        }),
  },
  mapHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  mapTitleBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  liveIndicatorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#22C55E',
  },
  mapSectionTitle: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#163523',
    letterSpacing: -0.2,
  },
  distanceBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EBF5EF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  distanceBadgeText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#1E4D2B',
  },
  mapViewportWrapper: {
    height: 220,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#DCE8E0',
    backgroundColor: '#F3F7F4',
  },
  mapCanvas: {
    flex: 1,
  },
  routeFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingHorizontal: 4,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F0F5F2',
  },
  routePointItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  routePointBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  routePointText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#415B4D',
    flex: 1,
  },

  /* PROOF BANNER */
  proofUploadedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#EBF5EF',
    borderWidth: 1,
    borderColor: '#C5DEC9',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 16,
  },
  proofUploadedBannerText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E4D2B',
    flex: 1,
  },

  /* 4. TRACK & TRACE */
  trackTraceSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E1ECE5',
    padding: 16,
    marginBottom: 20,
    ...(Platform.OS === 'web'
      ? { boxShadow: '0 2px 6px rgba(0,0,0,0.04)' }
      : {
          shadowColor: '#000000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.04,
          shadowRadius: 6,
          elevation: 2,
        }),
  },
  trackTraceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#EEF4F0',
  },
  trackTraceTitle: {
    fontSize: 14.5,
    fontWeight: '900',
    color: '#163523',
    letterSpacing: 0.8,
  },
  timelineList: {
    paddingLeft: 4,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 2,
  },
  timelineLeftColumn: {
    alignItems: 'center',
    width: 28,
    marginRight: 10,
  },
  timelineDotCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    zIndex: 2,
  },
  timelineDotCircleCompleted: {
    borderColor: '#1E4D2B',
  },
  timelineDotCirclePending: {
    borderColor: '#C3D6CC',
    backgroundColor: '#F8FAF8',
  },
  timelineInnerDotCompleted: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#1E4D2B',
  },
  timelineVerticalLine: {
    width: 2,
    flex: 1,
    minHeight: 52,
    marginVertical: 2,
  },
  timelineVerticalLineActive: {
    backgroundColor: '#1E4D2B',
  },
  timelineVerticalLineInactive: {
    backgroundColor: '#DDE9E2',
  },
  timelineContentBlock: {
    flex: 1,
    paddingBottom: 18,
  },
  timelineItemTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#163523',
    marginBottom: 2,
  },
  timelineItemTitleMuted: {
    color: '#869F91',
  },
  timelineItemRoute: {
    fontSize: 10,
    fontWeight: '800',
    color: '#1E4D2B',
    letterSpacing: 0.4,
    marginBottom: 3,
  },
  timelineItemActor: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#52695C',
    marginBottom: 3,
  },
  timelineItemQuote: {
    fontSize: 12,
    fontStyle: 'italic',
    color: '#385344',
    lineHeight: 17,
    marginBottom: 4,
  },
  timelineItemTime: {
    fontSize: 11,
    fontWeight: '500',
    color: '#718A7C',
  },

  /* 5. BUTTON: MARK AS RECEIVED & RATE THE DOER */
  markReceivedButton: {
    backgroundColor: '#1E4D2B',
    borderRadius: 16,
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    ...(Platform.OS === 'web'
      ? { boxShadow: '0 4px 8px rgba(30,77,43,0.22)' }
      : {
          shadowColor: '#1E4D2B',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.22,
          shadowRadius: 8,
          elevation: 4,
        }),
    marginBottom: 24,
  },
  markReceivedButtonText: {
    fontSize: 15.5,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },

  /* PROOF PREVIEW MODAL */
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  previewModalCard: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    alignItems: 'center',
  },
  previewModalHeader: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  previewModalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#163523',
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F0F5F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  proofModalImage: {
    width: '100%',
    height: 220,
    borderRadius: 14,
    marginBottom: 12,
  },
  proofNotesText: {
    fontSize: 13,
    fontStyle: 'italic',
    color: '#415B4D',
    textAlign: 'center',
    marginBottom: 16,
  },
  closePreviewBtn: {
    backgroundColor: '#1E4D2B',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 14,
    width: '100%',
    alignItems: 'center',
  },
  closePreviewBtnText: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
