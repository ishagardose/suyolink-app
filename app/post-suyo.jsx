import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { useTheme } from '../theme/ThemeContext';
import ScreenHeader from '../components/ScreenHeader';
import RequestForm from '../components/requests/RequestForm';

export default function PostSuyoScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <ScreenHeader
        title="Post a Suyo"
        onBack={() =>
          router.canGoBack() ? router.back() : router.replace('/dashboard')
        }
      />
      <RequestForm onPosted={() => router.dismissTo('/dashboard')} />
    </SafeAreaView>
  );
}
