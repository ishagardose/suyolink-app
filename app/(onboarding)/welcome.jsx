import React from 'react';
import { Image, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '../../theme/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import ThemedText from '../../components/themed/ThemedText';
import ThemedButton from '../../components/themed/ThemedButton';

export default function WelcomeScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { user } = useAuth();
  return <SafeAreaView style={[styles.root, { backgroundColor: colors.surface }]}>
    <StatusBar style={isDark ? 'light' : 'dark'} />
    <ScrollView contentContainerStyle={styles.content}>
      <ThemedText style={styles.brand}>SUYOLINK</ThemedText>
      <Image source={require('../../assets/welcome_waving_woman.png')} style={styles.image} resizeMode="contain" />
      <ThemedText style={styles.title}>Welcome, {user?.name}!</ThemedText>
      <ThemedText tone="textSecondary" style={styles.body}>
        Your local profile is ready. Explore SuyoLink and try out the demo errands.
      </ThemedText>
      <ThemedButton title="Get Started" onPress={() => router.replace('/dashboard')} style={styles.button} />
    </ScrollView>
  </SafeAreaView>;
}
const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 28, gap: 20 },
  brand: { fontSize: 18, fontWeight: '900', letterSpacing: 2 },
  image: { width: '100%', maxWidth: 340, height: 280 },
  title: { fontSize: 30, fontWeight: '800', textAlign: 'center' },
  body: { fontSize: 15, lineHeight: 22, textAlign: 'center', maxWidth: 340 },
  button: { width: '100%', marginTop: 12 },
});
