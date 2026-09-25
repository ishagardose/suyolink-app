import ThemedText from '../themed/ThemedText';
import React, { useMemo } from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeContext';

export default function ActiveSuyoCard({ activeSuyo, onTrack }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
        <View style={styles.floatingFooterActiveBarWrapper} pointerEvents="box-none">
          <TouchableOpacity
            style={styles.floatingFooterActiveBar}
            activeOpacity={0.92}
            onPress={onTrack}
          >
            <View style={styles.footerBarHeader}>
              <View style={styles.footerBarLiveBadge}>
                <View style={styles.pulsingGreenDot} />
                <ThemedText style={styles.footerBarLiveText}>ACTIVE SUYO</ThemedText>
              </View>
              <View style={styles.footerBarTrackingRight}>
                <Ionicons name="map-outline" size={12} color={colors.success} style={{ marginRight: 3 }} />
                <ThemedText style={styles.footerBarTrackingText}>{activeSuyo.trackingNumber}</ThemedText>
              </View>
            </View>

            <View style={styles.footerBarBodyRow}>
              <View style={styles.footerBarTextCol}>
                <ThemedText style={styles.footerBarHeadline}>{activeSuyo.eta}</ThemedText>
                <ThemedText style={styles.footerBarSub} numberOfLines={1}>{activeSuyo.detail}</ThemedText>
              </View>
              <View style={styles.footerBarChevronCircle}>
                <Ionicons name="chevron-forward" size={14} color={colors.link} />
              </View>
            </View>

            <View style={styles.footerProgressBarTrack}>
              <View style={[styles.footerProgressBarFill, { width: activeSuyo.progress }]} />
            </View>
          </TouchableOpacity>
        </View>
  );
}
const createStyles = (colors) => StyleSheet.create({
  floatingFooterActiveBarWrapper: {
    position: 'absolute',
    bottom: 64,
    left: 14,
    right: 14,
    zIndex: 90,
  },
  floatingFooterActiveBar: {
    backgroundColor: colors.successSurface,
    borderRadius: 14,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: 'rgba(74, 222, 128, 0.4)',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 6,
  },
  footerBarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  footerBarLiveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(74, 222, 128, 0.25)',
    paddingVertical: 1,
    paddingHorizontal: 5,
    borderRadius: 4,
    gap: 4,
  },
  pulsingGreenDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.success,
  },
  footerBarLiveText: {
    fontSize: 8.5,
    fontWeight: '800',
    color: colors.success,
    letterSpacing: 0.4,
  },
  footerBarTrackingRight: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(39, 103, 57, 0.08)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  footerBarTrackingText: {
    fontSize: 10.5,
    color: colors.success,
    fontWeight: '700',
  },
  footerBarBodyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  footerBarTextCol: {
    flex: 1,
    paddingRight: 6,
  },
  footerBarHeadline: {
    fontSize: 12.5,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 1,
  },
  footerBarSub: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  footerBarChevronCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(30, 77, 43, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerProgressBarTrack: {
    height: 3,
    backgroundColor: 'rgba(30, 77, 43, 0.15)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  footerProgressBarFill: {
    height: '100%',
    backgroundColor: colors.success,
    borderRadius: 2,
  },
});
