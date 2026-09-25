import React, { useMemo } from 'react';
import { StyleSheet, View, Image } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import ThemedText from '../themed/ThemedText';

export default function DashboardHero({ name }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <View style={styles.headerHeroSection}>
      <View style={styles.heroTextBlock}>
        <View style={styles.locationPill}>
          <Ionicons name="location-sharp" size={11} color={colors.accent} />
          <ThemedText style={styles.locationPillText}>Makati CBD</ThemedText>
        </View>
        <ThemedText style={styles.welcomeSubText}>WELCOME BACK</ThemedText>
        <ThemedText style={styles.welcomeNameText} numberOfLines={1}>
          {name}
        </ThemedText>
        <ThemedText style={styles.welcomeTagline}>
          Need an errand done today?
        </ThemedText>
      </View>
      <Image
        source={require('../../assets/scooter_hero_isometric.jpg')}
        style={styles.heroImageSticker}
        resizeMode="contain"
      />
    </View>
  );
}

const createStyles = (colors) =>
  StyleSheet.create({
    headerHeroSection: {
      width: '100%',
      height: 185,
      backgroundColor: colors.hero,
      overflow: 'hidden',
      position: 'relative',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
    },
    heroTextBlock: {
      flex: 1.1,
      justifyContent: 'center',
      zIndex: 2,
      paddingRight: 8,
    },
    heroImageSticker: {
      width: '58%',
      height: '135%',
      position: 'absolute',
      right: -12,
      top: -15,
      zIndex: 1,
      opacity: 1,
    },
    locationPill: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(255, 255, 255, 0.15)',
      alignSelf: 'flex-start',
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 10,
      gap: 4,
      marginBottom: 8,
    },
    locationPillText: {
      fontSize: 11,
      fontWeight: '600',
      color: colors.onBrand,
      letterSpacing: 0.2,
    },
    welcomeSubText: {
      fontSize: 11.5,
      color: colors.onBrand,
      fontWeight: '700',
      letterSpacing: 1.2,
      marginBottom: 2,
    },
    welcomeNameText: {
      fontSize: 21,
      fontWeight: '800',
      color: colors.onPrimary,
      letterSpacing: -0.5,
      marginBottom: 4,
      lineHeight: 26,
    },
    welcomeTagline: {
      fontSize: 12,
      color: colors.onBrand,
      fontWeight: '500',
    },
  });
