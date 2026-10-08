import { useMemo } from 'react';
import { themeStyles, resolvePaletteColor } from '../../theme/paletteAdapter';
import { useTheme } from '../../theme/ThemeContext';
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import RequestForm from './RequestForm';

export default function PostSuyoScreen() {
  const { colors, isDark } = useTheme();
  const styles = useMemo(
    () => StyleSheet.create(themeStyles(definitions, colors, isDark)),
    [colors, isDark],
  );
  const resolveColor = (value, property = 'color') =>
    resolvePaletteColor(value, property, colors, isDark);
  const router = useRouter();
  const { repost } = useLocalSearchParams();

  return (
    <SafeAreaView
      style={styles.safeContainer}
      edges={['top', 'left', 'right']}
    >
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <View style={styles.navBar}>
        <TouchableOpacity
          style={styles.backButton}
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
            color={resolveColor('#163523')}
          />
        </TouchableOpacity>
        <Text style={styles.navBarTitle}>Post a Suyo</Text>
        <View style={{ width: 38 }} />
      </View>
      <RequestForm
        key={typeof repost === 'string' ? repost : 'new'}
        repostId={typeof repost === 'string' ? repost : null}
        onPosted={() =>
          router.replace({
            pathname: '/dashboard',
            params: { justPosted: 'true' },
          })
        }
      />
    </SafeAreaView>
  );
}

const definitions = {
  safeContainer: {
    flex: 1,
    backgroundColor: '#F8FAF8',
  },
  navBar: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E8EFEA',
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0F6F2',
  },
  navBarTitle: {
    fontSize: 16.5,
    fontWeight: '800',
    color: '#163523',
    letterSpacing: -0.2,
  },
};
