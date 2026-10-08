import LiveTrackingCard from '../../suyo/LiveTrackingCard';
import useFulfillmentLocation from '../hooks/useFulfillmentLocation.js';
import RequesterTrackingTimeline from '../tracking/RequesterTrackingTimeline';
import { styles } from '../styles/requesterFulfill.styles.js';
import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Platform,
  Linking,
  Modal,
  Image,
} from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import TaskMap from '../../maps/TaskMap';
import { useAuth } from '../../../context/AuthContext';
import { useSuyos } from '../../../context/SuyoContext';
import { supabase } from '../../../lib/supabase';

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
          ['assigned', 'in_progress', 'accepted', 'active'].includes(r.status),
      ) ||
      (requests || []).find((r) =>
        ['in_progress', 'assigned', 'accepted'].includes(r.status),
      )
    );
  }, [requests, targetId, user?.id]);

  // Dynamic task details with real-world fallbacks
  const task = useMemo(() => {
    return {
      id: activeSuyo?.id || targetId || 'SYL-102',
      title:
        activeSuyo?.title || params.title || 'Drop off documents - Unit 402',
      category: activeSuyo?.category || params.category || 'Documents',
      location:
        activeSuyo?.exactAddress ||
        activeSuyo?.location ||
        params.location ||
        'Unit 402, Makati CBD',
      distanceText:
        activeSuyo?.distanceText || params.distanceText || '0.8 km away',
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
    getStepFromStatus(task.status),
  );

  const [proofData, setProofData] = useState(null);
  const [isProofPreviewOpen, setIsProofPreviewOpen] = useState(false);

  const {
    dropoffLocation,
    liveDistanceText,
    liveDoerLocation: doerLocation,
    request: trackingRequest,
  } = useFulfillmentLocation({ task, user });

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
    const t3 = now.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
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
            [newIdx === 1 ? 'enRoute' : newIdx === 2 ? 'working' : 'completed']:
              nowStr,
          }));
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
        },
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
      ...(doerLocation
        ? [
            {
              ...doerLocation,
              id: 'doer-live',
              kind: 'doer',
              title: 'Doer',
              isMe: true,
            },
          ]
        : []),
      ...(dropoffLocation
        ? [
            {
              ...dropoffLocation,
              id: 'destination',
              kind: 'destination',
              title: 'Destination',
            },
          ]
        : []),
    ],
    [doerLocation, dropoffLocation],
  );

  const handleCallDoer = () => {
    const cleanPhone = task.doerPhone.replace(/\s+/g, '');
    if (Platform.OS !== 'web') {
      Linking.openURL(`tel:${cleanPhone}`);
    } else {
      if (typeof window !== 'undefined' && window.alert) {
        window.alert(
          `Calling assigned doer ${task.doerName} at ${task.doerPhone}`,
        );
      }
    }
  };

  return (
    <SafeAreaView
      style={styles.safeContainer}
      edges={['top', 'left', 'right']}
    >
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
          <Ionicons
            name="arrow-back"
            size={22}
            color="#163523"
          />
        </TouchableOpacity>
        <Text style={styles.navBarTitle}>Suyo Request Fulfillment</Text>
        <TouchableOpacity
          style={styles.headerRightAction}
          onPress={handleCallDoer}
          activeOpacity={0.7}
        >
          <Ionicons
            name="call-outline"
            size={19}
            color="#1E4D2B"
          />
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
              <Text style={styles.activeSuyoTaskSubtitle}>
                ACTIVE SUYO TASK
              </Text>
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
              <Ionicons
                name="pricetag-outline"
                size={12}
                color="#1E4D2B"
              />
              <Text style={styles.metaPillText}>{task.category}</Text>
            </View>
            <View style={styles.metaPill}>
              <Ionicons
                name="location-outline"
                size={12}
                color="#1E4D2B"
              />
              <Text style={styles.metaPillText}>{task.location}</Text>
            </View>
            <View style={styles.metaPill}>
              <Ionicons
                name="navigate-outline"
                size={12}
                color="#1E4D2B"
              />
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
                        <Ionicons
                          name="checkmark"
                          size={14}
                          color="#FFFFFF"
                        />
                      ) : isCurrent ? (
                        <Ionicons
                          name={step.icon}
                          size={13}
                          color="#FFFFFF"
                        />
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
              <Ionicons
                name="speedometer-outline"
                size={13}
                color="#1E4D2B"
              />
              <Text style={styles.distanceBadgeText}>{liveDistanceText}</Text>
            </View>
          </View>

          {/* Interactive Map with live doer pin */}
          <View style={styles.mapViewportWrapper}>
            {trackingRequest ? (
              <LiveTrackingCard
                request={trackingRequest}
                userId={user?.id}
              />
            ) : null}
            <TaskMap
              center={dropoffLocation}
              fitMarkers
              connection={
                doerLocation && dropoffLocation
                  ? [doerLocation, dropoffLocation]
                  : []
              }
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
                <Ionicons
                  name="navigate"
                  size={11}
                  color="#FFFFFF"
                />
              </View>
              <Text
                style={styles.routePointText}
                numberOfLines={1}
              >
                {task.doerName}'s Real GPS
              </Text>
            </View>
            <View style={styles.routePointItem}>
              <View
                style={[styles.routePointBadge, { backgroundColor: '#1E4D2B' }]}
              >
                <Ionicons
                  name="flag"
                  size={11}
                  color="#FFFFFF"
                />
              </View>
              <Text
                style={styles.routePointText}
                numberOfLines={1}
              >
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
            <Ionicons
              name="shield-checkmark"
              size={18}
              color="#1E4D2B"
            />
            <Text style={styles.proofUploadedBannerText}>
              Delivery proof photo submitted by {task.doerName}. Tap to view.
            </Text>
            <Ionicons
              name="chevron-forward"
              size={16}
              color="#1E4D2B"
            />
          </TouchableOpacity>
        )}

        {/* 4. TRACK & TRACE TIMELINE */}
        <RequesterTrackingTimeline
          currentStepIndex={currentStepIndex}
          liveDistanceText={liveDistanceText}
          task={task}
          timelineTimes={timelineTimes}
        />

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
          <Ionicons
            name="star"
            size={20}
            color="#FFFFFF"
          />
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
              <Text style={styles.previewModalTitle}>
                Handoff Delivery Proof
              </Text>
              <TouchableOpacity
                onPress={() => setIsProofPreviewOpen(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons
                  name="close"
                  size={20}
                  color="#556E60"
                />
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
