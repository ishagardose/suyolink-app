import React, { useState, useEffect } from 'react';
import { getInitials } from '../utils/dashboardHelpers';
import {
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Modal,
  Image,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSuyos } from '../../../context/SuyoContext';
import { useTheme } from '../../../theme/ThemeContext';
import { STATUS_LABELS } from '../../../data/suyoRequests';
import ThemedText from '../../themed/ThemedText';
import ThemedButton from '../../themed/ThemedButton';
import SuyoSummary from '../../suyo/SuyoSummary';
import PrivateTaskDetails from '../../suyo/PrivateTaskDetails';
import ProofImage from '../../requests/ProofImage';

export default function DoerDetailModal({
  resolveColor,
  router,
  selectedDoerSuyo,
  setSelectedDoerSuyo,
  styles,
  userProfile,
}) {
  const { colors } = useTheme();
  const { loadDetails, ratings = [], events = [], proofs = [] } = useSuyos();
  const [detailsData, setDetailsData] = useState(null);

  useEffect(() => {
    let isMounted = true;
    if (selectedDoerSuyo?.id) {
      loadDetails(selectedDoerSuyo.id)
        .then((data) => {
          if (isMounted && data) setDetailsData(data);
        })
        .catch(() => {});
    }
    return () => {
      isMounted = false;
    };
  }, [selectedDoerSuyo?.id, loadDetails]);

  if (!selectedDoerSuyo) return null;

  const isCompleted =
    selectedDoerSuyo.status === 'Completed' ||
    selectedDoerSuyo.status === 'completed' ||
    selectedDoerSuyo.rawRequest?.status === 'completed';

  if (isCompleted) {
    const fullDetails = {
      ...(selectedDoerSuyo?.rawRequest || {}),
      ...(selectedDoerSuyo || {}),
      ...(detailsData || {}),
      id: selectedDoerSuyo.id,
      status: 'completed',
      category: detailsData?.category || selectedDoerSuyo.category || 'General',
      title: detailsData?.title || selectedDoerSuyo.title,
      details:
        detailsData?.details ||
        selectedDoerSuyo.details ||
        selectedDoerSuyo?.rawRequest?.details ||
        '',
      notes:
        detailsData?.notes ||
        selectedDoerSuyo.notes ||
        selectedDoerSuyo?.rawRequest?.notes ||
        '',
      location:
        detailsData?.location ||
        selectedDoerSuyo.location ||
        selectedDoerSuyo?.rawRequest?.location ||
        'Nearby',
      requesterName:
        detailsData?.requesterName ||
        selectedDoerSuyo.requesterName ||
        'Requester',
      requesterId:
        detailsData?.requesterId ||
        selectedDoerSuyo.requesterId ||
        selectedDoerSuyo?.rawRequest?.requesterId,
      offerCentavos:
        detailsData?.offerCentavos ??
        selectedDoerSuyo?.rawRequest?.offerCentavos ??
        (selectedDoerSuyo?.earnedAmount ? selectedDoerSuyo.earnedAmount * 100 : 0),
      exactAddress:
        detailsData?.exactAddress ||
        selectedDoerSuyo.exactAddress ||
        selectedDoerSuyo?.rawRequest?.exactAddress,
      contactPhone:
        detailsData?.contactPhone ||
        selectedDoerSuyo.contactPhone ||
        selectedDoerSuyo.requesterPhone ||
        selectedDoerSuyo?.rawRequest?.contactPhone,
      deadline:
        detailsData?.deadline ||
        selectedDoerSuyo.deadline ||
        selectedDoerSuyo?.rawRequest?.deadline ||
        new Date().toISOString(),
      latitude:
        detailsData?.latitude ??
        selectedDoerSuyo?.latitude ??
        selectedDoerSuyo?.rawRequest?.latitude,
      longitude:
        detailsData?.longitude ??
        selectedDoerSuyo?.longitude ??
        selectedDoerSuyo?.rawRequest?.longitude,
    };

    const matchedRating =
      (ratings || []).find((rt) => rt.request_id === selectedDoerSuyo.id) ||
      (selectedDoerSuyo.ratingScore != null
        ? {
            score: selectedDoerSuyo.ratingScore,
            comment: selectedDoerSuyo.ratingComment,
          }
        : null);

    const taskProofs = (proofs || []).filter(
      (p) => p.request_id === selectedDoerSuyo.id,
    );

    const taskEvents = (events || []).filter(
      (e) => e.request_id === selectedDoerSuyo.id,
    );

    return (
      <Modal
        visible={!!selectedDoerSuyo}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSelectedDoerSuyo(null)}
      >
        <View style={styles.modalBackdrop}>
          <View
            style={[
              styles.doerDetailModalCard,
              {
                maxHeight: '88%',
                width: '92%',
                maxWidth: 520,
                padding: 20,
                borderRadius: 24,
                backgroundColor: colors?.surface || '#FFFFFF',
              },
            ]}
          >
            {/* Header */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingBottom: 14,
                borderBottomWidth: 1,
                borderBottomColor: '#E2ECE5',
                marginBottom: 14,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View
                  style={[
                    styles.doerDetailCategoryCircle,
                    { backgroundColor: '#E8F5EE' },
                  ]}
                >
                  <Ionicons
                    name="checkmark-done"
                    size={18}
                    color={resolveColor('#059669', 'color')}
                  />
                </View>
                <View style={{ gap: 2 }}>
                  <Text
                    style={{
                      fontSize: 16,
                      fontWeight: '800',
                      color: resolveColor('#163523', 'color'),
                    }}
                  >
                    Suyo details
                  </Text>
                  <Text
                    style={{
                      fontSize: 12,
                      color: resolveColor('#059669', 'color'),
                      fontWeight: '600',
                    }}
                  >
                    Completed Task · Verified
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => setSelectedDoerSuyo(null)}
                style={styles.doerDetailCloseBtn}
                activeOpacity={0.7}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons
                  name="close"
                  size={18}
                  color={resolveColor('#163523', 'color')}
                />
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ gap: 14, paddingBottom: 16 }}
            >
              {/* 1. SuyoSummary Tile with inside action buttons */}
              <SuyoSummary details={fullDetails}>
                <ThemedButton
                  title="Requester profile"
                  variant="secondary"
                  onPress={() => {
                    setSelectedDoerSuyo(null);
                    router.push({
                      pathname: '/profile',
                      params: { userId: fullDetails.requesterId },
                    });
                  }}
                />
                {fullDetails.latitude != null ? (
                  <ThemedButton
                    title="View task location"
                    variant="secondary"
                    onPress={() => {
                      setSelectedDoerSuyo(null);
                      router.push({
                        pathname: '/map',
                        params: { requestId: fullDetails.id },
                      });
                    }}
                  />
                ) : null}
              </SuyoSummary>

              {/* 2. Private Task Details Tile */}
              <PrivateTaskDetails details={fullDetails} />

              {/* 3. Completion Proofs (if submitted) */}
              {taskProofs.map((proof) => (
                <View
                  key={proof.id}
                  style={{
                    padding: 14,
                    gap: 12,
                    backgroundColor: colors?.card || '#FFFFFF',
                    borderRadius: 14,
                    borderWidth: 1,
                    borderColor: colors?.border || '#E2ECE5',
                  }}
                >
                  <ThemedText style={{ fontWeight: '700' }}>
                    Proof · {proof.status}
                  </ThemedText>
                  <ProofImage path={proof.storage_path} />
                  {proof.note ? <ThemedText>{proof.note}</ThemedText> : null}
                </View>
              ))}

              {/* 4. Rating & Review Tile */}
              <View
                style={{
                  padding: 16,
                  gap: 8,
                  backgroundColor: colors?.card || '#FFFFFF',
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: colors?.border || '#E2ECE5',
                }}
              >
                <ThemedText style={{ fontWeight: '700', fontSize: 16 }}>
                  Rating & Review
                </ThemedText>
                {matchedRating ? (
                  <>
                    <ThemedText
                      style={{
                        fontWeight: '700',
                        color: colors?.link || '#059669',
                      }}
                    >
                      ★ {matchedRating.score} / 5
                    </ThemedText>
                    {matchedRating.comment ? (
                      <ThemedText tone="textMuted">
                        {matchedRating.comment}
                      </ThemedText>
                    ) : (
                      <ThemedText tone="textMuted">
                        Task completed and rated by requester.
                      </ThemedText>
                    )}
                  </>
                ) : (
                  <ThemedText tone="textMuted">
                    Task completed. Awaiting review from requester.
                  </ThemedText>
                )}
              </View>

              {/* 5. Task History Tile */}
              <View
                style={{
                  padding: 16,
                  gap: 10,
                  backgroundColor: colors?.card || '#FFFFFF',
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: colors?.border || '#E2ECE5',
                }}
              >
                <ThemedText style={{ fontSize: 18, fontWeight: '700' }}>
                  Task history
                </ThemedText>
                {taskEvents.length > 0 ? (
                  taskEvents.map((event) => (
                    <ThemedText key={event.id}>
                      {STATUS_LABELS[event.to_status] || event.to_status} ·{' '}
                      {new Date(event.created_at).toLocaleString()}
                    </ThemedText>
                  ))
                ) : (
                  <>
                    <ThemedText>
                      Open · {fullDetails.date || 'Task created'}
                    </ThemedText>
                    <ThemedText>
                      Assigned · You accepted this task
                    </ThemedText>
                    <ThemedText>
                      Completed · Suyo finished & received
                    </ThemedText>
                  </>
                )}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <Modal
      visible={!!selectedDoerSuyo}
      animationType="fade"
      transparent={true}
      onRequestClose={() => setSelectedDoerSuyo(null)}
    >
      <View style={styles.modalBackdrop}>
        <View style={styles.doerDetailModalCard}>
            {/* Header */}
            <View style={styles.doerDetailHeader}>
              <View style={styles.doerDetailHeaderLeft}>
                <View style={styles.doerDetailCategoryCircle}>
                  <Ionicons
                    name={selectedDoerSuyo.icon || 'bicycle'}
                    size={17}
                    color={resolveColor('#1E4D2B', 'color')}
                  />
                </View>
                <View style={{ gap: 2 }}>
                  <Text style={styles.doerDetailCategoryText}>
                    {selectedDoerSuyo.category || 'Doer Task Details'}
                  </Text>
                  <Text style={styles.doerDetailDateText}>
                    {selectedDoerSuyo.acceptedAt ||
                      selectedDoerSuyo.date ||
                      'Today'}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => setSelectedDoerSuyo(null)}
                style={styles.doerDetailCloseBtn}
                activeOpacity={0.7}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons
                  name="close"
                  size={18}
                  color={resolveColor('#163523', 'color')}
                />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={{ maxHeight: 420 }}
              showsVerticalScrollIndicator={false}
            >
              {/* Title */}
              <Text style={styles.doerDetailTitle}>
                {selectedDoerSuyo.title}
              </Text>

              {/* Status & Payout Card */}
              <View style={styles.doerDetailSummaryCard}>
                <View style={styles.doerDetailStatusBadge}>
                  <Ionicons
                    name={
                      selectedDoerSuyo.status === 'Completed'
                        ? 'checkmark-done-circle'
                        : selectedDoerSuyo.status === 'Cancelled'
                          ? 'close-circle'
                          : 'checkmark-circle'
                    }
                    size={14}
                    color={
                      selectedDoerSuyo.status === 'Completed'
                        ? resolveColor('#059669', 'color')
                        : selectedDoerSuyo.status === 'Cancelled'
                          ? resolveColor('#DC2626', 'color')
                          : resolveColor('#0284C7', 'color')
                    }
                  />
                  <Text
                    style={[
                      styles.doerDetailStatusBadgeText,
                      {
                        color:
                          selectedDoerSuyo.status === 'Completed'
                            ? resolveColor('#059669', 'color')
                            : selectedDoerSuyo.status === 'Cancelled'
                              ? resolveColor('#DC2626', 'color')
                              : resolveColor('#0284C7', 'color'),
                      },
                    ]}
                  >
                    {selectedDoerSuyo.status || 'Accepted'}
                  </Text>
                </View>

                <View style={styles.doerDetailPayoutBox}>
                  <Text style={styles.doerDetailPayoutLabel}>PAYOUT</Text>
                  <Text style={styles.doerDetailPayoutValue}>
                    +
                    {selectedDoerSuyo.reward ||
                      `₱${selectedDoerSuyo.earnedAmount || 0}`}
                  </Text>
                </View>
              </View>

              {/* Clickable Requester Profile Tile (Navigates directly to /profile screen without modal, matching MySuyo area) */}
              <TouchableOpacity
                style={styles.doerRequesterCard}
                activeOpacity={0.75}
                onPress={() => {
                  const isOwn =
                    selectedDoerSuyo.requesterName === userProfile?.name ||
                    selectedDoerSuyo.requesterName?.includes('(You)') ||
                    selectedDoerSuyo.requesterName === 'You';

                  setSelectedDoerSuyo(null);
                  if (isOwn) {
                    router.push({
                      pathname: '/profile',
                      params: { isOtherUser: 'false' },
                    });
                  } else {
                    const userId =
                      selectedDoerSuyo.rawRequest?.requesterId ||
                      selectedDoerSuyo.requesterId;
                    if (!userId) return;
                    router.push({ pathname: '/profile', params: { userId } });
                  }
                }}
                accessibilityRole="button"
                accessibilityLabel="View requester profile"
              >
                <View style={styles.doerRequesterCardTop}>
                  <Text style={styles.doerRequesterSectionLabel}>
                    REQUESTED BY
                  </Text>
                  <View style={styles.doerRequesterViewProfilePill}>
                    <Text style={styles.doerRequesterViewProfileText}>
                      View Profile
                    </Text>
                    <Ionicons
                      name="chevron-forward"
                      size={10}
                      color={resolveColor('#059669', 'color')}
                    />
                  </View>
                </View>

                <View style={styles.doerRequesterCardMainRow}>
                  <View style={styles.doerRequesterAvatar}>
                    <Text style={styles.doerRequesterAvatarText}>
                      {getInitials(
                        selectedDoerSuyo.requesterName || 'Community Member',
                      )}
                    </Text>
                  </View>
                  <View style={{ flex: 1, paddingRight: 6 }}>
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      <Text
                        style={styles.doerRequesterName}
                        numberOfLines={1}
                      >
                        {selectedDoerSuyo.requesterName || 'Community Member'}
                      </Text>
                      <Ionicons
                        name="checkmark-circle"
                        size={13}
                        color={resolveColor('#059669', 'color')}
                      />
                    </View>
                    <Text style={styles.doerRequesterSubMeta}>
                      {selectedDoerSuyo.requesterRating
                        ? `${selectedDoerSuyo.requesterRating}★ · Prompt Payer`
                        : 'Community Requester'}
                    </Text>
                  </View>

                  {(() => {
                    const isOwn =
                      selectedDoerSuyo.requesterName === userProfile?.name ||
                      selectedDoerSuyo.requesterName?.includes('(You)') ||
                      selectedDoerSuyo.requesterName === 'You';

                    if (isOwn) {
                      return (
                        <TouchableOpacity
                          style={[
                            styles.doerRequesterCallPill,
                            {
                              backgroundColor: resolveColor(
                                '#1E4D2B',
                                'backgroundColor',
                              ),
                            },
                          ]}
                          activeOpacity={0.8}
                          onPress={(e) => {
                            e?.stopPropagation?.();
                            setSelectedDoerSuyo(null);
                            router.push({
                              pathname: '/profile',
                              params: { isOtherUser: 'false' },
                            });
                          }}
                          accessibilityRole="button"
                          accessibilityLabel="Edit profile"
                        >
                          <Ionicons
                            name="pencil"
                            size={12}
                            color={resolveColor('#FFFFFF', 'color')}
                          />
                          <Text style={styles.doerRequesterCallPillText}>
                            Edit
                          </Text>
                        </TouchableOpacity>
                      );
                    }

                    if (selectedDoerSuyo.requesterPhone) {
                      return (
                        <TouchableOpacity
                          style={styles.doerRequesterCallPill}
                          activeOpacity={0.8}
                          onPress={(e) => {
                            e?.stopPropagation?.();
                            Linking.openURL(
                              `tel:${selectedDoerSuyo.requesterPhone}`,
                            );
                          }}
                          accessibilityRole="button"
                          accessibilityLabel="Call requester"
                        >
                          <Ionicons
                            name="call"
                            size={12}
                            color={resolveColor('#FFFFFF', 'color')}
                          />
                          <Text style={styles.doerRequesterCallPillText}>
                            Call
                          </Text>
                        </TouchableOpacity>
                      );
                    }
                    return null;
                  })()}
                </View>
              </TouchableOpacity>

              {/* Key Info Grid: Location & Deadline (Divided cleanly with dedicated icon bubbles) */}
              <View style={styles.doerInfoGridRow}>
                {/* Location Tile */}
                <View style={styles.doerInfoGridTile}>
                  <View style={styles.doerInfoGridTileHeader}>
                    <View
                      style={[
                        styles.doerInfoIconCircle,
                        {
                          backgroundColor: resolveColor(
                            '#E0F2FE',
                            'backgroundColor',
                          ),
                        },
                      ]}
                    >
                      <Ionicons
                        name="location-sharp"
                        size={13}
                        color={resolveColor('#0284C7', 'color')}
                      />
                    </View>
                    <Text style={styles.doerInfoGridLabel}>LOCATION</Text>
                  </View>
                  <Text
                    style={styles.doerInfoGridValue}
                    numberOfLines={2}
                  >
                    {selectedDoerSuyo.location || 'Nearby'}
                  </Text>
                </View>

                {/* Deadline / Time Tile */}
                <View style={styles.doerInfoGridTile}>
                  <View style={styles.doerInfoGridTileHeader}>
                    <View
                      style={[
                        styles.doerInfoIconCircle,
                        {
                          backgroundColor: resolveColor(
                            '#FEF3C7',
                            'backgroundColor',
                          ),
                        },
                      ]}
                    >
                      <Ionicons
                        name="time"
                        size={13}
                        color={resolveColor('#D97706', 'color')}
                      />
                    </View>
                    <Text style={styles.doerInfoGridLabel}>DEADLINE</Text>
                  </View>
                  <Text
                    style={styles.doerInfoGridValue}
                    numberOfLines={2}
                  >
                    {selectedDoerSuyo.deadline ||
                      selectedDoerSuyo.due ||
                      'Flexible time'}
                  </Text>
                </View>
              </View>

              {/* Task Description Section */}
              <View style={styles.doerTaskDescCard}>
                <View style={styles.doerSectionHeaderRow}>
                  <View
                    style={[
                      styles.doerInfoIconCircle,
                      {
                        backgroundColor: resolveColor(
                          '#E8F5EE',
                          'backgroundColor',
                        ),
                      },
                    ]}
                  >
                    <Ionicons
                      name="reader-outline"
                      size={13}
                      color={resolveColor('#1E4D2B', 'color')}
                    />
                  </View>
                  <Text style={styles.doerSectionHeaderText}>
                    TASK DESCRIPTION
                  </Text>
                </View>
                <Text style={styles.doerTaskDescBody}>
                  {selectedDoerSuyo.details ||
                    'Fulfill this suyo request according to requester requirements.'}
                </Text>
              </View>

              {/* Special Instructions (Notes) */}
              {selectedDoerSuyo.notes ? (
                <View style={styles.doerNotesCard}>
                  <View style={styles.doerSectionHeaderRow}>
                    <View
                      style={[
                        styles.doerInfoIconCircle,
                        {
                          backgroundColor: resolveColor(
                            '#FEF3C7',
                            'backgroundColor',
                          ),
                        },
                      ]}
                    >
                      <Ionicons
                        name="bulb-outline"
                        size={13}
                        color={resolveColor('#B45309', 'color')}
                      />
                    </View>
                    <Text
                      style={[
                        styles.doerSectionHeaderText,
                        { color: resolveColor('#B45309', 'color') },
                      ]}
                    >
                      SPECIAL INSTRUCTIONS
                    </Text>
                  </View>
                  <Text style={styles.doerNotesBody}>
                    {selectedDoerSuyo.notes}
                  </Text>
                </View>
              ) : null}

              {/* Attached Photos & Files Section */}
              {selectedDoerSuyo.attachments &&
                selectedDoerSuyo.attachments.length > 0 && (
                  <View style={styles.doerAttachmentsCard}>
                    <View style={styles.doerSectionHeaderRow}>
                      <View
                        style={[
                          styles.doerInfoIconCircle,
                          {
                            backgroundColor: resolveColor(
                              '#E8F5EE',
                              'backgroundColor',
                            ),
                          },
                        ]}
                      >
                        <Ionicons
                          name="attach"
                          size={13}
                          color={resolveColor('#1E4D2B', 'color')}
                        />
                      </View>
                      <Text style={styles.doerSectionHeaderText}>
                        ATTACHED PHOTOS & FILES (
                        {selectedDoerSuyo.attachments.length})
                      </Text>
                    </View>

                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.detailAttachmentsScroll}
                    >
                      {selectedDoerSuyo.attachments.map((att, idx) => {
                        const isImg = att.type === 'image';
                        return (
                          <View
                            key={att.id || idx}
                            style={styles.detailAttachmentChip}
                          >
                            {isImg ? (
                              <View style={styles.detailAttachmentImageWrap}>
                                <Image
                                  source={{ uri: att.uri }}
                                  style={styles.detailAttachmentThumb}
                                />
                                <View style={styles.detailAttachmentTag}>
                                  <Ionicons
                                    name="image"
                                    size={10}
                                    color={resolveColor('#FFFFFF', 'color')}
                                  />
                                  <Text style={styles.detailAttachmentTagText}>
                                    Photo
                                  </Text>
                                </View>
                              </View>
                            ) : (
                              <View style={styles.detailAttachmentDocWrap}>
                                <Ionicons
                                  name="document-text"
                                  size={18}
                                  color={resolveColor('#B45309', 'color')}
                                />
                                <Text
                                  style={styles.detailAttachmentDocName}
                                  numberOfLines={1}
                                >
                                  {att.name || 'Document'}
                                </Text>
                              </View>
                            )}
                          </View>
                        );
                      })}
                    </ScrollView>
                  </View>
                )}

              {/* Informational Callout Banner (NO BUTTONS, exactly as user requested) */}
              <View style={styles.doerModalInfoHint}>
                <Ionicons
                  name="information-circle"
                  size={15}
                  color={resolveColor('#059669', 'color')}
                />
                <Text style={styles.doerModalInfoHintText}>
                  Review the details above to decide whether to continue or
                  cancel this suyo on your main Doer Suyo card.
                </Text>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    )
  );
}
