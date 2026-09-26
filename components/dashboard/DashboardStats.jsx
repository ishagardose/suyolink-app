import React, { useMemo } from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import ThemedText from '../themed/ThemedText';

export default function DashboardStats({ stats, onViewActivity }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <View style={styles.statsContainer}>
      <View style={styles.statCard}>
        <ThemedText style={styles.statCardLabel}>Completed</ThemedText>
        <ThemedText style={styles.statCardValue}>{stats.completed}</ThemedText>
      </View>

      <View style={styles.statCard}>
        <ThemedText style={styles.statCardLabel}>Earned</ThemedText>
        <ThemedText style={styles.statCardValue}>{stats.earned}</ThemedText>
      </View>

      <TouchableOpacity
        style={styles.statCard}
        activeOpacity={0.8}
        onPress={onViewActivity}
      >
        <ThemedText style={styles.statCardLabel}>Active</ThemedText>
        <View style={styles.statActiveRow}>
          <View style={styles.activeIndicatorDot} />
          <ThemedText style={styles.statCardValue}>{stats.active}</ThemedText>
        </View>
      </TouchableOpacity>
    </View>
  );
}

const createStyles = (colors) =>
  StyleSheet.create({
    statsContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: 10,
      marginBottom: 22,
    },
    statCard: {
      flex: 1,
      backgroundColor: colors.surface,
      borderRadius: 16,
      paddingVertical: 14,
      paddingHorizontal: 8,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.04,
      shadowRadius: 2,
      elevation: 1,
    },
    statCardLabel: {
      fontSize: 11.5,
      fontWeight: '600',
      color: colors.muted,
      marginBottom: 4,
    },
    statCardValue: {
      fontSize: 16,
      fontWeight: '800',
      color: colors.text,
    },
    statActiveRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
    },
    activeIndicatorDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: colors.accent,
    },
  });
