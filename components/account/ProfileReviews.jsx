import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeContext';
import ThemedText from '../themed/ThemedText';
import styles from './account.styles';

export default function ProfileReviews({ reviews, loading }) {
  const { colors } = useTheme();
  const card = [
    styles.card,
    { backgroundColor: colors.card, borderColor: colors.border },
  ];

  return (
    <View style={card}>
      <View style={styles.sectionHeader}>
        <ThemedText style={styles.sectionTitle}>Reviews received</ThemedText>
        <View style={[styles.count, { backgroundColor: colors.surfaceAlt }]}>
          <ThemedText
            style={{
              color: colors.link,
              fontSize: 12,
              fontWeight: '700',
            }}
          >
            {reviews.length}
          </ThemedText>
        </View>
      </View>
      {loading ? (
        <ActivityIndicator
          style={{ padding: 24 }}
          color={colors.link}
        />
      ) : reviews.length ? (
        reviews.map((r) => (
          <View
            key={r.id}
            style={[styles.review, { borderTopColor: colors.border }]}
          >
            <View
              style={[
                styles.inline,
                { justifyContent: 'space-between', flexWrap: 'wrap' },
              ]}
            >
              <View
                style={{ flexDirection: 'row', gap: 3 }}
                accessibilityLabel={r.score + ' out of 5 stars'}
              >
                {[1, 2, 3, 4, 5].map((star) => (
                  <Ionicons
                    key={star}
                    name={star <= r.score ? 'star' : 'star-outline'}
                    size={15}
                    color={colors.link}
                  />
                ))}
              </View>
              <ThemedText
                tone="textMuted"
                style={{ fontSize: 11 }}
              >
                {new Date(r.created_at).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </ThemedText>
            </View>
            <ThemedText style={{ fontSize: 14, lineHeight: 22 }}>
              {r.comment || 'No written review'}
            </ThemedText>
          </View>
        ))
      ) : (
        <View style={styles.empty}>
          <View
            style={[styles.emptyIcon, { backgroundColor: colors.surfaceAlt }]}
          >
            <Ionicons
              name="chatbubbles-outline"
              size={25}
              color={colors.link}
            />
          </View>
          <ThemedText style={{ fontSize: 15, fontWeight: '700' }}>
            No reviews yet
          </ThemedText>
          <ThemedText
            tone="textMuted"
            style={{ textAlign: 'center', fontSize: 13, lineHeight: 20 }}
          >
            Feedback from completed suyos will appear here.
          </ThemedText>
        </View>
      )}
    </View>
  );
}
