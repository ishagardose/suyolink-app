import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Modal,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

export default function AccountScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();

  // User details with fallbacks aligned with SuyoLink project style
  const initialName = params.name || 'Alex Rivera';
  const initialHandle =
    params.handle ||
    `@${initialName.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
  const initialRating = (params.rating || '4.9').replace(/[★*]/g, '').trim();
  const initialDone = params.errandsDone || params.done || '48';
  const initialPoints = params.points || '1,250';
  const initialBio =
    params.bio ||
    'Just a helpful neighbor. Ready to run grocery errands, assist with light moving, or pet-sit in Quezon City. 🇵🇭';

  const [profile, setProfile] = useState({
    name: initialName,
    handle: initialHandle,
    rating: initialRating,
    done: initialDone,
    points: initialPoints,
    bio: initialBio,
  });

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [tempProfile, setTempProfile] = useState({ ...profile });

  const getInitials = (name) => {
    if (!name) return 'AR';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const handleSaveProfile = () => {
    setProfile({ ...tempProfile });
    setIsEditModalOpen(false);
  };

  return (
    <SafeAreaView style={styles.safeContainer} edges={['top', 'left', 'right']}>
      <StatusBar style="dark" />

      {/* TOP HEADER */}
      <View style={styles.headerBar}>
        <TouchableOpacity
          style={styles.headerIconButton}
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/dashboard'))}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="arrow-back" size={22} color="#163523" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>My Profile</Text>

        <TouchableOpacity
          style={styles.headerIconButton}
          onPress={() => setIsSettingsModalOpen(true)}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessibilityRole="button"
          accessibilityLabel="Account settings"
        >
          <Ionicons name="settings-sharp" size={21} color="#1E4D2B" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: 40 + insets.bottom },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* MAIN PROFILE CARD (Matches Image 3) */}
        <View style={styles.mainProfileCard}>
          {/* Avatar Circle */}
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarInitialsText}>
              {getInitials(profile.name)}
            </Text>
          </View>

          {/* Name & Blue Verified Badge */}
          <View style={styles.nameRow}>
            <Text style={styles.nameText}>{profile.name}</Text>
            <View style={styles.verifiedBadge}>
              <Text style={styles.verifiedBadgeText}>VERIFIED</Text>
            </View>
          </View>

          {/* Username / Handle */}
          <Text style={styles.handleText}>{profile.handle}</Text>

          {/* 3-Column Stats Panel */}
          <View style={styles.statsCard}>
            <View style={styles.statCol}>
              <Text style={styles.statNumber}>{profile.done}</Text>
              <Text style={styles.statLabel}>Done</Text>
            </View>

            <View style={styles.statDivider} />

            <View style={styles.statCol}>
              <View style={styles.ratingNumberRow}>
                <Text style={styles.statNumber}>{profile.rating}</Text>
                <Ionicons
                  name="star"
                  size={15}
                  color="#F59E0B"
                  style={{ marginLeft: 3 }}
                />
              </View>
              <Text style={styles.statLabel}>Rating</Text>
            </View>

            <View style={styles.statDivider} />

            <View style={styles.statCol}>
              <Text style={styles.statNumber}>{profile.points}</Text>
              <Text style={styles.statLabel}>Points</Text>
            </View>
          </View>

          {/* BIO Section */}
          <View style={styles.bioContainer}>
            <Text style={styles.bioHeading}>BIO</Text>
            <Text style={styles.bioBody}>{profile.bio}</Text>
          </View>

          {/* Edit Profile Button */}
          <TouchableOpacity
            style={styles.editProfileButton}
            onPress={() => {
              setTempProfile({ ...profile });
              setIsEditModalOpen(true);
            }}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Edit Profile"
          >
            <Text style={styles.editProfileButtonText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>

        {/* EARNED BADGES SECTION (Matches Image 3) */}
        <View style={styles.badgesSection}>
          <Text style={styles.sectionHeading}>Earned Badges</Text>

          <View style={styles.badgesRow}>
            {/* Badge 1: Super Doer */}
            <View style={styles.badgeCard}>
              <View style={styles.badgeIconCircle}>
                <Ionicons name="ribbon-outline" size={20} color="#1E4D2B" />
              </View>
              <Text style={styles.badgeLabel}>Super Doer</Text>
            </View>

            {/* Badge 2: Errand King */}
            <View style={styles.badgeCard}>
              <View style={styles.badgeIconCircle}>
                <Ionicons name="ribbon-outline" size={20} color="#1E4D2B" />
              </View>
              <Text style={styles.badgeLabel}>Errand King</Text>
            </View>

            {/* Badge 3: Top Rated */}
            <View style={styles.badgeCard}>
              <View style={styles.badgeIconCircle}>
                <Ionicons name="ribbon-outline" size={20} color="#1E4D2B" />
              </View>
              <Text style={styles.badgeLabel}>Top Rated</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* EDIT PROFILE MODAL */}
      <Modal
        visible={isEditModalOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsEditModalOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.editModalCard}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>Edit Profile</Text>
              <TouchableOpacity
                onPress={() => setIsEditModalOpen(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close" size={22} color="#163523" />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputFieldLabel}>Full Name</Text>
            <TextInput
              style={styles.textInput}
              value={tempProfile.name}
              onChangeText={(text) =>
                setTempProfile({ ...tempProfile, name: text })
              }
              placeholder="Enter full name"
              placeholderTextColor="#8EA296"
            />

            <Text style={styles.inputFieldLabel}>Handle / Username</Text>
            <TextInput
              style={styles.textInput}
              value={tempProfile.handle}
              onChangeText={(text) =>
                setTempProfile({ ...tempProfile, handle: text })
              }
              placeholder="@handle"
              placeholderTextColor="#8EA296"
              autoCapitalize="none"
            />

            <Text style={styles.inputFieldLabel}>Bio</Text>
            <TextInput
              style={[styles.textInput, styles.bioInput]}
              value={tempProfile.bio}
              onChangeText={(text) =>
                setTempProfile({ ...tempProfile, bio: text })
              }
              placeholder="Tell others what tasks or services you do..."
              placeholderTextColor="#8EA296"
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />

            <View style={styles.modalButtonRow}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setIsEditModalOpen(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalSaveButton}
                onPress={handleSaveProfile}
                activeOpacity={0.85}
              >
                <Text style={styles.modalSaveText}>Save Changes</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* QUICK SETTINGS MODAL */}
      <Modal
        visible={isSettingsModalOpen}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setIsSettingsModalOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.settingsModalCard}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>Preferences & Settings</Text>
              <TouchableOpacity
                onPress={() => setIsSettingsModalOpen(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close" size={22} color="#163523" />
              </TouchableOpacity>
            </View>

            <View style={styles.settingsOptionRow}>
              <View style={styles.settingsOptionLeft}>
                <Ionicons name="notifications-outline" size={20} color="#1E4D2B" />
                <Text style={styles.settingsOptionText}>Task Notifications</Text>
              </View>
              <Ionicons name="checkmark-circle" size={22} color="#1E4D2B" />
            </View>

            <View style={styles.settingsOptionRow}>
              <View style={styles.settingsOptionLeft}>
                <Ionicons name="shield-checkmark-outline" size={20} color="#1E4D2B" />
                <Text style={styles.settingsOptionText}>Identity Verification</Text>
              </View>
              <Text style={styles.settingsStatusActive}>Active</Text>
            </View>

            <View style={styles.settingsOptionRow}>
              <View style={styles.settingsOptionLeft}>
                <Ionicons name="lock-closed-outline" size={20} color="#1E4D2B" />
                <Text style={styles.settingsOptionText}>Privacy & Security</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#8EA296" />
            </View>

            <TouchableOpacity
              style={styles.settingsDoneButton}
              onPress={() => setIsSettingsModalOpen(false)}
              activeOpacity={0.85}
            >
              <Text style={styles.settingsDoneButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: '#F5F9F6',
  },
  headerBar: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: '#F5F9F6',
  },
  headerIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EAF3ED',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#163523',
    letterSpacing: -0.3,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 10,
  },

  /* MAIN PROFILE CARD (Matches Image 3) */
  mainProfileCard: {
    backgroundColor: '#EDF5EF',
    borderRadius: 28,
    borderWidth: 1.5,
    borderColor: '#D4E7DC',
    padding: 22,
    alignItems: 'center',
    shadowColor: '#163523',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  avatarCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#DFEFE5',
    borderWidth: 2,
    borderColor: '#BDDFC9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  avatarInitialsText: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1E4D2B',
    letterSpacing: -0.5,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  nameText: {
    fontSize: 22,
    fontWeight: '900',
    color: '#163523',
    letterSpacing: -0.3,
  },
  verifiedBadge: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  verifiedBadgeText: {
    fontSize: 9.5,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  handleText: {
    fontSize: 13.5,
    fontWeight: '500',
    color: '#658071',
    marginBottom: 16,
  },

  /* 3-COLUMN STATS PANEL */
  statsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#DFECE4',
    paddingVertical: 14,
    width: '100%',
    marginBottom: 18,
  },
  statCol: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statDivider: {
    width: 1,
    height: 28,
    backgroundColor: '#E5EFE8',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '800',
    color: '#163523',
    letterSpacing: -0.2,
  },
  ratingNumberRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#748E80',
    marginTop: 2,
  },

  /* BIO CONTAINER */
  bioContainer: {
    width: '100%',
    marginBottom: 18,
  },
  bioHeading: {
    fontSize: 11,
    fontWeight: '800',
    color: '#4B6757',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  bioBody: {
    fontSize: 13,
    color: '#345241',
    lineHeight: 18.5,
  },

  /* EDIT PROFILE BUTTON */
  editProfileButton: {
    width: '100%',
    height: 44,
    borderRadius: 16,
    backgroundColor: 'transparent',
    borderWidth: 1.2,
    borderColor: '#C0D7CA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  editProfileButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#163523',
  },

  /* EARNED BADGES */
  badgesSection: {
    marginTop: 22,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '800',
    color: '#163523',
    marginBottom: 12,
  },
  badgesRow: {
    flexDirection: 'row',
    gap: 10,
  },
  badgeCard: {
    flex: 1,
    backgroundColor: '#EDF5EF',
    borderRadius: 18,
    borderWidth: 1.2,
    borderColor: '#D4E7DC',
    paddingVertical: 16,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#DFEFE5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  badgeLabel: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#163523',
    textAlign: 'center',
  },

  /* MODALS */
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  editModalCard: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 22,
  },
  settingsModalCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 22,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#163523',
  },
  inputFieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#345241',
    marginBottom: 5,
    marginTop: 10,
  },
  textInput: {
    backgroundColor: '#FAFDFB',
    borderWidth: 1.2,
    borderColor: '#D2E2D9',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13.5,
    color: '#163523',
  },
  bioInput: {
    minHeight: 70,
  },
  modalButtonRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
  },
  modalCancelButton: {
    flex: 1,
    height: 46,
    borderRadius: 14,
    backgroundColor: '#F0F5F2',
    borderWidth: 1,
    borderColor: '#D4E4DC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#345241',
  },
  modalSaveButton: {
    flex: 1,
    height: 46,
    borderRadius: 14,
    backgroundColor: '#1E4D2B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSaveText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  settingsOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F5F2',
  },
  settingsOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  settingsOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#163523',
  },
  settingsStatusActive: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E4D2B',
    backgroundColor: '#EAF4EF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  settingsDoneButton: {
    height: 46,
    borderRadius: 14,
    backgroundColor: '#1E4D2B',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
  },
  settingsDoneButtonText: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
