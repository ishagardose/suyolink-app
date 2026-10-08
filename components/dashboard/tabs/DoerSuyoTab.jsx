import AcceptedSuyosList from '../lists/AcceptedSuyosList';
import CompletedSuyosList from '../lists/CompletedSuyosList';
import CancelledSuyosList from '../lists/CancelledSuyosList';
import React from 'react';
import { Text, View, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function DoerSuyoTab({
  activeTab,
  doerAcceptedSuyos,
  doerCancelledSuyos,
  doerCompletedSuyos,
  doerNavTab,
  handleConfirmDeleteDoerCancelled,
  handleToggleDoerCancelledSelect,
  isDoerCancelledEditMode,
  resolveColor,
  router,
  selectedDoerCancelledIds,
  setActiveTab,
  setDoerCancelModalItem,
  setDoerNavTab,
  setIsDoerCancelledEditMode,
  setSelectedDoerCancelledIds,
  setSelectedDoerSuyo,
  styles,
}) {
  return (
    activeTab === 'doer' && (
      <View style={styles.doerMainWrapper}>
        {/* 1. Hero Banner - Placed and styled identically to MySuyo screen */}
        <View style={styles.mySuyoHeroSection}>
          <View style={styles.mySuyoHeroTextCol}>
            <Text style={styles.mySuyoHeroSuper}>DOER SUYO HUB</Text>
            <Text style={styles.mySuyoHeroTitle}>Suyos Done as Doer</Text>
            <Text style={styles.mySuyoHeroSub}>
              Manage active accepted suyos and review your completed history
            </Text>
          </View>
          <View style={styles.mySuyoHeroBadge}>
            <Ionicons
              name="bicycle-outline"
              size={24}
              color={resolveColor('#163925', 'color')}
            />
          </View>
        </View>

        {/* 2. Modern Text Navigation: Accepted, Completed, Cancelled (Identical to MySuyo screen) */}
        <View style={styles.mySuyoTextNavWrapper}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            nestedScrollEnabled
            contentContainerStyle={styles.mySuyoTextNavRow}
            style={{ flexGrow: 0 }}
            testID="doer-status-tabs"
          >
            {/* Accepted Tab */}
            <TouchableOpacity
              style={[styles.mySuyoTextNavItem, { flexShrink: 0 }]}
              accessibilityRole="tab"
              accessibilityState={{ selected: doerNavTab === 'accepted' }}
              activeOpacity={0.7}
              onPress={() => {
                setDoerNavTab('accepted');
                setIsDoerCancelledEditMode(false);
                setSelectedDoerCancelledIds([]);
              }}
            >
              <Text
                style={[
                  styles.mySuyoTextNavTitle,
                  doerNavTab === 'accepted' && styles.mySuyoTextNavTitleActive,
                ]}
              >
                Accepted
              </Text>
              <Text
                style={[
                  styles.mySuyoTextNavCount,
                  doerNavTab === 'accepted' && styles.mySuyoTextNavCountActive,
                ]}
              >
                ({doerAcceptedSuyos.length})
              </Text>
              {doerNavTab === 'accepted' && (
                <View style={styles.mySuyoTextNavUnderline} />
              )}
            </TouchableOpacity>

            {/* Completed Tab */}
            <TouchableOpacity
              style={[styles.mySuyoTextNavItem, { flexShrink: 0 }]}
              accessibilityRole="tab"
              accessibilityState={{ selected: doerNavTab === 'completed' }}
              activeOpacity={0.7}
              onPress={() => {
                setDoerNavTab('completed');
                setIsDoerCancelledEditMode(false);
                setSelectedDoerCancelledIds([]);
              }}
            >
              <Text
                style={[
                  styles.mySuyoTextNavTitle,
                  doerNavTab === 'completed' && styles.mySuyoTextNavTitleActive,
                ]}
              >
                Completed
              </Text>
              <Text
                style={[
                  styles.mySuyoTextNavCount,
                  doerNavTab === 'completed' && styles.mySuyoTextNavCountActive,
                ]}
              >
                ({doerCompletedSuyos.length})
              </Text>
              {doerNavTab === 'completed' && (
                <View style={styles.mySuyoTextNavUnderline} />
              )}
            </TouchableOpacity>

            {/* Cancelled Tab */}
            <TouchableOpacity
              style={[styles.mySuyoTextNavItem, { flexShrink: 0 }]}
              accessibilityRole="tab"
              accessibilityState={{ selected: doerNavTab === 'cancelled' }}
              activeOpacity={0.7}
              onPress={() => {
                setDoerNavTab('cancelled');
                setIsDoerCancelledEditMode(false);
                setSelectedDoerCancelledIds([]);
              }}
            >
              <Text
                style={[
                  styles.mySuyoTextNavTitle,
                  doerNavTab === 'cancelled' && styles.mySuyoTextNavTitleActive,
                ]}
              >
                Cancelled
              </Text>
              <Text
                style={[
                  styles.mySuyoTextNavCount,
                  doerNavTab === 'cancelled' && styles.mySuyoTextNavCountActive,
                ]}
              >
                ({doerCancelledSuyos.length})
              </Text>
              {doerNavTab === 'cancelled' && (
                <View style={styles.mySuyoTextNavUnderline} />
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* 3. Sub-bar: Title & Subtitle on Left, Edit feature on Right (for Cancelled tab only, matching sample) */}
        <View style={styles.mySuyoSubBar}>
          {/* Title & subtitle on the left side */}
          <View style={{ flex: 1, paddingRight: 8 }}>
            <Text style={styles.mySuyoSubBarTitle}>
              {doerNavTab === 'accepted'
                ? 'Accepted Suyos'
                : doerNavTab === 'completed'
                  ? 'Completed Suyos'
                  : 'Cancelled Suyos'}
            </Text>
            <Text style={styles.mySuyoSubBarSubtitle}>
              {doerNavTab === 'accepted'
                ? 'Couriers currently fulfilling these suyos'
                : doerNavTab === 'completed'
                  ? 'Successfully fulfilled suyos history'
                  : 'Tap Edit to delete unwanted cancelled suyos'}
            </Text>
          </View>

          {/* Edit feature placed on the RIGHT side - ONLY for Cancelled tab */}
          {doerNavTab === 'cancelled' && doerCancelledSuyos.length > 0 && (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
              }}
            >
              {isDoerCancelledEditMode && (
                <TouchableOpacity
                  onPress={() => {
                    if (
                      selectedDoerCancelledIds.length ===
                      doerCancelledSuyos.length
                    ) {
                      setSelectedDoerCancelledIds([]);
                    } else {
                      setSelectedDoerCancelledIds(
                        doerCancelledSuyos.map((item) => item.id),
                      );
                    }
                  }}
                  hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                >
                  <Text style={styles.mySuyoSelectAllText}>
                    {selectedDoerCancelledIds.length ===
                    doerCancelledSuyos.length
                      ? 'Deselect all'
                      : 'Select all'}
                  </Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                onPress={() => {
                  setIsDoerCancelledEditMode((prev) => !prev);
                  setSelectedDoerCancelledIds([]);
                }}
                activeOpacity={0.6}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={styles.mySuyoFadingEditText}>
                  {isDoerCancelledEditMode ? 'Cancel' : 'Edit'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* 3. Tab Content */}
        {/* --- TAB A: ACCEPTED SUYOS (With Cancel as Doer!) --- */}
        <AcceptedSuyosList
          doerAcceptedSuyos={doerAcceptedSuyos}
          doerNavTab={doerNavTab}
          resolveColor={resolveColor}
          router={router}
          setActiveTab={setActiveTab}
          setDoerCancelModalItem={setDoerCancelModalItem}
          setSelectedDoerSuyo={setSelectedDoerSuyo}
          styles={styles}
        />

        {/* --- TAB B: COMPLETED SUYOS (Doer Completed History) --- */}
        <CompletedSuyosList
          doerCompletedSuyos={doerCompletedSuyos}
          doerNavTab={doerNavTab}
          resolveColor={resolveColor}
          setSelectedDoerSuyo={setSelectedDoerSuyo}
          styles={styles}
        />

        {/* --- TAB C: CANCELLED SUYOS --- */}
        <CancelledSuyosList
          doerCancelledSuyos={doerCancelledSuyos}
          doerNavTab={doerNavTab}
          handleConfirmDeleteDoerCancelled={handleConfirmDeleteDoerCancelled}
          handleToggleDoerCancelledSelect={handleToggleDoerCancelledSelect}
          isDoerCancelledEditMode={isDoerCancelledEditMode}
          resolveColor={resolveColor}
          selectedDoerCancelledIds={selectedDoerCancelledIds}
          setIsDoerCancelledEditMode={setIsDoerCancelledEditMode}
          setSelectedDoerCancelledIds={setSelectedDoerCancelledIds}
          setSelectedDoerSuyo={setSelectedDoerSuyo}
          styles={styles}
        />
      </View>
    )
  );
}
