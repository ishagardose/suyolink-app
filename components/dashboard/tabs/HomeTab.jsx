import React from 'react';
import { Text, View, TouchableOpacity, TextInput, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function HomeTab({
  activeFiltersCount,
  activeTab,
  availableHeaderTitle,
  availableSuyosBase,
  clearAllFilters,
  filteredSuyos,
  handleOpenSuyoDetail,
  isFiltering,
  resolveColor,
  searchQuery,
  setIsFilterModalOpen,
  setSearchQuery,
  styles,
  userProfile,
}) {
  return (
    activeTab === 'home' && (
      <>
        {/* === HERO SECTION WITH MATCHING SCOOTER COURIER STICKER === */}
        <View style={styles.headerHeroSection}>
          <View style={styles.heroTextBlock}>
            <View style={styles.locationPill}>
              <Ionicons
                name="location-sharp"
                size={11}
                color={resolveColor('#4ADE80', 'color')}
              />
              <Text style={styles.locationPillText}>
                {userProfile?.address || 'Your browsing area'}
              </Text>
            </View>
            <Text style={styles.welcomeSubText}>WELCOME BACK</Text>
            <Text
              style={styles.welcomeNameText}
              numberOfLines={1}
            >
              {userProfile?.name || 'Community member'}
            </Text>
            <Text style={styles.welcomeTagline}>Need a suyo done today?</Text>
          </View>

          <Image
            source={require('../../../assets/scooter_hero_isometric.jpg')}
            style={styles.heroImageSticker}
            resizeMode="contain"
          />
        </View>

        {/* White Content Body */}
        <View style={styles.whiteContentBody}>
          {/* Search Bar + Filter Icon Row */}
          <View style={styles.searchRow}>
            <View style={styles.searchBarContainer}>
              <Ionicons
                name="search-outline"
                size={20}
                color={resolveColor('#7A9384', 'color')}
                style={styles.searchIcon}
              />
              <TextInput
                style={styles.searchInput}
                placeholder="Search suyos..."
                placeholderTextColor={resolveColor(
                  '#688676',
                  'placeholderTextColor',
                )}
                value={searchQuery}
                onChangeText={setSearchQuery}
                accessibilityLabel="Search suyos"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity
                  onPress={() => setSearchQuery('')}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons
                    name="close-circle"
                    size={18}
                    color={resolveColor('#8FA497', 'color')}
                  />
                </TouchableOpacity>
              )}
            </View>

            {/* Filter Icon Button Beside Search Bar */}
            <TouchableOpacity
              style={[
                styles.filterIconButton,
                activeFiltersCount > 0 && styles.filterIconButtonActive,
              ]}
              activeOpacity={0.75}
              onPress={() => setIsFilterModalOpen(true)}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            >
              <Ionicons
                name="options-outline"
                size={22}
                color={
                  activeFiltersCount > 0
                    ? resolveColor('#FFFFFF', 'color')
                    : resolveColor('#1E4D2B', 'color')
                }
              />
              {activeFiltersCount > 0 && (
                <View style={styles.filterActiveBadgeDot}>
                  <Text style={styles.filterActiveBadgeText}>
                    {activeFiltersCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* === AVAILABLE SUYO HEADER === */}
          <View style={styles.sectionHeaderRow}>
            <View
              style={{
                flex: 1,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 7,
                paddingRight: 8,
              }}
            >
              <Text
                style={[styles.sectionHeading, { marginBottom: 0 }]}
                numberOfLines={1}
              >
                {availableHeaderTitle}
              </Text>
              {!isFiltering && (
                <View style={styles.availableCountBadge}>
                  <Text style={styles.availableCountBadgeText}>
                    {availableSuyosBase.length}
                  </Text>
                </View>
              )}
            </View>

            {isFiltering ? (
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={clearAllFilters}
                style={styles.clearFiltersPill}
              >
                <Ionicons
                  name="close-circle-outline"
                  size={13}
                  color={resolveColor('#64748B', 'color')}
                />
                <Text style={styles.clearFiltersText}>Clear all</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setIsFilterModalOpen(true)}
                style={styles.nearestHeaderBadge}
              >
                <Ionicons
                  name="location-outline"
                  size={13}
                  color={resolveColor('#1E4D2B', 'color')}
                />
                <Text style={styles.nearestHeaderText}>Nearest</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* === AVAILABLE SUYO LIST === */}
          <View style={styles.tasksList}>
            {filteredSuyos.length > 0 ? (
              filteredSuyos.map((suyo) => (
                <TouchableOpacity
                  key={suyo.id}
                  style={styles.suyoCard}
                  activeOpacity={0.88}
                  onPress={() => handleOpenSuyoDetail(suyo)}
                >
                  <View style={styles.suyoCardTopRow}>
                    <Text
                      style={styles.suyoCardTitle}
                      numberOfLines={2}
                    >
                      {suyo.title}
                    </Text>
                    <Text style={styles.suyoCardReward}>{suyo.reward}</Text>
                  </View>

                  <View style={styles.suyoCardBottomRow}>
                    <Text style={styles.suyoCardDistanceSub}>
                      {suyo.distanceText} • {suyo.postedTime}
                    </Text>

                    <View
                      style={[
                        styles.suyoTagPill,
                        suyo.tag === 'Urgent'
                          ? styles.suyoTagUrgent
                          : suyo.tag === 'Due today'
                            ? styles.suyoTagToday
                            : suyo.tag === 'Due tomorrow'
                              ? styles.suyoTagTomorrow
                              : styles.suyoTagNormal,
                      ]}
                    >
                      <Text
                        style={[
                          styles.suyoTagPillText,
                          suyo.tag === 'Urgent'
                            ? styles.suyoTagUrgentText
                            : suyo.tag === 'Due today'
                              ? styles.suyoTagTodayText
                              : suyo.tag === 'Due tomorrow'
                                ? styles.suyoTagTomorrowText
                                : styles.suyoTagNormalText,
                        ]}
                      >
                        {suyo.tag}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.emptyStateBox}>
                <Ionicons
                  name="search"
                  size={32}
                  color={resolveColor('#8FA497', 'color')}
                />
                <Text style={styles.emptyStateTitle}>No suyos found</Text>
                <Text style={styles.emptyStateSub}>
                  Try clearing your search or adjusting your distance and
                  category filters.
                </Text>
              </View>
            )}
          </View>
        </View>
      </>
    )
  );
}
