import React, { useState, useRef } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
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
import ThemedButton from '../components/themed/ThemedButton';

export default function DashboardScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { colors } = useTheme();
  const [activeTab, setActiveTab] = useState('home');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const { requests, notifications, workflowError, error, refresh, isLoading } = useSuyos();
  const { position } = useDeviceLocation();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const [radius, setRadius] = useState(0);
  const [due, setDue] = useState(0);
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
      <DashboardHeader onOpenSidebar={() => setIsSidebarOpen(true)} onNotifications={() => setActiveTab('notifications')}
        unreadCount={notifications.filter(item => !item.read_at).length} />

      <ScrollView
        ref={scrollRef}
        style={[styles.scroll, { backgroundColor: colors.background }]}
        contentContainerStyle={{ paddingBottom: 90 }}
        showsVerticalScrollIndicator={false}
      >
        <DashboardHero name={user.name} />
        <View style={[styles.body, { backgroundColor: colors.background }]}>
          <View style={{ paddingVertical: 16, gap: 12 }}>
            <ThemedButton title="Refresh dashboard" variant="secondary" loading={isLoading} onPress={refresh} />
            {workflowError || error ? <ThemedText tone="danger" accessibilityRole="alert">{error || workflowError}</ThemedText> : null}
          </View>
          {activeTab === 'home' ? <>
          <DashboardSearch value={query} onChangeText={setQuery} />
          <DashboardStats
            stats={stats}
            onViewActivity={() => setActiveTab('activity')}
          />
          <QuickServices actions={QUICK_ACTIONS} onAction={onQuickAction} />
          <TaskFilters category={category} setCategory={setCategory} radius={radius} setRadius={setRadius} due={due} setDue={setDue} hasLocation={!!position} />
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
  screen: { flex: 1 },
  scroll: { flex: 1, marginTop: -1 },
  body: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -20,
    paddingHorizontal: 20,
    paddingTop: 8,
  },
});
