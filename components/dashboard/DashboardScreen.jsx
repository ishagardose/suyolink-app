import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { useSuyos } from '../../context/SuyoContext';
import { useDeviceLocation } from '../../context/LocationContext';
import { useTheme } from '../../theme/ThemeContext';
import {
  CATEGORIES,
  STATUS_LABELS,
  formatOffer,
} from '../../data/suyoRequests';
import ThemedText from '../themed/ThemedText';
import ThemedTextInput from '../themed/ThemedTextInput';
import ThemedButton from '../themed/ThemedButton';
import { Ionicons } from '@expo/vector-icons';
import FilterChips from './FilterChips';
import DashboardFilters from './DashboardFilters';
import TaskListCard from './TaskListCard';
import DashboardBottomNav from './DashboardBottomNav';
import AppMenu from '../navigation/AppMenu';
import { useNotificationsModal } from '../../context/NotificationsModalContext';

export default function DashboardScreen() {
  const router = useRouter();
  const { openNotifications } = useNotificationsModal();
  const { user } = useAuth();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { position } = useDeviceLocation();
  const {
    requests,
    notifications,
    applications,
    isLoading,
    error,
    refresh,
    setListFilters,
  } = useSuyos();
  const params = useLocalSearchParams();
  const [tab, setTab] = useState(
    params.justPosted
      ? 'mysuyo'
      : ['home', 'mysuyo', 'doer'].includes(params.tab)
        ? params.tab
        : 'home',
  );
  const [menuOpen, setMenuOpen] = useState(false);
  useEffect(() => {
    if (['home', 'mysuyo', 'doer'].includes(params.tab)) {
      setTab(params.tab);
      setStatus('');
    }
  }, [params.tab]);
  const [status, setStatus] = useState('');
  const [category, setCategory] = useState('');
  const [sort, setSort] = useState('newest');
  const [query, setQuery] = useState('');
  const [radius, setRadius] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);
  useEffect(() => {
    const timer = setTimeout(
      () =>
        setListFilters({
          query,
          category: category || null,
          scope:
            tab === 'mysuyo'
              ? 'posted'
              : tab === 'doer'
                ? 'assigned'
                : 'browse',
          status: status || null,
          sort,
          origin: position,
          radiusKm: tab === 'home' && radius ? Number(radius) : null,
        }),
      250,
    );
    return () => clearTimeout(timer);
  }, [
    tab,
    status,
    category,
    sort,
    query,
    position?.latitude,
    position?.longitude,
    radius,
    setListFilters,
  ]);
  const items = useMemo(
    () =>
      requests.filter((r) => {
        if (tab === 'mysuyo') return r.requesterId === user?.id;
        if (tab === 'doer') return r.providerId === user?.id;
        return (
          r.status === 'open' &&
          (!r.deadline || Date.parse(r.deadline) > Date.now())
        );
      }),
    [requests, tab, user?.id],
  );
  const unread = notifications.filter((n) => !n.read_at).length;
  const pending = applications.filter(
    (a) => a.applicant_id === user?.id && a.status === 'pending',
  );
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{
          padding: 20,
          gap: 12,
          paddingBottom: 110 + insets.bottom,
          width: '100%',
          maxWidth: 900,
          alignSelf: 'center',
        }}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={refresh}
          />
        }
        ListHeaderComponent={
          <View style={{ gap: 20, marginBottom: 8 }}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                  flex: 1,
                }}
              >
                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityLabel="Open sidebar"
                  accessibilityState={{ expanded: menuOpen }}
                  onPress={() => setMenuOpen(true)}
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 15,
                    backgroundColor: colors.card,
                    borderWidth: 1,
                    borderColor: colors.border,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons
                    name="menu-outline"
                    size={24}
                    color={colors.text}
                  />
                </TouchableOpacity>
                <View style={{ flex: 1 }}>
                  <ThemedText
                    style={{
                      fontSize: 25,
                      fontWeight: '800',
                      letterSpacing: -1,
                    }}
                  >
                    SuyoLink
                    <ThemedText style={{ color: colors.accent }}>.</ThemedText>
                  </ThemedText>
                  <TouchableOpacity
                    accessibilityRole="button"
                    accessibilityLabel={
                      position ? 'Change area' : 'Set location'
                    }
                    onPress={() => router.push('/set-location')}
                    style={{
                      flexDirection: 'row',
                      gap: 4,
                      alignItems: 'center',
                      minHeight: 36,
                    }}
                  >
                    <Ionicons
                      name="location-outline"
                      size={14}
                      color={colors.link}
                    />
                    <ThemedText
                      tone="textMuted"
                      style={{ fontSize: 12 }}
                    >
                      {position ? 'Your selected area' : 'Choose your area'}
                    </ThemedText>
                    <Ionicons
                      name="chevron-down"
                      size={12}
                      color={colors.muted}
                    />
                  </TouchableOpacity>
                </View>
              </View>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {[
                  ['receipt-outline', 'Transactions', '/transactions'],
                  [
                    'notifications-outline',
                    `Notifications${unread ? ` (${unread})` : ''}`,
                    'notifications',
                  ],
                ].map(([icon, label, route]) => (
                  <TouchableOpacity
                    key={route}
                    accessibilityRole="button"
                    accessibilityLabel={label}
                    onPress={() =>
                      route === 'notifications'
                        ? openNotifications()
                        : router.push(route)
                    }
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 15,
                      backgroundColor: colors.card,
                      borderWidth: 1,
                      borderColor: colors.border,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Ionicons
                      name={icon}
                      size={21}
                      color={colors.text}
                    />
                    {route === 'notifications' && unread > 0 ? (
                      <View
                        style={{
                          position: 'absolute',
                          top: 9,
                          right: 9,
                          width: 7,
                          height: 7,
                          borderRadius: 4,
                          backgroundColor: colors.danger,
                        }}
                      />
                    ) : null}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            {tab === 'home' ? (
              <View
                style={{
                  backgroundColor: colors.heroBackground,
                  padding: 22,
                  borderRadius: 24,
                  gap: 8,
                }}
              >
                <ThemedText
                  style={{ color: colors.heroTextMuted, fontSize: 12 }}
                >
                  Hello, {(user?.name || 'neighbor').split(' ')[0]}
                </ThemedText>
                <ThemedText
                  style={{
                    color: colors.heroText,
                    fontSize: 26,
                    fontWeight: '700',
                    lineHeight: 32,
                    letterSpacing: -0.5,
                  }}
                >
                  A little help.{'\n'}A better day.
                </ThemedText>
                <ThemedText
                  style={{
                    color: colors.heroTextMuted,
                    fontSize: 13,
                    lineHeight: 20,
                  }}
                >
                  Find a task nearby or ask your community for a hand.
                </ThemedText>
              </View>
            ) : null}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 10,
                backgroundColor: colors.card,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: colors.border,
                paddingHorizontal: 16,
              }}
            >
              <Ionicons
                name="search-outline"
                size={19}
                color={colors.muted}
              />
              <ThemedTextInput
                accessibilityLabel="Search suyos"
                placeholder="Search tasks or areas"
                value={query}
                onChangeText={setQuery}
                style={{ flex: 1, minHeight: 52, fontSize: 14, minWidth: 0 }}
              />
            </View>
            <FilterChips
              items={[['', 'All categories'], ...CATEGORIES.map((c) => [c, c])]}
              value={category}
              onChange={setCategory}
            />
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 10,
              }}
            >
              <ThemedText style={{ fontSize: 20, fontWeight: '700', flex: 1 }}>
                {tab === 'home'
                  ? 'Find a suyo'
                  : tab === 'mysuyo'
                    ? 'My posted suyos'
                    : 'My accepted tasks'}
              </ThemedText>
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Filters"
                onPress={() => setFiltersOpen(true)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                  minHeight: 44,
                  paddingHorizontal: 12,
                  borderRadius: 12,
                  backgroundColor: colors.surfaceAlt,
                }}
              >
                <Ionicons
                  name="options-outline"
                  size={17}
                  color={colors.link}
                />
                <ThemedText
                  style={{
                    fontSize: 12,
                    fontWeight: '700',
                    color: colors.link,
                  }}
                >
                  Filters{sort !== 'newest' || radius ? ' *' : ''}
                </ThemedText>
              </TouchableOpacity>
            </View>
            {tab !== 'home' ? (
              <FilterChips
                items={[['', 'All statuses'], ...Object.entries(STATUS_LABELS)]}
                value={status}
                onChange={setStatus}
              />
            ) : null}
            {tab === 'doer' && pending.length ? (
              <View style={{ gap: 8 }}>
                <ThemedText>Pending applications ({pending.length})</ThemedText>
                {pending.map((a) => (
                  <ThemedButton
                    key={a.id}
                    title="View application"
                    variant="secondary"
                    onPress={() =>
                      router.push({
                        pathname: '/suyo',
                        params: { id: a.request_id },
                      })
                    }
                  />
                ))}
              </View>
            ) : null}
            {error ? (
              <View style={{ gap: 8 }}>
                <ThemedText
                  tone="danger"
                  accessibilityRole="alert"
                >
                  {error}
                </ThemedText>
                <ThemedButton
                  title="Retry"
                  onPress={refresh}
                />
              </View>
            ) : null}
          </View>
        }
        ListEmptyComponent={
          isLoading ? (
            <ActivityIndicator color={colors.link} />
          ) : (
            <View
              style={{
                alignItems: 'center',
                padding: 32,
                gap: 12,
                backgroundColor: colors.card,
                borderRadius: 22,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <Ionicons
                name="search-outline"
                size={30}
                color={colors.muted}
              />
              <ThemedText style={{ fontSize: 17, fontWeight: '700' }}>
                {error ? 'Unable to load tasks' : 'No tasks here yet'}
              </ThemedText>
              <ThemedText
                tone="textMuted"
                style={{ textAlign: 'center', lineHeight: 21 }}
              >
                {error
                  ? 'Please retry when you are connected.'
                  : 'Try another category or check back for new suyos.'}
              </ThemedText>
            </View>
          )
        }
        renderItem={({ item }) => (
          <TaskListCard
            task={item}
            onOpen={() =>
              router.push({ pathname: '/suyo', params: { id: item.id } })
            }
          />
        )}
      />
      <DashboardFilters
        visible={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        sort={sort}
        setSort={setSort}
        radius={radius}
        setRadius={setRadius}
        showDistance={!!position && tab === 'home'}
        onReset={() => {
          setSort('newest');
          setRadius('');
        }}
      />
      <AppMenu
        visible={menuOpen}
        onClose={() => setMenuOpen(false)}
        active={tab}
        unread={unread}
        onDashboardTab={(next) => {
          setStatus('');
          setTab(next);
        }}
      />
      <DashboardBottomNav
        activeTab={tab}
        onTabChange={(next) => {
          setStatus('');
          setTab(next);
        }}
        onPost={() => router.push('/post-suyo')}
        onAccount={() => router.push('/account')}
        bottomInset={Math.max(insets.bottom, 16)}
      />
    </SafeAreaView>
  );
}
