import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import ThemedTextInput from '../themed/ThemedTextInput';

export default function DashboardSearch() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <View style={styles.searchBarContainer}>
      <Ionicons
        name="search-outline"
        size={20}
        color={colors.muted}
        style={styles.searchIcon}
      />
      <ThemedTextInput
        style={styles.searchInput}
        placeholder="Search suyo request, errand, or doer..."
        placeholderTextColor={colors.muted}
      />
    </View>
  );
}

const createStyles = (colors) =>
  StyleSheet.create({
    searchBarContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 16,
      paddingHorizontal: 14,
      height: 48,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 4,
      elevation: 2,
      marginBottom: 16,
      marginTop: 16,
    },
    searchIcon: {
      marginRight: 10,
    },
    searchInput: {
      flex: 1,
      fontSize: 14,
      color: colors.text,
    },
  });
