import React, { useMemo } from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import ThemedText from '../themed/ThemedText';

export default function QuickServices({ actions }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <>
      <ThemedText style={styles.sectionHeading}>Quick Services</ThemedText>
      <View style={styles.quickActionGrid}>
        {actions.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.actionCard}
            activeOpacity={0.75}
          >
            <View style={styles.actionIconCircle}>
              <Ionicons name={item.icon} size={24} color={colors.link} />
            </View>
            <ThemedText style={styles.actionTitleText}>{item.title}</ThemedText>
          </TouchableOpacity>
        ))}
      </View>
    </>
  );
}

const createStyles = (colors) =>
  StyleSheet.create({
    sectionHeading: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 12,
    },
    quickActionGrid: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: 12,
    },
    actionCard: {
      width: '48%',
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 14,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'flex-start',
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.04,
      shadowRadius: 2,
      elevation: 1,
    },
    actionIconCircle: {
      width: 44,
      height: 44,
      borderRadius: 12,
      backgroundColor: colors.surfaceAlt,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 10,
    },
    actionTitleText: {
      fontSize: 13.5,
      fontWeight: '700',
      color: colors.text,
    },
  });
