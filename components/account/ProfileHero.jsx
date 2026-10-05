import React from 'react';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeContext';
import ThemedText from '../themed/ThemedText';
import styles from './account.styles';

export default function ProfileHero({
  displayName,
  loading,
  reviews,
  emailVerified,
}) {
  const { colors } = useTheme();
  const initials = (displayName || '?')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
  const average = reviews.length
    ? (reviews.reduce((sum, r) => sum + r.score, 0) / reviews.length).toFixed(1)
    : '—';
  return (
    <View style={[styles.hero, { backgroundColor: colors.heroBackground }]}>
      <View
        pointerEvents="none"
        style={[styles.orbit, { borderColor: colors.heroTextMuted }]}
      />
      <ThemedText
        style={{
          color: colors.heroTextMuted,
          fontSize: 10,
          fontWeight: '700',
          letterSpacing: 2,
        }}
      >
        YOUR COMMUNITY. YOUR CONNECTIONS.
      </ThemedText>
      <View style={styles.heroIdentity}>
        <View
          style={[
            styles.avatar,
            {
              backgroundColor: colors.primary,
              borderColor: colors.accent,
            },
          ]}
        >
          <ThemedText
            style={{
              fontSize: 30,
              fontWeight: '800',
              color: colors.heroText,
            }}
          >
            {initials}
          </ThemedText>
        </View>
        <View style={{ flex: 1, gap: 7 }}>
          <ThemedText
            style={{
              color: colors.heroText,
              fontSize: 25,
              lineHeight: 31,
              fontWeight: '800',
              letterSpacing: -0.6,
            }}
          >
            {displayName || (loading ? 'Loading profile…' : 'Community member')}
          </ThemedText>
          <ThemedText style={{ color: colors.heroTextMuted, fontSize: 13 }}>
            SuyoLink community member
          </ThemedText>
          {emailVerified ? (
            <View style={styles.inline}>
              <Ionicons
                name="checkmark-circle"
                size={14}
                color={colors.heroTextMuted}
              />
              <ThemedText style={{ color: colors.heroTextMuted, fontSize: 11 }}>
                Email verified
              </ThemedText>
            </View>
          ) : null}
        </View>
      </View>
      <View style={[styles.heroStats, { borderTopColor: colors.primary }]}>
        <View style={styles.stat}>
          <View style={styles.inline}>
            <Ionicons
              name="star"
              size={15}
              color={colors.heroTextMuted}
            />
            <ThemedText style={[styles.statValue, { color: colors.heroText }]}>
              {loading ? '…' : average}
            </ThemedText>
          </View>
          <ThemedText style={{ color: colors.heroTextMuted, fontSize: 11 }}>
            Average rating
          </ThemedText>
        </View>
        <View
          style={[
            styles.stat,
            { borderLeftWidth: 1, borderLeftColor: colors.primary },
          ]}
        >
          <ThemedText style={[styles.statValue, { color: colors.heroText }]}>
            {loading ? '…' : reviews.length}
          </ThemedText>
          <ThemedText style={{ color: colors.heroTextMuted, fontSize: 11 }}>
            Reviews received
          </ThemedText>
        </View>
      </View>
    </View>
  );
}
