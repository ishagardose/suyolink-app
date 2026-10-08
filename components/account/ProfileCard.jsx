import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { View, Text, TouchableOpacity, Platform, Linking } from 'react-native';
import { FIXED_COLORS } from '../../theme/colors';
import { getInitials } from './profileFormat';

export default function ProfileCard({
  styles,
  colors,
  displayName,
  displayHandle,
  displayPhone,
  displayBio,
  completedSuyosCount,
  displayRating,
  isOtherUser,
  isProfileReady,
  loading,
  handleOpenEdit,
}) {
  return (
    <View style={styles.mainProfileCard}>
      {/* Profile initials */}
      <View style={styles.avatarWrapper}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarInitialsText}>
            {getInitials(displayName)}
          </Text>
        </View>
      </View>

      {/* Name */}
      <View style={styles.nameRow}>
        <Text style={styles.nameText}>{displayName}</Text>
      </View>

      {/* Username / Handle */}
      {displayHandle ? (
        <Text style={styles.handleText}>{displayHandle}</Text>
      ) : null}

      {/* Phone Number Row */}
      {displayPhone ? (
        <View style={styles.phoneMetaRow}>
          <Ionicons
            name="call"
            size={12}
            color={colors.textSecondary}
          />
          <Text style={styles.phoneMetaText}>{displayPhone}</Text>
        </View>
      ) : null}

      {/* 2-Column Stats Panel */}
      <View style={styles.statsCard}>
        <View style={styles.statCol}>
          <Text style={styles.statNumber}>{completedSuyosCount}</Text>
          <Text style={styles.statLabel}>Suyos Done</Text>
        </View>

        <View style={styles.statDivider} />

        <View style={styles.statCol}>
          <View style={styles.ratingNumberRow}>
            <Text
              style={[
                styles.statNumber,
                displayRating === 'No ratings yet' && { fontSize: 14 },
              ]}
            >
              {displayRating}
            </Text>
            {displayRating !== 'No ratings yet' && (
              <Ionicons
                name="star"
                size={15}
                color={FIXED_COLORS.ratingGold}
                style={{ marginLeft: 3 }}
              />
            )}
          </View>
          <Text style={styles.statLabel}>Rating</Text>
        </View>
      </View>

      {/* BIO Section */}
      <View style={styles.bioContainer}>
        <Text style={styles.bioHeading}>BIO</Text>
        <Text style={styles.bioBody}>{displayBio || 'No bio yet.'}</Text>
      </View>

      {/* Action Button: Call for other user or Edit Profile for current user */}
      {isOtherUser ? (
        displayPhone ? (
          <TouchableOpacity
            style={styles.callProfileButton}
            onPress={() => {
              const telUrl = `tel:${displayPhone.replace(/[^0-9+]/g, '')}`;
              if (Platform.OS === 'web') {
                if (typeof window !== 'undefined' && window.open) {
                  window.open(telUrl, '_self');
                } else {
                  Linking.openURL(telUrl).catch(() => {});
                }
              } else {
                Linking.openURL(telUrl).catch(() => {});
              }
            }}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel={`Call ${displayName}`}
          >
            <Ionicons
              name="call"
              size={16}
              color={colors.onPrimary}
              style={{ marginRight: 8 }}
            />
            <Text style={styles.callProfileButtonText}>
              Call {displayName.split(' ')[0]}
            </Text>
          </TouchableOpacity>
        ) : null
      ) : (
        <TouchableOpacity
          style={styles.editProfileButton}
          onPress={handleOpenEdit}
          activeOpacity={0.8}
          disabled={!isProfileReady || loading}
          accessibilityRole="button"
          accessibilityLabel="Edit Profile"
        >
          <Text style={styles.editProfileButtonText}>Edit Profile</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
