import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const QUICK_ACTIONS = [
  { id: '1', title: 'Send Parcel', icon: 'cube-outline', color: '#1E4D2B' },
  { id: '2', title: 'Run Errand', icon: 'bicycle-outline', color: '#1E4D2B' },
  { id: '3', title: 'Grocery Run', icon: 'basket-outline', color: '#1E4D2B' },
  { id: '4', title: 'Documents', icon: 'document-text-outline', color: '#1E4D2B' },
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

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.safeContainer}>
      <StatusBar style="light" />

      {/* Hunter Green Header Section */}
      <View style={styles.headerHero}>
        {/* Top bar with profile and notifications */}
        <View style={styles.topBarRow}>
          <View style={styles.profileBadge}>
            <View style={styles.avatarCircle}>
              <Ionicons name="person" size={20} color="#163523" />
            </View>
            <View>
              <Text style={styles.greetingSub}>Welcome back,</Text>
              <Text style={styles.userNameText}>Juan Dela Cruz</Text>
            </View>
          </View>

          <View style={styles.headerActionRow}>
            <TouchableOpacity
              style={styles.headerIconButton}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="notifications-outline" size={22} color="#FFFFFF" />
              <View style={styles.unreadBadgeDot} />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.replace('/')}
              style={styles.headerIconButton}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="log-out-outline" size={22} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Live Parcel Status Banner */}
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

          {/* Progress Bar inside Card */}
          <View style={styles.cardProgressBarTrack}>
            <View style={styles.cardProgressBarFill} />
          </View>
        </View>
      </View>

      {/* Main Content Area */}
      <ScrollView
        style={styles.contentScroll}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Search Bar */}
        <View style={styles.searchBarContainer}>
          <Ionicons name="search-outline" size={20} color="#7A9384" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search parcel, courier, or task ID..."
            placeholderTextColor="#8FA497"
          />
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
      </ScrollView>

      {/* Bottom Navigation Bar */}
      <View style={styles.bottomNavContainer}>
        {[
          { id: 'home', label: 'Home', icon: 'home' },
          { id: 'errands', label: 'Errands', icon: 'bicycle' },
          { id: 'activity', label: 'Activity', icon: 'receipt' },
          { id: 'profile', label: 'Profile', icon: 'person' },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              style={styles.navItem}
              onPress={() => setActiveTab(tab.id)}
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: '#163523',
  },
  headerHero: {
    backgroundColor: '#163523',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 22,
  },
  topBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  profileBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#D7EBE0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  greetingSub: {
    fontSize: 12,
    color: '#A9C4B5',
    fontWeight: '500',
  },
  userNameText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.1,
  },
  headerActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerIconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  unreadBadgeDot: {
    position: 'absolute',
    top: 9,
    right: 9,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#E05A47',
  },
  activeParcelCard: {
    backgroundColor: '#1E4D2B',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
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
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
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
  contentScroll: {
    flex: 1,
    backgroundColor: '#F8FAF9',
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 24,
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.2,
    borderColor: '#D8E5DF',
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 48,
    marginBottom: 24,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#163523',
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
});
