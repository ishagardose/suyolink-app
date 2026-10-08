import React from 'react';
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

export default function DoerDetailModal({
  resolveColor,
  router,
  selectedDoerSuyo,
  setSelectedDoerSuyo,
  styles,
  userProfile,
}) {
  return (
    selectedDoerSuyo && (
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
                      `₱${selectedDoerSuyo.earnedAmount || 150}`}
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
                      {selectedDoerSuyo.requesterRating || '4.9★'} · Prompt
                      Payer
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
                    {selectedDoerSuyo.location || 'Tagum City'}
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
