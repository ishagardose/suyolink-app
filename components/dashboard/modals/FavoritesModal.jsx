import React from 'react';
import { getInitials } from '../utils/dashboardHelpers';
import { Text, View, ScrollView, TouchableOpacity, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function FavoritesModal({
  favoriteSuyos,
  handleCloseFavoritesModal,
  handleConfirmDeleteSelectedFavs,
  handleOpenSuyoDetail,
  handleToggleFavDeleteMode,
  handleToggleSelectFavToDelete,
  isFavDeleteMode,
  isFavoritesModalOpen,
  resolveColor,
  selectedFavIdsToDelete,
  setIsFavoritesModalOpen,
  setOpenedFromFavorites,
  setSelectedFavIdsToDelete,
  styles,
  toastConfig,
}) {
  return (
    <Modal
      visible={isFavoritesModalOpen}
      animationType="slide"
      transparent={true}
      onRequestClose={handleCloseFavoritesModal}
    >
      <View style={styles.modalBackdrop}>
        <View style={styles.favoritesModalCard}>
          <View style={styles.favoritesModalHeader}>
            <View style={styles.favoritesTitleRow}>
              <Text style={styles.favoritesModalTitle}>
                {isFavDeleteMode ? 'Select to Remove' : 'Saved Favorites'}
              </Text>
              {favoriteSuyos.length > 0 && (
                <View
                  style={[
                    styles.favoritesCountPill,
                    isFavDeleteMode && {
                      backgroundColor: resolveColor(
                        '#FEE2E2',
                        'backgroundColor',
                      ),
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.favoritesCountText,
                      isFavDeleteMode && {
                        color: resolveColor('#DC2626', 'color'),
                      },
                    ]}
                  >
                    {isFavDeleteMode
                      ? `${selectedFavIdsToDelete.length} selected`
                      : favoriteSuyos.length}
                  </Text>
                </View>
              )}
            </View>

            <TouchableOpacity
              onPress={handleCloseFavoritesModal}
              style={styles.modalCloseButton}
              activeOpacity={0.7}
            >
              <Ionicons
                name="close"
                size={18}
                color={resolveColor('#163523', 'color')}
              />
            </TouchableOpacity>
          </View>

          {/* Sub-header row with fading text 'Edit' */}
          <View style={styles.favSubHeaderRow}>
            <Text style={styles.favoritesModalSub}>
              {isFavDeleteMode
                ? 'Tap items to select what to remove:'
                : "Suyos you've saved to review or fulfill later"}
            </Text>

            {favoriteSuyos.length > 0 && (
              <View style={styles.favSubHeaderActions}>
                {isFavDeleteMode && favoriteSuyos.length > 1 && (
                  <TouchableOpacity
                    onPress={() => {
                      if (
                        selectedFavIdsToDelete.length === favoriteSuyos.length
                      ) {
                        setSelectedFavIdsToDelete([]);
                      } else {
                        setSelectedFavIdsToDelete(
                          favoriteSuyos.map((s) => s.id),
                        );
                      }
                    }}
                    hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                  >
                    <Text style={styles.favSelectAllText}>
                      {selectedFavIdsToDelete.length === favoriteSuyos.length
                        ? 'Deselect all'
                        : 'Select all'}
                    </Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  onPress={handleToggleFavDeleteMode}
                  activeOpacity={0.6}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={styles.favFadingEditText}>
                    {isFavDeleteMode ? 'Cancel' : 'Edit'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {toastConfig && (
            <View style={styles.favModalToast}>
              <Ionicons
                name={toastConfig.icon === 'heart-dislike' ? 'trash' : 'heart'}
                size={12}
                color={resolveColor('#DC2626', 'color')}
              />
              <Text style={styles.favModalToastText}>
                {toastConfig.message}
              </Text>
            </View>
          )}

          {favoriteSuyos.length > 0 ? (
            <ScrollView
              style={styles.favoritesScrollList}
              contentContainerStyle={{ paddingBottom: 4 }}
              showsVerticalScrollIndicator={false}
            >
              {favoriteSuyos.map((suyo) => {
                const isSelected = selectedFavIdsToDelete.includes(suyo.id);
                return (
                  <TouchableOpacity
                    key={suyo.id}
                    style={[
                      styles.favCardItem,
                      isFavDeleteMode &&
                        isSelected &&
                        styles.favCardItemSelected,
                    ]}
                    activeOpacity={0.85}
                    onPress={() => {
                      if (isFavDeleteMode) {
                        handleToggleSelectFavToDelete(suyo.id);
                      } else {
                        setOpenedFromFavorites(true);
                        setIsFavoritesModalOpen(false);
                        handleOpenSuyoDetail(suyo);
                      }
                    }}
                  >
                    <View style={styles.favCardTopRow}>
                      {isFavDeleteMode && (
                        <View
                          style={[
                            styles.favSelectionCircle,
                            isSelected && styles.favSelectionCircleSelected,
                          ]}
                        >
                          {isSelected && (
                            <Ionicons
                              name="checkmark"
                              size={11}
                              color={resolveColor('#FFFFFF', 'color')}
                            />
                          )}
                        </View>
                      )}

                      <View style={{ flex: 1, paddingRight: 8 }}>
                        <Text
                          style={styles.favCardTitle}
                          numberOfLines={2}
                        >
                          {suyo.title}
                        </Text>
                        <Text style={styles.favCardLocation}>
                          <Ionicons
                            name="location-sharp"
                            size={10.5}
                            color={resolveColor('#0D9488', 'color')}
                          />{' '}
                          {suyo.location || 'Quezon City'} •{' '}
                          {suyo.distanceText || '0.8 km away'}
                        </Text>
                      </View>

                      <View
                        style={{
                          alignItems: 'flex-end',
                          justifyContent: 'center',
                        }}
                      >
                        <Text style={styles.favCardReward}>{suyo.reward}</Text>
                      </View>
                    </View>

                    <View
                      style={[
                        styles.favCardBottomRow,
                        isFavDeleteMode && { paddingLeft: 25 },
                      ]}
                    >
                      <View style={styles.favCardRequestorRow}>
                        <View style={styles.favAvatarCircle}>
                          <Text style={styles.favAvatarInitials}>
                            {suyo.requesterInitials ||
                              getInitials(
                                suyo.requesterName || 'Maria Clarissa',
                              )}
                          </Text>
                        </View>
                        <Text style={styles.favCardRequestorName}>
                          {suyo.requesterName || 'Maria Clarissa'}
                        </Text>
                      </View>

                      <View
                        style={[
                          styles.favTagPill,
                          suyo.tag === 'Urgent'
                            ? styles.favTagUrgent
                            : suyo.tag === 'Due today'
                              ? styles.favTagToday
                              : suyo.tag === 'Normal'
                                ? styles.favTagNormal
                                : styles.favTagTomorrow,
                        ]}
                      >
                        <Text
                          style={[
                            styles.favTagPillText,
                            suyo.tag === 'Urgent'
                              ? styles.favTagUrgentText
                              : suyo.tag === 'Due today'
                                ? styles.favTagTodayText
                                : suyo.tag === 'Normal'
                                  ? styles.favTagNormalText
                                  : styles.favTagTomorrowText,
                          ]}
                        >
                          {suyo.tag}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          ) : (
            <View style={styles.favEmptyBox}>
              <Ionicons
                name="bookmark-outline"
                size={36}
                color={resolveColor('#A3B8AC', 'color')}
              />
              <Text style={styles.favEmptyTitle}>No saved suyos yet</Text>
              <Text style={styles.favEmptySub}>
                Tap the heart icon on any suyo to save it here for later.
              </Text>
            </View>
          )}

          {isFavDeleteMode ? (
            <View style={styles.favDeleteActionsRow}>
              <TouchableOpacity
                style={styles.favCancelBottomBtn}
                onPress={handleToggleFavDeleteMode}
                activeOpacity={0.7}
              >
                <Text style={styles.favCancelBottomBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.favConfirmDeleteBtn,
                  selectedFavIdsToDelete.length === 0 &&
                    styles.favConfirmDeleteBtnDisabled,
                ]}
                onPress={handleConfirmDeleteSelectedFavs}
                disabled={selectedFavIdsToDelete.length === 0}
                activeOpacity={0.8}
              >
                <Ionicons
                  name="trash-outline"
                  size={13.5}
                  color={
                    selectedFavIdsToDelete.length > 0
                      ? resolveColor('#FFFFFF', 'color')
                      : resolveColor('#8CA395', 'color')
                  }
                />
                <Text
                  style={[
                    styles.favConfirmDeleteBtnText,
                    selectedFavIdsToDelete.length === 0 &&
                      styles.favConfirmDeleteBtnTextDisabled,
                  ]}
                >
                  {selectedFavIdsToDelete.length > 0
                    ? `Remove Selected (${selectedFavIdsToDelete.length})`
                    : 'Select to remove'}
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.favCloseBottomBtn}
              onPress={handleCloseFavoritesModal}
              activeOpacity={0.7}
            >
              <Text style={styles.favCloseBottomBtnText}>Done</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
}
