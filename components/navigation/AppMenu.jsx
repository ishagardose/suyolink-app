import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../theme/ThemeContext';
import ThemedText from '../themed/ThemedText';
import { useNotificationsModal } from '../../context/NotificationsModalContext';

export default function AppMenu({
  visible,
  onClose,
  active = 'home',
  onDashboardTab,
  unread = 0,
}) {
  const router = useRouter();
  const { openNotifications } = useNotificationsModal();
  const { user, logout } = useAuth();
  const { colors } = useTheme();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const { width } = useWindowDimensions();
  const drawerWidth = Math.min(width * 0.86, 360);
  const progress = useRef(new Animated.Value(0)).current;
  const closing = useRef(false);
  useEffect(() => {
    if (!visible) return;
    closing.current = false;
    progress.setValue(0);
    const animation = Animated.timing(progress, {
      toValue: 1,
      duration: 280,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: Platform.OS !== 'web',
    });
    animation.start();
    return () => animation.stop();
  }, [visible, progress]);
  const close = (afterClose) => {
    if (closing.current) return;
    closing.current = true;
    Animated.timing(progress, {
      toValue: 0,
      duration: 220,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: Platform.OS !== 'web',
    }).start(({ finished }) => {
      if (!finished) return;
      onClose();
      afterClose?.();
    });
  };
  const navigate = (route, tab) => {
    close(() => {
      if (route === 'notifications') openNotifications();
      else if (tab && onDashboardTab) onDashboardTab(tab);
      else
        router.push(tab ? { pathname: '/dashboard', params: { tab } } : route);
    });
  };
  const groups = [
    [
      'EXPLORE',
      [
        ['home', 'home-outline', 'Find a suyo', '/dashboard', 'home'],
        [
          'mysuyo',
          'file-tray-outline',
          'My posted suyos',
          '/dashboard',
          'mysuyo',
        ],
        ['doer', 'bicycle-outline', 'My accepted tasks', '/dashboard', 'doer'],
        ['post', 'add-circle-outline', 'Post a suyo', '/post-suyo'],
      ],
    ],
    [
      'YOUR ACCOUNT',
      [
        ['account', 'person-outline', 'My profile', '/account'],
        [
          'notifications',
          'notifications-outline',
          'Notifications',
          'notifications',
        ],
        [
          'wallet',
          'wallet-outline',
          'Wallet',
          '/wallet',
        ],
        [
          'transactions',
          'receipt-outline',
          'Transaction history',
          '/transactions',
        ],
        ['map', 'navigate-outline', 'Live Tracking', '/map'],
        ['location', 'location-outline', 'Change area', '/set-location'],
      ],
    ],
  ];
  if (!visible) return null;
  return (
    <Modal
      visible
      transparent
      animationType="none"
      onRequestClose={() => close()}
    >
      <View style={styles.overlay}>
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            { opacity: progress, backgroundColor: colors.backdrop },
          ]}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close menu backdrop"
            onPress={() => close()}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
        <Animated.View
          testID="menu-drawer"
          style={[
            styles.drawer,
            {
              width: drawerWidth,
              backgroundColor: colors.card,
              transform: [
                {
                  translateX: progress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-drawerWidth, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <SafeAreaView style={{ flex: 1 }}>
            <View style={styles.top}>
              <ThemedText style={styles.brand}>
                SuyoLink
                <ThemedText style={{ color: colors.accent }}>.</ThemedText>
              </ThemedText>
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Close menu"
                onPress={() => close()}
                style={[styles.close, { backgroundColor: colors.surfaceAlt }]}
              >
                <Ionicons
                  name="close"
                  size={22}
                  color={colors.text}
                />
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={styles.content}>
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="View my profile"
                onPress={() => navigate('/account')}
                style={[
                  styles.identity,
                  { backgroundColor: colors.heroBackground },
                ]}
              >
                <View
                  style={[styles.avatar, { backgroundColor: colors.primary }]}
                >
                  <ThemedText
                    style={{
                      color: colors.onPrimary,
                      fontSize: 22,
                      fontWeight: '800',
                    }}
                  >
                    {(user?.name || '?').trim().slice(0, 1).toUpperCase()}
                  </ThemedText>
                </View>
                <View style={{ flex: 1, gap: 4 }}>
                  <ThemedText
                    numberOfLines={2}
                    style={{
                      color: colors.heroText,
                      fontSize: 16,
                      fontWeight: '700',
                    }}
                  >
                    {user?.name || 'Your profile'}
                  </ThemedText>
                  <ThemedText
                    style={{ color: colors.heroTextMuted, fontSize: 12 }}
                  >
                    View and edit your profile
                  </ThemedText>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color={colors.heroTextMuted}
                />
              </TouchableOpacity>
              {groups.map(([heading, rows]) => (
                <View
                  key={heading}
                  style={{ gap: 6 }}
                >
                  <ThemedText
                    tone="textMuted"
                    style={styles.heading}
                  >
                    {heading}
                  </ThemedText>
                  {rows.map(([key, icon, label, route, tab]) => (
                    <TouchableOpacity
                      key={key}
                      accessibilityRole="button"
                      accessibilityLabel={label}
                      accessibilityState={{ selected: active === key }}
                      onPress={() => navigate(route, tab)}
                      style={[
                        styles.row,
                        active === key && {
                          backgroundColor: colors.surfaceAlt,
                        },
                      ]}
                    >
                      <Ionicons
                        name={icon}
                        size={21}
                        color={active === key ? colors.link : colors.muted}
                      />
                      <ThemedText
                        style={{
                          flex: 1,
                          fontSize: 14,
                          fontWeight: active === key ? '700' : '500',
                        }}
                      >
                        {label}
                      </ThemedText>
                      {key === 'notifications' && unread > 0 ? (
                        <View
                          style={[
                            styles.badge,
                            { backgroundColor: colors.surfaceAlt },
                          ]}
                        >
                          <ThemedText
                            style={{
                              color: colors.link,
                              fontSize: 11,
                              fontWeight: '700',
                            }}
                          >
                            {unread > 99 ? '99+' : unread}
                          </ThemedText>
                        </View>
                      ) : (
                        <Ionicons
                          name="chevron-forward"
                          size={14}
                          color={colors.muted}
                        />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              ))}
              {error ? (
                <ThemedText
                  tone="danger"
                  accessibilityRole="alert"
                >
                  {error}
                </ThemedText>
              ) : null}
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Sign out"
                disabled={busy}
                onPress={async () => {
                  setBusy(true);
                  setError('');
                  try {
                    await logout();
                    close(() => router.replace('/'));
                  } catch (e) {
                    setError(e.message);
                  } finally {
                    setBusy(false);
                  }
                }}
                style={[
                  styles.row,
                  {
                    borderTopWidth: 1,
                    borderTopColor: colors.border,
                    marginTop: 8,
                    opacity: busy ? 0.5 : 1,
                  },
                ]}
              >
                <Ionicons
                  name="log-out-outline"
                  size={21}
                  color={colors.danger}
                />
                <ThemedText style={{ color: colors.danger, fontWeight: '600' }}>
                  {busy ? 'Signing out…' : 'Sign out'}
                </ThemedText>
              </TouchableOpacity>
              <ThemedText
                tone="textMuted"
                style={{ fontSize: 11, paddingHorizontal: 14 }}
              >
                A little help goes a long way.
              </ThemedText>
            </ScrollView>
          </SafeAreaView>
        </Animated.View>
      </View>
    </Modal>
  );
}
const styles = StyleSheet.create({
  overlay: { flex: 1, flexDirection: 'row' },
  drawer: {
    height: '100%',
    borderTopRightRadius: 28,
    borderBottomRightRadius: 28,
    overflow: 'hidden',
  },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 22,
  },
  brand: { fontSize: 26, fontWeight: '800', letterSpacing: -1 },
  close: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: { paddingHorizontal: 18, paddingBottom: 24, gap: 20 },
  identity: {
    padding: 16,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heading: {
    fontSize: 10,
    letterSpacing: 1.5,
    fontWeight: '700',
    paddingHorizontal: 14,
    marginBottom: 6,
  },
  row: {
    flexDirection: 'row',
    gap: 14,
    alignItems: 'center',
    minHeight: 50,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
  },
  badge: { minWidth: 25, padding: 5, borderRadius: 8, alignItems: 'center' },
});
