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
  PanResponder,
  Platform,
  Linking,
  Alert,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';
import { useSuyos } from '../context/SuyoContext';
import { useDeviceLocation } from '../context/LocationContext';
import { useTheme } from '../theme/ThemeContext';
import { formatOffer } from '../data/suyoRequests';
import { distanceKm } from '../lib/geo';
import { supabase } from '../lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RefreshControl } from 'react-native';
import WalletIncomeLineGraph from '../components/wallet/WalletIncomeLineGraph';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SIDEBAR_WIDTH = Math.min(SCREEN_WIDTH * 0.82, 340);
const USE_NATIVE_DRIVER = Platform.OS !== 'web';

const getTodayFormatted = () => {
  const now = new Date();
  const d = String(now.getDate()).padStart(2, '0');
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const y = String(now.getFullYear()).slice(-2);
  return `${d}/${m}/${y}`;
};

const getTomorrowFormatted = () => {
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const d = String(tomorrow.getDate()).padStart(2, '0');
  const m = String(tomorrow.getMonth() + 1).padStart(2, '0');
  const y = String(tomorrow.getFullYear()).slice(-2);
  return `${d}/${m}/${y}`;
};

const parseDistanceKm = (val) => {
  if (val === 'Any' || val === null || val === undefined) return 'Any';
  if (typeof val === 'number') return val;
  const num = parseInt(String(val).replace(/[^0-9]/g, ''), 10);
  return isNaN(num) || num <= 0 ? 'Any' : num;
};

const getInitials = (name) => {
  if (!name || typeof name !== 'string') return 'JD';
  const clean = name
    .replace(/\s*\([^)]*\)/g, '')
    .replace(/^(atty\.|dr\.|engr\.|mr\.|ms\.|mrs\.)\s+/i, '')
    .trim();
  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'JD';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const formatDateTimeNow = () => {
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const timeStr = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  return `${dateStr} · ${timeStr}`;
};

const formatTargetDeadline = (suyo) => {
  if (!suyo) return 'Flexible completion';

  // 1. Explicit targetTime or arrivalWindow if provided
  if (suyo.targetTime && typeof suyo.targetTime === 'string') {
    return suyo.targetTime;
  }
  if (
    suyo.arrivalWindow &&
    typeof suyo.arrivalWindow === 'string' &&
    suyo.arrivalWindow !== '11:00 AM - 11:30 AM'
  ) {
    return suyo.arrivalWindow;
  }

  // 2. Separate deadlineDate and deadlineTime fields
  if (suyo.deadlineDate && suyo.deadlineTime) {
    const rawTime = String(suyo.deadlineTime).trim();
    let formattedTime = rawTime;
    const timeMatch = /^(\d{1,2}):(\d{2})$/.exec(rawTime);
    if (timeMatch) {
      const hours = parseInt(timeMatch[1], 10);
      const mins = timeMatch[2];
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const h12 = hours % 12 || 12;
      formattedTime = `${h12}:${mins} ${ampm}`;
    }

    const rawDate = String(suyo.deadlineDate).trim();
    try {
      const d = new Date(`${rawDate}T00:00:00`);
      if (!isNaN(d.getTime())) {
        const now = new Date();
        const isToday =
          d.getDate() === now.getDate() &&
          d.getMonth() === now.getMonth() &&
          d.getFullYear() === now.getFullYear();
        const tomorrow = new Date(now.getTime() + 86400000);
        const isTomorrow =
          d.getDate() === tomorrow.getDate() &&
          d.getMonth() === tomorrow.getMonth() &&
          d.getFullYear() === tomorrow.getFullYear();

        if (isToday) return `Today · ${formattedTime}`;
        if (isTomorrow) return `Tomorrow · ${formattedTime}`;
        const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        return `${dateStr} · ${formattedTime}`;
      }
    } catch (_) {}

    return `${rawDate} · ${formattedTime}`;
  }

  // 3. ISO / parseable deadline timestamp from database
  const rawDeadline =
    suyo.deadline || suyo.deadlineIso || suyo.rawRequest?.deadline;
  if (rawDeadline) {
    try {
      const d = new Date(rawDeadline);
      if (!isNaN(d.getTime())) {
        const now = new Date();
        const isToday =
          d.getDate() === now.getDate() &&
          d.getMonth() === now.getMonth() &&
          d.getFullYear() === now.getFullYear();
        const tomorrow = new Date(now.getTime() + 86400000);
        const isTomorrow =
          d.getDate() === tomorrow.getDate() &&
          d.getMonth() === tomorrow.getMonth() &&
          d.getFullYear() === tomorrow.getFullYear();

        const timeStr = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
        if (isToday) return `Today · ${timeStr}`;
        if (isTomorrow) return `Tomorrow · ${timeStr}`;

        const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        return `${dateStr} · ${timeStr}`;
      }
    } catch (_) {}
    if (typeof rawDeadline === 'string' && rawDeadline.trim()) {
      return rawDeadline.trim();
    }
  }

  // 4. Fallback to due / dueDate / timeBadge
  if (suyo.due && suyo.dueDate) {
    return `${suyo.dueDate} · ${String(suyo.due).replace(/^Due\s*/i, '')}`;
  }
  if (suyo.due) {
    return String(suyo.due);
  }
  if (suyo.timeBadge) {
    return String(suyo.timeBadge);
  }

  return 'Flexible completion';
};

const getTargetTimeBadge = (suyo) => {
  if (!suyo) return 'Flexible';
  if (suyo.urgency && ['Urgent', 'Due today', 'Due tomorrow', 'Flexible', 'Normal'].includes(suyo.urgency)) {
    return suyo.urgency;
  }
  const raw =
    suyo.deadline || suyo.deadlineIso || suyo.rawRequest?.deadline;
  if (raw) {
    const d = new Date(raw);
    if (!isNaN(d.getTime())) {
      const diffMs = d.getTime() - Date.now();
      if (diffMs < 0) return 'Overdue';
      if (diffMs <= 3 * 3600 * 1000) return 'Urgent (<3h)';
      if (diffMs <= 24 * 3600 * 1000) return 'Within 24h';
      return 'Scheduled';
    }
  }
  if (suyo.tag && (suyo.tag === 'Urgent' || suyo.tag === 'Flexible' || suyo.tag.startsWith('Due'))) return suyo.tag;
  return 'Target Time';
};

const getTargetTimeSubtext = (suyo) => {
  if (!suyo) return 'Flexible delivery or fulfillment schedule';
  const raw =
    suyo.deadline || suyo.deadlineIso || suyo.rawRequest?.deadline;
  if (raw) {
    const d = new Date(raw);
    if (!isNaN(d.getTime())) {
      const diffMs = d.getTime() - Date.now();
      if (diffMs < 0) return 'Deadline has elapsed';
      const hours = Math.round(diffMs / 3600000);
      if (hours <= 1) return 'Must be completed within the hour';
      if (hours <= 24) return `Scheduled completion within ~${hours} hrs`;
      const days = Math.round(hours / 24);
      return `Target deadline in ${days} ${days === 1 ? 'day' : 'days'}`;
    }
  }
  return 'Set by requester for courier fulfillment';
};

const INITIAL_AVAILABLE_SUYOS = [];

const DEFAULT_DOER = {
  id: 'DOER-101',
  name: 'Alex Morales',
  initials: 'AM',
  phone: '+63 917 842 1983',
  rating: '4.95★',
  reviewCount: '142 reviews',
  completedCount: '142 suyos',
  badge: 'Top Rated Courier',
  onTimeRate: '99.2%',
  bio: 'Experienced errand runner in Makati, BGC, and Tagum. Fast, reliable, and careful with parcels & documents.',
};

const INITIAL_POSTED_SUYOS = [];
const INITIAL_CANCELLED_SUYOS = [];

const INITIAL_ACCEPTED_SUYOS = [];

const INITIAL_COMPLETED_SUYOS = [];
const INITIAL_ARCHIVED_SUYOS = [];
const INITIAL_DOER_ACCEPTED_SUYOS = [];
const INITIAL_DOER_CANCELLED_SUYOS = [];
const WALLET_EARNED_SUYOS = [];
const INITIAL_ACTIVITY_RECORDS = [];

const CATEGORY_OPTIONS = ['All', 'Delivery', 'Groceries', 'Documents', 'Queuing & Bills', 'Household'];
const URGENCY_OPTIONS = ['All', 'Normal', 'Urgent', 'Due today', 'Due tomorrow', 'Flexible'];

const CATEGORY_CONFIG = {
  All: {
    gradient: ['#1E4D2B', '#163523'],
    border: '#1E4D2B',
    text: '#FFFFFF',
  },
  default: {
    gradient: ['#EAF4EF', '#D7EBE0'],
    border: '#B8DCC8',
    text: '#1E4D2B',
  },
};

const URGENCY_CONFIG = {
  All: {
    gradient: ['#1E4D2B', '#163523'],
    border: '#1E4D2B',
    text: '#FFFFFF',
  },
  Normal: {
    gradient: ['#F1F5F9', '#E2E8F0'],
    border: '#CBD5E1',
    text: '#475569',
  },
  Urgent: {
    gradient: ['#FEE2E2', '#FECACA'],
    border: '#FCA5A5',
    text: '#B91C1C',
  },
  'Due today': {
    gradient: ['#FFEDD5', '#FED7AA'],
    border: '#FDBA74',
    text: '#C2410C',
  },
  'Due tomorrow': {
    gradient: ['#FEFCE8', '#FEF9C3'],
    border: '#FDE047',
    text: '#854D0E',
  },
  Flexible: {
    gradient: ['#F3E8FF', '#E9D5FF'],
    border: '#D8B4FE',
    text: '#7E22CE',
  },
};

function SwipeableNotificationItem({
  item,
  onPress,
  onMarkRead,
  onRemove,
}) {
  const translateX = useRef(new Animated.Value(0)).current;

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return (
          Math.abs(gestureState.dx) > 10 &&
          Math.abs(gestureState.dx) > Math.abs(gestureState.dy)
        );
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dx < 0) {
          translateX.setValue(Math.max(gestureState.dx, -200));
        } else {
          translateX.setValue(0);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx < -70 || gestureState.vx < -0.45) {
          Animated.timing(translateX, {
            toValue: -SCREEN_WIDTH,
            duration: 180,
            useNativeDriver: USE_NATIVE_DRIVER,
          }).start(() => {
            onRemove(item.id);
          });
        } else {
          Animated.spring(translateX, {
            toValue: 0,
            friction: 7,
            useNativeDriver: USE_NATIVE_DRIVER,
          }).start();
        }
      },
    })
  ).current;

  const handleManualDelete = () => {
    Animated.timing(translateX, {
      toValue: -SCREEN_WIDTH,
      duration: 180,
      useNativeDriver: USE_NATIVE_DRIVER,
    }).start(() => {
      onRemove(item.id);
    });
  };

  return (
    <View style={styles.notifSwipeContainer}>
      <TouchableOpacity
        style={styles.notifDeleteActionBg}
        activeOpacity={0.8}
        onPress={handleManualDelete}
      >
        <Ionicons name="trash" size={20} color="#FFFFFF" />
        <Text style={styles.notifDeleteActionText}>Remove</Text>
      </TouchableOpacity>

      <Animated.View
        style={[
          styles.notifCardItem,
          item.unread && styles.notifCardItemUnread,
          { transform: [{ translateX }] },
        ]}
        {...panResponder.panHandlers}
      >
        <TouchableOpacity
          style={styles.notifCardInnerTouch}
          activeOpacity={0.88}
          onPress={() => onPress(item)}
        >
          <View style={styles.notifCardLeftCol}>
            <View
              style={[
                styles.notifIconCircle,
                item.category === 'doer'
                  ? styles.notifIconDoer
                  : item.category === 'task'
                  ? styles.notifIconTask
                  : item.category === 'payment'
                  ? styles.notifIconPayment
                  : styles.notifIconNearby,
              ]}
            >
              <Ionicons
                name={item.icon || 'notifications'}
                size={15}
                color={
                  item.category === 'doer'
                    ? '#1E4D2B'
                    : item.category === 'task'
                    ? '#059669'
                    : item.category === 'payment'
                    ? '#D97706'
                    : '#0D9488'
                }
              />
            </View>
          </View>

          <View style={styles.notifCardContentCol}>
            <View style={styles.notifCardTitleRow}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                  flex: 1,
                }}
              >
                <Text style={styles.notifCardTitle} numberOfLines={1}>
                  {item.title}
                </Text>
              </View>
              <Text style={styles.notifCardTime}>{item.time}</Text>
            </View>

            <Text style={styles.notifCardBody} numberOfLines={2}>
              {item.body}
            </Text>

            <View style={styles.notifCardBottomActionRow}>
              {item.targetScreen ? (
                <Text style={styles.notifActionLinkText}>
                  Tap to view fulfillment →
                </Text>
              ) : (
                <Text style={styles.notifSwipeHintText}>
                  ⇦ Swipe left to remove
                </Text>
              )}

              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                {item.unread && (
                  <TouchableOpacity
                    onPress={(e) => {
                      e.stopPropagation();
                      onMarkRead(item.id);
                    }}
                    style={styles.notifMarkSingleReadBtn}
                    hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                    accessibilityLabel="Mark read"
                  >
                    <Ionicons name="checkmark" size={12} color="#1E4D2B" />
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  onPress={(e) => {
                    e.stopPropagation();
                    handleManualDelete();
                  }}
                  style={styles.notifTrashIconBtn}
                  hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                  accessibilityLabel="Remove notification"
                >
                  <Ionicons name="trash-outline" size={12} color="#94A3B8" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

function formatRelativeTime(dateStr) {
  if (!dateStr) return 'Just now';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return 'Just now';
  const diffSec = Math.floor((Date.now() - d.getTime()) / 1000);
  if (diffSec < 60) return 'Just now';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  const diffDays = Math.floor(diffSec / 86400);
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

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
    notifications: dbNotifications = [],
    markRead: markDbNotifRead,
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
  const [postedSuyos, setPostedSuyos] = useState(INITIAL_POSTED_SUYOS);
  const [acceptedSuyos, setAcceptedSuyos] = useState([]);
  const [completedSuyos, setCompletedSuyos] = useState([]);
  const [cancelledSuyos, setCancelledSuyos] = useState([]);
  const [archivedSuyos, setArchivedSuyos] = useState([]);
  const [mySuyoNavTab, setMySuyoNavTab] = useState('posted'); // 'posted' | 'accepted' | 'completed' | 'cancelled' | 'archived'
  const [isMySuyoEditMode, setIsMySuyoEditMode] = useState(false);
  const [selectedMySuyoIdsToDelete, setSelectedMySuyoIdsToDelete] = useState([]);
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

  // Persistent tracking across device reopens and logins
  const [deletedSuyoIds, setDeletedSuyoIds] = useState(() => new Set());
  const [cancelledSuyoIds, setCancelledSuyoIds] = useState(() => new Set());
  const [dismissedNotifIds, setDismissedNotifIds] = useState(() => new Set());
  const [readNotifIds, setReadNotifIds] = useState(() => new Set());
  const [favoriteSuyoIds, setFavoriteSuyoIds] = useState([]);
  const [isFavoritesModalOpen, setIsFavoritesModalOpen] = useState(false);
  const [openedFromFavorites, setOpenedFromFavorites] = useState(false);

  // Load persisted IDs from AsyncStorage on mount / user change
  useEffect(() => {
    const scopeKey = user?.id ? user.id : 'guest';
    const loadPersistedData = async () => {
      try {
        const [storedDeleted, storedCancelled, storedDismissed, storedFavorites] = await Promise.all([
          AsyncStorage.getItem(`@suyolink_deleted_suyos_${scopeKey}`),
          AsyncStorage.getItem(`@suyolink_cancelled_suyos_${scopeKey}`),
          AsyncStorage.getItem(`@suyolink_dismissed_notifs_${scopeKey}`),
          AsyncStorage.getItem(`@suyolink_favorites_${scopeKey}`),
        ]);
        if (storedDeleted) {
          const parsed = JSON.parse(storedDeleted);
          if (Array.isArray(parsed)) setDeletedSuyoIds(new Set(parsed));
          else setDeletedSuyoIds(new Set());
        } else {
          setDeletedSuyoIds(new Set());
        }
        if (storedCancelled) {
          const parsed = JSON.parse(storedCancelled);
          if (Array.isArray(parsed)) setCancelledSuyoIds(new Set(parsed));
          else setCancelledSuyoIds(new Set());
        } else {
          setCancelledSuyoIds(new Set());
        }
        if (storedDismissed) {
          const parsed = JSON.parse(storedDismissed);
          if (Array.isArray(parsed)) setDismissedNotifIds(new Set(parsed));
          else setDismissedNotifIds(new Set());
        } else {
          setDismissedNotifIds(new Set());
        }
        if (storedFavorites) {
          const parsed = JSON.parse(storedFavorites);
          if (Array.isArray(parsed)) setFavoriteSuyoIds(parsed);
          else setFavoriteSuyoIds([]);
        } else {
          setFavoriteSuyoIds([]);
        }
      } catch (err) {
        console.warn('Error loading persisted suyo state:', err);
      }
    };
    loadPersistedData();
  }, [user?.id]);

  const persistDeletedIds = (idsToAdd) => {
    const scopeKey = user?.id ? user.id : 'guest';
    setDeletedSuyoIds((prev) => {
      const next = new Set(prev);
      idsToAdd.forEach((id) => next.add(id));
      AsyncStorage.setItem(
        `@suyolink_deleted_suyos_${scopeKey}`,
        JSON.stringify(Array.from(next))
      ).catch(() => {});
      return next;
    });
  };

  const persistCancelledId = (id) => {
    const scopeKey = user?.id ? user.id : 'guest';
    setCancelledSuyoIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      AsyncStorage.setItem(
        `@suyolink_cancelled_suyos_${scopeKey}`,
        JSON.stringify(Array.from(next))
      ).catch(() => {});
      return next;
    });
  };

  const persistDismissedNotifs = (idsToAdd) => {
    const scopeKey = user?.id ? user.id : 'guest';
    setDismissedNotifIds((prev) => {
      const next = new Set(prev);
      idsToAdd.forEach((id) => next.add(id));
      AsyncStorage.setItem(
        `@suyolink_dismissed_notifs_${scopeKey}`,
        JSON.stringify(Array.from(next))
      ).catch(() => {});
      return next;
    });
  };

  const persistFavoriteIds = (nextList) => {
    const scopeKey = user?.id ? user.id : 'guest';
    setFavoriteSuyoIds(nextList);
    AsyncStorage.setItem(
      `@suyolink_favorites_${scopeKey}`,
      JSON.stringify(nextList)
    ).catch(() => {});
  };

  // Helper to ensure every public suyo on the dashboard has a valid urgency tag
  const resolveUrgencyTag = (item) => {
    if (item?.urgency && ['Normal', 'Urgent', 'Due today', 'Due tomorrow', 'Flexible'].includes(item.urgency)) {
      return item.urgency;
    }
    const dueStr = `${item?.due || ''} ${item?.dueDate || ''}`.toLowerCase();
    if (dueStr.includes('urgent') || dueStr.includes('asap')) return 'Urgent';
    if (dueStr.includes('tomorrow')) return 'Due tomorrow';
    if (dueStr.includes('today')) return 'Due today';
    if (dueStr.includes('flexible')) return 'Flexible';
    return 'Normal';
  };

  const isMyRequest = (r) =>
    Boolean(
      (user?.id && (r.requesterId === user.id || r.requester_id === user.id || r.user_id === user.id)) ||
      (r.scope === 'posted' && user?.id) ||
      (user?.email && r.requesterEmail === user.email)
    );

  // Sync live Supabase requests & transactions with MySuyo & Doer Hub state
  useEffect(() => {
    if (!requests) return;

    const isMyAssigned = (r) =>
      (user?.id && (r.providerId === user.id || r.provider_id === user.id)) ||
      r.scope === 'assigned' ||
      r.isAcceptedByMe;

    const myPosted = requests
      .filter((r) => isMyRequest(r) && r.status === 'open' && !deletedSuyoIds.has(r.id) && !cancelledSuyoIds.has(r.id))
      .map((r) => {
        const dist = position && r.latitude && r.longitude ? distanceKm(position, r) : 0.8;
        const distNum = typeof dist === 'number' ? Number(dist.toFixed(1)) : 0.8;
        return {
          id: r.id,
          title: r.title,
          category: r.category || 'General',
          location: r.location || 'Nearby',
          distance: distNum,
          distanceText: `${distNum} km away`,
          reward: formatOffer(r.offerCentavos || 0),
          rewardAmount: (r.offerCentavos || 0) / 100,
          tag: 'Waiting for doer',
          status: 'Open - waiting for a doer',
          urgency: resolveUrgencyTag(r),
          due: r.deadline ? `Due ${new Date(r.deadline).toLocaleDateString()}` : 'Due today',
          dueDate: r.deadline ? new Date(r.deadline).toLocaleDateString() : getTodayFormatted(),
          createdAt: Date.parse(r.createdAt || Date.now()),
          formattedDate: r.createdAt ? new Date(r.createdAt).toLocaleDateString() : 'Today',
          details: r.details || '',
          notes: r.specialInstructions || '',
          requesterName: `${userProfile?.name || 'Juan Dela Cruz'} (You)`,
          requesterPhone: userProfile?.phone || '+63 917 123 4567',
          isMine: true,
          rawRequest: r,
        };
      });

    const myAccepted = requests
      .filter((r) => isMyRequest(r) && ['assigned', 'in_progress'].includes(r.status) && !deletedSuyoIds.has(r.id))
      .map((r) => ({
        id: r.id,
        title: r.title,
        category: r.category || 'General',
        location: r.location || 'Nearby',
        distanceText: 'In Progress',
        reward: `₱${((r.offerCentavos || 0) / 100).toFixed(0)}`,
        rewardAmount: (r.offerCentavos || 0) / 100,
        tag: r.status === 'in_progress' ? 'In Progress' : 'Assigned',
        status: r.status === 'in_progress' ? 'In Progress - Courier on the way' : 'Accepted - Courier assigned',
        due: r.deadline ? `Due ${new Date(r.deadline).toLocaleDateString()}` : 'Due today',
        dueDate: r.deadline ? new Date(r.deadline).toLocaleDateString() : getTodayFormatted(),
        createdAt: Date.parse(r.createdAt || Date.now()),
        formattedDate: r.createdAt ? new Date(r.createdAt).toLocaleDateString() : 'Today',
        details: r.details || '',
        notes: r.specialInstructions || '',
        requesterName: `${userProfile?.name || 'Juan Dela Cruz'} (You)`,
        isMine: true,
        rawRequest: r,
      }));

    const myCompleted = requests
      .filter((r) => isMyRequest(r) && r.status === 'completed' && !deletedSuyoIds.has(r.id))
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
        dueDate: r.deadline ? new Date(r.deadline).toLocaleDateString() : getTodayFormatted(),
        createdAt: Date.parse(r.createdAt || Date.now()),
        formattedDate: r.createdAt ? new Date(r.createdAt).toLocaleDateString() : 'Recently',
        details: r.details || '',
        notes: r.specialInstructions || '',
        requesterName: `${userProfile?.name || 'Juan Dela Cruz'} (You)`,
        isMine: true,
        rawRequest: r,
      }));

    const myCancelled = requests
      .filter((r) => isMyRequest(r) && r.status === 'cancelled' && !deletedSuyoIds.has(r.id))
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
        formattedDate: r.createdAt ? new Date(r.createdAt).toLocaleDateString() : 'Recently',
        details: r.details || '',
        notes: r.specialInstructions || '',
        requesterName: `${userProfile?.name || 'Juan Dela Cruz'} (You)`,
        isMine: true,
        rawRequest: r,
      }));

    const myAssigned = requests
      .filter((r) => isMyAssigned(r) && ['assigned', 'in_progress'].includes(r.status) && !deletedSuyoIds.has(r.id))
      .map((r) => ({
        id: r.id,
        title: r.title,
        category: r.category || 'General',
        location: r.location || 'Nearby',
        distanceText: 'In Progress',
        reward: `₱${((r.offerCentavos || 0) / 100).toFixed(0)}`,
        rewardAmount: (r.offerCentavos || 0) / 100,
        tag: r.status === 'in_progress' ? 'In Progress' : 'Assigned',
        status: r.status === 'in_progress' ? 'In Progress - On the way' : 'Accepted',
        createdAt: Date.parse(r.createdAt || Date.now()),
        details: r.details || '',
        notes: r.specialInstructions || '',
        requesterName: r.requesterName || 'Community Member',
        rawRequest: r,
      }));

    const myDoerCompleted = requests
      .filter((r) => isMyAssigned(r) && r.status === 'completed' && !deletedSuyoIds.has(r.id))
      .map((r) => ({
        id: r.id,
        title: r.title,
        category: r.category || 'General',
        location: r.location || 'Nearby',
        earnedAmount: (r.offerCentavos || 0) / 100,
        date: r.createdAt ? new Date(r.createdAt).toLocaleDateString() : 'Completed',
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
      .filter((r) => isMyAssigned(r) && r.status === 'cancelled' && !deletedSuyoIds.has(r.id))
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
    setCancelledSuyos((prev) => {
      const dbIds = new Set(myCancelled.map((m) => m.id));
      const localCancelled = prev.filter(
        (p) => !dbIds.has(p.id) && !deletedSuyoIds.has(p.id) && cancelledSuyoIds.has(p.id)
      );
      return [...myCancelled, ...localCancelled];
    });
    setDoerAcceptedSuyos(myAssigned);
    setDoerCompletedSuyos(myDoerCompleted);
    setDoerCancelledSuyos(myDoerCancelled);
  }, [requests, user?.id, user?.email, userProfile?.name, userProfile?.phone, position, deletedSuyoIds, cancelledSuyoIds]);

  // Wallet dynamic computations from live Supabase transactions
  const providerTransactions = useMemo(
    () => (transactions || []).filter((t) => t.role === 'provider'),
    [transactions]
  );
  const overallEarningsSum = useMemo(
    () => providerTransactions.reduce((sum, t) => sum + (t.rewardCentavos || 0), 0) / 100,
    [providerTransactions]
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

  const todayWalletList = dynamicWalletList.filter((s) => s.date?.startsWith('Today'));
  const todayEarningsSum = todayWalletList.reduce((sum, s) => sum + (Number(s.earnedAmount) || 0), 0);
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

  const overallCompletedCount = Math.max(overallSuyosCount, (completedSuyos?.length || 0) + (doerCompletedSuyos?.length || 0));

  // Live user rating stats fetched dynamically from Supabase ratings table
  const [userRatingStats, setUserRatingStats] = useState({
    rating: null,
    reviewCount: 0,
    breakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
    satisfactionRate: 100,
  });

  useEffect(() => {
    if (!user?.id || !supabase) return;
    const fetchUserRatings = async () => {
      try {
        const { data, error } = await supabase
          .from('ratings')
          .select('rating')
          .eq('target_user_id', user.id);
        if (!error && data && data.length > 0) {
          const count = data.length;
          const sum = data.reduce((acc, r) => acc + (Number(r.rating) || 5), 0);
          const avg = (sum / count).toFixed(1);
          const breakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
          data.forEach((r) => {
            const val = Math.round(Number(r.rating) || 5);
            if (breakdown[val] !== undefined) breakdown[val] += 1;
            else if (val >= 5) breakdown[5] += 1;
            else breakdown[1] += 1;
          });
          const positive = data.filter((r) => Number(r.rating) >= 4).length;
          setUserRatingStats({
            rating: avg,
            reviewCount: count,
            breakdown,
            satisfactionRate: Math.round((positive / count) * 100),
          });
        } else {
          setUserRatingStats({
            rating: null,
            reviewCount: 0,
            breakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
            satisfactionRate: 100,
          });
        }
      } catch (err) {
        console.warn('Could not fetch user ratings:', err);
      }
    };
    fetchUserRatings();

    const channelName = `user-ratings-dashboard-${user.id}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'ratings', filter: `target_user_id=eq.${user.id}` },
        () => {
          fetchUserRatings();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  // Overall available suyos in Dashboard: public suyos from different users + account owner's open posted suyos
  // Note: 'Waiting for doer' is a lifecycle status ONLY applied and visible to MySuyo nav;
  // on the main dashboard where public available suyos are listed for all users, the tag turns into
  // an urgency indicator: 'Normal', 'Urgent', 'Due today', or 'Due tomorrow'.
  const availableSuyosBase = useMemo(() => {
    // Exclude any requests that have been cancelled, completed, accepted, archived, or deleted
    const excludedIds = new Set([
      ...(deletedSuyoIds ? Array.from(deletedSuyoIds) : []),
      ...(cancelledSuyoIds ? Array.from(cancelledSuyoIds) : []),
      ...(cancelledSuyos || []).map((c) => c.id),
      ...(acceptedSuyos || []).map((a) => a.id),
      ...(completedSuyos || []).map((c) => c.id),
      ...(archivedSuyos || []).map((a) => a.id),
    ]);

    // 1. Owner's active posted suyos from MySuyo -> Posted tab (waiting for doers)
    const ownerPosted = (postedSuyos || [])
      .filter((p) => p.status !== 'Cancelled' && !p.status?.includes('Completed') && !excludedIds.has(p.id))
      .map((p) => {
        const urgency = resolveUrgencyTag(p);
        const distNum = typeof p.distance === 'number' ? p.distance : 0.8;
        return {
          ...p,
          distance: distNum,
          distanceText: p.distanceText || `${distNum} km away`,
          tag: urgency,
          urgency,
          reward: p.reward || (p.rewardAmount ? `₱${p.rewardAmount}` : '₱150'),
          rewardAmount: p.rewardAmount || 150,
          mySuyoStatus: p.status || 'Open - waiting for a doer',
          mySuyoTag: p.tag || 'Waiting for doer',
          isMine: true,
          postedTime: p.formattedDate || 'Active now',
          due: p.due || 'Due today',
          dueDate: p.dueDate || getTodayFormatted(),
          deadline: p.deadline || p.deadlineIso || p.rawRequest?.deadline,
          createdAt: typeof p.createdAt === 'number' ? p.createdAt : Date.parse(p.createdAt || Date.now()) || Date.now(),
          requesterName: `${userProfile?.name || 'Juan Dela Cruz'} (You)`,
          requesterPhone: userProfile?.phone || '+63 917 123 4567',
        };
      });

    const ownerPostedIds = new Set(ownerPosted.map((p) => p.id));

    // 2. Open public requests from backend
    const fromBackend = (requests || [])
      .filter((r) =>
        r.status === 'open' &&
        !excludedIds.has(r.id) &&
        !ownerPostedIds.has(r.id)
      )
      .map((r) => {
        const dist = position && r.latitude && r.longitude ? distanceKm(position, r) : 0.8;
        const distNum = typeof dist === 'number' ? Number(dist.toFixed(1)) : 0.8;
        const offer = formatOffer(r.offerCentavos || 0);
        const chosenUrgency = r.urgency || r.statusTag || r.tag;
        const urgency = resolveUrgencyTag({
          urgency: chosenUrgency,
          due: r.deadline ? 'Due ' + new Date(r.deadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Due today',
          rawRequest: r,
        });
        const isOwner =
          Boolean(
            (user?.id && (r.requesterId === user.id || r.requester_id === user.id || r.user_id === user.id)) ||
            (r.scope === 'posted' && user?.id) ||
            (user?.email && r.requesterEmail === user.email)
          );

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
          due: r.deadline ? 'Due ' + new Date(r.deadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Due today',
          dueDate: r.deadline ? new Date(r.deadline).toLocaleDateString() : getTodayFormatted(),
          deadline: r.deadline,
          details: r.details || 'No details provided.',
          notes: r.specialInstructions || '',
          requesterName: isOwner ? `${userProfile?.name || 'Juan Dela Cruz'} (You)` : (r.requesterName || 'Community Member'),
          requesterPhone: isOwner ? (userProfile?.phone || '+63 917 123 4567') : (r.requesterPhone || '+63 917 000 0000'),
          requesterRating: '4.9★',
          completedCount: '15 completed',
          isMine: isOwner,
          rawRequest: r,
        };
      });

    // Merge: Owner's open posted suyos + backend open requests without duplicate IDs.
    return [...ownerPosted, ...fromBackend];
  }, [requests, position, postedSuyos, cancelledSuyos, acceptedSuyos, completedSuyos, archivedSuyos, user?.id, userProfile?.name, userProfile?.phone, deletedSuyoIds, cancelledSuyoIds]);

  // List of suyos favorited by the user
  const favoriteSuyos = useMemo(() => {
    return availableSuyosBase.filter((suyo) =>
      favoriteSuyoIds.includes(suyo.id)
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
                  : toastConfig.icon === 'trash-outline' || toastConfig.icon === 'trash'
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
      refresh?.();
      triggerToast('suyo is successfully posted', 'paper-plane');
    }
  }, [searchParams?.justPosted, refresh]);

  const toggleFavoriteSuyo = (suyo) => {
    if (!suyo) return;
    const isFav = favoriteSuyoIds.includes(suyo.id);
    if (isFav) {
      const next = favoriteSuyoIds.filter((id) => id !== suyo.id);
      persistFavoriteIds(next);
      triggerToast('suyo is removed from favourite', 'heart-dislike');
    } else {
      const next = [...favoriteSuyoIds, suyo.id];
      persistFavoriteIds(next);
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
      suyo.isMine ||
      postedSuyos.some((p) => p.id === suyo.id) ||
      (user?.id && (suyo.requesterId === user.id || suyo.rawRequest?.requesterId === user.id || suyo.rawRequest?.requester_id === user.id)) ||
      (suyo.requesterName && (suyo.requesterName.includes('(You)') || suyo.requesterName === userProfile?.name));

    const isAccepted =
      acceptedSuyos.some((a) => a.id === suyo.id) ||
      Boolean(suyo.doer && (suyo.requesterName?.includes('(You)') || suyo.isAcceptedByMe));

    const isCompleted = completedSuyos.some((c) => c.id === suyo.id);
    const isCancelled = cancelledSuyos.some((can) => can.id === suyo.id) || suyo.status === 'Cancelled';
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
          (item.requesterName && item.requesterName.toLowerCase().includes(q)) ||
          item.category.toLowerCase().includes(q)
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

    const inProgressCount = activityRecords.filter((r) => r.status === 'In Progress').length;
    const completedCount = activityRecords.filter((r) => r.status === 'Completed').length;

    return {
      totalSpent: `₱${totalSpent.toLocaleString()}`,
      totalEarned: `₱${totalEarned.toLocaleString()}`,
      inProgressCount,
      completedCount,
      timeSaved: '18.5 hrs',
    };
  }, [activityRecords]);

  const handleExportStatement = () => {
    triggerToast('Monthly activity statement (PDF) downloaded', 'download-outline');
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
    triggerToast(`Re-posted "${record.title}". Notifying couriers...`, 'bicycle');
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
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleConfirmDeleteSelectedFavs = () => {
    if (selectedFavIdsToDelete.length === 0) return;
    const count = selectedFavIdsToDelete.length;
    const next = favoriteSuyoIds.filter((id) => !selectedFavIdsToDelete.includes(id));
    persistFavoriteIds(next);
    setSelectedFavIdsToDelete([]);
    setIsFavDeleteMode(false);
    triggerToast(
      count === 1
        ? '1 suyo removed from favorites'
        : `${count} suyos removed from favorites`,
      'heart-dislike'
    );
  };


  const handleToggleMySuyoSelect = (id) => {
    setSelectedMySuyoIdsToDelete((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleConfirmDeleteMySuyo = () => {
    if (selectedMySuyoIdsToDelete.length === 0) return;
    const toDelete = [...selectedMySuyoIdsToDelete];
    persistDeletedIds(toDelete);

    // Dismiss any notifications associated with these deleted suyos so they never show up
    const notifsToDismiss = [];
    toDelete.forEach((id) => {
      notifsToDismiss.push(id, `notif-suyo-${id}`, `notif-own-${id}`, `notif-live-${id}`);
    });
    persistDismissedNotifs(notifsToDismiss);

    // Unfavorite if deleted
    const updatedFavs = favoriteSuyoIds.filter((id) => !toDelete.includes(id));
    if (updatedFavs.length !== favoriteSuyoIds.length) {
      persistFavoriteIds(updatedFavs);
    }

    if (mySuyoNavTab === 'posted') {
      setPostedSuyos((prev) =>
        prev.filter((item) => !toDelete.includes(item.id))
      );
    } else if (mySuyoNavTab === 'cancelled') {
      setCancelledSuyos((prev) =>
        prev.filter((item) => !toDelete.includes(item.id))
      );
    } else if (mySuyoNavTab === 'archived') {
      setArchivedSuyos((prev) =>
        prev.filter((item) => !toDelete.includes(item.id))
      );
    }

    // Attempt backend delete or status cancellation
    if (supabase) {
      toDelete.forEach((id) => {
        if (typeof id === 'string' && !id.startsWith('POST-') && !id.startsWith('ARCH-')) {
          supabase.from('suyo_requests').delete().eq('id', id).then(() => {
            refresh?.();
          }).catch(() => {
            supabase.from('suyo_requests').update({ status: 'cancelled' }).eq('id', id).then(() => {
              refresh?.();
            }).catch(() => {});
          });
        }
      });
    }

    setSelectedMySuyoIdsToDelete([]);
    setIsMySuyoEditMode(false);
    triggerToast('suyo is successfully deleted', 'trash-outline');
  };

  // Edit feature for Cancelled Doer Suyos
  const handleToggleDoerCancelledSelect = (id) => {
    setSelectedDoerCancelledIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleConfirmDeleteDoerCancelled = () => {
    if (selectedDoerCancelledIds.length === 0) return;
    const toDelete = [...selectedDoerCancelledIds];
    persistDeletedIds(toDelete);
    setDoerCancelledSuyos((prev) =>
      prev.filter((item) => !toDelete.includes(item.id))
    );
    setSelectedDoerCancelledIds([]);
    setIsDoerCancelledEditMode(false);
    triggerToast('suyo is successfully deleted', 'trash-outline');
  };

  // Feature: Increase / Boost Reward (Supports resetting with +0)
  const handleBoostReward = (suyoId, addAmount) => {
    const target = postedSuyos.find((s) => s.id === suyoId) || selectedSuyo;
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
      })
    );
    let finalAmt = 150;
    if (selectedSuyo && selectedSuyo.id === suyoId) {
      const baseAmt = Number(
        selectedSuyo.baseRewardAmount ?? selectedSuyo.rewardAmount ?? 150
      );
      finalAmt = addAmount === 0 ? baseAmt : baseAmt + addAmount;
      setSelectedSuyo((prev) => ({
        ...prev,
        baseRewardAmount: baseAmt,
        currentBoost: addAmount,
        rewardAmount: finalAmt,
        reward: `₱${finalAmt}`,
        needsBoost: false,
      }));
    } else if (target) {
      const baseAmt = Number(target.baseRewardAmount ?? target.rewardAmount ?? 150);
      finalAmt = addAmount === 0 ? baseAmt : baseAmt + addAmount;
    }
    if (supabase && target) {
      const dbId = target.rawRequest?.id || (typeof target.id === 'string' && !target.id.startsWith('POST-') ? target.id : null);
      if (dbId) {
        supabase.from('suyo_requests').update({ offer_centavos: Math.round(finalAmt * 100) }).eq('id', dbId).then(() => {
          refresh?.();
        }).catch(() => {});
      }
    }
    if (addAmount === 0) {
      triggerToast('Reward boost reset to original amount', 'refresh');
    } else {
      triggerToast(`Reward increased by +₱${addAmount}! Couriers notified.`, 'sparkles');
    }
  };

  // Feature: Cancel Suyo
  const handleCancelSuyo = (suyoId) => {
    const target = postedSuyos.find((s) => s.id === suyoId) || selectedSuyo;
    persistCancelledId(suyoId);

    // Dismiss related notifications so it disappears from notifications
    persistDismissedNotifs([
      suyoId,
      `notif-suyo-${suyoId}`,
      `notif-own-${suyoId}`,
      `notif-live-${suyoId}`,
    ]);

    // Remove from favorites if favorited
    if (favoriteSuyoIds.includes(suyoId)) {
      persistFavoriteIds(favoriteSuyoIds.filter((id) => id !== suyoId));
    }

    if (target) {
      const cancelledItem = {
        ...target,
        status: 'Cancelled',
        tag: 'Cancelled',
        needsBoost: false,
        cancelledAt: 'Today',
      };
      setCancelledSuyos((prev) => [cancelledItem, ...prev.filter((s) => s.id !== suyoId)]);
      setPostedSuyos((prev) => prev.filter((s) => s.id !== suyoId));

      if (supabase && target) {
        const dbId = target.rawRequest?.id || (typeof target.id === 'string' && !target.id.startsWith('POST-') ? target.id : null);
        if (dbId) {
          // Use Supabase RPC change_suyo_status with update fallback
          supabase
            .rpc('change_suyo_status', { p_request_id: dbId, p_status: 'cancelled' })
            .then(() => {
              refresh?.();
            })
            .catch(() => {
              supabase
                .from('suyo_requests')
                .update({ status: 'cancelled' })
                .eq('id', dbId)
                .then(() => {
                  refresh?.();
                })
                .catch(() => {});
            });
        }
      }
    }
    if (selectedSuyo && selectedSuyo.id === suyoId) {
      setSelectedSuyo(null);
    }
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
          : item
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

    if (supabase && editingSuyoData.id) {
      const dbId = !String(editingSuyoData.id).startsWith('POST-') && !String(editingSuyoData.id).startsWith('ARCH-') ? editingSuyoData.id : null;
      if (dbId) {
        supabase
          .from('suyo_requests')
          .update({
            title: editingSuyoData.title.trim(),
            details: editingSuyoData.details.trim(),
            special_instructions: editingSuyoData.notes.trim(),
            offer_centavos: Math.round((Number(editingSuyoData.rewardAmount) || 150) * 100),
          })
          .eq('id', dbId)
          .then(() => {
            refresh?.();
          })
          .catch(() => {});
      }
    }

    setIsEditingSuyoModalOpen(false);
    triggerToast('Suyo details updated successfully', 'checkmark-circle');
  };

  // Feature: Save completed suyo to Archive for future repeat requests
  const handleSaveToArchive = (suyo) => {
    if (!suyo) return;
    const isAlreadyArchived = archivedSuyos.some((a) => a.id === suyo.id || a.title === suyo.title);
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
      urgency: suyo.urgency || (suyo.due?.toLowerCase().includes('tomorrow') ? 'Due tomorrow' : 'Due today'),
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

  // Functional dynamic Notifications state
  const [notifications, setNotifications] = useState([]);
  const [isNotificationsModalOpen, setIsNotificationsModalOpen] = useState(false);
  const [notificationFilter, setNotificationFilter] = useState('All'); // 'All' | 'Unread'

  // Synchronize dynamic notifications from real database records and recent requests
  useEffect(() => {
    const list = [];

    // 1. Database notifications (applications, status updates, completions)
    (dbNotifications || []).forEach((item) => {
      if (
        dismissedNotifIds.has(item.id) ||
        (item.request_id && (deletedSuyoIds.has(item.request_id) || dismissedNotifIds.has(item.request_id)))
      ) return;
      const isUnread = !item.read_at && !readNotifIds.has(item.id);
      list.push({
        id: item.id,
        title:
          item.kind === 'application'
            ? 'Doer Applied'
            : item.kind === 'application_decision'
            ? 'Application Update'
            : item.kind === 'status_update'
            ? 'Suyo In Progress'
            : item.kind === 'completed'
            ? 'Suyo Completed'
            : 'Suyo Notification',
        body: item.body,
        time: formatRelativeTime(item.created_at),
        category:
          item.kind === 'application'
            ? 'doer'
            : item.kind === 'completed'
            ? 'payment'
            : 'task',
        icon:
          item.kind === 'application'
            ? 'bicycle'
            : item.kind === 'completed'
            ? 'cash-outline'
            : 'document-text-outline',
        unread: isUnread,
        requestId: item.request_id,
        targetScreen: item.request_id ? '/suyo' : null,
      });
    });

    // 2. Real community open requests (real-time notification for nearby/new suyos)
    (requests || [])
      .filter((r) => r.status === 'open' && !isMyRequest(r) && !deletedSuyoIds.has(r.id) && !cancelledSuyoIds.has(r.id))
      .slice(0, 10)
      .forEach((r) => {
        const notifId = `notif-suyo-${r.id}`;
        if (dismissedNotifIds.has(notifId) || dismissedNotifIds.has(r.id)) return;
        const isUnread = !readNotifIds.has(notifId);
        list.push({
          id: notifId,
          title: 'New Suyo Nearby',
          body: `"${r.title}" (${r.category || 'General'}) posted in ${r.location || 'Nearby'} · ₱${((r.offerCentavos || 0) / 100).toFixed(0)}`,
          time: formatRelativeTime(r.createdAt || r.created_at),
          category: 'nearby',
          icon: 'location-outline',
          unread: isUnread,
          requestId: r.id,
          rawRequest: r,
        });
      });

    // 3. User's own posted requests confirmation
    (requests || [])
      .filter((r) => r.requesterId === user?.id && r.status === 'open' && !deletedSuyoIds.has(r.id) && !cancelledSuyoIds.has(r.id))
      .slice(0, 3)
      .forEach((r) => {
        const notifId = `notif-own-${r.id}`;
        if (dismissedNotifIds.has(notifId) || dismissedNotifIds.has(r.id)) return;
        list.push({
          id: notifId,
          title: 'Suyo Posted Successfully',
          body: `Your suyo "${r.title}" is live and waiting for community couriers.`,
          time: formatRelativeTime(r.createdAt || r.created_at),
          category: 'task',
          icon: 'paper-plane-outline',
          unread: !readNotifIds.has(notifId),
          requestId: r.id,
          rawRequest: r,
        });
      });

    setNotifications((prev) => {
      // Preserve any live real-time notifications received via Supabase broadcast/changes
      const liveOnly = prev.filter(
        (p) =>
          p.id.startsWith('notif-live-') &&
          !dismissedNotifIds.has(p.id) &&
          (!p.requestId || (!deletedSuyoIds.has(p.requestId) && !cancelledSuyoIds.has(p.requestId) && !dismissedNotifIds.has(p.requestId)))
      );
      const combined = [...liveOnly, ...list];
      const deduped = [];
      const seen = new Set();
      for (const item of combined) {
        if (!seen.has(item.id)) {
          seen.add(item.id);
          deduped.push(item);
        }
      }
      return deduped;
    });
  }, [dbNotifications, requests, user?.id, dismissedNotifIds, readNotifIds, deletedSuyoIds, cancelledSuyoIds]);

  const deletedSuyoIdsRef = useRef(deletedSuyoIds);
  deletedSuyoIdsRef.current = deletedSuyoIds;
  const cancelledSuyoIdsRef = useRef(cancelledSuyoIds);
  cancelledSuyoIdsRef.current = cancelledSuyoIds;
  const dismissedNotifIdsRef = useRef(dismissedNotifIds);
  dismissedNotifIdsRef.current = dismissedNotifIds;

  // Real-time listener: reflect newly posted suyos from any user/device in real time
  useEffect(() => {
    if (!supabase) return;

    const channelName = `suyo-dashboard-live-${user?.id || 'guest'}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'suyo_requests' },
        (payload) => {
          const newReq = payload.new;
          if (!newReq) return;
          if (
            deletedSuyoIdsRef.current.has(newReq.id) ||
            cancelledSuyoIdsRef.current.has(newReq.id) ||
            dismissedNotifIdsRef.current.has(`notif-live-${newReq.id}`) ||
            dismissedNotifIdsRef.current.has(newReq.id)
          ) return;

          const isOwn = newReq.requester_id === user?.id;
          const notifItem = {
            id: `notif-live-${newReq.id}`,
            title: isOwn ? 'Your Suyo Was Posted' : 'New Suyo Posted Nearby',
            body: `"${newReq.title}" (${newReq.category || 'General'}) · ₱${((newReq.offer_centavos || 0) / 100).toFixed(0)} in ${newReq.location || 'Nearby'}`,
            time: 'Just now',
            category: isOwn ? 'task' : 'nearby',
            icon: isOwn ? 'paper-plane-outline' : 'location-outline',
            unread: true,
            requestId: newReq.id,
          };
          setNotifications((prev) => [
            notifItem,
            ...prev.filter((n) => n.id !== notifItem.id),
          ]);
          triggerToast(
            isOwn
              ? 'Your suyo was posted successfully!'
              : `New suyo nearby: "${newReq.title}"`,
            isOwn ? 'checkmark-circle' : 'sparkles'
          );
          refresh();
        }
      )
      .on(
        'broadcast',
        { event: 'new_suyo' },
        (event) => {
          const newReq = event.payload;
          if (!newReq) return;
          if (
            deletedSuyoIdsRef.current.has(newReq.id) ||
            cancelledSuyoIdsRef.current.has(newReq.id) ||
            dismissedNotifIdsRef.current.has(`notif-live-${newReq.id}`) ||
            dismissedNotifIdsRef.current.has(newReq.id)
          ) return;

          const isOwn =
            newReq.requesterId === user?.id || newReq.requester_id === user?.id;
          const notifItem = {
            id: `notif-live-${newReq.id}`,
            title: isOwn ? 'Your Suyo Was Posted' : 'New Suyo Posted Nearby',
            body: `"${newReq.title}" (${newReq.category || 'General'}) · ₱${((newReq.offerCentavos || newReq.offer_centavos || 0) / 100).toFixed(0)} in ${newReq.location || 'Nearby'}`,
            time: 'Just now',
            category: isOwn ? 'task' : 'nearby',
            icon: isOwn ? 'paper-plane-outline' : 'location-outline',
            unread: true,
            requestId: newReq.id,
            rawRequest: newReq,
          };
          setNotifications((prev) => [
            notifItem,
            ...prev.filter((n) => n.id !== notifItem.id),
          ]);
          if (!isOwn) {
            triggerToast(`New suyo nearby: "${newReq.title}"`, 'sparkles');
          }
          refresh();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, refresh]);

  const unreadNotificationsCount = notifications.filter((n) => n.unread).length;

  const markNotificationRead = (id) => {
    setReadNotifIds((prev) => new Set([...prev, id]));
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, unread: false } : n))
    );
    if (markDbNotifRead && !id.startsWith('notif-')) {
      markDbNotifRead(id).catch(() => {});
    }
    triggerToast('Notification marked as read', 'checkmark-circle');
  };

  const markAllNotificationsRead = () => {
    setReadNotifIds((prev) => {
      const next = new Set(prev);
      notifications.forEach((n) => next.add(n.id));
      return next;
    });
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
    triggerToast('All notifications marked as read', 'checkmark-done');
  };

  const clearAllNotifications = () => {
    const idsToDismiss = notifications.map((n) => n.id);
    notifications.forEach((n) => {
      if (n.requestId) {
        idsToDismiss.push(
          n.requestId,
          `notif-suyo-${n.requestId}`,
          `notif-own-${n.requestId}`,
          `notif-live-${n.requestId}`
        );
      }
    });
    persistDismissedNotifs(idsToDismiss);
    setNotifications([]);
    triggerToast('All notifications cleared', 'trash-outline');
  };

  const removeNotification = (id) => {
    const targetNotif = notifications.find((n) => n.id === id);
    const idsToDismiss = [id];
    if (targetNotif?.requestId) {
      idsToDismiss.push(
        targetNotif.requestId,
        `notif-suyo-${targetNotif.requestId}`,
        `notif-own-${targetNotif.requestId}`,
        `notif-live-${targetNotif.requestId}`
      );
    }
    persistDismissedNotifs(idsToDismiss);
    setNotifications((prev) => prev.filter((n) => !idsToDismiss.includes(n.id)));
    triggerToast('Notification removed', 'trash-outline');
  };

  const handleTapNotification = (notif) => {
    markNotificationRead(notif.id);
    setIsNotificationsModalOpen(false);

    if (notif.requestId || notif.rawRequest) {
      const targetReq =
        (availableSuyosBase || []).find((s) => s.id === notif.requestId) ||
        (requests || []).find((r) => r.id === notif.requestId) ||
        notif.rawRequest;
      if (targetReq) {
        handleOpenSuyoDetail(targetReq);
        return;
      }
    }

    if (notif.targetScreen === '/requester-fulfill') {
      router.push({
        pathname: '/requester-fulfill',
        params: notif.taskParams || (notif.requestId ? { id: notif.requestId } : {}),
      });
    } else if (notif.targetScreen === '/fulfill' || notif.targetScreen === '/suyo') {
      router.push({
        pathname: '/fulfill',
        params: notif.taskParams || (notif.requestId ? { id: notif.requestId } : {}),
      });
    } else if (notif.category === 'payment') {
      triggerToast('Earnings recorded in your SuyoLink Wallet', 'cash-outline');
    } else if (notif.category === 'nearby') {
      const targetSuyo = filteredSuyos[0];
      if (targetSuyo) {
        handleOpenSuyoDetail(targetSuyo);
      } else {
        router.push('/map');
      }
    } else {
      triggerToast(notif.title, 'notifications');
    }
  };

  // Active Suyo floating banner state (matching live task for current user)
  const activeSuyo = useMemo(() => {
    const live =
      (requests || []).find(
        (r) =>
          (r.requesterId === user?.id || r.userId === user?.id || r.providerId === user?.id) &&
          ['assigned', 'in_progress', 'accepted', 'active'].includes(r.status)
      ) ||
      (acceptedSuyos && acceptedSuyos.length > 0 ? acceptedSuyos[0] : null);
    if (!live) return null;
    const isDoer = live.providerId === user?.id;
    return {
      id: live.id,
      trackingNumber: `#SYL-${String(live.id).slice(0, 6).toUpperCase()}`,
      status: live.status === 'in_progress' ? 'In Progress' : 'Assigned',
      eta: live.status === 'in_progress' ? (isDoer ? 'You are on the way' : 'Doer is on the way') : 'Doer assigned',
      detail: `Suyo: ${live.title}`,
      progress: live.status === 'in_progress' ? '75%' : '40%',
      raw: live,
    };
  }, [requests, user?.id, acceptedSuyos]);
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
          item.title?.toLowerCase().includes(q) ||
          item.details?.toLowerCase().includes(q) ||
          item.location?.toLowerCase().includes(q) ||
          item.category?.toLowerCase().includes(q)
      );
    }

    // Category filter
    if (selectedCategory !== 'All') {
      list = list.filter((item) => item.category === selectedCategory);
    }

    // Distance filter
    if (currentDistanceKm !== 'Any') {
      list = list.filter((item) => (item.distance ?? 0.8) <= currentDistanceKm);
    }

    // Urgency filter
    if (selectedUrgency !== 'All') {
      list = list.filter((item) => item.tag === selectedUrgency || item.urgency === selectedUrgency);
    }

    // Sort newest first
    list.sort((a, b) => b.createdAt - a.createdAt);

    return list;
  }, [availableSuyosBase, searchQuery, selectedCategory, currentDistanceKm, selectedUrgency]);

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
    <SafeAreaView edges={['top']} style={styles.safeContainer}>
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
          <Ionicons name="menu-outline" size={26} color="#FFFFFF" />
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
            <Ionicons name="heart-outline" size={22} color="#FFFFFF" />
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
            <Ionicons name="notifications-outline" size={22} color="#FFFFFF" />
            {unreadNotificationsCount > 0 && (
              <View style={styles.headerNotifBadge}>
                <Text style={styles.headerNotifBadgeText}>
                  {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
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
              <Ionicons name="location-sharp" size={11} color="#4ADE80" />
              <Text style={styles.locationPillText}>Makati CBD</Text>
            </View>
            <Text style={styles.welcomeSubText}>WELCOME BACK</Text>
            <Text style={styles.welcomeNameText} numberOfLines={1}>
              {userProfile?.name || 'Juan Dela Cruz'}
            </Text>
            <Text style={styles.welcomeTagline}>Need a suyo done today?</Text>
          </View>

          <Image
            source={require('../assets/scooter_hero_isometric.jpg')}
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
                  <Ionicons name="close-circle" size={18} color="#8FA497" />
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
            <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 7, paddingRight: 8 }}>
              <Text style={[styles.sectionHeading, { marginBottom: 0 }]} numberOfLines={1}>
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
                <Ionicons name="close-circle-outline" size={13} color="#64748B" />
                <Text style={styles.clearFiltersText}>Clear all</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setIsFilterModalOpen(true)}
                style={styles.nearestHeaderBadge}
              >
                <Ionicons name="location-outline" size={13} color="#1E4D2B" />
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
                    <View style={{ flex: 1, marginRight: 10 }}>
                      <Text style={styles.suyoCardTitle} numberOfLines={2}>
                        {suyo.title}
                      </Text>
                      {suyo.isMine && (
                        <View style={{ alignSelf: 'flex-start', backgroundColor: '#E8F5E9', borderColor: '#C8E6C9', borderWidth: 1, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 1, marginTop: 4 }}>
                          <Text style={{ fontSize: 10, fontWeight: '700', color: '#1B5E20' }}>Posted by you</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.suyoCardReward}>{suyo.reward}</Text>
                  </View>

                  {/* Target Time Row on Available Suyo Card */}
                  <View style={styles.suyoCardTargetRow}>
                    <Ionicons name="time" size={12.5} color="#D97706" />
                    <Text style={styles.suyoCardTargetText} numberOfLines={1}>
                      Target: {formatTargetDeadline(suyo)}
                    </Text>
                  </View>

                  <View style={styles.suyoCardBottomRow}>
                    <Text style={styles.suyoCardDistanceSub}>
                      {suyo.isMine ? 'Your Suyo' : suyo.distanceText} • {suyo.postedTime}
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
                          : suyo.tag === 'Flexible'
                          ? styles.suyoTagFlexible
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
                            : suyo.tag === 'Flexible'
                            ? styles.suyoTagFlexibleText
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
                <Ionicons name="search" size={32} color="#8FA497" />
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
                <Ionicons name="receipt-outline" size={24} color="#1C3A27" />
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
                      mySuyoNavTab === 'posted' && styles.mySuyoTextNavTitleActive,
                    ]}
                  >
                    Posted
                  </Text>
                  <Text
                    style={[
                      styles.mySuyoTextNavCount,
                      mySuyoNavTab === 'posted' && styles.mySuyoTextNavCountActive,
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
                      mySuyoNavTab === 'accepted' && styles.mySuyoTextNavTitleActive,
                    ]}
                  >
                    Accepted
                  </Text>
                  <Text
                    style={[
                      styles.mySuyoTextNavCount,
                      mySuyoNavTab === 'accepted' && styles.mySuyoTextNavCountActive,
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
                      mySuyoNavTab === 'completed' && styles.mySuyoTextNavTitleActive,
                    ]}
                  >
                    Completed
                  </Text>
                  <Text
                    style={[
                      styles.mySuyoTextNavCount,
                      mySuyoNavTab === 'completed' && styles.mySuyoTextNavCountActive,
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
                      mySuyoNavTab === 'cancelled' && styles.mySuyoTextNavTitleActive,
                    ]}
                  >
                    Cancelled
                  </Text>
                  <Text
                    style={[
                      styles.mySuyoTextNavCount,
                      mySuyoNavTab === 'cancelled' && styles.mySuyoTextNavCountActive,
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
                      mySuyoNavTab === 'archived' && styles.mySuyoTextNavTitleActive,
                    ]}
                  >
                    Archived
                  </Text>
                  <Text
                    style={[
                      styles.mySuyoTextNavCount,
                      mySuyoNavTab === 'archived' && styles.mySuyoTextNavCountActive,
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
                ((mySuyoNavTab === 'cancelled'
                  ? cancelledSuyos
                  : archivedSuyos).length > 0) && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  {isMySuyoEditMode && (
                    <TouchableOpacity
                      onPress={() => {
                        const currentList =
                          mySuyoNavTab === 'cancelled'
                            ? cancelledSuyos
                            : archivedSuyos;
                        if (selectedMySuyoIdsToDelete.length === currentList.length) {
                          setSelectedMySuyoIdsToDelete([]);
                        } else {
                          setSelectedMySuyoIdsToDelete(currentList.map((item) => item.id));
                        }
                      }}
                      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                    >
                      <Text style={styles.mySuyoSelectAllText}>
                        {selectedMySuyoIdsToDelete.length ===
                        (mySuyoNavTab === 'cancelled'
                          ? cancelledSuyos
                          : archivedSuyos).length
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
                          ? "When a courier accepts one of your posted suyos, it will appear here so you can view the doer profile and track live progress."
                          : mySuyoNavTab === 'completed'
                          ? "Finished suyos will appear here with the courier who completed them."
                          : mySuyoNavTab === 'cancelled'
                          ? "You have not cancelled any of your requested suyos."
                          : "Save completed or frequent suyos to your archive so you can repeat them with a single tap!"}
                      </Text>
                    </View>
                  );
                }

                return currentList.map((suyo) => {
                  const isSelected = selectedMySuyoIdsToDelete.includes(suyo.id);
                  return (
                    <TouchableOpacity
                      key={suyo.id}
                      style={[
                        styles.mySuyoCardItem,
                        isMySuyoEditMode && isSelected && styles.mySuyoCardItemSelected,
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
                        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, paddingRight: 10 }}>
                          {isMySuyoEditMode && (
                            <View
                              style={[
                                styles.mySuyoSelectionCircle,
                                isSelected && styles.mySuyoSelectionCircleSelected,
                              ]}
                            >
                              {isSelected && (
                                <Ionicons name="checkmark" size={11} color="#FFFFFF" />
                              )}
                            </View>
                          )}
                          <Text style={styles.mySuyoCardTitle} numberOfLines={1}>
                            {suyo.title}
                          </Text>
                        </View>
                        <Text style={styles.mySuyoCardRewardText}>{suyo.reward}</Text>
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
                      {mySuyoNavTab === 'posted' && suyo.needsBoost && !isMySuyoEditMode && suyo.status !== 'Cancelled' && (
                        <View style={styles.mySuyoCardBoostRow}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, flex: 1 }}>
                            <Ionicons name="sparkles" size={13} color="#059669" />
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
                              <Text style={styles.mySuyoCardQuickBoostText}>+₱20</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={[styles.mySuyoCardQuickBoostBtn, styles.mySuyoCardQuickBoostBtnGreen]}
                              activeOpacity={0.75}
                              onPress={(e) => {
                                e.stopPropagation();
                                handleBoostReward(suyo.id, 50);
                              }}
                            >
                              <Text style={[styles.mySuyoCardQuickBoostText, { color: '#FFFFFF' }]}>+₱50</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      )}

                      {/* In Accepted: Courier Strip */}
                      {mySuyoNavTab === 'accepted' && suyo.doer && (
                        <View style={styles.mySuyoCourierStrip}>
                          <Text style={styles.mySuyoCourierStripText} numberOfLines={1}>
                            Courier: <Text style={{ fontWeight: '700', color: '#163523' }}>{suyo.doer.name}</Text> ({suyo.doer.rating})
                          </Text>
                        </View>
                      )}

                      {/* In Completed: Courier Who Fulfilled Strip */}
                      {mySuyoNavTab === 'completed' && suyo.doer && (
                        <View style={styles.mySuyoCourierStrip}>
                          <Text style={styles.mySuyoCourierStripText} numberOfLines={1}>
                            Fulfilled by <Text style={{ fontWeight: '700', color: '#163523' }}>{suyo.doer.name}</Text> ({suyo.doer.rating})
                          </Text>
                        </View>
                      )}



                      {/* Footer Row: Location Pin */}
                      <View style={styles.mySuyoCardFooter}>
                        <View style={styles.mySuyoCardLocationRow}>
                          <Ionicons name="location-sharp" size={13} color="#0D9488" />
                          <Text style={styles.mySuyoCardLocationText} numberOfLines={1}>
                            {suyo.location}
                          </Text>
                        </View>

                        <Text style={styles.mySuyoTapDetailHint}>Tap for options →</Text>
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
                      selectedMySuyoIdsToDelete.length > 0 ? '#FFFFFF' : '#8CA395'
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
                <Ionicons name="bicycle-outline" size={24} color="#1C3A27" />
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
                      doerNavTab === 'accepted' && styles.mySuyoTextNavTitleActive,
                    ]}
                  >
                    Accepted
                  </Text>
                  <Text
                    style={[
                      styles.mySuyoTextNavCount,
                      doerNavTab === 'accepted' && styles.mySuyoTextNavCountActive,
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
                      doerNavTab === 'completed' && styles.mySuyoTextNavTitleActive,
                    ]}
                  >
                    Completed
                  </Text>
                  <Text
                    style={[
                      styles.mySuyoTextNavCount,
                      doerNavTab === 'completed' && styles.mySuyoTextNavCountActive,
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
                      doerNavTab === 'cancelled' && styles.mySuyoTextNavTitleActive,
                    ]}
                  >
                    Cancelled
                  </Text>
                  <Text
                    style={[
                      styles.mySuyoTextNavCount,
                      doerNavTab === 'cancelled' && styles.mySuyoTextNavCountActive,
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
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  {isDoerCancelledEditMode && (
                    <TouchableOpacity
                      onPress={() => {
                        if (selectedDoerCancelledIds.length === doerCancelledSuyos.length) {
                          setSelectedDoerCancelledIds([]);
                        } else {
                          setSelectedDoerCancelledIds(doerCancelledSuyos.map((item) => item.id));
                        }
                      }}
                      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                    >
                      <Text style={styles.mySuyoSelectAllText}>
                        {selectedDoerCancelledIds.length === doerCancelledSuyos.length
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
                      <Ionicons name="bicycle-outline" size={28} color="#8CA395" />
                    </View>
                    <Text style={styles.doerEmptyTitle}>No Active Accepted Suyos</Text>
                    <Text style={styles.doerEmptySub}>
                      Browse the public dashboard to accept and fulfill available suyos from nearby requesters.
                    </Text>
                    <TouchableOpacity
                      style={styles.doerBrowseBtn}
                      activeOpacity={0.8}
                      onPress={() => setActiveTab('home')}
                    >
                      <Ionicons name="search" size={15} color="#FFFFFF" />
                      <Text style={styles.doerBrowseBtnText}>Browse Available Suyos</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <>
                    <View style={styles.doerInfoCallout}>
                      <Ionicons name="information-circle-outline" size={16} color="#059669" />
                      <Text style={styles.doerInfoCalloutText}>
                        You are assigned as the doer. You can proceed to fulfillment or cancel if unable to complete.
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
                            <Ionicons name={suyo.icon || 'receipt'} size={13} color="#1E4D2B" />
                            <Text style={styles.doerCategoryChipText}>{suyo.category}</Text>
                          </View>
                          <View style={styles.doerRewardBadge}>
                            <Text style={styles.doerRewardText}>+{suyo.reward}</Text>
                          </View>
                        </View>

                        {/* Title */}
                        <Text style={styles.doerCardTitle}>{suyo.title}</Text>

                        {/* Requester Info */}
                        <View style={styles.doerRequesterRow}>
                          <Ionicons name="person-circle-outline" size={15} color="#557261" />
                          <Text style={styles.doerRequesterText}>
                            Requester: <Text style={{ fontWeight: '700', color: '#163523' }}>{suyo.requesterName}</Text>
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
                              <Ionicons name="call" size={11} color="#059669" />
                              <Text style={styles.doerCallMiniBtnText}>Call</Text>
                            </TouchableOpacity>
                          )}
                        </View>

                        {/* Location & Time */}
                        <View style={styles.doerLocationRow}>
                          <Ionicons name="location-outline" size={14} color="#8CA395" />
                          <Text style={styles.doerLocationText} numberOfLines={1}>{suyo.location}</Text>
                          <Text style={styles.doerDot}>•</Text>
                          <Ionicons name="time-outline" size={14} color="#8CA395" />
                          <Text style={styles.doerDeadlineText}>{suyo.deadline}</Text>
                        </View>

                        {/* Tap hint */}
                        <View style={styles.doerTapDetailsHintRow}>
                          <Ionicons name="information-circle-outline" size={12} color="#059669" />
                          <Text style={styles.doerTapDetailsHintText}>Tap tile to view details & requester profile</Text>
                          <Ionicons name="chevron-forward" size={12} color="#059669" />
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
                                  contactPhone: suyo.contactPhone || suyo.requesterPhone,
                                  details: suyo.details,
                                  arrivalWindow: suyo.timeBadge || '11:00 AM - 11:30 AM',
                                },
                              });
                            }}
                          >
                            <Ionicons name="navigate" size={15} color="#FFFFFF" />
                            <Text style={styles.doerContinueBtnText}>Continue Suyo</Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={styles.doerCancelBtn}
                            activeOpacity={0.75}
                            onPress={(e) => {
                              e?.stopPropagation?.();
                              setDoerCancelModalItem(suyo);
                            }}
                          >
                            <Ionicons name="close-circle-outline" size={15} color="#DC2626" />
                            <Text style={styles.doerCancelBtnText}>Cancel as Doer</Text>
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
                      <Ionicons name="checkmark-done" size={28} color="#059669" />
                    </View>
                    <Text style={styles.doerEmptyTitle}>No Completed Suyos Yet</Text>
                    <Text style={styles.doerEmptySub}>
                      Fulfill suyos as a doer to see your completed history and earned rewards.
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
                          <Ionicons name={item.icon || 'checkmark-done'} size={18} color="#059669" />
                        </View>
                        <View style={styles.doerCompletedTextCol}>
                          <Text style={styles.doerCompletedTitle} numberOfLines={1}>{item.title}</Text>
                          <Text style={styles.doerCompletedRequester}>From: {item.requesterName}</Text>
                          <View style={styles.doerCompletedMetaRow}>
                            <Ionicons name="time-outline" size={12} color="#8CA395" />
                            <Text style={styles.doerCompletedDate}>{item.date}</Text>
                            <Text style={styles.doerDot}>•</Text>
                            <Text style={styles.doerCompletedLocation} numberOfLines={1}>{item.location}</Text>
                          </View>
                        </View>
                      </View>

                      <View style={styles.doerCompletedRight}>
                        <Text style={styles.doerCompletedEarned}>+₱{Number(item.earnedAmount).toFixed(2)}</Text>
                        <View style={styles.doerCompletedRatingBadge}>
                          <Ionicons name="star" size={10} color="#F59E0B" />
                          <Text style={styles.doerCompletedRatingText}>5.0★</Text>
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
                      <Ionicons name="shield-checkmark-outline" size={28} color="#059669" />
                    </View>
                    <Text style={styles.doerEmptyTitle}>No Cancelled Suyos</Text>
                    <Text style={styles.doerEmptySub}>
                      Your completion rate is high! You have not cancelled any accepted suyos.
                    </Text>
                  </View>
                ) : (
                  doerCancelledSuyos.map((item) => {
                    const isSelected = selectedDoerCancelledIds.includes(item.id);
                    return (
                      <TouchableOpacity
                        key={item.id}
                        style={[
                          styles.doerCancelledCard,
                          isDoerCancelledEditMode && isSelected && styles.mySuyoCardItemSelected,
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
                          <Text style={styles.doerCancelledTitle} numberOfLines={1}>
                            {item.title}
                          </Text>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                            <View style={styles.doerCancelledBadge}>
                              <Text style={styles.doerCancelledBadgeText}>Cancelled</Text>
                            </View>
                            {isDoerCancelledEditMode && (
                              <View
                                style={[
                                  styles.mySuyoSelectionCircle,
                                  isSelected && styles.mySuyoSelectionCircleSelected,
                                ]}
                              >
                                {isSelected && (
                                  <Ionicons name="checkmark" size={11} color="#FFFFFF" />
                                )}
                              </View>
                            )}
                          </View>
                        </View>
                        <Text style={styles.doerCancelledSub}>Requester: {item.requesterName} • {item.cancelledAt || 'Recently'}</Text>
                        <View style={styles.doerCancelledNotice}>
                          <Ionicons name="return-up-back" size={13} color="#6B7280" />
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
                          selectedDoerCancelledIds.length > 0 ? '#FFFFFF' : '#8CA395'
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
              <Ionicons name="arrow-back" size={16} color="#1E4D2B" />
              <Text style={styles.walletReturnHeaderText}>Back to Dashboard</Text>
            </TouchableOpacity>

            {/* 1. Wallet Balance Hero Header */}
            <View style={styles.walletHeroCard}>
              <View style={styles.walletHeroTopRow}>
                <View style={styles.walletBadgeRow}>
                  <View style={styles.walletIconCircle}>
                    <Ionicons name="wallet" size={17} color="#1E4D2B" />
                  </View>
                  <Text style={styles.walletHeroSuper}>SUYOLINK WALLET</Text>
                </View>
                <View style={styles.walletVerifiedPill}>
                  <Ionicons name="checkmark-circle" size={13} color="#059669" />
                  <Text style={styles.walletVerifiedPillText}>Verified User</Text>
                </View>
              </View>

              <Text style={styles.walletBalanceLabel}>Today's Earnings - {todayDateFormatted}</Text>
              <Text style={styles.walletBalanceAmount}>₱{todayEarningsSum.toFixed(2)}</Text>

              {/* 3 Fitted Summary Metric Tiles */}
              <View style={styles.walletSummaryRow}>
                <View style={styles.walletSummaryTile}>
                  <Text style={styles.walletSummaryCount} numberOfLines={1} adjustsFontSizeToFit>
                    {todaySuyosCount}
                  </Text>
                  <Text style={styles.walletSummaryLabel} numberOfLines={1} adjustsFontSizeToFit>
                    Today's Suyos
                  </Text>
                </View>
                <View style={styles.walletSummaryTile}>
                  <Text style={styles.walletSummaryCount} numberOfLines={1} adjustsFontSizeToFit>
                    {monthlySuyosCount}
                  </Text>
                  <Text style={styles.walletSummaryLabel} numberOfLines={1} adjustsFontSizeToFit>
                    Monthly Suyos
                  </Text>
                </View>
                <View style={styles.walletSummaryTile}>
                  <Text style={styles.walletSummaryCount} numberOfLines={1} adjustsFontSizeToFit>
                    {overallSuyosCount}
                  </Text>
                  <Text style={styles.walletSummaryLabel} numberOfLines={1} adjustsFontSizeToFit>
                    Overall Done
                  </Text>
                </View>
              </View>

              {/* Informative Note: Direct Settlement Outside App */}
              <View style={styles.walletPaymentNoticeRow}>
                <Ionicons name="call" size={13} color="#059669" />
                <Text style={styles.walletPaymentNoticeText}>
                  Payments are received directly via call & conversation with requesters outside the app.
                </Text>
              </View>
            </View>

            {/* Literal Modern Graphical Line Graph - Full Width Standalone Tile */}
            <WalletIncomeLineGraph
              transactions={providerTransactions}
              totalOverride={displayWalletTotal}
              hasTransactions={providerTransactions.length > 0}
            />

            {/* 2. Section Header: Just the Lists */}
            <View style={styles.walletSectionHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.walletSectionTitle}>Accepted Suyo Earnings</Text>
                <Text style={styles.walletSectionSub}>
                  Tracked rewards earned from every accepted suyo request
                </Text>
              </View>
            </View>

            {/* 3. The Clean List of Earned Accepted Suyo Requests */}
            <View style={styles.walletListWrapper}>
              {dynamicWalletList.length === 0 ? (
                <View style={styles.doerEmptyCard}>
                  <View style={styles.doerEmptyIconCircle}>
                    <Ionicons name="wallet-outline" size={28} color="#1E4D2B" />
                  </View>
                  <Text style={styles.doerEmptyTitle}>No Suyo Earnings Yet</Text>
                  <Text style={styles.doerEmptySub}>
                    When you accept and complete suyos for others, your settled earnings and receipts will appear here.
                  </Text>
                </View>
              ) : (
                dynamicWalletList.map((item) => (
                  <View key={item.id} style={styles.walletItemCard}>
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
                        <Text style={styles.walletItemTitle} numberOfLines={1}>
                          {item.title}
                        </Text>

                        <View style={styles.walletItemMetaRow}>
                          <Ionicons name="person-circle-outline" size={13} color="#557261" />
                          <Text style={styles.walletItemRequesterText}>
                            From:{' '}
                            <Text style={{ fontWeight: '700', color: '#163523' }}>
                              {item.requesterName}
                            </Text>
                          </Text>
                        </View>

                        <View style={styles.walletItemDateRow}>
                          <Ionicons name="time-outline" size={12} color="#8CA395" />
                          <Text style={styles.walletItemDateText}>{item.date}</Text>
                          <Text style={styles.walletItemDot}>•</Text>
                          <Ionicons name="location-outline" size={12} color="#8CA395" />
                          <Text style={styles.walletItemLocationText} numberOfLines={1}>
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
                        <Ionicons name="checkmark-circle" size={10} color="#15803D" />
                        <Text style={styles.walletStatusChipText}>{item.status}</Text>
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
            onPress={() => {
              const live = activeSuyo?.raw;
              const isDoer = live?.providerId === user?.id;
              if (isDoer) {
                router.push({
                  pathname: '/fulfill',
                  params: {
                    id: live?.id || activeSuyo?.id || 'SYL-102',
                    title: live?.title || 'Drop off documents - Unit 402',
                    category: live?.category || 'Documents',
                    location: live?.location || live?.exactAddress || 'Unit 402, Makati CBD',
                    distanceText: live?.distanceText || '0.8 km away',
                    reward: live?.reward || (live?.price ? `₱${live.price}` : null) || '₱300',
                    requesterName: live?.requesterName || 'Atty. Rafael Cruz',
                    requesterPhone: live?.requesterPhone || live?.contactPhone || '0917 842 1983',
                    details: live?.details || 'Delivery of notarized legal documents to Unit 402.',
                    arrivalWindow: live?.timeBadge || '11:00 AM - 11:30 AM',
                  },
                });
              } else {
                router.push({
                  pathname: '/requester-fulfill',
                  params: {
                    id: live?.id || activeSuyo?.id || 'SYL-102',
                    title: live?.title || 'Drop off documents - Unit 402',
                    category: live?.category || 'Documents',
                    location: live?.location || live?.exactAddress || 'Unit 402, Makati CBD',
                    distanceText: live?.distanceText || '0.8 km away',
                    reward: live?.reward || (live?.price ? `₱${live.price}` : null) || '₱300',
                    doerName: live?.assignedDoer || live?.doer?.name || live?.doerName || 'Alex M.',
                    doerRating: live?.doer?.rating || live?.doerRating || '4.9',
                    doerPhone: live?.doer?.phone || live?.doerPhone || '0917 552 8910',
                    details: live?.details || 'Delivery of notarized legal documents to Unit 402.',
                    arrivalWindow: live?.timeBadge || '11:00 AM - 11:30 AM',
                  },
                });
              }
            }}
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
                  <Text style={styles.floatingActiveBadgeText}>ACTIVE SUYO</Text>
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
                  <Text style={styles.floatingModalTitle} numberOfLines={1}>
                    {activeSuyo.eta}
                    <Text style={styles.floatingModalSub}>
                      {' '}
                      • {activeSuyo.detail}
                    </Text>
                  </Text>
                </View>
                <View style={styles.floatingModalChevronCircle}>
                  <Ionicons name="chevron-forward" size={13} color="#1E4D2B" />
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
            router.push({
              pathname: '/account',
              params: {
                name: userProfile?.name || 'Juan Dela Cruz',
                done: String(overallCompletedCount),
                phone: userProfile?.phone || '+63 917 123 4567',
                isOtherUser: 'false',
              },
            });
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
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="options-outline" size={20} color="#163523" />
                <Text style={styles.modalTitle}>Filter Suyos</Text>
              </View>
              <TouchableOpacity
                onPress={() => setIsFilterModalOpen(false)}
                style={styles.modalCloseButton}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={20} color="#163523" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 420 }}>
              {/* Category Pills */}
              <Text style={styles.filterSectionLabel}>Category</Text>
              <View style={styles.filterPillsWrap}>
                {CATEGORY_OPTIONS.map((cat) => {
                  const isSelected = selectedCategory === cat;
                  const config = cat === 'All' ? CATEGORY_CONFIG.All : CATEGORY_CONFIG.default;

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
                    currentDistanceKm === 'Any' && styles.distanceStepperArrowBtnDisabled,
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
                    {currentDistanceKm === 'Any' ? 'Any distance' : `${currentDistanceKm} km`}
                  </Text>
                  <Text style={styles.distanceStepperSubText}>
                    {currentDistanceKm === 'Any' ? 'All suyos' : `0 - ${currentDistanceKm} km`}
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.distanceStepperArrowBtn}
                  activeOpacity={0.7}
                  onPress={handleIncreaseDistance}
                >
                  <Ionicons name="chevron-forward" size={16} color="#1E4D2B" />
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
                  <Ionicons name="time-outline" size={13} color="#658172" />
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
                    <Ionicons name="close" size={19} color="#6B8576" />
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
                      : selectedSuyoContext === 'completed' || selectedSuyo.status?.includes('Completed')
                      ? { backgroundColor: '#DCFCE7' }
                      : selectedSuyoContext === 'accepted' || selectedSuyo.status?.includes('In Progress')
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
                        : selectedSuyoContext === 'completed' || selectedSuyo.status?.includes('Completed')
                        ? { color: '#15803D' }
                        : selectedSuyoContext === 'accepted' || selectedSuyo.status?.includes('In Progress')
                        ? { color: '#0369A1' }
                        : selectedSuyoContext === 'archived'
                        ? { color: '#475569' }
                        : { color: '#0369A1' },
                    ]}
                  >
                    {selectedSuyo.status === 'Cancelled'
                      ? 'Cancelled'
                      : selectedSuyoContext === 'completed' || selectedSuyo.status?.includes('Completed')
                      ? 'Completed'
                      : selectedSuyoContext === 'accepted' || selectedSuyo.status?.includes('In Progress')
                      ? 'Accepted'
                      : selectedSuyoContext === 'archived'
                      ? 'Archived'
                      : 'Open'}
                  </Text>
                </View>
              </View>

              <View style={styles.detailDivider} />

              {/* In Accepted or Completed: Show Who Accepted/Fulfilled It */}
              {selectedSuyoContext === 'accepted' || selectedSuyoContext === 'completed' ? (
                <TouchableOpacity
                  style={styles.detailDoerHighlightCard}
                  activeOpacity={0.75}
                  onPress={() => {
                    const doer = selectedSuyo.doer || DEFAULT_DOER;
                    const doerName = doer.name || 'Carlos Dalisay';
                    const doerRating = doer.rating ? String(doer.rating).replace(/[★*?]/g, '').trim() : '';
                    const doerPhone = doer.phone || '+63 919 720 9144';
                    const doerDone = (doer.done || '0').replace(/[^0-9]/g, '') || '0';

                    setSelectedSuyo(null);
                    router.push({
                      pathname: '/profile',
                      params: {
                        name: doerName,
                        ...(doerRating ? { rating: doerRating } : {}),
                        done: doerDone,
                        phone: doerPhone,
                        isOtherUser: 'true',
                      },
                    });
                  }}
                  accessibilityRole="button"
                  accessibilityLabel="View courier profile"
                >
                  <View style={styles.detailDoerAvatar}>
                    <Text style={styles.detailDoerAvatarInitials}>
                      {getInitials(selectedSuyo.doer?.name || DEFAULT_DOER.name)}
                    </Text>
                  </View>
                  <View style={styles.detailDoerTextCol}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                      <Text style={styles.detailDoerNameText}>
                        {selectedSuyo.doer?.name || DEFAULT_DOER.name}
                      </Text>
                      {selectedSuyoContext !== 'completed' && (
                        <Ionicons name="checkmark-circle" size={14} color="#059669" />
                      )}
                    </View>
                    <Text style={styles.detailDoerMetaText}>
                      {selectedSuyoContext === 'completed'
                        ? 'Fulfilled your Suyo'
                        : 'Accepted Courier'}{' '}
                      · {selectedSuyo.doer?.rating || DEFAULT_DOER.rating}
                    </Text>
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={(e) => {
                        e?.stopPropagation?.();
                        handleCallDoer(
                          selectedSuyo.doer?.phone || DEFAULT_DOER.phone,
                          selectedSuyo.doer?.name || DEFAULT_DOER.name
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
                            const reqName = selectedSuyo.requesterName || 'Maria Clarissa';
                            const reqRating = selectedSuyo.requesterRating ? String(selectedSuyo.requesterRating).replace(/[★*?]/g, '').trim() : '';
                            const reqDone = (selectedSuyo.completedCount || '0').replace(/[^0-9]/g, '') || '0';
                            const reqPhone = selectedSuyo.requesterPhone || '0928 341 5520';

                            router.push({
                              pathname: '/profile',
                              params: {
                                name: reqName,
                                ...(reqRating ? { rating: reqRating } : {}),
                                done: reqDone,
                                phone: reqPhone,
                                isOtherUser: 'true',
                              },
                            });
                          }
                        }}
                        accessibilityRole="button"
                        accessibilityLabel={isOwnSuyo ? 'View and edit profile' : 'View profile'}
                      >
                        <View style={styles.detailAvatarCircle}>
                          <Text style={styles.detailAvatarInitials}>
                            {isOwnSuyo
                              ? getInitials(userProfile?.name || 'Juan Dela Cruz')
                              : selectedSuyo.requesterInitials ||
                                getInitials(
                                  selectedSuyo.requesterName || userProfile?.name || 'Juan Dela Cruz'
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
                              ? `Requester (You) · ${userRatingStats.rating ? `${userRatingStats.rating}★` : 'New'}`
                              : `Requestor · ${selectedSuyo.requesterRating || 'New'} · ${(selectedSuyo.completedCount || '0 completed').replace(/[()]/g, '')}`}
                          </Text>
                          <View style={styles.detailRequestorPhoneRow}>
                            <Ionicons name="call" size={11} color="#6D8777" />
                            <Text style={styles.detailRequestorPhoneText}>
                              {isOwnSuyo
                                ? userProfile?.phone || '+63 917 123 4567'
                                : selectedSuyo.requesterPhone || '0928 341 5520'}
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
                          <Ionicons name="pencil" size={17} color="#1E4D2B" />
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
                                selectedSuyo.requesterName || 'Atty. Rafael Cruz'
                              )
                            }
                            accessibilityRole="button"
                            accessibilityLabel="Call requester"
                          >
                            <Ionicons name="call" size={18} color="#1E4D2B" />
                          </TouchableOpacity>
                        )
                      )}
                    </View>
                  );
                })()
              )}

              <View style={styles.detailDivider} />

              {/* Reward, Target Time & Location Stats */}
              <View style={styles.detailStatsRow}>
                <View style={styles.detailStatCol}>
                  <Text style={styles.detailStatLabel}>REWARD</Text>
                  <Text style={styles.detailRewardAmount}>
                    {selectedSuyo.rewardAmount
                      ? `₱${Number(selectedSuyo.rewardAmount).toFixed(2)}`
                      : selectedSuyo.reward && selectedSuyo.reward.startsWith('₱')
                      ? `${selectedSuyo.reward}.00`
                      : '₱150.00'}
                  </Text>
                </View>

                <View style={styles.detailStatCol}>
                  <Text style={styles.detailStatLabel}>TARGET TIME</Text>
                  <View style={styles.detailTargetTimeStatRow}>
                    <Ionicons name="time" size={15} color="#D97706" />
                    <Text style={styles.detailTargetTimeStatValue} numberOfLines={1}>
                      {formatTargetDeadline(selectedSuyo)}
                    </Text>
                  </View>
                </View>

                <View style={styles.detailStatCol}>
                  <Text style={styles.detailStatLabel}>LOCATION</Text>
                  <View style={styles.detailLocationRow}>
                    <Ionicons name="location-sharp" size={16} color="#0D9488" />
                    <Text style={styles.detailLocationName} numberOfLines={1}>
                      {selectedSuyo.location || 'SM Tagum'}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Prominent Target Time Card for Doers */}
              <View style={styles.detailTargetTimeCard}>
                <View style={styles.detailTargetTimeIconCircle}>
                  <Ionicons name="alarm-outline" size={20} color="#B45309" />
                </View>
                <View style={styles.detailTargetTimeTextCol}>
                  <Text style={styles.detailTargetTimeLabel}>TARGET COMPLETION TIME</Text>
                  <Text style={styles.detailTargetTimeValue}>
                    {formatTargetDeadline(selectedSuyo)}
                  </Text>
                  <Text style={styles.detailTargetTimeSub}>
                    {getTargetTimeSubtext(selectedSuyo)}
                  </Text>
                </View>
                <View style={styles.detailTargetTimeBadge}>
                  <Ionicons name="hourglass-outline" size={12} color="#92400E" />
                  <Text style={styles.detailTargetTimeBadgeText}>
                    {getTargetTimeBadge(selectedSuyo)}
                  </Text>
                </View>
              </View>

              <Text style={styles.detailTaskHeading}>Task Description</Text>
              <Text style={styles.detailTaskBody}>
                {selectedSuyo.details}
                {selectedSuyo.notes ? ` ${selectedSuyo.notes}` : ''}
              </Text>

              {/* Attached Photos & Files Section */}
              {selectedSuyo.attachments && selectedSuyo.attachments.length > 0 && (
                <View style={styles.detailAttachmentsSection}>
                  <View style={styles.detailAttachmentsHeaderRow}>
                    <Ionicons name="attach" size={15} color="#1E4D2B" />
                    <Text style={styles.detailAttachmentsHeading}>
                      Attached Photos & Files ({selectedSuyo.attachments.length})
                    </Text>
                  </View>

                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.detailAttachmentsScroll}>
                    {selectedSuyo.attachments.map((att, idx) => {
                      const isImg = att.type === 'image';
                      return (
                        <View key={att.id || idx} style={styles.detailAttachmentChip}>
                          {isImg ? (
                            <View style={styles.detailAttachmentImageWrap}>
                              <Image source={{ uri: att.uri }} style={styles.detailAttachmentThumb} />
                              <View style={styles.detailAttachmentTag}>
                                <Ionicons name="image" size={10} color="#FFFFFF" />
                                <Text style={styles.detailAttachmentTagText}>Photo</Text>
                              </View>
                            </View>
                          ) : (
                            <View style={styles.detailAttachmentDocWrap}>
                              <Ionicons name="document-text" size={18} color="#B45309" />
                              <Text style={styles.detailAttachmentDocName} numberOfLines={1}>
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
              {selectedSuyoContext === 'posted' && selectedSuyo.status !== 'Cancelled' && (
                <View style={styles.detailBoostCard}>
                  <View style={styles.detailBoostHeader}>
                    <View style={styles.detailBoostIconBox}>
                      <Ionicons name="sparkles" size={15} color="#059669" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.detailBoostTitle}>No one accepting yet?</Text>
                      <Text style={styles.detailBoostSubtitle}>
                        Boost your reward to get accepted faster by nearby doers:
                      </Text>
                    </View>
                  </View>
                  <View style={styles.detailBoostButtonsRow}>
                    <TouchableOpacity
                      style={[
                        styles.detailBoostChip,
                        selectedSuyo.currentBoost === 0 && styles.detailBoostChipGreen,
                      ]}
                      activeOpacity={0.75}
                      onPress={() => handleBoostReward(selectedSuyo.id, 0)}
                    >
                      <Text
                        style={[
                          styles.detailBoostChipText,
                          selectedSuyo.currentBoost === 0 && { color: '#FFFFFF' },
                        ]}
                      >
                        +₱0
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.detailBoostChip,
                        selectedSuyo.currentBoost === 20 && styles.detailBoostChipGreen,
                      ]}
                      activeOpacity={0.75}
                      onPress={() => handleBoostReward(selectedSuyo.id, 20)}
                    >
                      <Text
                        style={[
                          styles.detailBoostChipText,
                          selectedSuyo.currentBoost === 20 && { color: '#FFFFFF' },
                        ]}
                      >
                        +₱20
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.detailBoostChip,
                        selectedSuyo.currentBoost === 50 && styles.detailBoostChipGreen,
                      ]}
                      activeOpacity={0.75}
                      onPress={() => handleBoostReward(selectedSuyo.id, 50)}
                    >
                      <Text
                        style={[
                          styles.detailBoostChipText,
                          selectedSuyo.currentBoost === 50 && { color: '#FFFFFF' },
                        ]}
                      >
                        +₱50
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.detailBoostChip,
                        selectedSuyo.currentBoost === 100 && styles.detailBoostChipGreen,
                      ]}
                      activeOpacity={0.75}
                      onPress={() => handleBoostReward(selectedSuyo.id, 100)}
                    >
                      <Text
                        style={[
                          styles.detailBoostChipText,
                          selectedSuyo.currentBoost === 100 && { color: '#FFFFFF' },
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
                {selectedSuyoContext === 'posted' && (
                  selectedSuyo.status !== 'Cancelled' ? (
                    <>
                      <TouchableOpacity
                        style={styles.detailEditSuyoBtn}
                        onPress={() => handleOpenEditSuyo(selectedSuyo)}
                        activeOpacity={0.8}
                      >
                        <Ionicons name="pencil" size={15} color="#163523" />
                        <Text style={styles.detailEditSuyoBtnText}>Edit</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.detailCancelSuyoBtn}
                        onPress={() => handleCancelSuyo(selectedSuyo.id)}
                        activeOpacity={0.8}
                      >
                        <Ionicons name="close-circle-outline" size={15} color="#DC2626" />
                        <Text style={styles.detailCancelSuyoBtnText}>Cancel</Text>
                      </TouchableOpacity>
                    </>
                  ) : (
                    <TouchableOpacity
                      style={styles.detailPrimaryActionBtn}
                      onPress={() => handleRepeatRequest(selectedSuyo)}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="refresh" size={16} color="#FFFFFF" />
                      <Text style={styles.detailPrimaryActionBtnText}>Re-post Suyo</Text>
                    </TouchableOpacity>
                  )
                )}

                {/* ACCEPTED NAV BUTTONS (Call Doer & Track Live) */}
                {selectedSuyoContext === 'accepted' && (
                  <>
                    <TouchableOpacity
                      style={styles.detailCallDoerBtn}
                      onPress={() => handleCallDoer(selectedSuyo.doer?.phone || DEFAULT_DOER.phone)}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="call" size={15} color="#163523" />
                      <Text style={styles.detailCallDoerBtnText}>Call Doer</Text>
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
                            doerName: selectedSuyo.doer?.name || DEFAULT_DOER.name,
                            doerPhone: selectedSuyo.doer?.phone || DEFAULT_DOER.phone,
                          },
                        });
                      }}
                    >
                      <Ionicons name="navigate" size={16} color="#FFFFFF" />
                      <Text style={styles.detailTrackCourierBtnText}>Track</Text>
                    </TouchableOpacity>
                  </>
                )}

                {/* COMPLETED NAV BUTTONS (Save to Archive, Repeat Suyo) */}
                {selectedSuyoContext === 'completed' && (() => {
                  const isArchived =
                    selectedSuyo &&
                    archivedSuyos.some(
                      (a) => a.id === selectedSuyo.id || a.title === selectedSuyo.title
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
                            isArchived && styles.detailArchiveSuyoBtnTextYellow,
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
                        <Ionicons name="refresh" size={15} color="#FFFFFF" />
                        <Text style={styles.detailRepeatSuyoBtnText}>Repeat Suyo</Text>
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
                        setCancelledSuyos((prev) => prev.filter((s) => s.id !== idToDelete));
                        setSelectedSuyo(null);
                        triggerToast('suyo is successfully deleted', 'trash-outline');
                      }}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="trash-outline" size={15} color="#DC2626" />
                      <Text style={styles.detailCancelSuyoBtnText}>Delete</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.detailRepeatSuyoBtn}
                      onPress={() => handleRepeatRequest(selectedSuyo)}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="refresh" size={15} color="#FFFFFF" />
                      <Text style={styles.detailRepeatSuyoBtnText}>Re-post Suyo</Text>
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
                      <Ionicons name="pencil" size={15} color="#163523" />
                      <Text style={styles.detailEditSuyoBtnText}>Edit</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.detailRepeatSuyoBtn}
                      onPress={() => handleRepeatRequest(selectedSuyo)}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="paper-plane" size={15} color="#FFFFFF" />
                      <Text style={styles.detailRepeatSuyoBtnText}>Post Suyo</Text>
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
                          if (prev.some((s) => s.id === taskToFulfill.id)) return prev;
                          return [
                            {
                              id: taskToFulfill.id,
                              title: taskToFulfill.title,
                              category: taskToFulfill.category || 'General',
                              icon: taskToFulfill.icon || 'bicycle',
                              location: taskToFulfill.location || 'Tagum City',
                              distanceText: taskToFulfill.distanceText || '0.8 km away',
                              reward: taskToFulfill.reward || '₱150',
                              requesterName: taskToFulfill.requesterName || 'Community Member',
                              requesterPhone: taskToFulfill.requesterPhone || '09564781552',
                              deadline: formatTargetDeadline(taskToFulfill),
                              arrivalWindow: formatTargetDeadline(taskToFulfill),
                              acceptedAt: 'Today · Just now',
                              details: taskToFulfill.details || 'Fulfill this suyo request according to requester requirements.',
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
                          title: taskToFulfill?.title || 'Drop off documents - Unit 402',
                          category: taskToFulfill?.category || 'Documents',
                          location: taskToFulfill?.location || taskToFulfill?.exactAddress || 'Unit 402, Makati CBD',
                          distanceText: taskToFulfill?.distanceText || '0.8 km away',
                          reward: taskToFulfill?.reward || (taskToFulfill?.price ? `₱${taskToFulfill.price}` : null) || '₱300',
                          requesterName: taskToFulfill?.requesterName || 'Atty. Rafael Cruz',
                          requesterLocation: taskToFulfill?.location || 'Makati CBD',
                          requesterPhone: taskToFulfill?.requesterPhone || taskToFulfill?.contactPhone || '0917 842 1983',
                          contactPhone: taskToFulfill?.contactPhone || taskToFulfill?.requesterPhone || '0917 842 1983',
                          details: taskToFulfill?.details || 'Delivery of notarized legal documents to Unit 402.',
                          arrivalWindow: formatTargetDeadline(taskToFulfill),
                          deadline: formatTargetDeadline(taskToFulfill),
                          latitude: taskToFulfill?.exactLatitude ?? taskToFulfill?.latitude ?? 7.4528,
                          longitude: taskToFulfill?.exactLongitude ?? taskToFulfill?.longitude ?? 125.8035,
                        },
                      });
                    }}
                  >
                    <Ionicons name="checkmark-circle-outline" size={18} color="#FFFFFF" />
                    <Text style={styles.detailFulfillBtnText}>Fulfill Suyo</Text>
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
                <Ionicons name="warning-outline" size={26} color="#DC2626" />
              </View>
              <Text style={styles.doerCancelModalTitle}>Cancel Accepted Suyo?</Text>
              <Text style={styles.doerCancelModalSub}>
                Are you sure you want to cancel "{doerCancelModalItem.title}"? It will be immediately released back to the public available board so other couriers can fulfill it.
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
                    setDoerAcceptedSuyos((prev) => prev.filter((s) => s.id !== itemToCancel.id));
                    setDoerCancelledSuyos((prev) => [
                      {
                        ...itemToCancel,
                        status: 'Cancelled by Doer',
                        cancelledAt: 'Today · Just now',
                        cancelReason: 'Cancelled by Doer · Released back to board',
                      },
                      ...prev,
                    ]);
                    triggerToast('Suyo cancelled and returned to public board', 'alert');
                  }}
                >
                  <Text style={styles.doerCancelConfirmBtnText}>Yes, Cancel Suyo</Text>
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
                    <Ionicons name={selectedDoerSuyo.icon || 'bicycle'} size={17} color="#1E4D2B" />
                  </View>
                  <View style={{ gap: 2 }}>
                    <Text style={styles.doerDetailCategoryText}>
                      {selectedDoerSuyo.category || 'Doer Task Details'}
                    </Text>
                    <Text style={styles.doerDetailDateText}>
                      {selectedDoerSuyo.acceptedAt || selectedDoerSuyo.date || 'Today'}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  onPress={() => setSelectedDoerSuyo(null)}
                  style={styles.doerDetailCloseBtn}
                  activeOpacity={0.7}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="close" size={18} color="#163523" />
                </TouchableOpacity>
              </View>

              <ScrollView style={{ maxHeight: 420 }} showsVerticalScrollIndicator={false}>
                {/* Title */}
                <Text style={styles.doerDetailTitle}>{selectedDoerSuyo.title}</Text>

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
                      +{selectedDoerSuyo.reward || `₱${selectedDoerSuyo.earnedAmount || 150}`}
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
                        params: {
                          isOtherUser: 'false',
                          name: userProfile?.name || 'Juan Dela Cruz',
                          phone: userProfile?.phone || '+63 917 123 4567',
                        },
                      });
                    } else {
                      const reqName = selectedDoerSuyo.requesterName || 'Community Member';
                      const reqRating = selectedDoerSuyo.requesterRating ? String(selectedDoerSuyo.requesterRating).replace(/[★*?]/g, '').trim() : '';
                      const reqDone = (selectedDoerSuyo.completedCount || selectedDoerSuyo.suyosPosted || '0').replace(/[^0-9]/g, '') || '0';
                      const reqPhone = selectedDoerSuyo.requesterPhone || '+63 917 888 2341';

                      router.push({
                        pathname: '/profile',
                        params: {
                          name: reqName,
                          ...(reqRating ? { rating: reqRating } : {}),
                          done: reqDone,
                          phone: reqPhone,
                          location: selectedDoerSuyo.location || 'Tagum City',
                          isOtherUser: 'true',
                        },
                      });
                    }
                  }}
                  accessibilityRole="button"
                  accessibilityLabel="View requester profile"
                >
                  <View style={styles.doerRequesterCardTop}>
                    <Text style={styles.doerRequesterSectionLabel}>REQUESTED BY</Text>
                    <View style={styles.doerRequesterViewProfilePill}>
                      <Text style={styles.doerRequesterViewProfileText}>View Profile</Text>
                      <Ionicons name="chevron-forward" size={10} color="#059669" />
                    </View>
                  </View>

                  <View style={styles.doerRequesterCardMainRow}>
                    <View style={styles.doerRequesterAvatar}>
                      <Text style={styles.doerRequesterAvatarText}>
                        {getInitials(selectedDoerSuyo.requesterName || 'Community Member')}
                      </Text>
                    </View>
                    <View style={{ flex: 1, paddingRight: 6 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <Text style={styles.doerRequesterName} numberOfLines={1}>
                          {selectedDoerSuyo.requesterName || 'Community Member'}
                        </Text>
                        <Ionicons name="checkmark-circle" size={13} color="#059669" />
                      </View>
                      <Text style={styles.doerRequesterSubMeta}>
                        {selectedDoerSuyo.requesterRating || 'New'} · Prompt Payer
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
                            style={[styles.doerRequesterCallPill, { backgroundColor: '#1E4D2B' }]}
                            activeOpacity={0.8}
                            onPress={(e) => {
                              e?.stopPropagation?.();
                              setSelectedDoerSuyo(null);
                              router.push({
                                pathname: '/profile',
                                params: {
                                  isOtherUser: 'false',
                                  name: userProfile?.name || 'Juan Dela Cruz',
                                  phone: userProfile?.phone || '+63 917 123 4567',
                                },
                              });
                            }}
                            accessibilityRole="button"
                            accessibilityLabel="Edit profile"
                          >
                            <Ionicons name="pencil" size={12} color="#FFFFFF" />
                            <Text style={styles.doerRequesterCallPillText}>Edit</Text>
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
                              Linking.openURL(`tel:${selectedDoerSuyo.requesterPhone}`);
                            }}
                            accessibilityRole="button"
                            accessibilityLabel="Call requester"
                          >
                            <Ionicons name="call" size={12} color="#FFFFFF" />
                            <Text style={styles.doerRequesterCallPillText}>Call</Text>
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
                      <View style={[styles.doerInfoIconCircle, { backgroundColor: '#E0F2FE' }]}>
                        <Ionicons name="location-sharp" size={13} color="#0284C7" />
                      </View>
                      <Text style={styles.doerInfoGridLabel}>LOCATION</Text>
                    </View>
                    <Text style={styles.doerInfoGridValue} numberOfLines={2}>
                      {selectedDoerSuyo.location || 'Tagum City'}
                    </Text>
                  </View>

                  {/* Deadline / Time Tile */}
                  <View style={styles.doerInfoGridTile}>
                    <View style={styles.doerInfoGridTileHeader}>
                      <View style={[styles.doerInfoIconCircle, { backgroundColor: '#FEF3C7' }]}>
                        <Ionicons name="time" size={13} color="#D97706" />
                      </View>
                      <Text style={styles.doerInfoGridLabel}>DEADLINE</Text>
                    </View>
                    <Text style={styles.doerInfoGridValue} numberOfLines={2}>
                      {selectedDoerSuyo.deadline || selectedDoerSuyo.due || 'Flexible time'}
                    </Text>
                  </View>
                </View>

                {/* Task Description Section */}
                <View style={styles.doerTaskDescCard}>
                  <View style={styles.doerSectionHeaderRow}>
                    <View style={[styles.doerInfoIconCircle, { backgroundColor: '#E8F5EE' }]}>
                      <Ionicons name="reader-outline" size={13} color="#1E4D2B" />
                    </View>
                    <Text style={styles.doerSectionHeaderText}>TASK DESCRIPTION</Text>
                  </View>
                  <Text style={styles.doerTaskDescBody}>
                    {selectedDoerSuyo.details || 'Fulfill this suyo request according to requester requirements.'}
                  </Text>
                </View>

                {/* Special Instructions (Notes) */}
                {selectedDoerSuyo.notes ? (
                  <View style={styles.doerNotesCard}>
                    <View style={styles.doerSectionHeaderRow}>
                      <View style={[styles.doerInfoIconCircle, { backgroundColor: '#FEF3C7' }]}>
                        <Ionicons name="bulb-outline" size={13} color="#B45309" />
                      </View>
                      <Text style={[styles.doerSectionHeaderText, { color: '#B45309' }]}>
                        SPECIAL INSTRUCTIONS
                      </Text>
                    </View>
                    <Text style={styles.doerNotesBody}>{selectedDoerSuyo.notes}</Text>
                  </View>
                ) : null}

                {/* Attached Photos & Files Section */}
                {selectedDoerSuyo.attachments && selectedDoerSuyo.attachments.length > 0 && (
                  <View style={styles.doerAttachmentsCard}>
                    <View style={styles.doerSectionHeaderRow}>
                      <View style={[styles.doerInfoIconCircle, { backgroundColor: '#E8F5EE' }]}>
                        <Ionicons name="attach" size={13} color="#1E4D2B" />
                      </View>
                      <Text style={styles.doerSectionHeaderText}>
                        ATTACHED PHOTOS & FILES ({selectedDoerSuyo.attachments.length})
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
                          <View key={att.id || idx} style={styles.detailAttachmentChip}>
                            {isImg ? (
                              <View style={styles.detailAttachmentImageWrap}>
                                <Image source={{ uri: att.uri }} style={styles.detailAttachmentThumb} />
                                <View style={styles.detailAttachmentTag}>
                                  <Ionicons name="image" size={10} color="#FFFFFF" />
                                  <Text style={styles.detailAttachmentTagText}>Photo</Text>
                                </View>
                              </View>
                            ) : (
                              <View style={styles.detailAttachmentDocWrap}>
                                <Ionicons name="document-text" size={18} color="#B45309" />
                                <Text style={styles.detailAttachmentDocName} numberOfLines={1}>
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
                  <Ionicons name="information-circle" size={15} color="#059669" />
                  <Text style={styles.doerModalInfoHintText}>
                    Review the details above to decide whether to continue or cancel this suyo on your main Doer Suyo card.
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
                  <Ionicons name="close" size={18} color="#163523" />
                </TouchableOpacity>
              </View>

              {/* Profile Hero */}
              <View style={styles.doerProfileHero}>
                <View style={styles.doerProfileAvatarCircle}>
                  <Text style={styles.doerProfileAvatarInitials}>
                    {getInitials(selectedDoerProfile.name)}
                  </Text>
                  <View style={styles.doerVerifiedBadge}>
                    <Ionicons name="shield-checkmark" size={12} color="#FFFFFF" />
                  </View>
                </View>
                <Text style={styles.doerProfileName}>{selectedDoerProfile.name}</Text>
                <View style={styles.doerVerifiedTag}>
                  <Ionicons name="checkmark-circle" size={12} color="#059669" />
                  <Text style={styles.doerVerifiedTagText}>Verified Courier & Doer</Text>
                </View>
                <Text style={styles.doerProfileRating}>
                  ⭐ {selectedDoerProfile.rating ? `${selectedDoerProfile.rating}★` : 'New'} · {selectedDoerProfile.completedCount || '0 suyos delivered'}
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
                  <Ionicons name="call" size={15} color="#1E4D2B" />
                  <Text style={styles.doerInfoLabel}>Contact:</Text>
                  <Text style={styles.doerInfoValue}>{selectedDoerProfile.phone || '+63 917 555 0192'}</Text>
                </View>
                <View style={styles.doerInfoRow}>
                  <Ionicons name="calendar-outline" size={15} color="#1E4D2B" />
                  <Text style={styles.doerInfoLabel}>Joined:</Text>
                  <Text style={styles.doerInfoValue}>{selectedDoerProfile.joinedDate || 'March 2023'}</Text>
                </View>
              </View>

              {/* Bio snippet */}
              <Text style={styles.doerBioText}>
                "{selectedDoerProfile.bio || 'Reliable and fast delivery courier in Tagum and Davao area. Careful with groceries and delicate items.'}"
              </Text>

              {/* Actions */}
              <View style={styles.doerProfileActionsRow}>
                <TouchableOpacity
                  style={styles.doerProfileCallBtn}
                  activeOpacity={0.8}
                  onPress={() => triggerToast(`Calling ${selectedDoerProfile.name}...`, 'call')}
                >
                  <Ionicons name="call" size={15} color="#FFFFFF" />
                  <Text style={styles.doerProfileCallBtnText}>Call Doer</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.doerProfileMsgBtn}
                  activeOpacity={0.8}
                  onPress={() => triggerToast(`Opening chat with ${selectedDoerProfile.name}...`, 'chatbubble-ellipses')}
                >
                  <Ionicons name="chatbubble-ellipses" size={15} color="#1E4D2B" />
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
                <Ionicons name="close" size={18} color="#163523" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 380 }}>
              <Text style={styles.editSuyoInputLabel}>Title</Text>
              <TextInput
                style={styles.editSuyoTextInput}
                value={editingSuyoData.title}
                onChangeText={(text) => setEditingSuyoData((prev) => ({ ...prev, title: text }))}
                placeholder="e.g. Buy groceries at SM Tagum"
                placeholderTextColor="#94A3B8"
              />

              <Text style={styles.editSuyoInputLabel}>Reward Offer (₱)</Text>
              <View style={styles.editSuyoRewardRow}>
                <TextInput
                  style={[styles.editSuyoTextInput, { flex: 1, marginBottom: 0 }]}
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
                onChangeText={(text) => setEditingSuyoData((prev) => ({ ...prev, details: text }))}
                multiline={true}
                numberOfLines={3}
                placeholder="Detailed task description..."
                placeholderTextColor="#94A3B8"
              />

              <Text style={styles.editSuyoInputLabel}>Special Notes / Instructions (Optional)</Text>
              <TextInput
                style={[styles.editSuyoTextInput, styles.editSuyoTextArea]}
                value={editingSuyoData.notes}
                onChangeText={(text) => setEditingSuyoData((prev) => ({ ...prev, notes: text }))}
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
                <Ionicons name="checkmark-sharp" size={16} color="#FFFFFF" />
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
                <Ionicons name="close" size={18} color="#163523" />
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
                        if (selectedFavIdsToDelete.length === favoriteSuyos.length) {
                          setSelectedFavIdsToDelete([]);
                        } else {
                          setSelectedFavIdsToDelete(favoriteSuyos.map((s) => s.id));
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
                  name={toastConfig.icon === 'heart-dislike' ? 'trash' : 'heart'}
                  size={12}
                  color="#DC2626"
                />
                <Text style={styles.favModalToastText}>{toastConfig.message}</Text>
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
                        isFavDeleteMode && isSelected && styles.favCardItemSelected,
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
                              <Ionicons name="checkmark" size={11} color="#FFFFFF" />
                            )}
                          </View>
                        )}

                        <View style={{ flex: 1, paddingRight: 8 }}>
                          <Text style={styles.favCardTitle} numberOfLines={2}>
                            {suyo.title}
                          </Text>
                          <Text style={styles.favCardLocation}>
                            <Ionicons name="location-sharp" size={10.5} color="#0D9488" />{' '}
                            {suyo.location || 'Quezon City'} • {suyo.distanceText || '0.8 km away'}
                          </Text>
                        </View>

                        <View style={{ alignItems: 'flex-end', justifyContent: 'center' }}>
                          <Text style={styles.favCardReward}>{suyo.reward}</Text>
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
                                getInitials(suyo.requesterName || 'Maria Clarissa')}
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
                <Ionicons name="bookmark-outline" size={36} color="#A3B8AC" />
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
                <Ionicons name="notifications" size={20} color="#1E4D2B" />
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
                <Ionicons name="close" size={20} color="#163523" />
              </TouchableOpacity>
            </View>

            {/* Quick Actions & Filter Row */}
            <View style={styles.notifTopActionsRow}>
              <View style={styles.notifFilterPillsWrap}>
                <TouchableOpacity
                  style={[
                    styles.notifFilterPill,
                    notificationFilter === 'All' && styles.notifFilterPillActive,
                  ]}
                  onPress={() => setNotificationFilter('All')}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.notifFilterPillText,
                      notificationFilter === 'All' && styles.notifFilterPillTextActive,
                    ]}
                  >
                    All ({notifications.length})
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.notifFilterPill,
                    notificationFilter === 'Unread' && styles.notifFilterPillActive,
                  ]}
                  onPress={() => setNotificationFilter('Unread')}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.notifFilterPillText,
                      notificationFilter === 'Unread' && styles.notifFilterPillTextActive,
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
                  <Ionicons name="checkmark-done" size={14} color="#1E4D2B" />
                  <Text style={styles.notifMarkAllReadText}>Mark read</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Notifications List */}
            {notifications.filter((n) =>
              notificationFilter === 'Unread' ? n.unread : true
            ).length > 0 ? (
              <ScrollView
                style={styles.notifScrollList}
                contentContainerStyle={{ paddingBottom: 6 }}
                showsVerticalScrollIndicator={false}
              >
                {notifications
                  .filter((n) =>
                    notificationFilter === 'Unread' ? n.unread : true
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
                  <Ionicons name="trash-outline" size={15} color="#64748B" />
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
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={styles.receiptHeaderBadge}>
                  <Ionicons name="checkmark-done-circle" size={18} color="#15803D" />
                </View>
                <Text style={styles.receiptModalHeaderTitle}>Official E-Receipt</Text>
              </View>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setSelectedReceipt(null)}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={18} color="#163523" />
              </TouchableOpacity>
            </View>

            {selectedReceipt && (
              <ScrollView style={styles.receiptScrollContent} showsVerticalScrollIndicator={false}>
                {/* Ticket Body */}
                <View style={styles.receiptTicketBox}>
                  <Text style={styles.receiptBrandTitle}>SUYOLINK PHILIPPINES</Text>
                  <Text style={styles.receiptBrandTag}>Community Suyo & Courier Platform</Text>
                  <Text style={styles.receiptRefDisplay}>{selectedReceipt.refNo}</Text>

                  <View style={styles.receiptDashedLine} />

                  {/* General Info */}
                  <View style={styles.receiptRow}>
                    <Text style={styles.receiptLabel}>Transaction Date:</Text>
                    <Text style={styles.receiptValue}>{selectedReceipt.date}</Text>
                  </View>
                  <View style={styles.receiptRow}>
                    <Text style={styles.receiptLabel}>Status:</Text>
                    <Text style={[styles.receiptValue, { color: '#15803D', fontWeight: '700' }]}>
                      {selectedReceipt.status} · Verified
                    </Text>
                  </View>
                  <View style={styles.receiptRow}>
                    <Text style={styles.receiptLabel}>Category:</Text>
                    <Text style={styles.receiptValue}>{selectedReceipt.category}</Text>
                  </View>
                  <View style={styles.receiptRow}>
                    <Text style={styles.receiptLabel}>Suyo / Task:</Text>
                    <Text style={[styles.receiptValue, { flex: 1, textAlign: 'right' }]}>
                      {selectedReceipt.title}
                    </Text>
                  </View>
                  <View style={styles.receiptRow}>
                    <Text style={styles.receiptLabel}>Location:</Text>
                    <Text style={styles.receiptValue}>{selectedReceipt.location}</Text>
                  </View>

                  <View style={styles.receiptDashedLine} />

                  {/* Personnel */}
                  {selectedReceipt.doer && (
                    <View style={styles.receiptRow}>
                      <Text style={styles.receiptLabel}>Assigned Courier:</Text>
                      <Text style={styles.receiptValue}>
                        {selectedReceipt.doer.name} ({selectedReceipt.doer.rating})
                      </Text>
                    </View>
                  )}
                  {selectedReceipt.requesterName && (
                    <View style={styles.receiptRow}>
                      <Text style={styles.receiptLabel}>Requester:</Text>
                      <Text style={styles.receiptValue}>{selectedReceipt.requesterName}</Text>
                    </View>
                  )}
                  <View style={styles.receiptRow}>
                    <Text style={styles.receiptLabel}>Payment Method:</Text>
                    <Text style={styles.receiptValue}>{selectedReceipt.paymentMethod}</Text>
                  </View>
                  <View style={styles.receiptRow}>
                    <Text style={styles.receiptLabel}>Payment Ref #:</Text>
                    <Text style={styles.receiptValue}>{selectedReceipt.paymentRef}</Text>
                  </View>

                  <View style={styles.receiptDashedLine} />

                  {/* Financial Breakdown */}
                  <View style={styles.receiptRow}>
                    <Text style={styles.receiptLabel}>Base Suyo Reward:</Text>
                    <Text style={styles.receiptValue}>₱{selectedReceipt.amount.toFixed(2)}</Text>
                  </View>
                  {selectedReceipt.platformFee > 0 && (
                    <View style={styles.receiptRow}>
                      <Text style={styles.receiptLabel}>Platform Convenience Fee:</Text>
                      <Text style={styles.receiptValue}>₱{selectedReceipt.platformFee.toFixed(2)}</Text>
                    </View>
                  )}

                  <View style={styles.receiptTotalRow}>
                    <Text style={styles.receiptTotalLabel}>Total Amount:</Text>
                    <Text style={styles.receiptTotalValue}>₱{selectedReceipt.totalAmount.toFixed(2)}</Text>
                  </View>

                  {/* Proof Badge */}
                  <View style={styles.receiptProofBox}>
                    <Ionicons name="shield-checkmark" size={17} color="#059669" />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.receiptProofTitle}>Proof of Delivery Verified</Text>
                      <Text style={styles.receiptProofSub}>
                        {selectedReceipt.proofDetails ||
                          'Cryptographically stamped photo & GPS handover verified by SuyoLink.'}
                      </Text>
                    </View>
                  </View>

                  {/* Barcode Simulator */}
                  <View style={styles.receiptBarcodeBox}>
                    <View style={styles.receiptBarcodeBars} />
                    <Text style={styles.receiptBarcodeText}>* {selectedReceipt.refNo} *</Text>
                  </View>
                </View>

                {/* Action Buttons */}
                <View style={styles.receiptActionsRow}>
                  <TouchableOpacity
                    style={styles.receiptShareActionBtn}
                    onPress={() => {
                      triggerToast('E-Receipt downloaded & saved to device', 'download-outline');
                    }}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="share-social-outline" size={15} color="#163523" />
                    <Text style={styles.receiptShareActionBtnText}>Save / Share Receipt</Text>
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
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={styles.statsIconBadge}>
                  <Ionicons name="stats-chart" size={17} color="#0284C7" />
                </View>
                <Text style={styles.modalTitle}>Suyo Statistics</Text>
              </View>
              <TouchableOpacity
                onPress={() => setIsStatisticsModalOpen(false)}
                style={styles.modalCloseButton}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={20} color="#163523" />
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
                  <Text style={[styles.statsTileValue, { color: '#059669' }]}>100%</Text>
                  <Text style={styles.statsTileLabel}>Completion</Text>
                  <Text style={styles.statsTileSub}>0 Cancellations</Text>
                </View>
              </View>

              <View style={[styles.statsMetricsGrid, { marginTop: 8 }]}>
                <View style={styles.statsMetricTile}>
                  <Text style={styles.statsTileValue}>
                    {userRatingStats.rating ? `${userRatingStats.rating}★` : 'New'}
                  </Text>
                  <Text style={styles.statsTileLabel}>Customer Rating</Text>
                  <Text style={styles.statsTileSub}>
                    {userRatingStats.reviewCount > 0 ? `${userRatingStats.reviewCount} Reviews` : 'No reviews yet'}
                  </Text>
                </View>
                <View style={styles.statsMetricTile}>
                  <Text style={[styles.statsTileValue, { color: '#059669' }]}>
                    {userRatingStats.reviewCount > 0 ? `${userRatingStats.satisfactionRate}%` : '100%'}
                  </Text>
                  <Text style={styles.statsTileLabel}>Satisfaction</Text>
                  <Text style={styles.statsTileSub}>Positive Feedback</Text>
                </View>
              </View>

              {/* Customer Satisfaction Breakdown Graph */}
              <View style={styles.statsCategoryCard}>
                <View style={styles.statsCategoryHeaderRow}>
                  <View style={{ flex: 1, paddingRight: 6 }}>
                    <Text style={styles.statsSectionHeading}>Customer Satisfaction</Text>
                    <Text style={styles.statsSectionSubheading}>
                      Community ratings ({userRatingStats.reviewCount} reviews)
                    </Text>
                  </View>
                  <View style={styles.statsSatisfactionScoreBadge}>
                    <Ionicons name="star" size={12} color="#F59E0B" />
                    <Text style={styles.statsSatisfactionScoreText}>
                      {userRatingStats.rating ? `${userRatingStats.rating} / 5.0` : 'New'}
                    </Text>
                  </View>
                </View>

                {/* Rating Distribution Bar Graph */}
                <View style={styles.csatBarsContainer}>
                  {/* 5 Stars */}
                  <View style={styles.csatBarRow}>
                    <View style={styles.csatStarLabelRow}>
                      <Text style={styles.csatStarText}>5</Text>
                      <Ionicons name="star" size={10} color="#F59E0B" />
                    </View>
                    <View style={styles.csatTrack}>
                      <View
                        style={[
                          styles.csatFill,
                          {
                            width: `${userRatingStats.reviewCount > 0 ? Math.round(((userRatingStats.breakdown[5] || 0) / userRatingStats.reviewCount) * 100) : 0}%`,
                            backgroundColor: '#059669',
                          },
                        ]}
                      />
                    </View>
                    <Text style={styles.csatPctText}>
                      {userRatingStats.reviewCount > 0
                        ? `${Math.round(((userRatingStats.breakdown[5] || 0) / userRatingStats.reviewCount) * 100)}% (${userRatingStats.breakdown[5] || 0})`
                        : '0% (0)'}
                    </Text>
                  </View>

                  {/* 4 Stars */}
                  <View style={styles.csatBarRow}>
                    <View style={styles.csatStarLabelRow}>
                      <Text style={styles.csatStarText}>4</Text>
                      <Ionicons name="star" size={10} color="#F59E0B" />
                    </View>
                    <View style={styles.csatTrack}>
                      <View
                        style={[
                          styles.csatFill,
                          {
                            width: `${userRatingStats.reviewCount > 0 ? Math.round(((userRatingStats.breakdown[4] || 0) / userRatingStats.reviewCount) * 100) : 0}%`,
                            backgroundColor: '#0284C7',
                          },
                        ]}
                      />
                    </View>
                    <Text style={styles.csatPctText}>
                      {userRatingStats.reviewCount > 0
                        ? `${Math.round(((userRatingStats.breakdown[4] || 0) / userRatingStats.reviewCount) * 100)}% (${userRatingStats.breakdown[4] || 0})`
                        : '0% (0)'}
                    </Text>
                  </View>

                  {/* 3 Stars */}
                  <View style={styles.csatBarRow}>
                    <View style={styles.csatStarLabelRow}>
                      <Text style={styles.csatStarText}>3</Text>
                      <Ionicons name="star" size={10} color="#F59E0B" />
                    </View>
                    <View style={styles.csatTrack}>
                      <View
                        style={[
                          styles.csatFill,
                          {
                            width: `${userRatingStats.reviewCount > 0 ? Math.round(((userRatingStats.breakdown[3] || 0) / userRatingStats.reviewCount) * 100) : 0}%`,
                            backgroundColor: '#D97706',
                          },
                        ]}
                      />
                    </View>
                    <Text style={styles.csatPctText}>
                      {userRatingStats.reviewCount > 0
                        ? `${Math.round(((userRatingStats.breakdown[3] || 0) / userRatingStats.reviewCount) * 100)}% (${userRatingStats.breakdown[3] || 0})`
                        : '0% (0)'}
                    </Text>
                  </View>

                  {/* 2 Stars */}
                  <View style={styles.csatBarRow}>
                    <View style={styles.csatStarLabelRow}>
                      <Text style={styles.csatStarText}>2</Text>
                      <Ionicons name="star" size={10} color="#CBD5E1" />
                    </View>
                    <View style={styles.csatTrack}>
                      <View
                        style={[
                          styles.csatFill,
                          {
                            width: `${userRatingStats.reviewCount > 0 ? Math.round(((userRatingStats.breakdown[2] || 0) / userRatingStats.reviewCount) * 100) : 0}%`,
                            backgroundColor: '#94A3B8',
                          },
                        ]}
                      />
                    </View>
                    <Text style={styles.csatPctText}>
                      {userRatingStats.reviewCount > 0
                        ? `${Math.round(((userRatingStats.breakdown[2] || 0) / userRatingStats.reviewCount) * 100)}% (${userRatingStats.breakdown[2] || 0})`
                        : '0% (0)'}
                    </Text>
                  </View>

                  {/* 1 Star */}
                  <View style={styles.csatBarRow}>
                    <View style={styles.csatStarLabelRow}>
                      <Text style={styles.csatStarText}>1</Text>
                      <Ionicons name="star" size={10} color="#CBD5E1" />
                    </View>
                    <View style={styles.csatTrack}>
                      <View
                        style={[
                          styles.csatFill,
                          {
                            width: `${userRatingStats.reviewCount > 0 ? Math.round(((userRatingStats.breakdown[1] || 0) / userRatingStats.reviewCount) * 100) : 0}%`,
                            backgroundColor: '#94A3B8',
                          },
                        ]}
                      />
                    </View>
                    <Text style={styles.csatPctText}>
                      {userRatingStats.reviewCount > 0
                        ? `${Math.round(((userRatingStats.breakdown[1] || 0) / userRatingStats.reviewCount) * 100)}% (${userRatingStats.breakdown[1] || 0})`
                        : '0% (0)'}
                    </Text>
                  </View>
                </View>

                {/* Key Satisfaction Metric Badges */}
                <View style={styles.csatHighlightsRow}>
                  <View style={styles.csatHighlightChip}>
                    <Ionicons name="checkmark-circle" size={12} color="#059669" />
                    <Text style={styles.csatHighlightText} numberOfLines={1}>Punctual (98%)</Text>
                  </View>
                  <View style={styles.csatHighlightChip}>
                    <Ionicons name="shield-checkmark" size={12} color="#0284C7" />
                    <Text style={styles.csatHighlightText} numberOfLines={1}>Careful (99%)</Text>
                  </View>
                </View>
              </View>

              {/* Payment & Settlement Note */}
              <View style={styles.statsInfoNotice}>
                <Ionicons name="call-outline" size={14} color="#1E4D2B" />
                <Text style={styles.statsInfoNoticeText}>
                  All payment settlements are arranged directly between requesters and doers via call or conversation outside the app.
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
        <SafeAreaView edges={['top', 'bottom']} style={styles.sidebarSafeArea}>
          <View style={styles.sidebarHeader}>
            <View style={styles.sidebarBrandRow}>
              <View style={styles.sidebarLogoCircle}>
                <Ionicons name="paper-plane" size={16} color="#1E4D2B" />
              </View>
              <Text style={styles.sidebarBrandTitle}>SuyoLink</Text>
            </View>
            <TouchableOpacity
              onPress={closeSidebar}
              style={styles.sidebarCloseButton}
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={20} color="#163523" />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.sidebarScroll}
            contentContainerStyle={styles.sidebarScrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Account Card (Matches Suyo Detail Accounts Style) */}
            <View style={styles.sidebarAccountCard}>
              <TouchableOpacity
                style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}
                activeOpacity={0.75}
                onPress={() => {
                  closeSidebar();
                  router.push({
                    pathname: '/account',
                    params: {
                      name: userProfile?.name || 'Juan Dela Cruz',
                      done: String(overallCompletedCount),
                      phone: userProfile?.phone || '+63 917 123 4567',
                      isOtherUser: 'false',
                    },
                  });
                }}
                accessibilityRole="button"
                accessibilityLabel="View account"
              >
                <View style={styles.detailAvatarCircle}>
                  <Text style={styles.detailAvatarInitials}>
                    {getInitials(userProfile?.name || 'Juan Dela Cruz')}
                  </Text>
                </View>
                <View style={[styles.detailRequestorTextCol, { flex: 1 }]}>
                  <Text style={styles.detailRequestorName} numberOfLines={1}>
                    {userProfile?.name || 'Juan Dela Cruz'}
                  </Text>
                  <Text style={styles.detailRequestorMeta}>
                    {userRatingStats.rating ? `${userRatingStats.rating}★` : 'New'} · {overallCompletedCount} completed
                  </Text>
                  <View style={styles.detailRequestorPhoneRow}>
                    <Ionicons name="call" size={11} color="#6D8777" />
                    <Text style={styles.detailRequestorPhoneText}>
                      {userProfile?.phone || '+63 917 123 4567'}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  setTempProfile({ ...userProfile });
                  setIsEditModalOpen(true);
                }}
                style={styles.smallEditIconButton}
                activeOpacity={0.75}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                accessibilityRole="button"
                accessibilityLabel="Edit profile"
              >
                <Ionicons name="pencil" size={13} color="#1E4D2B" />
              </TouchableOpacity>
            </View>

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
              <Ionicons name="chevron-forward" size={16} color="#7A9384" />
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
              <Ionicons name="chevron-forward" size={16} color="#7A9384" />
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
                  <Text style={styles.aboutMetaValue}>1.0.0 (Build 2026.1)</Text>
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
                    'notifications'
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
                try { await logout(); } catch (_) {}
                router.replace('/');
              }}
            >
              <Ionicons name="log-out-outline" size={20} color="#D32F2F" />
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
                <Ionicons name="close" size={20} color="#163523" />
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
                <Ionicons name="checkmark" size={16} color="#FFFFFF" />
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
          <View style={styles.toastModalBackdrop} pointerEvents="box-none">
            {renderFooterToast({ position: 'absolute', bottom: 74 + bottomInset })}
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: '#1C3A27',
  },

  /* Fixed Top Bar */
  fixedTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
    backgroundColor: '#1C3A27',
    zIndex: 100,
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerIconButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  unreadBadgeDot: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#E05A47',
  },
  headerNotifBadge: {
    position: 'absolute',
    top: 5,
    right: 5,
    minWidth: 17,
    height: 17,
    borderRadius: 8.5,
    backgroundColor: '#E05A47',
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#1C3A27',
  },
  headerNotifBadgeText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#FFFFFF',
    lineHeight: 12,
  },

  /* Content Scroll */
  contentScroll: {
    flex: 1,
    backgroundColor: '#F8FAF9',
    marginTop: -1,
  },
  contentContainer: {
    paddingBottom: 85,
  },

  /* Hero Section */
  headerHeroSection: {
    width: '100%',
    height: 185,
    backgroundColor: '#1C3A27',
    overflow: 'hidden',
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  heroTextBlock: {
    flex: 1.1,
    justifyContent: 'center',
    zIndex: 2,
    paddingRight: 8,
  },
  heroImageSticker: {
    width: '58%',
    height: '135%',
    position: 'absolute',
    right: -12,
    top: -15,
    zIndex: 1,
  },
  locationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    gap: 4,
    marginBottom: 8,
  },
  locationPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#D4E8DC',
    letterSpacing: 0.2,
  },
  welcomeSubText: {
    fontSize: 11.5,
    color: '#A8D5B8',
    fontWeight: '700',
    letterSpacing: 1.2,
    marginBottom: 2,
  },
  welcomeNameText: {
    fontSize: 21,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
    marginBottom: 4,
    lineHeight: 26,
  },
  welcomeTagline: {
    fontSize: 12,
    color: '#D0EDD9',
    fontWeight: '500',
  },

  /* White Content Body */
  whiteContentBody: {
    backgroundColor: '#F8FAF9',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: -20,
    paddingHorizontal: 20,
    paddingTop: 12,
    zIndex: 3,
  },

  /* Search Bar + Filter */
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 20,
    marginTop: 8,
  },
  searchBarContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.2,
    borderColor: '#D8E5DF',
    borderRadius: 16,
    paddingHorizontal: 12,
    height: 48,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#163523',
    paddingVertical: Platform.OS === 'ios' ? 8 : 4,
    paddingHorizontal: 0,
    minWidth: 0,
  },
  filterIconButton: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.2,
    borderColor: '#D8E5DF',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    elevation: 2,
  },
  filterIconButtonActive: {
    backgroundColor: '#1E4D2B',
    borderColor: '#1E4D2B',
  },
  filterActiveBadgeDot: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#E05A47',
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  filterActiveBadgeText: {
    color: '#FFFFFF',
    fontSize: 9.5,
    fontWeight: '800',
  },

  sectionHeading: {
    fontSize: 16,
    fontWeight: '800',
    color: '#163523',
    marginBottom: 14,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 24,
    marginBottom: 14,
  },
  nearestHeaderBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EAF4EF',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  nearestHeaderText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E4D2B',
  },
  availableCountBadge: {
    backgroundColor: '#EAF4EF',
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D1E5D9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  availableCountBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1E4D2B',
  },
  clearFiltersPill: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 10,
    paddingVertical: 4.5,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  clearFiltersText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },

  /* Available Suyo List Cards */
  tasksList: {
    gap: 10,
  },
  suyoCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.2,
    borderColor: '#DFECE5',
    borderRadius: 16,
    padding: 14,
    elevation: 1.5,
  },
  suyoCardTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  suyoCardTitle: {
    flex: 1,
    fontSize: 14.5,
    fontWeight: '700',
    color: '#163523',
    marginRight: 10,
    lineHeight: 19,
  },
  suyoCardReward: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1E4D2B',
  },
  suyoCardBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  suyoCardDistanceSub: {
    fontSize: 12,
    color: '#718C7D',
  },
  suyoTagPill: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  suyoTagPillText: {
    fontSize: 10.5,
    fontWeight: '700',
  },
  suyoTagUrgent: {
    backgroundColor: '#FEE2E2',
  },
  suyoTagUrgentText: {
    color: '#DC2626',
  },
  suyoTagToday: {
    backgroundColor: '#FEF3C7',
  },
  suyoTagTodayText: {
    color: '#D97706',
  },
  suyoTagNormal: {
    backgroundColor: '#E8F5EE',
  },
  suyoTagNormalText: {
    color: '#1E4D2B',
  },
  suyoTagTomorrow: {
    backgroundColor: '#E0F2FE',
  },
  suyoTagTomorrowText: {
    color: '#0369A1',
  },
  suyoTagFlexible: {
    backgroundColor: '#F3E8FF',
  },
  suyoTagFlexibleText: {
    color: '#7E22CE',
  },

  /* Empty State */
  emptyStateBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1.2,
    borderColor: '#DFECE5',
    padding: 24,
    alignItems: 'center',
    gap: 8,
  },
  emptyStateTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#163523',
  },
  emptyStateSub: {
    fontSize: 12,
    color: '#718C7D',
    textAlign: 'center',
    lineHeight: 18,
  },
  emptyResetBtn: {
    marginTop: 6,
    backgroundColor: '#1E4D2B',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  emptyResetBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },

  /* Floating Active Suyo Progress Card */
  floatingActiveModalWrapper: {
    position: 'absolute',
    left: 14,
    right: 14,
    zIndex: 90,
  },
  floatingActiveModalTouchable: {
    borderRadius: 14,
    elevation: 5,
  },
  floatingActiveModalGradient: {
    borderRadius: 14,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1.2,
    borderColor: '#CBE4D5',
  },
  floatingModalTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  floatingActiveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(30, 77, 43, 0.09)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
    gap: 4,
  },
  pulsingGreenDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#1E4D2B',
  },
  floatingActiveBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#1E4D2B',
    letterSpacing: 0.4,
  },
  floatingTrackingTag: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  floatingTrackingText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#1E4D2B',
  },
  floatingModalBodyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  floatingModalTitle: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#163523',
    letterSpacing: -0.2,
  },
  floatingModalSub: {
    fontSize: 11,
    fontWeight: '500',
    color: '#4F735F',
  },
  floatingModalChevronCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(30, 77, 43, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  floatingProgressTrack: {
    height: 3,
    backgroundColor: '#D7E8DC',
    borderRadius: 1.5,
    overflow: 'hidden',
  },
  floatingProgressFill: {
    height: '100%',
    backgroundColor: '#1E4D2B',
    borderRadius: 1.5,
  },

  /* Bottom Nav */
  bottomNavContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: '#E2ECE7',
    zIndex: 95,
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    height: '100%',
    paddingVertical: 4,
  },
  navItemText: {
    fontSize: 10.5,
    color: '#8FA497',
    fontWeight: '600',
    marginTop: 3,
  },
  navItemTextActive: {
    color: '#1E4D2B',
    fontWeight: '700',
  },

  /* Sidebar */
  sidebarBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    zIndex: 200,
  },
  sidebarDrawer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    backgroundColor: '#FFFFFF',
    zIndex: 201,
    elevation: 16,
  },
  sidebarSafeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  sidebarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#EEF4F0',
  },
  sidebarBrandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sidebarLogoCircle: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#D7EBE0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sidebarBrandTitle: {
    fontSize: 16.5,
    fontWeight: '800',
    color: '#163523',
    letterSpacing: -0.2,
  },
  sidebarCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F0F5F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sidebarScroll: {
    flex: 1,
  },
  sidebarScrollContent: {
    padding: 18,
    paddingBottom: 36,
  },
  sidebarAccountCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3FAF5',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#CDE5D6',
    gap: 12,
  },
  sidebarAccountNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  smallEditIconButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E1EFE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sidebarDivider: {
    height: 1,
    backgroundColor: '#EEF4F0',
    marginVertical: 18,
  },
  sidebarSectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#718C7D',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 10,
    marginLeft: 4,
  },
  sidebarMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F7FAF8',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E8F0EC',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  menuItemIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuItemTextCol: {
    flex: 1,
  },
  menuItemTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#163523',
    marginBottom: 2,
  },
  menuItemSub: {
    fontSize: 11.5,
    color: '#718C7D',
  },
  expandedSubCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    marginTop: -4,
    borderWidth: 1,
    borderColor: '#E2ECE6',
    gap: 10,
  },
  helpSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 4,
  },
  helpSubText: {
    fontSize: 12.5,
    color: '#1E4D2B',
    fontWeight: '600',
  },
  aboutParagraph: {
    fontSize: 12,
    color: '#52695C',
    lineHeight: 18,
  },
  aboutMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 4,
  },
  aboutMetaLabel: {
    fontSize: 11.5,
    color: '#718C7D',
  },
  aboutMetaValue: {
    fontSize: 11.5,
    color: '#163523',
    fontWeight: '600',
  },
  sidebarFooter: {
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 8 : 16,
    borderTopWidth: 1,
    borderTopColor: '#EEF4F0',
    backgroundColor: '#FFFFFF',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FDECEC',
    borderRadius: 14,
    paddingVertical: 13,
    borderWidth: 1,
    borderColor: '#F8C8C8',
    gap: 8,
  },
  logoutButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#D32F2F',
  },

  /* Modals */
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContentCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 22,
    elevation: 8,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#163523',
  },
  modalCloseButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#F0F5F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalInputLabel: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#52695C',
    marginBottom: 5,
    marginTop: 8,
  },
  modalInput: {
    backgroundColor: '#F6F9F7',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 13.5,
    color: '#163523',
    borderWidth: 1,
    borderColor: '#D8E6DF',
  },
  modalButtonsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  modalCancelButton: {
    flex: 1,
    backgroundColor: '#F0F5F2',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalCancelButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#52695C',
  },
  modalSaveButton: {
    flex: 1,
    backgroundColor: '#1E4D2B',
    borderRadius: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  modalSaveButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  /* Filter Modal */
  filterModalCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 22,
    elevation: 10,
  },
  filterSectionLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#163523',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 14,
    marginBottom: 8,
  },
  filterPillsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterPill: {
    backgroundColor: '#F4F9F6',
    borderWidth: 1,
    borderColor: '#DFECE5',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#52695C',
  },
  filterPillGradient: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1.2,
  },

  distanceStepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F4F9F6',
    borderWidth: 1,
    borderColor: '#DFECE5',
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 4,
    height: 42,
    width: 250,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  distanceStepperArrowBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D4E5DC',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 1,
  },
  distanceStepperArrowBtnDisabled: {
    backgroundColor: '#EEF5F1',
    borderColor: '#E2ECE6',
    elevation: 0,
  },
  distanceStepperDisplay: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  distanceStepperValueText: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#163523',
    lineHeight: 17,
  },
  distanceStepperSubText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#658172',
    lineHeight: 13,
  },
  filterModalButtonsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#EEF4F0',
  },
  filterResetButton: {
    flex: 1,
    backgroundColor: '#F0F5F2',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  filterResetButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#52695C',
  },
  filterApplyButton: {
    flex: 1.5,
    backgroundColor: '#1E4D2B',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  filterApplyButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  /* Suyo Detail Modal */
  suyoDetailModalCard: {
    width: '100%',
    maxWidth: 390,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 22,
    elevation: 10,
  },
  detailTopMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  detailTopMetaLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    flex: 1,
  },
  detailTopMetaRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailPostedTimeText: {
    fontSize: 12,
    color: '#658172',
    fontWeight: '600',
  },
  detailTitleAndStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 8,
  },
  detailCardTitleInRow: {
    fontSize: 17.5,
    fontWeight: '800',
    color: '#163523',
    lineHeight: 23,
    flex: 1,
  },
  detailStatusPillInline: {
    paddingVertical: 4.5,
    paddingHorizontal: 10,
    borderRadius: 8,
    alignSelf: 'center',
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailStatusPillInlineText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  detailTopTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  detailTopTagLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailUrgencyPill: {
    paddingVertical: 4,
    paddingHorizontal: 9,
    borderRadius: 8,
  },
  detailPillUrgent: {
    backgroundColor: '#FEE2E2',
  },
  detailPillToday: {
    backgroundColor: '#FEF3C7',
  },
  detailPillNormal: {
    backgroundColor: '#E8F5EE',
  },
  detailPillTomorrow: {
    backgroundColor: '#E0F2FE',
  },
  detailUrgencyPillText: {
    fontSize: 11,
    fontWeight: '800',
  },
  detailPillTextUrgent: {
    color: '#DC2626',
  },
  detailPillTextToday: {
    color: '#D97706',
  },
  detailPillTextNormal: {
    color: '#1E4D2B',
  },
  detailPillTextTomorrow: {
    color: '#0369A1',
  },
  detailHeartBtn: {
    padding: 4,
  },
  detailCardTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#163523',
    lineHeight: 24,
    marginBottom: 12,
  },
  detailDivider: {
    height: 1,
    backgroundColor: '#EEF4F0',
    marginVertical: 12,
  },
  detailRequestorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  detailRequestorLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  detailAvatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1E4D2B',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  detailAvatarInitials: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    includeFontPadding: false,
    lineHeight: 18,
  },
  detailRequestorTextCol: {
    flex: 1,
  },
  detailRequestorName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#163523',
    marginBottom: 2,
  },
  detailRequestorMeta: {
    fontSize: 11.5,
    color: '#718C7D',
    marginBottom: 2,
  },
  detailRequestorPhoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailRequestorPhoneText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#4B6354',
  },
  detailRequestorCallBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EBF5EE',
    borderWidth: 1.5,
    borderColor: '#C2E0CC',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  detailRequestorEditBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E8F5EE',
    borderWidth: 1.5,
    borderColor: '#C2E0CC',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  detailStatsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 12,
    gap: 8,
  },
  detailStatCol: {
    flex: 1,
  },
  detailStatLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#7E9789',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  detailRewardAmount: {
    fontSize: 19,
    fontWeight: '900',
    color: '#163523',
  },
  detailTargetTimeStatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailTargetTimeStatValue: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#B45309',
  },
  detailLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  detailLocationName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#163523',
  },
  detailTargetTimeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1.2,
    borderColor: '#FDE68A',
    marginBottom: 14,
    gap: 10,
  },
  detailTargetTimeIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FDE68A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailTargetTimeTextCol: {
    flex: 1,
  },
  detailTargetTimeLabel: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#92400E',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  detailTargetTimeValue: {
    fontSize: 14.5,
    fontWeight: '900',
    color: '#78350F',
    letterSpacing: -0.2,
  },
  detailTargetTimeSub: {
    fontSize: 11,
    color: '#A16207',
    marginTop: 2,
    lineHeight: 14,
  },
  detailTargetTimeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FDF6B2',
    borderWidth: 1,
    borderColor: '#FACC15',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  detailTargetTimeBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#854D0E',
  },
  suyoCardTargetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFBEB',
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#FEF3C7',
  },
  suyoCardTargetText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#B45309',
  },
  detailTaskHeadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
    marginTop: 2,
  },
  detailTaskHeading: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#163523',
  },
  detailClickableEditAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#E8F5EE',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#C6E3D1',
  },
  detailClickableEditText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#1E4D2B',
  },
  detailTaskBody: {
    fontSize: 13,
    color: '#4B6354',
    lineHeight: 19,
    marginBottom: 14,
  },
  detailActionButtonsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  detailCloseBtn: {
    flex: 1,
    backgroundColor: '#F0F5F2',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  detailCloseBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#52695C',
  },
  detailFulfillBtn: {
    flex: 2,
    backgroundColor: '#1E4D2B',
    borderRadius: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  detailFulfillBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  detailEditHeaderBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#EBF4EE',
  },
  detailCloseIconBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  detailDoerHighlightCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3FAF5',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#CDE5D6',
    gap: 10,
    marginBottom: 4,
  },
  detailDoerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1E4D2B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailDoerAvatarInitials: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  detailDoerTextCol: {
    flex: 1,
  },
  detailDoerNameText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#163523',
  },
  detailDoerMetaText: {
    fontSize: 11,
    color: '#607B6C',
    marginTop: 1,
  },
  detailDoerPhoneText: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#425C4D',
    marginTop: 2,
  },
  detailViewDoerProfileBtn: {
    backgroundColor: '#1E4D2B',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  detailViewDoerProfileBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  detailBoostCard: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
  },
  detailBoostHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  detailBoostIconBox: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailBoostTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#166534',
  },
  detailBoostSubtitle: {
    fontSize: 11,
    color: '#4B6354',
    lineHeight: 15,
  },
  detailBoostButtonsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  detailBoostChip: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#86EFAC',
    borderRadius: 8,
    paddingVertical: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailBoostChipGreen: {
    backgroundColor: '#059669',
    borderColor: '#059669',
  },
  detailBoostChipText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#166534',
  },
  detailArchivedNoticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    padding: 10,
    marginBottom: 14,
  },
  detailArchivedNoticeText: {
    fontSize: 11.5,
    color: '#475569',
    flex: 1,
    lineHeight: 16,
  },
  detailEditSuyoBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E8F5EE',
    borderRadius: 12,
    paddingVertical: 12,
    gap: 5,
  },
  detailEditSuyoBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#163523',
  },
  detailCancelSuyoBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEE2E2',
    borderRadius: 12,
    paddingVertical: 12,
    gap: 5,
  },
  detailCancelSuyoBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#DC2626',
  },
  detailRepostBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1E4D2B',
    borderRadius: 12,
    paddingVertical: 12,
    gap: 6,
  },
  detailRepostBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  detailCallDoerBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E8F5EE',
    borderRadius: 12,
    paddingVertical: 12,
    gap: 6,
    borderWidth: 1,
    borderColor: '#CDE5D7',
  },
  detailCallDoerBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#163523',
  },
  detailTrackCourierBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#059669',
    borderRadius: 12,
    paddingVertical: 12,
    gap: 6,
  },
  detailTrackCourierBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  detailArchiveSuyoBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    paddingVertical: 12,
    gap: 5,
  },
  detailArchiveSuyoBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#334155',
  },
  detailPrimaryActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1E4D2B',
    borderRadius: 14,
    paddingVertical: 13,
    gap: 8,
  },
  detailPrimaryActionBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  detailRepeatSuyoBtn: {
    flex: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1E4D2B',
    borderRadius: 12,
    paddingVertical: 12,
    gap: 6,
  },
  detailRepeatSuyoBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  /* Doer Profile Modal */
  doerProfileModalCard: {
    width: '100%',
    maxWidth: 370,
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 20,
    elevation: 10,
  },
  doerProfileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  doerProfileHeaderTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#163523',
  },
  doerProfileHero: {
    alignItems: 'center',
    marginBottom: 14,
  },
  doerProfileAvatarCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#1E4D2B',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    position: 'relative',
  },
  doerProfileAvatarInitials: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  doerVerifiedBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#059669',
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  doerProfileName: {
    fontSize: 17,
    fontWeight: '800',
    color: '#163523',
    marginBottom: 3,
  },
  doerVerifiedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    marginBottom: 5,
  },
  doerVerifiedTagText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#15803D',
  },
  doerProfileRating: {
    fontSize: 12,
    fontWeight: '600',
    color: '#658172',
  },
  doerStatsGrid: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 8,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  doerStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  doerStatValue: {
    fontSize: 15,
    fontWeight: '800',
    color: '#163523',
  },
  doerStatLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 2,
  },
  doerInfoList: {
    gap: 8,
    marginBottom: 12,
  },
  doerInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  doerInfoLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    width: 75,
  },
  doerInfoValue: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#163523',
    flex: 1,
  },
  doerBioText: {
    fontSize: 11.5,
    color: '#52695C',
    fontStyle: 'italic',
    lineHeight: 16,
    backgroundColor: '#F3FAF5',
    padding: 10,
    borderRadius: 10,
    marginBottom: 16,
  },
  doerProfileActionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  doerProfileCallBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1E4D2B',
    borderRadius: 12,
    paddingVertical: 11,
    gap: 6,
  },
  doerProfileCallBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  doerProfileMsgBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E8F5EE',
    borderRadius: 12,
    paddingVertical: 11,
    gap: 6,
  },
  doerProfileMsgBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#163523',
  },

  /* Edit Suyo Modal */
  editSuyoModalCard: {
    width: '100%',
    maxWidth: 390,
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 20,
    elevation: 10,
  },
  editSuyoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  editSuyoHeaderTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#163523',
  },
  editSuyoInputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 5,
    marginTop: 8,
  },
  editSuyoTextInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13.5,
    color: '#163523',
    marginBottom: 4,
  },
  editSuyoRewardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  editSuyoQuickAddPill: {
    backgroundColor: '#E8F5EE',
    borderWidth: 1,
    borderColor: '#A7D9B8',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  editSuyoQuickAddText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1E4D2B',
  },
  editSuyoTextArea: {
    minHeight: 65,
    textAlignVertical: 'top',
    paddingTop: 8,
  },
  editSuyoActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#EEF4F0',
  },
  editSuyoCancelBtn: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  editSuyoCancelBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
  },
  editSuyoSaveBtn: {
    flex: 1.6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1E4D2B',
    borderRadius: 12,
    paddingVertical: 12,
    gap: 6,
  },
  editSuyoSaveBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  /* Favorites Modal */
  favoritesModalCard: {
    width: '100%',
    maxWidth: 370,
    height: '70%',
    maxHeight: '82%',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    elevation: 10,
  },
  favoritesModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  favoritesHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  favSubHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  favSubHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  favFadingEditText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(22, 53, 35, 0.45)',
    textDecorationLine: 'underline',
    textDecorationColor: 'rgba(22, 53, 35, 0.25)',
  },
  favSelectAllText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#DC2626',
  },
  favModalToast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 7,
    paddingVertical: 4,
    paddingHorizontal: 8,
    marginBottom: 8,
    alignSelf: 'flex-start',
  },
  favModalToastText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#B91C1C',
  },
  favoritesTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  favoritesModalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#163523',
    letterSpacing: -0.3,
  },
  favoritesCountPill: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 8,
  },
  favoritesCountText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#DC2626',
  },
  favoritesModalSub: {
    fontSize: 11.5,
    color: '#658172',
    marginBottom: 10,
  },
  favoritesScrollList: {
    flex: 1,
    marginTop: 2,
    marginBottom: 6,
  },
  favCardItem: {
    backgroundColor: '#F9FBF9',
    borderRadius: 11,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#E2ECE6',
    marginBottom: 8,
  },
  favCardItemSelected: {
    borderColor: '#F87171',
    backgroundColor: '#FFF9F9',
  },
  favSelectionCircle: {
    width: 17,
    height: 17,
    borderRadius: 8.5,
    borderWidth: 1.5,
    borderColor: '#B0C7B9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    marginTop: 1,
  },
  favSelectionCircleSelected: {
    backgroundColor: '#DC2626',
    borderColor: '#DC2626',
  },
  favCardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  favCardTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#163523',
    lineHeight: 16.5,
    marginBottom: 2.5,
  },
  favCardLocation: {
    fontSize: 10.5,
    color: '#62806E',
    fontWeight: '500',
  },
  favCardReward: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#1E4D2B',
  },
  favDeleteActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  favCancelBottomBtn: {
    flex: 1,
    backgroundColor: '#F0F5F2',
    borderRadius: 10,
    paddingVertical: 9.5,
    alignItems: 'center',
  },
  favCancelBottomBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#52695C',
  },
  favConfirmDeleteBtn: {
    flex: 2,
    backgroundColor: '#DC2626',
    borderRadius: 10,
    paddingVertical: 9.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  favConfirmDeleteBtnDisabled: {
    backgroundColor: '#E5ECE8',
  },
  favConfirmDeleteBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  favConfirmDeleteBtnTextDisabled: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8CA395',
  },
  favCardBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#ECF4EF',
  },

  /* MySuyo Hub Screen Styles */
  mySuyoMainWrapper: {
    flex: 1,
    backgroundColor: '#FAFCFA',
  },
  mySuyoHeroSection: {
    backgroundColor: '#1C3A27',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  mySuyoHeroTextCol: {
    flex: 1,
    paddingRight: 12,
  },
  mySuyoHeroSuper: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#86EFAC',
    letterSpacing: 1.2,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  mySuyoHeroTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.4,
    marginBottom: 4,
  },
  mySuyoHeroSub: {
    fontSize: 12,
    color: '#C2DEC9',
    lineHeight: 16,
  },
  mySuyoHeroBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E8F5EE',
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* Modern Text Navigation (Zero button boxes, pure modern typography) */
  mySuyoTextNavWrapper: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 2,
    borderBottomWidth: 1,
    borderBottomColor: '#ECF4EF',
  },
  mySuyoTextNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 32,
  },
  mySuyoTextNavItem: {
    paddingVertical: 8,
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  mySuyoTextNavTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#7E9789',
    letterSpacing: -0.2,
  },
  mySuyoTextNavTitleActive: {
    fontWeight: '800',
    color: '#163523',
  },
  mySuyoTextNavCount: {
    fontSize: 12,
    fontWeight: '700',
    color: '#8FA497',
  },
  mySuyoTextNavCountActive: {
    color: '#1E4D2B',
  },
  mySuyoTextNavUnderline: {
    position: 'absolute',
    bottom: -2,
    left: 0,
    right: 0,
    height: 2.5,
    borderRadius: 1.5,
    backgroundColor: '#1E4D2B',
  },

  /* MySuyo Sub Bar with Fading Text Edit */
  mySuyoSubBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 10,
    backgroundColor: '#FAFCFA',
  },
  mySuyoSubBarTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#163523',
    marginBottom: 2,
  },
  mySuyoSubBarSubtitle: {
    fontSize: 11,
    color: '#658172',
  },
  mySuyoFadingEditText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: 'rgba(22, 53, 35, 0.45)',
    textDecorationLine: 'underline',
    textDecorationColor: 'rgba(22, 53, 35, 0.25)',
  },
  mySuyoSelectAllText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#DC2626',
  },

  /* Cards List for MySuyo */
  mySuyoCardsList: {
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 24,
    backgroundColor: '#FAFCFA',
  },
  mySuyoCardItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1.2,
    borderColor: '#E2ECE6',
    shadowColor: '#163523',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  mySuyoCardItemSelected: {
    borderColor: '#F87171',
    backgroundColor: '#FFF9F9',
  },
  mySuyoCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  mySuyoSelectionCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: '#B0C7B9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  mySuyoSelectionCircleSelected: {
    backgroundColor: '#DC2626',
    borderColor: '#DC2626',
  },
  mySuyoDatePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F0F5F2',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 6,
  },
  mySuyoDateText: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#52695C',
  },
  mySuyoCardSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  mySuyoCardStatusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  mySuyoCardDateDot: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '700',
  },
  mySuyoCardDateText: {
    fontSize: 11.5,
    color: '#658172',
    fontWeight: '600',
  },
  mySuyoStatusPill: {
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 6,
  },
  mySuyoStatusCompleted: {
    backgroundColor: '#E8F5EE',
  },
  mySuyoStatusCompletedText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#1E4D2B',
  },
  mySuyoStatusInProgress: {
    backgroundColor: '#FEF3C7',
  },
  mySuyoStatusInProgressText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#D97706',
  },
  mySuyoStatusOpen: {
    backgroundColor: '#E0F2FE',
  },
  mySuyoStatusOpenText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0369A1',
  },
  mySuyoCardTitle: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#163523',
    lineHeight: 19,
    marginBottom: 4,
  },
  mySuyoCardDetails: {
    fontSize: 12,
    color: '#52695C',
    lineHeight: 16,
    marginBottom: 10,
  },
  mySuyoCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F0F5F2',
  },
  mySuyoCardLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  mySuyoCardLocationText: {
    fontSize: 11,
    color: '#658172',
    fontWeight: '500',
  },
  mySuyoCardRewardText: {
    fontSize: 14.5,
    fontWeight: '900',
    color: '#1E4D2B',
  },
  mySuyoEmptyBox: {
    paddingVertical: 44,
    paddingHorizontal: 20,
    alignItems: 'center',
    gap: 8,
  },
  mySuyoEmptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#163523',
  },
  mySuyoEmptySub: {
    fontSize: 12,
    color: '#718C7D',
    textAlign: 'center',
    lineHeight: 17,
  },
  mySuyoEditFloatingBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: 16,
    marginTop: 6,
    marginBottom: 16,
  },
  mySuyoCancelEditBtn: {
    flex: 1,
    backgroundColor: '#F0F5F2',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  mySuyoCancelEditText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#52695C',
  },
  mySuyoConfirmDeleteBtn: {
    flex: 2,
    backgroundColor: '#DC2626',
    borderRadius: 10,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  mySuyoConfirmDeleteBtnDisabled: {
    backgroundColor: '#E5ECE8',
  },
  mySuyoConfirmDeleteBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  mySuyoConfirmDeleteBtnTextDisabled: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#8CA395',
  },
  favCardRequestorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  favAvatarCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#EBF4EE',
    borderWidth: 1,
    borderColor: '#B5D4C2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  favAvatarInitials: {
    fontSize: 8.5,
    fontWeight: '800',
    color: '#163523',
  },
  favCardRequestorName: {
    fontSize: 11,
    fontWeight: '700',
    color: '#344E41',
  },
  favTagPill: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  favTagUrgent: {
    backgroundColor: '#FEE2E2',
  },
  favTagToday: {
    backgroundColor: '#FEF3C7',
  },
  favTagNormal: {
    backgroundColor: '#E8F5EE',
  },
  favTagTomorrow: {
    backgroundColor: '#E0F2FE',
  },
  favTagPillText: {
    fontSize: 9.5,
    fontWeight: '700',
  },
  favTagUrgentText: {
    color: '#DC2626',
  },
  favTagTodayText: {
    color: '#D97706',
  },
  favTagNormalText: {
    color: '#1E4D2B',
  },
  favTagTomorrowText: {
    color: '#0369A1',
  },
  favEmptyBox: {
    paddingVertical: 24,
    paddingHorizontal: 16,
    alignItems: 'center',
    gap: 6,
  },
  favEmptyTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#163523',
  },
  favEmptySub: {
    fontSize: 11.5,
    color: '#718C7D',
    textAlign: 'center',
    lineHeight: 16,
  },
  favCloseBottomBtn: {
    backgroundColor: '#1E4D2B',
    borderRadius: 10,
    paddingVertical: 9.5,
    alignItems: 'center',
    marginTop: 8,
  },
  favCloseBottomBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  /* Popping toast notification (prominent & visible outside & inside modals at footer) */
  globalPoppingToastWrapper: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 999999,
    elevation: 999999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toastModalBackdrop: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  poppingToastContent: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#142E1F',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.38,
    shadowRadius: 12,
    elevation: 20,
    borderWidth: 1.5,
    borderColor: '#22C55E',
    gap: 10,
    maxWidth: SCREEN_WIDTH * 0.92,
  },
  poppingToastIconCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#22C55E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  poppingToastText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '800',
    letterSpacing: -0.2,
  },

  /* Polished Modal for Doer Suyo details */
  doerDetailModalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    width: Math.min(SCREEN_WIDTH * 0.92, 440),
    maxHeight: Dimensions.get('window').height * 0.78,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 10,
  },
  doerDetailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EEF3EE',
    marginBottom: 12,
  },
  doerDetailHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  doerDetailCategoryCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E8F5EE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  doerDetailCategoryText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#163523',
  },
  doerDetailDateText: {
    fontSize: 11,
    color: '#718C7D',
    fontWeight: '500',
  },
  doerDetailCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  doerDetailTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#163523',
    lineHeight: 22,
    marginBottom: 10,
  },
  doerDetailSummaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F0FDF4',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#DCFCE7',
    marginBottom: 12,
  },
  doerDetailStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 5,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  doerDetailStatusBadgeText: {
    fontSize: 12,
    fontWeight: '800',
  },
  doerDetailPayoutBox: {
    alignItems: 'flex-end',
  },
  doerDetailPayoutLabel: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#166534',
    letterSpacing: 0.5,
  },
  doerDetailPayoutValue: {
    fontSize: 18,
    fontWeight: '900',
    color: '#15803D',
  },
  doerRequesterCard: {
    backgroundColor: '#F7FCF9',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#CDE5D6',
    marginBottom: 12,
  },
  doerRequesterCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  doerRequesterSectionLabel: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#607B6C',
    letterSpacing: 0.6,
  },
  doerRequesterViewProfilePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 8,
    gap: 2,
  },
  doerRequesterViewProfileText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#059669',
  },
  doerRequesterCardMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  doerRequesterAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#1E4D2B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  doerRequesterAvatarText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  doerRequesterName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#163523',
  },
  doerRequesterSubMeta: {
    fontSize: 11,
    color: '#059669',
    fontWeight: '600',
    marginTop: 1,
  },
  doerRequesterCallPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#059669',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 18,
    gap: 4,
  },
  doerRequesterCallPillText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  doerInfoGridRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  doerInfoGridTile: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  doerInfoGridTileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  doerInfoIconCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doerInfoGridLabel: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  doerInfoGridValue: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#1E293B',
    lineHeight: 16,
  },
  doerTaskDescCard: {
    backgroundColor: '#F8FAF8',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E6EEE8',
    marginBottom: 10,
  },
  doerSectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  doerSectionHeaderText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#425C4D',
    letterSpacing: 0.5,
  },
  doerTaskDescBody: {
    fontSize: 12.5,
    color: '#27382F',
    lineHeight: 18,
  },
  doerNotesCard: {
    backgroundColor: '#FFFBEB',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#FDE68A',
    marginBottom: 10,
  },
  doerNotesBody: {
    fontSize: 12.5,
    color: '#78350F',
    lineHeight: 18,
  },
  doerAttachmentsCard: {
    backgroundColor: '#F8FAF8',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E6EEE8',
    marginBottom: 10,
  },
  doerModalInfoHint: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    padding: 10,
    borderRadius: 10,
    gap: 8,
    marginTop: 6,
    borderWidth: 1,
    borderColor: '#DCFCE7',
  },
  doerModalInfoHintText: {
    flex: 1,
    fontSize: 11,
    color: '#166534',
    lineHeight: 15,
  },
  doerTapDetailsHintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FAF3',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginTop: 8,
    marginBottom: 4,
    gap: 6,
  },
  doerTapDetailsHintText: {
    flex: 1,
    fontSize: 11,
    fontWeight: '600',
    color: '#059669',
  },

  /* Yellow Archive Button Styles */
  detailArchiveSuyoBtnYellow: {
    backgroundColor: '#FDE047',
    borderColor: '#EAB308',
    borderWidth: 1.5,
  },
  detailArchiveSuyoBtnTextYellow: {
    color: '#78350F',
    fontWeight: '800',
  },

  /* Unread Badge Number Text */
  unreadBadgeNumberText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '900',
    textAlign: 'center',
    lineHeight: 11,
  },

  /* ========================================================== */
  /* FUNCTIONAL NOTIFICATIONS MODAL STYLES                      */
  /* ========================================================== */
  notificationsModalCard: {
    width: '100%',
    maxWidth: 395,
    height: '78%',
    maxHeight: '88%',
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 18,
    elevation: 10,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
  },
  notifModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  notifTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  notifModalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#163523',
    letterSpacing: -0.3,
  },
  notifCountPill: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
  },
  notifCountText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#DC2626',
  },
  notifTopActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#EEF4F0',
  },
  notifFilterPillsWrap: {
    flexDirection: 'row',
    gap: 5,
  },
  notifFilterPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    backgroundColor: '#F3F8F5',
    borderWidth: 1,
    borderColor: '#DFECE5',
  },
  notifFilterPillActive: {
    backgroundColor: '#1E4D2B',
    borderColor: '#1E4D2B',
  },
  notifFilterPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#52695C',
  },
  notifFilterPillTextActive: {
    color: '#FFFFFF',
  },
  notifMarkAllReadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 3.5,
    borderRadius: 8,
    backgroundColor: '#EBF5EF',
  },
  notifMarkAllReadText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1E4D2B',
  },
  notifScrollList: {
    flex: 1,
    marginBottom: 8,
  },
  notifSwipeContainer: {
    position: 'relative',
    marginBottom: 8,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#DC2626',
  },
  notifDeleteActionBg: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: 0,
    width: 75,
    backgroundColor: '#DC2626',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    zIndex: 1,
  },
  notifDeleteActionText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  notifCardItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E8F0EC',
    zIndex: 2,
  },
  notifCardInnerTouch: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 9,
    paddingHorizontal: 11,
    gap: 9,
    width: '100%',
  },
  notifCardItemUnread: {
    backgroundColor: '#F4FAF6',
    borderColor: '#CCE6D7',
  },
  notifCardLeftCol: {
    paddingTop: 1,
  },
  notifIconCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifIconDoer: {
    backgroundColor: '#E6F4EC',
  },
  notifIconTask: {
    backgroundColor: '#ECFDF5',
  },
  notifIconPayment: {
    backgroundColor: '#FEF3C7',
  },
  notifIconNearby: {
    backgroundColor: '#E0F2FE',
  },
  notifCardContentCol: {
    flex: 1,
  },
  notifCardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  notifCardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#163523',
  },
  notifUnreadDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#1E4D2B',
  },
  notifCardTime: {
    fontSize: 10,
    color: '#8CA094',
    fontWeight: '600',
  },
  notifCardBody: {
    fontSize: 11.5,
    color: '#476353',
    lineHeight: 16,
    marginBottom: 4,
  },
  notifCardBottomActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  notifActionLinkText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#1E4D2B',
  },
  notifSwipeHintText: {
    fontSize: 9.5,
    color: '#94A3B8',
    fontWeight: '500',
  },
  notifTrashIconBtn: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifMarkSingleReadBtn: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#EBF4EE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifEmptyBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 36,
    paddingHorizontal: 20,
    gap: 8,
  },
  notifEmptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#163523',
    marginTop: 4,
  },
  notifEmptySub: {
    fontSize: 12.5,
    color: '#718C7D',
    textAlign: 'center',
    lineHeight: 18,
  },
  notifModalBottomRow: {
    flexDirection: 'row',
    gap: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#EEF4F0',
  },
  notifClearBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    paddingVertical: 12,
    gap: 6,
  },
  notifClearBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
  },
  notifDoneBtn: {
    flex: 1.5,
    backgroundColor: '#1E4D2B',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifDoneBtnText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  /* === WALLET EARNINGS STYLES === */
  walletMainWrapper: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },
  walletHeroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2ECE5',
    elevation: 2,
    shadowColor: '#163523',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },
  walletHeroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  walletBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  walletIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#EAF4EF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  walletHeroSuper: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1E4D2B',
    letterSpacing: 0.8,
  },
  walletVerifiedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    borderRadius: 12,
    paddingHorizontal: 9,
    paddingVertical: 4,
    gap: 4,
  },
  walletVerifiedPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
  },
  walletBalanceLabel: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#557261',
    marginBottom: 4,
  },
  walletBalanceAmount: {
    fontSize: 32,
    fontWeight: '900',
    color: '#163523',
    letterSpacing: -0.5,
    marginBottom: 16,
  },
  walletSummaryRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 8,
    marginBottom: 4,
  },
  walletSummaryTile: {
    flex: 1,
    backgroundColor: '#F8FAF9',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#EDF5F0',
  },
  walletSummaryItem: {
    alignItems: 'center',
    flex: 1,
    paddingHorizontal: 4,
  },
  walletSummaryCount: {
    fontSize: 16,
    fontWeight: '800',
    color: '#163523',
    marginBottom: 2,
    textAlign: 'center',
  },
  walletSummaryLabel: {
    fontSize: 10.5,
    color: '#557261',
    fontWeight: '700',
    textAlign: 'center',
  },
  walletSummaryDivider: {
    width: 1,
    height: 28,
    backgroundColor: '#D7EBE0',
  },
  walletMonthlyIncomeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F0FDF4',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#DCFCE7',
  },
  walletMonthlyIncomeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  walletMonthlyIconBox: {
    width: 30,
    height: 30,
    borderRadius: 9,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  walletMonthlyTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#163523',
    marginBottom: 1,
  },
  walletMonthlySub: {
    fontSize: 10.5,
    color: '#557261',
    fontWeight: '500',
  },
  walletMonthlyBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  walletMonthlyBadgeText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#15803D',
  },
  walletPaymentNoticeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
    marginTop: 14,
    borderWidth: 1,
    borderColor: '#DCFCE7',
  },
  walletPaymentNoticeText: {
    fontSize: 11.5,
    color: '#15803D',
    lineHeight: 16,
    flex: 1,
    fontWeight: '500',
  },
  walletSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    paddingHorizontal: 2,
  },
  walletSectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#163523',
    marginBottom: 2,
  },
  walletSectionSub: {
    fontSize: 11.5,
    color: '#557261',
  },
  walletCountChip: {
    backgroundColor: '#EAF4EF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#CDE5D7',
  },
  walletCountChipText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#1E4D2B',
  },
  walletListWrapper: {
    gap: 10,
  },
  walletItemCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2ECE5',
    elevation: 1,
    shadowColor: '#163523',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
  },
  walletItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: 10,
    gap: 12,
  },
  walletCategoryIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  walletItemInfoCol: {
    flex: 1,
    gap: 3,
  },
  walletItemTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#163523',
  },
  walletItemMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  walletItemRequesterText: {
    fontSize: 12,
    color: '#557261',
  },
  walletItemDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  walletItemDateText: {
    fontSize: 11,
    color: '#8CA395',
  },
  walletItemDot: {
    fontSize: 10,
    color: '#CBD5E1',
    marginHorizontal: 2,
  },
  walletItemLocationText: {
    fontSize: 11,
    color: '#8CA395',
    flex: 1,
  },
  walletItemRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  walletEarnedAmountText: {
    fontSize: 15,
    fontWeight: '900',
    color: '#15803D',
  },
  walletStatusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    gap: 3,
  },
  walletStatusChipText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#15803D',
  },

  /* === ACTIVITY & TRANSACTIONS STYLES === */
  activityMainWrapper: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },
  activityHeroSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2ECE5',
    elevation: 2,
    shadowColor: '#163523',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  activityHeroTextCol: {
    flex: 1,
    paddingRight: 12,
  },
  activityHeroSuper: {
    fontSize: 11,
    fontWeight: '800',
    color: '#059669',
    letterSpacing: 0.8,
    marginBottom: 3,
  },
  activityHeroTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#163523',
    letterSpacing: -0.2,
    marginBottom: 4,
  },
  activityHeroSub: {
    fontSize: 12.5,
    color: '#557261',
    lineHeight: 17,
  },
  activityStatementBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5EE',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
    gap: 5,
    borderWidth: 1,
    borderColor: '#CDE5D7',
  },
  activityStatementBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#1E4D2B',
  },
  activityMetricsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  activityMetricCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2ECE5',
    elevation: 1,
    shadowColor: '#163523',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
  },
  activityMetricIconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  activityMetricValue: {
    fontSize: 15,
    fontWeight: '800',
    color: '#163523',
    marginBottom: 2,
  },
  activityMetricLabel: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#2D4F38',
  },
  activityMetricSub: {
    fontSize: 10.5,
    color: '#64748B',
    marginTop: 2,
  },
  activityCategoryBreakdownCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 15,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2ECE5',
  },
  activityCategoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  activityCategoryTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#163523',
  },
  activityCategorySub: {
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 2,
  },
  activityTrustPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
  },
  activityTrustPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
  },
  activityCategoryBar: {
    height: 10,
    borderRadius: 5,
    flexDirection: 'row',
    overflow: 'hidden',
    marginBottom: 12,
    backgroundColor: '#F1F5F9',
  },
  activityCategorySegment: {
    height: '100%',
  },
  activityCategoryLegend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  activityCategoryLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  activityCategoryLegendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  activityCategoryLegendText: {
    fontSize: 11.5,
    color: '#334155',
    fontWeight: '600',
  },
  activityFilterScrollWrapper: {
    marginBottom: 12,
  },
  activityFilterScroll: {
    gap: 8,
    paddingRight: 10,
  },
  activityFilterChip: {
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
  },
  activityFilterChipActive: {
    backgroundColor: '#1E4D2B',
  },
  activityFilterChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#557261',
  },
  activityFilterChipTextActive: {
    color: '#FFFFFF',
  },
  activitySearchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: '#D7EBE0',
    marginBottom: 16,
    gap: 8,
  },
  activitySearchInput: {
    flex: 1,
    fontSize: 13,
    color: '#163523',
    padding: 0,
  },
  activityList: {
    gap: 12,
  },
  activityCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2ECE5',
    elevation: 1,
    shadowColor: '#163523',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
  },
  activityCardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  activityCategoryHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  activityCategoryIconBox: {
    width: 32,
    height: 32,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityCategoryTextCol: {
    gap: 1,
  },
  activityCategoryName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#163523',
  },
  activityCardDate: {
    fontSize: 11,
    color: '#64748B',
  },
  activityStatusPill: {
    paddingHorizontal: 9,
    paddingVertical: 3.5,
    borderRadius: 8,
  },
  activityStatusPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  activityCardTitle: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#163523',
    marginBottom: 8,
  },
  activityCardMetaCol: {
    gap: 4,
    marginBottom: 10,
  },
  activityCardMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  activityCardMetaText: {
    fontSize: 12,
    color: '#557261',
  },
  activityFinancialStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8FAF9',
    borderRadius: 12,
    padding: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#EDF5F0',
  },
  activityRefNo: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  activityPaymentMethod: {
    fontSize: 11,
    color: '#163523',
    fontWeight: '600',
    marginTop: 2,
  },
  activityAmountText: {
    fontSize: 14,
    fontWeight: '800',
  },
  activityFeeNote: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 2,
  },
  activityCardActionsRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  activityViewReceiptBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E8F5EE',
    borderRadius: 10,
    paddingVertical: 9,
    gap: 5,
    borderWidth: 1,
    borderColor: '#CDE5D7',
  },
  activityViewReceiptBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#163523',
  },
  activityTrackBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#059669',
    borderRadius: 10,
    paddingVertical: 9,
    gap: 5,
  },
  activityTrackBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  activityRepeatBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    gap: 4,
  },
  activityRepeatBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E4D2B',
  },
  activityEmptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 32,
    borderWidth: 1,
    borderColor: '#E2ECE5',
  },
  activityEmptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#163523',
    marginTop: 10,
    marginBottom: 4,
  },
  activityEmptySub: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 17,
  },

  /* DIGITAL RECEIPT MODAL STYLES */
  receiptModalCard: {
    width: '100%',
    maxWidth: 420,
    maxHeight: '85%',
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    overflow: 'hidden',
  },
  receiptModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E2ECE5',
    backgroundColor: '#F8FAF9',
  },
  receiptHeaderBadge: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  receiptModalHeaderTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#163523',
  },
  receiptScrollContent: {
    padding: 16,
  },
  receiptTicketBox: {
    backgroundColor: '#FAFCFA',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#D7EBE0',
    marginBottom: 16,
  },
  receiptBrandTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: '#163523',
    letterSpacing: 1,
    textAlign: 'center',
  },
  receiptBrandTag: {
    fontSize: 11,
    color: '#059669',
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 4,
  },
  receiptRefDisplay: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginBottom: 12,
  },
  receiptDashedLine: {
    borderBottomWidth: 1,
    borderBottomColor: '#CBD5E1',
    borderStyle: 'dashed',
    marginVertical: 10,
  },
  receiptRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  receiptLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  receiptValue: {
    fontSize: 12.5,
    color: '#163523',
    fontWeight: '600',
  },
  receiptTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#E8F5EE',
    borderRadius: 10,
    padding: 10,
    marginTop: 6,
    marginBottom: 10,
  },
  receiptTotalLabel: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#163523',
  },
  receiptTotalValue: {
    fontSize: 16,
    fontWeight: '900',
    color: '#15803D',
  },
  receiptProofBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderRadius: 10,
    padding: 10,
    gap: 8,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    marginBottom: 12,
  },
  receiptProofTitle: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#15803D',
  },
  receiptProofSub: {
    fontSize: 10.5,
    color: '#557261',
    lineHeight: 14,
  },
  receiptBarcodeBox: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  receiptBarcodeBars: {
    width: '75%',
    height: 24,
    backgroundColor: '#1E293B',
    borderRadius: 3,
    marginBottom: 4,
    opacity: 0.85,
  },
  receiptBarcodeText: {
    fontSize: 10.5,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    color: '#64748B',
    letterSpacing: 2,
  },
  receiptActionsRow: {
    flexDirection: 'row',
    gap: 10,
    paddingBottom: 8,
  },
  receiptShareActionBtn: {
    flex: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E8F5EE',
    borderRadius: 12,
    paddingVertical: 12,
    gap: 6,
    borderWidth: 1,
    borderColor: '#CDE5D7',
  },
  receiptShareActionBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#163523',
  },
  receiptCloseActionBtn: {
    flex: 1,
    backgroundColor: '#1E4D2B',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  receiptCloseActionBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  /* Statistics Modal Styles */
  statsModalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    paddingVertical: 18,
    paddingHorizontal: 18,
    width: '92%',
    maxWidth: 420,
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
  },
  statsScrollView: {
    flexShrink: 1,
    width: '100%',
  },
  statsIconBadge: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsMetricsGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  statsMetricTile: {
    flex: 1,
    backgroundColor: '#F8FAF9',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#EDF5F0',
  },
  statsTileValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#163523',
    marginBottom: 1,
  },
  statsTileLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#557261',
    marginBottom: 1,
  },
  statsTileSub: {
    fontSize: 9.5,
    fontWeight: '500',
    color: '#7A9384',
  },
  statsCategoryCard: {
    backgroundColor: '#F8FAF9',
    borderRadius: 14,
    padding: 12,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#EDF5F0',
  },
  statsCategoryHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statsSectionHeading: {
    fontSize: 13,
    fontWeight: '800',
    color: '#163523',
    marginBottom: 1,
  },
  statsSectionSubheading: {
    fontSize: 10.5,
    color: '#7A9384',
  },
  statsCategoryBar: {
    flexDirection: 'row',
    height: 10,
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 12,
    backgroundColor: '#E2E8F0',
  },
  statsCategorySegment: {
    height: '100%',
  },
  statsCategoryLegendGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statsLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    width: '48%',
  },
  statsLegendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statsLegendText: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '600',
  },
  statsInfoNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F0FDF4',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#DCFCE7',
  },
  statsInfoNoticeText: {
    fontSize: 10.5,
    color: '#15803D',
    lineHeight: 15,
    flex: 1,
    fontWeight: '500',
  },
  statsDoneButton: {
    backgroundColor: '#1E4D2B',
    borderRadius: 12,
    paddingVertical: 11,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 11,
  },
  statsDoneButtonText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  // Customer Satisfaction Graph Styles
  statsSatisfactionScoreBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 7,
    paddingVertical: 3.5,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  statsSatisfactionScoreText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#92400E',
  },
  csatBarsContainer: {
    marginTop: 8,
    marginBottom: 8,
    gap: 5,
  },
  csatBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  csatStarLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 24,
    justifyContent: 'flex-start',
    gap: 2,
  },
  csatStarText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#334155',
  },
  csatTrack: {
    flex: 1,
    height: 7,
    backgroundColor: '#E2E8F0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  csatFill: {
    height: '100%',
    borderRadius: 4,
  },
  csatPctText: {
    width: 58,
    fontSize: 10,
    fontWeight: '700',
    color: '#475569',
    textAlign: 'right',
  },
  csatHighlightsRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 3,
  },
  csatHighlightChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 6,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DCFCE7',
  },
  csatHighlightText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#166534',
  },
  // Wallet Graphical Line Chart Styles
  walletLineGraphCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E6F0EB',
    marginTop: 12,
    marginBottom: 4,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  walletLineHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  walletLineTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  walletLineIconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  walletLineTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#064E3B',
  },
  walletLineSub: {
    fontSize: 10.5,
    color: '#059669',
    fontWeight: '500',
  },
  walletGrowthBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  walletGrowthBadgeText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#065F46',
  },
  walletLineAmountRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0FDF4',
  },
  walletLineBigAmount: {
    fontSize: 22,
    fontWeight: '900',
    color: '#064E3B',
    letterSpacing: -0.5,
  },
  walletLineTotalNote: {
    fontSize: 11,
    color: '#059669',
    fontWeight: '600',
    marginTop: 2,
  },
  walletTimeFilterRow: {
    flexDirection: 'row',
    gap: 4,
    backgroundColor: '#F3F4F6',
    padding: 3,
    borderRadius: 9,
  },
  walletTimeFilterBtn: {
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 6,
  },
  walletTimeFilterBtnActive: {
    backgroundColor: '#059669',
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 1,
  },
  walletTimeFilterText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#6B7280',
  },
  walletTimeFilterTextActive: {
    color: '#FFFFFF',
  },
  walletSvgChartContainer: {
    width: '100%',
    height: 185,
    marginVertical: 4,
  },
  walletNativeChartContainer: {
    width: '100%',
    height: 165,
    marginVertical: 6,
    justifyContent: 'flex-end',
  },
  walletNativeChartGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 125,
    borderBottomWidth: 1,
    borderBottomColor: '#CBD5E1',
    paddingBottom: 4,
  },
  walletNativeBarCol: {
    alignItems: 'center',
  },
  walletNativeValBadge: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginBottom: 4,
  },
  walletNativeValBadgePeak: {
    backgroundColor: '#064E3B',
    borderColor: '#064E3B',
  },
  walletNativeValText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#065F46',
  },
  walletNativeValTextPeak: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  walletNativeNodeDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#059669',
    marginBottom: 4,
  },
  walletNativeNodeDotPeak: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#047857',
    borderWidth: 2,
    borderColor: '#A7F3D0',
  },
  walletNativeDropLine: {
    width: 1,
    height: 35,
    backgroundColor: '#E2E8F0',
  },
  walletNativeLabelText: {
    fontSize: 9.5,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 4,
  },
  walletChartFooterMetrics: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAF9',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginTop: 6,
    borderWidth: 1,
    borderColor: '#EDF5F1',
  },
  walletFooterMetricItem: {
    alignItems: 'center',
    flex: 1,
  },
  walletFooterMetricDivider: {
    width: 1,
    height: 20,
    backgroundColor: '#E2E8F0',
  },
  walletFooterMetricValue: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A',
  },
  walletFooterMetricLabel: {
    fontSize: 9.5,
    color: '#64748B',
    fontWeight: '600',
    marginTop: 1,
  },

  /* Wallet Return Header Button (when opened from sidebar) */
  walletReturnHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    backgroundColor: '#EAF4EF',
    borderRadius: 10,
    marginBottom: 12,
    alignSelf: 'flex-start',
  },
  walletReturnHeaderText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#1E4D2B',
  },

  /* Doer Suyo Hub Styles */
  doerMainWrapper: {
    flex: 1,
    backgroundColor: '#FAFCFA',
  },
  doerHeroSection: {
    backgroundColor: '#1C3A27',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 18,
  },
  doerHeroTextCol: {
    marginBottom: 0,
  },
  doerHeroBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  doerHeroIconCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  doerHeroSuper: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#86EFAC',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  doerHeroTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.4,
    marginBottom: 4,
  },
  doerHeroSub: {
    fontSize: 12,
    color: '#C2DEC9',
    lineHeight: 16,
  },
  doerQuickStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
  },
  doerQuickStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  doerQuickStatVal: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  doerQuickStatLbl: {
    fontSize: 10,
    fontWeight: '600',
    color: '#D1FAE5',
    marginTop: 2,
  },
  doerQuickStatDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },

  /* Modern Text Navigation for Doer Hub */
  doerTextNavWrapper: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 2,
    borderBottomWidth: 1,
    borderBottomColor: '#ECF4EF',
  },
  doerTextNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 28,
  },
  doerTextNavItem: {
    paddingVertical: 8,
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  doerTextNavTitle: {
    fontSize: 15.5,
    fontWeight: '600',
    color: '#7E9789',
    letterSpacing: -0.2,
  },
  doerTextNavTitleActive: {
    fontWeight: '800',
    color: '#163523',
  },
  doerTextNavCount: {
    fontSize: 12,
    fontWeight: '700',
    color: '#8FA497',
  },
  doerTextNavCountActive: {
    color: '#1E4D2B',
  },
  doerTextNavUnderline: {
    position: 'absolute',
    bottom: -2,
    left: 0,
    right: 0,
    height: 2.5,
    borderRadius: 1.5,
    backgroundColor: '#1E4D2B',
  },

  /* List Container & Cards */
  doerListContainer: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 28,
  },
  doerInfoCallout: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#E8F5EE',
    borderRadius: 12,
    paddingVertical: 9,
    paddingHorizontal: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#CDE5D7',
  },
  doerInfoCalloutText: {
    fontSize: 11.5,
    color: '#163523',
    fontWeight: '600',
    flex: 1,
    lineHeight: 16,
  },
  doerAcceptedCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1.2,
    borderColor: '#D7E9DE',
    shadowColor: '#163523',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  doerCardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  doerCategoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EAF4EF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 7,
  },
  doerCategoryChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1E4D2B',
  },
  doerRewardBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  doerRewardText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#15803D',
  },
  doerCardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#163523',
    lineHeight: 20,
    marginBottom: 8,
  },
  doerRequesterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  doerRequesterText: {
    fontSize: 12,
    color: '#52695C',
    flex: 1,
  },
  doerCallMiniBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 6,
  },
  doerCallMiniBtnText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#059669',
  },
  doerLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 12,
  },
  doerLocationText: {
    fontSize: 11.5,
    color: '#658172',
    fontWeight: '500',
    maxWidth: '55%',
  },
  doerDot: {
    fontSize: 11,
    color: '#94A3B8',
  },
  doerDeadlineText: {
    fontSize: 11.5,
    color: '#D97706',
    fontWeight: '700',
  },
  doerCardActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#EEF5F1',
  },
  doerContinueBtn: {
    flex: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#1E4D2B',
    borderRadius: 11,
    paddingVertical: 10,
  },
  doerContinueBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  doerCancelBtn: {
    flex: 1.2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: '#FEE2E2',
    borderRadius: 11,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  doerCancelBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#DC2626',
  },

  /* Completed Cards */
  doerCompletedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2ECE6',
  },
  doerCompletedLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 10,
    paddingRight: 8,
  },
  doerCompletedIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  doerCompletedTextCol: {
    flex: 1,
  },
  doerCompletedTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#163523',
    marginBottom: 2,
  },
  doerCompletedRequester: {
    fontSize: 11,
    fontWeight: '600',
    color: '#52695C',
    marginBottom: 2,
  },
  doerCompletedMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  doerCompletedDate: {
    fontSize: 10.5,
    color: '#8CA395',
  },
  doerCompletedLocation: {
    fontSize: 10.5,
    color: '#8CA395',
    flex: 1,
  },
  doerCompletedRight: {
    alignItems: 'flex-end',
    gap: 3,
  },
  doerCompletedEarned: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#059669',
  },
  doerCompletedRatingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  doerCompletedRatingText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#B45309',
  },

  /* Cancelled Cards */
  doerCancelledCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 13,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  doerCancelledTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  doerCancelledTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#475569',
    flex: 1,
    paddingRight: 8,
  },
  doerCancelledBadge: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  doerCancelledBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#DC2626',
  },
  doerCancelledSub: {
    fontSize: 11,
    color: '#64748B',
    marginBottom: 6,
  },
  doerCancelledNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#F8FAFC',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  doerCancelledNoticeText: {
    fontSize: 10.5,
    color: '#64748B',
    fontStyle: 'italic',
  },

  /* Empty State */
  doerEmptyCard: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 32,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: '#E2ECE6',
    marginTop: 8,
  },
  doerEmptyIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F0F7F3',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  doerEmptyTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#163523',
    marginBottom: 6,
  },
  doerEmptySub: {
    fontSize: 12,
    color: '#658172',
    textAlign: 'center',
    lineHeight: 17,
    marginBottom: 16,
  },
  doerBrowseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#1E4D2B',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  doerBrowseBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  /* Cancel Confirmation Modal */
  doerCancelModalCard: {
    width: '100%',
    maxWidth: 350,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    elevation: 8,
  },
  doerCancelIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  doerCancelModalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#991B1B',
    marginBottom: 8,
    textAlign: 'center',
  },
  doerCancelModalSub: {
    fontSize: 12.5,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 18,
  },
  doerCancelActionRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  doerCancelKeepBtn: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  doerCancelKeepBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
  doerCancelConfirmBtn: {
    flex: 1.3,
    backgroundColor: '#DC2626',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  doerCancelConfirmBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  /* Detail Cancel / Fulfill Buttons */
  detailCancelDoerBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEE2E2',
    borderRadius: 12,
    paddingVertical: 12,
    gap: 5,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  detailCancelDoerBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#DC2626',
  },

  /* Attached Photos & Files in Details Modal */
  detailAttachmentsSection: {
    marginTop: 12,
    marginBottom: 4,
    backgroundColor: '#F8FAF9',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2ECE6',
  },
  detailAttachmentsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  detailAttachmentsHeading: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#163523',
  },
  detailAttachmentsScroll: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 2,
  },
  detailAttachmentChip: {
    borderRadius: 10,
    overflow: 'hidden',
  },
  detailAttachmentImageWrap: {
    width: 72,
    height: 72,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#E2E8F0',
    position: 'relative',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  detailAttachmentThumb: {
    width: '100%',
    height: '100%',
  },
  detailAttachmentTag: {
    position: 'absolute',
    bottom: 3,
    left: 3,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  detailAttachmentTagText: {
    fontSize: 8.5,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  detailAttachmentDocWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFDF5',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    maxWidth: 160,
  },
  detailAttachmentDocName: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#92400E',
    flex: 1,
  },
});

