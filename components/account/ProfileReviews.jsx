import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { View, Text } from 'react-native';
import { FIXED_COLORS } from '../../theme/colors';
import { getInitials, formatFeedbackDate } from './profileFormat';

export default function ProfileReviews({
  styles,
  colors,
  own,
  loading,
  dynamicFeedbacks,
  displayRating,
}) {
  return (
    <View style={styles.feedbackSection}>
      <View style={styles.feedbackSectionHeader}>
        <View>
          <Text style={styles.sectionHeading}>Community Feedback</Text>
          <Text style={styles.feedbackSubheading}>
            Ratings & reviews from completed tasks
          </Text>
        </View>
        <View style={styles.feedbackRatingBadge}>
          {displayRating !== 'No ratings yet' && (
            <Ionicons
              name="star"
              size={13}
              color={colors.warning}
            />
          )}
          <Text style={styles.feedbackRatingBadgeText}>{displayRating}</Text>
        </View>
      </View>

      <View style={styles.feedbackList}>
        {dynamicFeedbacks.length > 0 ? (
          dynamicFeedbacks.map((item) => (
            <View
              key={item.id}
              style={styles.feedbackCard}
            >
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
                      name={
                        star <= Math.round(item.score) ? 'star' : 'star-outline'
                      }
                      size={12}
                      color={FIXED_COLORS.ratingGold}
                      style={{ marginLeft: 1 }}
                    />
                  ))}
                  <Text style={styles.feedbackCardRatingNum}>
                    {Number(item.score).toFixed(1)}
                  </Text>
                </View>
              </View>

              <Text style={styles.feedbackCommentText}>
                {item.comment || `Rated ${item.score} out of 5 stars.`}
              </Text>
            </View>
          ))
        ) : (
          <View style={styles.feedbackEmptyCard}>
            <View style={styles.feedbackEmptyIconCircle}>
              <Ionicons
                name="chatbubbles-outline"
                size={24}
                color={colors.link}
              />
            </View>
            <Text style={styles.feedbackEmptyTitle}>
              {loading ? 'Loading reviews...' : 'No reviews yet'}
            </Text>
            <Text style={styles.feedbackEmptySub}>
              {own
                ? 'Ratings and comments from requesters and doers will appear here once you complete suyos.'
                : 'This community member has not received any reviews yet.'}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}
