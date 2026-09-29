import React, { useState, useRef } from 'react';
import { ScrollView, StyleSheet, View, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../theme/ThemeContext';
import DashboardHeader from '../components/dashboard/DashboardHeader';
import DashboardHero from '../components/dashboard/DashboardHero';
import DashboardSearch from '../components/dashboard/DashboardSearch';
import DashboardStats from '../components/dashboard/DashboardStats';
import QuickServices from '../components/dashboard/QuickServices';
import AvailableSuyos from '../components/dashboard/AvailableSuyos';
import DashboardBottomNav from '../components/dashboard/DashboardBottomNav';
import Sidebar from '../components/cards/Sidebar';
import EditProfileModal from '../components/cards/EditProfileModal';
import { QUICK_ACTIONS } from '../data/dashboard';
import { useSuyos } from '../context/SuyoContext';
import { formatOffer } from '../data/suyoRequests';
import { useDeviceLocation } from '../context/LocationContext';
import { distanceKm } from '../lib/geo';
import TaskFilters from '../components/dashboard/TaskFilters';
import MySuyos from '../components/dashboard/MySuyos';
import Notifications from '../components/dashboard/Notifications';
import ThemedText from '../components/themed/ThemedText';

export default function DashboardScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { colors } = useTheme();
  const [activeTab, setActiveTab] = useState('home');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const { requests, workflowError, error, refresh, isLoading } = useSuyos();
  const { position } = useDeviceLocation();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const [radius, setRadius] = useState(5);
  const [due, setDue] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const now = Date.now();
  const available = requests.filter(request => request.status === 'open' && Date.parse(request.deadline) > now)
    .filter(request => !category || request.category === category)
    .filter(request => !query.trim() || `${request.title} ${request.details} ${request.location}`.toLowerCase().includes(query.trim().toLowerCase()))
    .filter(request => !due || Date.parse(request.deadline) <= now + due * 3600000)
    .filter(request => !radius || (position && distanceKm(position, request) !== null && distanceKm(position, request) <= radius));
  const scrollRef = useRef(null);
  const ownRequests = requests.filter(
    (request) => request.requesterId === user.id || request.providerId === user.id
  );
  const stats = {
    completed: ownRequests.filter((request) => request.status === 'completed')
      .length,
    active: ownRequests.filter(
      (request) => !['completed', 'cancelled'].includes(request.status)
    ).length,
    earned: formatOffer(
      requests
        .filter(
          (request) =>
            request.providerId === user.id &&
            request.status === 'completed'
        )
        .reduce((sum, request) => sum + request.offerCentavos, 0)
    ),
  };
  const onQuickAction = (id) => {
    if (id === 'post') router.push('/post-suyo');
    else { setActiveTab('home'); scrollRef.current?.scrollToEnd({ animated: true }); }
  };

  const openEditProfile = () => {
    setIsSidebarOpen(false);
    setIsEditModalOpen(true);
  };

  return (
    <SafeAreaView
      edges={['top', 'bottom']}
      style={[styles.screen, { backgroundColor: colors.hero }]}
    >
      <StatusBar style="light" />
      <DashboardHeader onOpenSidebar={() => setIsSidebarOpen(true)} />

      <ScrollView
        ref={scrollRef}
        style={[styles.scroll, { backgroundColor: colors.background }]}
        contentContainerStyle={{ paddingBottom: 90 }}
        showsVerticalScrollIndicator={false}
      >
        <DashboardHero name={user.name} />
        <View style={[styles.body, { backgroundColor: colors.background }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <ThemedText tone="textMuted" style={{ fontSize: 10, fontWeight: '700', letterSpacing: 1.4 }}>YOUR EVERYDAY, MADE EASIER</ThemedText>
            <TouchableOpacity accessibilityRole="button" accessibilityLabel="Refresh dashboard" disabled={isLoading}
              onPress={refresh} style={{ minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' }}>
              {isLoading ? <ActivityIndicator color={colors.link} /> : <Ionicons name="refresh-outline" size={18} color={colors.textMuted} />}
            </TouchableOpacity>
          </View>
            {workflowError || error ? <ThemedText tone="danger" accessibilityRole="alert">{error || workflowError}</ThemedText> : null}
          {activeTab === 'home' ? <>
          <QuickServices actions={QUICK_ACTIONS} onAction={onQuickAction} />
          <TouchableOpacity accessibilityRole="button" accessibilityLabel="Change browsing location" onPress={() => router.push('/set-location')}
            style={{ flexDirection: 'row', gap: 8, alignItems: 'center', minHeight: 44, marginBottom: 12 }}>
            <Ionicons name="location-outline" size={18} color={colors.link} />
            <ThemedText style={{ color: colors.link, fontWeight: '600', fontSize: 13 }}>Your area · Change location</ThemedText>
          </TouchableOpacity>
          <DashboardStats
            stats={stats}
            onViewActivity={() => setActiveTab('activity')}
          />
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <ThemedText style={{ fontSize: 21, fontWeight: '800', letterSpacing: -0.5 }}>Available suyos</ThemedText>
            <TouchableOpacity accessibilityRole="button" accessibilityLabel="Toggle task filters" accessibilityState={{ expanded: showFilters }}
              onPress={() => setShowFilters(value => !value)} style={{ flexDirection: 'row', gap: 6, alignItems: 'center', minHeight: 44 }}>
              <Ionicons name="options-outline" size={18} color={colors.link} />
              <ThemedText style={{ color: colors.link, fontSize: 12, fontWeight: '700' }}>Filters{category || radius || due ? ` (${[category, radius, due].filter(Boolean).length})` : ''}</ThemedText>
            </TouchableOpacity>
          </View>
          <DashboardSearch value={query} onChangeText={setQuery} />
          {radius ? <ThemedText tone="textMuted" style={{ fontSize: 12, marginBottom: 8 }}>Within {radius} km of your selected area · straight-line distance</ThemedText> : null}
          {showFilters ? <TaskFilters category={category} setCategory={setCategory} radius={radius} setRadius={setRadius} due={due} setDue={setDue} hasLocation={!!position} /> : null}
          <AvailableSuyos
            suyos={available}
          />
          </> : activeTab === 'notifications' ? <Notifications /> : <MySuyos key={activeTab} history={activeTab === 'activity'} />}
        </View>
      </ScrollView>

      <DashboardBottomNav activeTab={activeTab} onTabChange={setActiveTab} />
      <Sidebar
        visible={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onEditProfile={openEditProfile}
      />
      {isEditModalOpen && (
        <EditProfileModal onClose={() => setIsEditModalOpen(false)} />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, width: '100%', maxWidth: 840, alignSelf: 'center' },
  scroll: { flex: 1, marginTop: -1 },
  body: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -20,
    paddingHorizontal: 22,
    paddingTop: 10,
  },
});
