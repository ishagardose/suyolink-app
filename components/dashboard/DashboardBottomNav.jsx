import React, { useMemo } from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import ThemedText from '../themed/ThemedText';

const TABS = [
  { id: 'home', label: 'Home', icon: 'home' },
  { id: 'mysuyo', label: 'My suyos', icon: 'receipt' },
  { id: 'post', label: 'Post', icon: 'add-circle' },
  { id: 'doer', label: 'My tasks', icon: 'bicycle' },
  { id: 'account', label: 'Account', icon: 'person' },
];

export default function DashboardBottomNav({
  activeTab,
  onTabChange,
  onPost,
  onAccount,
  bottomInset = 16,
}) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <View
      style={[
        styles.bottomNavContainer,
        { paddingBottom: bottomInset, height: 64 + bottomInset },
      ]}
    >
      <View
        style={{
          width: '100%',
          maxWidth: 900,
          flexDirection: 'row',
          alignItems: 'center',
        }}
      >
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              accessibilityRole="button"
              accessibilityLabel={tab.label}
              accessibilityState={{ selected: isActive }}
              style={[
                styles.navItem,
                isActive && { backgroundColor: colors.surfaceAlt },
              ]}
              onPress={() => {
                if (tab.id === 'post') onPost();
                else if (tab.id === 'account') onAccount();
                else onTabChange(tab.id);
              }}
              activeOpacity={0.7}
            >
              <Ionicons
                name={isActive ? tab.icon : `${tab.icon}-outline`}
                size={22}
                color={isActive ? colors.link : colors.muted}
              />
              <ThemedText
                style={[
                  styles.navItemText,
                  isActive && styles.navItemTextActive,
                ]}
              >
                {tab.label}
              </ThemedText>
            </TouchableOpacity>
          );
        })}
      </View>
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
      paddingTop: 8,
      paddingHorizontal: 8,
      backgroundColor: colors.card,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-around',
      borderTopWidth: 1,
      borderColor: colors.border,
      shadowColor: colors.shadow,
      shadowOpacity: 0.04,
      shadowRadius: 14,
      shadowOffset: { width: 0, height: 4 },
      elevation: 5,
      zIndex: 95,
    },
    navItem: {
      alignItems: 'center',
      justifyContent: 'center',
      flex: 1,
      minHeight: 48,
      borderRadius: 12,
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
