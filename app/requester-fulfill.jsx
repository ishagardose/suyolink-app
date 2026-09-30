import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Linking,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import TaskMap from '../components/maps/TaskMap';

export default function RequesterFulfillScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();

  // Task details with fallback matching project data (Requester's viewpoint)
  const task = {
    id: params.id || 'SYL-102',
    title: params.title || 'Drop off documents - Unit 402',
    category: params.category || 'Documents',
    location: params.location || 'Unit 402, Makati CBD',
    distanceText: params.distanceText || '0.8 km away',
    reward: params.reward || '₱300',
    doerName: params.doerName || 'Alex M.',
    doerRating: (params.doerRating || '4.9').replace(/[★*]/g, '').trim(),
    doerSuyosCount: params.doerSuyosCount || params.doerErrandsCount || '231 suyos done',
    doerPhone: params.doerPhone || '0917 552 8910',
    details:
      params.details ||
      'Delivery of notarized legal documents to Unit 402.',
    arrivalWindow: params.arrivalWindow || '11:00 AM - 11:30 AM',
  };

  // 4 Progress Steps: Accepted -> En Route -> Working -> Completed
  const STEPS = [
    { key: 'Accepted', label: 'Accepted', icon: 'checkmark-circle' },
    { key: 'En Route', label: 'En Route', icon: 'bicycle' },
    { key: 'Working', label: 'Working', icon: 'bag-handle' },
    { key: 'Completed', label: 'Completed', icon: 'flag' },
  ];

  const [currentStepIndex, setCurrentStepIndex] = useState(1); // Default to 'En Route'

  // Map markers: Doer (Alex M.) & Drop-off (Unit 402)
  const doerLocation = useMemo(
    () => ({ latitude: 7.4475, longitude: 125.8078 }),
    []
  );
  const dropoffLocation = useMemo(
    () => ({ latitude: 7.4528, longitude: 125.8035 }),
    []
  );

  const handleCallDoer = () => {
    const cleanPhone = task.doerPhone.replace(/\s+/g, '');
    if (Platform.OS !== 'web') {
      Linking.openURL(`tel:${cleanPhone}`);
    } else {
      alert(`Calling assigned doer ${task.doerName} at ${task.doerPhone}`);
    }
  };

  return (
    <SafeAreaView style={styles.safeContainer} edges={['top', 'left', 'right']}>
      <StatusBar style="dark" />

      {/* TOP APP HEADER */}
      <View style={styles.navBar}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.replace('/dashboard')}
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

          {/* Under Drop off documents title: Arrives Between and Assigned Doer */}
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
              <Text style={styles.metaPillText}>{task.distanceText}</Text>
            </View>
          </View>
        </View>

        {/* 2. MODERN LENGTHY PROGRESS DIAGRAM (Accepted -> En Route -> Working -> Completed) */}
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
                    onPress={() => setCurrentStepIndex(index)}
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
              <Text style={styles.mapSectionTitle}>Live Doer GPS Route</Text>
            </View>
            <View style={styles.distanceBadgePill}>
              <Ionicons name="speedometer-outline" size={13} color="#1E4D2B" />
              <Text style={styles.distanceBadgeText}>{task.distanceText}</Text>
            </View>
          </View>

          {/* Interactive Map */}
          <View style={styles.mapViewportWrapper}>
            <TaskMap
              pickup={doerLocation}
              dropoff={dropoffLocation}
              interactive={true}
              style={styles.mapCanvas}
            />
          </View>
        </View>

        {/* 4. DETAILED PROGRESS FEATURE: TRACK & TRACE (Ascending Chronological Order) */}
        <View style={styles.trackTraceSection}>
          <View style={styles.trackTraceHeader}>
            <Ionicons name="git-network-outline" size={18} color="#1E4D2B" />
            <Text style={styles.trackTraceTitle}>TRACK & TRACE</Text>
          </View>

          <View style={styles.timelineList}>
            {/* Step 4: Drop-off & Completed (Top) */}
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
                  4. Drop off documents - Unit 402
                </Text>
                <Text style={styles.timelineItemRoute}>
                  RECIPIENT CONFIRMATION → RELEASE ESCROW
                </Text>
                <Text style={styles.timelineItemActor}>
                  Delivered at Unit 402 Doorstep
                </Text>
                <Text style={styles.timelineItemQuote}>
                  "Package delivered. Waiting for your confirmation to complete."
                </Text>
                <Text style={styles.timelineItemTime}>
                  Today, 11:15 AM
                </Text>
              </View>
            </View>

            {/* Step 3: Working & Documents Secured */}
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
                  3. Documents secured & verified
                </Text>
                <Text style={styles.timelineItemRoute}>
                  LEGAL PAPERS CHECKED → SECURE TRANSIT
                </Text>
                <Text style={styles.timelineItemActor}>
                  By {task.doerName} • Verified legal envelope
                </Text>
                <Text style={styles.timelineItemQuote}>
                  "All pages verified and sealed in waterproof envelope."
                </Text>
                <Text style={styles.timelineItemTime}>
                  Today, 10:50 AM
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
                  Live GPS tracking active • Distance {task.distanceText}
                </Text>
                <Text style={styles.timelineItemQuote}>
                  "Doer is moving towards the destination address."
                </Text>
                <Text style={styles.timelineItemTime}>
                  Today, 10:35 AM
                </Text>
              </View>
            </View>

            {/* Step 1: Accepted (Bottom) */}
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
                  "Doer accepted your document drop-off suyo. Preparing route."
                </Text>
                <Text style={styles.timelineItemTime}>
                  Today, 10:15 AM
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* 5. REQUESTER BUTTON: "Mark as Received & Rate the Doer" */}
        <TouchableOpacity
          style={styles.markReceivedButton}
          activeOpacity={0.85}
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
                doerSuyosCount: task.doerSuyosCount || task.doerErrandsCount,
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: '#F8FAF8',
  },
  navBar: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E8EFEA',
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0F6F2',
  },
  navBarTitle: {
    fontSize: 16.5,
    fontWeight: '800',
    color: '#163523',
    letterSpacing: -0.2,
  },
  headerRightAction: {
    width: 38,
    height: 38,
    borderRadius: 19,
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
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
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
    shadowColor: '#1E4D2B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.28,
    shadowRadius: 4,
    elevation: 3,
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
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
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
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
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
    shadowColor: '#1E4D2B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 24,
  },
  markReceivedButtonText: {
    fontSize: 15.5,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
});
