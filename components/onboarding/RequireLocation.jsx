import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Redirect, usePathname } from 'expo-router';
import { useDeviceLocation } from '../../context/LocationContext';
import { useTheme } from '../../theme/ThemeContext';

export default function RequireLocation({ children, allowSetup = false }) {
  const { isReady, hasSavedLocation } = useDeviceLocation();
  const { colors } = useTheme();
  const pathname = usePathname();
  if (allowSetup && pathname === '/set-location') return children;
  if (!isReady)
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.background,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <ActivityIndicator
          color={colors.link}
          accessibilityLabel="Restoring your location"
        />
      </View>
    );
  if (!hasSavedLocation) return <Redirect href="/set-location" />;
  return children;
}
