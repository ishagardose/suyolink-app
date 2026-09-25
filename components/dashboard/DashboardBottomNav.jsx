import React, { useMemo } from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import ThemedText from '../themed/ThemedText';

const TABS = [
  { id: 'home', label: 'Home', icon: 'home' },
  { id: 'mysuyos', label: 'Mysuyos', icon: 'bicycle' },
  { id: 'messages', label: 'Messages', icon: 'chatbubbles' },
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
            style={styles.navItem}
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
      bottom: 0,
      left: 0,
      right: 0,
      height: 60,
      backgroundColor: colors.surface,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-around',
      borderTopWidth: 1,
      borderTopColor: colors.border,
      zIndex: 95,
    },
    navItem: {
      alignItems: 'center',
      justifyContent: 'center',
      flex: 1,
      height: '100%',
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
