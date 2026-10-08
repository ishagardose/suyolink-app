import AppearanceSelector from '../themed/AppearanceSelector';
import React, { useMemo } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeContext';
import { createAccountStyles } from './account.styles';
import useAccountProfile from './useAccountProfile';
import ProfileCard from './ProfileCard';
import ProfileReviews from './ProfileReviews';
import EditProfileModal from './EditProfileModal';

export default function AccountScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => createAccountStyles(colors), [colors]);
  const profile = useAccountProfile(params);
  const { own, error, saved } = profile;

  return (
    <SafeAreaView
      style={styles.safeContainer}
      edges={['top', 'left', 'right']}
    >
      <StatusBar style={isDark ? 'light' : 'dark'} />

      {/* TOP HEADER BAR */}
      <View style={styles.headerBar}>
        <TouchableOpacity
          style={styles.headerIconButton}
          onPress={() =>
            router.canGoBack() ? router.back() : router.replace('/dashboard')
          }
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons
            name="arrow-back"
            size={22}
            color={colors.text}
          />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>{own ? 'My Profile' : 'Profile'}</Text>

        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: 40 + insets.bottom },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Error notification */}
        {error ? (
          <View
            style={styles.errorNotice}
            accessibilityRole="alert"
          >
            <Ionicons
              name="alert-circle-outline"
              size={18}
              color={colors.danger}
            />
            <Text style={styles.errorNoticeText}>{error}</Text>
          </View>
        ) : null}

        {/* Success notification */}
        {saved ? (
          <View
            style={styles.successNotice}
            accessibilityRole="alert"
          >
            <Ionicons
              name="checkmark-circle-outline"
              size={18}
              color={colors.success}
            />
            <Text style={styles.successNoticeText}>
              Your profile has been updated.
            </Text>
          </View>
        ) : null}

        <ProfileCard
          styles={styles}
          colors={colors}
          {...profile}
        />

        <View style={[styles.mainProfileCard, { padding: 20 }]}>
          <AppearanceSelector />
        </View>

        <ProfileReviews
          styles={styles}
          colors={colors}
          {...profile}
        />
      </ScrollView>

      <EditProfileModal
        styles={styles}
        colors={colors}
        {...profile}
      />
    </SafeAreaView>
  );
}
