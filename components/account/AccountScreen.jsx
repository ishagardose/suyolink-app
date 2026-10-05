import React, { useState, useEffect, useMemo } from 'react';
import {
  ActivityIndicator,
  Linking,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../../context/AuthContext';
import { useSuyos } from '../../context/SuyoContext';
import { useTheme } from '../../theme/ThemeContext';
import { supabase } from '../../lib/supabase';
import ThemedText from '../themed/ThemedText';

function formatFeedbackDate(dateStr) {
  if (!dateStr) return 'Recently';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return 'Recently';
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday = d.toDateString() === yesterday.toDateString();
  const timeStr = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  if (isToday) return `Today · ${timeStr}`;
  if (isYesterday) return `Yesterday · ${timeStr}`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function AccountScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { user, logout, updateProfile, isProfileReady } = useAuth();
  const {
    requests = [],
    transactions = [],
    ratings: contextRatings = [],
  } = useSuyos() || {};

  const targetId = params.userId || user?.id;
  const own = !params.userId || params.userId === user?.id;
  const isOtherUser = !own;

  // Local state for dynamic data
  const [profileName, setProfileName] = useState('');
  const [profilePhone, setProfilePhone] = useState('');
  const [profileHandle, setProfileHandle] = useState('');
  const [profileBio, setProfileBio] = useState('');
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  // Edit Profile Modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [tempProfile, setTempProfile] = useState({
    name: '',
    handle: '',
    phone: '',
    bio: '',
  });

  // Load profile from Supabase & AsyncStorage
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    setSaved(false);

    if (!targetId || !supabase) {
      setLoading(false);
      return;
    }

    Promise.all([
      supabase.from('profiles').select('full_name').eq('id', targetId).single(),
      supabase
        .from('profile_contacts')
        .select('phone,address')
        .eq('user_id', targetId)
        .single(),
      supabase
        .from('ratings')
        .select('id,score,comment,created_at,reviewer_id,request_id,provider_id')
        .eq('provider_id', targetId)
        .order('created_at', { ascending: false }),
      own ? AsyncStorage.getItem(`@suyolink/profile_meta_${targetId}`) : Promise.resolve(null),
    ])
      .then(async ([profRes, contRes, rateRes, metaRes]) => {
        if (!active) return;
        if (profRes.data?.full_name) {
          setProfileName(profRes.data.full_name);
        }
        if (contRes.data?.phone) {
          setProfilePhone(contRes.data.phone);
        }
        if (rateRes.data && rateRes.data.length > 0) {
          const rawList = rateRes.data;
          const reviewerIds = [
            ...new Set(rawList.map((r) => r.reviewer_id).filter(Boolean)),
          ];
          if (reviewerIds.length > 0) {
            try {
              const { data: profs } = await supabase
                .from('profiles')
                .select('id,full_name')
                .in('id', reviewerIds);
              if (active && profs && profs.length > 0) {
                const nameMap = {};
                profs.forEach((p) => {
                  nameMap[p.id] = p.full_name;
                });
                const enriched = rawList.map((r) => ({
                  ...r,
                  reviewerName: nameMap[r.reviewer_id] || null,
                }));
                setReviews(enriched);
              } else if (active) {
                setReviews(rawList);
              }
            } catch (_) {
              if (active) setReviews(rawList);
            }
          } else {
            setReviews(rawList);
          }
        } else if (rateRes.data) {
          setReviews([]);
        }
        if (metaRes) {
          try {
            const parsed = JSON.parse(metaRes);
            if (parsed.handle) setProfileHandle(parsed.handle);
            if (parsed.bio) setProfileBio(parsed.bio);
          } catch (_) {}
        }
      })
      .catch((e) => {
        if (active) setError(e.message || 'Could not load profile details.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [targetId, own]);

  // Fallbacks for display
  const rawParamName = params.name ? params.name.replace(/\s*\(You\)$/, '').trim() : '';
  const displayName = own
    ? user?.name || profileName || rawParamName || 'Juan Dela Cruz'
    : profileName || rawParamName || 'Alex Rivera';

  const displayHandle =
    profileHandle ||
    params.handle ||
    `@${displayName.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;

  const displayPhone =
    profilePhone ||
    user?.phone ||
    params.phone ||
    '+63 917 123 4567';

  // Dynamic Suyos Done calculation
  const completedSuyosCount = useMemo(() => {
    if (params.suyosDone || params.errandsDone || params.done) {
      return String(params.suyosDone || params.errandsDone || params.done);
    }
    const myDone = (requests || []).filter(
      (r) =>
        (r.providerId === targetId || r.requesterId === targetId) &&
        r.status === 'completed'
    ).length;
    if (myDone > 0) return String(myDone);
    if (own && Array.isArray(transactions) && transactions.length > 0) {
      return String(transactions.length);
    }
    return '0';
  }, [requests, targetId, params, own, transactions]);

  // Combine and format all actual feedback items
  const dynamicFeedbacks = useMemo(() => {
    const list = [...reviews];

    // If own profile and direct query returned nothing, check transactions with ratings
    if (own && list.length === 0 && Array.isArray(transactions)) {
      transactions.forEach((t) => {
        if (t.rating_score != null) {
          list.push({
            id: `tx-rating-${t.request_id}`,
            score: t.rating_score,
            comment: t.rating_comment || '',
            created_at: t.completed_at,
            reviewer_id: t.other_user_id,
            reviewerName: t.other_user_name,
            request_id: t.request_id,
            taskTitle: t.title,
          });
        }
      });
    }

    // Check contextRatings as fallback if list is still empty
    if (list.length === 0 && Array.isArray(contextRatings)) {
      const fromContext = contextRatings.filter(
        (r) => r.provider_id === targetId || (!r.provider_id && !targetId)
      );
      fromContext.forEach((r) => list.push(r));
    }

    // Deduplicate by id or (request_id + reviewer_id)
    const seen = new Set();
    const deduped = [];
    for (const item of list) {
      const key = item.id || `${item.request_id}_${item.reviewer_id}`;
      if (!seen.has(key)) {
        seen.add(key);
        deduped.push(item);
      }
    }

    return deduped.map((item, idx) => {
      const req = (requests || []).find((r) => r.id === item.request_id);
      const tx = (transactions || []).find((t) => t.request_id === item.request_id);
      const taskTitle = item.taskTitle || tx?.title || req?.title || null;

      let authorName =
        item.reviewerName ||
        item.reviewer?.full_name ||
        tx?.other_user_name;

      if (!authorName && req) {
        if (req.requesterId === item.reviewer_id && req.requesterName) {
          authorName = req.requesterName;
        } else if (req.providerId === item.reviewer_id && req.providerName) {
          authorName = req.providerName;
        }
      }

      if (!authorName) {
        authorName = 'Verified Neighbor';
      }

      return {
        id: item.id || `feedback-${idx}`,
        author: authorName,
        score: Number(item.score || 5),
        comment: (item.comment || '').trim(),
        created_at: item.created_at,
        taskTitle,
      };
    });
  }, [reviews, own, transactions, contextRatings, targetId, requests]);

  // Dynamic Rating calculation from actual reviews
  const displayRating = useMemo(() => {
    if (dynamicFeedbacks.length > 0) {
      const avg =
        dynamicFeedbacks.reduce((sum, item) => sum + item.score, 0) /
        dynamicFeedbacks.length;
      return avg.toFixed(1);
    }
    if (params.rating) {
      return String(params.rating).replace(/[★*]/g, '').trim();
    }
    return '5.0';
  }, [dynamicFeedbacks, params.rating]);

  const displayBio =
    profileBio ||
    params.bio ||
    (own
      ? 'Just a helpful neighbor. Ready to run grocery suyos, assist with light moving, or pet-sit in Quezon City. 🇵🇭'
      : 'Verified SuyoLink community member. Active requester and helper around the area.');

  const getInitials = (n) => {
    if (!n) return 'AR';
    const parts = n.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const handleOpenEdit = () => {
    setTempProfile({
      name: displayName,
      handle: displayHandle,
      phone: displayPhone,
      bio: displayBio,
    });
    setIsEditModalOpen(true);
  };

  const handleSaveProfile = async () => {
    setBusy(true);
    setError('');
    setSaved(false);
    try {
      const trimmedName = tempProfile.name.trim();
      const trimmedPhone = tempProfile.phone.trim();
      const trimmedHandle = tempProfile.handle.trim();
      const trimmedBio = tempProfile.bio.trim();

      await updateProfile({
        name: trimmedName,
        phone: trimmedPhone || user?.phone || '',
        address: user?.address || '',
      });

      if (user?.id) {
        await AsyncStorage.setItem(
          `@suyolink/profile_meta_${user.id}`,
          JSON.stringify({
            handle: trimmedHandle,
            bio: trimmedBio,
          })
        );
      }

      setProfileName(trimmedName);
      setProfilePhone(trimmedPhone);
      setProfileHandle(trimmedHandle);
      setProfileBio(trimmedBio);
      setSaved(true);
      setIsEditModalOpen(false);
    } catch (e) {
      setError(e.message || 'Could not save profile changes.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeContainer} edges={['top', 'left', 'right']}>
      <StatusBar style="dark" />

      {/* TOP HEADER BAR */}
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

        <Text style={styles.headerTitle}>{own ? 'My Profile' : 'Profile'}</Text>

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
        {/* Error notification */}
        {error ? (
          <View style={styles.errorNotice} accessibilityRole="alert">
            <Ionicons name="alert-circle-outline" size={18} color="#DC2626" />
            <Text style={styles.errorNoticeText}>{error}</Text>
          </View>
        ) : null}

        {/* Success notification */}
        {saved ? (
          <View style={styles.successNotice} accessibilityRole="alert">
            <Ionicons name="checkmark-circle-outline" size={18} color="#059669" />
            <Text style={styles.successNoticeText}>Your profile has been updated.</Text>
          </View>
        ) : null}

        {/* MAIN PROFILE CARD (Hunter Green Custom Aesthetic) */}
        <View style={styles.mainProfileCard}>
          {/* Circled Profile with Shiny Green Verified Badge */}
          <View style={styles.avatarWrapper}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarInitialsText}>
                {getInitials(displayName)}
              </Text>
            </View>
            <View style={styles.shinyVerifiedBadge}>
              <Ionicons name="checkmark" size={16} color="#FFFFFF" />
            </View>
          </View>

          {/* Name */}
          <View style={styles.nameRow}>
            <Text style={styles.nameText}>{displayName}</Text>
          </View>

          {/* Username / Handle */}
          <Text style={styles.handleText}>{displayHandle}</Text>

          {/* Phone Number Row */}
          <View style={styles.phoneMetaRow}>
            <Ionicons name="call" size={12} color="#4B6354" />
            <Text style={styles.phoneMetaText}>{displayPhone}</Text>
          </View>

          {/* 2-Column Stats Panel */}
          <View style={styles.statsCard}>
            <View style={styles.statCol}>
              <Text style={styles.statNumber}>{completedSuyosCount}</Text>
              <Text style={styles.statLabel}>Suyos Done</Text>
            </View>

            <View style={styles.statDivider} />

            <View style={styles.statCol}>
              <View style={styles.ratingNumberRow}>
                <Text style={styles.statNumber}>{displayRating}</Text>
                <Ionicons
                  name="star"
                  size={15}
                  color="#F59E0B"
                  style={{ marginLeft: 3 }}
                />
              </View>
              <Text style={styles.statLabel}>Rating</Text>
            </View>
          </View>

          {/* BIO Section */}
          <View style={styles.bioContainer}>
            <Text style={styles.bioHeading}>BIO</Text>
            <Text style={styles.bioBody}>{displayBio}</Text>
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
                <Ionicons name="call" size={16} color="#FFFFFF" style={{ marginRight: 8 }} />
                <Text style={styles.callProfileButtonText}>Call {displayName.split(' ')[0]}</Text>
              </TouchableOpacity>
            ) : null
          ) : (
            <TouchableOpacity
              style={styles.editProfileButton}
              onPress={handleOpenEdit}
              activeOpacity={0.8}
              disabled={!isProfileReady && loading}
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
                {own ? "Requesters' Feedback" : 'Community Feedback'}
              </Text>
              <Text style={styles.feedbackSubheading}>
                Ratings & reviews from verified task coordinators
              </Text>
            </View>
            <View style={styles.feedbackRatingBadge}>
              <Ionicons name="star" size={13} color="#D97706" />
              <Text style={styles.feedbackRatingBadgeText}>{displayRating}★</Text>
            </View>
          </View>

          <View style={styles.feedbackList}>
            {dynamicFeedbacks.length > 0 ? (
              dynamicFeedbacks.map((item) => (
                <View key={item.id} style={styles.feedbackCard}>
                  <View style={styles.feedbackCardHeader}>
                    <View style={styles.feedbackAuthorRow}>
                      <View style={styles.feedbackAvatarCircle}>
                        <Text style={styles.feedbackAvatarInitials}>
                          {getInitials(item.author)}
                        </Text>
                      </View>
                      <View>
                        <Text style={styles.feedbackAuthorName}>{item.author}</Text>
                        <Text style={styles.feedbackDateText}>
                          {formatFeedbackDate(item.created_at)}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.feedbackStarsRow}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Ionicons
                          key={star}
                          name={star <= Math.round(item.score) ? 'star' : 'star-outline'}
                          size={12}
                          color="#F59E0B"
                          style={{ marginLeft: 1 }}
                        />
                      ))}
                      <Text style={styles.feedbackCardRatingNum}>
                        {Number(item.score).toFixed(1)}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.rateMarksRow}>
                    <View style={styles.rateMarkChip}>
                      <Ionicons name="checkmark-circle" size={11} color="#059669" />
                      <Text style={styles.rateMarkChipText}>Verified Suyo</Text>
                    </View>
                    {item.taskTitle ? (
                      <View
                        style={[
                          styles.rateMarkChip,
                          { backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' },
                        ]}
                      >
                        <Ionicons name="pricetag-outline" size={11} color="#15803D" />
                        <Text
                          style={[styles.rateMarkChipText, { maxWidth: 180 }]}
                          numberOfLines={1}
                        >
                          {item.taskTitle}
                        </Text>
                      </View>
                    ) : (
                      <View style={styles.rateMarkChip}>
                        <Ionicons name="shield-checkmark-outline" size={11} color="#059669" />
                        <Text style={styles.rateMarkChipText}>Community Confirmed</Text>
                      </View>
                    )}
                  </View>

                  <Text style={styles.feedbackCommentText}>
                    {item.comment || `Rated ${item.score} out of 5 stars.`}
                  </Text>
                </View>
              ))
            ) : (
              <View style={styles.feedbackEmptyCard}>
                <View style={styles.feedbackEmptyIconCircle}>
                  <Ionicons name="chatbubbles-outline" size={24} color="#2D5A3C" />
                </View>
                <Text style={styles.feedbackEmptyTitle}>No reviews yet</Text>
                <Text style={styles.feedbackEmptySub}>
                  {own
                    ? 'Ratings and comments from requesters and doers will appear here once you complete suyos.'
                    : 'This community member has not received any reviews yet.'}
                </Text>
              </View>
            )}
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
                accessibilityRole="button"
                accessibilityLabel="Close edit modal"
              >
                <Ionicons name="close" size={22} color="#163523" />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputFieldLabel}>Full Name</Text>
            <TextInput
              accessibilityLabel="Name"
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
              accessibilityLabel="Handle"
              style={styles.textInput}
              value={tempProfile.handle}
              onChangeText={(text) =>
                setTempProfile({ ...tempProfile, handle: text })
              }
              placeholder="@handle"
              placeholderTextColor="#8EA296"
              autoCapitalize="none"
            />

            <Text style={styles.inputFieldLabel}>Phone Number</Text>
            <TextInput
              accessibilityLabel="Phone"
              style={styles.textInput}
              value={tempProfile.phone}
              onChangeText={(text) =>
                setTempProfile({ ...tempProfile, phone: text })
              }
              placeholder="+63 9XX XXX XXXX"
              placeholderTextColor="#8EA296"
              keyboardType="phone-pad"
            />

            <Text style={styles.inputFieldLabel}>Bio</Text>
            <TextInput
              accessibilityLabel="Bio"
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
                accessibilityRole="button"
                accessibilityLabel="Cancel"
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalSaveButton}
                onPress={handleSaveProfile}
                activeOpacity={0.85}
                disabled={busy || !tempProfile.name.trim()}
                accessibilityRole="button"
                accessibilityLabel="Save Changes"
              >
                {busy ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalSaveText}>Save Changes</Text>
                )}
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

  /* NOTICES */
  errorNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    padding: 12,
    borderRadius: 14,
    marginBottom: 12,
  },
  errorNoticeText: {
    fontSize: 13,
    color: '#B91C1C',
    fontWeight: '600',
    flex: 1,
  },
  successNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#86EFAC',
    padding: 12,
    borderRadius: 14,
    marginBottom: 12,
  },
  successNoticeText: {
    fontSize: 13,
    color: '#15803D',
    fontWeight: '700',
    flex: 1,
  },

  /* MAIN PROFILE CARD */
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

  /* STATS PANEL */
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

  /* ACTION BUTTONS */
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

  /* EMPTY FEEDBACK STATE */
  feedbackEmptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 28,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2EBE5',
    borderStyle: 'dashed',
  },
  feedbackEmptyIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EAF3EC',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  feedbackEmptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#163523',
    marginBottom: 4,
  },
  feedbackEmptySub: {
    fontSize: 12.5,
    color: '#638070',
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 280,
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
