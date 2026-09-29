import React, { useMemo } from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import ThemedText from '../themed/ThemedText';

const TABS = [
  { id: 'home', label: 'Home', icon: 'home' },
  { id: 'mysuyos', label: 'My Suyos', icon: 'bicycle' },
  { id: 'notifications', label: 'Notifications', icon: 'notifications' },
  { id: 'activity', label: 'Activity', icon: 'receipt' },
];

export default function DashboardBottomNav({ activeTab, onTabChange }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <View style={styles.bottomNavContainer}>
      {TABS.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <TouchableOpacity
            key={tab.id}
            accessibilityRole="button"
            accessibilityLabel={tab.label}
            accessibilityState={{ selected: isActive }}
            style={[styles.navItem, isActive && { backgroundColor: colors.surfaceAlt }]}
            onPress={() => {
              onTabChange(tab.id);
            }}
            activeOpacity={0.7}
          >
            <Ionicons
              name={isActive ? tab.icon : `${tab.icon}-outline`}
              size={22}
              color={isActive ? colors.link : colors.muted}
            />
            <ThemedText
              style={[styles.navItemText, isActive && styles.navItemTextActive]}
            >
              {tab.label}
            </ThemedText>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const createStyles = (colors) =>
  StyleSheet.create({
    bottomNavContainer: {
      position: 'absolute',
      bottom: 12,
      left: 14,
      right: 14,
      height: 68,
      padding: 6,
      borderRadius: 24,
      backgroundColor: colors.card,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-around',
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: colors.shadow,
      shadowOpacity: 0.1,
      shadowRadius: 14,
      shadowOffset: { width: 0, height: 4 },
      elevation: 5,
      zIndex: 95,
    },
    navItem: {
      alignItems: 'center',
      justifyContent: 'center',
      flex: 1,
      height: '100%',
      borderRadius: 18,
      gap: 3,
    },
    navItemText: {
      fontSize: 10.5,
      color: colors.muted,
      fontWeight: '600',
      marginTop: 2,
    },
    navItemTextActive: {
      color: colors.link,
      fontWeight: '700',
    },
  });
