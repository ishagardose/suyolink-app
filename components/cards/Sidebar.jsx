import ThemedText from '../themed/ThemedText';
import React, { useMemo, useState } from 'react';
import { StyleSheet, View, TouchableOpacity, ScrollView, Modal, Switch, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import ThemedButton from '../themed/ThemedButton';
const SIDEBAR_WIDTH = Math.min(Dimensions.get('window').width * 0.82, 340);
export default function Sidebar({ visible, onClose, onEditProfile }) {
  const { colors, themeMode, setThemeMode } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { user: userProfile, logout } = useAuth();
  const [pushNotifications, setPushNotifications] = useState(true);
  const [expandedSection, setExpandedSection] = useState(null);
  const [error, setError] = useState('');
  const [loggingOut, setLoggingOut] = useState(false);
  const toggleSection = (section) => setExpandedSection((prev) => prev === section ? null : section);
  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    setError('');
    try { await logout(); }
    catch { setError('Could not clear your saved session. Please try again.'); }
    finally { setLoggingOut(false); }
  };
  if (!userProfile) return null;
  return <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
        <View style={StyleSheet.absoluteFillObject} pointerEvents="box-none">
          <View
            style={[
              styles.sidebarBackdrop,

            ]}
          >
            <TouchableOpacity
              style={StyleSheet.absoluteFillObject}
              activeOpacity={1}
              onPress={onClose}
            />
          </View>

          <View
            style={[
              styles.sidebarDrawer,
              {
                width: SIDEBAR_WIDTH,

              },
            ]}
          >
            <SafeAreaView edges={['top', 'bottom']} style={styles.sidebarSafeArea}>
              <View style={styles.sidebarHeader}>
                <View style={styles.sidebarBrandRow}>
                  <View style={styles.sidebarLogoCircle}>
                    <Ionicons name="paper-plane" size={16} color={colors.text} />
                  </View>
                  <ThemedText style={styles.sidebarBrandTitle}>SuyoLink</ThemedText>
                </View>
                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityLabel="Close sidebar"
                  onPress={onClose}
                  style={styles.sidebarCloseButton}
                  activeOpacity={0.7}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                >
                  <Ionicons name="close" size={22} color={colors.text} />
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
                      <Ionicons name="person" size={20} color={colors.onPrimary} />
                    </View>
                  </View>

                  <ThemedText style={styles.sidebarAccountNameText} numberOfLines={1}>
                    {userProfile.name}
                  </ThemedText>

                  <TouchableOpacity
                    accessibilityRole="button"
                    accessibilityLabel="Edit profile"
                    style={styles.smallEditIconButton}
                    activeOpacity={0.7}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    onPress={onEditProfile}
                  >
                    <Ionicons name="pencil-sharp" size={13} color={colors.link} />
                  </TouchableOpacity>
                </View>

                <View style={styles.sidebarDivider} />
                <ThemedText style={styles.sidebarSectionTitle}>Preferences</ThemedText>
                <ThemedText style={styles.menuItemTitle}>Appearance</ThemedText>
                <View style={{ flexDirection: 'row', gap: 6, marginVertical: 12 }}>
                  {['light', 'dark', 'system'].map((mode) => (
                    <ThemedButton key={mode} title={mode[0].toUpperCase() + mode.slice(1)}
                      variant={themeMode === mode ? 'primary' : 'secondary'} style={{ flex: 1, paddingHorizontal: 6 }}
                      accessibilityLabel={mode + ' theme'} accessibilityState={{ selected: themeMode === mode }}
                      onPress={() => setThemeMode(mode).catch(() => setError('Could not save appearance. Please try again.'))} />
                  ))}
                </View>
                {error ? <ThemedText accessibilityRole="alert" style={{ color: colors.danger }}>{error}</ThemedText> : null}


                <View style={styles.sidebarMenuItem}>
                  <View style={styles.menuItemLeft}>
                    <View style={[styles.menuItemIconCircle, { backgroundColor: colors.surfaceAlt }]}>
                      <Ionicons name="notifications-outline" size={18} color={colors.link} />
                    </View>
                    <View style={styles.menuItemTextCol}>
                      <ThemedText style={styles.menuItemTitle}>Push Notifications</ThemedText>
                      <ThemedText style={styles.menuItemSub}>Delivery alerts & promos</ThemedText>
                    </View>
                  </View>
                  <Switch
                    value={pushNotifications}
                    onValueChange={setPushNotifications}
                    trackColor={{ false: colors.border, true: colors.primary }}
                    thumbColor={pushNotifications ? colors.accent : colors.onPrimary}
                  />
                </View>

                <TouchableOpacity
                  style={styles.sidebarMenuItem}
                  activeOpacity={0.75}
                  onPress={() => toggleSection('help')}
                >
                  <View style={styles.menuItemLeft}>
                    <View style={[styles.menuItemIconCircle, { backgroundColor: colors.surfaceAlt }]}>
                      <Ionicons name="help-buoy-outline" size={18} color={colors.link} />
                    </View>
                    <View style={styles.menuItemTextCol}>
                      <ThemedText style={styles.menuItemTitle}>Help & Support</ThemedText>
                      <ThemedText style={styles.menuItemSub}>FAQs, 24/7 Chat & Contact</ThemedText>
                    </View>
                  </View>
                  <Ionicons
                    name={expandedSection === 'help' ? 'chevron-up' : 'chevron-down'}
                    size={18}
                    color={colors.muted}
                  />
                </TouchableOpacity>

                {expandedSection === 'help' && (
                  <View style={styles.expandedSubCard}>
                    <TouchableOpacity style={styles.helpSubRow} activeOpacity={0.7}>
                      <Ionicons name="chatbubbles-outline" size={16} color={colors.link} />
                      <ThemedText style={styles.helpSubText}>Live Chat with Support (24/7)</ThemedText>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.helpSubRow} activeOpacity={0.7}>
                      <Ionicons name="call-outline" size={16} color={colors.link} />
                      <ThemedText style={styles.helpSubText}>Helpline: (02) 8888-SUYO</ThemedText>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.helpSubRow} activeOpacity={0.7}>
                      <Ionicons name="document-text-outline" size={16} color={colors.link} />
                      <ThemedText style={styles.helpSubText}>Frequently Asked Questions</ThemedText>
                    </TouchableOpacity>
                  </View>
                )}

                <TouchableOpacity
                  style={styles.sidebarMenuItem}
                  activeOpacity={0.75}
                  onPress={() => toggleSection('about')}
                >
                  <View style={styles.menuItemLeft}>
                    <View style={[styles.menuItemIconCircle, { backgroundColor: colors.warningSurface }]}>
                      <Ionicons name="information-circle-outline" size={18} color={colors.warning} />
                    </View>
                    <View style={styles.menuItemTextCol}>
                      <ThemedText style={styles.menuItemTitle}>About SuyoLink</ThemedText>
                      <ThemedText style={styles.menuItemSub}>v1.0.0 • Hyperlocal Errands</ThemedText>
                    </View>
                  </View>
                  <Ionicons
                    name={expandedSection === 'about' ? 'chevron-up' : 'chevron-down'}
                    size={18}
                    color={colors.muted}
                  />
                </TouchableOpacity>

                {expandedSection === 'about' && (
                  <View style={styles.expandedSubCard}>
                    <ThemedText style={styles.aboutParagraph}>
                      SuyoLink connects you with reliable local doers to handle favors, document errands, and express deliveries securely in your community.
                    </ThemedText>
                    <View style={styles.aboutMetaRow}>
                      <ThemedText style={styles.aboutMetaLabel}>App Version:</ThemedText>
                      <ThemedText style={styles.aboutMetaValue}>1.0.0 (Build 2026.1)</ThemedText>
                    </View>
                    <View style={styles.aboutMetaRow}>
                      <ThemedText style={styles.aboutMetaLabel}>Terms & Privacy:</ThemedText>
                      <ThemedText style={styles.aboutMetaLink}>suyolink.ph/terms</ThemedText>
                    </View>
                  </View>
                )}

                <View style={styles.logoutWrapper}>
                  <TouchableOpacity
                    accessibilityRole="button"
                    accessibilityLabel="Log Out"
                    style={styles.logoutButton}
                    activeOpacity={0.8}
                    onPress={handleLogout}
                    disabled={loggingOut}
                  >
                    <Ionicons name="log-out-outline" size={20} color={colors.danger} />
                    <ThemedText style={styles.logoutButtonText}>Log Out</ThemedText>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </SafeAreaView>
          </View>
        </View>
  </Modal>;
}
const createStyles = (colors) => StyleSheet.create({
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
    backgroundColor: colors.surface,
    zIndex: 201,
    shadowColor: colors.shadow,
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
    borderBottomColor: colors.border,
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
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sidebarBrandTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
  },
  sidebarCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surfaceAlt,
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
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  verifiedAvatarWrapper: {
    position: 'relative',
    marginRight: 10,
  },
  verifiedAvatarCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sidebarAccountNameText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    marginRight: 8,
  },
  smallEditIconButton: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  sidebarDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 16,
  },
  sidebarSectionTitle: {
    fontSize: 11.5,
    fontWeight: '700',
    color: colors.muted,
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
    color: colors.text,
  },
  menuItemSub: {
    fontSize: 11,
    color: colors.muted,
    marginTop: 1,
  },
  expandedSubCard: {
    backgroundColor: colors.background,
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  helpSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 6,
  },
  helpSubText: {
    fontSize: 12.5,
    color: colors.link,
    fontWeight: '600',
  },
  aboutParagraph: {
    fontSize: 12,
    color: colors.textSecondary,
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
    color: colors.muted,
  },
  aboutMetaValue: {
    fontSize: 11.5,
    fontWeight: '600',
    color: colors.text,
  },
  aboutMetaLink: {
    fontSize: 11.5,
    fontWeight: '600',
    color: colors.link,
    textDecorationLine: 'underline',
  },
  logoutWrapper: {
    marginTop: 20,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.dangerSurface,
    borderRadius: 10,
    paddingVertical: 11,
    gap: 8,
    borderWidth: 1,
    borderColor: colors.dangerBorder,
  },
  logoutButtonText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: colors.danger,
  },
});
