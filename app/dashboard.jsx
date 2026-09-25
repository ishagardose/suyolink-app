import React, { useState, useRef } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SIDEBAR_WIDTH = Math.min(SCREEN_WIDTH * 0.82, 340);

const QUICK_ACTIONS = [
  { id: '1', title: 'Post a Suyo', icon: 'hand-left-outline' },
  { id: '2', title: 'Run Errand', icon: 'bicycle-outline' },
];

const AVAILABLE_SUYOS = [
  {
    id: 'SUYO-4821',
    title: 'Documents Delivery to Makati CBD',
    distance: '1.2 km away',
    reward: '₱145.00',
    type: 'Document Suyo',
    postedTime: '10 mins ago',
  },
  {
    id: 'SUYO-4819',
    title: 'Special Birthday Gift Drop to BGC',
    distance: '3.5 km away',
    reward: '₱220.00',
    type: 'Special Favor',
    postedTime: '25 mins ago',
  },
  {
    id: 'SUYO-4811',
    title: 'Organic Grocery Pickup from Market',
    distance: '2.0 km away',
    reward: '₱180.00',
    type: 'Market Errand',
    postedTime: '1 hour ago',
  },
];

export default function DashboardScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('home');

  // Sidebar & Modal animation state
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const sidebarAnim = useRef(new Animated.Value(-SIDEBAR_WIDTH)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;

  // User account state
  const [userProfile, setUserProfile] = useState({
    name: 'Juan Dela Cruz',
    email: 'juan.delacruz@suyolink.ph',
    phone: '+63 917 123 4567',
    address: 'Makati City, Metro Manila',
  });
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [tempProfile, setTempProfile] = useState({ ...userProfile });

  // Active Suyo state (shows live tracking card only if in transit/on process)
  const [activeSuyo, setActiveSuyo] = useState({
    id: 'TRK-9842',
    trackingNumber: '#SYL-88219',
    status: 'In Transit', // 'In Transit' | 'On Process' | 'Delivered' | null
    eta: 'Doer is 5 mins away',
    detail: 'Errand: Drop off documents at Unit 402',
    progress: '78%',
  });

  // Sidebar interactive toggles & sections
  const [pushNotifications, setPushNotifications] = useState(true);
  const [expandedSection, setExpandedSection] = useState(null); // 'help' | 'about' | null

  // Open sidebar
  const openSidebar = () => {
    setIsSidebarOpen(true);
    Animated.parallel([
      Animated.timing(sidebarAnim, {
        toValue: 0,
        duration: 280,
        useNativeDriver: true,
      }),
      Animated.timing(backdropAnim, {
        toValue: 1,
        duration: 280,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // Close sidebar
  const closeSidebar = () => {
    Animated.parallel([
      Animated.timing(sidebarAnim, {
        toValue: -SIDEBAR_WIDTH,
        duration: 240,
        useNativeDriver: true,
      }),
      Animated.timing(backdropAnim, {
        toValue: 0,
        duration: 240,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setIsSidebarOpen(false);
      setExpandedSection(null);
    });
  };

  // Save edited profile
  const handleSaveProfile = () => {
    if (!tempProfile.name.trim()) return;
    setUserProfile({ ...tempProfile });
    setIsEditModalOpen(false);
  };

  const toggleSection = (section) => {
    setExpandedSection((prev) => (prev === section ? null : section));
  };

  const hasActiveSuyo = activeSuyo && (activeSuyo.status === 'In Transit' || activeSuyo.status === 'On Process');

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.safeContainer}>
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
          <TouchableOpacity
            style={styles.headerIconButton}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="notifications-outline" size={22} color="#FFFFFF" />
            <View style={styles.unreadBadgeDot} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={openSidebar}
            style={styles.topProfileAvatarButton}
            activeOpacity={0.8}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="person" size={20} color="#163523" />
          </TouchableOpacity>
        </View>
      </View>

      {/* 2. MAIN SCROLLABLE CONTENT */}
      <ScrollView
        style={styles.contentScroll}
        contentContainerStyle={[
          styles.contentContainer,
          { paddingBottom: hasActiveSuyo ? 140 : 90 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* === HERO SECTION WITH MATCHING STICKER BACKGROUND COLOR === */}
        <View style={styles.headerHeroSection}>
          <View style={styles.heroTextBlock}>
            <View style={styles.locationPill}>
              <Ionicons name="location-sharp" size={11} color="#4ADE80" />
              <Text style={styles.locationPillText}>Makati CBD</Text>
            </View>
            <Text style={styles.welcomeSubText}>WELCOME BACK</Text>
            <Text style={styles.welcomeNameText} numberOfLines={1}>{userProfile.name}</Text>
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
          {/* Search Bar */}
          <View style={styles.searchBarContainer}>
            <Ionicons name="search-outline" size={20} color="#7A9384" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search suyo request, errand, or doer..."
              placeholderTextColor="#8FA497"
            />
          </View>

          {/* === STATS OVERVIEW CARDS === */}
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Text style={styles.statCardLabel}>Completed</Text>
              <Text style={styles.statCardValue}>12</Text>
            </View>

            <View style={styles.statCard}>
              <Text style={styles.statCardLabel}>Earned</Text>
              <Text style={styles.statCardValue}>₱1,240</Text>
            </View>

            <TouchableOpacity
              style={styles.statCard}
              activeOpacity={0.8}
              onPress={() => setActiveTab('activity')}
            >
              <Text style={styles.statCardLabel}>Active</Text>
              <View style={styles.statActiveRow}>
                <View style={styles.activeIndicatorDot} />
                <Text style={styles.statCardValue}>2</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Quick Action Grid */}
          <Text style={styles.sectionHeading}>Quick Services</Text>
          <View style={styles.quickActionGrid}>
            {QUICK_ACTIONS.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.actionCard}
                activeOpacity={0.75}
              >
                <View style={styles.actionIconCircle}>
                  <Ionicons name={item.icon} size={24} color="#1E4D2B" />
                </View>
                <Text style={styles.actionTitleText}>{item.title}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Available Suyos */}
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionHeading}>Available suyos</Text>
            <TouchableOpacity activeOpacity={0.7}>
              <Text style={styles.seeAllText}>View all</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.tasksList}>
            {AVAILABLE_SUYOS.map((suyo) => {
              return (
                <View key={suyo.id} style={styles.taskCard}>
                  <View style={styles.taskIconWrapper}>
                    <Ionicons name="bicycle-outline" size={24} color="#1E4D2B" />
                  </View>
                  <View style={styles.taskMeta}>
                    <Text style={styles.taskTitle} numberOfLines={1}>
                      {suyo.title}
                    </Text>
                    <Text style={styles.taskSub}>
                      {suyo.type} • {suyo.distance}
                    </Text>
                  </View>
                  <View style={styles.taskPriceColumn}>
                    <Text style={styles.taskPrice}>{suyo.reward}</Text>
                    <View style={styles.statusPillTransit}>
                      <Text style={styles.statusPillTextTransit}>{suyo.postedTime}</Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      </ScrollView>

      {/* COMPACT ACTIVE SUYO BAR */}
      {hasActiveSuyo && (
        <View style={styles.floatingFooterActiveBarWrapper} pointerEvents="box-none">
          <TouchableOpacity
            style={styles.floatingFooterActiveBar}
            activeOpacity={0.92}
            onPress={() => router.push('/map')}
          >
            <View style={styles.footerBarHeader}>
              <View style={styles.footerBarLiveBadge}>
                <View style={styles.pulsingGreenDot} />
                <Text style={styles.footerBarLiveText}>ACTIVE SUYO</Text>
              </View>
              <View style={styles.footerBarTrackingRight}>
                <Ionicons name="map-outline" size={12} color="#276739" style={{ marginRight: 3 }} />
                <Text style={styles.footerBarTrackingText}>{activeSuyo.trackingNumber}</Text>
              </View>
            </View>

            <View style={styles.footerBarBodyRow}>
              <View style={styles.footerBarTextCol}>
                <Text style={styles.footerBarHeadline}>{activeSuyo.eta}</Text>
                <Text style={styles.footerBarSub} numberOfLines={1}>{activeSuyo.detail}</Text>
              </View>
              <View style={styles.footerBarChevronCircle}>
                <Ionicons name="chevron-forward" size={14} color="#1E4D2B" />
              </View>
            </View>

            <View style={styles.footerProgressBarTrack}>
              <View style={[styles.footerProgressBarFill, { width: activeSuyo.progress }]} />
            </View>
          </TouchableOpacity>
        </View>
      )}

      {/* Bottom Navigation Bar */}
      <View style={styles.bottomNavContainer}>
        {[
          { id: 'home', label: 'Home', icon: 'home' },
          { id: 'mysuyos', label: 'Mysuyos', icon: 'bicycle' },
          { id: 'messages', label: 'Messages', icon: 'chatbubbles' },
          { id: 'activity', label: 'Activity', icon: 'receipt' },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              style={styles.navItem}
              onPress={() => {
                setActiveTab(tab.id);
              }}
              activeOpacity={0.7}
            >
              <Ionicons
                name={isActive ? tab.icon : `${tab.icon}-outline`}
                size={22}
                color={isActive ? '#1E4D2B' : '#8FA497'}
              />
              <Text
                style={[
                  styles.navItemText,
                  isActive && styles.navItemTextActive,
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* ========================================================== */}
      {/* SIDEBAR DRAWER OVERLAY & PANEL                             */}
      {/* ========================================================== */}
      {isSidebarOpen && (
        <View style={StyleSheet.absoluteFillObject} pointerEvents="box-none">
          <Animated.View
            style={[
              styles.sidebarBackdrop,
              { opacity: backdropAnim },
            ]}
          >
            <TouchableOpacity
              style={StyleSheet.absoluteFillObject}
              activeOpacity={1}
              onPress={closeSidebar}
            />
          </Animated.View>

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
                    <Ionicons name="paper-plane" size={16} color="#163523" />
                  </View>
                  <Text style={styles.sidebarBrandTitle}>SuyoLink</Text>
                </View>
                <TouchableOpacity
                  onPress={closeSidebar}
                  style={styles.sidebarCloseButton}
                  activeOpacity={0.7}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                >
                  <Ionicons name="close" size={22} color="#163523" />
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
                      <Ionicons name="checkmark-sharp" size={9} color="#FFFFFF" />
                    </View>
                  </View>

                  <Text style={styles.sidebarAccountNameText} numberOfLines={1}>
                    {userProfile.name}
                  </Text>

                  <TouchableOpacity
                    style={styles.smallEditIconButton}
                    activeOpacity={0.7}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    onPress={() => {
                      setTempProfile({ ...userProfile });
                      setIsEditModalOpen(true);
                    }}
                  >
                    <Ionicons name="pencil-sharp" size={13} color="#1E4D2B" />
                  </TouchableOpacity>
                </View>

                <View style={styles.sidebarDivider} />
                <Text style={styles.sidebarSectionTitle}>Preferences</Text>

                <View style={styles.sidebarMenuItem}>
                  <View style={styles.menuItemLeft}>
                    <View style={[styles.menuItemIconCircle, { backgroundColor: '#EAF4EF' }]}>
                      <Ionicons name="notifications-outline" size={18} color="#1E4D2B" />
                    </View>
                    <View style={styles.menuItemTextCol}>
                      <Text style={styles.menuItemTitle}>Push Notifications</Text>
                      <Text style={styles.menuItemSub}>Delivery alerts & promos</Text>
                    </View>
                  </View>
                  <Switch
                    value={pushNotifications}
                    onValueChange={setPushNotifications}
                    trackColor={{ false: '#D4E2DA', true: '#1E4D2B' }}
                    thumbColor={pushNotifications ? '#4ADE80' : '#FFFFFF'}
                  />
                </View>

                <TouchableOpacity
                  style={styles.sidebarMenuItem}
                  activeOpacity={0.75}
                  onPress={() => toggleSection('help')}
                >
                  <View style={styles.menuItemLeft}>
                    <View style={[styles.menuItemIconCircle, { backgroundColor: '#E8F2FC' }]}>
                      <Ionicons name="help-buoy-outline" size={18} color="#1B609E" />
                    </View>
                    <View style={styles.menuItemTextCol}>
                      <Text style={styles.menuItemTitle}>Help & Support</Text>
                      <Text style={styles.menuItemSub}>FAQs, 24/7 Chat & Contact</Text>
                    </View>
                  </View>
                  <Ionicons
                    name={expandedSection === 'help' ? 'chevron-up' : 'chevron-down'}
                    size={18}
                    color="#7A9384"
                  />
                </TouchableOpacity>

                {expandedSection === 'help' && (
                  <View style={styles.expandedSubCard}>
                    <TouchableOpacity style={styles.helpSubRow} activeOpacity={0.7}>
                      <Ionicons name="chatbubbles-outline" size={16} color="#1E4D2B" />
                      <Text style={styles.helpSubText}>Live Chat with Support (24/7)</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.helpSubRow} activeOpacity={0.7}>
                      <Ionicons name="call-outline" size={16} color="#1E4D2B" />
                      <Text style={styles.helpSubText}>Helpline: (02) 8888-SUYO</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.helpSubRow} activeOpacity={0.7}>
                      <Ionicons name="document-text-outline" size={16} color="#1E4D2B" />
                      <Text style={styles.helpSubText}>Frequently Asked Questions</Text>
                    </TouchableOpacity>
                  </View>
                )}

                <TouchableOpacity
                  style={styles.sidebarMenuItem}
                  activeOpacity={0.75}
                  onPress={() => toggleSection('about')}
                >
                  <View style={styles.menuItemLeft}>
                    <View style={[styles.menuItemIconCircle, { backgroundColor: '#F4ECE4' }]}>
                      <Ionicons name="information-circle-outline" size={18} color="#9E581B" />
                    </View>
                    <View style={styles.menuItemTextCol}>
                      <Text style={styles.menuItemTitle}>About SuyoLink</Text>
                      <Text style={styles.menuItemSub}>v1.0.0 • Hyperlocal Errands</Text>
                    </View>
                  </View>
                  <Ionicons
                    name={expandedSection === 'about' ? 'chevron-up' : 'chevron-down'}
                    size={18}
                    color="#7A9384"
                  />
                </TouchableOpacity>

                {expandedSection === 'about' && (
                  <View style={styles.expandedSubCard}>
                    <Text style={styles.aboutParagraph}>
                      SuyoLink connects you with reliable local doers to handle favors, document errands, and express deliveries securely in your community.
                    </Text>
                    <View style={styles.aboutMetaRow}>
                      <Text style={styles.aboutMetaLabel}>App Version:</Text>
                      <Text style={styles.aboutMetaValue}>1.0.0 (Build 2026.1)</Text>
                    </View>
                    <View style={styles.aboutMetaRow}>
                      <Text style={styles.aboutMetaLabel}>Terms & Privacy:</Text>
                      <Text style={styles.aboutMetaLink}>suyolink.ph/terms</Text>
                    </View>
                  </View>
                )}

                <View style={styles.logoutWrapper}>
                  <TouchableOpacity
                    style={styles.logoutButton}
                    activeOpacity={0.8}
                    onPress={() => {
                      closeSidebar();
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
        </View>
      )}

      {/* ========================================================== */}
      {/* EDIT PROFILE MODAL                                         */}
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
              onChangeText={(text) => setTempProfile({ ...tempProfile, name: text })}
              placeholder="Full Name"
              placeholderTextColor="#8FA497"
            />

            <Text style={styles.modalInputLabel}>Email Address</Text>
            <TextInput
              style={styles.modalInput}
              value={tempProfile.email}
              onChangeText={(text) => setTempProfile({ ...tempProfile, email: text })}
              placeholder="Email"
              keyboardType="email-address"
              placeholderTextColor="#8FA497"
            />

            <Text style={styles.modalInputLabel}>Contact Number</Text>
            <TextInput
              style={styles.modalInput}
              value={tempProfile.phone}
              onChangeText={(text) => setTempProfile({ ...tempProfile, phone: text })}
              placeholder="Phone"
              keyboardType="phone-pad"
              placeholderTextColor="#8FA497"
            />

            <Text style={styles.modalInputLabel}>Default Address</Text>
            <TextInput
              style={styles.modalInput}
              value={tempProfile.address}
              onChangeText={(text) => setTempProfile({ ...tempProfile, address: text })}
              placeholder="Address"
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
  headerIconButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  topProfileAvatarButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#D7EBE0',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#4ADE80',
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

  /* Content Scroll */
  contentScroll: {
    flex: 1,
    backgroundColor: '#F8FAF9',
    marginTop: -1,
  },
  contentContainer: {
    paddingBottom: 28,
  },

  /* === HERO SECTION WITH MATCHING STICKER BACKGROUND COLOR === */
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
    opacity: 1,
  },

  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D8E5DF',
    borderRadius: 16,
    paddingHorizontal: 14,
    height: 48,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 16,
    marginTop: 16,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#163523',
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
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -20,
    paddingHorizontal: 20,
    paddingTop: 8,
  },

  /* === STATS CARDS STYLES (THEME ADAPTED) === */
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 22,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2ECE7',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  statCardLabel: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#7A9384',
    marginBottom: 4,
  },
  statCardValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#163523',
  },
  statActiveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  activeIndicatorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#4ADE80',
  },

  sectionHeading: {
    fontSize: 16,
    fontWeight: '700',
    color: '#163523',
    marginBottom: 12,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 20,
    marginBottom: 12,
  },
  seeAllText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E4D2B',
  },

  /* Quick Services Grid */
  quickActionGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  actionCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2ECE7',
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  actionIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#EAF4EF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  actionTitleText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#163523',
  },

  /* Recent Tasks List */
  tasksList: {
    gap: 10,
  },
  taskCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2ECE7',
  },
  taskIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#F0F5F2',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  taskMeta: {
    flex: 1,
    marginRight: 8,
  },
  taskTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#163523',
    marginBottom: 2,
  },
  taskSub: {
    fontSize: 11.5,
    color: '#6C8575',
  },
  taskPriceColumn: {
    alignItems: 'flex-end',
  },
  taskPrice: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#163523',
    marginBottom: 4,
  },
  statusPillTransit: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: '#FDF3EC',
  },
  statusPillTextTransit: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#D97724',
  },

  /* COMPACT ACTIVE SUYO FLOATING BAR */
  floatingFooterActiveBarWrapper: {
    position: 'absolute',
    bottom: 64,
    left: 14,
    right: 14,
    zIndex: 90,
  },
  floatingFooterActiveBar: {
    backgroundColor: '#E8F5EC',
    borderRadius: 14,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: 'rgba(74, 222, 128, 0.4)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 6,
  },
  footerBarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  footerBarLiveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(74, 222, 128, 0.25)',
    paddingVertical: 1,
    paddingHorizontal: 5,
    borderRadius: 4,
    gap: 4,
  },
  pulsingGreenDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#2E7D32',
  },
  footerBarLiveText: {
    fontSize: 8.5,
    fontWeight: '800',
    color: '#1B5E20',
    letterSpacing: 0.4,
  },
  footerBarTrackingRight: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(39, 103, 57, 0.08)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  footerBarTrackingText: {
    fontSize: 10.5,
    color: '#1B5E20',
    fontWeight: '700',
  },
  footerBarBodyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  footerBarTextCol: {
    flex: 1,
    paddingRight: 6,
  },
  footerBarHeadline: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#163523',
    marginBottom: 1,
  },
  footerBarSub: {
    fontSize: 11,
    color: '#4A6B53',
  },
  footerBarChevronCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(30, 77, 43, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerProgressBarTrack: {
    height: 3,
    backgroundColor: 'rgba(30, 77, 43, 0.15)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  footerProgressBarFill: {
    height: '100%',
    backgroundColor: '#2E7D32',
    borderRadius: 2,
  },

  /* Bottom Navigation Bar */
  bottomNavContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
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
  },
  navItemText: {
    fontSize: 10.5,
    color: '#8FA497',
    fontWeight: '600',
    marginTop: 2,
  },
  navItemTextActive: {
    color: '#1E4D2B',
    fontWeight: '700',
  },

  /* Sidebar Drawer Styles */
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
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 16,
  },
  sidebarSafeArea: {
    flex: 1,
  },
  sidebarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EEF4F1',
  },
  sidebarBrandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sidebarLogoCircle: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#EAF4EF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sidebarBrandTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#163523',
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
    padding: 16,
  },
  sidebarAccountSingleLine: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAF9',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E2ECE7',
  },
  verifiedAvatarWrapper: {
    position: 'relative',
    marginRight: 10,
  },
  verifiedAvatarCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#1E4D2B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifiedBadgeDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#2E7D32',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  sidebarAccountNameText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: '#163523',
    marginRight: 8,
  },
  smallEditIconButton: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#EAF4EF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#CDE5D8',
  },
  sidebarDivider: {
    height: 1,
    backgroundColor: '#EEF4F1',
    marginVertical: 16,
  },
  sidebarSectionTitle: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#7A9384',
    letterSpacing: 0.8,
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  sidebarMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 10,
    marginBottom: 4,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  menuItemIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  menuItemTextCol: {
    flex: 1,
  },
  menuItemTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#163523',
  },
  menuItemSub: {
    fontSize: 11,
    color: '#7A9384',
    marginTop: 1,
  },
  expandedSubCard: {
    backgroundColor: '#F8FAF9',
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2ECE7',
  },
  helpSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 6,
  },
  helpSubText: {
    fontSize: 12.5,
    color: '#1E4D2B',
    fontWeight: '600',
  },
  aboutParagraph: {
    fontSize: 12,
    color: '#4A6354',
    lineHeight: 17,
    marginBottom: 8,
  },
  aboutMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  aboutMetaLabel: {
    fontSize: 11.5,
    color: '#7A9384',
  },
  aboutMetaValue: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#163523',
  },
  aboutMetaLink: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#1E4D2B',
    textDecorationLine: 'underline',
  },
  logoutWrapper: {
    marginTop: 20,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#EEF4F1',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FDEDEC',
    borderRadius: 10,
    paddingVertical: 11,
    gap: 8,
    borderWidth: 1,
    borderColor: '#F5CBC6',
  },
  logoutButtonText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#D32F2F',
  },

  /* Edit Profile Modal Styles */
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContentCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 10,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 16,
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
    fontSize: 12,
    fontWeight: '700',
    color: '#4A6354',
    marginBottom: 4,
    marginTop: 10,
  },
  modalInput: {
    backgroundColor: '#F8FAF9',
    borderWidth: 1,
    borderColor: '#D8E5DF',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 42,
    fontSize: 13.5,
    color: '#163523',
  },
  modalButtonsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
  },
  modalCancelButton: {
    flex: 1,
    backgroundColor: '#F0F5F2',
    borderRadius: 10,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#4A6354',
  },
  modalSaveButton: {
    flex: 1.2,
    backgroundColor: '#1E4D2B',
    borderRadius: 10,
    height: 42,
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
});