import React, { useState, useMemo } from 'react';
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
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import TaskMap from '../components/maps/TaskMap';
import * as ImagePicker from 'expo-image-picker';

export default function FulfillTaskScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();

  // Task details with fallback matching project data
  const task = {
    id: params.id || 'SYL-102',
    title: params.title || 'Drop off documents - Unit 402',
    category: params.category || 'Documents',
    location: params.location || 'Unit 402, Makati CBD',
    distanceText: params.distanceText || '0.8 km away',
    reward: params.reward || '₱300',
    requesterName: params.requesterName || 'Atty. Rafael Cruz',
    requesterLocation: params.requesterLocation || 'Makati CBD',
    requesterPhone: params.requesterPhone || '0917 842 1983',
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
  const [proofImageUri, setProofImageUri] = useState(null);
  const [proofNotes, setProofNotes] = useState('');
  const [isProofModalOpen, setIsProofModalOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);

  // Map markers: Doer (You) & Receiver / Drop-off
  const doerLocation = useMemo(
    () => ({ latitude: 7.4475, longitude: 125.8078 }),
    []
  );
  const dropoffLocation = useMemo(
    () => ({ latitude: 7.4528, longitude: 125.8142 }),
    []
  );

  const mapMarkers = useMemo(
    () => [
      {
        id: 'doer-location',
        latitude: doerLocation.latitude,
        longitude: doerLocation.longitude,
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
    [doerLocation, dropoffLocation, task.location]
  );

  const mapCenter = useMemo(
    () => ({
      latitude: (doerLocation.latitude + dropoffLocation.latitude) / 2,
      longitude: (doerLocation.longitude + dropoffLocation.longitude) / 2,
    }),
    [doerLocation, dropoffLocation]
  );

  // Image picker for proof upload
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
      // Fallback placeholder photo if permissions or web picker fails
      setProofImageUri(
        'https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&q=80'
      );
    }
  };

  const handleCompleteTask = () => {
    setIsProofModalOpen(false);
    setCurrentStepIndex(3); // Completed
    setIsSuccessModalOpen(true);
  };

  const handleCallRequester = () => {
    const cleanPhone = task.requesterPhone.replace(/\s+/g, '');
    if (Platform.OS !== 'web') {
      Linking.openURL(`tel:${cleanPhone}`);
    } else {
      alert(`Calling ${task.requesterName} at ${task.requesterPhone}`);
    }
  };

  const getInitials = (name) => {
    if (!name) return 'AC';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
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

          {/* Under Drop off documents title: Arrives Between and Requester's Name */}
          <View style={styles.headerArrivalRequesterBlock}>
            <Text style={styles.headerEstimatedArrivalTime}>
              Arrives Between {task.arrivalWindow}
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
                        index < currentStepIndex &&
                          styles.stepConnectorLineFilled,
                      ]}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </View>
        </View>

        {/* 3. LIVE ROUTE MAP (Doer location to receiver / drop-off) */}
        <View style={styles.mapCardWrapper}>
          <View style={styles.mapHeaderRow}>
            <View style={styles.mapHeaderLeft}>
              <View style={styles.pulsingGreenDot} />
              <Text style={styles.mapHeaderRouteText}>LIVE ROUTE MAP</Text>
            </View>
            <View style={styles.mapDistanceBadge}>
              <Ionicons name="navigate-outline" size={12} color="#1E4D2B" />
              <Text style={styles.mapDistanceBadgeText}>{task.distanceText}</Text>
            </View>
          </View>

          <View style={styles.mapContainer}>
            <TaskMap center={mapCenter} markers={mapMarkers} height={250} />
          </View>
        </View>

        {/* 4. DETAILED PROGRESS FEATURE: TRACK & TRACE */}
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
                  Recipient: {task.requesterName} • Unit Doorstep
                </Text>
                <Text style={styles.timelineItemQuote}>
                  "Hand over items to recipient and capture delivery proof photo."
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
                  By You • Notarized documents handled with care
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
                  2. En route to location
                </Text>
                <Text style={styles.timelineItemRoute}>
                  IN TRANSIT → {task.location.toUpperCase()}
                </Text>
                <Text style={styles.timelineItemActor}>
                  Live GPS tracking active • Distance {task.distanceText}
                </Text>
                <Text style={styles.timelineItemQuote}>
                  "Navigating on delivery route towards destination."
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
                  1. Suyo task accepted
                </Text>
                <Text style={styles.timelineItemRoute}>
                  DOER MATCHED → TASK INITIATED
                </Text>
                <Text style={styles.timelineItemActor}>
                  By You (Verified Doer) • SuyoLink Dispatch
                </Text>
                <Text style={styles.timelineItemQuote}>
                  "Accepted errand task. Reviewing instructions and route."
                </Text>
                <Text style={styles.timelineItemTime}>
                  Today, 10:15 AM
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* 5. BUTTON: "Mark Complete & upload proof" */}
        <TouchableOpacity
          style={styles.markCompleteButton}
          activeOpacity={0.85}
          onPress={() => {
            router.push({
              pathname: '/submit-proof',
              params: {
                id: task.id,
                title: task.title,
                reward: task.reward,
                category: task.category,
                location: task.location,
                distanceText: task.distanceText,
                requesterName: task.requesterName,
                requesterLocation: task.requesterLocation,
                requesterPhone: task.requesterPhone,
                details: task.details,
              },
            });
          }}
        >
          <Ionicons name="camera-outline" size={20} color="#FFFFFF" />
          <Text style={styles.markCompleteButtonText}>
            Mark Complete & upload proof
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* ========================================================== */}
      {/* MODAL: UPLOAD PROOF MODAL                                  */}
      {/* ========================================================== */}
      <Modal
        visible={isProofModalOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsProofModalOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.proofModalCard}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalHeaderTitle}>Upload Completion Proof</Text>
              <TouchableOpacity
                onPress={() => setIsProofModalOpen(false)}
                style={styles.modalCloseBtn}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={20} color="#163523" />
              </TouchableOpacity>
            </View>

            <Text style={styles.proofModalSub}>
              Take or select a photo of the delivered items or handover receipt
              to verify this suyo.
            </Text>

            {/* Photo Preview or Upload Trigger Box */}
            <TouchableOpacity
              style={styles.proofUploadBox}
              activeOpacity={0.8}
              onPress={handlePickProof}
            >
              {proofImageUri ? (
                <Image
                  source={{ uri: proofImageUri }}
                  style={styles.proofImagePreview}
                />
              ) : (
                <View style={styles.proofPlaceholderContent}>
                  <Ionicons name="camera-outline" size={36} color="#1E4D2B" />
                  <Text style={styles.proofPlaceholderTitle}>
                    Tap to capture or upload photo
                  </Text>
                  <Text style={styles.proofPlaceholderSub}>
                    PNG, JPG, or JPEG up to 10MB
                  </Text>
                </View>
              )}
            </TouchableOpacity>

            {/* Delivery Notes */}
            <Text style={styles.inputFieldLabel}>Delivery Note (Optional)</Text>
            <TextInput
              style={styles.notesTextInput}
              placeholder="e.g. Handed grocery bags to recipient at doorstep."
              placeholderTextColor="#8FA497"
              value={proofNotes}
              onChangeText={setProofNotes}
              multiline
              numberOfLines={3}
            />

            {/* Action Buttons */}
            <View style={styles.proofActionsRow}>
              <TouchableOpacity
                style={styles.proofCancelBtn}
                onPress={() => setIsProofModalOpen(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.proofCancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.proofSubmitBtn}
                onPress={handleCompleteTask}
                activeOpacity={0.85}
              >
                <Ionicons name="checkmark-circle" size={17} color="#FFFFFF" />
                <Text style={styles.proofSubmitBtnText}>Submit & Finish</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ========================================================== */}
      {/* MODAL: SUCCESS CELEBRATION MODAL                           */}
      {/* ========================================================== */}
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
              Proof has been successfully verified. The reward of {task.reward}{' '}
              has been added to your wallet.
            </Text>

            <View style={styles.successRewardBox}>
              <Text style={styles.successRewardLabel}>REWARD EARNED</Text>
              <Text style={styles.successRewardAmount}>{task.reward}.00</Text>
            </View>

            <TouchableOpacity
              style={styles.successDoneButton}
              onPress={() => {
                setIsSuccessModalOpen(false);
                router.replace('/dashboard');
              }}
              activeOpacity={0.8}
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
    backgroundColor: '#F8FAF9',
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E8F0EC',
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0F5F2',
  },
  navBarTitle: {
    fontSize: 16,
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
    paddingVertical: 5,
    borderRadius: 12,
  },
  metaPillText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#163523',
  },

  /* 2. MODERN PROGRESS DIAGRAM (Lengthy in Width) */
  progressDiagramCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 14,
    marginBottom: 16,
    borderWidth: 1.2,
    borderColor: '#D8E5DF',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
    width: '100%',
  },
  diagramTrackContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 4,
  },
  stepNodeBlock: {
    alignItems: 'center',
    gap: 6,
    zIndex: 2,
  },
  stepCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCirclePast: {
    backgroundColor: '#1E4D2B',
  },
  stepCircleActive: {
    backgroundColor: '#1E4D2B',
    borderWidth: 3,
    borderColor: '#A3D9B5',
    shadowColor: '#1E4D2B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 5,
    elevation: 4,
  },
  stepCirclePending: {
    backgroundColor: '#F1F5F3',
    borderWidth: 1.5,
    borderColor: '#D8E5DF',
  },
  stepNumberPendingText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#658071',
  },
  stepNodeLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#658071',
    textAlign: 'center',
  },
  stepNodeLabelActive: {
    color: '#1E4D2B',
    fontWeight: '800',
  },
  stepNodeLabelPast: {
    color: '#163523',
    fontWeight: '700',
  },
  stepConnectorLine: {
    flex: 1,
    height: 2.5,
    backgroundColor: '#E4ECE8',
    marginHorizontal: 4,
    marginBottom: 16, // align vertically with circle center
  },
  stepConnectorLineFilled: {
    backgroundColor: '#1E4D2B',
  },

  /* 3. MAP CARD */
  mapCardWrapper: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1.2,
    borderColor: '#D8E5DF',
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  mapHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#F9FCFA',
    borderBottomWidth: 1,
    borderBottomColor: '#ECF4F0',
  },
  mapHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pulsingGreenDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#1E4D2B',
  },
  mapHeaderRouteText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#1E4D2B',
    letterSpacing: 0.6,
  },
  mapDistanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EBF5EF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  mapDistanceBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1E4D2B',
  },
  mapContainer: {
    width: '100%',
    height: 250,
  },
  mapFooterRouteStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#ECF4F0',
  },
  routePointItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    maxWidth: '45%',
  },
  routePointText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#163523',
  },

  /* 4. TRACK & TRACE TIMELINE */
  trackTraceSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1.2,
    borderColor: '#D8E5DF',
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
    marginBottom: 16,
  },
  trackTraceTitle: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#1E4D2B',
    letterSpacing: 0.8,
  },
  timelineList: {
    paddingLeft: 2,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  timelineLeftColumn: {
    alignItems: 'center',
    width: 22,
    marginRight: 12,
  },
  timelineDotCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  timelineDotCircleCompleted: {
    borderWidth: 2,
    borderColor: '#1E4D2B',
    backgroundColor: '#FFFFFF',
  },
  timelineInnerDotCompleted: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#1E4D2B',
  },
  timelineDotCircleActive: {
    borderWidth: 2,
    borderColor: '#1E4D2B',
    backgroundColor: '#EBF5EF',
  },
  timelineInnerDotActive: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#1E4D2B',
  },
  timelineDotCirclePending: {
    borderWidth: 2,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
  },
  timelineVerticalLine: {
    width: 2,
    flex: 1,
    minHeight: 46,
    marginVertical: 4,
  },
  timelineVerticalLineActive: {
    backgroundColor: '#1E4D2B',
  },
  timelineVerticalLineInactive: {
    backgroundColor: '#E2E8F0',
  },
  timelineContentBlock: {
    flex: 1,
    paddingBottom: 16,
  },
  timelineItemTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#163523',
    marginBottom: 2,
  },
  timelineItemTitleMuted: {
    color: '#8FA497',
  },
  timelineItemRoute: {
    fontSize: 10.5,
    fontWeight: '700',
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
  /* 5. BUTTON: MARK COMPLETE & UPLOAD PROOF */
  markCompleteButton: {
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
  markCompleteButtonText: {
    fontSize: 15.5,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },

  /* MODALS */
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  proofModalCard: {
    width: '100%',
    maxWidth: 390,
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 22,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 14,
    elevation: 10,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  modalHeaderTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#163523',
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F0F5F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  proofModalSub: {
    fontSize: 13,
    color: '#52695C',
    lineHeight: 18,
    marginBottom: 16,
  },
  proofUploadBox: {
    width: '100%',
    height: 160,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#D8E5DF',
    borderStyle: 'dashed',
    backgroundColor: '#F8FAF9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    overflow: 'hidden',
  },
  proofImagePreview: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  proofPlaceholderContent: {
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 20,
  },
  proofPlaceholderTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#163523',
    textAlign: 'center',
  },
  proofPlaceholderSub: {
    fontSize: 11,
    color: '#658071',
    textAlign: 'center',
  },
  inputFieldLabel: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#163523',
    marginBottom: 6,
  },
  notesTextInput: {
    backgroundColor: '#F8FAF9',
    borderWidth: 1,
    borderColor: '#D8E5DF',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: '#163523',
    minHeight: 70,
    textAlignVertical: 'top',
    marginBottom: 18,
  },
  proofActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  proofCancelBtn: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0F5F2',
  },
  proofCancelBtnText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#52695C',
  },
  proofSubmitBtn: {
    flex: 1.5,
    height: 46,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
    backgroundColor: '#1E4D2B',
  },
  proofSubmitBtnText: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  /* SUCCESS MODAL */
  successModalCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 14,
    elevation: 10,
  },
  successIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#1E4D2B',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#1E4D2B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  successModalTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#163523',
    marginBottom: 6,
    textAlign: 'center',
  },
  successModalSub: {
    fontSize: 13,
    color: '#52695C',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
  },
  successRewardBox: {
    backgroundColor: '#EBF5EF',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 14,
    alignItems: 'center',
    width: '100%',
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#D8E5DF',
  },
  successRewardLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#1E4D2B',
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  successRewardAmount: {
    fontSize: 22,
    fontWeight: '900',
    color: '#1E4D2B',
  },
  successDoneButton: {
    width: '100%',
    height: 48,
    borderRadius: 14,
    backgroundColor: '#1E4D2B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  successDoneButtonText: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
