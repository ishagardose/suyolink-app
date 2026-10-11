import SuyoContactDetails from '../details/SuyoContactDetails';
import SuyoRewardBoost from '../details/SuyoRewardBoost';
import SuyoDetailActions from '../details/SuyoDetailActions';
import SuyoFullDetailsModal from './SuyoFullDetailsModal';
import React, { useState, useRef, useEffect } from 'react';
import { getRequestTiming } from '../../../lib/requestTiming';
import { useSuyos } from '../../../context/SuyoContext';

import {
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Modal,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function SuyoDetailModal({
  busy,
  error,
  archivedSuyos,
  favoriteSuyoIds,
  handleBoostReward,
  handleCallDoer,
  handleCancelSuyo,
  handleCloseDetailModal,
  handleOpenEditSuyo,
  handleRepeatRequest,
  handleSaveToArchive,
  resolveColor,
  router,
  selectedSuyo,
  selectedSuyoContext,
  setCancelledSuyos,
  setDoerAcceptedSuyos,
  setOpenedFromFavorites,
  setSelectedSuyo,
  styles,
  toggleFavoriteSuyo,
  triggerToast,
  userProfile,
}) {
  const { mutate } = useSuyos();
  const [isFullDetailsOpen, setIsFullDetailsOpen] = useState(false);
  const accepting = useRef(false);
  const [acceptBusy, setAcceptBusy] = useState(false);

  useEffect(() => {
    setIsFullDetailsOpen(false);
  }, [selectedSuyo?.id]);

  const handleAccept = async () => {
    if (accepting.current || !selectedSuyo?.id) return;
    accepting.current = true;
    setAcceptBusy(true);
    try {
      await mutate('accept_suyo', { p_request_id: selectedSuyo.id });
      const id = selectedSuyo.id;
      setSelectedSuyo(null);
      setOpenedFromFavorites(false);
      setIsFullDetailsOpen(false);
      router.push({ pathname: '/fulfill', params: { id } });
    } catch (err) {
      triggerToast(
        err.message || 'Could not accept this task. Please retry.',
        'alert-circle',
      );
    } finally {
      accepting.current = false;
      setAcceptBusy(false);
    }
  };

  return (
    selectedSuyo && (
      <Modal
        visible={!!selectedSuyo}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          if (!busy) {
            if (isFullDetailsOpen) {
              setIsFullDetailsOpen(false);
            } else {
              handleCloseDetailModal();
            }
          }
        }}
      >
        <View style={styles.modalBackdrop}>
          {isFullDetailsOpen ? (
            <SuyoFullDetailsModal
              selectedSuyo={selectedSuyo}
              onBack={() => setIsFullDetailsOpen(false)}
              onClose={() => {
                setIsFullDetailsOpen(false);
                handleCloseDetailModal();
              }}
              handleAccept={handleAccept}
              acceptBusy={acceptBusy}
              resolveColor={resolveColor}
              styles={styles}
            />
          ) : (
            <View
              style={styles.suyoDetailModalCard}
              pointerEvents={busy ? 'none' : 'auto'}
            >
            {busy ? (
              <Text
                accessibilityLiveRegion="polite"
                style={styles.detailBoostSubtitle}
              >
                Saving changes...
              </Text>
            ) : null}
            {error ? (
              <Text
                accessibilityRole="alert"
                style={{
                  color: resolveColor('#DC2626', 'color'),
                  marginBottom: 8,
                }}
              >
                {error}
              </Text>
            ) : null}
            {/* Top Meta Bar: Time & Date on Left, Action/Close on Right */}
            <View style={styles.detailTopMetaRow}>
              <View style={styles.detailTopMetaLeft}>
                <Ionicons
                  name="time-outline"
                  size={13}
                  color={resolveColor('#658172', 'color')}
                />
                <Text style={styles.detailPostedTimeText}>
                  {`Posted: ${selectedSuyo.formattedDate || getRequestTiming(selectedSuyo.rawRequest || selectedSuyo).formattedDate}`}
                </Text>
              </View>

              <View style={styles.detailTopMetaRight}>
                {selectedSuyoContext === 'available' && (
                  <TouchableOpacity
                    style={styles.detailHeartBtn}
                    activeOpacity={0.7}
                    onPress={() => toggleFavoriteSuyo(selectedSuyo)}
                    hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                  >
                    <Ionicons
                      name={
                        favoriteSuyoIds.includes(selectedSuyo.id)
                          ? 'heart'
                          : 'heart-outline'
                      }
                      size={22}
                      color={
                        favoriteSuyoIds.includes(selectedSuyo.id)
                          ? resolveColor('#DC2626', 'color')
                          : resolveColor('#6B8576', 'color')
                      }
                    />
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={styles.detailCloseIconBtn}
                  activeOpacity={0.7}
                  onPress={handleCloseDetailModal}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons
                    name="close"
                    size={19}
                    color={resolveColor('#6B8576', 'color')}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Title & Status Row: Status placed at opposite side, in line with Title */}
            {(() => {
              const timing = getRequestTiming(selectedSuyo.rawRequest || selectedSuyo);
              const rawUrgency =
                selectedSuyo.urgency ||
                selectedSuyo.rawRequest?.urgency ||
                (timing.overdue ? 'Urgent' : null);

              const isCancelled =
                selectedSuyo.status === 'Cancelled' || selectedSuyo.status === 'cancelled';
              const isCompleted =
                selectedSuyoContext === 'completed' ||
                selectedSuyo.status === 'completed' ||
                selectedSuyo.status?.includes?.('Completed');
              const isAccepted =
                selectedSuyoContext === 'accepted' ||
                ['assigned', 'in_progress', 'working', 'en_route'].includes(selectedSuyo.status) ||
                selectedSuyo.status?.includes?.('In Progress') ||
                selectedSuyo.status?.includes?.('Accepted');
              const isArchived = selectedSuyoContext === 'archived';

              let currentStatusLabel = 'Open';
              let currentStatusBg = '#E8F5EE';
              let currentStatusColor = '#1E4D2B';
              let currentStatusIcon = null;

              if (isCancelled) {
                currentStatusLabel = 'Cancelled';
                currentStatusBg = '#FEE2E2';
                currentStatusColor = '#DC2626';
              } else if (isCompleted) {
                currentStatusLabel = 'Completed';
                currentStatusBg = '#DCFCE7';
                currentStatusColor = '#15803D';
              } else if (isAccepted) {
                currentStatusLabel = 'In Progress';
                currentStatusBg = '#E0F2FE';
                currentStatusColor = '#0369A1';
              } else if (isArchived) {
                currentStatusLabel = 'Archived';
                currentStatusBg = '#F1F5F9';
                currentStatusColor = '#475569';
              } else if (rawUrgency === 'Urgent') {
                currentStatusLabel = 'Urgent';
                currentStatusBg = '#FEF2F2';
                currentStatusColor = '#DC2626';
                currentStatusIcon = 'flame';
              } else if (rawUrgency === 'Due today') {
                currentStatusLabel = 'Due today';
                currentStatusBg = '#FEF3C7';
                currentStatusColor = '#D97706';
                currentStatusIcon = 'alarm';
              } else if (rawUrgency === 'Due tomorrow') {
                currentStatusLabel = 'Due tomorrow';
                currentStatusBg = '#F0FDF4';
                currentStatusColor = '#15803D';
              }

              return (
                <View style={styles.detailTitleAndStatusRow}>
                  <Text style={styles.detailCardTitleInRow}>
                    {selectedSuyo.title}
                  </Text>

                  <View
                    style={[
                      styles.detailStatusPillInline,
                      {
                        backgroundColor: resolveColor(
                          currentStatusBg,
                          'backgroundColor',
                        ),
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: currentStatusIcon ? 4 : 0,
                      },
                    ]}
                  >
                    {currentStatusIcon ? (
                      <Ionicons
                        name={currentStatusIcon}
                        size={11}
                        color={resolveColor(currentStatusColor, 'color')}
                      />
                    ) : null}
                    <Text
                      style={[
                        styles.detailStatusPillInlineText,
                        { color: resolveColor(currentStatusColor, 'color') },
                      ]}
                    >
                      {currentStatusLabel}
                    </Text>
                  </View>
                </View>
              );
            })()}

            <View style={styles.detailDivider} />

            {/* In Accepted or Completed: Show Who Accepted/Fulfilled It */}
            <SuyoContactDetails
              handleCallDoer={handleCallDoer}
              resolveColor={resolveColor}
              router={router}
              selectedSuyo={selectedSuyo}
              selectedSuyoContext={selectedSuyoContext}
              setSelectedSuyo={setSelectedSuyo}
              styles={styles}
              userProfile={userProfile}
            />

            <View style={styles.detailDivider} />

            {/* Reward & Location Stats */}
            <View style={styles.detailStatsRow}>
              <View style={styles.detailStatCol}>
                <Text style={styles.detailStatLabel}>REWARD</Text>
                <Text style={styles.detailRewardAmount}>
                  {selectedSuyo.rewardAmount
                    ? `₱${Number(selectedSuyo.rewardAmount).toFixed(2)}`
                    : selectedSuyo.reward && selectedSuyo.reward.startsWith('₱')
                      ? `${selectedSuyo.reward}.00`
                      : '₱150.00'}
                </Text>
              </View>

              <View style={styles.detailStatCol}>
                <Text style={styles.detailStatLabel}>LOCATION</Text>
                <View style={styles.detailLocationRow}>
                  <Ionicons
                    name="location-sharp"
                    size={17}
                    color={resolveColor('#0D9488', 'color')}
                  />
                  <Text
                    style={styles.detailLocationName}
                    numberOfLines={1}
                  >
                    {selectedSuyo.location || 'SM Tagum'}
                  </Text>
                </View>
              </View>
            </View>

            <Text style={styles.detailTaskHeading}>Task Description</Text>
            <Text style={styles.detailTaskBody}>
              {selectedSuyo.details}
              {selectedSuyo.notes ? ` ${selectedSuyo.notes}` : ''}
            </Text>

            {/* Attached Photos & Files Section */}
            {selectedSuyo.attachments &&
              selectedSuyo.attachments.length > 0 && (
                <View style={styles.detailAttachmentsSection}>
                  <View style={styles.detailAttachmentsHeaderRow}>
                    <Ionicons
                      name="attach"
                      size={15}
                      color={resolveColor('#1E4D2B', 'color')}
                    />
                    <Text style={styles.detailAttachmentsHeading}>
                      Attached Photos & Files ({selectedSuyo.attachments.length}
                      )
                    </Text>
                  </View>

                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.detailAttachmentsScroll}
                  >
                    {selectedSuyo.attachments.map((att, idx) => {
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

            {/* FEATURE: Prompt to Increase Reward if Waiting Long in Posted Nav */}
            <SuyoRewardBoost
              handleBoostReward={handleBoostReward}
              resolveColor={resolveColor}
              selectedSuyo={selectedSuyo}
              selectedSuyoContext={selectedSuyoContext}
              styles={styles}
            />

            {/* Dynamic Action Buttons Row (Context-Specific) */}
            <SuyoDetailActions
              archivedSuyos={archivedSuyos}
              handleCallDoer={handleCallDoer}
              handleCancelSuyo={handleCancelSuyo}
              handleCloseDetailModal={handleCloseDetailModal}
              handleOpenEditSuyo={handleOpenEditSuyo}
              handleRepeatRequest={handleRepeatRequest}
              handleSaveToArchive={handleSaveToArchive}
              resolveColor={resolveColor}
              router={router}
              selectedSuyo={selectedSuyo}
              selectedSuyoContext={selectedSuyoContext}
              setCancelledSuyos={setCancelledSuyos}
              setDoerAcceptedSuyos={setDoerAcceptedSuyos}
              setOpenedFromFavorites={setOpenedFromFavorites}
              setSelectedSuyo={setSelectedSuyo}
              styles={styles}
              triggerToast={triggerToast}
              onOpenFullDetails={() => setIsFullDetailsOpen(true)}
              handleAccept={handleAccept}
              acceptBusy={acceptBusy}
            />
          </View>
          )}
        </View>
      </Modal>
    )
  );
}
