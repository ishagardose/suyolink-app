import React from 'react';
import AppearanceSelector from '../../themed/AppearanceSelector';
import { SIDEBAR_WIDTH } from '../utils/dashboardLayout';
import { getInitials } from '../utils/dashboardHelpers';
import {
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Animated,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

export default function DashboardSidebar({
  closeSidebar,
  expandedSection,
  logout,
  pushNotifications,
  resolveColor,
  router,
  setActiveTab,
  setIsEditModalOpen,
  setPushNotifications,
  setTempProfile,
  sidebarAnim,
  styles,
  toggleSection,
  triggerToast,
  userProfile,
}) {
  return (
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
                color={resolveColor('#1E4D2B', 'color')}
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
              color={resolveColor('#163523', 'color')}
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
                    color={resolveColor('#1E4D2B', 'color')}
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
                  color={resolveColor('#6D8777', 'color')}
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
                  {
                    backgroundColor: resolveColor('#DCFCE7', 'backgroundColor'),
                  },
                ]}
              >
                <Ionicons
                  name="wallet-outline"
                  size={18}
                  color={resolveColor('#059669', 'color')}
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
              color={resolveColor('#7A9384', 'color')}
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
                  {
                    backgroundColor: resolveColor('#DCFCE7', 'backgroundColor'),
                  },
                ]}
              >
                <Ionicons
                  name="receipt-outline"
                  size={18}
                  color={resolveColor('#059669', 'color')}
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
              color={resolveColor('#7A9384', 'color')}
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
                  {
                    backgroundColor: resolveColor('#F4ECE4', 'backgroundColor'),
                  },
                ]}
              >
                <Ionicons
                  name="information-circle-outline"
                  size={18}
                  color={resolveColor('#9E581B', 'color')}
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
              name={expandedSection === 'about' ? 'chevron-up' : 'chevron-down'}
              size={18}
              color={resolveColor('#7A9384', 'color')}
            />
          </TouchableOpacity>

          {expandedSection === 'about' && (
            <View style={styles.expandedSubCard}>
              <Text style={styles.aboutParagraph}>
                SuyoLink connects you with reliable local doers to handle
                favors, document suyos, and express deliveries securely in your
                community.
              </Text>
              <View style={styles.aboutMetaRow}>
                <Text style={styles.aboutMetaLabel}>App Version:</Text>
                <Text style={styles.aboutMetaValue}>1.0.0 (Build 2026.1)</Text>
              </View>
            </View>
          )}

          <View
            style={{
              marginTop: 12,
              paddingTop: 20,
              paddingBottom: 24,
              borderTopWidth: 1,
              borderTopColor: resolveColor('#D8E5DF', 'borderColor'),
            }}
          >
            <AppearanceSelector />
          </View>

          {/* Push Notifications (Placed under About SuyoLink) */}
          <View style={styles.sidebarMenuItem}>
            <View style={styles.menuItemLeft}>
              <View
                style={[
                  styles.menuItemIconCircle,
                  {
                    backgroundColor: resolveColor('#EAF4EF', 'backgroundColor'),
                  },
                ]}
              >
                <Ionicons
                  name="notifications-outline"
                  size={18}
                  color={resolveColor('#1E4D2B', 'color')}
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
              trackColor={{
                false: resolveColor('#D4E2DA', 'trackColor'),
                true: resolveColor('#1E4D2B', 'trackColor'),
              }}
              thumbColor={
                pushNotifications
                  ? resolveColor('#4ADE80', 'thumbColor')
                  : resolveColor('#FFFFFF', 'thumbColor')
              }
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
              color={resolveColor('#D32F2F', 'color')}
            />
            <Text style={styles.logoutButtonText}>Log Out</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Animated.View>
  );
}
