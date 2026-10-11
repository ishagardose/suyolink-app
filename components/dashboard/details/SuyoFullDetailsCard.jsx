import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  Linking,
  ActivityIndicator,
  Modal,
  StyleSheet,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSuyos } from '../../../context/SuyoContext';
import { getRequestTiming } from '../../../lib/requestTiming';
import { CATEGORY_ICONS, DEADLINE_STATUS_OPTIONS } from '../../requests/data/requestFormConfig';
import { privatePinAddress } from '../../../lib/philippineAreas';
import { suyoDetailsStyles } from '../styles/suyoDetails.styles';

export default function SuyoFullDetailsCard({
  selectedSuyo,
  resolveColor = (color) => color,
  styles = suyoDetailsStyles,
  showHeader = true,
}) {
  const { loadDetails } = useSuyos();
  const [detailsData, setDetailsData] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);

  useEffect(() => {
    let isMounted = true;
    if (selectedSuyo?.id) {
      setLoadingDetails(true);
      loadDetails(selectedSuyo.id)
        .then((data) => {
          if (isMounted && data) {
            setDetailsData(data);
          }
        })
        .catch(() => {})
        .finally(() => {
          if (isMounted) setLoadingDetails(false);
        });
    }
    return () => {
      isMounted = false;
    };
  }, [selectedSuyo?.id, loadDetails]);

  if (!selectedSuyo) return null;

  // Merge selectedSuyo with rawRequest and loadedDetails for complete data availability
  const merged = {
    ...selectedSuyo,
    ...(selectedSuyo?.rawRequest || {}),
    ...(detailsData || {}),
  };

  const timing = getRequestTiming(merged.rawRequest || merged);
  const category = merged.category || 'General';
  const categoryIcon = CATEGORY_ICONS[category] || 'cube-outline';

  // Urgency configuration
  const urgencyKey = merged.urgency || (timing.overdue ? 'Urgent' : 'Normal');
  const urgencyConfig =
    DEADLINE_STATUS_OPTIONS.find((opt) => opt.key === urgencyKey) ||
    DEADLINE_STATUS_OPTIONS[3];

  // Reward formatting
  const rewardDisplay = merged.rewardAmount
    ? `₱${Number(merged.rewardAmount).toFixed(2)}`
    : merged.reward && String(merged.reward).startsWith('₱')
      ? `${merged.reward}.00`
      : merged.offerCentavos
        ? `₱${(Number(merged.offerCentavos) / 100).toFixed(2)}`
        : '₱150.00';

  // Deadline formatting
  let deadlineDate = merged.deadlineDate || '';
  let deadlineTime = merged.deadlineTime || '';
  if (!deadlineDate && merged.deadline) {
    try {
      const d = new Date(merged.deadline);
      deadlineDate = d.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      deadlineTime = d.toLocaleTimeString(undefined, {
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      deadlineDate = String(merged.deadline);
    }
  }

  // Location details
  const publicLocation =
    merged.publicLocation || merged.location || 'Nearby area';
  const exactAddress =
    merged.exactAddress ||
    merged.exact_address ||
    (merged.coordinates ? privatePinAddress(merged.coordinates) : null) ||
    'Visible upon accepting task';
  const lat =
    merged.latitude ??
    merged.exactLatitude ??
    merged.coordinates?.latitude ??
    null;
  const lng =
    merged.longitude ??
    merged.exactLongitude ??
    merged.coordinates?.longitude ??
    null;
  const hasGps = typeof lat === 'number' && typeof lng === 'number';

  // Requester contact info
  const requesterName =
    merged.requesterName ||
    merged.requester?.full_name ||
    'Community Requester';
  const rawPhone =
    merged.contactPhone ||
    merged.contact_phone ||
    merged.requesterPhone ||
    merged.phone ||
    '';
  const displayPhone = rawPhone || 'Available after assignment';

  const handleCall = () => {
    if (!rawPhone) return;
    Linking.openURL(`tel:${rawPhone}`).catch(() => {});
  };

  const handleSms = () => {
    if (!rawPhone) return;
    Linking.openURL(`sms:${rawPhone}`).catch(() => {});
  };

  // Special instructions
  const notes =
    merged.notes ||
    merged.specialInstructions ||
    merged.special_instructions ||
    '';

  // Attachments
  const attachments =
    merged.attachments ||
    merged.rawRequest?.attachments ||
    [];

  return (
    <View style={cardStyles.container}>
      {/* Tile Header */}
      {showHeader && (
        <View style={cardStyles.cardHeaderRow}>
          <View style={cardStyles.cardHeaderTitleRow}>
            <Ionicons name="document-text" size={17} color="#1E4D2B" />
            <Text style={cardStyles.cardHeaderTitle}>COMPLETE SUYO DETAILS</Text>
          </View>
          <View style={cardStyles.postedByBadge}>
            <Text style={cardStyles.postedByBadgeText}>Posted by Requester</Text>
          </View>
        </View>
      )}

      {/* Syncing indicator */}
      {loadingDetails && (
        <View style={cardStyles.syncingRow}>
          <ActivityIndicator
            size="small"
            color={resolveColor('#1E4D2B', 'color')}
          />
          <Text style={{ fontSize: 12, color: resolveColor('#658172', 'color') }}>
            Syncing full task details...
          </Text>
        </View>
      )}

      <View style={cardStyles.sectionsWrapper}>
        {/* 1. Header Banner & Task Overview */}
        <View style={styles.fullDetailSectionCard}>
          <View style={styles.fullDetailBannerRow}>
            <View style={styles.fullDetailCategoryBadge}>
              <Ionicons
                name={categoryIcon}
                size={14}
                color={resolveColor('#166534', 'color')}
              />
              <Text style={styles.fullDetailCategoryText}>{category}</Text>
            </View>

            <View
              style={[
                styles.fullDetailUrgencyBadge,
                {
                  backgroundColor: resolveColor(
                    urgencyConfig.bgColor,
                    'backgroundColor',
                  ),
                },
              ]}
            >
              <Ionicons
                name={urgencyConfig.icon}
                size={12}
                color={resolveColor(urgencyConfig.color, 'color')}
              />
              <Text
                style={[
                  styles.fullDetailUrgencyText,
                  { color: resolveColor(urgencyConfig.color, 'color') },
                ]}
              >
                {urgencyConfig.label}
              </Text>
            </View>
          </View>

          <Text style={styles.fullDetailMainTitle}>{merged.title}</Text>

          <Text style={styles.fullDetailMetaSubText}>
            {`Posted: ${timing.postedTime || timing.formattedDate} • Ref: #${merged.id?.slice?.(0, 8) || 'suyo'}`}
          </Text>
        </View>

        {/* 2. Reward & Escrow Guarantee */}
        <View style={styles.fullDetailRewardBanner}>
          <View style={styles.fullDetailRewardLeft}>
            <Text style={styles.fullDetailRewardLabel}>Doer Offer Reward</Text>
            <Text style={styles.fullDetailRewardAmountText}>{rewardDisplay}</Text>
            <Text style={styles.fullDetailEscrowNoticeText}>
              Payment is held securely in SuyoLink escrow and released immediately upon completion.
            </Text>
          </View>

          <View style={styles.fullDetailEscrowBadge}>
            <Ionicons
              name="shield-checkmark"
              size={16}
              color={resolveColor('#166534', 'color')}
            />
            <Text style={styles.fullDetailEscrowText}>Escrow Secured</Text>
          </View>
        </View>

        {/* 3. Full Task Details & What to Do */}
        <View style={styles.fullDetailSectionCard}>
          <View style={styles.fullDetailSectionHeaderRow}>
            <Ionicons
              name="document-text-outline"
              size={17}
              color={resolveColor('#163523', 'color')}
            />
            <Text style={styles.fullDetailSectionTitle}>Task Details & Scope</Text>
          </View>
          <Text style={styles.fullDetailTaskDescriptionText}>
            {merged.details || 'No specific task details provided.'}
          </Text>
        </View>

        {/* 4. Completion Deadline & Schedule */}
        <View style={styles.fullDetailSectionCard}>
          <View style={styles.fullDetailSectionHeaderRow}>
            <Ionicons
              name="time-outline"
              size={17}
              color={resolveColor('#163523', 'color')}
            />
            <Text style={styles.fullDetailSectionTitle}>Completion Deadline</Text>
          </View>

          <View style={styles.fullDetailScheduleGrid}>
            <View style={styles.fullDetailScheduleCol}>
              <Text style={styles.fullDetailScheduleLabel}>Target Date</Text>
              <Text style={styles.fullDetailScheduleValue}>
                {deadlineDate || 'Flexible / Today'}
              </Text>
            </View>

            <View style={styles.fullDetailScheduleCol}>
              <Text style={styles.fullDetailScheduleLabel}>Target Time</Text>
              <Text style={styles.fullDetailScheduleValue}>
                {deadlineTime || 'Open window'}
              </Text>
            </View>
          </View>

          <View style={{ marginTop: 10 }}>
            <Text style={{ fontSize: 12, color: resolveColor('#658172', 'color'), fontWeight: '600' }}>
              {timing.due || 'Open schedule'}
            </Text>
          </View>
        </View>

        {/* 5. Location & Drop-off Details */}
        <View style={styles.fullDetailSectionCard}>
          <View style={styles.fullDetailSectionHeaderRow}>
            <Ionicons
              name="location-outline"
              size={17}
              color={resolveColor('#163523', 'color')}
            />
            <Text style={styles.fullDetailSectionTitle}>Location & Drop-off</Text>
          </View>

          <View style={styles.fullDetailLocationBlock}>
            <View style={styles.fullDetailLocationItem}>
              <Ionicons
                name="business-outline"
                size={18}
                color={resolveColor('#0D9488', 'color')}
                style={{ marginTop: 2 }}
              />
              <View style={styles.fullDetailLocationItemCol}>
                <Text style={styles.fullDetailLocationItemLabel}>
                  General Area / Landmark
                </Text>
                <Text style={styles.fullDetailLocationItemValue}>
                  {publicLocation}
                </Text>
              </View>
            </View>

            <View style={styles.fullDetailLocationItem}>
              <Ionicons
                name="navigate-outline"
                size={18}
                color={resolveColor('#1E4D2B', 'color')}
                style={{ marginTop: 2 }}
              />
              <View style={styles.fullDetailLocationItemCol}>
                <Text style={styles.fullDetailLocationItemLabel}>
                  Exact Delivery / Drop-off Address
                </Text>
                <Text style={styles.fullDetailLocationItemValue}>
                  {exactAddress}
                </Text>

                {hasGps && (
                  <View style={styles.fullDetailCoordinatesBadge}>
                    <Ionicons
                      name="pin"
                      size={11}
                      color={resolveColor('#1E40AF', 'color')}
                    />
                    <Text style={styles.fullDetailCoordinatesText}>
                      {`GPS: ${Number(lat).toFixed(4)}° N, ${Number(lng).toFixed(4)}° E`}
                    </Text>
                  </View>
                )}

                {merged.distanceText && (
                  <Text
                    style={{
                      fontSize: 11.5,
                      color: resolveColor('#059669', 'color'),
                      fontWeight: '700',
                      marginTop: 4,
                    }}
                  >
                    {merged.distanceText}
                  </Text>
                )}
              </View>
            </View>
          </View>
        </View>

        {/* 6. Special Instructions & Notes */}
        <View style={styles.fullDetailSectionCard}>
          <View style={styles.fullDetailSectionHeaderRow}>
            <Ionicons
              name="clipboard-outline"
              size={17}
              color={resolveColor('#163523', 'color')}
            />
            <Text style={styles.fullDetailSectionTitle}>
              Special Instructions & Notes
            </Text>
          </View>
          <Text style={styles.fullDetailNotesText}>
            {notes || 'No extra special instructions provided by the requester.'}
          </Text>
        </View>

        {/* 7. Requester Information & Direct Contact */}
        <View style={styles.fullDetailSectionCard}>
          <View style={styles.fullDetailSectionHeaderRow}>
            <Ionicons
              name="person-outline"
              size={17}
              color={resolveColor('#163523', 'color')}
            />
            <Text style={styles.fullDetailSectionTitle}>Requester Information</Text>
          </View>

          <View style={styles.fullDetailRequesterCard}>
            <View style={styles.fullDetailRequesterLeft}>
              <View style={styles.detailAvatarCircle}>
                <Text style={styles.detailAvatarInitials}>
                  {requesterName.slice(0, 2).toUpperCase()}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.detailRequestorName} numberOfLines={1}>
                  {requesterName}
                </Text>
                <Text style={{ fontSize: 12, color: resolveColor('#658172', 'color'), marginTop: 2 }}>
                  📞 {displayPhone}
                </Text>
              </View>
            </View>

            {rawPhone ? (
              <View style={styles.fullDetailRequesterActions}>
                <TouchableOpacity
                  style={styles.fullDetailCallBtn}
                  activeOpacity={0.8}
                  onPress={handleCall}
                >
                  <Ionicons name="call" size={13} color="#FFFFFF" />
                  <Text style={styles.fullDetailCallBtnText}>Call</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.fullDetailSmsBtn}
                  activeOpacity={0.8}
                  onPress={handleSms}
                >
                  <Ionicons
                    name="chatbubble-outline"
                    size={13}
                    color={resolveColor('#163523', 'color')}
                  />
                  <Text style={styles.fullDetailSmsBtnText}>SMS</Text>
                </TouchableOpacity>
              </View>
            ) : null}
          </View>
        </View>

        {/* 8. Attached Photos & Reference Documents */}
        <View style={styles.fullDetailSectionCard}>
          <View style={styles.fullDetailSectionHeaderRow}>
            <Ionicons
              name="attach-outline"
              size={17}
              color={resolveColor('#163523', 'color')}
            />
            <Text style={styles.fullDetailSectionTitle}>
              Reference Photos & Files ({attachments.length})
            </Text>
          </View>

          {attachments.length > 0 ? (
            <View style={styles.fullDetailAttachmentGrid}>
              {attachments.map((att, idx) => {
                const isImg = att.type === 'image' || !!att.uri;
                return (
                  <View key={att.id || idx}>
                    {isImg ? (
                      <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => setPreviewImage(att.uri)}
                      >
                        <Image
                          source={{ uri: att.uri }}
                          style={styles.fullDetailAttachmentImageThumb}
                        />
                      </TouchableOpacity>
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
            </View>
          ) : (
            <Text style={{ fontSize: 13, color: resolveColor('#658172', 'color') }}>
              No reference photos or documents attached to this Suyo.
            </Text>
          )}
        </View>
      </View>

      {/* Fullscreen Photo Preview Modal if tapped */}
      {previewImage && (
        <Modal
          visible={!!previewImage}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setPreviewImage(null)}
        >
          <View style={cardStyles.previewBackdrop}>
            <TouchableOpacity
              style={cardStyles.previewCloseBtn}
              onPress={() => setPreviewImage(null)}
            >
              <Ionicons name="close" size={30} color="#FFFFFF" />
            </TouchableOpacity>
            <Image
              source={{ uri: previewImage }}
              style={cardStyles.previewLargeImage}
              resizeMode="contain"
            />
          </View>
        </Modal>
      )}
    </View>
  );
}

const cardStyles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E1ECE5',
    padding: 16,
    marginBottom: 20,
    ...(Platform.OS === 'web'
      ? { boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }
      : {
          shadowColor: '#000000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.05,
          shadowRadius: 6,
          elevation: 2,
        }),
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EEF4F0',
  },
  cardHeaderTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  cardHeaderTitle: {
    fontSize: 14.5,
    fontWeight: '900',
    color: '#163523',
    letterSpacing: 0.6,
  },
  postedByBadge: {
    backgroundColor: '#E8F5EE',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CDE5D7',
  },
  postedByBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#166534',
  },
  syncingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 6,
    marginBottom: 8,
  },
  sectionsWrapper: {
    gap: 12,
  },
  previewBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  previewCloseBtn: {
    position: 'absolute',
    top: 40,
    right: 20,
    padding: 10,
    zIndex: 10,
  },
  previewLargeImage: {
    width: '100%',
    height: '80%',
  },
});
