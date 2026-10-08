import SuyoContactDetails from '../details/SuyoContactDetails';
import SuyoRewardBoost from '../details/SuyoRewardBoost';
import SuyoDetailActions from '../details/SuyoDetailActions';
import React from 'react';

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
  return (
    selectedSuyo && (
      <Modal
        visible={!!selectedSuyo}
        animationType="slide"
        transparent={true}
        onRequestClose={handleCloseDetailModal}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.suyoDetailModalCard}>
            {/* Top Meta Bar: Time & Date on Left, Action/Close on Right */}
            <View style={styles.detailTopMetaRow}>
              <View style={styles.detailTopMetaLeft}>
                <Ionicons
                  name="time-outline"
                  size={13}
                  color={resolveColor('#658172', 'color')}
                />
                <Text style={styles.detailPostedTimeText}>
                  {selectedSuyoContext === 'posted'
                    ? `Posted: ${selectedSuyo.formattedDate || 'Sep 28 · 11:20 AM'}`
                    : selectedSuyoContext === 'accepted'
                      ? `Accepted: ${selectedSuyo.formattedDate || 'Today · 4:00 PM'}`
                      : selectedSuyoContext === 'completed'
                        ? `Completed: ${selectedSuyo.formattedDate || 'Sep 20 · 3:15 PM'}`
                        : selectedSuyoContext === 'archived'
                          ? `Archived: ${selectedSuyo.formattedDate || 'Sep 18 · 9:15 AM'}`
                          : `Posted: ${selectedSuyo.formattedDate || selectedSuyo.postedTime || '10m ago'}`}
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
            <View style={styles.detailTitleAndStatusRow}>
              <Text style={styles.detailCardTitleInRow}>
                {selectedSuyo.title}
              </Text>

              <View
                style={[
                  styles.detailStatusPillInline,
                  selectedSuyo.status === 'Cancelled'
                    ? {
                        backgroundColor: resolveColor(
                          '#FEE2E2',
                          'backgroundColor',
                        ),
                      }
                    : selectedSuyoContext === 'completed' ||
                        selectedSuyo.status?.includes('Completed')
                      ? {
                          backgroundColor: resolveColor(
                            '#DCFCE7',
                            'backgroundColor',
                          ),
                        }
                      : selectedSuyoContext === 'accepted' ||
                          selectedSuyo.status?.includes('In Progress')
                        ? {
                            backgroundColor: resolveColor(
                              '#E0F2FE',
                              'backgroundColor',
                            ),
                          }
                        : selectedSuyoContext === 'archived'
                          ? {
                              backgroundColor: resolveColor(
                                '#F1F5F9',
                                'backgroundColor',
                              ),
                            }
                          : {
                              backgroundColor: resolveColor(
                                '#E0F2FE',
                                'backgroundColor',
                              ),
                            },
                ]}
              >
                <Text
                  style={[
                    styles.detailStatusPillInlineText,
                    selectedSuyo.status === 'Cancelled'
                      ? { color: resolveColor('#DC2626', 'color') }
                      : selectedSuyoContext === 'completed' ||
                          selectedSuyo.status?.includes('Completed')
                        ? { color: resolveColor('#15803D', 'color') }
                        : selectedSuyoContext === 'accepted' ||
                            selectedSuyo.status?.includes('In Progress')
                          ? { color: resolveColor('#0369A1', 'color') }
                          : selectedSuyoContext === 'archived'
                            ? { color: resolveColor('#475569', 'color') }
                            : { color: resolveColor('#0369A1', 'color') },
                  ]}
                >
                  {selectedSuyo.status === 'Cancelled'
                    ? 'Cancelled'
                    : selectedSuyoContext === 'completed' ||
                        selectedSuyo.status?.includes('Completed')
                      ? 'Completed'
                      : selectedSuyoContext === 'accepted' ||
                          selectedSuyo.status?.includes('In Progress')
                        ? 'Accepted'
                        : selectedSuyoContext === 'archived'
                          ? 'Archived'
                          : 'Open'}
                </Text>
              </View>
            </View>

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
            />
          </View>
        </View>
      </Modal>
    )
  );
}
