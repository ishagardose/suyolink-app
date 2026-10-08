import { styles } from '../styles/rateDoer.styles.js';
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
} from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams, usePathname } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../../lib/supabase';
import { useSuyos } from '../../../context/SuyoContext';

// Professional feedback criteria for rating a Doer
const DOER_FEEDBACK_OPTIONS = [
  { id: 'punctual', label: 'Punctual Delivery', icon: 'time-outline' },
  {
    id: 'careful',
    label: 'Careful Handling',
    icon: 'shield-checkmark-outline',
  },
  {
    id: 'professional',
    label: 'Polite & Professional',
    icon: 'person-outline',
  },
  {
    id: 'communication',
    label: 'Clear Communication',
    icon: 'chatbubble-ellipses-outline',
  },
  {
    id: 'instructions',
    label: 'Followed Instructions',
    icon: 'document-text-outline',
  },
  { id: 'fast', label: 'Fast Completion', icon: 'flash-outline' },
  {
    id: 'trustworthy',
    label: 'Trustworthy & Reliable',
    icon: 'checkmark-done-circle-outline',
  },
  { id: 'recommended', label: 'Highly Recommended', icon: 'ribbon-outline' },
];

// Professional feedback criteria for rating a Requester
const REQUESTER_FEEDBACK_OPTIONS = [
  { id: 'prompt_pay', label: 'Prompt Payment', icon: 'cash-outline' },
  {
    id: 'clear_instructions',
    label: 'Clear Instructions',
    icon: 'document-text-outline',
  },
  {
    id: 'responsive',
    label: 'Responsive Communication',
    icon: 'chatbubble-ellipses-outline',
  },
  {
    id: 'accurate_location',
    label: 'Accurate Location Details',
    icon: 'location-outline',
  },
  { id: 'courteous', label: 'Respectful & Courteous', icon: 'person-outline' },
  {
    id: 'reasonable',
    label: 'Reasonable Expectations',
    icon: 'checkmark-circle-outline',
  },
  {
    id: 'trustworthy',
    label: 'Trustworthy Requester',
    icon: 'shield-checkmark-outline',
  },
  { id: 'recommended', label: 'Highly Recommended', icon: 'ribbon-outline' },
];

// Professional rating tier descriptions
const RATING_LABELS = {
  1: 'Needs Improvement',
  2: 'Below Expectations',
  3: 'Satisfactory Service',
  4: 'Great Service',
  5: 'Exceptional Service',
};

export default function RateDoerScreen({ forcedTarget }) {
  const router = useRouter();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const { recordTransaction, reloadTransactions } = useSuyos();
  let pathname = '';
  try {
    pathname = usePathname() || '';
  } catch (e) {
    pathname = '';
  }

  const isRatingRequester =
    forcedTarget === 'requester' ||
    params.target === 'requester' ||
    params.role === 'doer' ||
    (typeof pathname === 'string' && pathname.includes('rate-requester'));

  const subjectName = isRatingRequester
    ? params.requesterName || 'Atty. Rafael Cruz'
    : params.doerName || 'Alex M.';

  const subjectRating = (
    isRatingRequester
      ? params.requesterRating || '4.9'
      : params.doerRating || '4.9'
  )
    .replace(/[★*]/g, '')
    .trim();

  const roleBadgeLabel = isRatingRequester
    ? 'Verified Requester'
    : 'Verified Doer';

  const taskTitle = params.title || 'Drop off documents - Unit 402';
  const taskReward = params.reward || '₱300';

  const availableOptions = isRatingRequester
    ? REQUESTER_FEEDBACK_OPTIONS
    : DOER_FEEDBACK_OPTIONS;

  const [rating, setRating] = useState(5);
  const [selectedTags, setSelectedTags] = useState(() =>
    isRatingRequester
      ? ['Clear Instructions', 'Prompt Payment']
      : ['Punctual Delivery', 'Polite & Professional'],
  );
  const [comment, setComment] = useState('');
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);

  const toggleTag = (tagLabel) => {
    setSelectedTags((prev) =>
      prev.includes(tagLabel)
        ? prev.filter((t) => t !== tagLabel)
        : [...prev, tagLabel],
    );
  };

  const getInitials = (name) => {
    if (!name) return 'SU';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const handleSubmit = async () => {
    try {
      const rewardNum =
        Number(String(taskReward).replace(/[^0-9.]/g, '')) || 150;
      const rewardCentavos = Math.round(rewardNum * 100);
      const fullComment =
        selectedTags.length > 0
          ? `${selectedTags.join(', ')}. ${comment}`.trim()
          : comment;

      if (recordTransaction && params.id) {
        recordTransaction({
          requestId: params.id,
          title: taskTitle,
          role: isRatingRequester ? 'provider' : 'requester',
          otherUserName:
            subjectName || (isRatingRequester ? 'Requester' : 'Courier'),
          rewardCentavos,
          ratingScore: rating,
          ratingComment: fullComment,
          category: params.category || 'General',
          location: params.location || 'Tagum City',
          completedAt: new Date().toISOString(),
        });
      }

      if (supabase && params.id) {
        try {
          await supabase.rpc('rate_suyo_user', {
            p_request_id: params.id,
            p_score: rating,
            p_comment: fullComment,
          });
        } catch (rpcErr) {
          console.warn('Rate doer rpc err:', rpcErr);
        }
      }

      if (reloadTransactions) reloadTransactions();
    } catch (_) {}
    setIsSuccessModalOpen(true);
  };

  return (
    <SafeAreaView
      style={styles.safeContainer}
      edges={['top', 'left', 'right']}
    >
      <StatusBar style="dark" />

      {/* TOP NAVBAR */}
      <View style={styles.navBar}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() =>
            router.canGoBack()
              ? router.back()
              : router.replace('/requester-fulfill')
          }
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons
            name="arrow-back"
            size={22}
            color="#163523"
          />
        </TouchableOpacity>
        <Text style={styles.navBarTitle}>
          {isRatingRequester ? 'Rate the Requester' : 'Rate the Doer'}
        </Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: 40 + insets.bottom },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* PROFILE SUMMARY CARD */}
        <TouchableOpacity
          style={styles.profileCard}
          onPress={() => {
            router.push({
              pathname: '/account',
              params: {
                name: subjectName,
                rating: subjectRating,
                role: isRatingRequester ? 'requester' : 'doer',
                suyosDone: isRatingRequester ? '34' : '48',
                bio: isRatingRequester
                  ? 'Legal professional in Makati CBD. Regularly requests prompt document handoffs and express parcel delivery.'
                  : 'Just a helpful neighbor. Ready to run grocery suyos, assist with light moving, or pet-sit in Quezon City. 🇵🇭',
              },
            });
          }}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel={`View ${subjectName}'s Account Profile`}
          accessibilityHint="Redirects to the Account screen"
        >
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarInitialsText}>
              {getInitials(subjectName)}
            </Text>
          </View>
          <View style={styles.profileInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.nameText}>{subjectName}</Text>
              <View style={styles.verifiedBadge}>
                <Ionicons
                  name="checkmark-circle"
                  size={13}
                  color="#1E4D2B"
                />
                <Text style={styles.verifiedBadgeText}>{roleBadgeLabel}</Text>
              </View>
            </View>

            <View style={styles.statsRow}>
              <Ionicons
                name="star"
                size={12}
                color="#F59E0B"
              />
              <Text style={styles.statsText}>{subjectRating} Rating</Text>
              <Text style={styles.statsDot}>•</Text>
              <Text style={styles.statsText}>
                {isRatingRequester
                  ? '34 completed requests'
                  : '231 suyos completed'}
              </Text>
            </View>

            <View style={styles.taskPill}>
              <Ionicons
                name="document-text-outline"
                size={12}
                color="#1E4D2B"
              />
              <Text
                style={styles.taskPillText}
                numberOfLines={1}
              >
                {taskTitle} • {taskReward}
              </Text>
            </View>
          </View>
          <View style={styles.profileChevronBox}>
            <Ionicons
              name="chevron-forward"
              size={18}
              color="#7B9988"
            />
          </View>
        </TouchableOpacity>

        {/* STAR RATING SECTION */}
        <View style={styles.ratingCard}>
          <Text style={styles.sectionHeading}>Overall Service Rating</Text>
          <Text style={styles.sectionSubtitle}>
            {isRatingRequester
              ? 'Rate your experience with this requester'
              : 'Select a star rating based on the service received'}
          </Text>

          {/* Interactive Stars */}
          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map((starValue) => {
              const isFilled = starValue <= rating;
              return (
                <TouchableOpacity
                  key={starValue}
                  onPress={() => setRating(starValue)}
                  activeOpacity={0.7}
                  style={styles.starTouch}
                  accessibilityRole="button"
                  accessibilityLabel={`${starValue} stars`}
                >
                  <Ionicons
                    name={isFilled ? 'star' : 'star-outline'}
                    size={38}
                    color={isFilled ? '#F59E0B' : '#CAD9D0'}
                  />
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Rating Status Badge */}
          <View style={styles.ratingLabelBadge}>
            <Text style={styles.ratingLabelText}>{RATING_LABELS[rating]}</Text>
          </View>
        </View>

        {/* SERVICE HIGHLIGHTS (ORGANIZED 2-COLUMN GRID, NO CHECKBOXES, SMOOTH EDGES) */}
        <View style={styles.optionsCard}>
          <View style={styles.sectionHeadingRow}>
            <Text style={styles.sectionHeading}>
              {isRatingRequester
                ? 'Requester Highlights'
                : 'Service Highlights'}
            </Text>
            <Text style={styles.optionalBadgeText}>Select all that apply</Text>
          </View>
          <Text style={styles.sectionSubtitleLeft}>
            {isRatingRequester
              ? 'Select positive feedback options regarding this handoff'
              : 'Choose the qualities that best describe your experience with this doer'}
          </Text>

          {/* Structured Smooth 2-Column Grid (No Checkboxes) */}
          <View style={styles.gridContainer}>
            {availableOptions.map((opt) => {
              const isSelected = selectedTags.includes(opt.label);
              return (
                <TouchableOpacity
                  key={opt.id}
                  style={[
                    styles.optionCard,
                    isSelected
                      ? styles.optionCardSelected
                      : styles.optionCardUnselected,
                  ]}
                  onPress={() => toggleTag(opt.label)}
                  activeOpacity={0.75}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected }}
                >
                  <Ionicons
                    name={opt.icon}
                    size={17}
                    color={isSelected ? '#1E4D2B' : '#5E7869'}
                    style={styles.optionIcon}
                  />
                  <Text
                    style={[
                      styles.optionLabelText,
                      isSelected && styles.optionLabelTextSelected,
                    ]}
                    numberOfLines={2}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* COMMENTS SECTION */}
        <View style={styles.commentsCard}>
          <Text style={styles.sectionHeading}>
            Additional Comments (Optional)
          </Text>
          <Text style={styles.sectionSubtitleLeft}>
            {isRatingRequester
              ? `Provide feedback about your coordination with ${subjectName}`
              : `Share specific details about your experience with ${subjectName}`}
          </Text>

          <TextInput
            style={styles.commentInput}
            placeholder={
              isRatingRequester
                ? `Share helpful notes about working with ${subjectName}...`
                : `Tell us what stood out about ${subjectName}'s service...`
            }
            placeholderTextColor="#688676"
            value={comment}
            onChangeText={setComment}
            multiline
            numberOfLines={4}
            maxLength={500}
            textAlignVertical="top"
          />
          <Text style={styles.charCount}>{comment.length}/500</Text>
        </View>

        {/* SUBMIT BUTTON */}
        <TouchableOpacity
          style={styles.submitButton}
          activeOpacity={0.85}
          onPress={handleSubmit}
        >
          <Ionicons
            name="checkmark-done"
            size={20}
            color="#FFFFFF"
          />
          <Text style={styles.submitButtonText}>Submit Rating</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* SUCCESS CONFIRMATION MODAL */}
      <Modal
        visible={isSuccessModalOpen}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setIsSuccessModalOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.successModalCard}>
            <View style={styles.successIconCircle}>
              <Ionicons
                name="checkmark-sharp"
                size={38}
                color="#FFFFFF"
              />
            </View>

            <Text style={styles.successModalTitle}>Rating Submitted!</Text>
            <Text style={styles.successModalSub}>
              {isRatingRequester
                ? `Thank you for rating ${subjectName}. Your review helps maintain community trust.`
                : `Thank you for rating ${subjectName}. The payment of ${taskReward} has been credited to the doer.`}
            </Text>

            <View style={styles.ratingSummaryRow}>
              <View style={styles.starsCompactRow}>
                {[1, 2, 3, 4, 5].map((s) => (
                  <Ionicons
                    key={s}
                    name={s <= rating ? 'star' : 'star-outline'}
                    size={16}
                    color="#F59E0B"
                  />
                ))}
              </View>
              <Text style={styles.ratingSummaryText}>{rating}.0 / 5.0</Text>
            </View>

            <TouchableOpacity
              style={styles.successDoneButton}
              onPress={() => {
                setIsSuccessModalOpen(false);
                router.replace('/dashboard');
              }}
              activeOpacity={0.85}
            >
              <Text style={styles.successDoneButtonText}>
                Back to Dashboard
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
