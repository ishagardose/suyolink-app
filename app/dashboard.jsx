import React, { useState } from 'react';
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
import ActiveSuyoCard from '../components/cards/ActiveSuyoCard';
import {
  ACTIVE_SUYO,
  AVAILABLE_SUYOS,
  DASHBOARD_STATS,
  QUICK_ACTIONS,
} from '../data/dashboard';

export default function DashboardScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { colors } = useTheme();
  const [activeTab, setActiveTab] = useState('home');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const hasActiveSuyo =
    ACTIVE_SUYO && ['In Transit', 'On Process'].includes(ACTIVE_SUYO.status);

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
        style={[styles.scroll, { backgroundColor: colors.background }]}
        contentContainerStyle={{ paddingBottom: hasActiveSuyo ? 140 : 90 }}
        showsVerticalScrollIndicator={false}
      >
        <DashboardHero name={user.name} />
        <View style={[styles.body, { backgroundColor: colors.background }]}>
          <DashboardSearch />
          <DashboardStats
            stats={DASHBOARD_STATS}
            onViewActivity={() => setActiveTab('activity')}
          />
          <QuickServices actions={QUICK_ACTIONS} />
          <AvailableSuyos suyos={AVAILABLE_SUYOS} />
        </View>
      </ScrollView>

      {hasActiveSuyo && (
        <ActiveSuyoCard
          activeSuyo={ACTIVE_SUYO}
          onTrack={() => router.push('/map')}
        />
      )}
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
