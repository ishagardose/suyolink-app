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

export default function DashboardScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { colors } = useTheme();
  const [activeTab, setActiveTab] = useState('home');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const { requests } = useSuyos();
  const scrollRef = useRef(null);
  const ownRequests = requests.filter(
    (request) => request.requesterEmail === user.email
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
            request.providerEmail === user.email &&
            request.status === 'completed'
        )
        .reduce((sum, request) => sum + request.offerCentavos, 0)
    ),
  };
  const onQuickAction = (id) => {
    if (id === 'post') router.push('/post-suyo');
    else scrollRef.current?.scrollToEnd({ animated: true });
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
          <DashboardSearch />
          <DashboardStats
            stats={stats}
            onViewActivity={() => setActiveTab('activity')}
          />
          <QuickServices actions={QUICK_ACTIONS} onAction={onQuickAction} />
          <AvailableSuyos
            suyos={requests.filter((request) => request.status === 'open')}
          />
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
