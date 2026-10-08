import useDashboardSuyoActions from '../hooks/useDashboardSuyoActions.js';
import useDashboardFavorites from '../hooks/useDashboardFavorites.js';
import useDashboardToast from '../hooks/useDashboardToast.jsx';
import useDashboardFilters from '../hooks/useDashboardFilters.js';
import useDashboardNotifications from '../hooks/useDashboardNotifications.js';
import useDashboardWallet from '../hooks/useDashboardWallet.js';
import useDashboardSuyoLists from '../hooks/useDashboardSuyoLists.js';
import DashboardHeader from '../navigation/DashboardHeader';
import HomeTab from '../tabs/HomeTab';
import MySuyoTab from '../tabs/MySuyoTab';
import DoerSuyoTab from '../tabs/DoerSuyoTab';
import WalletTab from '../tabs/WalletTab';
import ActiveSuyoBanner from '../navigation/ActiveSuyoBanner';
import DashboardBottomNav from '../navigation/DashboardBottomNav';
import DashboardFilterModal from '../modals/DashboardFilterModal';
import SuyoDetailModal from '../modals/SuyoDetailModal';
import DoerCancelModal from '../modals/DoerCancelModal';
import DoerDetailModal from '../modals/DoerDetailModal';
import DoerProfileModal from '../modals/DoerProfileModal';
import EditSuyoModal from '../modals/EditSuyoModal';
import FavoritesModal from '../modals/FavoritesModal';
import DashboardNotificationsModal from '../notifications/DashboardNotificationsModal';
import ReceiptModal from '../modals/ReceiptModal';
import StatisticsModal from '../modals/StatisticsModal';
import DashboardSidebar from '../navigation/DashboardSidebar';
import EditProfileModal from '../modals/EditProfileModal';

import { createDashboardStyles } from '../styles/dashboard.styles.js';
import { resolvePaletteColor } from '../../../theme/paletteAdapter';

import { SIDEBAR_WIDTH, USE_NATIVE_DRIVER } from '../utils/dashboardLayout';
import { getTodayFormatted } from '../utils/dashboardHelpers';
import { DEFAULT_DOER } from '../data/dashboardData';
import React, { useState, useRef, useMemo, useEffect } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  Animated,
  Modal,
  Platform,
  Linking,
  Alert,
} from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

import { useRouter, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { useAuth } from '../../../context/AuthContext';
import { useSuyos } from '../../../context/SuyoContext';
import { useDeviceLocation } from '../../../context/LocationContext';
import { useTheme } from '../../../theme/ThemeContext';
import { formatOffer } from '../../../data/suyoRequests';
import { distanceKm } from '../../../lib/geo';

export default function DashboardScreen() {
  const router = useRouter();
  const searchParams = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, 16);
  const [activeTab, setActiveTab] = useState('home');
  const { user, logout, updateProfile } = useAuth();
  const { colors, isDark } = useTheme();
  const styles = useMemo(
    () => createDashboardStyles(colors, isDark),
    [colors, isDark],
  );
  const resolveColor = (value, property = 'color') =>
    resolvePaletteColor(value, property, colors, isDark);
  const {
    requests,
    transactions = [],
    workflowError,
    workflowLoading,
    notifications: backendNotifications = [],
    markRead,
    markNotificationsRead,
    deleteNotifications,
    error,
    refresh,
    isLoading,
  } = useSuyos();
  const { position, hasSavedLocation, locate } = useDeviceLocation();

  // Sidebar & Modal animation state
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const sidebarAnim = useRef(new Animated.Value(-SIDEBAR_WIDTH)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;

  // User account state (with safe default fallback)
  const [userProfile, setUserProfile] = useState({
    name: user?.name || user?.user_metadata?.full_name || 'Juan Dela Cruz',
    email: user?.email || 'juan.delacruz@suyolink.ph',
    phone: user?.phone || '',
    address: user?.address || '',
  });
  useEffect(() => {
    if (user) {
      setUserProfile((prev) => ({
        ...prev,
        name: user.name || user.user_metadata?.full_name || prev.name,
        email: user.email || prev.email,
        phone: user.phone || '',
        address: user.address || '',
      }));
    }
  }, [user]);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isStatisticsModalOpen, setIsStatisticsModalOpen] = useState(false);
  const [tempProfile, setTempProfile] = useState({ ...userProfile });
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSaveError, setProfileSaveError] = useState('');
  useEffect(() => {
    if (isEditModalOpen) setProfileSaveError('');
  }, [isEditModalOpen]);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [expandedSection, setExpandedSection] = useState(null);

  // MySuyo Tab Navigation & Management state (dynamically populated from live requests)

  const [mySuyoNavTab, setMySuyoNavTab] = useState('posted'); // 'posted' | 'accepted' | 'completed' | 'cancelled' | 'archived'
  const [isMySuyoEditMode, setIsMySuyoEditMode] = useState(false);
  const [selectedMySuyoIdsToDelete, setSelectedMySuyoIdsToDelete] = useState(
    [],
  );
  const [selectedSuyoContext, setSelectedSuyoContext] = useState('available'); // 'available' | 'posted' | 'accepted' | 'completed' | 'cancelled' | 'archived'
  const [selectedDoerProfile, setSelectedDoerProfile] = useState(null);

  // Doer Suyo Hub state (dynamically populated from live requests)

  const [doerNavTab, setDoerNavTab] = useState('accepted'); // 'accepted' | 'completed' | 'cancelled'
  const [selectedDoerSuyo, setSelectedDoerSuyo] = useState(null);
  const [doerCancelModalItem, setDoerCancelModalItem] = useState(null);
  const [isDoerCancelledEditMode, setIsDoerCancelledEditMode] = useState(false);
  const [selectedDoerCancelledIds, setSelectedDoerCancelledIds] = useState([]);

  // Selected Suyo Details Modal
  const [selectedSuyo, setSelectedSuyo] = useState(null);

  // Activity Tab state (Financial ledger, digital receipts, verified proof logs)
  const [activityRecords, setActivityRecords] = useState([]);
  const [activityFilter, setActivityFilter] = useState('All'); // 'All' | 'InProgress' | 'Spending' | 'Earnings' | 'Completed'
  const [activitySearchQuery, setActivitySearchQuery] = useState('');
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  // Sync live Supabase requests & transactions with MySuyo & Doer Hub state
  const {
    acceptedSuyos,
    cancelledSuyos,
    completedSuyos,
    doerAcceptedSuyos,
    doerCancelledSuyos,
    doerCompletedSuyos,
    postedSuyos,
    resolveUrgencyTag,
    setCancelledSuyos,
    setDoerAcceptedSuyos,
    setDoerCancelledSuyos,
    setPostedSuyos,
  } = useDashboardSuyoLists({ requests, user });

  // Wallet dynamic computations from live Supabase transactions

  const {
    displayWalletTotal,
    dynamicWalletList,
    monthlySuyosCount,
    now,
    overallSuyosCount,
    providerTransactions,
    todayDateFormatted,
    todayEarningsSum,
    todaySuyosCount,
  } = useDashboardWallet({ transactions });

  // Overall available suyos in Dashboard: public suyos from different users + account owner's open posted suyos
  // Note: 'Waiting for doer' is a lifecycle status ONLY applied and visible to MySuyo nav;
  // on the main dashboard where public available suyos are listed for all users, the tag turns into
  // an urgency indicator: 'Normal', 'Urgent', 'Due today', or 'Due tomorrow'.
  const availableSuyosBase = useMemo(() => {
    const fromBackend = (requests || [])
      .filter(
        (r) =>
          r.status === 'open' &&
          (!r.deadline || Date.parse(r.deadline) > Date.now()),
      )
      .map((r) => {
        const dist =
          position && r.latitude && r.longitude ? distanceKm(position, r) : 0.8;
        const distNum =
          typeof dist === 'number' ? Number(dist.toFixed(1)) : 0.8;
        const offer = formatOffer(r.offerCentavos || 0);
        const isUrgent =
          r.deadline && Date.parse(r.deadline) < Date.now() + 24 * 3600 * 1000;
        const urgency = isUrgent ? 'Urgent' : 'Normal';
        return {
          id: r.id,
          title: r.title,
          category: r.category || 'General',
          location: r.location || 'Nearby',
          distance: distNum,
          distanceText: distNum + ' km away',
          reward: offer,
          rewardAmount: (r.offerCentavos || 0) / 100,
          tag: urgency,
          urgency,
          postedTime: 'Active now',
          createdAt: Date.parse(r.createdAt || r.deadline || Date.now()),
          due: r.deadline
            ? 'Due ' +
              new Date(r.deadline).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })
            : 'Due today',
          dueDate: r.deadline
            ? new Date(r.deadline).toLocaleDateString()
            : getTodayFormatted(),
          details: r.details || 'No details provided.',
          notes: r.specialInstructions || '',
          requesterName: r.requesterName || 'Community Member',
          requesterPhone: r.requesterPhone || '+63 917 000 0000',
          requesterRating: '4.9★',
          completedCount: '15 completed',
          rawRequest: r,
        };
      });

    // Owner's active posted suyos that are open and waiting for doers to take
    const ownerPosted = (postedSuyos || [])
      .filter(
        (p) => p.status !== 'Cancelled' && !p.status?.includes('Completed'),
      )
      .map((p) => ({
        ...p,
        tag: resolveUrgencyTag(p), // Always convert to urgency on Dashboard (Normal, Urgent, Due today, Due tomorrow)
        mySuyoStatus: p.status || 'Open - waiting for a doer',
        mySuyoTag: p.tag || 'Waiting for doer',
        isMine: true,
        distance: 0.8,
        distanceText: p.distanceText || '0.8 km away',
        postedTime: p.formattedDate || 'Active now',
        due: p.due || 'Due today',
        dueDate: p.dueDate || getTodayFormatted(),
      }));

    // Merge: Owner's open posted suyos + backend open requests without duplicate IDs.
    // In-progress accepted suyos are excluded from public available board (they belong in MySuyo -> Accepted).
    const merged = [...ownerPosted, ...fromBackend];
    const seenIds = new Set();
    const result = [];
    for (const item of merged) {
      if (!seenIds.has(item.id)) {
        seenIds.add(item.id);
        result.push(item);
      }
    }
    return result;
  }, [requests, position, postedSuyos]);

  // List of suyos favorited by the user

  // Toast feedback state

  const { renderFooterToast, setToastConfig, toastConfig, triggerToast } =
    useDashboardToast({ bottomInset, resolveColor, styles });

  useEffect(() => {
    if (searchParams?.justPosted === 'true') {
      triggerToast('suyo is successfully posted', 'paper-plane');
    }
  }, [searchParams?.justPosted]);

  const handleCloseDetailModal = () => {
    setSelectedSuyo(null);
    setSelectedSuyoContext('available');
    if (openedFromFavorites) {
      setIsFavoritesModalOpen(true);
      setOpenedFromFavorites(false);
    }
  };

  // Open Suyo detail with dynamic context resolution (separating public available suyos vs owner's suyos)
  const handleOpenSuyoDetail = (suyo, explicitContext = null) => {
    if (!suyo) return;

    if (explicitContext) {
      setSelectedSuyoContext(explicitContext);
      setSelectedSuyo(suyo);
      return;
    }

    // Dynamic context resolution for Dashboard / Urgent / Favorites
    const isPosted =
      postedSuyos.some((p) => p.id === suyo.id) ||
      (suyo.requesterName &&
        (suyo.requesterName.includes('(You)') ||
          suyo.requesterName === userProfile?.name));

    const isAccepted =
      acceptedSuyos.some((a) => a.id === suyo.id) ||
      Boolean(
        suyo.doer &&
        (suyo.requesterName?.includes('(You)') || suyo.isAcceptedByMe),
      );

    const isCompleted = completedSuyos.some((c) => c.id === suyo.id);
    const isCancelled =
      cancelledSuyos.some((can) => can.id === suyo.id) ||
      suyo.status === 'Cancelled';
    const isArchived = archivedSuyos.some((ar) => ar.id === suyo.id);

    if (isPosted) {
      const matched = postedSuyos.find((p) => p.id === suyo.id) || suyo;
      setSelectedSuyoContext('posted');
      setSelectedSuyo(matched);
    } else if (isAccepted) {
      const matched = acceptedSuyos.find((a) => a.id === suyo.id) || suyo;
      setSelectedSuyoContext('accepted');
      setSelectedSuyo(matched);
    } else if (isCompleted) {
      const matched = completedSuyos.find((c) => c.id === suyo.id) || suyo;
      setSelectedSuyoContext('completed');
      setSelectedSuyo(matched);
    } else if (isCancelled) {
      const matched = cancelledSuyos.find((can) => can.id === suyo.id) || suyo;
      setSelectedSuyoContext('cancelled');
      setSelectedSuyo(matched);
    } else if (isArchived) {
      const matched = archivedSuyos.find((ar) => ar.id === suyo.id) || suyo;
      setSelectedSuyoContext('archived');
      setSelectedSuyo(matched);
    } else {
      setSelectedSuyoContext('available');
      setSelectedSuyo(suyo);
    }
  };

  // Call Action (Doer or Requester)
  const handleCallDoer = (phone, name = null) => {
    const targetName =
      name ||
      selectedSuyo?.doer?.name ||
      selectedSuyo?.requesterName ||
      DEFAULT_DOER.name;
    const rawPhone =
      phone ||
      selectedSuyo?.doer?.phone ||
      selectedSuyo?.requesterPhone ||
      DEFAULT_DOER.phone;
    const cleanNumber = (rawPhone || '').replace(/[^0-9+]/g, '');
    const telUrl = `tel:${cleanNumber}`;

    if (Platform.OS === 'web') {
      try {
        if (typeof window !== 'undefined' && window.open) {
          window.open(telUrl, '_self');
        } else {
          Linking.openURL(telUrl).catch(() => {});
        }
      } catch (e) {
        // Fallback for browsers blocking tel protocol
      }
      triggerToast(`Calling ${targetName} (${rawPhone})...`, 'call');
      return;
    }

    Linking.canOpenURL(telUrl)
      .then((supported) => {
        if (supported) {
          Linking.openURL(telUrl);
        } else {
          Alert.alert('Call', `Calling ${targetName} at ${rawPhone}`);
        }
      })
      .catch(() => {
        Alert.alert('Call', `Calling ${targetName} at ${rawPhone}`);
      });
  };

  // Activity Computations & Actions
  const filteredActivityRecords = useMemo(() => {
    let list = [...activityRecords];

    if (activityFilter === 'InProgress') {
      list = list.filter((item) => item.status === 'In Progress');
    } else if (activityFilter === 'Spending') {
      list = list.filter((item) => item.role === 'requester');
    } else if (activityFilter === 'Earnings') {
      list = list.filter((item) => item.role === 'doer');
    } else if (activityFilter === 'Completed') {
      list = list.filter((item) => item.status === 'Completed');
    }

    if (activitySearchQuery.trim()) {
      const q = activitySearchQuery.toLowerCase();
      list = list.filter(
        (item) =>
          item.title.toLowerCase().includes(q) ||
          item.refNo.toLowerCase().includes(q) ||
          (item.doer?.name && item.doer.name.toLowerCase().includes(q)) ||
          (item.requesterName &&
            item.requesterName.toLowerCase().includes(q)) ||
          item.category.toLowerCase().includes(q),
      );
    }

    return list;
  }, [activityRecords, activityFilter, activitySearchQuery]);

  const activityStats = useMemo(() => {
    const totalSpent = activityRecords
      .filter((r) => r.role === 'requester' && r.status === 'Completed')
      .reduce((sum, r) => sum + r.totalAmount, 0);

    const totalEarned = activityRecords
      .filter((r) => r.role === 'doer' && r.status === 'Completed')
      .reduce((sum, r) => sum + r.totalAmount, 0);

    const inProgressCount = activityRecords.filter(
      (r) => r.status === 'In Progress',
    ).length;
    const completedCount = activityRecords.filter(
      (r) => r.status === 'Completed',
    ).length;

    return {
      totalSpent: `₱${totalSpent.toLocaleString()}`,
      totalEarned: `₱${totalEarned.toLocaleString()}`,
      inProgressCount,
      completedCount,
      timeSaved: '18.5 hrs',
    };
  }, [activityRecords]);

  const handleExportStatement = () => {
    triggerToast(
      'Monthly activity statement (PDF) downloaded',
      'download-outline',
    );
  };

  // Favorites Selection/Delete Mode state

  const {
    favoriteSuyoIds,
    favoriteSuyos,
    handleCloseFavoritesModal,
    handleConfirmDeleteSelectedFavs,
    handleToggleFavDeleteMode,
    handleToggleSelectFavToDelete,
    isFavDeleteMode,
    isFavoritesModalOpen,
    openedFromFavorites,
    selectedFavIdsToDelete,
    setIsFavoritesModalOpen,
    setOpenedFromFavorites,
    setSelectedFavIdsToDelete,
    toggleFavoriteSuyo,
  } = useDashboardFavorites({ availableSuyosBase, triggerToast });

  const handleToggleMySuyoSelect = (id) => {
    setSelectedMySuyoIdsToDelete((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const handleConfirmDeleteMySuyo = () => {
    if (selectedMySuyoIdsToDelete.length === 0) return;
    if (mySuyoNavTab === 'posted') {
      setPostedSuyos((prev) =>
        prev.filter((item) => !selectedMySuyoIdsToDelete.includes(item.id)),
      );
    } else if (mySuyoNavTab === 'cancelled') {
      setCancelledSuyos((prev) =>
        prev.filter((item) => !selectedMySuyoIdsToDelete.includes(item.id)),
      );
    } else if (mySuyoNavTab === 'archived') {
      setArchivedSuyos((prev) =>
        prev.filter((item) => !selectedMySuyoIdsToDelete.includes(item.id)),
      );
    }
    setSelectedMySuyoIdsToDelete([]);
    setIsMySuyoEditMode(false);
    triggerToast('suyo is successfully deleted', 'trash-outline');
  };

  // Edit feature for Cancelled Doer Suyos
  const handleToggleDoerCancelledSelect = (id) => {
    setSelectedDoerCancelledIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const handleConfirmDeleteDoerCancelled = () => {
    if (selectedDoerCancelledIds.length === 0) return;
    setDoerCancelledSuyos((prev) =>
      prev.filter((item) => !selectedDoerCancelledIds.includes(item.id)),
    );
    setSelectedDoerCancelledIds([]);
    setIsDoerCancelledEditMode(false);
    triggerToast('suyo is successfully deleted', 'trash-outline');
  };

  // Feature: Increase / Boost Reward (Supports resetting with +0)

  // Feature: Cancel Suyo

  // Feature: Open Edit Suyo

  // Feature: Save Edited Suyo

  // Feature: Save completed suyo to Archive for future repeat requests

  // Feature: Repeat request from completed or archived
  const {
    actionBusy,
    actionError,
    setActionError,
    archivedSuyos,
    editingSuyoData,
    handleBoostReward,
    handleCancelSuyo,
    handleOpenEditSuyo,
    handleRepeatRequest,
    handleSaveEditedSuyo,
    handleSaveToArchive,
    isEditingSuyoModalOpen,
    setArchivedSuyos,
    setEditingSuyoData,
    setIsEditingSuyoModalOpen,
  } = useDashboardSuyoActions({
    selectedSuyoContext,
    setSelectedSuyo,
    triggerToast,
  });
  useEffect(() => {
    if (doerCancelModalItem) setActionError('');
  }, [doerCancelModalItem, setActionError]);

  const {
    clearAllNotifications,
    handleTapNotification,
    isNotificationsModalOpen,
    markAllNotificationsRead,
    markNotificationRead,
    notificationBusy,
    notificationError,
    notificationFilter,
    notifications,
    removeNotification,
    setIsNotificationsModalOpen,
    setNotificationError,
    setNotificationFilter,
    unreadNotificationsCount,
  } = useDashboardNotifications({
    backendNotifications,
    deleteNotifications,
    markNotificationsRead,
    markRead,
    router,
    triggerToast,
  });

  // Active Suyo floating banner state (matching live task for current user)
  const activeSuyo = useMemo(() => {
    const live = (requests || []).find(
      (r) =>
        (r.requesterId === user?.id || r.providerId === user?.id) &&
        ['assigned', 'in_progress'].includes(r.status),
    );
    if (!live) return null;
    const isDoer = live.providerId === user?.id;
    return {
      id: live.id,
      trackingNumber: `#SYL-${String(live.id).slice(0, 6).toUpperCase()}`,
      status: live.status === 'in_progress' ? 'In Progress' : 'Assigned',
      eta:
        live.status === 'in_progress'
          ? isDoer
            ? 'You are on the way'
            : 'Doer is on the way'
          : 'Doer assigned',
      detail: `Suyo: ${live.title}`,
      progress: live.status === 'in_progress' ? '75%' : '40%',
      raw: live,
    };
  }, [requests, user?.id]);
  const [isTrackingModalOpen, setIsTrackingModalOpen] = useState(false);

  const hasActiveSuyo = Boolean(activeSuyo);

  // Count active filters

  // Filtered & Sorted Available Suyos

  // Dynamic header title

  const openSidebar = () => {
    setIsSidebarOpen(true);
    Animated.parallel([
      Animated.timing(sidebarAnim, {
        toValue: 0,
        duration: 260,
        useNativeDriver: USE_NATIVE_DRIVER,
      }),
      Animated.timing(backdropAnim, {
        toValue: 1,
        duration: 260,
        useNativeDriver: USE_NATIVE_DRIVER,
      }),
    ]).start();
  };

  const closeSidebar = () => {
    Animated.parallel([
      Animated.timing(sidebarAnim, {
        toValue: -SIDEBAR_WIDTH,
        duration: 220,
        useNativeDriver: USE_NATIVE_DRIVER,
      }),
      Animated.timing(backdropAnim, {
        toValue: 0,
        duration: 220,
        useNativeDriver: USE_NATIVE_DRIVER,
      }),
    ]).start(() => {
      setIsSidebarOpen(false);
    });
  };

  const toggleSection = (sectionKey) => {
    setExpandedSection((prev) => (prev === sectionKey ? null : sectionKey));
  };

  const handleSaveProfile = async () => {
    if (profileSaving) return;
    setProfileSaving(true);
    setProfileSaveError('');
    try {
      await updateProfile(tempProfile);
      setIsEditModalOpen(false);
      triggerToast('Profile updated successfully', 'person');
    } catch (error) {
      setProfileSaveError(
        error.message || 'Could not save your profile. Please retry.',
      );
    } finally {
      setProfileSaving(false);
    }
  };

  const {
    activeFiltersCount,
    availableHeaderTitle,
    clearAllFilters,
    currentDistanceKm,
    filteredSuyos,
    handleDecreaseDistance,
    handleIncreaseDistance,
    handleResetModalFilters,
    isFilterModalOpen,
    isFiltering,
    searchQuery,
    selectedCategory,
    selectedUrgency,
    setIsFilterModalOpen,
    setSearchQuery,
    setSelectedCategory,
    setSelectedUrgency,
  } = useDashboardFilters({ availableSuyosBase });

  return (
    <SafeAreaView
      edges={['top']}
      style={styles.safeContainer}
    >
      <StatusBar style="light" />

      {/* 1. FIXED TOP BAR */}
      <DashboardHeader
        favoriteSuyoIds={favoriteSuyoIds}
        openSidebar={openSidebar}
        resolveColor={resolveColor}
        setIsFavoritesModalOpen={setIsFavoritesModalOpen}
        setIsNotificationsModalOpen={setIsNotificationsModalOpen}
        styles={styles}
        unreadNotificationsCount={unreadNotificationsCount}
      />

      {/* 2. MAIN SCROLLABLE CONTENT */}
      <ScrollView
        style={styles.contentScroll}
        contentContainerStyle={[
          styles.contentContainer,
          { paddingBottom: (hasActiveSuyo ? 140 : 85) + bottomInset },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <HomeTab
          activeFiltersCount={activeFiltersCount}
          activeTab={activeTab}
          availableHeaderTitle={availableHeaderTitle}
          availableSuyosBase={availableSuyosBase}
          clearAllFilters={clearAllFilters}
          filteredSuyos={filteredSuyos}
          handleOpenSuyoDetail={handleOpenSuyoDetail}
          isFiltering={isFiltering}
          resolveColor={resolveColor}
          searchQuery={searchQuery}
          setIsFilterModalOpen={setIsFilterModalOpen}
          setSearchQuery={setSearchQuery}
          styles={styles}
          userProfile={userProfile}
        />

        {/* === MYSUYO HUB SCREEN === */}
        <MySuyoTab
          acceptedSuyos={acceptedSuyos}
          activeTab={activeTab}
          archivedSuyos={archivedSuyos}
          cancelledSuyos={cancelledSuyos}
          completedSuyos={completedSuyos}
          handleBoostReward={handleBoostReward}
          handleConfirmDeleteMySuyo={handleConfirmDeleteMySuyo}
          handleOpenSuyoDetail={handleOpenSuyoDetail}
          handleToggleMySuyoSelect={handleToggleMySuyoSelect}
          isMySuyoEditMode={isMySuyoEditMode}
          mySuyoNavTab={mySuyoNavTab}
          postedSuyos={postedSuyos}
          resolveColor={resolveColor}
          selectedMySuyoIdsToDelete={selectedMySuyoIdsToDelete}
          setIsMySuyoEditMode={setIsMySuyoEditMode}
          setMySuyoNavTab={setMySuyoNavTab}
          setSelectedMySuyoIdsToDelete={setSelectedMySuyoIdsToDelete}
          styles={styles}
        />

        {/* === DOER SUYO HUB SCREEN (SUYOS DONE AS A DOER) === */}
        <DoerSuyoTab
          activeTab={activeTab}
          doerAcceptedSuyos={doerAcceptedSuyos}
          doerCancelledSuyos={doerCancelledSuyos}
          doerCompletedSuyos={doerCompletedSuyos}
          doerNavTab={doerNavTab}
          handleConfirmDeleteDoerCancelled={handleConfirmDeleteDoerCancelled}
          handleToggleDoerCancelledSelect={handleToggleDoerCancelledSelect}
          isDoerCancelledEditMode={isDoerCancelledEditMode}
          resolveColor={resolveColor}
          router={router}
          selectedDoerCancelledIds={selectedDoerCancelledIds}
          setActiveTab={setActiveTab}
          setDoerCancelModalItem={setDoerCancelModalItem}
          setDoerNavTab={setDoerNavTab}
          setIsDoerCancelledEditMode={setIsDoerCancelledEditMode}
          setSelectedDoerCancelledIds={setSelectedDoerCancelledIds}
          setSelectedDoerSuyo={setSelectedDoerSuyo}
          styles={styles}
        />

        {/* === WALLET SCREEN (ACCEPTED SUYO EARNINGS LIST) === */}
        <WalletTab
          activeTab={activeTab}
          displayWalletTotal={displayWalletTotal}
          dynamicWalletList={dynamicWalletList}
          monthlySuyosCount={monthlySuyosCount}
          overallSuyosCount={overallSuyosCount}
          providerTransactions={providerTransactions}
          resolveColor={resolveColor}
          setActiveTab={setActiveTab}
          styles={styles}
          todayDateFormatted={todayDateFormatted}
          todayEarningsSum={todayEarningsSum}
          todaySuyosCount={todaySuyosCount}
        />
      </ScrollView>

      {/* ========================================================== */}
      {/* 3. POPPING MODAL: FLOATING ACTIVE SUYO PROGRESS CARD        */}
      {/* (Floats directly above navigation bar, persists on scroll)  */}
      {/* ========================================================== */}
      <ActiveSuyoBanner
        activeSuyo={activeSuyo}
        bottomInset={bottomInset}
        hasActiveSuyo={hasActiveSuyo}
        resolveColor={resolveColor}
        router={router}
        styles={styles}
      />

      {/* 4. BOTTOM NAVIGATION BAR (Home, MySuyo, Post, Activity, Account) */}
      <DashboardBottomNav
        activeTab={activeTab}
        bottomInset={bottomInset}
        resolveColor={resolveColor}
        router={router}
        setActiveTab={setActiveTab}
        styles={styles}
      />

      {/* ========================================================== */}
      {/* 5. FILTER MODAL                                            */}
      {/* ========================================================== */}
      <DashboardFilterModal
        currentDistanceKm={currentDistanceKm}
        handleDecreaseDistance={handleDecreaseDistance}
        handleIncreaseDistance={handleIncreaseDistance}
        handleResetModalFilters={handleResetModalFilters}
        isFilterModalOpen={isFilterModalOpen}
        resolveColor={resolveColor}
        selectedCategory={selectedCategory}
        selectedUrgency={selectedUrgency}
        setIsFilterModalOpen={setIsFilterModalOpen}
        setSelectedCategory={setSelectedCategory}
        setSelectedUrgency={setSelectedUrgency}
        styles={styles}
      />

      {/* ========================================================== */}
      {/* 6. SUYO DETAILS MODAL                                      */}
      {/* ========================================================== */}
      {/* ========================================================== */}
      {/* 6. SUYO DETAILS MODAL (CONTEXT-AWARE FOR REQUESTER & DOER) */}
      {/* ========================================================== */}
      <SuyoDetailModal
        busy={actionBusy}
        error={isEditingSuyoModalOpen ? '' : actionError}
        archivedSuyos={archivedSuyos}
        favoriteSuyoIds={favoriteSuyoIds}
        handleBoostReward={handleBoostReward}
        handleCallDoer={handleCallDoer}
        handleCancelSuyo={handleCancelSuyo}
        handleCloseDetailModal={handleCloseDetailModal}
        handleOpenEditSuyo={handleOpenEditSuyo}
        handleRepeatRequest={handleRepeatRequest}
        handleSaveToArchive={handleSaveToArchive}
        resolveColor={resolveColor}
        router={router}
        selectedSuyo={isEditingSuyoModalOpen ? null : selectedSuyo}
        selectedSuyoContext={selectedSuyoContext}
        setCancelledSuyos={setCancelledSuyos}
        setDoerAcceptedSuyos={setDoerAcceptedSuyos}
        setOpenedFromFavorites={setOpenedFromFavorites}
        setSelectedSuyo={setSelectedSuyo}
        styles={styles}
        toggleFavoriteSuyo={toggleFavoriteSuyo}
        triggerToast={triggerToast}
        userProfile={userProfile}
      />

      {/* ========================================================== */}
      {/* 6C. DOER CANCELLATION CONFIRMATION MODAL                   */}
      {/* ========================================================== */}
      <DoerCancelModal
        doerCancelModalItem={doerCancelModalItem}
        resolveColor={resolveColor}
        selectedDoerSuyo={selectedDoerSuyo}
        busy={actionBusy}
        error={actionError}
        onCancel={handleCancelSuyo}
        setDoerCancelModalItem={setDoerCancelModalItem}
        setSelectedDoerSuyo={setSelectedDoerSuyo}
        styles={styles}
        triggerToast={triggerToast}
      />

      {/* ========================================================== */}
      {/* 6D. DOER SUYO DETAILS MODAL                                */}
      {/* ========================================================== */}
      <DoerDetailModal
        resolveColor={resolveColor}
        router={router}
        selectedDoerSuyo={selectedDoerSuyo}
        setSelectedDoerSuyo={setSelectedDoerSuyo}
        styles={styles}
        userProfile={userProfile}
      />

      {/* ========================================================== */}
      {/* 6B. DOER PROFILE MODAL (VIEW COURIER DETAILS)              */}
      {/* ========================================================== */}
      <DoerProfileModal
        resolveColor={resolveColor}
        selectedDoerProfile={selectedDoerProfile}
        setSelectedDoerProfile={setSelectedDoerProfile}
        styles={styles}
        triggerToast={triggerToast}
      />

      {/* ========================================================== */}
      {/* 6C. EDIT SUYO MODAL                                        */}
      {/* ========================================================== */}
      <EditSuyoModal
        busy={actionBusy}
        error={actionError}
        editingSuyoData={editingSuyoData}
        handleSaveEditedSuyo={handleSaveEditedSuyo}
        isEditingSuyoModalOpen={isEditingSuyoModalOpen}
        resolveColor={resolveColor}
        setEditingSuyoData={setEditingSuyoData}
        setIsEditingSuyoModalOpen={setIsEditingSuyoModalOpen}
        styles={styles}
      />

      {/* ========================================================== */}
      {/* 7. FAVORITES SUYOS MODAL                                   */}
      {/* ========================================================== */}
      <FavoritesModal
        favoriteSuyos={favoriteSuyos}
        handleCloseFavoritesModal={handleCloseFavoritesModal}
        handleConfirmDeleteSelectedFavs={handleConfirmDeleteSelectedFavs}
        handleOpenSuyoDetail={handleOpenSuyoDetail}
        handleToggleFavDeleteMode={handleToggleFavDeleteMode}
        handleToggleSelectFavToDelete={handleToggleSelectFavToDelete}
        isFavDeleteMode={isFavDeleteMode}
        isFavoritesModalOpen={isFavoritesModalOpen}
        resolveColor={resolveColor}
        selectedFavIdsToDelete={selectedFavIdsToDelete}
        setIsFavoritesModalOpen={setIsFavoritesModalOpen}
        setOpenedFromFavorites={setOpenedFromFavorites}
        setSelectedFavIdsToDelete={setSelectedFavIdsToDelete}
        styles={styles}
        toastConfig={toastConfig}
      />

      {/* ========================================================== */}
      {/* 7.5 FUNCTIONAL NOTIFICATIONS INBOX MODAL                   */}
      {/* ========================================================== */}
      <DashboardNotificationsModal
        clearAllNotifications={clearAllNotifications}
        colors={colors}
        handleTapNotification={handleTapNotification}
        isNotificationsModalOpen={isNotificationsModalOpen}
        markAllNotificationsRead={markAllNotificationsRead}
        markNotificationRead={markNotificationRead}
        notificationBusy={notificationBusy}
        notificationError={notificationError}
        notificationFilter={notificationFilter}
        notifications={notifications}
        refresh={refresh}
        removeNotification={removeNotification}
        resolveColor={resolveColor}
        setIsNotificationsModalOpen={setIsNotificationsModalOpen}
        setNotificationError={setNotificationError}
        setNotificationFilter={setNotificationFilter}
        styles={styles}
        unreadNotificationsCount={unreadNotificationsCount}
        workflowError={workflowError}
        workflowLoading={workflowLoading}
      />

      {/* ========================================================== */}
      {/* 7. DIGITAL E-RECEIPT MODAL (Verified Proof & Cost Breakdown) */}
      {/* ========================================================== */}
      <ReceiptModal
        resolveColor={resolveColor}
        selectedReceipt={selectedReceipt}
        setSelectedReceipt={setSelectedReceipt}
        styles={styles}
        triggerToast={triggerToast}
      />

      {/* ========================================================== */}
      {/* 8. STATISTICS MODAL (Suyo Performance & Community Stats) */}
      {/* ========================================================== */}
      <StatisticsModal
        isStatisticsModalOpen={isStatisticsModalOpen}
        resolveColor={resolveColor}
        setIsStatisticsModalOpen={setIsStatisticsModalOpen}
        styles={styles}
      />

      {/* ========================================================== */}
      {/* 9. SIDEBAR DRAWER                                          */}
      {/* ========================================================== */}
      {isSidebarOpen && (
        <Animated.View
          style={[styles.sidebarBackdrop, { opacity: backdropAnim }]}
        >
          <TouchableOpacity
            style={StyleSheet.absoluteFillObject}
            activeOpacity={1}
            onPress={closeSidebar}
          />
        </Animated.View>
      )}

      <DashboardSidebar
        closeSidebar={closeSidebar}
        expandedSection={expandedSection}
        logout={logout}
        pushNotifications={pushNotifications}
        resolveColor={resolveColor}
        router={router}
        setActiveTab={setActiveTab}
        setIsEditModalOpen={setIsEditModalOpen}
        setPushNotifications={setPushNotifications}
        setTempProfile={setTempProfile}
        sidebarAnim={sidebarAnim}
        styles={styles}
        toggleSection={toggleSection}
        triggerToast={triggerToast}
        userProfile={userProfile}
      />

      {/* ========================================================== */}
      {/* 9. EDIT PROFILE MODAL                                      */}
      {/* ========================================================== */}
      <EditProfileModal
        busy={profileSaving}
        error={profileSaveError}
        handleSaveProfile={handleSaveProfile}
        isEditModalOpen={isEditModalOpen}
        resolveColor={resolveColor}
        setIsEditModalOpen={setIsEditModalOpen}
        setTempProfile={setTempProfile}
        styles={styles}
        tempProfile={tempProfile}
      />

      {/* Universal Floating Toast Modal: Visible on top of ANY open modal at the footer area */}
      {toastConfig && (
        <Modal
          visible={!!toastConfig}
          transparent={true}
          animationType="none"
          statusBarTranslucent={true}
          onRequestClose={() => setToastConfig(null)}
        >
          <View
            style={styles.toastModalBackdrop}
            pointerEvents="box-none"
          >
            {renderFooterToast({
              position: 'absolute',
              bottom: 74 + bottomInset,
            })}
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
}
