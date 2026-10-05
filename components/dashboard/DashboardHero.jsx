import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../theme/ThemeContext';
import ThemedText from '../themed/ThemedText';

export default function DashboardHero({ name }) {
  const { colors } = useTheme();
  return <View style={[styles.hero, { backgroundColor: colors.hero }]}>
    <View pointerEvents="none" accessible={false} style={styles.art}>
      <Image source={require('../../assets/scooter_hero_isometric.jpg')} style={styles.heroImage} resizeMode="cover" accessible={false} />
      <LinearGradient colors={[colors.hero, `${colors.hero}00`]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} />
    </View>
    <View style={styles.copy}>
      <ThemedText style={[styles.eyebrow, { color: colors.heroTextMuted }]}>A LITTLE HELP GOES A LONG WAY</ThemedText>
      <ThemedText style={[styles.name, { color: colors.heroText }]} numberOfLines={2}>Hi, {name}.</ThemedText>
      <ThemedText style={[styles.subtitle, { color: colors.heroTextMuted }]}>What can we help with today?</ThemedText>
    </View>
  </View>;
}
const styles = StyleSheet.create({
  hero: { justifyContent: 'center', minHeight: 190, paddingHorizontal: 24, paddingTop: 18, paddingBottom: 42, overflow: 'hidden' },
  copy: { width: '65%', gap: 9, zIndex: 1 }, eyebrow: { fontSize: 9, letterSpacing: 1.5, fontWeight: '700', lineHeight: 14 },
  name: { fontSize: 30, lineHeight: 36, fontWeight: '800', letterSpacing: -1 }, subtitle: { fontSize: 13, lineHeight: 20 },
  art: { position: 'absolute', right: 0, top: 0, bottom: 0, width: '48%', maxWidth: 190 },
  heroImage: { width: '100%', height: '100%' },
});
