import LiveTrackingCard from '../../suyo/LiveTrackingCard';
import useFulfillmentLocation from '../hooks/useFulfillmentLocation.js';
import DoerTrackingTimeline from '../tracking/DoerTrackingTimeline';
import TaskProofModal from '../proof/TaskProofModal';
import { styles } from '../styles/fulfill.styles.js';
import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  Platform,
  Linking,
  Alert,
} from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import TaskMap from '../../maps/TaskMap';
import * as ImagePicker from 'expo-image-picker';

import { useAuth } from '../../../context/AuthContext';
import { useSuyos } from '../../../context/SuyoContext';
import { supabase } from '../../../lib/supabase';

export default function FulfillTaskScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const {
    requests = [],
    refresh,
    mutate,
    recordTransaction,
    reloadTransactions,
  } = useSuyos();

  // Find active task from context or route params
  const targetId = params.id || params.requestId;
  const activeSuyo = (requests || []).find((r) => r.id === targetId);

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
      requesterName:
        activeSuyo?.requesterName ||
        activeSuyo?.creatorName ||
        params.requesterName ||
        'Atty. Rafael Cruz',
      requesterLocation:
        activeSuyo?.location || params.requesterLocation || 'Makati CBD',
      requesterPhone:
        activeSuyo?.contactPhone ||
        activeSuyo?.requesterPhone ||
        params.requesterPhone ||
        params.contactPhone ||
        '0917 842 1983',
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

  // Derive initial step from task status
  const getStepFromStatus = (st) => {
    if (st === 'completed') return 3;
    if (st === 'working') return 2;
    if (st === 'in_progress' || st === 'en_route') return 1;
    return 0; // 'assigned' or 'accepted'
  };

  const [currentStepIndex, setCurrentStepIndex] = useState(() =>
    getStepFromStatus(task.status),
  );

  const [proofImageUri, setProofImageUri] = useState(null);
  const [proofNotes, setProofNotes] = useState('');
  const [isProofModalOpen, setIsProofModalOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);

  // Real GPS live location

  // Dynamic timestamps for real-world testing
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

  const channelRef = useRef(null);

  // Setup Supabase Realtime duplex channel for live synchronization
  useEffect(() => {
    if (!supabase || !task.id) return;

    const channelName = `suyo_live_tracking_${task.id}`;
    const channel = supabase.channel(channelName);
    channelRef.current = channel;

    channel
      .on('broadcast', { event: 'step_change' }, (payload) => {
        if (payload?.payload?.stepIndex !== undefined) {
          setCurrentStepIndex(payload.payload.stepIndex);
        }
      })

      .subscribe();

    return () => {
      channel.unsubscribe();
      channelRef.current = null;
    };
  }, [task.id]);

  // Real-time GPS Geolocation Watcher

  const {
    dropoffLocation,
    liveDistanceText,
    liveDoerLocation,
    request: trackingRequest,
  } = useFulfillmentLocation({ task, user });

  // Broadcast and persist step transition
  const handleUpdateStep = async (newIndex) => {
    setCurrentStepIndex(newIndex);
    const nowTimeStr = `Today, ${new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    })}`;

    setTimelineTimes((prev) => ({
      ...prev,
      [newIndex === 1 ? 'enRoute' : newIndex === 2 ? 'working' : 'completed']:
        nowTimeStr,
    }));

    const statusMap = {
      0: 'assigned',
      1: 'in_progress',
      2: 'in_progress',
      3: 'completed',
    };
    const dbStatus = statusMap[newIndex] || 'in_progress';

    // Broadcast across realtime channel
    if (channelRef.current) {
      try {
        channelRef.current.send({
          type: 'broadcast',
          event: 'step_change',
          payload: {
            stepIndex: newIndex,
            status: dbStatus,
            taskId: task.id,
            updatedAt: new Date().toISOString(),
          },
        });
      } catch (e) {
        console.warn('Realtime step broadcast error:', e);
      }
    }

    // Update in Supabase
    if (supabase && task.id) {
      const nowIso = new Date().toISOString();
      try {
        await supabase.rpc('change_suyo_status', {
          p_request_id: task.id,
          p_status: dbStatus,
        });
      } catch {
        try {
          await supabase
            .from('suyo_requests')
            .update({
              status: dbStatus,
              ...(dbStatus === 'completed' ? { completed_at: nowIso } : {}),
            })
            .eq('id', task.id);
        } catch (_) {}
      }
    }

    if (refresh) refresh();
  };

  // Markers for TaskMap
  const mapMarkers = useMemo(
    () => [
      ...(liveDoerLocation
        ? [
            {
              ...liveDoerLocation,
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
    [liveDoerLocation, dropoffLocation],
  );

  const handlePickProof = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setProofImageUri(result.assets[0].uri);
      }
    } catch {
      setProofImageUri(
        'https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&q=80',
      );
    }
  };

  const handleTakePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status === 'granted') {
        const result = await ImagePicker.launchCameraAsync({
          allowsEditing: true,
          quality: 0.8,
        });
        if (!result.canceled && result.assets && result.assets.length > 0) {
          setProofImageUri(result.assets[0].uri);
        }
      } else {
        handlePickProof();
      }
    } catch {
      handlePickProof();
    }
  };

  const handleCompleteTask = async () => {
    await handleUpdateStep(3); // Mark completed

    const rewardNum =
      Number(String(task.reward).replace(/[^0-9.]/g, '')) || 100;
    const rewardCentavos = Math.round(rewardNum * 100);

    if (recordTransaction && task.id) {
      recordTransaction({
        requestId: task.id,
        title: task.title,
        role: 'provider',
        otherUserName: task.contactName || task.requesterName || 'Requester',
        rewardCentavos,
        category: task.category || 'Delivery',
        location: task.location || 'Nearby',
        completedAt: new Date().toISOString(),
      });
    }

    if (reloadTransactions) reloadTransactions();

    if (channelRef.current) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'proof_submitted',
        payload: {
          taskId: task.id,
          proofImageUri,
          notes: proofNotes,
          timestamp: new Date().toISOString(),
        },
      });
    }

    setIsProofModalOpen(false);
    setIsSuccessModalOpen(true);
  };

  const handleCancelTask = () => {
    const doCancel = async () => {
      try {
        if (channelRef.current) {
          channelRef.current.send({
            type: 'broadcast',
            event: 'step_change',
            payload: {
              stepIndex: 0,
              status: 'cancelled',
              taskId: task.id,
            },
          });
        }
        if (supabase && task.id) {
          await supabase.rpc('change_suyo_status', {
            p_request_id: task.id,
            p_status: 'cancelled',
          });
        }
        if (refresh) refresh();
      } catch (e) {
        console.warn('Cancel suyo err:', e);
      }
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/dashboard');
      }
    };

    if (Platform.OS === 'web') {
      const confirmed =
        typeof window !== 'undefined' && window.confirm
          ? window.confirm(
              'Are you sure you want to cancel fulfilling this suyo?',
            )
          : true;
      if (confirmed) {
        doCancel();
      }
      return;
    }
    Alert.alert(
      'Cancel Suyo Task',
      'Are you sure you want to cancel fulfilling this suyo?',
      [
        { text: 'Keep Suyo', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: doCancel,
        },
      ],
    );
  };

  const handleCallRequester = () => {
    const cleanPhone = task.requesterPhone.replace(/\s+/g, '');
    if (Platform.OS !== 'web') {
      Linking.openURL(`tel:${cleanPhone}`);
    } else {
      if (typeof window !== 'undefined' && window.alert) {
        window.alert(
          `Calling requester ${task.requesterName} at ${task.requesterPhone}`,
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
        <Text style={styles.navBarTitle}>Task Fulfillment</Text>
        <TouchableOpacity
          style={styles.headerRightAction}
          onPress={handleCallRequester}
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

          {/* Under Title: Target Time / Arrival window and Requester name */}
          <View style={styles.headerArrivalRequesterBlock}>
            <Text style={styles.headerEstimatedArrivalTime}>
              {task.arrivalWindow?.includes(' - ')
                ? `Arrives Between ${task.arrivalWindow}`
                : `Target Time: ${task.arrivalWindow}`}
            </Text>
            <Text style={styles.headerRequesterNameText}>
              Requester: {task.requesterName}
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
                  <TouchableOpacity
                    style={styles.stepNodeBlock}
                    activeOpacity={0.8}
                    onPress={() => handleUpdateStep(index)}
                  >
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
                  </TouchableOpacity>

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
              <Text style={styles.mapSectionTitle}>LIVE ROUTE MAP</Text>
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

          {/* Interactive Map */}
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
                liveDoerLocation && dropoffLocation
                  ? [liveDoerLocation, dropoffLocation]
                  : []
              }
              markers={mapMarkers}
              pickup={liveDoerLocation}
              dropoff={dropoffLocation}
              interactive={true}
              height={220}
              style={styles.mapCanvas}
            />
          </View>

          {/* Route Info Footnote */}
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
                Your Current GPS Position
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

        {/* 4. TRACK & TRACE TIMELINE */}
        <DoerTrackingTimeline
          currentStepIndex={currentStepIndex}
          liveDistanceText={liveDistanceText}
          task={task}
          timelineTimes={timelineTimes}
        />

        {/* 5. BOTTOM ACTION ROW: CANCEL + MARK COMPLETE & UPLOAD PROOF */}
        <View style={styles.actionRowContainer}>
          <TouchableOpacity
            style={styles.cancelButton}
            activeOpacity={0.8}
            onPress={handleCancelTask}
          >
            <Ionicons
              name="close-circle-outline"
              size={17}
              color="#DC2626"
            />
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.markCompleteButton}
            activeOpacity={0.88}
            onPress={() => setIsProofModalOpen(true)}
          >
            <Ionicons
              name="images-outline"
              size={18}
              color="#FFFFFF"
            />
            <Text
              style={styles.markCompleteButtonText}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.8}
            >
              Mark Complete & Upload Proof
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* PROOF UPLOAD MODAL */}
      <TaskProofModal
        handleCompleteTask={handleCompleteTask}
        handlePickProof={handlePickProof}
        handleTakePhoto={handleTakePhoto}
        isProofModalOpen={isProofModalOpen}
        proofImageUri={proofImageUri}
        proofNotes={proofNotes}
        setIsProofModalOpen={setIsProofModalOpen}
        setProofNotes={setProofNotes}
      />

      {/* SUCCESS CONFIRMATION MODAL */}
      <Modal
        visible={isSuccessModalOpen}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setIsSuccessModalOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.successModalCard}>
            <View style={styles.successIconCircle}>
              <Ionicons
                name="checkmark-sharp"
                size={38}
                color="#FFFFFF"
              />
            </View>

            <Text style={styles.successModalTitle}>Task Completed!</Text>
            <Text style={styles.successModalSub}>
              Proof submitted successfully. The reward of {task.reward} has been
              recorded for settlement.
            </Text>

            <TouchableOpacity
              style={styles.successDoneButton}
              onPress={() => {
                setIsSuccessModalOpen(false);
                router.replace('/dashboard');
              }}
              activeOpacity={0.85}
            >
              <Text style={styles.successDoneButtonText}>
                Back to Dashboard
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
