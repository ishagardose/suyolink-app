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
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';
import { useSuyos } from '../context/SuyoContext';
import { useDeviceLocation } from '../context/LocationContext';
import { useTheme } from '../theme/ThemeContext';
import { formatOffer } from '../data/suyoRequests';
import { distanceKm } from '../lib/geo';
import { RefreshControl } from 'react-native';

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
  if (!name || typeof name !== 'string') return 'MC';
  const clean = name.replace(/^(atty\.|dr\.|engr\.|mr\.|ms\.|mrs\.)\s+/i, '').trim();
  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'MC';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const INITIAL_AVAILABLE_SUYOS = [
  {
    id: 'SYL-101',
    title: 'Drop off documents - Unit 402',
    category: 'Documents',
    location: 'Makati CBD',
    distance: 0.5,
    distanceText: '0.5 km away',
    reward: '₱300',
    rewardAmount: 300,
    tag: 'Urgent',
    postedTime: 'Just now',
    createdAt: Date.now() - 2 * 60 * 1000,
    due: 'Due today ASAP',
    dueDate: getTodayFormatted(),
    details: 'Drop off notarized lease agreements and corporate papers at the 4th floor reception.',
    notes: 'Please hand directly to Ms. Santos.',
    requesterName: 'Atty. Rafael Cruz',
    requesterPhone: '0917 842 1983',
    requesterRating: '4.9★',
    completedCount: '34 completed',
  },
  {
    id: 'SYL-102',
    title: 'Buy groceries - SM Tagum',
    category: 'Groceries',
    location: 'SM Tagum',
    distance: 0.8,
    distanceText: '0.8 km away',
    reward: '₱150',
    rewardAmount: 150,
    tag: 'Due today',
    postedTime: '12 mins ago',
    createdAt: Date.now() - 12 * 60 * 1000,
    due: 'Due today at 5:00 PM',
    dueDate: getTodayFormatted(),
    details: '2 cartons of milk, 1 loaf of wheat bread, and 1 pack of eggs from supermarket.',
    notes: 'Receipt will be reimbursed via GCash or cash upon delivery.',
    requesterName: 'Maria Clarissa',
    requesterInitials: 'MR',
    requesterPhone: '0928 341 5520',
    requesterRating: '4.9★',
    completedCount: '34 completed',
  },
  {
    id: 'SYL-103',
    title: 'Queue for bills payment',
    category: 'Queuing & Bills',
    location: 'Bayad Center Ayala',
    distance: 1.4,
    distanceText: '1.4 km away',
    reward: '₱100',
    rewardAmount: 100,
    tag: 'Normal',
    postedTime: '35 mins ago',
    createdAt: Date.now() - 35 * 60 * 1000,
    due: 'Due tomorrow at 11:00 AM',
    dueDate: getTomorrowFormatted(),
    details: 'Line up to pay Meralco electric bill. Cash is prepared in an envelope.',
    notes: 'Return validated slip to lobby desk.',
    requesterName: 'Kenneth Gomez',
    requesterPhone: '0919 720 9144',
    requesterRating: '4.8★',
    completedCount: '28 completed',
  },
  {
    id: 'SYL-104',
    title: 'Pick up birthday cake',
    category: 'Delivery',
    location: 'Goldilocks Poblacion',
    distance: 2.1,
    distanceText: '2.1 km away',
    reward: '₱220',
    rewardAmount: 220,
    tag: 'Due tomorrow',
    postedTime: '1 hour ago',
    createdAt: Date.now() - 60 * 60 * 1000,
    due: 'Due tomorrow at 2:00 PM',
    dueDate: getTomorrowFormatted(),
    details: 'Pre-ordered 8-inch chocolate mousse cake. Needs upright, careful handling.',
    notes: 'Order #GLD-8821 under name Juan Dela Cruz.',
    requesterName: 'Patricia Tan',
    requesterPhone: '0905 188 4390',
    requesterRating: '5.0★',
    completedCount: '41 completed',
  },
  {
    id: 'SYL-105',
    title: 'Prescription pickup at Mercury Drug',
    category: 'Delivery',
    location: 'Mercury Drug Legaspi',
    distance: 1.1,
    distanceText: '1.1 km away',
    reward: '₱180',
    rewardAmount: 180,
    tag: 'Urgent',
    postedTime: '2 hours ago',
    createdAt: Date.now() - 120 * 60 * 1000,
    due: 'Due today ASAP',
    dueDate: getTodayFormatted(),
    details: 'Pick up maintenance heart medication prescription for senior citizen.',
    notes: 'Prescription slip is with the pharmacist.',
    requesterName: 'Lola Remedios',
    requesterPhone: '0939 655 0122',
    requesterRating: '4.9★',
    completedCount: '19 completed',
  },
];

const CATEGORY_OPTIONS = ['All', 'Delivery', 'Groceries', 'Documents', 'Queuing & Bills', 'Household'];
const URGENCY_OPTIONS = ['All', 'Normal', 'Urgent', 'Due today', 'Due tomorrow'];

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
                {item.unread && <View style={styles.notifUnreadDot} />}
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

export default function DashboardScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, 16);
  const [activeTab, setActiveTab] = useState('home');
  const { user, logout } = useAuth();
  const { colors, isDark, toggleTheme } = useTheme();
  const { requests, workflowError, error, refresh, isLoading } = useSuyos();
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
  const [tempProfile, setTempProfile] = useState({ ...userProfile });
  const [pushNotifications, setPushNotifications] = useState(true);
  const [expandedSection, setExpandedSection] = useState(null);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedDistance, setSelectedDistance] = useState('Any');
  const [selectedUrgency, setSelectedUrgency] = useState('All');
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

  // Selected Suyo Details Modal
  const [selectedSuyo, setSelectedSuyo] = useState(null);

  // Favorites / Saved Suyos state
  const [favoriteSuyoIds, setFavoriteSuyoIds] = useState(['SYL-102']);
  const [isFavoritesModalOpen, setIsFavoritesModalOpen] = useState(false);
  const [openedFromFavorites, setOpenedFromFavorites] = useState(false);

  // Backend requests mapped to available suyos
  const availableSuyosBase = useMemo(() => {
    if (!requests || requests.length === 0) return INITIAL_AVAILABLE_SUYOS;
    const fromBackend = requests
      .filter((r) => r.status === 'open' && (!r.deadline || Date.parse(r.deadline) > Date.now()))
      .map((r) => {
        const dist = position && r.latitude && r.longitude ? distanceKm(position, r) : 0.8;
        const distNum = typeof dist === 'number' ? Number(dist.toFixed(1)) : 0.8;
        const offer = formatOffer(r.offerCentavos || 0);
        const isUrgent = r.deadline && Date.parse(r.deadline) < Date.now() + 24 * 3600 * 1000;
        return {
          id: r.id,
          title: r.title,
          category: r.category || 'General',
          location: r.location || 'Nearby',
          distance: distNum,
          distanceText: distNum + ' km away',
          reward: offer,
          rewardAmount: (r.offerCentavos || 0) / 100,
          tag: isUrgent ? 'Urgent' : 'Normal',
          postedTime: 'Active now',
          createdAt: Date.parse(r.createdAt || r.deadline || Date.now()),
          due: r.deadline ? 'Due ' + new Date(r.deadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Due today',
          dueDate: r.deadline ? new Date(r.deadline).toLocaleDateString() : getTodayFormatted(),
          details: r.details || 'No details provided.',
          notes: r.specialInstructions || '',
          requesterName: r.requesterName || 'Community Member',
          requesterPhone: r.requesterPhone || '+63 917 000 0000',
          requesterRating: '4.9★',
          completedCount: '15 completed',
          rawRequest: r,
        };
      });
    const fallbackItems = INITIAL_AVAILABLE_SUYOS.filter((init) => !fromBackend.some((b) => b.id === init.id));
    return [...fromBackend, ...fallbackItems];
  }, [requests, position]);

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

  const toggleFavoriteSuyo = (suyo) => {
    if (!suyo) return;
    const isFav = favoriteSuyoIds.includes(suyo.id);
    if (isFav) {
      setFavoriteSuyoIds((prev) => prev.filter((id) => id !== suyo.id));
      triggerToast('Suyo removed from favorites', 'heart-dislike');
    } else {
      setFavoriteSuyoIds((prev) => [...prev, suyo.id]);
      triggerToast('Suyo saved to favorites', 'heart');
    }
  };

  const handleCloseDetailModal = () => {
    setSelectedSuyo(null);
    if (openedFromFavorites) {
      setIsFavoritesModalOpen(true);
      setOpenedFromFavorites(false);
    }
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
    setFavoriteSuyoIds((prev) =>
      prev.filter((id) => !selectedFavIdsToDelete.includes(id))
    );
    setSelectedFavIdsToDelete([]);
    setIsFavDeleteMode(false);
    triggerToast(
      count === 1
        ? '1 suyo removed from favorites'
        : `${count} suyos removed from favorites`,
      'heart-dislike'
    );
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
      body: '₱300 has been credited to your account for completing errand #SYL-984.',
      time: '1h ago',
      category: 'payment',
      icon: 'cash-outline',
      unread: true,
      targetScreen: null,
    },
    {
      id: 'NOTIF-4',
      title: 'New Suyo Nearby',
      body: 'An urgent errand "Prescription pickup at Mercury Drug" was posted 1.1 km away.',
      time: '3h ago',
      category: 'nearby',
      icon: 'location-outline',
      unread: false,
      targetScreen: null,
    },
  ]);
  const [isNotificationsModalOpen, setIsNotificationsModalOpen] = useState(false);
  const [notificationFilter, setNotificationFilter] = useState('All'); // 'All' | 'Unread'

  const unreadNotificationsCount = notifications.filter((n) => n.unread).length;

  const markNotificationRead = (id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, unread: false } : n))
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
      prev.map((n) => (n.id === notif.id ? { ...n, unread: false } : n))
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
      triggerToast('₱300 reward credited to your SuyoLink Wallet', 'cash-outline');
    } else if (notif.category === 'nearby') {
      const urgentSuyo = filteredSuyos.find((s) => s.tag === 'Urgent') || filteredSuyos[0];
      if (urgentSuyo) {
        setSelectedSuyo(urgentSuyo);
      } else {
        router.push('/map');
      }
    } else {
      triggerToast(notif.title, 'notifications');
    }
  };

  // Active Suyo floating banner state (matching original single active banner)
  const [activeSuyo, setActiveSuyo] = useState({
    id: 'TRK-9842',
    trackingNumber: '#SYL-88219',
    status: 'In Progress',
    eta: 'Doer is 5 mins away',
    detail: 'Errand: Drop off documents at Unit 402',
    progress: '75%',
  });
  const [isTrackingModalOpen, setIsTrackingModalOpen] = useState(false);

  const hasActiveSuyo =
    activeSuyo &&
    (activeSuyo.status === 'In Progress' ||
      activeSuyo.status === 'In Transit' ||
      activeSuyo.status === 'On Process');

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
          item.category.toLowerCase().includes(q)
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
      return 'Available Suyo';
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
            <Text style={styles.welcomeTagline}>Need an errand done today?</Text>
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
                placeholder="Search suyos or errands..."
                placeholderTextColor="#688676"
                value={searchQuery}
                onChangeText={setSearchQuery}
                accessibilityLabel="Search suyos or errands"
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
            <View style={{ flex: 1, paddingRight: 8 }}>
              <Text style={styles.sectionHeading} numberOfLines={1}>
                {availableHeaderTitle}
              </Text>
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
                  onPress={() => setSelectedSuyo(suyo)}
                >
                  <View style={styles.suyoCardTopRow}>
                    <Text style={styles.suyoCardTitle} numberOfLines={2}>
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
                          : suyo.tag === 'Normal'
                          ? styles.suyoTagNormal
                          : styles.suyoTagTomorrow,
                      ]}
                    >
                      <Text
                        style={[
                          styles.suyoTagPillText,
                          suyo.tag === 'Urgent'
                            ? styles.suyoTagUrgentText
                            : suyo.tag === 'Due today'
                            ? styles.suyoTagTodayText
                            : suyo.tag === 'Normal'
                            ? styles.suyoTagNormalText
                            : styles.suyoTagTomorrowText,
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
                <TouchableOpacity
                  style={styles.emptyResetBtn}
                  onPress={clearAllFilters}
                  activeOpacity={0.8}
                >
                  <Text style={styles.emptyResetBtnText}>Clear all filters</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
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
            name={activeTab === 'mysuyo' ? 'bicycle' : 'bicycle-outline'}
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
          onPress={() => {
            setActiveTab('activity');
            setIsNotificationsModalOpen(true);
          }}
        >
          <Ionicons
            name={activeTab === 'activity' ? 'receipt' : 'receipt-outline'}
            size={22}
            color={activeTab === 'activity' ? '#1E4D2B' : '#8FA497'}
          />
          <Text
            style={[
              styles.navItemText,
              activeTab === 'activity' && styles.navItemTextActive,
            ]}
          >
            Activity
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          activeOpacity={0.7}
          onPress={openSidebar}
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

      {/* Floating Toast Notification on Dashboard */}
      {toastConfig && !selectedSuyo && !isFavoritesModalOpen && (
        <Animated.View
          style={[
            styles.dashboardToastBubble,
            {
              bottom: (hasActiveSuyo ? 145 : 85) + bottomInset,
              opacity: toastAnim,
              transform: [
                {
                  translateY: toastAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [20, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <Ionicons
            name={
              toastConfig.icon === 'heart'
                ? 'heart'
                : toastConfig.icon === 'heart-dislike'
                ? 'heart-dislike'
                : 'information-circle'
            }
            size={16}
            color="#27854D"
          />
          <Text style={styles.dashboardToastText}>{toastConfig.message}</Text>
        </Animated.View>
      )}

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
      {selectedSuyo && (
        <Modal
          visible={!!selectedSuyo}
          animationType="slide"
          transparent={true}
          onRequestClose={handleCloseDetailModal}
        >
          <View style={styles.modalBackdrop}>
            <View style={styles.suyoDetailModalCard}>
              <View style={styles.detailTopTagRow}>
                <View style={styles.detailTopTagLeft}>
                  <View
                    style={[
                      styles.detailUrgencyPill,
                      selectedSuyo.tag === 'Urgent'
                        ? styles.detailPillUrgent
                        : selectedSuyo.tag === 'Due today'
                        ? styles.detailPillToday
                        : selectedSuyo.tag === 'Normal'
                        ? styles.detailPillNormal
                        : styles.detailPillTomorrow,
                    ]}
                  >
                    <Text
                      style={[
                        styles.detailUrgencyPillText,
                        selectedSuyo.tag === 'Urgent'
                          ? styles.detailPillTextUrgent
                          : selectedSuyo.tag === 'Due today'
                          ? styles.detailPillTextToday
                          : selectedSuyo.tag === 'Normal'
                          ? styles.detailPillTextNormal
                          : styles.detailPillTextTomorrow,
                      ]}
                    >
                      {selectedSuyo.tag || 'Normal'}
                    </Text>
                  </View>
                  <Text style={styles.detailPostedTimeText}>
                    Posted {selectedSuyo.postedTime || '10m ago'}
                  </Text>
                </View>

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
                    size={24}
                    color={
                      favoriteSuyoIds.includes(selectedSuyo.id)
                        ? '#DC2626'
                        : '#6B8576'
                    }
                  />
                </TouchableOpacity>
              </View>

              <Text style={styles.detailCardTitle}>{selectedSuyo.title}</Text>
              <View style={styles.detailDivider} />

              <View style={styles.detailRequestorRow}>
                <View style={styles.detailRequestorLeft}>
                  <View style={styles.detailAvatarCircle}>
                    <Text style={styles.detailAvatarInitials}>
                      {selectedSuyo.requesterInitials ||
                        getInitials(
                          selectedSuyo.requesterName || 'Maria Clarissa'
                        )}
                    </Text>
                  </View>
                  <View style={styles.detailRequestorTextCol}>
                    <Text style={styles.detailRequestorName}>
                      {selectedSuyo.requesterName || 'Maria Clarissa'}
                    </Text>
                    <Text style={styles.detailRequestorMeta}>
                      Requestor · {selectedSuyo.requesterRating || '4.9★'}  -  {(selectedSuyo.completedCount || '34 completed').replace(/[()]/g, '')}
                    </Text>
                    <View style={styles.detailRequestorPhoneRow}>
                      <Ionicons name="call" size={11} color="#6D8777" />
                      <Text style={styles.detailRequestorPhoneText}>
                        {selectedSuyo.requesterPhone || '0928 341 5520'}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>

              <View style={styles.detailDivider} />

              <View style={styles.detailStatsRow}>
                <View style={styles.detailStatCol}>
                  <Text style={styles.detailStatLabel}>REWARD</Text>
                  <Text style={styles.detailRewardAmount}>
                    {selectedSuyo.rewardAmount
                      ? `₱${Number(selectedSuyo.rewardAmount).toFixed(2)}`
                      : selectedSuyo.reward && selectedSuyo.reward.startsWith('₱')
                      ? `${selectedSuyo.reward}.00`
                      : '₱250.00'}
                  </Text>
                </View>

                <View style={styles.detailStatCol}>
                  <Text style={styles.detailStatLabel}>LOCATION</Text>
                  <View style={styles.detailLocationRow}>
                    <Ionicons name="location-sharp" size={17} color="#0D9488" />
                    <Text style={styles.detailLocationName} numberOfLines={1}>
                      {selectedSuyo.location || 'Quezon City'}
                    </Text>
                  </View>
                </View>
              </View>

              <Text style={styles.detailTaskHeading}>Task Description</Text>
              <Text style={styles.detailTaskBody}>
                {selectedSuyo.details}
                {selectedSuyo.notes ? ` ${selectedSuyo.notes}` : ''}
              </Text>

              <View style={styles.detailActionButtonsRow}>
                <TouchableOpacity
                  style={styles.detailCloseBtn}
                  onPress={handleCloseDetailModal}
                  activeOpacity={0.7}
                >
                  <Text style={styles.detailCloseBtnText}>Close</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.detailFulfillBtn}
                  activeOpacity={0.8}
                  onPress={() => {
                    const taskToFulfill = selectedSuyo;
                    setSelectedSuyo(null);
                    setOpenedFromFavorites(false);
                    router.push({
                      pathname: '/fulfill',
                      params: {
                        id: taskToFulfill?.id || 'SYL-102',
                        title: taskToFulfill?.title || 'Quick Grocery Delivery (5 items)',
                        category: taskToFulfill?.category || 'Groceries',
                        location: taskToFulfill?.location || 'SM Tagum',
                        distanceText: taskToFulfill?.distanceText || '0.8 km away',
                        reward: taskToFulfill?.reward || '₱150',
                        requesterName: taskToFulfill?.requesterName || 'Maria Santos',
                        requesterLocation: taskToFulfill?.location || 'Quezon City',
                        requesterPhone: taskToFulfill?.requesterPhone || '09564781552',
                        details: taskToFulfill?.details || 'Grocery delivery items',
                      },
                    });
                  }}
                >
                  <Ionicons name="bicycle" size={18} color="#FFFFFF" />
                  <Text style={styles.detailFulfillBtnText}>Fulfill Suyo</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

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

              <View style={styles.favoritesHeaderActions}>
                {favoriteSuyos.length > 0 && !isFavDeleteMode && (
                  <TouchableOpacity
                    onPress={handleToggleFavDeleteMode}
                    style={styles.favHeaderTrashBtn}
                    activeOpacity={0.7}
                    accessibilityLabel="Select favorites to remove"
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons name="trash-outline" size={16} color="#DC2626" />
                  </TouchableOpacity>
                )}

                {isFavDeleteMode && (
                  <TouchableOpacity
                    onPress={handleToggleFavDeleteMode}
                    style={styles.favCancelDeleteBtn}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.favCancelDeleteText}>Cancel</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  onPress={handleCloseFavoritesModal}
                  style={styles.modalCloseButton}
                  activeOpacity={0.7}
                >
                  <Ionicons name="close" size={18} color="#163523" />
                </TouchableOpacity>
              </View>
            </View>

            {isFavDeleteMode ? (
              <View style={styles.favSelectAllRow}>
                <Text style={styles.favoritesModalSub}>
                  Tap items to select what to remove:
                </Text>
                {favoriteSuyos.length > 1 && (
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
              </View>
            ) : (
              <Text style={styles.favoritesModalSub}>
                Suyos you've saved to review or fulfill later
              </Text>
            )}

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
                          setSelectedSuyo(suyo);
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
                    ? 'You are all caught up with your errand updates and rewards.'
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
      {/* 8. SIDEBAR DRAWER                                          */}
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
            <View style={styles.sidebarAccountSingleLine}>
              <View style={styles.verifiedAvatarWrapper}>
                <View style={styles.verifiedAvatarCircle}>
                  <Ionicons name="person" size={20} color="#FFFFFF" />
                </View>
                <View style={styles.verifiedBadgeDot}>
                  <Ionicons name="checkmark" size={10} color="#FFFFFF" />
                </View>
              </View>

              <Text style={styles.sidebarAccountNameText} numberOfLines={1}>
                {userProfile?.name || 'Juan Dela Cruz'}
              </Text>

              <TouchableOpacity
                onPress={() => {
                  setTempProfile({ ...userProfile });
                  setIsEditModalOpen(true);
                }}
                style={styles.smallEditIconButton}
                activeOpacity={0.75}
              >
                <Ionicons name="pencil" size={14} color="#1E4D2B" />
              </TouchableOpacity>
            </View>

            <View style={styles.sidebarDivider} />
            <Text style={styles.sidebarSectionTitle}>Preferences</Text>

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
                  <Text style={styles.menuItemSub}>Suyo and errand alerts</Text>
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

            {/* Notifications Center Item in Sidebar */}
            <TouchableOpacity
              style={styles.sidebarMenuItem}
              activeOpacity={0.75}
              onPress={() => {
                closeSidebar();
                setIsNotificationsModalOpen(true);
              }}
            >
              <View style={styles.menuItemLeft}>
                <View
                  style={[
                    styles.menuItemIconCircle,
                    { backgroundColor: '#EAF4EF' },
                  ]}
                >
                  <Ionicons
                    name="mail-unread-outline"
                    size={18}
                    color="#1E4D2B"
                  />
                </View>
                <View style={styles.menuItemTextCol}>
                  <Text style={styles.menuItemTitle}>Notifications Inbox</Text>
                  <Text style={styles.menuItemSub}>
                    {unreadNotificationsCount > 0
                      ? `${unreadNotificationsCount} unread message${unreadNotificationsCount > 1 ? 's' : ''}`
                      : 'All caught up'}
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#7A9384" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.sidebarMenuItem}
              activeOpacity={0.75}
              onPress={() => toggleSection('help')}
            >
              <View style={styles.menuItemLeft}>
                <View
                  style={[
                    styles.menuItemIconCircle,
                    { backgroundColor: '#E8F2FC' },
                  ]}
                >
                  <Ionicons
                    name="help-buoy-outline"
                    size={18}
                    color="#1B609E"
                  />
                </View>
                <View style={styles.menuItemTextCol}>
                  <Text style={styles.menuItemTitle}>Help & Support</Text>
                  <Text style={styles.menuItemSub}>
                    FAQs, 24/7 Chat & Contact
                  </Text>
                </View>
              </View>
              <Ionicons
                name={
                  expandedSection === 'help' ? 'chevron-up' : 'chevron-down'
                }
                size={18}
                color="#7A9384"
              />
            </TouchableOpacity>

            {expandedSection === 'help' && (
              <View style={styles.expandedSubCard}>
                <TouchableOpacity
                  style={styles.helpSubRow}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name="chatbubbles-outline"
                    size={16}
                    color="#1E4D2B"
                  />
                  <Text style={styles.helpSubText}>
                    Live Chat with Support (24/7)
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.helpSubRow}
                  activeOpacity={0.7}
                >
                  <Ionicons name="call-outline" size={16} color="#1E4D2B" />
                  <Text style={styles.helpSubText}>
                    Helpline: (02) 8888-SUYO
                  </Text>
                </TouchableOpacity>
              </View>
            )}

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
                    v1.0.0 • Hyperlocal Errands
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
                  favors, document errands, and express deliveries securely in
                  your community.
                </Text>
                <View style={styles.aboutMetaRow}>
                  <Text style={styles.aboutMetaLabel}>App Version:</Text>
                  <Text style={styles.aboutMetaValue}>1.0.0 (Build 2026.1)</Text>
                </View>
              </View>
            )}

            <View style={styles.logoutWrapper}>
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
          </ScrollView>
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
  sidebarAccountSingleLine: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F4F8F5',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#E2ECE6',
  },
  verifiedAvatarWrapper: {
    position: 'relative',
    marginRight: 12,
  },
  verifiedAvatarCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#1E4D2B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifiedBadgeDot: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#4ADE80',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  sidebarAccountNameText: {
    flex: 1,
    fontSize: 15.5,
    fontWeight: '700',
    color: '#163523',
    marginRight: 8,
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
  logoutWrapper: {
    marginTop: 18,
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
  detailPostedTimeText: {
    fontSize: 12,
    color: '#718C7D',
    fontWeight: '500',
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
  },
  detailAvatarInitials: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
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
  detailStatsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  detailStatCol: {
    flex: 1,
  },
  detailStatLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#7E9789',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  detailRewardAmount: {
    fontSize: 22,
    fontWeight: '900',
    color: '#163523',
  },
  detailLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailLocationName: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#163523',
  },
  detailTaskHeading: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#163523',
    marginBottom: 4,
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
    gap: 8,
  },
  favHeaderTrashBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  favCancelDeleteBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#F0F5F2',
  },
  favCancelDeleteText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#52695C',
  },
  favSelectAllRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
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

  dashboardToastBubble: {
    position: 'absolute',
    alignSelf: 'center',
    backgroundColor: 'rgba(235, 247, 240, 0.94)',
    borderRadius: 22,
    paddingVertical: 10,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    zIndex: 150,
    elevation: 8,
    borderWidth: 1.2,
    borderColor: 'rgba(39, 133, 77, 0.28)',
    maxWidth: '92%',
  },
  dashboardToastText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#163523',
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
});
