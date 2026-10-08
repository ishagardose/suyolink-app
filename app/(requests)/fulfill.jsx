import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  TextInput,
  Modal,
  Platform,
  Linking,
  Alert,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import TaskMap from '../../components/maps/TaskMap';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useAuth } from '../../context/AuthContext';
import { useSuyos } from '../../context/SuyoContext';
import { supabase } from '../../lib/supabase';
import { distanceKm, formatDistance } from '../../lib/geo';

export default function FulfillTaskScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { requests = [], refresh, mutate, recordTransaction, reloadTransactions } = useSuyos();

  // Find active task from context or route params
  const targetId = params.id || params.requestId;
  const activeSuyo = (requests || []).find((r) => r.id === targetId);

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
      requesterName:
        activeSuyo?.requesterName ||
        activeSuyo?.creatorName ||
        params.requesterName ||
        'Atty. Rafael Cruz',
      requesterLocation: activeSuyo?.location || params.requesterLocation || 'Makati CBD',
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
    getStepFromStatus(task.status)
  );

  const [proofImageUri, setProofImageUri] = useState(null);
  const [proofNotes, setProofNotes] = useState('');
  const [isProofModalOpen, setIsProofModalOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [liveDistanceText, setLiveDistanceText] = useState(task.distanceText);

  // Real GPS live location
  const [liveDoerLocation, setLiveDoerLocation] = useState(() => ({
    latitude: task.latitude - 0.0053,
    longitude: task.longitude + 0.0043,
  }));

  const dropoffLocation = useMemo(
    () => ({ latitude: task.latitude, longitude: task.longitude }),
    [task.latitude, task.longitude]
  );

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
    const t3 = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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
      .on('broadcast', { event: 'location_update' }, (payload) => {
        if (payload?.payload?.latitude && payload?.payload?.longitude) {
          setLiveDoerLocation({
            latitude: payload.payload.latitude,
            longitude: payload.payload.longitude,
          });
          if (payload.payload.distanceText) {
            setLiveDistanceText(payload.payload.distanceText);
          }
        }
      })
      .subscribe();

    return () => {
      channel.unsubscribe();
      channelRef.current = null;
    };
  }, [task.id]);

  // Real-time GPS Geolocation Watcher
  useEffect(() => {
    let sub = null;
    let webWatchId = null;
    let isMounted = true;

    async function initGPS() {
      // 1. Web browser environment: use standard W3C navigator.geolocation
      if (Platform.OS === 'web') {
        if (typeof navigator !== 'undefined' && navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              if (isMounted && pos?.coords) {
                const coords = {
                  latitude: pos.coords.latitude,
                  longitude: pos.coords.longitude,
                };
                setLiveDoerLocation(coords);
                const d = distanceKm(coords, dropoffLocation);
                if (d !== null) {
                  const formatted = formatDistance(d);
                  setLiveDistanceText(formatted);
                  broadcastLocation(coords, formatted);
                }
              }
            },
            () => {}
          );

          try {
            webWatchId = navigator.geolocation.watchPosition(
              (pos) => {
                if (isMounted && pos?.coords) {
                  const coords = {
                    latitude: pos.coords.latitude,
                    longitude: pos.coords.longitude,
                  };
                  setLiveDoerLocation(coords);
                  const d = distanceKm(coords, dropoffLocation);
                  if (d !== null) {
                    const formatted = formatDistance(d);
                    setLiveDistanceText(formatted);
                    broadcastLocation(coords, formatted);
                  }
                }
              },
              () => {},
              { enableHighAccuracy: true, timeout: 10000, maximumAge: 3000 }
            );
          } catch (_) {}
        }
        return;
      }

      // 2. Native Mobile environment (iOS / Android)
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') return;

        const current = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        if (isMounted && current?.coords) {
          const coords = {
            latitude: current.coords.latitude,
            longitude: current.coords.longitude,
          };
          setLiveDoerLocation(coords);

          const d = distanceKm(coords, dropoffLocation);
          if (d !== null) {
            const formatted = formatDistance(d);
            setLiveDistanceText(formatted);
            broadcastLocation(coords, formatted);
          }
        }

        sub = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            distanceInterval: 10,
            timeInterval: 5000,
          },
          (loc) => {
            if (isMounted && loc?.coords) {
              const coords = {
                latitude: loc.coords.latitude,
                longitude: loc.coords.longitude,
              };
              setLiveDoerLocation(coords);
              const d = distanceKm(coords, dropoffLocation);
              if (d !== null) {
                const formatted = formatDistance(d);
                setLiveDistanceText(formatted);
                broadcastLocation(coords, formatted);
              }
            }
          }
        );
      } catch (err) {
        console.warn('Native GPS watch error:', err);
      }
    }

    initGPS();

    return () => {
      isMounted = false;
      if (webWatchId !== null && typeof navigator !== 'undefined' && navigator.geolocation) {
        try {
          navigator.geolocation.clearWatch(webWatchId);
        } catch (_) {}
      }
      if (sub && typeof sub.remove === 'function') {
        try {
          sub.remove();
        } catch (_) {}
      }
    };
  }, [dropoffLocation]);

  const broadcastLocation = async (coords, distText) => {
    if (channelRef.current) {
      try {
        channelRef.current.send({
          type: 'broadcast',
          event: 'location_update',
          payload: {
            latitude: coords.latitude,
            longitude: coords.longitude,
            distanceText: distText,
            taskId: task.id,
            updatedAt: new Date().toISOString(),
          },
        });
      } catch (e) {
        console.warn('Realtime location broadcast error:', e);
      }
    }

    // Persist to Supabase if logged in
    if (supabase && user?.id && task.id) {
      try {
        await supabase.rpc('update_task_location', {
          p_request_id: task.id,
          p_latitude: coords.latitude,
          p_longitude: coords.longitude,
        });
      } catch (_) {}
    }
  };

  // Broadcast and persist step transition
  const handleUpdateStep = async (newIndex) => {
    setCurrentStepIndex(newIndex);
    const nowTimeStr = `Today, ${new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    })}`;

    setTimelineTimes((prev) => ({
      ...prev,
      [newIndex === 1 ? 'enRoute' : newIndex === 2 ? 'working' : 'completed']: nowTimeStr,
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
      {
        id: 'doer-location',
        latitude: liveDoerLocation.latitude,
        longitude: liveDoerLocation.longitude,
        title: 'Doer (You)',
        isMe: true,
      },
      {
        id: 'dropoff-location',
        latitude: dropoffLocation.latitude,
        longitude: dropoffLocation.longitude,
        title: `Drop-off: ${task.location}`,
        isMe: false,
      },
    ],
    [liveDoerLocation, dropoffLocation, task.location]
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
        'https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&q=80'
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

    const rewardNum = Number(String(task.reward).replace(/[^0-9.]/g, '')) || 100;
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
          ? window.confirm('Are you sure you want to cancel fulfilling this suyo?')
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
      ]
    );
  };

  const handleCallRequester = () => {
    const cleanPhone = task.requesterPhone.replace(/\s+/g, '');
    if (Platform.OS !== 'web') {
      Linking.openURL(`tel:${cleanPhone}`);
    } else {
      if (typeof window !== 'undefined' && window.alert) {
        window.alert(`Calling requester ${task.requesterName} at ${task.requesterPhone}`);
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
        <Text style={styles.navBarTitle}>Task Fulfillment</Text>
        <TouchableOpacity
          style={styles.headerRightAction}
          onPress={handleCallRequester}
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
              <Ionicons name="speedometer-outline" size={13} color="#1E4D2B" />
              <Text style={styles.distanceBadgeText}>{liveDistanceText}</Text>
            </View>
          </View>

          {/* Interactive Map */}
          <View style={styles.mapViewportWrapper}>
            <TaskMap
              center={dropoffLocation}
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
                <Ionicons name="navigate" size={11} color="#FFFFFF" />
              </View>
              <Text style={styles.routePointText} numberOfLines={1}>
                Your Current GPS Position
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
                  Recipient: {task.requesterName} • {task.location}
                </Text>
                <Text style={styles.timelineItemQuote}>
                  "Hand over at destination and capture delivery proof photo."
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
                  {task.category.toUpperCase()} CHECKED → ACTIVE FULFILLMENT
                </Text>
                <Text style={styles.timelineItemActor}>
                  By You • Handled with care & compliance
                </Text>
                <Text style={styles.timelineItemQuote}>
                  "All task items verified and kept secure throughout transit."
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
                  2. En route to location
                </Text>
                <Text style={styles.timelineItemRoute}>
                  IN TRANSIT → {task.location.toUpperCase()}
                </Text>
                <Text style={styles.timelineItemActor}>
                  Live GPS tracking active • Distance {liveDistanceText}
                </Text>
                <Text style={styles.timelineItemQuote}>
                  "Navigating on delivery route towards destination."
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
                  1. Suyo task accepted
                </Text>
                <Text style={styles.timelineItemRoute}>
                  DOER MATCHED → TASK INITIATED
                </Text>
                <Text style={styles.timelineItemActor}>
                  By You (Verified Doer) • SuyoLink Dispatch
                </Text>
                <Text style={styles.timelineItemQuote}>
                  "Accepted suyo task. Reviewing instructions and route."
                </Text>
                <Text style={styles.timelineItemTime}>
                  {timelineTimes.accepted}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* 5. BOTTOM ACTION ROW: CANCEL + MARK COMPLETE & UPLOAD PROOF */}
        <View style={styles.actionRowContainer}>
          <TouchableOpacity
            style={styles.cancelButton}
            activeOpacity={0.8}
            onPress={handleCancelTask}
          >
            <Ionicons name="close-circle-outline" size={17} color="#DC2626" />
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.markCompleteButton}
            activeOpacity={0.88}
            onPress={() => setIsProofModalOpen(true)}
          >
            <Ionicons name="images-outline" size={18} color="#FFFFFF" />
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
      <Modal
        visible={isProofModalOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsProofModalOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.proofModalCard}>
            <View style={styles.proofModalHeader}>
              <Text style={styles.proofModalTitle}>Upload Delivery Proof</Text>
              <TouchableOpacity
                onPress={() => setIsProofModalOpen(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={20} color="#556E60" />
              </TouchableOpacity>
            </View>

            <Text style={styles.proofModalSub}>
              Attach a clear photo of the delivered item or handoff to confirm
              completion.
            </Text>

            {/* Photo Selection / Camera preview */}
            <View style={styles.photoPickerBox}>
              {proofImageUri ? (
                <View style={styles.previewImageContainer}>
                  <Image
                    source={{ uri: proofImageUri }}
                    style={styles.previewImage}
                    resizeMode="cover"
                  />
                  <TouchableOpacity
                    style={styles.changeImageBadge}
                    onPress={handlePickProof}
                  >
                    <Ionicons name="camera-reverse" size={16} color="#FFFFFF" />
                    <Text style={styles.changeImageText}>Change</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.pickOptionsRow}>
                  <TouchableOpacity
                    style={styles.photoActionBtn}
                    onPress={handleTakePhoto}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="camera-outline" size={26} color="#1E4D2B" />
                    <Text style={styles.photoActionText}>Take Photo</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.photoActionBtn}
                    onPress={handlePickProof}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="images-outline" size={26} color="#1E4D2B" />
                    <Text style={styles.photoActionText}>Choose from Gallery</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Optional Notes */}
            <Text style={styles.proofInputLabel}>Proof Notes (Optional)</Text>
            <TextInput
              style={styles.proofNotesInput}
              placeholder="e.g. Left with reception, handed directly to recipient..."
              placeholderTextColor="#7F998A"
              value={proofNotes}
              onChangeText={setProofNotes}
              multiline
              numberOfLines={3}
            />

            {/* Modal Actions */}
            <View style={styles.modalActionButtonsRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setIsProofModalOpen(false)}
              >
                <Text style={styles.modalCancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSubmitBtn}
                onPress={handleCompleteTask}
                activeOpacity={0.85}
              >
                <Ionicons name="checkmark-done" size={18} color="#FFFFFF" />
                <Text style={styles.modalSubmitBtnText}>Submit & Complete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

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
              <Ionicons name="checkmark-sharp" size={38} color="#FFFFFF" />
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
              <Text style={styles.successDoneButtonText}>Back to Dashboard</Text>
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

  /* 5. BOTTOM ACTION ROW: CANCEL + MARK COMPLETE & UPLOAD PROOF */
  actionRowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 24,
    width: '100%',
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 50,
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#F87171',
    flexShrink: 0,
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#DC2626',
  },
  markCompleteButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 50,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: '#1E4D2B',
    ...(Platform.OS === 'web'
      ? { boxShadow: '0 4px 8px rgba(30,77,43,0.22)' }
      : {
          shadowColor: '#1E4D2B',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.22,
          shadowRadius: 8,
          elevation: 4,
        }),
  },
  markCompleteButtonText: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.1,
  },

  /* PROOF MODAL */
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  proofModalCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    ...(Platform.OS === 'web'
      ? { boxShadow: '0 10px 25px rgba(0,0,0,0.15)' }
      : {
          shadowColor: '#000000',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.15,
          shadowRadius: 16,
          elevation: 8,
        }),
  },
  proofModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  proofModalTitle: {
    fontSize: 18,
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
  proofModalSub: {
    fontSize: 12.5,
    color: '#556E60',
    lineHeight: 17,
    marginBottom: 16,
  },
  photoPickerBox: {
    minHeight: 120,
    backgroundColor: '#F7FAF8',
    borderRadius: 14,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#C8DBD0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    overflow: 'hidden',
  },
  pickOptionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    padding: 16,
  },
  photoActionBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#EBF5EF',
    minWidth: 120,
  },
  photoActionText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#1E4D2B',
  },
  previewImageContainer: {
    width: '100%',
    height: 180,
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  changeImageBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(22, 53, 35, 0.85)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  changeImageText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  proofInputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#345241',
    marginBottom: 6,
  },
  proofNotesInput: {
    backgroundColor: '#FAFDFB',
    borderWidth: 1,
    borderColor: '#D4E4DC',
    borderRadius: 12,
    padding: 12,
    fontSize: 12.5,
    color: '#163523',
    minHeight: 64,
    textAlignVertical: 'top',
    marginBottom: 18,
  },
  modalActionButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  modalCancelBtn: {
    flex: 1,
    height: 46,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#D4E2D9',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  modalCancelBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#556E60',
  },
  modalSubmitBtn: {
    flex: 2,
    height: 46,
    borderRadius: 14,
    backgroundColor: '#1E4D2B',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  modalSubmitBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  /* SUCCESS MODAL */
  successModalCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
  },
  successIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#1E4D2B',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  successModalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#163523',
    marginBottom: 6,
  },
  successModalSub: {
    fontSize: 13,
    color: '#556E60',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  successDoneButton: {
    backgroundColor: '#1E4D2B',
    width: '100%',
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successDoneButtonText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
