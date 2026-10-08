import SwipeableNotificationItem from './SwipeableNotificationItem';
import { styles } from './legacyDashboard.styles';
import {
  SCREEN_WIDTH,
  SIDEBAR_WIDTH,
  USE_NATIVE_DRIVER,
} from './legacyDashboardLayout';
import {
  getTodayFormatted,
  getTomorrowFormatted,
  parseDistanceKm,
  getInitials,
  formatDateTimeNow,
} from './legacyDashboardHelpers';
import {
  INITIAL_AVAILABLE_SUYOS,
  DEFAULT_DOER,
  INITIAL_POSTED_SUYOS,
  INITIAL_CANCELLED_SUYOS,
  INITIAL_ACCEPTED_SUYOS,
  INITIAL_COMPLETED_SUYOS,
  INITIAL_ARCHIVED_SUYOS,
  INITIAL_DOER_ACCEPTED_SUYOS,
  INITIAL_DOER_CANCELLED_SUYOS,
  WALLET_EARNED_SUYOS,
  INITIAL_ACTIVITY_RECORDS,
  CATEGORY_OPTIONS,
  URGENCY_OPTIONS,
  CATEGORY_CONFIG,
  URGENCY_CONFIG,
} from './legacyDashboardData';
import React, { useState, useRef, useMemo, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Dimensions,
  Animated,
  Switch,
  Modal,
  Image,
  Platform,
  Linking,
  Alert,
} from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../context/AuthContext';
import { useSuyos } from '../../context/SuyoContext';
import { useDeviceLocation } from '../../context/LocationContext';
import { useTheme } from '../../theme/ThemeContext';
import { formatOffer } from '../../data/suyoRequests';
import { distanceKm } from '../../lib/geo';
import { RefreshControl } from 'react-native';
import WalletIncomeLineGraph from '../wallet/WalletIncomeLineGraph';

export default function DashboardScreen() {
  const router = useRouter();
  const searchParams = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, 16);
  const [activeTab, setActiveTab] = useState('home');
  const { user, logout } = useAuth();
  const { colors, isDark, toggleTheme } = useTheme();
  const {
    requests,
    transactions = [],
    workflowError,
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
    phone: user?.phone || '+63 917 123 4567',
    address: 'Makati City, Metro Manila',
  });
  useEffect(() => {
    if (user) {
      setUserProfile((prev) => ({
        ...prev,
        name: user.name || user.user_metadata?.full_name || prev.name,
        email: user.email || prev.email,
      }));
    }
  }, [user]);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isStatisticsModalOpen, setIsStatisticsModalOpen] = useState(false);
  const [tempProfile, setTempProfile] = useState({ ...userProfile });
  const [pushNotifications, setPushNotifications] = useState(true);
  const [expandedSection, setExpandedSection] = useState(null);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedDistance, setSelectedDistance] = useState('Any');
  const [selectedUrgency, setSelectedUrgency] = useState('All');
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

  // MySuyo Tab Navigation & Management state (dynamically populated from live requests)
  const [postedSuyos, setPostedSuyos] = useState([]);
  const [acceptedSuyos, setAcceptedSuyos] = useState([]);
  const [completedSuyos, setCompletedSuyos] = useState([]);
  const [cancelledSuyos, setCancelledSuyos] = useState([]);
  const [archivedSuyos, setArchivedSuyos] = useState([]);
  const [mySuyoNavTab, setMySuyoNavTab] = useState('posted'); // 'posted' | 'accepted' | 'completed' | 'cancelled' | 'archived'
  const [isMySuyoEditMode, setIsMySuyoEditMode] = useState(false);
  const [selectedMySuyoIdsToDelete, setSelectedMySuyoIdsToDelete] = useState(
    [],
  );
  const [selectedSuyoContext, setSelectedSuyoContext] = useState('available'); // 'available' | 'posted' | 'accepted' | 'completed' | 'cancelled' | 'archived'
  const [selectedDoerProfile, setSelectedDoerProfile] = useState(null);
  const [isEditingSuyoModalOpen, setIsEditingSuyoModalOpen] = useState(false);
  const [editingSuyoData, setEditingSuyoData] = useState({
    id: '',
    title: '',
    details: '',
    notes: '',
    rewardAmount: 150,
    context: 'posted',
  });

  // Doer Suyo Hub state (dynamically populated from live requests)
  const [doerAcceptedSuyos, setDoerAcceptedSuyos] = useState([]);
  const [doerCompletedSuyos, setDoerCompletedSuyos] = useState([]);
  const [doerCancelledSuyos, setDoerCancelledSuyos] = useState([]);
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

  // Favorites / Saved Suyos state
  const [favoriteSuyoIds, setFavoriteSuyoIds] = useState([]);
  const [isFavoritesModalOpen, setIsFavoritesModalOpen] = useState(false);
  const [openedFromFavorites, setOpenedFromFavorites] = useState(false);

  // Helper to ensure every public suyo on the dashboard has a valid urgency tag
  const resolveUrgencyTag = (item) => {
    if (
      item?.urgency &&
      ['Normal', 'Urgent', 'Due today', 'Due tomorrow'].includes(item.urgency)
    ) {
      return item.urgency;
    }
    const dueStr = `${item?.due || ''} ${item?.dueDate || ''}`.toLowerCase();
    if (dueStr.includes('urgent') || dueStr.includes('asap')) return 'Urgent';
    if (dueStr.includes('tomorrow')) return 'Due tomorrow';
    if (dueStr.includes('today')) return 'Due today';
    return 'Normal';
  };

  // Sync live Supabase requests & transactions with MySuyo & Doer Hub state
  useEffect(() => {
    if (!requests) return;
    const myPosted = requests
      .filter((r) => r.requesterId === user?.id && r.status === 'open')
      .map((r) => ({
        id: r.id,
        title: r.title,
        category: r.category || 'General',
        location: r.location || 'Nearby',
        distanceText: 'Nearby',
        reward: `₱${((r.offerCentavos || 0) / 100).toFixed(0)}`,
        rewardAmount: (r.offerCentavos || 0) / 100,
        tag: 'Waiting for doer',
        status: 'Open - waiting for a doer',
        urgency: resolveUrgencyTag(r),
        due: r.deadline
          ? `Due ${new Date(r.deadline).toLocaleDateString()}`
          : 'Due today',
        dueDate: r.deadline
          ? new Date(r.deadline).toLocaleDateString()
          : getTodayFormatted(),
        createdAt: Date.parse(r.createdAt || Date.now()),
        formattedDate: r.createdAt
          ? new Date(r.createdAt).toLocaleDateString()
          : 'Today',
        details: r.details || '',
        notes: r.specialInstructions || '',
        requesterName: r.requesterName || 'You',
        rawRequest: r,
      }));

    const myAccepted = requests
      .filter(
        (r) =>
          r.requesterId === user?.id &&
          ['assigned', 'in_progress'].includes(r.status),
      )
      .map((r) => ({
        id: r.id,
        title: r.title,
        category: r.category || 'General',
        location: r.location || 'Nearby',
        distanceText: 'In Progress',
        reward: `₱${((r.offerCentavos || 0) / 100).toFixed(0)}`,
        rewardAmount: (r.offerCentavos || 0) / 100,
        tag: r.status === 'in_progress' ? 'In Progress' : 'Assigned',
        status:
          r.status === 'in_progress'
            ? 'In Progress - Courier on the way'
            : 'Accepted - Courier assigned',
        due: r.deadline
          ? `Due ${new Date(r.deadline).toLocaleDateString()}`
          : 'Due today',
        dueDate: r.deadline
          ? new Date(r.deadline).toLocaleDateString()
          : getTodayFormatted(),
        createdAt: Date.parse(r.createdAt || Date.now()),
        formattedDate: r.createdAt
          ? new Date(r.createdAt).toLocaleDateString()
          : 'Today',
        details: r.details || '',
        notes: r.specialInstructions || '',
        requesterName: r.requesterName || 'You',
        rawRequest: r,
      }));

    const myCompleted = requests
      .filter((r) => r.requesterId === user?.id && r.status === 'completed')
      .map((r) => ({
        id: r.id,
        title: r.title,
        category: r.category || 'General',
        location: r.location || 'Nearby',
        distanceText: 'Fulfilled',
        reward: `₱${((r.offerCentavos || 0) / 100).toFixed(0)}`,
        rewardAmount: (r.offerCentavos || 0) / 100,
        tag: 'Completed',
        status: 'Completed',
        due: 'Completed',
        dueDate: r.deadline
          ? new Date(r.deadline).toLocaleDateString()
          : getTodayFormatted(),
        createdAt: Date.parse(r.createdAt || Date.now()),
        formattedDate: r.createdAt
          ? new Date(r.createdAt).toLocaleDateString()
          : 'Recently',
        details: r.details || '',
        notes: r.specialInstructions || '',
        requesterName: r.requesterName || 'You',
        rawRequest: r,
      }));

    const myCancelled = requests
      .filter((r) => r.requesterId === user?.id && r.status === 'cancelled')
      .map((r) => ({
        id: r.id,
        title: r.title,
        category: r.category || 'General',
        location: r.location || 'Nearby',
        distanceText: 'Cancelled',
        reward: `₱${((r.offerCentavos || 0) / 100).toFixed(0)}`,
        rewardAmount: (r.offerCentavos || 0) / 100,
        tag: 'Cancelled',
        status: 'Cancelled',
        due: 'Cancelled',
        dueDate: getTodayFormatted(),
        createdAt: Date.parse(r.createdAt || Date.now()),
        formattedDate: r.createdAt
          ? new Date(r.createdAt).toLocaleDateString()
          : 'Recently',
        details: r.details || '',
        notes: r.specialInstructions || '',
        requesterName: r.requesterName || 'You',
        rawRequest: r,
      }));

    const myAssigned = requests
      .filter(
        (r) =>
          r.providerId === user?.id &&
          ['assigned', 'in_progress'].includes(r.status),
      )
      .map((r) => ({
        id: r.id,
        title: r.title,
        category: r.category || 'General',
        location: r.location || 'Nearby',
        distanceText: 'In Progress',
        reward: `₱${((r.offerCentavos || 0) / 100).toFixed(0)}`,
        rewardAmount: (r.offerCentavos || 0) / 100,
        tag: r.status === 'in_progress' ? 'In Progress' : 'Assigned',
        status:
          r.status === 'in_progress' ? 'In Progress - On the way' : 'Accepted',
        createdAt: Date.parse(r.createdAt || Date.now()),
        details: r.details || '',
        notes: r.specialInstructions || '',
        requesterName: r.requesterName || 'Community Member',
        rawRequest: r,
      }));

    const myDoerCompleted = requests
      .filter((r) => r.providerId === user?.id && r.status === 'completed')
      .map((r) => ({
        id: r.id,
        title: r.title,
        category: r.category || 'General',
        location: r.location || 'Nearby',
        earnedAmount: (r.offerCentavos || 0) / 100,
        date: r.createdAt
          ? new Date(r.createdAt).toLocaleDateString()
          : 'Completed',
        requesterName: r.requesterName || 'Requester',
        icon:
          r.category === 'Groceries'
            ? 'cart'
            : r.category === 'Medicine'
              ? 'medkit'
              : r.category === 'Delivery'
                ? 'bicycle'
                : 'document-text',
        rawRequest: r,
      }));

    const myDoerCancelled = requests
      .filter((r) => r.providerId === user?.id && r.status === 'cancelled')
      .map((r) => ({
        id: r.id,
        title: r.title,
        category: r.category || 'General',
        location: r.location || 'Nearby',
        reward: `₱${((r.offerCentavos || 0) / 100).toFixed(0)}`,
        status: 'Cancelled',
        rawRequest: r,
      }));

    setPostedSuyos(myPosted);
    setAcceptedSuyos(myAccepted);
    setCompletedSuyos(myCompleted);
    setCancelledSuyos(myCancelled);
    setDoerAcceptedSuyos(myAssigned);
    setDoerCompletedSuyos(myDoerCompleted);
    setDoerCancelledSuyos(myDoerCancelled);
  }, [requests, user?.id]);

  // Wallet dynamic computations from live Supabase transactions
  const providerTransactions = useMemo(
    () => (transactions || []).filter((t) => t.role === 'provider'),
    [transactions],
  );
  const overallEarningsSum = useMemo(
    () =>
      providerTransactions.reduce(
        (sum, t) => sum + (t.rewardCentavos || 0),
        0,
      ) / 100,
    [providerTransactions],
  );
  const dynamicWalletList = useMemo(() => {
    return providerTransactions.map((t, idx) => {
      const d = t.completedAt ? new Date(t.completedAt) : new Date();
      const isToday = d.toDateString() === new Date().toDateString();
      const dateStr = isToday
        ? `Today · ${d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`
        : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      return {
        id: t.requestId || `WAL-${idx}`,
        title: t.title || 'Completed Suyo',
        category: t.category || 'Documents',
        icon:
          t.category === 'Groceries'
            ? 'cart'
            : t.category === 'Medicine'
              ? 'medkit'
              : t.category === 'Delivery'
                ? 'bicycle'
                : 'document-text',
        date: dateStr,
        requesterName: t.otherUserName || 'Requester',
        location: 'Direct Settlement',
        earnedAmount: (t.rewardCentavos || 0) / 100,
        status: 'Received',
      };
    });
  }, [providerTransactions]);

  const todayWalletList = dynamicWalletList.filter((s) =>
    s.date?.startsWith('Today'),
  );
  const todayEarningsSum = todayWalletList.reduce(
    (sum, s) => sum + (Number(s.earnedAmount) || 0),
    0,
  );
  const todaySuyosCount = todayWalletList.length;
  const overallSuyosCount = providerTransactions.length;
  const displayWalletTotal = `₱${overallEarningsSum.toFixed(2)}`;

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const todayDateFormatted = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${currentYear}`;

  const monthlySuyosCount = useMemo(() => {
    return providerTransactions.filter((t) => {
      const dateStr = t.completedAt || t.created_at || t.createdAt;
      const d = dateStr ? new Date(dateStr) : null;
      return (
        d &&
        !isNaN(d.getTime()) &&
        d.getFullYear() === currentYear &&
        d.getMonth() === currentMonth
      );
    }).length;
  }, [providerTransactions, currentYear, currentMonth]);

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
  const favoriteSuyos = useMemo(() => {
    return availableSuyosBase.filter((suyo) =>
      favoriteSuyoIds.includes(suyo.id),
    );
  }, [favoriteSuyoIds, availableSuyosBase]);

  // Toast feedback state
  const [toastConfig, setToastConfig] = useState(null);
  const toastAnim = useRef(new Animated.Value(0)).current;
  const toastTimerRef = useRef(null);

  const triggerToast = (message, icon = 'heart') => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }
    toastAnim.setValue(0);
    setToastConfig({ message, icon });
    Animated.spring(toastAnim, {
      toValue: 1,
      tension: 75,
      friction: 8,
      useNativeDriver: USE_NATIVE_DRIVER,
    }).start();

    toastTimerRef.current = setTimeout(() => {
      Animated.timing(toastAnim, {
        toValue: 0,
        duration: 220,
        useNativeDriver: USE_NATIVE_DRIVER,
      }).start(() => {
        setToastConfig(null);
      });
    }, 2800);
  };

  const renderFooterToast = (overrideStyle = null) => {
    if (!toastConfig) return null;
    return (
      <Animated.View
        pointerEvents="none"
        style={[
          styles.globalPoppingToastWrapper,
          {
            bottom: 74 + bottomInset,
            opacity: toastAnim,
            transform: [
              {
                translateY: toastAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [24, 0],
                }),
              },
              {
                scale: toastAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.92, 1],
                }),
              },
            ],
          },
          overrideStyle,
        ]}
      >
        <View style={styles.poppingToastContent}>
          <View style={styles.poppingToastIconCircle}>
            <Ionicons
              name={
                toastConfig.icon === 'heart'
                  ? 'heart'
                  : toastConfig.icon === 'heart-dislike'
                    ? 'heart-dislike'
                    : toastConfig.icon === 'bookmark'
                      ? 'bookmark'
                      : toastConfig.icon === 'trash-outline' ||
                          toastConfig.icon === 'trash'
                        ? 'trash'
                        : toastConfig.icon === 'paper-plane'
                          ? 'paper-plane'
                          : toastConfig.icon === 'close-circle'
                            ? 'close-circle'
                            : 'checkmark-circle'
              }
              size={15}
              color="#FFFFFF"
            />
          </View>
          <Text style={styles.poppingToastText}>{toastConfig.message}</Text>
        </View>
      </Animated.View>
    );
  };

  useEffect(() => {
    if (searchParams?.justPosted === 'true') {
      triggerToast('suyo is successfully posted', 'paper-plane');
    }
  }, [searchParams?.justPosted]);

  const toggleFavoriteSuyo = (suyo) => {
    if (!suyo) return;
    const isFav = favoriteSuyoIds.includes(suyo.id);
    if (isFav) {
      setFavoriteSuyoIds((prev) => prev.filter((id) => id !== suyo.id));
      triggerToast('suyo is removed from favourite', 'heart-dislike');
    } else {
      setFavoriteSuyoIds((prev) => [...prev, suyo.id]);
      triggerToast('suyo is successfully added to favourite', 'heart');
    }
  };

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

  const handleRepeatActivitySuyo = (record) => {
    const newPostedSuyo = {
      id: `POST-${Date.now().toString().slice(-4)}`,
      title: record.title,
      category: record.category,
      location: record.location,
      distanceText: '0.8 km away',
      reward: `₱${record.amount}`,
      rewardAmount: record.amount,
      tag: 'Waiting for doer',
      status: 'Open - waiting for a doer',
      urgency: 'Due today',
      due: 'Due today',
      dueDate: getTodayFormatted(),
      createdAt: Date.now(),
      formattedDate: 'Just now',
      waitTime: 'Just posted',
      needsBoost: false,
      details: record.notes || record.title,
      requesterName: `${userProfile?.name || 'Juan Dela Cruz'} (You)`,
    };
    setPostedSuyos((prev) => [newPostedSuyo, ...prev]);
    setActiveTab('mysuyo');
    setMySuyoNavTab('posted');
    triggerToast(
      `Re-posted "${record.title}". Notifying couriers...`,
      'bicycle',
    );
  };

  // Favorites Selection/Delete Mode state
  const [isFavDeleteMode, setIsFavDeleteMode] = useState(false);
  const [selectedFavIdsToDelete, setSelectedFavIdsToDelete] = useState([]);

  const handleCloseFavoritesModal = () => {
    setIsFavoritesModalOpen(false);
    setIsFavDeleteMode(false);
    setSelectedFavIdsToDelete([]);
  };

  const handleToggleFavDeleteMode = () => {
    setIsFavDeleteMode((prev) => !prev);
    setSelectedFavIdsToDelete([]);
  };

  const handleToggleSelectFavToDelete = (id) => {
    setSelectedFavIdsToDelete((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const handleConfirmDeleteSelectedFavs = () => {
    if (selectedFavIdsToDelete.length === 0) return;
    const count = selectedFavIdsToDelete.length;
    setFavoriteSuyoIds((prev) =>
      prev.filter((id) => !selectedFavIdsToDelete.includes(id)),
    );
    setSelectedFavIdsToDelete([]);
    setIsFavDeleteMode(false);
    triggerToast(
      count === 1
        ? '1 suyo removed from favorites'
        : `${count} suyos removed from favorites`,
      'heart-dislike',
    );
  };

  // Sync any newly posted backend requests into postedSuyos
  useEffect(() => {
    if (requests && requests.length > 0) {
      const userBackendRequests = requests.filter(
        (r) =>
          r.scope === 'posted' ||
          r.requesterEmail === user?.email ||
          r.requesterName === userProfile?.name,
      );
      if (userBackendRequests.length > 0) {
        setPostedSuyos((prev) => {
          const prevIds = new Set(prev.map((p) => p.id));
          const newItems = userBackendRequests
            .filter((r) => !prevIds.has(r.id))
            .map((r) => {
              const isUrgent =
                r.deadline &&
                Date.parse(r.deadline) < Date.now() + 24 * 3600 * 1000;
              return {
                id: r.id,
                title: r.title,
                category: r.category || 'General',
                location: r.location || 'Nearby',
                distanceText: '0.8 km away',
                reward: formatOffer(r.offerCentavos || 0),
                rewardAmount: (r.offerCentavos || 0) / 100,
                tag: 'Waiting for doer',
                status: 'Open - waiting for a doer',
                urgency: r.urgency || (isUrgent ? 'Urgent' : 'Due today'),
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
                createdAt: Date.parse(r.createdAt || Date.now()),
                formattedDate: 'Just now',
                waitTime: 'Just posted',
                needsBoost: false,
                details: r.details || 'No details provided.',
                requesterName: r.requesterName || userProfile?.name || 'You',
              };
            });
          if (newItems.length === 0) return prev;
          return [...newItems, ...prev];
        });
      }
    }
  }, [requests, user?.email, userProfile?.name]);

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
  const handleBoostReward = (suyoId, addAmount) => {
    setPostedSuyos((prev) =>
      prev.map((s) => {
        if (s.id === suyoId) {
          const baseAmt = Number(s.baseRewardAmount ?? s.rewardAmount ?? 150);
          const newAmt = addAmount === 0 ? baseAmt : baseAmt + addAmount;
          return {
            ...s,
            baseRewardAmount: baseAmt,
            currentBoost: addAmount,
            rewardAmount: newAmt,
            reward: `₱${newAmt}`,
            needsBoost: false,
          };
        }
        return s;
      }),
    );
    if (selectedSuyo && selectedSuyo.id === suyoId) {
      const baseAmt = Number(
        selectedSuyo.baseRewardAmount ?? selectedSuyo.rewardAmount ?? 150,
      );
      const newAmt = addAmount === 0 ? baseAmt : baseAmt + addAmount;
      setSelectedSuyo((prev) => ({
        ...prev,
        baseRewardAmount: baseAmt,
        currentBoost: addAmount,
        rewardAmount: newAmt,
        reward: `₱${newAmt}`,
        needsBoost: false,
      }));
    }
    if (addAmount === 0) {
      triggerToast('Reward boost reset to original amount', 'refresh');
    } else {
      triggerToast(
        `Reward increased by +₱${addAmount}! Couriers notified.`,
        'sparkles',
      );
    }
  };

  // Feature: Cancel Suyo
  const handleCancelSuyo = (suyoId) => {
    const target = postedSuyos.find((s) => s.id === suyoId) || selectedSuyo;
    if (target) {
      const cancelledItem = {
        ...target,
        status: 'Cancelled',
        tag: 'Cancelled',
        needsBoost: false,
        cancelledAt: 'Today',
      };
      setCancelledSuyos((prev) => [
        cancelledItem,
        ...prev.filter((s) => s.id !== suyoId),
      ]);
      setPostedSuyos((prev) => prev.filter((s) => s.id !== suyoId));
    }
    if (selectedSuyo && selectedSuyo.id === suyoId) {
      setSelectedSuyo(null);
    }
    triggerToast('suyo is successfully cancelled', 'close-circle');
  };

  // Feature: Open Edit Suyo
  const handleOpenEditSuyo = (suyo) => {
    setEditingSuyoData({
      id: suyo.id,
      title: suyo.title || '',
      details: suyo.details || '',
      notes: suyo.notes || '',
      rewardAmount: suyo.rewardAmount || 150,
      context: selectedSuyoContext,
    });
    setIsEditingSuyoModalOpen(true);
  };

  // Feature: Save Edited Suyo
  const handleSaveEditedSuyo = () => {
    if (!editingSuyoData.title.trim()) {
      triggerToast('Title cannot be empty', 'alert-circle');
      return;
    }
    const updatedReward = `₱${Number(editingSuyoData.rewardAmount) || 150}`;
    const updateInList = (list) =>
      list.map((item) =>
        item.id === editingSuyoData.id
          ? {
              ...item,
              title: editingSuyoData.title.trim(),
              details: editingSuyoData.details.trim(),
              notes: editingSuyoData.notes.trim(),
              rewardAmount: Number(editingSuyoData.rewardAmount) || 150,
              reward: updatedReward,
            }
          : item,
      );

    if (editingSuyoData.context === 'posted') {
      setPostedSuyos(updateInList);
    } else if (editingSuyoData.context === 'archived') {
      setArchivedSuyos(updateInList);
    }

    if (selectedSuyo && selectedSuyo.id === editingSuyoData.id) {
      setSelectedSuyo((prev) => ({
        ...prev,
        title: editingSuyoData.title.trim(),
        details: editingSuyoData.details.trim(),
        notes: editingSuyoData.notes.trim(),
        rewardAmount: Number(editingSuyoData.rewardAmount) || 150,
        reward: updatedReward,
      }));
    }

    setIsEditingSuyoModalOpen(false);
    triggerToast('Suyo details updated successfully', 'checkmark-circle');
  };

  // Feature: Save completed suyo to Archive for future repeat requests
  const handleSaveToArchive = (suyo) => {
    if (!suyo) return;
    const isAlreadyArchived = archivedSuyos.some(
      (a) => a.id === suyo.id || a.title === suyo.title,
    );
    if (!isAlreadyArchived) {
      const template = {
        ...suyo,
        id: `ARCH-${Date.now().toString().slice(-4)}`,
        status: 'Archived Template',
        tag: 'Archived Template',
        formattedDate: 'Saved template',
      };
      setArchivedSuyos((prev) => [template, ...prev]);
    }
    triggerToast('suyo is successfully archive', 'bookmark');
  };

  // Feature: Repeat request from completed or archived
  const handleRepeatRequest = (suyo) => {
    const newPostedSuyo = {
      ...suyo,
      id: `POST-${Date.now().toString().slice(-4)}`,
      status: 'Open - waiting for a doer',
      tag: 'Waiting for doer',
      urgency:
        suyo.urgency ||
        (suyo.due?.toLowerCase().includes('tomorrow')
          ? 'Due tomorrow'
          : 'Due today'),
      due: suyo.due || 'Due today',
      dueDate: suyo.dueDate || getTodayFormatted(),
      formattedDate: 'Just now',
      waitTime: 'Just posted',
      needsBoost: false,
      createdAt: Date.now(),
      doer: undefined,
    };
    setPostedSuyos((prev) => [newPostedSuyo, ...prev]);
    setSelectedSuyo(null);
    setMySuyoNavTab('posted');
    triggerToast('suyo is successfully posted', 'paper-plane');
  };

  // Functional Notifications state
  const [notifications, setNotifications] = useState([
    {
      id: 'NOTIF-1',
      title: 'Doer Assigned',
      body: 'Alex M. accepted your suyo "Drop off documents - Unit 402". Estimated arrival in 5 mins.',
      time: '5m ago',
      category: 'doer',
      icon: 'bicycle',
      unread: true,
      targetScreen: '/requester-fulfill',
    },
    {
      id: 'NOTIF-2',
      title: 'Task Accepted',
      body: 'You are now fulfilling "Buy groceries - SM Tagum". Tap to view task directions.',
      time: '25m ago',
      category: 'task',
      icon: 'cart-outline',
      unread: true,
      targetScreen: '/fulfill',
      taskParams: {
        id: 'SYL-102',
        title: 'Buy groceries - SM Tagum',
        category: 'Groceries',
        location: 'SM Tagum',
        reward: '₱150',
        requesterName: 'Maria Clarissa',
      },
    },
    {
      id: 'NOTIF-3',
      title: 'Reward Credited',
      body: '₱300 has been credited to your account for completing suyo #SYL-984.',
      time: '1h ago',
      category: 'payment',
      icon: 'cash-outline',
      unread: true,
      targetScreen: null,
    },
    {
      id: 'NOTIF-4',
      title: 'New Suyo Nearby',
      body: 'An urgent suyo "Prescription pickup at Mercury Drug" was posted 1.1 km away.',
      time: '3h ago',
      category: 'nearby',
      icon: 'location-outline',
      unread: false,
      targetScreen: null,
    },
  ]);
  const [isNotificationsModalOpen, setIsNotificationsModalOpen] =
    useState(false);
  const [notificationFilter, setNotificationFilter] = useState('All'); // 'All' | 'Unread'

  const unreadNotificationsCount = notifications.filter((n) => n.unread).length;

  const markNotificationRead = (id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, unread: false } : n)),
    );
    triggerToast('Notification marked as read', 'checkmark-circle');
  };

  const markAllNotificationsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
    triggerToast('All notifications marked as read', 'checkmark-done');
  };

  const clearAllNotifications = () => {
    setNotifications([]);
    triggerToast('All notifications cleared', 'trash-outline');
  };

  const removeNotification = (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    triggerToast('Notification removed', 'trash-outline');
  };

  const handleTapNotification = (notif) => {
    // Mark as read
    setNotifications((prev) =>
      prev.map((n) => (n.id === notif.id ? { ...n, unread: false } : n)),
    );
    setIsNotificationsModalOpen(false);

    if (notif.targetScreen === '/requester-fulfill') {
      router.push('/requester-fulfill');
    } else if (notif.targetScreen === '/fulfill') {
      router.push({
        pathname: '/fulfill',
        params: notif.taskParams || {
          id: 'SYL-102',
          title: 'Buy groceries - SM Tagum',
          category: 'Groceries',
          location: 'SM Tagum',
          reward: '₱150',
          requesterName: 'Maria Clarissa',
        },
      });
    } else if (notif.category === 'payment') {
      triggerToast(
        '₱300 reward credited to your SuyoLink Wallet',
        'cash-outline',
      );
    } else if (notif.category === 'nearby') {
      const urgentSuyo =
        filteredSuyos.find((s) => s.tag === 'Urgent') || filteredSuyos[0];
      if (urgentSuyo) {
        handleOpenSuyoDetail(urgentSuyo);
      } else {
        router.push('/map');
      }
    } else {
      triggerToast(notif.title, 'notifications');
    }
  };

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

  const currentDistanceKm = parseDistanceKm(selectedDistance);

  // Count active filters
  const activeFiltersCount =
    (selectedCategory !== 'All' ? 1 : 0) +
    (currentDistanceKm !== 'Any' ? 1 : 0) +
    (selectedUrgency !== 'All' ? 1 : 0);

  const isFiltering = activeFiltersCount > 0 || searchQuery.trim().length > 0;

  // Filtered & Sorted Available Suyos
  const filteredSuyos = useMemo(() => {
    let list = [...availableSuyosBase];

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (item) =>
          item.title.toLowerCase().includes(q) ||
          item.details.toLowerCase().includes(q) ||
          item.location.toLowerCase().includes(q) ||
          item.category.toLowerCase().includes(q),
      );
    }

    // Category filter
    if (selectedCategory !== 'All') {
      list = list.filter((item) => item.category === selectedCategory);
    }

    // Distance filter
    if (currentDistanceKm !== 'Any') {
      list = list.filter((item) => item.distance <= currentDistanceKm);
    }

    // Urgency filter
    if (selectedUrgency !== 'All') {
      list = list.filter((item) => item.tag === selectedUrgency);
    }

    // Sort newest first
    list.sort((a, b) => b.createdAt - a.createdAt);

    return list;
  }, [searchQuery, selectedCategory, selectedDistance, selectedUrgency]);

  // Dynamic header title
  const availableHeaderTitle = useMemo(() => {
    if (!isFiltering) {
      return 'Available Suyos';
    }
    if (searchQuery.trim()) {
      return `${filteredSuyos.length} result${filteredSuyos.length === 1 ? '' : 's'} for "${searchQuery.trim()}"`;
    }
    return `Filtered Suyos (${filteredSuyos.length})`;
  }, [isFiltering, searchQuery, filteredSuyos.length]);

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

  const handleSaveProfile = () => {
    setUserProfile({ ...tempProfile });
    setIsEditModalOpen(false);
    triggerToast('Profile updated successfully', 'person');
  };

  const handleIncreaseDistance = () => {
    if (currentDistanceKm === 'Any') {
      setSelectedDistance('1 km');
    } else if (currentDistanceKm < 20) {
      setSelectedDistance(`${currentDistanceKm + 1} km`);
    }
  };

  const handleDecreaseDistance = () => {
    if (currentDistanceKm === 1) {
      setSelectedDistance('Any');
    } else if (typeof currentDistanceKm === 'number' && currentDistanceKm > 1) {
      setSelectedDistance(`${currentDistanceKm - 1} km`);
    }
  };

  const clearAllFilters = () => {
    setSelectedCategory('All');
    setSelectedDistance('Any');
    setSelectedUrgency('All');
    setSearchQuery('');
  };

  const handleResetModalFilters = () => {
    setSelectedCategory('All');
    setSelectedDistance('Any');
    setSelectedUrgency('All');
  };

  return (
    <SafeAreaView
      edges={['top']}
      style={styles.safeContainer}
    >
      <StatusBar style="light" />

      {/* 1. FIXED TOP BAR */}
      <View style={styles.fixedTopBar}>
        <TouchableOpacity
          onPress={openSidebar}
          style={styles.headerIconButton}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessibilityRole="button"
          accessibilityLabel="Open sidebar"
        >
          <Ionicons
            name="menu-outline"
            size={26}
            color="#FFFFFF"
          />
        </TouchableOpacity>

        <View style={styles.headerRightActions}>
          {/* Heart / Favorites Icon */}
          <TouchableOpacity
            style={styles.headerIconButton}
            activeOpacity={0.7}
            onPress={() => setIsFavoritesModalOpen(true)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityRole="button"
            accessibilityLabel="Saved Favorites"
          >
            <Ionicons
              name="heart-outline"
              size={22}
              color="#FFFFFF"
            />
            {favoriteSuyoIds.length > 0 && (
              <View style={styles.unreadBadgeDot} />
            )}
          </TouchableOpacity>

          {/* Notifications Icon (Functional) */}
          <TouchableOpacity
            style={styles.headerIconButton}
            activeOpacity={0.7}
            onPress={() => setIsNotificationsModalOpen(true)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityRole="button"
            accessibilityLabel={`Open notifications, ${unreadNotificationsCount} unread`}
          >
            <Ionicons
              name="notifications-outline"
              size={22}
              color="#FFFFFF"
            />
            {unreadNotificationsCount > 0 && (
              <View style={styles.headerNotifBadge}>
                <Text style={styles.headerNotifBadgeText}>
                  {unreadNotificationsCount > 9
                    ? '9+'
                    : unreadNotificationsCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* 2. MAIN SCROLLABLE CONTENT */}
      <ScrollView
        style={styles.contentScroll}
        contentContainerStyle={[
          styles.contentContainer,
          { paddingBottom: (hasActiveSuyo ? 140 : 85) + bottomInset },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === 'home' && (
          <>
            {/* === HERO SECTION WITH MATCHING SCOOTER COURIER STICKER === */}
            <View style={styles.headerHeroSection}>
              <View style={styles.heroTextBlock}>
                <View style={styles.locationPill}>
                  <Ionicons
                    name="location-sharp"
                    size={11}
                    color="#4ADE80"
                  />
                  <Text style={styles.locationPillText}>Makati CBD</Text>
                </View>
                <Text style={styles.welcomeSubText}>WELCOME BACK</Text>
                <Text
                  style={styles.welcomeNameText}
                  numberOfLines={1}
                >
                  {userProfile?.name || 'Juan Dela Cruz'}
                </Text>
                <Text style={styles.welcomeTagline}>
                  Need a suyo done today?
                </Text>
              </View>

              <Image
                source={require('../../assets/scooter_hero_isometric.jpg')}
                style={styles.heroImageSticker}
                resizeMode="contain"
              />
            </View>

            {/* White Content Body */}
            <View style={styles.whiteContentBody}>
              {/* Search Bar + Filter Icon Row */}
              <View style={styles.searchRow}>
                <View style={styles.searchBarContainer}>
                  <Ionicons
                    name="search-outline"
                    size={20}
                    color="#7A9384"
                    style={styles.searchIcon}
                  />
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Search suyos..."
                    placeholderTextColor="#688676"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    accessibilityLabel="Search suyos"
                  />
                  {searchQuery.length > 0 && (
                    <TouchableOpacity
                      onPress={() => setSearchQuery('')}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Ionicons
                        name="close-circle"
                        size={18}
                        color="#8FA497"
                      />
                    </TouchableOpacity>
                  )}
                </View>

                {/* Filter Icon Button Beside Search Bar */}
                <TouchableOpacity
                  style={[
                    styles.filterIconButton,
                    activeFiltersCount > 0 && styles.filterIconButtonActive,
                  ]}
                  activeOpacity={0.75}
                  onPress={() => setIsFilterModalOpen(true)}
                  hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                >
                  <Ionicons
                    name="options-outline"
                    size={22}
                    color={activeFiltersCount > 0 ? '#FFFFFF' : '#1E4D2B'}
                  />
                  {activeFiltersCount > 0 && (
                    <View style={styles.filterActiveBadgeDot}>
                      <Text style={styles.filterActiveBadgeText}>
                        {activeFiltersCount}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>

              {/* === AVAILABLE SUYO HEADER === */}
              <View style={styles.sectionHeaderRow}>
                <View
                  style={{
                    flex: 1,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 7,
                    paddingRight: 8,
                  }}
                >
                  <Text
                    style={[styles.sectionHeading, { marginBottom: 0 }]}
                    numberOfLines={1}
                  >
                    {availableHeaderTitle}
                  </Text>
                  {!isFiltering && (
                    <View style={styles.availableCountBadge}>
                      <Text style={styles.availableCountBadgeText}>
                        {availableSuyosBase.length}
                      </Text>
                    </View>
                  )}
                </View>

                {isFiltering ? (
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={clearAllFilters}
                    style={styles.clearFiltersPill}
                  >
                    <Ionicons
                      name="close-circle-outline"
                      size={13}
                      color="#64748B"
                    />
                    <Text style={styles.clearFiltersText}>Clear all</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => setIsFilterModalOpen(true)}
                    style={styles.nearestHeaderBadge}
                  >
                    <Ionicons
                      name="location-outline"
                      size={13}
                      color="#1E4D2B"
                    />
                    <Text style={styles.nearestHeaderText}>Nearest</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* === AVAILABLE SUYO LIST === */}
              <View style={styles.tasksList}>
                {filteredSuyos.length > 0 ? (
                  filteredSuyos.map((suyo) => (
                    <TouchableOpacity
                      key={suyo.id}
                      style={styles.suyoCard}
                      activeOpacity={0.88}
                      onPress={() => handleOpenSuyoDetail(suyo)}
                    >
                      <View style={styles.suyoCardTopRow}>
                        <Text
                          style={styles.suyoCardTitle}
                          numberOfLines={2}
                        >
                          {suyo.title}
                        </Text>
                        <Text style={styles.suyoCardReward}>{suyo.reward}</Text>
                      </View>

                      <View style={styles.suyoCardBottomRow}>
                        <Text style={styles.suyoCardDistanceSub}>
                          {suyo.distanceText} • {suyo.postedTime}
                        </Text>

                        <View
                          style={[
                            styles.suyoTagPill,
                            suyo.tag === 'Urgent'
                              ? styles.suyoTagUrgent
                              : suyo.tag === 'Due today'
                                ? styles.suyoTagToday
                                : suyo.tag === 'Due tomorrow'
                                  ? styles.suyoTagTomorrow
                                  : styles.suyoTagNormal,
                          ]}
                        >
                          <Text
                            style={[
                              styles.suyoTagPillText,
                              suyo.tag === 'Urgent'
                                ? styles.suyoTagUrgentText
                                : suyo.tag === 'Due today'
                                  ? styles.suyoTagTodayText
                                  : suyo.tag === 'Due tomorrow'
                                    ? styles.suyoTagTomorrowText
                                    : styles.suyoTagNormalText,
                            ]}
                          >
                            {suyo.tag}
                          </Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  ))
                ) : (
                  <View style={styles.emptyStateBox}>
                    <Ionicons
                      name="search"
                      size={32}
                      color="#8FA497"
                    />
                    <Text style={styles.emptyStateTitle}>No suyos found</Text>
                    <Text style={styles.emptyStateSub}>
                      Try clearing your search or adjusting your distance and
                      category filters.
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </>
        )}

        {/* === MYSUYO HUB SCREEN === */}
        {activeTab === 'mysuyo' && (
          <View style={styles.mySuyoMainWrapper}>
            {/* MySuyo Hero Banner */}
            <View style={styles.mySuyoHeroSection}>
              <View style={styles.mySuyoHeroTextCol}>
                <Text style={styles.mySuyoHeroSuper}>MY SUYO HUB</Text>
                <Text style={styles.mySuyoHeroTitle}>Requested Suyos</Text>
                <Text style={styles.mySuyoHeroSub}>
                  Manage, track, boost, and repeat your requested suyos
                </Text>
              </View>
              <View style={styles.mySuyoHeroBadge}>
                <Ionicons
                  name="receipt-outline"
                  size={24}
                  color="#1C3A27"
                />
              </View>
            </View>

            {/* Modern Text Navigation: Posted, Accepted, Completed, Archived (Zero chunky button pills) */}
            <View style={styles.mySuyoTextNavWrapper}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.mySuyoTextNavRow}
              >
                {/* 1. Posted Tab */}
                <TouchableOpacity
                  style={styles.mySuyoTextNavItem}
                  activeOpacity={0.7}
                  onPress={() => {
                    setMySuyoNavTab('posted');
                    setIsMySuyoEditMode(false);
                    setSelectedMySuyoIdsToDelete([]);
                  }}
                >
                  <Text
                    style={[
                      styles.mySuyoTextNavTitle,
                      mySuyoNavTab === 'posted' &&
                        styles.mySuyoTextNavTitleActive,
                    ]}
                  >
                    Posted
                  </Text>
                  <Text
                    style={[
                      styles.mySuyoTextNavCount,
                      mySuyoNavTab === 'posted' &&
                        styles.mySuyoTextNavCountActive,
                    ]}
                  >
                    ({postedSuyos.length})
                  </Text>
                  {mySuyoNavTab === 'posted' && (
                    <View style={styles.mySuyoTextNavUnderline} />
                  )}
                </TouchableOpacity>

                {/* 2. Accepted Tab */}
                <TouchableOpacity
                  style={styles.mySuyoTextNavItem}
                  activeOpacity={0.7}
                  onPress={() => {
                    setMySuyoNavTab('accepted');
                    setIsMySuyoEditMode(false);
                    setSelectedMySuyoIdsToDelete([]);
                  }}
                >
                  <Text
                    style={[
                      styles.mySuyoTextNavTitle,
                      mySuyoNavTab === 'accepted' &&
                        styles.mySuyoTextNavTitleActive,
                    ]}
                  >
                    Accepted
                  </Text>
                  <Text
                    style={[
                      styles.mySuyoTextNavCount,
                      mySuyoNavTab === 'accepted' &&
                        styles.mySuyoTextNavCountActive,
                    ]}
                  >
                    ({acceptedSuyos.length})
                  </Text>
                  {mySuyoNavTab === 'accepted' && (
                    <View style={styles.mySuyoTextNavUnderline} />
                  )}
                </TouchableOpacity>

                {/* 3. Completed Tab */}
                <TouchableOpacity
                  style={styles.mySuyoTextNavItem}
                  activeOpacity={0.7}
                  onPress={() => {
                    setMySuyoNavTab('completed');
                    setIsMySuyoEditMode(false);
                    setSelectedMySuyoIdsToDelete([]);
                  }}
                >
                  <Text
                    style={[
                      styles.mySuyoTextNavTitle,
                      mySuyoNavTab === 'completed' &&
                        styles.mySuyoTextNavTitleActive,
                    ]}
                  >
                    Completed
                  </Text>
                  <Text
                    style={[
                      styles.mySuyoTextNavCount,
                      mySuyoNavTab === 'completed' &&
                        styles.mySuyoTextNavCountActive,
                    ]}
                  >
                    ({completedSuyos.length})
                  </Text>
                  {mySuyoNavTab === 'completed' && (
                    <View style={styles.mySuyoTextNavUnderline} />
                  )}
                </TouchableOpacity>

                {/* 4. Cancelled Tab */}
                <TouchableOpacity
                  style={styles.mySuyoTextNavItem}
                  activeOpacity={0.7}
                  onPress={() => {
                    setMySuyoNavTab('cancelled');
                    setIsMySuyoEditMode(false);
                    setSelectedMySuyoIdsToDelete([]);
                  }}
                >
                  <Text
                    style={[
                      styles.mySuyoTextNavTitle,
                      mySuyoNavTab === 'cancelled' &&
                        styles.mySuyoTextNavTitleActive,
                    ]}
                  >
                    Cancelled
                  </Text>
                  <Text
                    style={[
                      styles.mySuyoTextNavCount,
                      mySuyoNavTab === 'cancelled' &&
                        styles.mySuyoTextNavCountActive,
                    ]}
                  >
                    ({cancelledSuyos.length})
                  </Text>
                  {mySuyoNavTab === 'cancelled' && (
                    <View style={styles.mySuyoTextNavUnderline} />
                  )}
                </TouchableOpacity>

                {/* 5. Archived Tab */}
                <TouchableOpacity
                  style={styles.mySuyoTextNavItem}
                  activeOpacity={0.7}
                  onPress={() => {
                    setMySuyoNavTab('archived');
                    setIsMySuyoEditMode(false);
                    setSelectedMySuyoIdsToDelete([]);
                  }}
                >
                  <Text
                    style={[
                      styles.mySuyoTextNavTitle,
                      mySuyoNavTab === 'archived' &&
                        styles.mySuyoTextNavTitleActive,
                    ]}
                  >
                    Archived
                  </Text>
                  <Text
                    style={[
                      styles.mySuyoTextNavCount,
                      mySuyoNavTab === 'archived' &&
                        styles.mySuyoTextNavCountActive,
                    ]}
                  >
                    ({archivedSuyos.length})
                  </Text>
                  {mySuyoNavTab === 'archived' && (
                    <View style={styles.mySuyoTextNavUnderline} />
                  )}
                </TouchableOpacity>
              </ScrollView>
            </View>

            {/* Sub-bar with title, status note, and fading text 'Edit' */}
            <View style={styles.mySuyoSubBar}>
              <View style={{ flex: 1, paddingRight: 8 }}>
                <Text style={styles.mySuyoSubBarTitle}>
                  {mySuyoNavTab === 'posted'
                    ? 'Posted Suyos'
                    : mySuyoNavTab === 'accepted'
                      ? 'Accepted Suyos'
                      : mySuyoNavTab === 'completed'
                        ? 'Completed Suyos'
                        : mySuyoNavTab === 'cancelled'
                          ? 'Cancelled Suyos'
                          : 'Archived Suyos'}
                </Text>
                <Text style={styles.mySuyoSubBarSubtitle}>
                  {mySuyoNavTab === 'posted'
                    ? 'Awaiting courier acceptance · Boost reward to speed up'
                    : mySuyoNavTab === 'accepted'
                      ? 'Couriers currently fulfilling these suyos'
                      : mySuyoNavTab === 'completed'
                        ? 'Successfully fulfilled suyos from past to present'
                        : mySuyoNavTab === 'cancelled'
                          ? 'Tap Edit to delete unwanted cancelled suyos'
                          : 'Saved templates for quick 1-tap repeating'}
                </Text>
              </View>

              {/* REMOVE Edit feature from accepted, completed, AND posted! Allow on cancelled nav to delete unwanted suyos */}
              {(mySuyoNavTab === 'cancelled' || mySuyoNavTab === 'archived') &&
                (mySuyoNavTab === 'cancelled' ? cancelledSuyos : archivedSuyos)
                  .length > 0 && (
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 12,
                    }}
                  >
                    {isMySuyoEditMode && (
                      <TouchableOpacity
                        onPress={() => {
                          const currentList =
                            mySuyoNavTab === 'cancelled'
                              ? cancelledSuyos
                              : archivedSuyos;
                          if (
                            selectedMySuyoIdsToDelete.length ===
                            currentList.length
                          ) {
                            setSelectedMySuyoIdsToDelete([]);
                          } else {
                            setSelectedMySuyoIdsToDelete(
                              currentList.map((item) => item.id),
                            );
                          }
                        }}
                        hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                      >
                        <Text style={styles.mySuyoSelectAllText}>
                          {selectedMySuyoIdsToDelete.length ===
                          (mySuyoNavTab === 'cancelled'
                            ? cancelledSuyos
                            : archivedSuyos
                          ).length
                            ? 'Deselect all'
                            : 'Select all'}
                        </Text>
                      </TouchableOpacity>
                    )}

                    <TouchableOpacity
                      onPress={() => {
                        setIsMySuyoEditMode((prev) => !prev);
                        setSelectedMySuyoIdsToDelete([]);
                      }}
                      activeOpacity={0.6}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Text style={styles.mySuyoFadingEditText}>
                        {isMySuyoEditMode ? 'Cancel' : 'Edit'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
            </View>

            {/* List of Suyos (Rendered based on selected tab) */}
            <View style={styles.mySuyoCardsList}>
              {(() => {
                const currentList =
                  mySuyoNavTab === 'posted'
                    ? postedSuyos
                    : mySuyoNavTab === 'accepted'
                      ? acceptedSuyos
                      : mySuyoNavTab === 'completed'
                        ? completedSuyos
                        : mySuyoNavTab === 'cancelled'
                          ? cancelledSuyos
                          : archivedSuyos;

                if (currentList.length === 0) {
                  return (
                    <View style={styles.mySuyoEmptyBox}>
                      <Ionicons
                        name={
                          mySuyoNavTab === 'posted'
                            ? 'paper-plane-outline'
                            : mySuyoNavTab === 'accepted'
                              ? 'bicycle-outline'
                              : mySuyoNavTab === 'completed'
                                ? 'ribbon-outline'
                                : mySuyoNavTab === 'cancelled'
                                  ? 'close-circle-outline'
                                  : 'bookmark-outline'
                        }
                        size={40}
                        color="#A3B8AC"
                      />
                      <Text style={styles.mySuyoEmptyTitle}>
                        {mySuyoNavTab === 'posted'
                          ? 'No pending posted suyos'
                          : mySuyoNavTab === 'accepted'
                            ? 'No suyos in progress'
                            : mySuyoNavTab === 'completed'
                              ? 'No completed suyos yet'
                              : mySuyoNavTab === 'cancelled'
                                ? 'No cancelled suyos'
                                : 'No archived templates'}
                      </Text>
                      <Text style={styles.mySuyoEmptySub}>
                        {mySuyoNavTab === 'posted'
                          ? "All your suyos have been accepted, or you haven't posted any. Tap Post below to request a suyo!"
                          : mySuyoNavTab === 'accepted'
                            ? 'When a courier accepts one of your posted suyos, it will appear here so you can view the doer profile and track live progress.'
                            : mySuyoNavTab === 'completed'
                              ? 'Finished suyos will appear here with the courier who completed them.'
                              : mySuyoNavTab === 'cancelled'
                                ? 'You have not cancelled any of your requested suyos.'
                                : 'Save completed or frequent suyos to your archive so you can repeat them with a single tap!'}
                      </Text>
                    </View>
                  );
                }

                return currentList.map((suyo) => {
                  const isSelected = selectedMySuyoIdsToDelete.includes(
                    suyo.id,
                  );
                  return (
                    <TouchableOpacity
                      key={suyo.id}
                      style={[
                        styles.mySuyoCardItem,
                        isMySuyoEditMode &&
                          isSelected &&
                          styles.mySuyoCardItemSelected,
                      ]}
                      activeOpacity={0.88}
                      onPress={() => {
                        if (isMySuyoEditMode) {
                          handleToggleMySuyoSelect(suyo.id);
                        } else {
                          handleOpenSuyoDetail(suyo, mySuyoNavTab);
                        }
                      }}
                    >
                      {/* Top Row: Title + Reward (Green Pxxx) */}
                      <View style={styles.mySuyoCardTopRow}>
                        <View
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            flex: 1,
                            paddingRight: 10,
                          }}
                        >
                          {isMySuyoEditMode && (
                            <View
                              style={[
                                styles.mySuyoSelectionCircle,
                                isSelected &&
                                  styles.mySuyoSelectionCircleSelected,
                              ]}
                            >
                              {isSelected && (
                                <Ionicons
                                  name="checkmark"
                                  size={11}
                                  color="#FFFFFF"
                                />
                              )}
                            </View>
                          )}
                          <Text
                            style={styles.mySuyoCardTitle}
                            numberOfLines={1}
                          >
                            {suyo.title}
                          </Text>
                        </View>
                        <Text style={styles.mySuyoCardRewardText}>
                          {suyo.reward}
                        </Text>
                      </View>

                      {/* Second Row: Status & Date (Image 2 style - clean colored text, no stretched highlight) */}
                      <View style={styles.mySuyoCardSubRow}>
                        <Text
                          style={[
                            styles.mySuyoCardStatusText,
                            suyo.status === 'Cancelled'
                              ? { color: '#DC2626' }
                              : suyo.status?.includes('Completed')
                                ? { color: '#15803D' }
                                : suyo.status?.includes('In Progress')
                                  ? { color: '#0284C7' }
                                  : suyo.status === 'Archived Template'
                                    ? { color: '#64748B' }
                                    : { color: '#0369A1' },
                          ]}
                        >
                          {suyo.status}
                        </Text>
                        <Text style={styles.mySuyoCardDateDot}>·</Text>
                        <Text style={styles.mySuyoCardDateText}>
                          {suyo.formattedDate || 'Recent'}
                        </Text>
                      </View>

                      {/* Tab-Specific Feature Rows */}

                      {/* In Posted: Boost Prompt if waiting long */}
                      {mySuyoNavTab === 'posted' &&
                        suyo.needsBoost &&
                        !isMySuyoEditMode &&
                        suyo.status !== 'Cancelled' && (
                          <View style={styles.mySuyoCardBoostRow}>
                            <View
                              style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                gap: 5,
                                flex: 1,
                              }}
                            >
                              <Ionicons
                                name="sparkles"
                                size={13}
                                color="#059669"
                              />
                              <Text style={styles.mySuyoCardBoostPromptText}>
                                No doer yet? Boost reward
                              </Text>
                            </View>
                            <View style={{ flexDirection: 'row', gap: 6 }}>
                              <TouchableOpacity
                                style={styles.mySuyoCardQuickBoostBtn}
                                activeOpacity={0.75}
                                onPress={(e) => {
                                  e.stopPropagation();
                                  handleBoostReward(suyo.id, 20);
                                }}
                              >
                                <Text style={styles.mySuyoCardQuickBoostText}>
                                  +₱20
                                </Text>
                              </TouchableOpacity>
                              <TouchableOpacity
                                style={[
                                  styles.mySuyoCardQuickBoostBtn,
                                  styles.mySuyoCardQuickBoostBtnGreen,
                                ]}
                                activeOpacity={0.75}
                                onPress={(e) => {
                                  e.stopPropagation();
                                  handleBoostReward(suyo.id, 50);
                                }}
                              >
                                <Text
                                  style={[
                                    styles.mySuyoCardQuickBoostText,
                                    { color: '#FFFFFF' },
                                  ]}
                                >
                                  +₱50
                                </Text>
                              </TouchableOpacity>
                            </View>
                          </View>
                        )}

                      {/* In Accepted: Courier Strip */}
                      {mySuyoNavTab === 'accepted' && suyo.doer && (
                        <View style={styles.mySuyoCourierStrip}>
                          <Text
                            style={styles.mySuyoCourierStripText}
                            numberOfLines={1}
                          >
                            Courier:{' '}
                            <Text
                              style={{ fontWeight: '700', color: '#163523' }}
                            >
                              {suyo.doer.name}
                            </Text>{' '}
                            ({suyo.doer.rating})
                          </Text>
                        </View>
                      )}

                      {/* In Completed: Courier Who Fulfilled Strip */}
                      {mySuyoNavTab === 'completed' && suyo.doer && (
                        <View style={styles.mySuyoCourierStrip}>
                          <Text
                            style={styles.mySuyoCourierStripText}
                            numberOfLines={1}
                          >
                            Fulfilled by{' '}
                            <Text
                              style={{ fontWeight: '700', color: '#163523' }}
                            >
                              {suyo.doer.name}
                            </Text>{' '}
                            ({suyo.doer.rating})
                          </Text>
                        </View>
                      )}

                      {/* Footer Row: Location Pin */}
                      <View style={styles.mySuyoCardFooter}>
                        <View style={styles.mySuyoCardLocationRow}>
                          <Ionicons
                            name="location-sharp"
                            size={13}
                            color="#0D9488"
                          />
                          <Text
                            style={styles.mySuyoCardLocationText}
                            numberOfLines={1}
                          >
                            {suyo.location}
                          </Text>
                        </View>

                        <Text style={styles.mySuyoTapDetailHint}>
                          Tap for options →
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                });
              })()}
            </View>

            {/* Bottom Edit Action Bar when in Edit Mode */}
            {isMySuyoEditMode && (
              <View style={styles.mySuyoEditFloatingBar}>
                <TouchableOpacity
                  style={styles.mySuyoCancelEditBtn}
                  onPress={() => {
                    setIsMySuyoEditMode(false);
                    setSelectedMySuyoIdsToDelete([]);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.mySuyoCancelEditText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.mySuyoConfirmDeleteBtn,
                    selectedMySuyoIdsToDelete.length === 0 &&
                      styles.mySuyoConfirmDeleteBtnDisabled,
                  ]}
                  onPress={handleConfirmDeleteMySuyo}
                  disabled={selectedMySuyoIdsToDelete.length === 0}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name="trash-outline"
                    size={14}
                    color={
                      selectedMySuyoIdsToDelete.length > 0
                        ? '#FFFFFF'
                        : '#8CA395'
                    }
                  />
                  <Text
                    style={[
                      styles.mySuyoConfirmDeleteBtnText,
                      selectedMySuyoIdsToDelete.length === 0 &&
                        styles.mySuyoConfirmDeleteBtnTextDisabled,
                    ]}
                  >
                    {selectedMySuyoIdsToDelete.length > 0
                      ? `Remove Selected (${selectedMySuyoIdsToDelete.length})`
                      : 'Select items to remove'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* === DOER SUYO HUB SCREEN (SUYOS DONE AS A DOER) === */}
        {activeTab === 'doer' && (
          <View style={styles.doerMainWrapper}>
            {/* 1. Hero Banner - Placed and styled identically to MySuyo screen */}
            <View style={styles.mySuyoHeroSection}>
              <View style={styles.mySuyoHeroTextCol}>
                <Text style={styles.mySuyoHeroSuper}>DOER SUYO HUB</Text>
                <Text style={styles.mySuyoHeroTitle}>Suyos Done as Doer</Text>
                <Text style={styles.mySuyoHeroSub}>
                  Manage active accepted suyos and review your completed history
                </Text>
              </View>
              <View style={styles.mySuyoHeroBadge}>
                <Ionicons
                  name="bicycle-outline"
                  size={24}
                  color="#1C3A27"
                />
              </View>
            </View>

            {/* 2. Modern Text Navigation: Accepted, Completed, Cancelled (Identical to MySuyo screen) */}
            <View style={styles.mySuyoTextNavWrapper}>
              <View style={styles.mySuyoTextNavRow}>
                {/* Accepted Tab */}
                <TouchableOpacity
                  style={styles.mySuyoTextNavItem}
                  activeOpacity={0.7}
                  onPress={() => {
                    setDoerNavTab('accepted');
                    setIsDoerCancelledEditMode(false);
                    setSelectedDoerCancelledIds([]);
                  }}
                >
                  <Text
                    style={[
                      styles.mySuyoTextNavTitle,
                      doerNavTab === 'accepted' &&
                        styles.mySuyoTextNavTitleActive,
                    ]}
                  >
                    Accepted
                  </Text>
                  <Text
                    style={[
                      styles.mySuyoTextNavCount,
                      doerNavTab === 'accepted' &&
                        styles.mySuyoTextNavCountActive,
                    ]}
                  >
                    ({doerAcceptedSuyos.length})
                  </Text>
                  {doerNavTab === 'accepted' && (
                    <View style={styles.mySuyoTextNavUnderline} />
                  )}
                </TouchableOpacity>

                {/* Completed Tab */}
                <TouchableOpacity
                  style={styles.mySuyoTextNavItem}
                  activeOpacity={0.7}
                  onPress={() => {
                    setDoerNavTab('completed');
                    setIsDoerCancelledEditMode(false);
                    setSelectedDoerCancelledIds([]);
                  }}
                >
                  <Text
                    style={[
                      styles.mySuyoTextNavTitle,
                      doerNavTab === 'completed' &&
                        styles.mySuyoTextNavTitleActive,
                    ]}
                  >
                    Completed
                  </Text>
                  <Text
                    style={[
                      styles.mySuyoTextNavCount,
                      doerNavTab === 'completed' &&
                        styles.mySuyoTextNavCountActive,
                    ]}
                  >
                    ({doerCompletedSuyos.length})
                  </Text>
                  {doerNavTab === 'completed' && (
                    <View style={styles.mySuyoTextNavUnderline} />
                  )}
                </TouchableOpacity>

                {/* Cancelled Tab */}
                <TouchableOpacity
                  style={styles.mySuyoTextNavItem}
                  activeOpacity={0.7}
                  onPress={() => {
                    setDoerNavTab('cancelled');
                    setIsDoerCancelledEditMode(false);
                    setSelectedDoerCancelledIds([]);
                  }}
                >
                  <Text
                    style={[
                      styles.mySuyoTextNavTitle,
                      doerNavTab === 'cancelled' &&
                        styles.mySuyoTextNavTitleActive,
                    ]}
                  >
                    Cancelled
                  </Text>
                  <Text
                    style={[
                      styles.mySuyoTextNavCount,
                      doerNavTab === 'cancelled' &&
                        styles.mySuyoTextNavCountActive,
                    ]}
                  >
                    ({doerCancelledSuyos.length})
                  </Text>
                  {doerNavTab === 'cancelled' && (
                    <View style={styles.mySuyoTextNavUnderline} />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* 3. Sub-bar: Title & Subtitle on Left, Edit feature on Right (for Cancelled tab only, matching sample) */}
            <View style={styles.mySuyoSubBar}>
              {/* Title & subtitle on the left side */}
              <View style={{ flex: 1, paddingRight: 8 }}>
                <Text style={styles.mySuyoSubBarTitle}>
                  {doerNavTab === 'accepted'
                    ? 'Accepted Suyos'
                    : doerNavTab === 'completed'
                      ? 'Completed Suyos'
                      : 'Cancelled Suyos'}
                </Text>
                <Text style={styles.mySuyoSubBarSubtitle}>
                  {doerNavTab === 'accepted'
                    ? 'Couriers currently fulfilling these suyos'
                    : doerNavTab === 'completed'
                      ? 'Successfully fulfilled suyos history'
                      : 'Tap Edit to delete unwanted cancelled suyos'}
                </Text>
              </View>

              {/* Edit feature placed on the RIGHT side - ONLY for Cancelled tab */}
              {doerNavTab === 'cancelled' && doerCancelledSuyos.length > 0 && (
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 12,
                  }}
                >
                  {isDoerCancelledEditMode && (
                    <TouchableOpacity
                      onPress={() => {
                        if (
                          selectedDoerCancelledIds.length ===
                          doerCancelledSuyos.length
                        ) {
                          setSelectedDoerCancelledIds([]);
                        } else {
                          setSelectedDoerCancelledIds(
                            doerCancelledSuyos.map((item) => item.id),
                          );
                        }
                      }}
                      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                    >
                      <Text style={styles.mySuyoSelectAllText}>
                        {selectedDoerCancelledIds.length ===
                        doerCancelledSuyos.length
                          ? 'Deselect all'
                          : 'Select all'}
                      </Text>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity
                    onPress={() => {
                      setIsDoerCancelledEditMode((prev) => !prev);
                      setSelectedDoerCancelledIds([]);
                    }}
                    activeOpacity={0.6}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Text style={styles.mySuyoFadingEditText}>
                      {isDoerCancelledEditMode ? 'Cancel' : 'Edit'}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* 3. Tab Content */}
            {/* --- TAB A: ACCEPTED SUYOS (With Cancel as Doer!) --- */}
            {doerNavTab === 'accepted' && (
              <View style={styles.doerListContainer}>
                {doerAcceptedSuyos.length === 0 ? (
                  <View style={styles.doerEmptyCard}>
                    <View style={styles.doerEmptyIconCircle}>
                      <Ionicons
                        name="bicycle-outline"
                        size={28}
                        color="#8CA395"
                      />
                    </View>
                    <Text style={styles.doerEmptyTitle}>
                      No Active Accepted Suyos
                    </Text>
                    <Text style={styles.doerEmptySub}>
                      Browse the public dashboard to accept and fulfill
                      available suyos from nearby requesters.
                    </Text>
                    <TouchableOpacity
                      style={styles.doerBrowseBtn}
                      activeOpacity={0.8}
                      onPress={() => setActiveTab('home')}
                    >
                      <Ionicons
                        name="search"
                        size={15}
                        color="#FFFFFF"
                      />
                      <Text style={styles.doerBrowseBtnText}>
                        Browse Available Suyos
                      </Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <>
                    <View style={styles.doerInfoCallout}>
                      <Ionicons
                        name="information-circle-outline"
                        size={16}
                        color="#059669"
                      />
                      <Text style={styles.doerInfoCalloutText}>
                        You are assigned as the doer. You can proceed to
                        fulfillment or cancel if unable to complete.
                      </Text>
                    </View>

                    {doerAcceptedSuyos.map((suyo) => (
                      <TouchableOpacity
                        key={suyo.id}
                        style={styles.doerAcceptedCard}
                        activeOpacity={0.88}
                        onPress={() => setSelectedDoerSuyo(suyo)}
                      >
                        {/* Top row: Category tag & Reward */}
                        <View style={styles.doerCardTopRow}>
                          <View style={styles.doerCategoryChip}>
                            <Ionicons
                              name={suyo.icon || 'receipt'}
                              size={13}
                              color="#1E4D2B"
                            />
                            <Text style={styles.doerCategoryChipText}>
                              {suyo.category}
                            </Text>
                          </View>
                          <View style={styles.doerRewardBadge}>
                            <Text style={styles.doerRewardText}>
                              +{suyo.reward}
                            </Text>
                          </View>
                        </View>

                        {/* Title */}
                        <Text style={styles.doerCardTitle}>{suyo.title}</Text>

                        {/* Requester Info */}
                        <View style={styles.doerRequesterRow}>
                          <Ionicons
                            name="person-circle-outline"
                            size={15}
                            color="#557261"
                          />
                          <Text style={styles.doerRequesterText}>
                            Requester:{' '}
                            <Text
                              style={{ fontWeight: '700', color: '#163523' }}
                            >
                              {suyo.requesterName}
                            </Text>
                          </Text>
                          {suyo.requesterPhone && (
                            <TouchableOpacity
                              style={styles.doerCallMiniBtn}
                              activeOpacity={0.7}
                              onPress={(e) => {
                                e?.stopPropagation?.();
                                Linking.openURL(`tel:${suyo.requesterPhone}`);
                              }}
                            >
                              <Ionicons
                                name="call"
                                size={11}
                                color="#059669"
                              />
                              <Text style={styles.doerCallMiniBtnText}>
                                Call
                              </Text>
                            </TouchableOpacity>
                          )}
                        </View>

                        {/* Location & Time */}
                        <View style={styles.doerLocationRow}>
                          <Ionicons
                            name="location-outline"
                            size={14}
                            color="#8CA395"
                          />
                          <Text
                            style={styles.doerLocationText}
                            numberOfLines={1}
                          >
                            {suyo.location}
                          </Text>
                          <Text style={styles.doerDot}>•</Text>
                          <Ionicons
                            name="time-outline"
                            size={14}
                            color="#8CA395"
                          />
                          <Text style={styles.doerDeadlineText}>
                            {suyo.deadline}
                          </Text>
                        </View>

                        {/* Tap hint */}
                        <View style={styles.doerTapDetailsHintRow}>
                          <Ionicons
                            name="information-circle-outline"
                            size={12}
                            color="#059669"
                          />
                          <Text style={styles.doerTapDetailsHintText}>
                            Tap tile to view details & requester profile
                          </Text>
                          <Ionicons
                            name="chevron-forward"
                            size={12}
                            color="#059669"
                          />
                        </View>

                        {/* Action Buttons: Continue Suyo & Cancel as Doer */}
                        <View style={styles.doerCardActionRow}>
                          <TouchableOpacity
                            style={styles.doerContinueBtn}
                            activeOpacity={0.8}
                            onPress={(e) => {
                              e?.stopPropagation?.();
                              router.push({
                                pathname: '/fulfill',
                                params: {
                                  id: suyo.id,
                                  title: suyo.title,
                                  category: suyo.category,
                                  location: suyo.location,
                                  distanceText: suyo.distanceText,
                                  reward: suyo.reward,
                                  requesterName: suyo.requesterName,
                                  requesterPhone: suyo.requesterPhone,
                                  details: suyo.details,
                                },
                              });
                            }}
                          >
                            <Ionicons
                              name="bicycle"
                              size={15}
                              color="#FFFFFF"
                            />
                            <Text style={styles.doerContinueBtnText}>
                              Continue Suyo
                            </Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={styles.doerCancelBtn}
                            activeOpacity={0.75}
                            onPress={(e) => {
                              e?.stopPropagation?.();
                              setDoerCancelModalItem(suyo);
                            }}
                          >
                            <Ionicons
                              name="close-circle-outline"
                              size={15}
                              color="#DC2626"
                            />
                            <Text style={styles.doerCancelBtnText}>
                              Cancel as Doer
                            </Text>
                          </TouchableOpacity>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </>
                )}
              </View>
            )}

            {/* --- TAB B: COMPLETED SUYOS (Doer Completed History) --- */}
            {doerNavTab === 'completed' && (
              <View style={styles.doerListContainer}>
                {doerCompletedSuyos.length === 0 ? (
                  <View style={styles.doerEmptyCard}>
                    <View style={styles.doerEmptyIconCircle}>
                      <Ionicons
                        name="checkmark-done"
                        size={28}
                        color="#059669"
                      />
                    </View>
                    <Text style={styles.doerEmptyTitle}>
                      No Completed Suyos Yet
                    </Text>
                    <Text style={styles.doerEmptySub}>
                      Fulfill suyos as a doer to see your completed history and
                      earned rewards.
                    </Text>
                  </View>
                ) : (
                  doerCompletedSuyos.map((item) => (
                    <TouchableOpacity
                      key={item.id}
                      style={styles.doerCompletedCard}
                      activeOpacity={0.88}
                      onPress={() => setSelectedDoerSuyo(item)}
                    >
                      <View style={styles.doerCompletedLeft}>
                        <View style={styles.doerCompletedIconCircle}>
                          <Ionicons
                            name={item.icon || 'checkmark-done'}
                            size={18}
                            color="#059669"
                          />
                        </View>
                        <View style={styles.doerCompletedTextCol}>
                          <Text
                            style={styles.doerCompletedTitle}
                            numberOfLines={1}
                          >
                            {item.title}
                          </Text>
                          <Text style={styles.doerCompletedRequester}>
                            From: {item.requesterName}
                          </Text>
                          <View style={styles.doerCompletedMetaRow}>
                            <Ionicons
                              name="time-outline"
                              size={12}
                              color="#8CA395"
                            />
                            <Text style={styles.doerCompletedDate}>
                              {item.date}
                            </Text>
                            <Text style={styles.doerDot}>•</Text>
                            <Text
                              style={styles.doerCompletedLocation}
                              numberOfLines={1}
                            >
                              {item.location}
                            </Text>
                          </View>
                        </View>
                      </View>

                      <View style={styles.doerCompletedRight}>
                        <Text style={styles.doerCompletedEarned}>
                          +₱{Number(item.earnedAmount).toFixed(2)}
                        </Text>
                        <View style={styles.doerCompletedRatingBadge}>
                          <Ionicons
                            name="star"
                            size={10}
                            color="#F59E0B"
                          />
                          <Text style={styles.doerCompletedRatingText}>
                            5.0★
                          </Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  ))
                )}
              </View>
            )}

            {/* --- TAB C: CANCELLED SUYOS --- */}
            {doerNavTab === 'cancelled' && (
              <View style={styles.doerListContainer}>
                {doerCancelledSuyos.length === 0 ? (
                  <View style={styles.doerEmptyCard}>
                    <View style={styles.doerEmptyIconCircle}>
                      <Ionicons
                        name="shield-checkmark-outline"
                        size={28}
                        color="#059669"
                      />
                    </View>
                    <Text style={styles.doerEmptyTitle}>
                      No Cancelled Suyos
                    </Text>
                    <Text style={styles.doerEmptySub}>
                      Your completion rate is high! You have not cancelled any
                      accepted suyos.
                    </Text>
                  </View>
                ) : (
                  doerCancelledSuyos.map((item) => {
                    const isSelected = selectedDoerCancelledIds.includes(
                      item.id,
                    );
                    return (
                      <TouchableOpacity
                        key={item.id}
                        style={[
                          styles.doerCancelledCard,
                          isDoerCancelledEditMode &&
                            isSelected &&
                            styles.mySuyoCardItemSelected,
                        ]}
                        activeOpacity={0.88}
                        onPress={() => {
                          if (isDoerCancelledEditMode) {
                            handleToggleDoerCancelledSelect(item.id);
                          } else {
                            setSelectedDoerSuyo(item);
                          }
                        }}
                      >
                        <View style={styles.doerCancelledTopRow}>
                          <Text
                            style={styles.doerCancelledTitle}
                            numberOfLines={1}
                          >
                            {item.title}
                          </Text>
                          <View
                            style={{
                              flexDirection: 'row',
                              alignItems: 'center',
                              gap: 8,
                            }}
                          >
                            <View style={styles.doerCancelledBadge}>
                              <Text style={styles.doerCancelledBadgeText}>
                                Cancelled
                              </Text>
                            </View>
                            {isDoerCancelledEditMode && (
                              <View
                                style={[
                                  styles.mySuyoSelectionCircle,
                                  isSelected &&
                                    styles.mySuyoSelectionCircleSelected,
                                ]}
                              >
                                {isSelected && (
                                  <Ionicons
                                    name="checkmark"
                                    size={11}
                                    color="#FFFFFF"
                                  />
                                )}
                              </View>
                            )}
                          </View>
                        </View>
                        <Text style={styles.doerCancelledSub}>
                          Requester: {item.requesterName} •{' '}
                          {item.cancelledAt || 'Recently'}
                        </Text>
                        <View style={styles.doerCancelledNotice}>
                          <Ionicons
                            name="return-up-back"
                            size={13}
                            color="#6B7280"
                          />
                          <Text style={styles.doerCancelledNoticeText}>
                            Released back to public board for other couriers.
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })
                )}

                {/* Bottom Edit Action Bar when in Edit Mode */}
                {isDoerCancelledEditMode && (
                  <View style={styles.mySuyoEditFloatingBar}>
                    <TouchableOpacity
                      style={styles.mySuyoCancelEditBtn}
                      onPress={() => {
                        setIsDoerCancelledEditMode(false);
                        setSelectedDoerCancelledIds([]);
                      }}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.mySuyoCancelEditText}>Cancel</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.mySuyoConfirmDeleteBtn,
                        selectedDoerCancelledIds.length === 0 &&
                          styles.mySuyoConfirmDeleteBtnDisabled,
                      ]}
                      onPress={handleConfirmDeleteDoerCancelled}
                      disabled={selectedDoerCancelledIds.length === 0}
                      activeOpacity={0.8}
                    >
                      <Ionicons
                        name="trash-outline"
                        size={14}
                        color={
                          selectedDoerCancelledIds.length > 0
                            ? '#FFFFFF'
                            : '#8CA395'
                        }
                      />
                      <Text
                        style={[
                          styles.mySuyoConfirmDeleteBtnText,
                          selectedDoerCancelledIds.length === 0 &&
                            styles.mySuyoConfirmDeleteBtnTextDisabled,
                        ]}
                      >
                        {selectedDoerCancelledIds.length > 0
                          ? `Remove Selected (${selectedDoerCancelledIds.length})`
                          : 'Select items to remove'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}
          </View>
        )}

        {/* === WALLET SCREEN (ACCEPTED SUYO EARNINGS LIST) === */}
        {(activeTab === 'wallet' || activeTab === 'activity') && (
          <View style={styles.walletMainWrapper}>
            {/* Top Back Nav when opened from Sidebar */}
            <TouchableOpacity
              style={styles.walletReturnHeaderBtn}
              activeOpacity={0.75}
              onPress={() => setActiveTab('home')}
            >
              <Ionicons
                name="arrow-back"
                size={16}
                color="#1E4D2B"
              />
              <Text style={styles.walletReturnHeaderText}>
                Back to Dashboard
              </Text>
            </TouchableOpacity>

            {/* 1. Wallet Balance Hero Header */}
            <View style={styles.walletHeroCard}>
              <View style={styles.walletHeroTopRow}>
                <View style={styles.walletBadgeRow}>
                  <View style={styles.walletIconCircle}>
                    <Ionicons
                      name="wallet"
                      size={17}
                      color="#1E4D2B"
                    />
                  </View>
                  <Text style={styles.walletHeroSuper}>SUYOLINK WALLET</Text>
                </View>
                <View style={styles.walletVerifiedPill}>
                  <Ionicons
                    name="checkmark-circle"
                    size={13}
                    color="#059669"
                  />
                  <Text style={styles.walletVerifiedPillText}>
                    Verified User
                  </Text>
                </View>
              </View>

              <Text style={styles.walletBalanceLabel}>
                Today's Earnings - {todayDateFormatted}
              </Text>
              <Text style={styles.walletBalanceAmount}>
                ₱{todayEarningsSum.toFixed(2)}
              </Text>

              <View style={styles.walletSummaryRow}>
                <View style={styles.walletSummaryItem}>
                  <Text style={styles.walletSummaryCount}>
                    {todaySuyosCount} Suyos
                  </Text>
                  <Text style={styles.walletSummaryLabel}>Today's Suyos</Text>
                </View>
                <View style={styles.walletSummaryDivider} />
                <View style={styles.walletSummaryItem}>
                  <Text style={styles.walletSummaryCount}>
                    {monthlySuyosCount} Suyos
                  </Text>
                  <Text style={styles.walletSummaryLabel}>Monthly Suyos</Text>
                </View>
                <View style={styles.walletSummaryDivider} />
                <View style={styles.walletSummaryItem}>
                  <Text style={styles.walletSummaryCount}>
                    {overallSuyosCount} Suyos
                  </Text>
                  <Text style={styles.walletSummaryLabel}>
                    Overall Completed
                  </Text>
                </View>
              </View>

              {/* Literal Modern Graphical Line Graph */}
              <WalletIncomeLineGraph
                transactions={providerTransactions}
                totalOverride={displayWalletTotal}
                hasTransactions={providerTransactions.length > 0}
              />

              {/* Informative Note: Direct Settlement Outside App */}
              <View style={styles.walletPaymentNoticeRow}>
                <Ionicons
                  name="call"
                  size={13}
                  color="#059669"
                />
                <Text style={styles.walletPaymentNoticeText}>
                  Payments are received directly via call & conversation with
                  requesters outside the app.
                </Text>
              </View>
            </View>

            {/* 2. Section Header: Just the Lists */}
            <View style={styles.walletSectionHeader}>
              <View>
                <Text style={styles.walletSectionTitle}>
                  Accepted Suyo Earnings
                </Text>
                <Text style={styles.walletSectionSub}>
                  Tracked rewards earned from every accepted suyo request
                </Text>
              </View>
              <View style={styles.walletCountChip}>
                <Text style={styles.walletCountChipText}>
                  {dynamicWalletList.length} earned ({displayWalletTotal})
                </Text>
              </View>
            </View>

            {/* 3. The Clean List of Earned Accepted Suyo Requests */}
            <View style={styles.walletListWrapper}>
              {dynamicWalletList.length === 0 ? (
                <View style={styles.doerEmptyCard}>
                  <View style={styles.doerEmptyIconCircle}>
                    <Ionicons
                      name="wallet-outline"
                      size={28}
                      color="#1E4D2B"
                    />
                  </View>
                  <Text style={styles.doerEmptyTitle}>
                    No Suyo Earnings Yet
                  </Text>
                  <Text style={styles.doerEmptySub}>
                    When you accept and complete suyos for others, your settled
                    earnings and receipts will appear here.
                  </Text>
                </View>
              ) : (
                dynamicWalletList.map((item) => (
                  <View
                    key={item.id}
                    style={styles.walletItemCard}
                  >
                    <View style={styles.walletItemLeft}>
                      <View
                        style={[
                          styles.walletCategoryIconCircle,
                          item.category === 'Groceries'
                            ? { backgroundColor: '#DCFCE7' }
                            : item.category === 'Medicine'
                              ? { backgroundColor: '#F3E8FF' }
                              : item.category === 'Documents'
                                ? { backgroundColor: '#E0F2FE' }
                                : item.category === 'Queuing & Bills'
                                  ? { backgroundColor: '#FEF3C7' }
                                  : { backgroundColor: '#EAF4EF' },
                        ]}
                      >
                        <Ionicons
                          name={item.icon || 'receipt'}
                          size={18}
                          color={
                            item.category === 'Groceries'
                              ? '#15803D'
                              : item.category === 'Medicine'
                                ? '#7E22CE'
                                : item.category === 'Documents'
                                  ? '#0369A1'
                                  : item.category === 'Queuing & Bills'
                                    ? '#B45309'
                                    : '#1E4D2B'
                          }
                        />
                      </View>

                      <View style={styles.walletItemInfoCol}>
                        <Text
                          style={styles.walletItemTitle}
                          numberOfLines={1}
                        >
                          {item.title}
                        </Text>

                        <View style={styles.walletItemMetaRow}>
                          <Ionicons
                            name="person-circle-outline"
                            size={13}
                            color="#557261"
                          />
                          <Text style={styles.walletItemRequesterText}>
                            From:{' '}
                            <Text
                              style={{ fontWeight: '700', color: '#163523' }}
                            >
                              {item.requesterName}
                            </Text>
                          </Text>
                        </View>

                        <View style={styles.walletItemDateRow}>
                          <Ionicons
                            name="time-outline"
                            size={12}
                            color="#8CA395"
                          />
                          <Text style={styles.walletItemDateText}>
                            {item.date}
                          </Text>
                          <Text style={styles.walletItemDot}>•</Text>
                          <Ionicons
                            name="location-outline"
                            size={12}
                            color="#8CA395"
                          />
                          <Text
                            style={styles.walletItemLocationText}
                            numberOfLines={1}
                          >
                            {item.location}
                          </Text>
                        </View>
                      </View>
                    </View>

                    <View style={styles.walletItemRight}>
                      <Text style={styles.walletEarnedAmountText}>
                        +₱{Number(item.earnedAmount).toFixed(2)}
                      </Text>
                      <View style={styles.walletStatusChip}>
                        <Ionicons
                          name="checkmark-circle"
                          size={10}
                          color="#15803D"
                        />
                        <Text style={styles.walletStatusChipText}>
                          {item.status}
                        </Text>
                      </View>
                    </View>
                  </View>
                ))
              )}
            </View>
          </View>
        )}
      </ScrollView>

      {/* ========================================================== */}
      {/* 3. POPPING MODAL: FLOATING ACTIVE SUYO PROGRESS CARD        */}
      {/* (Floats directly above navigation bar, persists on scroll)  */}
      {/* ========================================================== */}
      {hasActiveSuyo && (
        <View
          style={[
            styles.floatingActiveModalWrapper,
            { bottom: 62 + bottomInset },
            Platform.OS === 'web' ? { pointerEvents: 'box-none' } : undefined,
          ]}
          pointerEvents={Platform.OS === 'web' ? undefined : 'box-none'}
        >
          <TouchableOpacity
            style={styles.floatingActiveModalTouchable}
            activeOpacity={0.92}
            onPress={() => router.push('/requester-fulfill')}
          >
            <LinearGradient
              colors={['#E5F4EC', '#F4FAF6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.floatingActiveModalGradient}
            >
              <View style={styles.floatingModalTopRow}>
                <View style={styles.floatingActiveBadge}>
                  <View style={styles.pulsingGreenDot} />
                  <Text style={styles.floatingActiveBadgeText}>
                    ACTIVE SUYO
                  </Text>
                </View>
                <View style={styles.floatingTrackingTag}>
                  <Ionicons
                    name="map-outline"
                    size={11.5}
                    color="#1E4D2B"
                    style={{ marginRight: 3 }}
                  />
                  <Text style={styles.floatingTrackingText}>
                    {activeSuyo.trackingNumber}
                  </Text>
                </View>
              </View>

              <View style={styles.floatingModalBodyRow}>
                <View style={{ flex: 1, paddingRight: 6 }}>
                  <Text
                    style={styles.floatingModalTitle}
                    numberOfLines={1}
                  >
                    {activeSuyo.eta}
                    <Text style={styles.floatingModalSub}>
                      {' '}
                      • {activeSuyo.detail}
                    </Text>
                  </Text>
                </View>
                <View style={styles.floatingModalChevronCircle}>
                  <Ionicons
                    name="chevron-forward"
                    size={13}
                    color="#1E4D2B"
                  />
                </View>
              </View>

              <View style={styles.floatingProgressTrack}>
                <View
                  style={[
                    styles.floatingProgressFill,
                    { width: activeSuyo.progress || '75%' },
                  ]}
                />
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}

      {/* 4. BOTTOM NAVIGATION BAR (Home, MySuyo, Post, Activity, Account) */}
      <View
        style={[
          styles.bottomNavContainer,
          {
            height: 60 + bottomInset,
            paddingBottom: bottomInset,
          },
        ]}
      >
        <TouchableOpacity
          style={styles.navItem}
          activeOpacity={0.7}
          onPress={() => setActiveTab('home')}
        >
          <Ionicons
            name={activeTab === 'home' ? 'home' : 'home-outline'}
            size={22}
            color={activeTab === 'home' ? '#1E4D2B' : '#8FA497'}
          />
          <Text
            style={[
              styles.navItemText,
              activeTab === 'home' && styles.navItemTextActive,
            ]}
          >
            Home
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          activeOpacity={0.7}
          onPress={() => setActiveTab('mysuyo')}
        >
          <Ionicons
            name={activeTab === 'mysuyo' ? 'receipt' : 'receipt-outline'}
            size={22}
            color={activeTab === 'mysuyo' ? '#1E4D2B' : '#8FA497'}
          />
          <Text
            style={[
              styles.navItemText,
              activeTab === 'mysuyo' && styles.navItemTextActive,
            ]}
          >
            MySuyo
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          activeOpacity={0.7}
          onPress={() => router.push('/post-suyo')}
        >
          <Ionicons
            name="add-circle"
            size={24}
            color="#1E4D2B"
          />
          <Text
            style={[
              styles.navItemText,
              { color: '#1E4D2B', fontWeight: '700' },
            ]}
          >
            Post
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          activeOpacity={0.7}
          onPress={() => setActiveTab('doer')}
        >
          <Ionicons
            name={activeTab === 'doer' ? 'bicycle' : 'bicycle-outline'}
            size={22}
            color={activeTab === 'doer' ? '#1E4D2B' : '#8FA497'}
          />
          <Text
            style={[
              styles.navItemText,
              activeTab === 'doer' && styles.navItemTextActive,
            ]}
          >
            Doer Suyo
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          activeOpacity={0.7}
          onPress={() => {
            router.push('/account');
          }}
        >
          <Ionicons
            name={activeTab === 'account' ? 'person' : 'person-outline'}
            size={22}
            color={activeTab === 'account' ? '#1E4D2B' : '#8FA497'}
          />
          <Text
            style={[
              styles.navItemText,
              activeTab === 'account' && styles.navItemTextActive,
            ]}
          >
            Account
          </Text>
        </TouchableOpacity>
      </View>

      {/* ========================================================== */}
      {/* 5. FILTER MODAL                                            */}
      {/* ========================================================== */}
      <Modal
        visible={isFilterModalOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsFilterModalOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.filterModalCard}>
            <View style={styles.modalHeaderRow}>
              <View
                style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}
              >
                <Ionicons
                  name="options-outline"
                  size={20}
                  color="#163523"
                />
                <Text style={styles.modalTitle}>Filter Suyos</Text>
              </View>
              <TouchableOpacity
                onPress={() => setIsFilterModalOpen(false)}
                style={styles.modalCloseButton}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="close"
                  size={20}
                  color="#163523"
                />
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              style={{ maxHeight: 420 }}
            >
              {/* Category Pills */}
              <Text style={styles.filterSectionLabel}>Category</Text>
              <View style={styles.filterPillsWrap}>
                {CATEGORY_OPTIONS.map((cat) => {
                  const isSelected = selectedCategory === cat;
                  const config =
                    cat === 'All'
                      ? CATEGORY_CONFIG.All
                      : CATEGORY_CONFIG.default;

                  if (isSelected) {
                    return (
                      <TouchableOpacity
                        key={cat}
                        activeOpacity={0.75}
                        onPress={() => setSelectedCategory(cat)}
                      >
                        <LinearGradient
                          colors={config.gradient}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                          style={[
                            styles.filterPillGradient,
                            { borderColor: config.border },
                          ]}
                        >
                          <Text
                            style={[
                              styles.filterPillText,
                              { color: config.text, fontWeight: '700' },
                            ]}
                          >
                            {cat}
                          </Text>
                        </LinearGradient>
                      </TouchableOpacity>
                    );
                  }

                  return (
                    <TouchableOpacity
                      key={cat}
                      style={styles.filterPill}
                      activeOpacity={0.75}
                      onPress={() => setSelectedCategory(cat)}
                    >
                      <Text style={styles.filterPillText}>{cat}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Urgency */}
              <Text style={styles.filterSectionLabel}>Urgency</Text>
              <View style={styles.filterPillsWrap}>
                {URGENCY_OPTIONS.map((urg) => {
                  const isSelected = selectedUrgency === urg;
                  const config = URGENCY_CONFIG[urg] || URGENCY_CONFIG.Normal;

                  if (isSelected) {
                    return (
                      <TouchableOpacity
                        key={urg}
                        activeOpacity={0.75}
                        onPress={() => setSelectedUrgency(urg)}
                      >
                        <LinearGradient
                          colors={config.gradient}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                          style={[
                            styles.filterPillGradient,
                            { borderColor: config.border },
                          ]}
                        >
                          <Text
                            style={[
                              styles.filterPillText,
                              { color: config.text, fontWeight: '700' },
                            ]}
                          >
                            {urg}
                          </Text>
                        </LinearGradient>
                      </TouchableOpacity>
                    );
                  }

                  return (
                    <TouchableOpacity
                      key={urg}
                      style={styles.filterPill}
                      activeOpacity={0.75}
                      onPress={() => setSelectedUrgency(urg)}
                    >
                      <Text style={styles.filterPillText}>{urg}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Distance Radius */}
              <Text style={styles.filterSectionLabel}>Distance Radius</Text>
              <View style={styles.distanceStepperContainer}>
                <TouchableOpacity
                  style={[
                    styles.distanceStepperArrowBtn,
                    currentDistanceKm === 'Any' &&
                      styles.distanceStepperArrowBtnDisabled,
                  ]}
                  activeOpacity={0.7}
                  onPress={handleDecreaseDistance}
                  disabled={currentDistanceKm === 'Any'}
                >
                  <Ionicons
                    name="chevron-back"
                    size={16}
                    color={currentDistanceKm === 'Any' ? '#B8CCC0' : '#1E4D2B'}
                  />
                </TouchableOpacity>

                <View style={styles.distanceStepperDisplay}>
                  <Text style={styles.distanceStepperValueText}>
                    {currentDistanceKm === 'Any'
                      ? 'Any distance'
                      : `${currentDistanceKm} km`}
                  </Text>
                  <Text style={styles.distanceStepperSubText}>
                    {currentDistanceKm === 'Any'
                      ? 'All suyos'
                      : `0 - ${currentDistanceKm} km`}
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.distanceStepperArrowBtn}
                  activeOpacity={0.7}
                  onPress={handleIncreaseDistance}
                >
                  <Ionicons
                    name="chevron-forward"
                    size={16}
                    color="#1E4D2B"
                  />
                </TouchableOpacity>
              </View>
            </ScrollView>

            <View style={styles.filterModalButtonsRow}>
              <TouchableOpacity
                style={styles.filterResetButton}
                onPress={handleResetModalFilters}
                activeOpacity={0.7}
              >
                <Text style={styles.filterResetButtonText}>Reset</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.filterApplyButton}
                onPress={() => setIsFilterModalOpen(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.filterApplyButtonText}>Apply filters</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ========================================================== */}
      {/* 6. SUYO DETAILS MODAL                                      */}
      {/* ========================================================== */}
      {/* ========================================================== */}
      {/* 6. SUYO DETAILS MODAL (CONTEXT-AWARE FOR REQUESTER & DOER) */}
      {/* ========================================================== */}
      {selectedSuyo && (
        <Modal
          visible={!!selectedSuyo}
          animationType="slide"
          transparent={true}
          onRequestClose={handleCloseDetailModal}
        >
          <View style={styles.modalBackdrop}>
            <View style={styles.suyoDetailModalCard}>
              {/* Top Meta Bar: Time & Date on Left, Action/Close on Right */}
              <View style={styles.detailTopMetaRow}>
                <View style={styles.detailTopMetaLeft}>
                  <Ionicons
                    name="time-outline"
                    size={13}
                    color="#658172"
                  />
                  <Text style={styles.detailPostedTimeText}>
                    {selectedSuyoContext === 'posted'
                      ? `Posted: ${selectedSuyo.formattedDate || 'Sep 28 · 11:20 AM'}`
                      : selectedSuyoContext === 'accepted'
                        ? `Accepted: ${selectedSuyo.formattedDate || 'Today · 4:00 PM'}`
                        : selectedSuyoContext === 'completed'
                          ? `Completed: ${selectedSuyo.formattedDate || 'Sep 20 · 3:15 PM'}`
                          : selectedSuyoContext === 'archived'
                            ? `Archived: ${selectedSuyo.formattedDate || 'Sep 18 · 9:15 AM'}`
                            : `Posted: ${selectedSuyo.formattedDate || selectedSuyo.postedTime || '10m ago'}`}
                  </Text>
                </View>

                <View style={styles.detailTopMetaRight}>
                  {selectedSuyoContext === 'available' && (
                    <TouchableOpacity
                      style={styles.detailHeartBtn}
                      activeOpacity={0.7}
                      onPress={() => toggleFavoriteSuyo(selectedSuyo)}
                      hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                    >
                      <Ionicons
                        name={
                          favoriteSuyoIds.includes(selectedSuyo.id)
                            ? 'heart'
                            : 'heart-outline'
                        }
                        size={22}
                        color={
                          favoriteSuyoIds.includes(selectedSuyo.id)
                            ? '#DC2626'
                            : '#6B8576'
                        }
                      />
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity
                    style={styles.detailCloseIconBtn}
                    activeOpacity={0.7}
                    onPress={handleCloseDetailModal}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Ionicons
                      name="close"
                      size={19}
                      color="#6B8576"
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Title & Status Row: Status placed at opposite side, in line with Title */}
              <View style={styles.detailTitleAndStatusRow}>
                <Text style={styles.detailCardTitleInRow}>
                  {selectedSuyo.title}
                </Text>

                <View
                  style={[
                    styles.detailStatusPillInline,
                    selectedSuyo.status === 'Cancelled'
                      ? { backgroundColor: '#FEE2E2' }
                      : selectedSuyoContext === 'completed' ||
                          selectedSuyo.status?.includes('Completed')
                        ? { backgroundColor: '#DCFCE7' }
                        : selectedSuyoContext === 'accepted' ||
                            selectedSuyo.status?.includes('In Progress')
                          ? { backgroundColor: '#E0F2FE' }
                          : selectedSuyoContext === 'archived'
                            ? { backgroundColor: '#F1F5F9' }
                            : { backgroundColor: '#E0F2FE' },
                  ]}
                >
                  <Text
                    style={[
                      styles.detailStatusPillInlineText,
                      selectedSuyo.status === 'Cancelled'
                        ? { color: '#DC2626' }
                        : selectedSuyoContext === 'completed' ||
                            selectedSuyo.status?.includes('Completed')
                          ? { color: '#15803D' }
                          : selectedSuyoContext === 'accepted' ||
                              selectedSuyo.status?.includes('In Progress')
                            ? { color: '#0369A1' }
                            : selectedSuyoContext === 'archived'
                              ? { color: '#475569' }
                              : { color: '#0369A1' },
                    ]}
                  >
                    {selectedSuyo.status === 'Cancelled'
                      ? 'Cancelled'
                      : selectedSuyoContext === 'completed' ||
                          selectedSuyo.status?.includes('Completed')
                        ? 'Completed'
                        : selectedSuyoContext === 'accepted' ||
                            selectedSuyo.status?.includes('In Progress')
                          ? 'Accepted'
                          : selectedSuyoContext === 'archived'
                            ? 'Archived'
                            : 'Open'}
                  </Text>
                </View>
              </View>

              <View style={styles.detailDivider} />

              {/* In Accepted or Completed: Show Who Accepted/Fulfilled It */}
              {selectedSuyoContext === 'accepted' ||
              selectedSuyoContext === 'completed' ? (
                <TouchableOpacity
                  style={styles.detailDoerHighlightCard}
                  activeOpacity={0.75}
                  onPress={() => {
                    const userId =
                      selectedSuyo.rawRequest?.providerId ||
                      selectedSuyo.providerId;
                    if (!userId) return;
                    setSelectedSuyo(null);
                    router.push({ pathname: '/profile', params: { userId } });
                  }}
                  accessibilityRole="button"
                  accessibilityLabel="View courier profile"
                >
                  <View style={styles.detailDoerAvatar}>
                    <Text style={styles.detailDoerAvatarInitials}>
                      {getInitials(
                        selectedSuyo.doer?.name || DEFAULT_DOER.name,
                      )}
                    </Text>
                  </View>
                  <View style={styles.detailDoerTextCol}>
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 5,
                      }}
                    >
                      <Text style={styles.detailDoerNameText}>
                        {selectedSuyo.doer?.name || DEFAULT_DOER.name}
                      </Text>
                      {selectedSuyoContext !== 'completed' && (
                        <Ionicons
                          name="checkmark-circle"
                          size={14}
                          color="#059669"
                        />
                      )}
                    </View>
                    <Text style={styles.detailDoerMetaText}>
                      {selectedSuyoContext === 'completed'
                        ? 'Fulfilled your Suyo'
                        : 'Accepted Courier'}{' '}
                      · {selectedSuyo.doer?.rating || DEFAULT_DOER.rating} ·{' '}
                      {selectedSuyo.doer?.vehicle || DEFAULT_DOER.vehicle}
                    </Text>
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={(e) => {
                        e?.stopPropagation?.();
                        handleCallDoer(
                          selectedSuyo.doer?.phone || DEFAULT_DOER.phone,
                          selectedSuyo.doer?.name || DEFAULT_DOER.name,
                        );
                      }}
                    >
                      <Text style={styles.detailDoerPhoneText}>
                        📞 {selectedSuyo.doer?.phone || DEFAULT_DOER.phone}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              ) : (
                /* Requester Info Row - Fix: user's own cancelled/posted suyo shows Edit instead of Call */
                (() => {
                  const isOwnSuyo =
                    selectedSuyoContext === 'posted' ||
                    selectedSuyoContext === 'cancelled' ||
                    selectedSuyoContext === 'archived' ||
                    selectedSuyo?.isOwner ||
                    selectedSuyo?.requesterName === userProfile?.name ||
                    selectedSuyo?.requesterName?.includes('(You)') ||
                    selectedSuyo?.requesterName === 'You';

                  return (
                    <View style={styles.detailRequestorRow}>
                      <TouchableOpacity
                        style={styles.detailRequestorLeft}
                        activeOpacity={0.75}
                        onPress={() => {
                          setSelectedSuyo(null);
                          if (isOwnSuyo) {
                            router.push({
                              pathname: '/profile',
                              params: { isOtherUser: 'false' },
                            });
                          } else {
                            const userId =
                              selectedSuyo.rawRequest?.requesterId ||
                              selectedSuyo.requesterId;
                            if (!userId) return;
                            router.push({
                              pathname: '/profile',
                              params: { userId },
                            });
                          }
                        }}
                        accessibilityRole="button"
                        accessibilityLabel={
                          isOwnSuyo ? 'View and edit profile' : 'View profile'
                        }
                      >
                        <View style={styles.detailAvatarCircle}>
                          <Text style={styles.detailAvatarInitials}>
                            {isOwnSuyo
                              ? getInitials(
                                  userProfile?.name || 'Juan Dela Cruz',
                                )
                              : selectedSuyo.requesterInitials ||
                                getInitials(
                                  selectedSuyo.requesterName ||
                                    userProfile?.name ||
                                    'Juan Dela Cruz',
                                )}
                          </Text>
                        </View>
                        <View style={styles.detailRequestorTextCol}>
                          <Text style={styles.detailRequestorName}>
                            {isOwnSuyo
                              ? `${userProfile?.name || 'Juan Dela Cruz'} (You)`
                              : selectedSuyo.requesterName || 'Maria Clarissa'}
                          </Text>
                          <Text style={styles.detailRequestorMeta}>
                            {isOwnSuyo
                              ? `Requester (You) · ${userProfile?.rating || '5.0★'}`
                              : `Requestor · ${selectedSuyo.requesterRating || '4.9★'}  -  ${(selectedSuyo.completedCount || '15 completed').replace(/[()]/g, '')}`}
                          </Text>
                          <View style={styles.detailRequestorPhoneRow}>
                            <Ionicons
                              name="call"
                              size={11}
                              color="#6D8777"
                            />
                            <Text style={styles.detailRequestorPhoneText}>
                              {isOwnSuyo
                                ? userProfile?.phone || '+63 917 123 4567'
                                : selectedSuyo.requesterPhone ||
                                  '0928 341 5520'}
                            </Text>
                          </View>
                        </View>
                      </TouchableOpacity>

                      {/* If user's own profile (like cancelled or posted suyo), show EDIT button instead of CALL button! */}
                      {isOwnSuyo ? (
                        <TouchableOpacity
                          style={styles.detailRequestorEditBtn}
                          activeOpacity={0.7}
                          onPress={() => {
                            setSelectedSuyo(null);
                            router.push({
                              pathname: '/profile',
                              params: { isOtherUser: 'false' },
                            });
                          }}
                          accessibilityRole="button"
                          accessibilityLabel="Edit profile"
                        >
                          <Ionicons
                            name="pencil"
                            size={17}
                            color="#1E4D2B"
                          />
                        </TouchableOpacity>
                      ) : (
                        /* Only for other users in public available feed, show functional CALL button */
                        selectedSuyoContext === 'available' && (
                          <TouchableOpacity
                            style={styles.detailRequestorCallBtn}
                            activeOpacity={0.7}
                            onPress={() =>
                              handleCallDoer(
                                selectedSuyo.requesterPhone || '0917 842 1983',
                                selectedSuyo.requesterName ||
                                  'Atty. Rafael Cruz',
                              )
                            }
                            accessibilityRole="button"
                            accessibilityLabel="Call requester"
                          >
                            <Ionicons
                              name="call"
                              size={18}
                              color="#1E4D2B"
                            />
                          </TouchableOpacity>
                        )
                      )}
                    </View>
                  );
                })()
              )}

              <View style={styles.detailDivider} />

              {/* Reward & Location Stats */}
              <View style={styles.detailStatsRow}>
                <View style={styles.detailStatCol}>
                  <Text style={styles.detailStatLabel}>REWARD</Text>
                  <Text style={styles.detailRewardAmount}>
                    {selectedSuyo.rewardAmount
                      ? `₱${Number(selectedSuyo.rewardAmount).toFixed(2)}`
                      : selectedSuyo.reward &&
                          selectedSuyo.reward.startsWith('₱')
                        ? `${selectedSuyo.reward}.00`
                        : '₱150.00'}
                  </Text>
                </View>

                <View style={styles.detailStatCol}>
                  <Text style={styles.detailStatLabel}>LOCATION</Text>
                  <View style={styles.detailLocationRow}>
                    <Ionicons
                      name="location-sharp"
                      size={17}
                      color="#0D9488"
                    />
                    <Text
                      style={styles.detailLocationName}
                      numberOfLines={1}
                    >
                      {selectedSuyo.location || 'SM Tagum'}
                    </Text>
                  </View>
                </View>
              </View>

              <Text style={styles.detailTaskHeading}>Task Description</Text>
              <Text style={styles.detailTaskBody}>
                {selectedSuyo.details}
                {selectedSuyo.notes ? ` ${selectedSuyo.notes}` : ''}
              </Text>

              {/* Attached Photos & Files Section */}
              {selectedSuyo.attachments &&
                selectedSuyo.attachments.length > 0 && (
                  <View style={styles.detailAttachmentsSection}>
                    <View style={styles.detailAttachmentsHeaderRow}>
                      <Ionicons
                        name="attach"
                        size={15}
                        color="#1E4D2B"
                      />
                      <Text style={styles.detailAttachmentsHeading}>
                        Attached Photos & Files (
                        {selectedSuyo.attachments.length})
                      </Text>
                    </View>

                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.detailAttachmentsScroll}
                    >
                      {selectedSuyo.attachments.map((att, idx) => {
                        const isImg = att.type === 'image';
                        return (
                          <View
                            key={att.id || idx}
                            style={styles.detailAttachmentChip}
                          >
                            {isImg ? (
                              <View style={styles.detailAttachmentImageWrap}>
                                <Image
                                  source={{ uri: att.uri }}
                                  style={styles.detailAttachmentThumb}
                                />
                                <View style={styles.detailAttachmentTag}>
                                  <Ionicons
                                    name="image"
                                    size={10}
                                    color="#FFFFFF"
                                  />
                                  <Text style={styles.detailAttachmentTagText}>
                                    Photo
                                  </Text>
                                </View>
                              </View>
                            ) : (
                              <View style={styles.detailAttachmentDocWrap}>
                                <Ionicons
                                  name="document-text"
                                  size={18}
                                  color="#B45309"
                                />
                                <Text
                                  style={styles.detailAttachmentDocName}
                                  numberOfLines={1}
                                >
                                  {att.name || 'Document'}
                                </Text>
                              </View>
                            )}
                          </View>
                        );
                      })}
                    </ScrollView>
                  </View>
                )}

              {/* FEATURE: Prompt to Increase Reward if Waiting Long in Posted Nav */}
              {selectedSuyoContext === 'posted' &&
                selectedSuyo.status !== 'Cancelled' && (
                  <View style={styles.detailBoostCard}>
                    <View style={styles.detailBoostHeader}>
                      <View style={styles.detailBoostIconBox}>
                        <Ionicons
                          name="sparkles"
                          size={15}
                          color="#059669"
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.detailBoostTitle}>
                          No one accepting yet?
                        </Text>
                        <Text style={styles.detailBoostSubtitle}>
                          Boost your reward to get accepted faster by nearby
                          doers:
                        </Text>
                      </View>
                    </View>
                    <View style={styles.detailBoostButtonsRow}>
                      <TouchableOpacity
                        style={[
                          styles.detailBoostChip,
                          selectedSuyo.currentBoost === 0 &&
                            styles.detailBoostChipGreen,
                        ]}
                        activeOpacity={0.75}
                        onPress={() => handleBoostReward(selectedSuyo.id, 0)}
                      >
                        <Text
                          style={[
                            styles.detailBoostChipText,
                            selectedSuyo.currentBoost === 0 && {
                              color: '#FFFFFF',
                            },
                          ]}
                        >
                          +₱0
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[
                          styles.detailBoostChip,
                          selectedSuyo.currentBoost === 20 &&
                            styles.detailBoostChipGreen,
                        ]}
                        activeOpacity={0.75}
                        onPress={() => handleBoostReward(selectedSuyo.id, 20)}
                      >
                        <Text
                          style={[
                            styles.detailBoostChipText,
                            selectedSuyo.currentBoost === 20 && {
                              color: '#FFFFFF',
                            },
                          ]}
                        >
                          +₱20
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[
                          styles.detailBoostChip,
                          selectedSuyo.currentBoost === 50 &&
                            styles.detailBoostChipGreen,
                        ]}
                        activeOpacity={0.75}
                        onPress={() => handleBoostReward(selectedSuyo.id, 50)}
                      >
                        <Text
                          style={[
                            styles.detailBoostChipText,
                            selectedSuyo.currentBoost === 50 && {
                              color: '#FFFFFF',
                            },
                          ]}
                        >
                          +₱50
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[
                          styles.detailBoostChip,
                          selectedSuyo.currentBoost === 100 &&
                            styles.detailBoostChipGreen,
                        ]}
                        activeOpacity={0.75}
                        onPress={() => handleBoostReward(selectedSuyo.id, 100)}
                      >
                        <Text
                          style={[
                            styles.detailBoostChipText,
                            selectedSuyo.currentBoost === 100 && {
                              color: '#FFFFFF',
                            },
                          ]}
                        >
                          +₱100
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

              {/* Dynamic Action Buttons Row (Context-Specific) */}
              <View style={styles.detailActionButtonsRow}>
                {/* POSTED NAV BUTTONS (Edit, Cancel, or Re-post) */}
                {selectedSuyoContext === 'posted' &&
                  (selectedSuyo.status !== 'Cancelled' ? (
                    <>
                      <TouchableOpacity
                        style={styles.detailEditSuyoBtn}
                        onPress={() => handleOpenEditSuyo(selectedSuyo)}
                        activeOpacity={0.8}
                      >
                        <Ionicons
                          name="pencil"
                          size={15}
                          color="#163523"
                        />
                        <Text style={styles.detailEditSuyoBtnText}>Edit</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.detailCancelSuyoBtn}
                        onPress={() => handleCancelSuyo(selectedSuyo.id)}
                        activeOpacity={0.8}
                      >
                        <Ionicons
                          name="close-circle-outline"
                          size={15}
                          color="#DC2626"
                        />
                        <Text style={styles.detailCancelSuyoBtnText}>
                          Cancel
                        </Text>
                      </TouchableOpacity>
                    </>
                  ) : (
                    <TouchableOpacity
                      style={styles.detailPrimaryActionBtn}
                      onPress={() => handleRepeatRequest(selectedSuyo)}
                      activeOpacity={0.8}
                    >
                      <Ionicons
                        name="refresh"
                        size={16}
                        color="#FFFFFF"
                      />
                      <Text style={styles.detailPrimaryActionBtnText}>
                        Re-post Suyo
                      </Text>
                    </TouchableOpacity>
                  ))}

                {/* ACCEPTED NAV BUTTONS (Call Doer & Track Live) */}
                {selectedSuyoContext === 'accepted' && (
                  <>
                    <TouchableOpacity
                      style={styles.detailCallDoerBtn}
                      onPress={() =>
                        handleCallDoer(
                          selectedSuyo.doer?.phone || DEFAULT_DOER.phone,
                        )
                      }
                      activeOpacity={0.8}
                    >
                      <Ionicons
                        name="call"
                        size={15}
                        color="#163523"
                      />
                      <Text style={styles.detailCallDoerBtnText}>
                        Call Doer
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.detailTrackCourierBtn}
                      activeOpacity={0.8}
                      onPress={() => {
                        handleCloseDetailModal();
                        router.push({
                          pathname: '/requester-fulfill',
                          params: {
                            id: selectedSuyo.id,
                            title: selectedSuyo.title,
                            doerName:
                              selectedSuyo.doer?.name || DEFAULT_DOER.name,
                            doerPhone:
                              selectedSuyo.doer?.phone || DEFAULT_DOER.phone,
                          },
                        });
                      }}
                    >
                      <Ionicons
                        name="navigate"
                        size={16}
                        color="#FFFFFF"
                      />
                      <Text style={styles.detailTrackCourierBtnText}>
                        Track
                      </Text>
                    </TouchableOpacity>
                  </>
                )}

                {/* COMPLETED NAV BUTTONS (Save to Archive, Repeat Suyo) */}
                {selectedSuyoContext === 'completed' &&
                  (() => {
                    const isArchived =
                      selectedSuyo &&
                      archivedSuyos.some(
                        (a) =>
                          a.id === selectedSuyo.id ||
                          a.title === selectedSuyo.title,
                      );
                    return (
                      <>
                        <TouchableOpacity
                          style={[
                            styles.detailArchiveSuyoBtn,
                            isArchived && styles.detailArchiveSuyoBtnYellow,
                          ]}
                          onPress={() => handleSaveToArchive(selectedSuyo)}
                          activeOpacity={0.8}
                        >
                          <Ionicons
                            name={isArchived ? 'bookmark' : 'bookmark-outline'}
                            size={15}
                            color={isArchived ? '#78350F' : '#163523'}
                          />
                          <Text
                            style={[
                              styles.detailArchiveSuyoBtnText,
                              isArchived &&
                                styles.detailArchiveSuyoBtnTextYellow,
                            ]}
                          >
                            {isArchived ? 'Archived' : 'Archive'}
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.detailRepeatSuyoBtn}
                          onPress={() => handleRepeatRequest(selectedSuyo)}
                          activeOpacity={0.8}
                        >
                          <Ionicons
                            name="refresh"
                            size={15}
                            color="#FFFFFF"
                          />
                          <Text style={styles.detailRepeatSuyoBtnText}>
                            Repeat Suyo
                          </Text>
                        </TouchableOpacity>
                      </>
                    );
                  })()}

                {/* CANCELLED NAV BUTTONS (Delete unwanted suyo & Re-post Suyo) */}
                {selectedSuyoContext === 'cancelled' && (
                  <>
                    <TouchableOpacity
                      style={styles.detailCancelSuyoBtn}
                      onPress={() => {
                        const idToDelete = selectedSuyo.id;
                        setCancelledSuyos((prev) =>
                          prev.filter((s) => s.id !== idToDelete),
                        );
                        setSelectedSuyo(null);
                        triggerToast(
                          'suyo is successfully deleted',
                          'trash-outline',
                        );
                      }}
                      activeOpacity={0.8}
                    >
                      <Ionicons
                        name="trash-outline"
                        size={15}
                        color="#DC2626"
                      />
                      <Text style={styles.detailCancelSuyoBtnText}>Delete</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.detailRepeatSuyoBtn}
                      onPress={() => handleRepeatRequest(selectedSuyo)}
                      activeOpacity={0.8}
                    >
                      <Ionicons
                        name="refresh"
                        size={15}
                        color="#FFFFFF"
                      />
                      <Text style={styles.detailRepeatSuyoBtnText}>
                        Re-post Suyo
                      </Text>
                    </TouchableOpacity>
                  </>
                )}

                {/* ARCHIVED NAV BUTTONS (Edit Template, Repeat Request) */}
                {selectedSuyoContext === 'archived' && (
                  <>
                    <TouchableOpacity
                      style={styles.detailEditSuyoBtn}
                      onPress={() => handleOpenEditSuyo(selectedSuyo)}
                      activeOpacity={0.8}
                    >
                      <Ionicons
                        name="pencil"
                        size={15}
                        color="#163523"
                      />
                      <Text style={styles.detailEditSuyoBtnText}>Edit</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.detailRepeatSuyoBtn}
                      onPress={() => handleRepeatRequest(selectedSuyo)}
                      activeOpacity={0.8}
                    >
                      <Ionicons
                        name="paper-plane"
                        size={15}
                        color="#FFFFFF"
                      />
                      <Text style={styles.detailRepeatSuyoBtnText}>
                        Post Suyo
                      </Text>
                    </TouchableOpacity>
                  </>
                )}

                {/* AVAILABLE / EXPLORE FEED BUTTON (Keep Fulfill for Couriers) */}
                {selectedSuyoContext === 'available' && (
                  <TouchableOpacity
                    style={styles.detailFulfillBtn}
                    activeOpacity={0.8}
                    onPress={() => {
                      const taskToFulfill = selectedSuyo;
                      setSelectedSuyo(null);
                      setOpenedFromFavorites(false);
                      if (taskToFulfill) {
                        setDoerAcceptedSuyos((prev) => {
                          if (prev.some((s) => s.id === taskToFulfill.id))
                            return prev;
                          return [
                            {
                              id: taskToFulfill.id,
                              title: taskToFulfill.title,
                              category: taskToFulfill.category || 'General',
                              icon: taskToFulfill.icon || 'bicycle',
                              location: taskToFulfill.location || 'Tagum City',
                              distanceText:
                                taskToFulfill.distanceText || '0.8 km away',
                              reward: taskToFulfill.reward || '₱150',
                              requesterName:
                                taskToFulfill.requesterName ||
                                'Community Member',
                              requesterPhone:
                                taskToFulfill.requesterPhone || '09564781552',
                              deadline:
                                taskToFulfill.timeBadge || 'Within 2 hours',
                              acceptedAt: 'Today · Just now',
                              details:
                                taskToFulfill.details ||
                                'Fulfill this suyo request according to requester requirements.',
                              notes: taskToFulfill.notes || 'Handle with care.',
                              status: 'Accepted · In Progress',
                            },
                            ...prev,
                          ];
                        });
                      }
                      router.push({
                        pathname: '/fulfill',
                        params: {
                          id: taskToFulfill?.id || 'SYL-102',
                          title:
                            taskToFulfill?.title ||
                            'Quick Grocery Delivery (5 items)',
                          category: taskToFulfill?.category || 'Groceries',
                          location: taskToFulfill?.location || 'SM Tagum',
                          distanceText:
                            taskToFulfill?.distanceText || '0.8 km away',
                          reward: taskToFulfill?.reward || '₱150',
                          requesterName:
                            taskToFulfill?.requesterName || 'Maria Santos',
                          requesterLocation:
                            taskToFulfill?.location || 'Quezon City',
                          requesterPhone:
                            taskToFulfill?.requesterPhone || '09564781552',
                          details:
                            taskToFulfill?.details || 'Grocery delivery items',
                        },
                      });
                    }}
                  >
                    <Ionicons
                      name="bicycle"
                      size={18}
                      color="#FFFFFF"
                    />
                    <Text style={styles.detailFulfillBtnText}>
                      Fulfill Suyo
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* ========================================================== */}
      {/* 6C. DOER CANCELLATION CONFIRMATION MODAL                   */}
      {/* ========================================================== */}
      {doerCancelModalItem && (
        <Modal
          visible={!!doerCancelModalItem}
          animationType="fade"
          transparent={true}
          onRequestClose={() => setDoerCancelModalItem(null)}
        >
          <View style={styles.modalBackdrop}>
            <View style={styles.doerCancelModalCard}>
              <View style={styles.doerCancelIconCircle}>
                <Ionicons
                  name="warning-outline"
                  size={26}
                  color="#DC2626"
                />
              </View>
              <Text style={styles.doerCancelModalTitle}>
                Cancel Accepted Suyo?
              </Text>
              <Text style={styles.doerCancelModalSub}>
                Are you sure you want to cancel "{doerCancelModalItem.title}"?
                It will be immediately released back to the public available
                board so other couriers can fulfill it.
              </Text>
              <View style={styles.doerCancelActionRow}>
                <TouchableOpacity
                  style={styles.doerCancelKeepBtn}
                  activeOpacity={0.7}
                  onPress={() => setDoerCancelModalItem(null)}
                >
                  <Text style={styles.doerCancelKeepBtnText}>Keep Suyo</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.doerCancelConfirmBtn}
                  activeOpacity={0.7}
                  onPress={() => {
                    const itemToCancel = doerCancelModalItem;
                    setDoerCancelModalItem(null);
                    if (selectedDoerSuyo?.id === itemToCancel.id) {
                      setSelectedDoerSuyo(null);
                    }
                    // Remove from accepted, add to cancelled
                    setDoerAcceptedSuyos((prev) =>
                      prev.filter((s) => s.id !== itemToCancel.id),
                    );
                    setDoerCancelledSuyos((prev) => [
                      {
                        ...itemToCancel,
                        status: 'Cancelled by Doer',
                        cancelledAt: 'Today · Just now',
                        cancelReason:
                          'Cancelled by Doer · Released back to board',
                      },
                      ...prev,
                    ]);
                    triggerToast(
                      'Suyo cancelled and returned to public board',
                      'alert',
                    );
                  }}
                >
                  <Text style={styles.doerCancelConfirmBtnText}>
                    Yes, Cancel Suyo
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* ========================================================== */}
      {/* 6D. DOER SUYO DETAILS MODAL                                */}
      {/* ========================================================== */}
      {selectedDoerSuyo && (
        <Modal
          visible={!!selectedDoerSuyo}
          animationType="fade"
          transparent={true}
          onRequestClose={() => setSelectedDoerSuyo(null)}
        >
          <View style={styles.modalBackdrop}>
            <View style={styles.doerDetailModalCard}>
              {/* Header */}
              <View style={styles.doerDetailHeader}>
                <View style={styles.doerDetailHeaderLeft}>
                  <View style={styles.doerDetailCategoryCircle}>
                    <Ionicons
                      name={selectedDoerSuyo.icon || 'bicycle'}
                      size={17}
                      color="#1E4D2B"
                    />
                  </View>
                  <View style={{ gap: 2 }}>
                    <Text style={styles.doerDetailCategoryText}>
                      {selectedDoerSuyo.category || 'Doer Task Details'}
                    </Text>
                    <Text style={styles.doerDetailDateText}>
                      {selectedDoerSuyo.acceptedAt ||
                        selectedDoerSuyo.date ||
                        'Today'}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  onPress={() => setSelectedDoerSuyo(null)}
                  style={styles.doerDetailCloseBtn}
                  activeOpacity={0.7}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons
                    name="close"
                    size={18}
                    color="#163523"
                  />
                </TouchableOpacity>
              </View>

              <ScrollView
                style={{ maxHeight: 420 }}
                showsVerticalScrollIndicator={false}
              >
                {/* Title */}
                <Text style={styles.doerDetailTitle}>
                  {selectedDoerSuyo.title}
                </Text>

                {/* Status & Payout Card */}
                <View style={styles.doerDetailSummaryCard}>
                  <View style={styles.doerDetailStatusBadge}>
                    <Ionicons
                      name={
                        selectedDoerSuyo.status === 'Completed'
                          ? 'checkmark-done-circle'
                          : selectedDoerSuyo.status === 'Cancelled'
                            ? 'close-circle'
                            : 'checkmark-circle'
                      }
                      size={14}
                      color={
                        selectedDoerSuyo.status === 'Completed'
                          ? '#059669'
                          : selectedDoerSuyo.status === 'Cancelled'
                            ? '#DC2626'
                            : '#0284C7'
                      }
                    />
                    <Text
                      style={[
                        styles.doerDetailStatusBadgeText,
                        {
                          color:
                            selectedDoerSuyo.status === 'Completed'
                              ? '#059669'
                              : selectedDoerSuyo.status === 'Cancelled'
                                ? '#DC2626'
                                : '#0284C7',
                        },
                      ]}
                    >
                      {selectedDoerSuyo.status || 'Accepted'}
                    </Text>
                  </View>

                  <View style={styles.doerDetailPayoutBox}>
                    <Text style={styles.doerDetailPayoutLabel}>PAYOUT</Text>
                    <Text style={styles.doerDetailPayoutValue}>
                      +
                      {selectedDoerSuyo.reward ||
                        `₱${selectedDoerSuyo.earnedAmount || 150}`}
                    </Text>
                  </View>
                </View>

                {/* Clickable Requester Profile Tile (Navigates directly to /profile screen without modal, matching MySuyo area) */}
                <TouchableOpacity
                  style={styles.doerRequesterCard}
                  activeOpacity={0.75}
                  onPress={() => {
                    const isOwn =
                      selectedDoerSuyo.requesterName === userProfile?.name ||
                      selectedDoerSuyo.requesterName?.includes('(You)') ||
                      selectedDoerSuyo.requesterName === 'You';

                    setSelectedDoerSuyo(null);
                    if (isOwn) {
                      router.push({
                        pathname: '/profile',
                        params: { isOtherUser: 'false' },
                      });
                    } else {
                      const userId =
                        selectedDoerSuyo.rawRequest?.requesterId ||
                        selectedDoerSuyo.requesterId;
                      if (!userId) return;
                      router.push({ pathname: '/profile', params: { userId } });
                    }
                  }}
                  accessibilityRole="button"
                  accessibilityLabel="View requester profile"
                >
                  <View style={styles.doerRequesterCardTop}>
                    <Text style={styles.doerRequesterSectionLabel}>
                      REQUESTED BY
                    </Text>
                    <View style={styles.doerRequesterViewProfilePill}>
                      <Text style={styles.doerRequesterViewProfileText}>
                        View Profile
                      </Text>
                      <Ionicons
                        name="chevron-forward"
                        size={10}
                        color="#059669"
                      />
                    </View>
                  </View>

                  <View style={styles.doerRequesterCardMainRow}>
                    <View style={styles.doerRequesterAvatar}>
                      <Text style={styles.doerRequesterAvatarText}>
                        {getInitials(
                          selectedDoerSuyo.requesterName || 'Community Member',
                        )}
                      </Text>
                    </View>
                    <View style={{ flex: 1, paddingRight: 6 }}>
                      <View
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 4,
                        }}
                      >
                        <Text
                          style={styles.doerRequesterName}
                          numberOfLines={1}
                        >
                          {selectedDoerSuyo.requesterName || 'Community Member'}
                        </Text>
                        <Ionicons
                          name="checkmark-circle"
                          size={13}
                          color="#059669"
                        />
                      </View>
                      <Text style={styles.doerRequesterSubMeta}>
                        {selectedDoerSuyo.requesterRating || '4.9★'} · Prompt
                        Payer
                      </Text>
                    </View>

                    {(() => {
                      const isOwn =
                        selectedDoerSuyo.requesterName === userProfile?.name ||
                        selectedDoerSuyo.requesterName?.includes('(You)') ||
                        selectedDoerSuyo.requesterName === 'You';

                      if (isOwn) {
                        return (
                          <TouchableOpacity
                            style={[
                              styles.doerRequesterCallPill,
                              { backgroundColor: '#1E4D2B' },
                            ]}
                            activeOpacity={0.8}
                            onPress={(e) => {
                              e?.stopPropagation?.();
                              setSelectedDoerSuyo(null);
                              router.push({
                                pathname: '/profile',
                                params: { isOtherUser: 'false' },
                              });
                            }}
                            accessibilityRole="button"
                            accessibilityLabel="Edit profile"
                          >
                            <Ionicons
                              name="pencil"
                              size={12}
                              color="#FFFFFF"
                            />
                            <Text style={styles.doerRequesterCallPillText}>
                              Edit
                            </Text>
                          </TouchableOpacity>
                        );
                      }

                      if (selectedDoerSuyo.requesterPhone) {
                        return (
                          <TouchableOpacity
                            style={styles.doerRequesterCallPill}
                            activeOpacity={0.8}
                            onPress={(e) => {
                              e?.stopPropagation?.();
                              Linking.openURL(
                                `tel:${selectedDoerSuyo.requesterPhone}`,
                              );
                            }}
                            accessibilityRole="button"
                            accessibilityLabel="Call requester"
                          >
                            <Ionicons
                              name="call"
                              size={12}
                              color="#FFFFFF"
                            />
                            <Text style={styles.doerRequesterCallPillText}>
                              Call
                            </Text>
                          </TouchableOpacity>
                        );
                      }
                      return null;
                    })()}
                  </View>
                </TouchableOpacity>

                {/* Key Info Grid: Location & Deadline (Divided cleanly with dedicated icon bubbles) */}
                <View style={styles.doerInfoGridRow}>
                  {/* Location Tile */}
                  <View style={styles.doerInfoGridTile}>
                    <View style={styles.doerInfoGridTileHeader}>
                      <View
                        style={[
                          styles.doerInfoIconCircle,
                          { backgroundColor: '#E0F2FE' },
                        ]}
                      >
                        <Ionicons
                          name="location-sharp"
                          size={13}
                          color="#0284C7"
                        />
                      </View>
                      <Text style={styles.doerInfoGridLabel}>LOCATION</Text>
                    </View>
                    <Text
                      style={styles.doerInfoGridValue}
                      numberOfLines={2}
                    >
                      {selectedDoerSuyo.location || 'Tagum City'}
                    </Text>
                  </View>

                  {/* Deadline / Time Tile */}
                  <View style={styles.doerInfoGridTile}>
                    <View style={styles.doerInfoGridTileHeader}>
                      <View
                        style={[
                          styles.doerInfoIconCircle,
                          { backgroundColor: '#FEF3C7' },
                        ]}
                      >
                        <Ionicons
                          name="time"
                          size={13}
                          color="#D97706"
                        />
                      </View>
                      <Text style={styles.doerInfoGridLabel}>DEADLINE</Text>
                    </View>
                    <Text
                      style={styles.doerInfoGridValue}
                      numberOfLines={2}
                    >
                      {selectedDoerSuyo.deadline ||
                        selectedDoerSuyo.due ||
                        'Flexible time'}
                    </Text>
                  </View>
                </View>

                {/* Task Description Section */}
                <View style={styles.doerTaskDescCard}>
                  <View style={styles.doerSectionHeaderRow}>
                    <View
                      style={[
                        styles.doerInfoIconCircle,
                        { backgroundColor: '#E8F5EE' },
                      ]}
                    >
                      <Ionicons
                        name="reader-outline"
                        size={13}
                        color="#1E4D2B"
                      />
                    </View>
                    <Text style={styles.doerSectionHeaderText}>
                      TASK DESCRIPTION
                    </Text>
                  </View>
                  <Text style={styles.doerTaskDescBody}>
                    {selectedDoerSuyo.details ||
                      'Fulfill this suyo request according to requester requirements.'}
                  </Text>
                </View>

                {/* Special Instructions (Notes) */}
                {selectedDoerSuyo.notes ? (
                  <View style={styles.doerNotesCard}>
                    <View style={styles.doerSectionHeaderRow}>
                      <View
                        style={[
                          styles.doerInfoIconCircle,
                          { backgroundColor: '#FEF3C7' },
                        ]}
                      >
                        <Ionicons
                          name="bulb-outline"
                          size={13}
                          color="#B45309"
                        />
                      </View>
                      <Text
                        style={[
                          styles.doerSectionHeaderText,
                          { color: '#B45309' },
                        ]}
                      >
                        SPECIAL INSTRUCTIONS
                      </Text>
                    </View>
                    <Text style={styles.doerNotesBody}>
                      {selectedDoerSuyo.notes}
                    </Text>
                  </View>
                ) : null}

                {/* Attached Photos & Files Section */}
                {selectedDoerSuyo.attachments &&
                  selectedDoerSuyo.attachments.length > 0 && (
                    <View style={styles.doerAttachmentsCard}>
                      <View style={styles.doerSectionHeaderRow}>
                        <View
                          style={[
                            styles.doerInfoIconCircle,
                            { backgroundColor: '#E8F5EE' },
                          ]}
                        >
                          <Ionicons
                            name="attach"
                            size={13}
                            color="#1E4D2B"
                          />
                        </View>
                        <Text style={styles.doerSectionHeaderText}>
                          ATTACHED PHOTOS & FILES (
                          {selectedDoerSuyo.attachments.length})
                        </Text>
                      </View>

                      <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.detailAttachmentsScroll}
                      >
                        {selectedDoerSuyo.attachments.map((att, idx) => {
                          const isImg = att.type === 'image';
                          return (
                            <View
                              key={att.id || idx}
                              style={styles.detailAttachmentChip}
                            >
                              {isImg ? (
                                <View style={styles.detailAttachmentImageWrap}>
                                  <Image
                                    source={{ uri: att.uri }}
                                    style={styles.detailAttachmentThumb}
                                  />
                                  <View style={styles.detailAttachmentTag}>
                                    <Ionicons
                                      name="image"
                                      size={10}
                                      color="#FFFFFF"
                                    />
                                    <Text
                                      style={styles.detailAttachmentTagText}
                                    >
                                      Photo
                                    </Text>
                                  </View>
                                </View>
                              ) : (
                                <View style={styles.detailAttachmentDocWrap}>
                                  <Ionicons
                                    name="document-text"
                                    size={18}
                                    color="#B45309"
                                  />
                                  <Text
                                    style={styles.detailAttachmentDocName}
                                    numberOfLines={1}
                                  >
                                    {att.name || 'Document'}
                                  </Text>
                                </View>
                              )}
                            </View>
                          );
                        })}
                      </ScrollView>
                    </View>
                  )}

                {/* Informational Callout Banner (NO BUTTONS, exactly as user requested) */}
                <View style={styles.doerModalInfoHint}>
                  <Ionicons
                    name="information-circle"
                    size={15}
                    color="#059669"
                  />
                  <Text style={styles.doerModalInfoHintText}>
                    Review the details above to decide whether to continue or
                    cancel this suyo on your main Doer Suyo card.
                  </Text>
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}

      {/* ========================================================== */}
      {/* 6B. DOER PROFILE MODAL (VIEW COURIER DETAILS)              */}
      {/* ========================================================== */}
      {selectedDoerProfile && (
        <Modal
          visible={!!selectedDoerProfile}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setSelectedDoerProfile(null)}
        >
          <View style={styles.modalBackdrop}>
            <View style={styles.doerProfileModalCard}>
              {/* Header */}
              <View style={styles.doerProfileHeader}>
                <Text style={styles.doerProfileHeaderTitle}>Doer Profile</Text>
                <TouchableOpacity
                  style={styles.modalCloseButton}
                  onPress={() => setSelectedDoerProfile(null)}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name="close"
                    size={18}
                    color="#163523"
                  />
                </TouchableOpacity>
              </View>

              {/* Profile Hero */}
              <View style={styles.doerProfileHero}>
                <View style={styles.doerProfileAvatarCircle}>
                  <Text style={styles.doerProfileAvatarInitials}>
                    {getInitials(selectedDoerProfile.name)}
                  </Text>
                  <View style={styles.doerVerifiedBadge}>
                    <Ionicons
                      name="shield-checkmark"
                      size={12}
                      color="#FFFFFF"
                    />
                  </View>
                </View>
                <Text style={styles.doerProfileName}>
                  {selectedDoerProfile.name}
                </Text>
                <View style={styles.doerVerifiedTag}>
                  <Ionicons
                    name="checkmark-circle"
                    size={12}
                    color="#059669"
                  />
                  <Text style={styles.doerVerifiedTagText}>
                    Verified Courier & Doer
                  </Text>
                </View>
                <Text style={styles.doerProfileRating}>
                  ⭐ {selectedDoerProfile.rating || '4.9★'} ·{' '}
                  {selectedDoerProfile.completedCount || '128 suyos delivered'}
                </Text>
              </View>

              {/* Stats Grid */}
              <View style={styles.doerStatsGrid}>
                <View style={styles.doerStatItem}>
                  <Text style={styles.doerStatValue}>
                    {selectedDoerProfile.completedCount?.split(' ')[0] || '128'}
                  </Text>
                  <Text style={styles.doerStatLabel}>Completed</Text>
                </View>
                <View style={styles.doerStatItem}>
                  <Text style={styles.doerStatValue}>99.4%</Text>
                  <Text style={styles.doerStatLabel}>On-Time</Text>
                </View>
                <View style={styles.doerStatItem}>
                  <Text style={styles.doerStatValue}>100%</Text>
                  <Text style={styles.doerStatLabel}>Reliable</Text>
                </View>
              </View>

              {/* Details List */}
              <View style={styles.doerInfoList}>
                <View style={styles.doerInfoRow}>
                  <Ionicons
                    name="bicycle"
                    size={15}
                    color="#1E4D2B"
                  />
                  <Text style={styles.doerInfoLabel}>Transport:</Text>
                  <Text style={styles.doerInfoValue}>
                    {selectedDoerProfile.vehicle || 'Motorcycle'}
                  </Text>
                </View>
                <View style={styles.doerInfoRow}>
                  <Ionicons
                    name="call"
                    size={15}
                    color="#1E4D2B"
                  />
                  <Text style={styles.doerInfoLabel}>Contact:</Text>
                  <Text style={styles.doerInfoValue}>
                    {selectedDoerProfile.phone || '+63 917 555 0192'}
                  </Text>
                </View>
                <View style={styles.doerInfoRow}>
                  <Ionicons
                    name="calendar-outline"
                    size={15}
                    color="#1E4D2B"
                  />
                  <Text style={styles.doerInfoLabel}>Joined:</Text>
                  <Text style={styles.doerInfoValue}>
                    {selectedDoerProfile.joinedDate || 'March 2023'}
                  </Text>
                </View>
              </View>

              {/* Bio snippet */}
              <Text style={styles.doerBioText}>
                "
                {selectedDoerProfile.bio ||
                  'Reliable and fast delivery courier in Tagum and Davao area. Careful with groceries and delicate items.'}
                "
              </Text>

              {/* Actions */}
              <View style={styles.doerProfileActionsRow}>
                <TouchableOpacity
                  style={styles.doerProfileCallBtn}
                  activeOpacity={0.8}
                  onPress={() =>
                    triggerToast(
                      `Calling ${selectedDoerProfile.name}...`,
                      'call',
                    )
                  }
                >
                  <Ionicons
                    name="call"
                    size={15}
                    color="#FFFFFF"
                  />
                  <Text style={styles.doerProfileCallBtnText}>Call Doer</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.doerProfileMsgBtn}
                  activeOpacity={0.8}
                  onPress={() =>
                    triggerToast(
                      `Opening chat with ${selectedDoerProfile.name}...`,
                      'chatbubble-ellipses',
                    )
                  }
                >
                  <Ionicons
                    name="chatbubble-ellipses"
                    size={15}
                    color="#1E4D2B"
                  />
                  <Text style={styles.doerProfileMsgBtnText}>Message</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* ========================================================== */}
      {/* 6C. EDIT SUYO MODAL                                        */}
      {/* ========================================================== */}
      <Modal
        visible={isEditingSuyoModalOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsEditingSuyoModalOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.editSuyoModalCard}>
            <View style={styles.editSuyoHeader}>
              <Text style={styles.editSuyoHeaderTitle}>Edit Suyo Details</Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setIsEditingSuyoModalOpen(false)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="close"
                  size={18}
                  color="#163523"
                />
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              style={{ maxHeight: 380 }}
            >
              <Text style={styles.editSuyoInputLabel}>Title</Text>
              <TextInput
                style={styles.editSuyoTextInput}
                value={editingSuyoData.title}
                onChangeText={(text) =>
                  setEditingSuyoData((prev) => ({ ...prev, title: text }))
                }
                placeholder="e.g. Buy groceries at SM Tagum"
                placeholderTextColor="#94A3B8"
              />

              <Text style={styles.editSuyoInputLabel}>Reward Offer (₱)</Text>
              <View style={styles.editSuyoRewardRow}>
                <TextInput
                  style={[
                    styles.editSuyoTextInput,
                    { flex: 1, marginBottom: 0 },
                  ]}
                  value={String(editingSuyoData.rewardAmount)}
                  onChangeText={(text) =>
                    setEditingSuyoData((prev) => ({
                      ...prev,
                      rewardAmount: text.replace(/[^0-9]/g, ''),
                    }))
                  }
                  keyboardType="numeric"
                  placeholder="150"
                  placeholderTextColor="#94A3B8"
                />
                <View style={{ flexDirection: 'row', gap: 6 }}>
                  <TouchableOpacity
                    style={styles.editSuyoQuickAddPill}
                    activeOpacity={0.75}
                    onPress={() =>
                      setEditingSuyoData((prev) => ({
                        ...prev,
                        rewardAmount: Number(prev.rewardAmount || 0) + 20,
                      }))
                    }
                  >
                    <Text style={styles.editSuyoQuickAddText}>+₱20</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.editSuyoQuickAddPill}
                    activeOpacity={0.75}
                    onPress={() =>
                      setEditingSuyoData((prev) => ({
                        ...prev,
                        rewardAmount: Number(prev.rewardAmount || 0) + 50,
                      }))
                    }
                  >
                    <Text style={styles.editSuyoQuickAddText}>+₱50</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <Text style={styles.editSuyoInputLabel}>Task Description</Text>
              <TextInput
                style={[styles.editSuyoTextInput, styles.editSuyoTextArea]}
                value={editingSuyoData.details}
                onChangeText={(text) =>
                  setEditingSuyoData((prev) => ({ ...prev, details: text }))
                }
                multiline={true}
                numberOfLines={3}
                placeholder="Detailed task description..."
                placeholderTextColor="#94A3B8"
              />

              <Text style={styles.editSuyoInputLabel}>
                Special Notes / Instructions (Optional)
              </Text>
              <TextInput
                style={[styles.editSuyoTextInput, styles.editSuyoTextArea]}
                value={editingSuyoData.notes}
                onChangeText={(text) =>
                  setEditingSuyoData((prev) => ({ ...prev, notes: text }))
                }
                multiline={true}
                numberOfLines={2}
                placeholder="e.g. Please ask for the receipt"
                placeholderTextColor="#94A3B8"
              />
            </ScrollView>

            <View style={styles.editSuyoActionsRow}>
              <TouchableOpacity
                style={styles.editSuyoCancelBtn}
                onPress={() => setIsEditingSuyoModalOpen(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.editSuyoCancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.editSuyoSaveBtn}
                onPress={handleSaveEditedSuyo}
                activeOpacity={0.8}
              >
                <Ionicons
                  name="checkmark-sharp"
                  size={16}
                  color="#FFFFFF"
                />
                <Text style={styles.editSuyoSaveBtnText}>Save Changes</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ========================================================== */}
      {/* 7. FAVORITES SUYOS MODAL                                   */}
      {/* ========================================================== */}
      <Modal
        visible={isFavoritesModalOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={handleCloseFavoritesModal}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.favoritesModalCard}>
            <View style={styles.favoritesModalHeader}>
              <View style={styles.favoritesTitleRow}>
                <Text style={styles.favoritesModalTitle}>
                  {isFavDeleteMode ? 'Select to Remove' : 'Saved Favorites'}
                </Text>
                {favoriteSuyos.length > 0 && (
                  <View
                    style={[
                      styles.favoritesCountPill,
                      isFavDeleteMode && { backgroundColor: '#FEE2E2' },
                    ]}
                  >
                    <Text
                      style={[
                        styles.favoritesCountText,
                        isFavDeleteMode && { color: '#DC2626' },
                      ]}
                    >
                      {isFavDeleteMode
                        ? `${selectedFavIdsToDelete.length} selected`
                        : favoriteSuyos.length}
                    </Text>
                  </View>
                )}
              </View>

              <TouchableOpacity
                onPress={handleCloseFavoritesModal}
                style={styles.modalCloseButton}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="close"
                  size={18}
                  color="#163523"
                />
              </TouchableOpacity>
            </View>

            {/* Sub-header row with fading text 'Edit' */}
            <View style={styles.favSubHeaderRow}>
              <Text style={styles.favoritesModalSub}>
                {isFavDeleteMode
                  ? 'Tap items to select what to remove:'
                  : "Suyos you've saved to review or fulfill later"}
              </Text>

              {favoriteSuyos.length > 0 && (
                <View style={styles.favSubHeaderActions}>
                  {isFavDeleteMode && favoriteSuyos.length > 1 && (
                    <TouchableOpacity
                      onPress={() => {
                        if (
                          selectedFavIdsToDelete.length === favoriteSuyos.length
                        ) {
                          setSelectedFavIdsToDelete([]);
                        } else {
                          setSelectedFavIdsToDelete(
                            favoriteSuyos.map((s) => s.id),
                          );
                        }
                      }}
                      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                    >
                      <Text style={styles.favSelectAllText}>
                        {selectedFavIdsToDelete.length === favoriteSuyos.length
                          ? 'Deselect all'
                          : 'Select all'}
                      </Text>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity
                    onPress={handleToggleFavDeleteMode}
                    activeOpacity={0.6}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Text style={styles.favFadingEditText}>
                      {isFavDeleteMode ? 'Cancel' : 'Edit'}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {toastConfig && (
              <View style={styles.favModalToast}>
                <Ionicons
                  name={
                    toastConfig.icon === 'heart-dislike' ? 'trash' : 'heart'
                  }
                  size={12}
                  color="#DC2626"
                />
                <Text style={styles.favModalToastText}>
                  {toastConfig.message}
                </Text>
              </View>
            )}

            {favoriteSuyos.length > 0 ? (
              <ScrollView
                style={styles.favoritesScrollList}
                contentContainerStyle={{ paddingBottom: 4 }}
                showsVerticalScrollIndicator={false}
              >
                {favoriteSuyos.map((suyo) => {
                  const isSelected = selectedFavIdsToDelete.includes(suyo.id);
                  return (
                    <TouchableOpacity
                      key={suyo.id}
                      style={[
                        styles.favCardItem,
                        isFavDeleteMode &&
                          isSelected &&
                          styles.favCardItemSelected,
                      ]}
                      activeOpacity={0.85}
                      onPress={() => {
                        if (isFavDeleteMode) {
                          handleToggleSelectFavToDelete(suyo.id);
                        } else {
                          setOpenedFromFavorites(true);
                          setIsFavoritesModalOpen(false);
                          handleOpenSuyoDetail(suyo);
                        }
                      }}
                    >
                      <View style={styles.favCardTopRow}>
                        {isFavDeleteMode && (
                          <View
                            style={[
                              styles.favSelectionCircle,
                              isSelected && styles.favSelectionCircleSelected,
                            ]}
                          >
                            {isSelected && (
                              <Ionicons
                                name="checkmark"
                                size={11}
                                color="#FFFFFF"
                              />
                            )}
                          </View>
                        )}

                        <View style={{ flex: 1, paddingRight: 8 }}>
                          <Text
                            style={styles.favCardTitle}
                            numberOfLines={2}
                          >
                            {suyo.title}
                          </Text>
                          <Text style={styles.favCardLocation}>
                            <Ionicons
                              name="location-sharp"
                              size={10.5}
                              color="#0D9488"
                            />{' '}
                            {suyo.location || 'Quezon City'} •{' '}
                            {suyo.distanceText || '0.8 km away'}
                          </Text>
                        </View>

                        <View
                          style={{
                            alignItems: 'flex-end',
                            justifyContent: 'center',
                          }}
                        >
                          <Text style={styles.favCardReward}>
                            {suyo.reward}
                          </Text>
                        </View>
                      </View>

                      <View
                        style={[
                          styles.favCardBottomRow,
                          isFavDeleteMode && { paddingLeft: 25 },
                        ]}
                      >
                        <View style={styles.favCardRequestorRow}>
                          <View style={styles.favAvatarCircle}>
                            <Text style={styles.favAvatarInitials}>
                              {suyo.requesterInitials ||
                                getInitials(
                                  suyo.requesterName || 'Maria Clarissa',
                                )}
                            </Text>
                          </View>
                          <Text style={styles.favCardRequestorName}>
                            {suyo.requesterName || 'Maria Clarissa'}
                          </Text>
                        </View>

                        <View
                          style={[
                            styles.favTagPill,
                            suyo.tag === 'Urgent'
                              ? styles.favTagUrgent
                              : suyo.tag === 'Due today'
                                ? styles.favTagToday
                                : suyo.tag === 'Normal'
                                  ? styles.favTagNormal
                                  : styles.favTagTomorrow,
                          ]}
                        >
                          <Text
                            style={[
                              styles.favTagPillText,
                              suyo.tag === 'Urgent'
                                ? styles.favTagUrgentText
                                : suyo.tag === 'Due today'
                                  ? styles.favTagTodayText
                                  : suyo.tag === 'Normal'
                                    ? styles.favTagNormalText
                                    : styles.favTagTomorrowText,
                            ]}
                          >
                            {suyo.tag}
                          </Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            ) : (
              <View style={styles.favEmptyBox}>
                <Ionicons
                  name="bookmark-outline"
                  size={36}
                  color="#A3B8AC"
                />
                <Text style={styles.favEmptyTitle}>No saved suyos yet</Text>
                <Text style={styles.favEmptySub}>
                  Tap the heart icon on any suyo to save it here for later.
                </Text>
              </View>
            )}

            {isFavDeleteMode ? (
              <View style={styles.favDeleteActionsRow}>
                <TouchableOpacity
                  style={styles.favCancelBottomBtn}
                  onPress={handleToggleFavDeleteMode}
                  activeOpacity={0.7}
                >
                  <Text style={styles.favCancelBottomBtnText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.favConfirmDeleteBtn,
                    selectedFavIdsToDelete.length === 0 &&
                      styles.favConfirmDeleteBtnDisabled,
                  ]}
                  onPress={handleConfirmDeleteSelectedFavs}
                  disabled={selectedFavIdsToDelete.length === 0}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name="trash-outline"
                    size={13.5}
                    color={
                      selectedFavIdsToDelete.length > 0 ? '#FFFFFF' : '#8CA395'
                    }
                  />
                  <Text
                    style={[
                      styles.favConfirmDeleteBtnText,
                      selectedFavIdsToDelete.length === 0 &&
                        styles.favConfirmDeleteBtnTextDisabled,
                    ]}
                  >
                    {selectedFavIdsToDelete.length > 0
                      ? `Remove Selected (${selectedFavIdsToDelete.length})`
                      : 'Select to remove'}
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.favCloseBottomBtn}
                onPress={handleCloseFavoritesModal}
                activeOpacity={0.7}
              >
                <Text style={styles.favCloseBottomBtnText}>Done</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>

      {/* ========================================================== */}
      {/* 7.5 FUNCTIONAL NOTIFICATIONS INBOX MODAL                   */}
      {/* ========================================================== */}
      <Modal
        visible={isNotificationsModalOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsNotificationsModalOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.notificationsModalCard}>
            {/* Header */}
            <View style={styles.notifModalHeader}>
              <View style={styles.notifTitleRow}>
                <Ionicons
                  name="notifications"
                  size={20}
                  color="#1E4D2B"
                />
                <Text style={styles.notifModalTitle}>Notifications</Text>
                {unreadNotificationsCount > 0 && (
                  <View style={styles.notifCountPill}>
                    <Text style={styles.notifCountText}>
                      {unreadNotificationsCount} new
                    </Text>
                  </View>
                )}
              </View>

              <TouchableOpacity
                onPress={() => setIsNotificationsModalOpen(false)}
                style={styles.modalCloseButton}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="close"
                  size={20}
                  color="#163523"
                />
              </TouchableOpacity>
            </View>

            {/* Quick Actions & Filter Row */}
            <View style={styles.notifTopActionsRow}>
              <View style={styles.notifFilterPillsWrap}>
                <TouchableOpacity
                  style={[
                    styles.notifFilterPill,
                    notificationFilter === 'All' &&
                      styles.notifFilterPillActive,
                  ]}
                  onPress={() => setNotificationFilter('All')}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.notifFilterPillText,
                      notificationFilter === 'All' &&
                        styles.notifFilterPillTextActive,
                    ]}
                  >
                    All ({notifications.length})
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.notifFilterPill,
                    notificationFilter === 'Unread' &&
                      styles.notifFilterPillActive,
                  ]}
                  onPress={() => setNotificationFilter('Unread')}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.notifFilterPillText,
                      notificationFilter === 'Unread' &&
                        styles.notifFilterPillTextActive,
                    ]}
                  >
                    Unread ({unreadNotificationsCount})
                  </Text>
                </TouchableOpacity>
              </View>

              {unreadNotificationsCount > 0 && (
                <TouchableOpacity
                  onPress={markAllNotificationsRead}
                  style={styles.notifMarkAllReadBtn}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name="checkmark-done"
                    size={14}
                    color="#1E4D2B"
                  />
                  <Text style={styles.notifMarkAllReadText}>Mark read</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Notifications List */}
            {notifications.filter((n) =>
              notificationFilter === 'Unread' ? n.unread : true,
            ).length > 0 ? (
              <ScrollView
                style={styles.notifScrollList}
                contentContainerStyle={{ paddingBottom: 6 }}
                showsVerticalScrollIndicator={false}
              >
                {notifications
                  .filter((n) =>
                    notificationFilter === 'Unread' ? n.unread : true,
                  )
                  .map((item) => (
                    <SwipeableNotificationItem
                      key={item.id}
                      item={item}
                      onPress={handleTapNotification}
                      onMarkRead={markNotificationRead}
                      onRemove={removeNotification}
                    />
                  ))}
              </ScrollView>
            ) : (
              <View style={styles.notifEmptyBox}>
                <Ionicons
                  name="notifications-off-outline"
                  size={46}
                  color="#A3B8AC"
                />
                <Text style={styles.notifEmptyTitle}>
                  {notificationFilter === 'Unread'
                    ? 'No unread notifications'
                    : 'No notifications'}
                </Text>
                <Text style={styles.notifEmptySub}>
                  {notificationFilter === 'Unread'
                    ? 'You are all caught up with your suyo updates and rewards.'
                    : 'Important activity, doer arrivals, and reward credits will appear here.'}
                </Text>
              </View>
            )}

            {/* Bottom Actions */}
            <View style={styles.notifModalBottomRow}>
              {notifications.length > 0 && (
                <TouchableOpacity
                  style={styles.notifClearBtn}
                  onPress={clearAllNotifications}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name="trash-outline"
                    size={15}
                    color="#64748B"
                  />
                  <Text style={styles.notifClearBtnText}>Clear All</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={styles.notifDoneBtn}
                onPress={() => setIsNotificationsModalOpen(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.notifDoneBtnText}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ========================================================== */}
      {/* 7. DIGITAL E-RECEIPT MODAL (Verified Proof & Cost Breakdown) */}
      {/* ========================================================== */}
      <Modal
        visible={Boolean(selectedReceipt)}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedReceipt(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.receiptModalCard}>
            {/* Header */}
            <View style={styles.receiptModalHeader}>
              <View
                style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}
              >
                <View style={styles.receiptHeaderBadge}>
                  <Ionicons
                    name="checkmark-done-circle"
                    size={18}
                    color="#15803D"
                  />
                </View>
                <Text style={styles.receiptModalHeaderTitle}>
                  Official E-Receipt
                </Text>
              </View>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setSelectedReceipt(null)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="close"
                  size={18}
                  color="#163523"
                />
              </TouchableOpacity>
            </View>

            {selectedReceipt && (
              <ScrollView
                style={styles.receiptScrollContent}
                showsVerticalScrollIndicator={false}
              >
                {/* Ticket Body */}
                <View style={styles.receiptTicketBox}>
                  <Text style={styles.receiptBrandTitle}>
                    SUYOLINK PHILIPPINES
                  </Text>
                  <Text style={styles.receiptBrandTag}>
                    Community Suyo & Courier Platform
                  </Text>
                  <Text style={styles.receiptRefDisplay}>
                    {selectedReceipt.refNo}
                  </Text>

                  <View style={styles.receiptDashedLine} />

                  {/* General Info */}
                  <View style={styles.receiptRow}>
                    <Text style={styles.receiptLabel}>Transaction Date:</Text>
                    <Text style={styles.receiptValue}>
                      {selectedReceipt.date}
                    </Text>
                  </View>
                  <View style={styles.receiptRow}>
                    <Text style={styles.receiptLabel}>Status:</Text>
                    <Text
                      style={[
                        styles.receiptValue,
                        { color: '#15803D', fontWeight: '700' },
                      ]}
                    >
                      {selectedReceipt.status} · Verified
                    </Text>
                  </View>
                  <View style={styles.receiptRow}>
                    <Text style={styles.receiptLabel}>Category:</Text>
                    <Text style={styles.receiptValue}>
                      {selectedReceipt.category}
                    </Text>
                  </View>
                  <View style={styles.receiptRow}>
                    <Text style={styles.receiptLabel}>Suyo / Task:</Text>
                    <Text
                      style={[
                        styles.receiptValue,
                        { flex: 1, textAlign: 'right' },
                      ]}
                    >
                      {selectedReceipt.title}
                    </Text>
                  </View>
                  <View style={styles.receiptRow}>
                    <Text style={styles.receiptLabel}>Location:</Text>
                    <Text style={styles.receiptValue}>
                      {selectedReceipt.location}
                    </Text>
                  </View>

                  <View style={styles.receiptDashedLine} />

                  {/* Personnel */}
                  {selectedReceipt.doer && (
                    <View style={styles.receiptRow}>
                      <Text style={styles.receiptLabel}>Assigned Courier:</Text>
                      <Text style={styles.receiptValue}>
                        {selectedReceipt.doer.name} (
                        {selectedReceipt.doer.rating})
                      </Text>
                    </View>
                  )}
                  {selectedReceipt.requesterName && (
                    <View style={styles.receiptRow}>
                      <Text style={styles.receiptLabel}>Requester:</Text>
                      <Text style={styles.receiptValue}>
                        {selectedReceipt.requesterName}
                      </Text>
                    </View>
                  )}
                  <View style={styles.receiptRow}>
                    <Text style={styles.receiptLabel}>Payment Method:</Text>
                    <Text style={styles.receiptValue}>
                      {selectedReceipt.paymentMethod}
                    </Text>
                  </View>
                  <View style={styles.receiptRow}>
                    <Text style={styles.receiptLabel}>Payment Ref #:</Text>
                    <Text style={styles.receiptValue}>
                      {selectedReceipt.paymentRef}
                    </Text>
                  </View>

                  <View style={styles.receiptDashedLine} />

                  {/* Financial Breakdown */}
                  <View style={styles.receiptRow}>
                    <Text style={styles.receiptLabel}>Base Suyo Reward:</Text>
                    <Text style={styles.receiptValue}>
                      ₱{selectedReceipt.amount.toFixed(2)}
                    </Text>
                  </View>
                  {selectedReceipt.platformFee > 0 && (
                    <View style={styles.receiptRow}>
                      <Text style={styles.receiptLabel}>
                        Platform Convenience Fee:
                      </Text>
                      <Text style={styles.receiptValue}>
                        ₱{selectedReceipt.platformFee.toFixed(2)}
                      </Text>
                    </View>
                  )}

                  <View style={styles.receiptTotalRow}>
                    <Text style={styles.receiptTotalLabel}>Total Amount:</Text>
                    <Text style={styles.receiptTotalValue}>
                      ₱{selectedReceipt.totalAmount.toFixed(2)}
                    </Text>
                  </View>

                  {/* Proof Badge */}
                  <View style={styles.receiptProofBox}>
                    <Ionicons
                      name="shield-checkmark"
                      size={17}
                      color="#059669"
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.receiptProofTitle}>
                        Proof of Delivery Verified
                      </Text>
                      <Text style={styles.receiptProofSub}>
                        {selectedReceipt.proofDetails ||
                          'Cryptographically stamped photo & GPS handover verified by SuyoLink.'}
                      </Text>
                    </View>
                  </View>

                  {/* Barcode Simulator */}
                  <View style={styles.receiptBarcodeBox}>
                    <View style={styles.receiptBarcodeBars} />
                    <Text style={styles.receiptBarcodeText}>
                      * {selectedReceipt.refNo} *
                    </Text>
                  </View>
                </View>

                {/* Action Buttons */}
                <View style={styles.receiptActionsRow}>
                  <TouchableOpacity
                    style={styles.receiptShareActionBtn}
                    onPress={() => {
                      triggerToast(
                        'E-Receipt downloaded & saved to device',
                        'download-outline',
                      );
                    }}
                    activeOpacity={0.8}
                  >
                    <Ionicons
                      name="share-social-outline"
                      size={15}
                      color="#163523"
                    />
                    <Text style={styles.receiptShareActionBtnText}>
                      Save / Share Receipt
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.receiptCloseActionBtn}
                    onPress={() => setSelectedReceipt(null)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.receiptCloseActionBtnText}>Done</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* ========================================================== */}
      {/* 8. STATISTICS MODAL (Suyo Performance & Community Stats) */}
      {/* ========================================================== */}
      <Modal
        visible={isStatisticsModalOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsStatisticsModalOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.statsModalCard}>
            <View style={styles.modalHeaderRow}>
              <View
                style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}
              >
                <View style={styles.statsIconBadge}>
                  <Ionicons
                    name="stats-chart"
                    size={17}
                    color="#0284C7"
                  />
                </View>
                <Text style={styles.modalTitle}>Suyo Statistics</Text>
              </View>
              <TouchableOpacity
                onPress={() => setIsStatisticsModalOpen(false)}
                style={styles.modalCloseButton}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="close"
                  size={20}
                  color="#163523"
                />
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              style={styles.statsScrollView}
              contentContainerStyle={{ paddingBottom: 4 }}
            >
              {/* Top Overview Cards: 2x2 Grid */}
              <View style={styles.statsMetricsGrid}>
                <View style={styles.statsMetricTile}>
                  <Text style={styles.statsTileValue}>₱1,280.00</Text>
                  <Text style={styles.statsTileLabel}>Total Tracked</Text>
                  <Text style={styles.statsTileSub}>7 Accepted Suyos</Text>
                </View>
                <View style={styles.statsMetricTile}>
                  <Text style={[styles.statsTileValue, { color: '#059669' }]}>
                    100%
                  </Text>
                  <Text style={styles.statsTileLabel}>Completion</Text>
                  <Text style={styles.statsTileSub}>0 Cancellations</Text>
                </View>
              </View>

              <View style={[styles.statsMetricsGrid, { marginTop: 8 }]}>
                <View style={styles.statsMetricTile}>
                  <Text style={styles.statsTileValue}>4.95★</Text>
                  <Text style={styles.statsTileLabel}>Customer Rating</Text>
                  <Text style={styles.statsTileSub}>142 Reviews</Text>
                </View>
                <View style={styles.statsMetricTile}>
                  <Text style={[styles.statsTileValue, { color: '#059669' }]}>
                    99.4%
                  </Text>
                  <Text style={styles.statsTileLabel}>Satisfaction</Text>
                  <Text style={styles.statsTileSub}>Positive Feedback</Text>
                </View>
              </View>

              {/* Customer Satisfaction Breakdown Graph */}
              <View style={styles.statsCategoryCard}>
                <View style={styles.statsCategoryHeaderRow}>
                  <View style={{ flex: 1, paddingRight: 6 }}>
                    <Text style={styles.statsSectionHeading}>
                      Customer Satisfaction
                    </Text>
                    <Text style={styles.statsSectionSubheading}>
                      Community ratings (142 reviews)
                    </Text>
                  </View>
                  <View style={styles.statsSatisfactionScoreBadge}>
                    <Ionicons
                      name="star"
                      size={12}
                      color="#F59E0B"
                    />
                    <Text style={styles.statsSatisfactionScoreText}>
                      4.95 / 5.0
                    </Text>
                  </View>
                </View>

                {/* Rating Distribution Bar Graph */}
                <View style={styles.csatBarsContainer}>
                  {/* 5 Stars */}
                  <View style={styles.csatBarRow}>
                    <View style={styles.csatStarLabelRow}>
                      <Text style={styles.csatStarText}>5</Text>
                      <Ionicons
                        name="star"
                        size={10}
                        color="#F59E0B"
                      />
                    </View>
                    <View style={styles.csatTrack}>
                      <View
                        style={[
                          styles.csatFill,
                          { width: '94%', backgroundColor: '#059669' },
                        ]}
                      />
                    </View>
                    <Text style={styles.csatPctText}>94% (134)</Text>
                  </View>

                  {/* 4 Stars */}
                  <View style={styles.csatBarRow}>
                    <View style={styles.csatStarLabelRow}>
                      <Text style={styles.csatStarText}>4</Text>
                      <Ionicons
                        name="star"
                        size={10}
                        color="#F59E0B"
                      />
                    </View>
                    <View style={styles.csatTrack}>
                      <View
                        style={[
                          styles.csatFill,
                          { width: '5%', backgroundColor: '#0284C7' },
                        ]}
                      />
                    </View>
                    <Text style={styles.csatPctText}>5% (7)</Text>
                  </View>

                  {/* 3 Stars */}
                  <View style={styles.csatBarRow}>
                    <View style={styles.csatStarLabelRow}>
                      <Text style={styles.csatStarText}>3</Text>
                      <Ionicons
                        name="star"
                        size={10}
                        color="#F59E0B"
                      />
                    </View>
                    <View style={styles.csatTrack}>
                      <View
                        style={[
                          styles.csatFill,
                          { width: '1%', backgroundColor: '#D97706' },
                        ]}
                      />
                    </View>
                    <Text style={styles.csatPctText}>1% (1)</Text>
                  </View>

                  {/* 2 Stars */}
                  <View style={styles.csatBarRow}>
                    <View style={styles.csatStarLabelRow}>
                      <Text style={styles.csatStarText}>2</Text>
                      <Ionicons
                        name="star"
                        size={10}
                        color="#CBD5E1"
                      />
                    </View>
                    <View style={styles.csatTrack}>
                      <View
                        style={[
                          styles.csatFill,
                          { width: '0%', backgroundColor: '#94A3B8' },
                        ]}
                      />
                    </View>
                    <Text style={styles.csatPctText}>0% (0)</Text>
                  </View>

                  {/* 1 Star */}
                  <View style={styles.csatBarRow}>
                    <View style={styles.csatStarLabelRow}>
                      <Text style={styles.csatStarText}>1</Text>
                      <Ionicons
                        name="star"
                        size={10}
                        color="#CBD5E1"
                      />
                    </View>
                    <View style={styles.csatTrack}>
                      <View
                        style={[
                          styles.csatFill,
                          { width: '0%', backgroundColor: '#94A3B8' },
                        ]}
                      />
                    </View>
                    <Text style={styles.csatPctText}>0% (0)</Text>
                  </View>
                </View>

                {/* Key Satisfaction Metric Badges */}
                <View style={styles.csatHighlightsRow}>
                  <View style={styles.csatHighlightChip}>
                    <Ionicons
                      name="checkmark-circle"
                      size={12}
                      color="#059669"
                    />
                    <Text
                      style={styles.csatHighlightText}
                      numberOfLines={1}
                    >
                      Punctual (98%)
                    </Text>
                  </View>
                  <View style={styles.csatHighlightChip}>
                    <Ionicons
                      name="shield-checkmark"
                      size={12}
                      color="#0284C7"
                    />
                    <Text
                      style={styles.csatHighlightText}
                      numberOfLines={1}
                    >
                      Careful (99%)
                    </Text>
                  </View>
                </View>
              </View>

              {/* Payment & Settlement Note */}
              <View style={styles.statsInfoNotice}>
                <Ionicons
                  name="call-outline"
                  size={14}
                  color="#1E4D2B"
                />
                <Text style={styles.statsInfoNoticeText}>
                  All payment settlements are arranged directly between
                  requesters and doers via call or conversation outside the app.
                </Text>
              </View>
            </ScrollView>

            <TouchableOpacity
              style={styles.statsDoneButton}
              onPress={() => setIsStatisticsModalOpen(false)}
              activeOpacity={0.8}
            >
              <Text style={styles.statsDoneButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

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

      <Animated.View
        style={[
          styles.sidebarDrawer,
          {
            width: SIDEBAR_WIDTH,
            transform: [{ translateX: sidebarAnim }],
          },
        ]}
      >
        <SafeAreaView
          edges={['top', 'bottom']}
          style={styles.sidebarSafeArea}
        >
          <View style={styles.sidebarHeader}>
            <View style={styles.sidebarBrandRow}>
              <View style={styles.sidebarLogoCircle}>
                <Ionicons
                  name="paper-plane"
                  size={16}
                  color="#1E4D2B"
                />
              </View>
              <Text style={styles.sidebarBrandTitle}>SuyoLink</Text>
            </View>
            <TouchableOpacity
              onPress={closeSidebar}
              style={styles.sidebarCloseButton}
              activeOpacity={0.7}
            >
              <Ionicons
                name="close"
                size={20}
                color="#163523"
              />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.sidebarScroll}
            contentContainerStyle={styles.sidebarScrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Account Card (Matches Suyo Detail Accounts Style) */}
            <TouchableOpacity
              style={styles.sidebarAccountCard}
              activeOpacity={0.75}
              onPress={() => {
                closeSidebar();
                router.push('/account');
              }}
              accessibilityRole="button"
              accessibilityLabel="View account"
            >
              <View style={styles.detailAvatarCircle}>
                <Text style={styles.detailAvatarInitials}>
                  {getInitials(userProfile?.name || 'Juan Dela Cruz')}
                </Text>
              </View>
              <View style={styles.detailRequestorTextCol}>
                <View style={styles.sidebarAccountNameRow}>
                  <Text
                    style={styles.detailRequestorName}
                    numberOfLines={1}
                  >
                    {userProfile?.name || 'Juan Dela Cruz'}
                  </Text>
                  <TouchableOpacity
                    onPress={(e) => {
                      e?.stopPropagation?.();
                      setTempProfile({ ...userProfile });
                      setIsEditModalOpen(true);
                    }}
                    style={styles.smallEditIconButton}
                    activeOpacity={0.75}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    accessibilityRole="button"
                    accessibilityLabel="Edit profile"
                  >
                    <Ionicons
                      name="pencil"
                      size={13}
                      color="#1E4D2B"
                    />
                  </TouchableOpacity>
                </View>
                <Text style={styles.detailRequestorMeta}>
                  4.9★ - 48 completed
                </Text>
                <View style={styles.detailRequestorPhoneRow}>
                  <Ionicons
                    name="call"
                    size={11}
                    color="#6D8777"
                  />
                  <Text style={styles.detailRequestorPhoneText}>
                    {userProfile?.phone || '+63 917 123 4567'}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>

            <View style={styles.sidebarDivider} />
            <Text style={styles.sidebarSectionTitle}>Menu & Preferences</Text>

            {/* Wallet Nav Item in Sidebar (Transferred from dashboard nav) */}
            <TouchableOpacity
              style={styles.sidebarMenuItem}
              activeOpacity={0.75}
              accessibilityRole="button"
              accessibilityLabel="Wallet"
              onPress={() => {
                closeSidebar();
                setActiveTab('wallet');
              }}
            >
              <View style={styles.menuItemLeft}>
                <View
                  style={[
                    styles.menuItemIconCircle,
                    { backgroundColor: '#DCFCE7' },
                  ]}
                >
                  <Ionicons
                    name="wallet-outline"
                    size={18}
                    color="#059669"
                  />
                </View>
                <View style={styles.menuItemTextCol}>
                  <Text style={styles.menuItemTitle}>Wallet</Text>
                  <Text style={styles.menuItemSub}>
                    Earnings, balance & charts
                  </Text>
                </View>
              </View>
              <Ionicons
                name="chevron-forward"
                size={16}
                color="#7A9384"
              />
            </TouchableOpacity>

            {/* Transaction History Nav Item in Sidebar (Transferred from profile) */}
            <TouchableOpacity
              style={styles.sidebarMenuItem}
              activeOpacity={0.75}
              accessibilityRole="button"
              accessibilityLabel="Transaction History"
              onPress={() => {
                closeSidebar();
                router.push('/transactions');
              }}
            >
              <View style={styles.menuItemLeft}>
                <View
                  style={[
                    styles.menuItemIconCircle,
                    { backgroundColor: '#DCFCE7' },
                  ]}
                >
                  <Ionicons
                    name="receipt-outline"
                    size={18}
                    color="#059669"
                  />
                </View>
                <View style={styles.menuItemTextCol}>
                  <Text style={styles.menuItemTitle}>Transaction History</Text>
                  <Text style={styles.menuItemSub}>
                    Completed suyos & reward totals
                  </Text>
                </View>
              </View>
              <Ionicons
                name="chevron-forward"
                size={16}
                color="#7A9384"
              />
            </TouchableOpacity>

            {/* About SuyoLink */}
            <TouchableOpacity
              style={styles.sidebarMenuItem}
              activeOpacity={0.75}
              onPress={() => toggleSection('about')}
            >
              <View style={styles.menuItemLeft}>
                <View
                  style={[
                    styles.menuItemIconCircle,
                    { backgroundColor: '#F4ECE4' },
                  ]}
                >
                  <Ionicons
                    name="information-circle-outline"
                    size={18}
                    color="#9E581B"
                  />
                </View>
                <View style={styles.menuItemTextCol}>
                  <Text style={styles.menuItemTitle}>About SuyoLink</Text>
                  <Text style={styles.menuItemSub}>
                    v1.0.0 • Hyperlocal Suyos
                  </Text>
                </View>
              </View>
              <Ionicons
                name={
                  expandedSection === 'about' ? 'chevron-up' : 'chevron-down'
                }
                size={18}
                color="#7A9384"
              />
            </TouchableOpacity>

            {expandedSection === 'about' && (
              <View style={styles.expandedSubCard}>
                <Text style={styles.aboutParagraph}>
                  SuyoLink connects you with reliable local doers to handle
                  favors, document suyos, and express deliveries securely in
                  your community.
                </Text>
                <View style={styles.aboutMetaRow}>
                  <Text style={styles.aboutMetaLabel}>App Version:</Text>
                  <Text style={styles.aboutMetaValue}>
                    1.0.0 (Build 2026.1)
                  </Text>
                </View>
              </View>
            )}

            {/* Push Notifications (Placed under About SuyoLink) */}
            <View style={styles.sidebarMenuItem}>
              <View style={styles.menuItemLeft}>
                <View
                  style={[
                    styles.menuItemIconCircle,
                    { backgroundColor: '#EAF4EF' },
                  ]}
                >
                  <Ionicons
                    name="notifications-outline"
                    size={18}
                    color="#1E4D2B"
                  />
                </View>
                <View style={styles.menuItemTextCol}>
                  <Text style={styles.menuItemTitle}>Push Notifications</Text>
                  <Text style={styles.menuItemSub}>Suyo alerts & updates</Text>
                </View>
              </View>
              <Switch
                value={pushNotifications}
                onValueChange={(val) => {
                  setPushNotifications(val);
                  triggerToast(
                    val
                      ? 'Push notifications enabled'
                      : 'Push notifications muted',
                    'notifications',
                  );
                }}
                trackColor={{ false: '#D4E2DA', true: '#1E4D2B' }}
                thumbColor={pushNotifications ? '#4ADE80' : '#FFFFFF'}
              />
            </View>
          </ScrollView>

          {/* Footer Part of Sidebar (Log Out Fixed to Footer) */}
          <View style={styles.sidebarFooter}>
            <TouchableOpacity
              style={styles.logoutButton}
              activeOpacity={0.8}
              onPress={async () => {
                closeSidebar();
                try {
                  await logout();
                } catch (_) {}
                router.replace('/');
              }}
            >
              <Ionicons
                name="log-out-outline"
                size={20}
                color="#D32F2F"
              />
              <Text style={styles.logoutButtonText}>Log Out</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Animated.View>

      {/* ========================================================== */}
      {/* 9. EDIT PROFILE MODAL                                      */}
      {/* ========================================================== */}
      <Modal
        visible={isEditModalOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsEditModalOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContentCard}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>Edit Account Profile</Text>
              <TouchableOpacity
                onPress={() => setIsEditModalOpen(false)}
                style={styles.modalCloseButton}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="close"
                  size={20}
                  color="#163523"
                />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalInputLabel}>Full Name</Text>
            <TextInput
              style={styles.modalInput}
              value={tempProfile.name}
              onChangeText={(text) =>
                setTempProfile({ ...tempProfile, name: text })
              }
              placeholder="Full Name"
              placeholderTextColor="#8FA497"
            />

            <Text style={styles.modalInputLabel}>Email Address</Text>
            <TextInput
              style={styles.modalInput}
              value={tempProfile.email}
              onChangeText={(text) =>
                setTempProfile({ ...tempProfile, email: text })
              }
              placeholder="Email"
              keyboardType="email-address"
              placeholderTextColor="#8FA497"
            />

            <Text style={styles.modalInputLabel}>Contact Number</Text>
            <TextInput
              style={styles.modalInput}
              value={tempProfile.phone}
              onChangeText={(text) =>
                setTempProfile({ ...tempProfile, phone: text })
              }
              placeholder="Phone"
              keyboardType="phone-pad"
              placeholderTextColor="#8FA497"
            />

            <View style={styles.modalButtonsRow}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setIsEditModalOpen(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.modalCancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalSaveButton}
                onPress={handleSaveProfile}
                activeOpacity={0.8}
              >
                <Ionicons
                  name="checkmark"
                  size={16}
                  color="#FFFFFF"
                />
                <Text style={styles.modalSaveButtonText}>Save Changes</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

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
