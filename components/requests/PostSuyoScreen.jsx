import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '../../theme/ThemeContext';
import ScreenHeader from '../ScreenHeader';
import RequestForm from './RequestForm';
export default function PostSuyoScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  return <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top', 'left', 'right']}>
    <ScreenHeader title="Post a suyo" onBack={() => router.canGoBack() ? router.back() : router.replace('/dashboard')} />
    <RequestForm onPosted={() => router.replace({ pathname: '/dashboard', params: { justPosted: 'true' } })} />
  </SafeAreaView>;
}
