import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Modal,
  Platform,
  Linking,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

// Curated feedbacks from Requesters for Doers
const REQUESTER_FEEDBACKS_FOR_DOER = [
  {
    id: 'FB-1',
    author: 'Atty. Rafael Cruz',
    rating: 5.0,
    date: 'Yesterday · 4:15 PM',
    rateMarks: ['Punctual Delivery', 'Polite & Professional', 'Careful Handling'],
    comment:
      'Super reliable and very swift with document delivery. Handled the notarized papers with utmost care and gave clear updates throughout. Highly recommended!',
  },
  {
    id: 'FB-2',
    author: 'Maria Clarissa',
    rating: 5.0,
    date: 'Sep 27, 2026',
    rateMarks: ['Clear Communication', 'Followed Instructions', 'Fast Completion'],
    comment:
      'Bought all exact grocery items from the list, checked expiration dates as requested, and delivered ahead of schedule. Very polite!',
  },
  {
    id: 'FB-3',
    author: 'Kenneth Gomez',
    rating: 5.0,
    date: 'Sep 21, 2026',
    rateMarks: ['Trustworthy & Reliable', 'Punctual Delivery'],
    comment:
      'Waited patiently in line for utility bill payment and handed over validated receipts promptly. Excellent neighborly service.',
  },
  {
    id: 'FB-4',
    author: 'Elena Soriano',
    rating: 4.8,
    date: 'Sep 15, 2026',
    rateMarks: ['Careful Handling', 'Responsive Communication'],
    comment:
      'Very accommodating courier. Promptly answered my calls when clarifying delivery location. Will hire again!',
  },
];

// Curated feedbacks from Doers/Community for Requesters
const COMMUNITY_FEEDBACKS_FOR_REQUESTER = [
  {
    id: 'FBR-1',
    author: 'Carlos Dalisay',
    rating: 5.0,
    date: 'Yesterday · 5:20 PM',
    rateMarks: ['Prompt Payment', 'Clear Instructions', 'Respectful & Courteous'],
    comment:
      'Clear drop-off directions at the 4th floor reception. Payment was released immediately upon proof submission. Very smooth coordination!',
  },
  {
    id: 'FBR-2',
    author: 'Reynaldo Bautista',
    rating: 5.0,
    date: 'Sep 25, 2026',
    rateMarks: ['Accurate Location Details', 'Prompt Payment', 'Highly Recommended'],
    comment:
      'Super responsive client. Exact landmark provided and was waiting at the lobby for the parcel handoff.',
  },
  {
    id: 'FBR-3',
    author: 'Jenny Morales',
    rating: 4.9,
    date: 'Sep 18, 2026',
    rateMarks: ['Respectful & Courteous', 'Trustworthy Requester'],
    comment:
      'Pleasant and professional interaction. Generous tip and fair compensation. 10/10 requester.',
  },
];

export default function AccountScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();

  const isOtherUser = params.isOtherUser === 'true';

  // User details with fallbacks aligned with SuyoLink project style
  const initialName = params.name || 'Alex Rivera';
  const initialHandle =
    params.handle ||
    `@${initialName.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
  const initialRating = (params.rating || '4.9').replace(/[★*]/g, '').trim();
  const initialDone = params.errandsDone || params.done || '48';
  const initialPoints = params.points || (isOtherUser ? '1,120' : '1,250');
  const initialBio =
    params.bio ||
    (isOtherUser
      ? 'Verified SuyoLink community member. Active requester and helper around the area.'
      : 'Just a helpful neighbor. Ready to run grocery errands, assist with light moving, or pet-sit in Quezon City. 🇵🇭');

  const [profile, setProfile] = useState({
    name: initialName,
    handle: initialHandle,
    rating: initialRating,
    done: initialDone,
    points: initialPoints,
    bio: initialBio,
  });

  useEffect(() => {
    if (params.name) {
      setProfile({
        name: params.name,
        handle:
          params.handle ||
          `@${params.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
        rating: (params.rating || '4.9').replace(/[★*]/g, '').trim(),
        done: params.errandsDone || params.done || (isOtherUser ? '34' : '48'),
        points: params.points || (isOtherUser ? '1,120' : '1,250'),
        bio:
          params.bio ||
          (isOtherUser
            ? 'Verified SuyoLink community member. Active requester and helper around the area.'
            : 'Just a helpful neighbor. Ready to run grocery errands, assist with light moving, or pet-sit in Quezon City. 🇵🇭'),
      });
    }
  }, [params.name, params.rating, params.done, isOtherUser]);

  const isAttyRafael = profile.name?.toLowerCase().includes('rafael');
  const activeFeedbacks = isAttyRafael
    ? COMMUNITY_FEEDBACKS_FOR_REQUESTER
    : REQUESTER_FEEDBACKS_FOR_DOER;

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
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

        <Text style={styles.headerTitle}>{isOtherUser ? 'Profile' : 'My Profile'}</Text>

        <View style={{ width: 40 }} />
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
          {/* Circled Profile with Shiny Green Verified Badge */}
          <View style={styles.avatarWrapper}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarInitialsText}>
                {getInitials(profile.name)}
              </Text>
            </View>
            <View style={styles.shinyVerifiedBadge}>
              <Ionicons name="checkmark" size={16} color="#FFFFFF" />
            </View>
          </View>

          {/* Name */}
          <View style={styles.nameRow}>
            <Text style={styles.nameText}>{profile.name}</Text>
          </View>

          {/* Username / Handle */}
          <Text style={styles.handleText}>{profile.handle}</Text>

          {/* Phone Number Row (Aligned with Suyo Detail Accounts Style) */}
          <View style={styles.phoneMetaRow}>
            <Ionicons name="call" size={12} color="#4B6354" />
            <Text style={styles.phoneMetaText}>
              {params.phone || '+63 917 123 4567'}
            </Text>
          </View>

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

          {/* Action Button: Call for other user or Edit Profile for current user */}
          {isOtherUser ? (
            params.phone ? (
              <TouchableOpacity
                style={styles.callProfileButton}
                onPress={() => {
                  const telUrl = `tel:${params.phone.replace(/[^0-9+]/g, '')}`;
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
                accessibilityLabel={`Call ${profile.name}`}
              >
                <Ionicons name="call" size={16} color="#FFFFFF" style={{ marginRight: 8 }} />
                <Text style={styles.callProfileButtonText}>Call {profile.name.split(' ')[0]}</Text>
              </TouchableOpacity>
            ) : null
          ) : (
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
          )}
        </View>

        {/* REQUESTERS' FEEDBACK & COMMENTS SECTION WITH RATE MARKS */}
        <View style={styles.feedbackSection}>
          <View style={styles.feedbackSectionHeader}>
            <View>
              <Text style={styles.sectionHeading}>
                {isAttyRafael ? 'Community Feedback' : "Requesters' Feedback"}
              </Text>
              <Text style={styles.feedbackSubheading}>
                Ratings & reviews from verified task coordinators
              </Text>
            </View>
            <View style={styles.feedbackRatingBadge}>
              <Ionicons name="star" size={13} color="#D97706" />
              <Text style={styles.feedbackRatingBadgeText}>{profile.rating}★</Text>
            </View>
          </View>

          <View style={styles.feedbackList}>
            {activeFeedbacks.map((item) => (
              <View key={item.id} style={styles.feedbackCard}>
                {/* Header: Author + Star Rating */}
                <View style={styles.feedbackCardHeader}>
                  <View style={styles.feedbackAuthorRow}>
                    <View style={styles.feedbackAvatarCircle}>
                      <Text style={styles.feedbackAvatarInitials}>
                        {getInitials(item.author)}
                      </Text>
                    </View>
                    <View>
                      <Text style={styles.feedbackAuthorName}>{item.author}</Text>
                      <Text style={styles.feedbackDateText}>{item.date}</Text>
                    </View>
                  </View>
                  <View style={styles.feedbackStarsRow}>
                    {[...Array(5)].map((_, i) => (
                      <Ionicons
                        key={i}
                        name={i < Math.floor(item.rating) ? 'star' : 'star-half'}
                        size={12}
                        color="#F59E0B"
                        style={{ marginLeft: 1 }}
                      />
                    ))}
                    <Text style={styles.feedbackCardRatingNum}>
                      {Number(item.rating).toFixed(1)}
                    </Text>
                  </View>
                </View>

                {/* Optional Rate Marks from Requesters */}
                {item.rateMarks && item.rateMarks.length > 0 && (
                  <View style={styles.rateMarksRow}>
                    {item.rateMarks.map((mark, idx) => (
                      <View key={idx} style={styles.rateMarkChip}>
                        <Ionicons name="checkmark-circle" size={11} color="#059669" />
                        <Text style={styles.rateMarkChipText}>{mark}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* Feedback Comment */}
                <Text style={styles.feedbackCommentText}>"{item.comment}"</Text>
              </View>
            ))}
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
  avatarWrapper: {
    position: 'relative',
    marginBottom: 14,
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
  },
  shinyVerifiedBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.45,
    shadowRadius: 5,
    elevation: 5,
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
    justifyContent: 'center',
    marginBottom: 4,
  },
  nameText: {
    fontSize: 22,
    fontWeight: '900',
    color: '#163523',
    letterSpacing: -0.3,
  },
  handleText: {
    fontSize: 13.5,
    fontWeight: '500',
    color: '#658071',
    marginBottom: 8,
  },
  phoneMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 16,
    backgroundColor: '#F3FAF5',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#CDE5D6',
  },
  phoneMetaText: {
    fontSize: 12,
    color: '#425C4D',
    fontWeight: '600',
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
  callProfileButton: {
    width: '100%',
    height: 44,
    borderRadius: 16,
    backgroundColor: '#1E4D2B',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  callProfileButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  /* FEEDBACK & RATINGS SECTION */
  feedbackSection: {
    marginTop: 22,
  },
  feedbackSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '800',
    color: '#163523',
    marginBottom: 2,
  },
  feedbackSubheading: {
    fontSize: 12,
    color: '#658172',
  },
  feedbackRatingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  feedbackRatingBadgeText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#D97706',
  },
  feedbackList: {
    gap: 12,
  },
  feedbackCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2EBE5',
    shadowColor: '#163523',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  feedbackCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  feedbackAuthorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  feedbackAvatarCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1E4D2B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  feedbackAvatarInitials: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  feedbackAuthorName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#163523',
  },
  feedbackDateText: {
    fontSize: 10.5,
    color: '#7B9487',
  },
  feedbackStarsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  feedbackCardRatingNum: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4B6354',
    marginLeft: 3,
  },
  rateMarksRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  rateMarkChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EBF5EE',
    borderWidth: 1,
    borderColor: '#C6E4CF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  rateMarkChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#166534',
  },
  feedbackCommentText: {
    fontSize: 12.5,
    color: '#344E3F',
    lineHeight: 18,
    fontStyle: 'italic',
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
});
