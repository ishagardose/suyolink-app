import MySuyoStatusNav from '../navigation/MySuyoStatusNav';
import MySuyoCard from '../cards/MySuyoCard';
import React from 'react';
import { Text, View, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function MySuyoTab({
  acceptedSuyos,
  activeTab,
  archivedSuyos,
  cancelledSuyos,
  completedSuyos,
  handleBoostReward,
  handleConfirmDeleteMySuyo,
  handleOpenSuyoDetail,
  handleToggleMySuyoSelect,
  isMySuyoEditMode,
  mySuyoNavTab,
  postedSuyos,
  resolveColor,
  selectedMySuyoIdsToDelete,
  setIsMySuyoEditMode,
  setMySuyoNavTab,
  setSelectedMySuyoIdsToDelete,
  styles,
}) {
  return (
    activeTab === 'mysuyo' && (
      <View style={styles.mySuyoMainWrapper}>
        {/* MySuyo Hero Banner */}
        <View style={styles.mySuyoHeroSection}>
          <View style={styles.mySuyoHeroTextCol}>
            <Text style={styles.mySuyoHeroSuper}>MY SUYO HUB</Text>
            <Text style={styles.mySuyoHeroTitle}>Requested Suyos</Text>
            <Text style={styles.mySuyoHeroSub}>
              Manage, track, boost, and repeat your requested suyos
            </Text>
          </View>
          <View style={styles.mySuyoHeroBadge}>
            <Ionicons
              name="receipt-outline"
              size={24}
              color={resolveColor('#163925', 'color')}
            />
          </View>
        </View>

        {/* Modern Text Navigation: Posted, Accepted, Completed, Archived (Zero chunky button pills) */}
        <MySuyoStatusNav
          acceptedSuyos={acceptedSuyos}
          archivedSuyos={archivedSuyos}
          cancelledSuyos={cancelledSuyos}
          completedSuyos={completedSuyos}
          mySuyoNavTab={mySuyoNavTab}
          postedSuyos={postedSuyos}
          setIsMySuyoEditMode={setIsMySuyoEditMode}
          setMySuyoNavTab={setMySuyoNavTab}
          setSelectedMySuyoIdsToDelete={setSelectedMySuyoIdsToDelete}
          styles={styles}
        />

        {/* Sub-bar with title, status note, and fading text 'Edit' */}
        <View style={styles.mySuyoSubBar}>
          <View style={{ flex: 1, paddingRight: 8 }}>
            <Text style={styles.mySuyoSubBarTitle}>
              {mySuyoNavTab === 'posted'
                ? 'Posted Suyos'
                : mySuyoNavTab === 'accepted'
                  ? 'Accepted Suyos'
                  : mySuyoNavTab === 'completed'
                    ? 'Completed Suyos'
                    : mySuyoNavTab === 'cancelled'
                      ? 'Cancelled Suyos'
                      : 'Archived Suyos'}
            </Text>
            <Text style={styles.mySuyoSubBarSubtitle}>
              {mySuyoNavTab === 'posted'
                ? 'Awaiting courier acceptance · Boost reward to speed up'
                : mySuyoNavTab === 'accepted'
                  ? 'Couriers currently fulfilling these suyos'
                  : mySuyoNavTab === 'completed'
                    ? 'Successfully fulfilled suyos from past to present'
                    : mySuyoNavTab === 'cancelled'
                      ? 'Tap Edit to delete unwanted cancelled suyos'
                      : 'Saved templates for quick 1-tap repeating'}
            </Text>
          </View>

          {/* REMOVE Edit feature from accepted, completed, AND posted! Allow on cancelled nav to delete unwanted suyos */}
          {(mySuyoNavTab === 'cancelled' || mySuyoNavTab === 'archived') &&
            (mySuyoNavTab === 'cancelled' ? cancelledSuyos : archivedSuyos)
              .length > 0 && (
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                }}
              >
                {isMySuyoEditMode && (
                  <TouchableOpacity
                    onPress={() => {
                      const currentList =
                        mySuyoNavTab === 'cancelled'
                          ? cancelledSuyos
                          : archivedSuyos;
                      if (
                        selectedMySuyoIdsToDelete.length === currentList.length
                      ) {
                        setSelectedMySuyoIdsToDelete([]);
                      } else {
                        setSelectedMySuyoIdsToDelete(
                          currentList.map((item) => item.id),
                        );
                      }
                    }}
                    hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                  >
                    <Text style={styles.mySuyoSelectAllText}>
                      {selectedMySuyoIdsToDelete.length ===
                      (mySuyoNavTab === 'cancelled'
                        ? cancelledSuyos
                        : archivedSuyos
                      ).length
                        ? 'Deselect all'
                        : 'Select all'}
                    </Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  onPress={() => {
                    setIsMySuyoEditMode((prev) => !prev);
                    setSelectedMySuyoIdsToDelete([]);
                  }}
                  activeOpacity={0.6}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={styles.mySuyoFadingEditText}>
                    {isMySuyoEditMode ? 'Cancel' : 'Edit'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
        </View>

        {/* List of Suyos (Rendered based on selected tab) */}
        <View style={styles.mySuyoCardsList}>
          {(() => {
            const currentList =
              mySuyoNavTab === 'posted'
                ? postedSuyos
                : mySuyoNavTab === 'accepted'
                  ? acceptedSuyos
                  : mySuyoNavTab === 'completed'
                    ? completedSuyos
                    : mySuyoNavTab === 'cancelled'
                      ? cancelledSuyos
                      : archivedSuyos;

            if (currentList.length === 0) {
              return (
                <View style={styles.mySuyoEmptyBox}>
                  <Ionicons
                    name={
                      mySuyoNavTab === 'posted'
                        ? 'paper-plane-outline'
                        : mySuyoNavTab === 'accepted'
                          ? 'bicycle-outline'
                          : mySuyoNavTab === 'completed'
                            ? 'ribbon-outline'
                            : mySuyoNavTab === 'cancelled'
                              ? 'close-circle-outline'
                              : 'bookmark-outline'
                    }
                    size={40}
                    color={resolveColor('#A3B8AC', 'color')}
                  />
                  <Text style={styles.mySuyoEmptyTitle}>
                    {mySuyoNavTab === 'posted'
                      ? 'No pending posted suyos'
                      : mySuyoNavTab === 'accepted'
                        ? 'No suyos in progress'
                        : mySuyoNavTab === 'completed'
                          ? 'No completed suyos yet'
                          : mySuyoNavTab === 'cancelled'
                            ? 'No cancelled suyos'
                            : 'No archived templates'}
                  </Text>
                  <Text style={styles.mySuyoEmptySub}>
                    {mySuyoNavTab === 'posted'
                      ? "All your suyos have been accepted, or you haven't posted any. Tap Post below to request a suyo!"
                      : mySuyoNavTab === 'accepted'
                        ? 'When a courier accepts one of your posted suyos, it will appear here so you can view the doer profile and track live progress.'
                        : mySuyoNavTab === 'completed'
                          ? 'Finished suyos will appear here with the courier who completed them.'
                          : mySuyoNavTab === 'cancelled'
                            ? 'You have not cancelled any of your requested suyos.'
                            : 'Save completed or frequent suyos to your archive so you can repeat them with a single tap!'}
                  </Text>
                </View>
              );
            }

            return currentList.map((suyo) => {
              const isSelected = selectedMySuyoIdsToDelete.includes(suyo.id);
              return (
                <MySuyoCard
                  key={suyo.id}
                  handleBoostReward={handleBoostReward}
                  handleOpenSuyoDetail={handleOpenSuyoDetail}
                  handleToggleMySuyoSelect={handleToggleMySuyoSelect}
                  isMySuyoEditMode={isMySuyoEditMode}
                  isSelected={isSelected}
                  mySuyoNavTab={mySuyoNavTab}
                  resolveColor={resolveColor}
                  styles={styles}
                  suyo={suyo}
                />
              );
            });
          })()}
        </View>

        {/* Bottom Edit Action Bar when in Edit Mode */}
        {isMySuyoEditMode && (
          <View style={styles.mySuyoEditFloatingBar}>
            <TouchableOpacity
              style={styles.mySuyoCancelEditBtn}
              onPress={() => {
                setIsMySuyoEditMode(false);
                setSelectedMySuyoIdsToDelete([]);
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.mySuyoCancelEditText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.mySuyoConfirmDeleteBtn,
                selectedMySuyoIdsToDelete.length === 0 &&
                  styles.mySuyoConfirmDeleteBtnDisabled,
              ]}
              onPress={handleConfirmDeleteMySuyo}
              disabled={selectedMySuyoIdsToDelete.length === 0}
              activeOpacity={0.8}
            >
              <Ionicons
                name="trash-outline"
                size={14}
                color={
                  selectedMySuyoIdsToDelete.length > 0
                    ? resolveColor('#FFFFFF', 'color')
                    : resolveColor('#8CA395', 'color')
                }
              />
              <Text
                style={[
                  styles.mySuyoConfirmDeleteBtnText,
                  selectedMySuyoIdsToDelete.length === 0 &&
                    styles.mySuyoConfirmDeleteBtnTextDisabled,
                ]}
              >
                {selectedMySuyoIdsToDelete.length > 0
                  ? `Remove Selected (${selectedMySuyoIdsToDelete.length})`
                  : 'Select items to remove'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    )
  );
}
