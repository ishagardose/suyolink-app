import React from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '../theme/ThemeContext';
import ScreenHeader from '../components/ScreenHeader';
import Notifications from '../components/dashboard/Notifications';

export default function NotificationsScreen() {
  const router = useRouter();
  const { colors } = useTheme();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScreenHeader
        title="Notifications"
        onBack={() => (router.canGoBack() ? router.back() : router.replace('/dashboard'))}
      />
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 60 }}>
        <Notifications />
      </ScrollView>
    </SafeAreaView>
  );
}
