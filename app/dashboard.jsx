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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SIDEBAR_WIDTH = Math.min(SCREEN_WIDTH * 0.82, 340);

const QUICK_ACTIONS = [
  { id: '1', title: 'Send Parcel', icon: 'cube-outline' },
  { id: '2', title: 'Run Errand', icon: 'bicycle-outline' },
  { id: '3', title: 'Grocery Run', icon: 'basket-outline' },
  { id: '4', title: 'Documents', icon: 'document-text-outline' },
];

const RECENT_TASKS = [
  {
    id: 'TRK-9842',
    title: 'Legal Documents to Makati CBD',
    status: 'In Transit',
    time: 'Est. 18 mins',
    price: '₱145.00',
    type: 'Express Courier',
  },
  {
    id: 'TRK-9839',
    title: 'Birthday Gift to BGC Taguig',
    status: 'Delivered',
    time: 'Delivered 10:15 AM',
    price: '₱220.00',
    type: 'Parcel Box',
  },
  {
    id: 'TRK-9811',
    title: 'Organic Produce from Market',
    status: 'Delivered',
    time: 'Yesterday',
    price: '₱180.00',
    type: 'Grocery Delivery',
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

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.safeContainer}>
      <StatusBar style="light" />

      {/* 1. FIXED TOP BAR: Sidebar Hamburger Icon (Left), Notification + Profile Icon (Right) */}
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
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Hunter Green Hero Section */}
        <View style={styles.headerHeroSection}>
          {/* Welcome Greeting */}
          <View style={styles.welcomeGreetingContainer}>
            <Text style={styles.welcomeSubText}>Welcome back,</Text>
            <Text style={styles.welcomeNameText}>{userProfile.name}</Text>
          </View>

          {/* Search Bar: Placed at the top under the greeting */}
          <View style={styles.searchBarContainer}>
            <Ionicons name="search-outline" size={20} color="#7A9384" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search parcel, courier, or task ID..."
              placeholderTextColor="#8FA497"
            />
          </View>
        </View>

        {/* Floating Bridge: The Live Tracking Card sits overlapping the green header and white content */}
        <View style={styles.floatingBridgeContainer}>
          <View style={styles.bridgeGreenBackground} />

          <View style={styles.activeParcelCard}>
            <View style={styles.parcelCardHeader}>
              <View style={styles.liveIndicator}>
                <View style={styles.pulsingGreenDot} />
                <Text style={styles.liveIndicatorText}>LIVE TRACKING</Text>
              </View>
              <Text style={styles.trackingNumberText}>#SYL-88219</Text>
            </View>

            <Text style={styles.parcelStatusHeadline}>Courier is 5 mins away</Text>
            <Text style={styles.parcelAddressSub}>To: Unit 402, High Street Residences</Text>

            {/* Progress Bar */}
            <View style={styles.cardProgressBarTrack}>
              <View style={styles.cardProgressBarFill} />
            </View>
          </View>
        </View>

        {/* White Content Body */}
        <View style={styles.whiteContentBody}>
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

          {/* Recent Errands & Tasks */}
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionHeading}>Recent Activity</Text>
            <TouchableOpacity activeOpacity={0.7}>
              <Text style={styles.seeAllText}>View all</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.tasksList}>
            {RECENT_TASKS.map((task) => {
              const isDelivered = task.status === 'Delivered';
              return (
                <View key={task.id} style={styles.taskCard}>
                  <View style={styles.taskIconWrapper}>
                    <Ionicons
                      name={isDelivered ? 'checkmark-done-circle' : 'time'}
                      size={26}
                      color={isDelivered ? '#1E4D2B' : '#E07A2A'}
                    />
                  </View>
                  <View style={styles.taskMeta}>
                    <Text style={styles.taskTitle} numberOfLines={1}>
                      {task.title}
                    </Text>
                    <Text style={styles.taskSub}>
                      {task.type} • {task.time}
                    </Text>
                  </View>
                  <View style={styles.taskPriceColumn}>
                    <Text style={styles.taskPrice}>{task.price}</Text>
                    <View
                      style={[
                        styles.statusPill,
                        isDelivered ? styles.statusPillDelivered : styles.statusPillTransit,
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusPillText,
                          isDelivered ? styles.statusPillTextDelivered : styles.statusPillTextTransit,
                        ]}
                      >
                        {task.status}
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      </ScrollView>

      {/* Bottom Navigation Bar */}
      <View style={styles.bottomNavContainer}>
        {[
          { id: 'home', label: 'Home', icon: 'home' },
          { id: 'errands', label: 'Errands', icon: 'bicycle' },
          { id: 'activity', label: 'Activity', icon: 'receipt' },
          { id: 'profile', label: 'Account', icon: 'person' },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              style={styles.navItem}
              onPress={() => {
                setActiveTab(tab.id);
                if (tab.id === 'profile') {
                  openSidebar();
                }
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
          {/* Semi-transparent Backdrop */}
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

          {/* Sliding Sidebar Drawer Panel */}
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
              {/* Sidebar Header with Brand & Close Button */}
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
                {/* 1. ACCOUNT IN SIDEBAR: 1 single line with circle verified profile, name, and small clickable edit icon */}
                <View style={styles.sidebarAccountSingleLine}>
                  {/* Circle Verified Profile Avatar */}
                  <View style={styles.verifiedAvatarWrapper}>
                    <View style={styles.verifiedAvatarCircle}>
                      <Ionicons name="person" size={20} color="#FFFFFF" />
                    </View>
                    <View style={styles.verifiedBadgeDot}>
                      <Ionicons name="checkmark-sharp" size={9} color="#FFFFFF" />
                    </View>
                  </View>

                  {/* User Name in the same line */}
                  <Text style={styles.sidebarAccountNameText} numberOfLines={1}>
                    {userProfile.name}
                  </Text>

                  {/* Small clickable edit icon right beside the name */}
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

                {/* Section Separator */}
                <View style={styles.sidebarDivider} />
                <Text style={styles.sidebarSectionTitle}>Preferences</Text>

                {/* 2. PUSH NOTIFICATIONS TOGGLE */}
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

                {/* 3. HELP & SUPPORT (Expandable) */}
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

                {/* 4. ABOUT SUYOLINK (Expandable) */}
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

                {/* 5. LOGOUT BUTTON (Inside Sidebar) */}
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
      {/* EDIT PROFILE MODAL (Triggered by small edit icon)           */}
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
    backgroundColor: '#163523',
  },

  /* Fixed Top Bar */
  fixedTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
    backgroundColor: '#163523',
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
  },
  contentContainer: {
    paddingBottom: 28,
  },

  /* Hunter Green Hero inside ScrollView */
  headerHeroSection: {
    backgroundColor: '#163523',
    paddingHorizontal: 20,
    paddingTop: 6,
    paddingBottom: 22,
  },
  welcomeGreetingContainer: {
    marginBottom: 16,
  },
  welcomeSubText: {
    fontSize: 13,
    color: '#B2D0C0',
    fontWeight: '500',
    marginBottom: 3,
    letterSpacing: 0.2,
  },
  welcomeNameText: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.4,
  },

  /* Search Bar under greeting */
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D8E5DF',
    borderRadius: 15,
    paddingHorizontal: 14,
    height: 48,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#163523',
  },

  /* Floating Bridge: Overlapping the Green Header and White Content */
  floatingBridgeContainer: {
    position: 'relative',
    paddingHorizontal: 20,
    backgroundColor: '#F8FAF9',
  },
  bridgeGreenBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 60, // Extends green background down under top half of card
    backgroundColor: '#163523',
  },
  activeParcelCard: {
    backgroundColor: '#1E4D2B',
    borderRadius: 20,
    padding: 17,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 10,
    elevation: 6,
  },
  parcelCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.22)',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 8,
    gap: 6,
  },
  pulsingGreenDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#4ADE80',
  },
  liveIndicatorText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#D4E8DC',
    letterSpacing: 0.5,
  },
  trackingNumberText: {
    fontSize: 12,
    color: '#B2D0C0',
    fontWeight: '600',
  },
  parcelStatusHeadline: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  parcelAddressSub: {
    fontSize: 13,
    color: '#C6DFD1',
    marginBottom: 14,
  },
  cardProgressBarTrack: {
    height: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  cardProgressBarFill: {
    width: '78%',
    height: '100%',
    backgroundColor: '#4ADE80',
    borderRadius: 3,
  },

  /* White Content Body */
  whiteContentBody: {
    backgroundColor: '#F8FAF9',
    paddingHorizontal: 20,
    paddingTop: 18,
  },
  sectionHeading: {
    fontSize: 18,
    fontWeight: '800',
    color: '#163523',
    letterSpacing: -0.2,
    marginBottom: 14,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    marginBottom: 12,
  },
  seeAllText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E4D2B',
  },
  quickActionGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  actionCard: {
    width: (SCREEN_WIDTH - 40 - 24) / 4,
    alignItems: 'center',
  },
  actionIconCircle: {
    width: 54,
    height: 54,
    borderRadius: 16,
    backgroundColor: '#EBF4EF',
    borderWidth: 1,
    borderColor: '#D2E5DB',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  actionTitleText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#284635',
    textAlign: 'center',
  },
  tasksList: {
    gap: 12,
  },
  taskCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.2,
    borderColor: '#DFECE5',
    borderRadius: 16,
    padding: 14,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  taskIconWrapper: {
    marginRight: 12,
  },
  taskMeta: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#163523',
    marginBottom: 3,
  },
  taskSub: {
    fontSize: 12,
    color: '#718C7D',
  },
  taskPriceColumn: {
    alignItems: 'flex-end',
    marginLeft: 8,
  },
  taskPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: '#163523',
    marginBottom: 4,
  },
  statusPill: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  statusPillDelivered: {
    backgroundColor: '#E8F5EE',
  },
  statusPillTransit: {
    backgroundColor: '#FDF3E7',
  },
  statusPillText: {
    fontSize: 10.5,
    fontWeight: '700',
  },
  statusPillTextDelivered: {
    color: '#1E4D2B',
  },
  statusPillTextTransit: {
    color: '#D97706',
  },
  bottomNavContainer: {
    height: 62,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E6EFEA',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  navItemText: {
    fontSize: 11,
    color: '#8FA497',
    fontWeight: '600',
    marginTop: 3,
  },
  navItemTextActive: {
    color: '#1E4D2B',
    fontWeight: '700',
  },

  /* Sidebar Drawer */
  sidebarBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10, 26, 17, 0.65)',
    zIndex: 99,
  },
  sidebarDrawer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    backgroundColor: '#FFFFFF',
    zIndex: 100,
    shadowColor: '#000000',
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
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

  /* 1-Line Account Section in Sidebar */
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
  aboutMetaLink: {
    fontSize: 11.5,
    color: '#1E4D2B',
    fontWeight: '700',
    textDecorationLine: 'underline',
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

  /* Edit Profile Modal */
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
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
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
});
