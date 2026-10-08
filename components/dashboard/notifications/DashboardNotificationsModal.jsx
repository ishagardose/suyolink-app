import React from 'react';
import SwipeableNotificationItem from './SwipeableNotificationItem';
import {
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Modal,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function DashboardNotificationsModal({
  clearAllNotifications,
  colors,
  handleTapNotification,
  isNotificationsModalOpen,
  markAllNotificationsRead,
  markNotificationRead,
  notificationBusy,
  notificationError,
  notificationFilter,
  notifications,
  refresh,
  removeNotification,
  resolveColor,
  setIsNotificationsModalOpen,
  setNotificationError,
  setNotificationFilter,
  styles,
  unreadNotificationsCount,
  workflowError,
  workflowLoading,
}) {
  return (
    <Modal
      visible={isNotificationsModalOpen}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setIsNotificationsModalOpen(false)}
    >
      <View style={styles.modalBackdrop}>
        <View
          style={styles.notificationsModalCard}
          accessibilityRole={Platform.OS === 'web' ? 'dialog' : undefined}
          accessibilityLabel="Notifications"
          accessibilityViewIsModal
        >
          {/* Header */}
          <View style={styles.notifModalHeader}>
            <View style={styles.notifTitleRow}>
              <Ionicons
                name="notifications"
                size={20}
                color={resolveColor('#1E4D2B', 'color')}
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
              accessibilityRole="button"
              accessibilityLabel="Close notifications"
              activeOpacity={0.7}
            >
              <Ionicons
                name="close"
                size={20}
                color={resolveColor('#163523', 'color')}
              />
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
                disabled={notificationBusy}
                accessibilityRole="button"
                accessibilityLabel="Mark all notifications read"
                onPress={markAllNotificationsRead}
                style={styles.notifMarkAllReadBtn}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="checkmark-done"
                  size={14}
                  color={resolveColor('#1E4D2B', 'color')}
                />
                <Text style={styles.notifMarkAllReadText}>Mark read</Text>
              </TouchableOpacity>
            )}
          </View>

          {notificationError || workflowError ? (
            <View style={{ paddingHorizontal: 20, paddingBottom: 10 }}>
              <Text
                accessibilityRole="alert"
                style={{ color: colors.danger }}
              >
                {notificationError || workflowError}
              </Text>
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Retry notifications"
                onPress={() => {
                  setNotificationError('');
                  refresh();
                }}
              >
                <Text style={styles.notifActionLinkText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : null}
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
                    disabled={notificationBusy}
                  />
                ))}
            </ScrollView>
          ) : (
            <View style={styles.notifEmptyBox}>
              <Ionicons
                name="notifications-off-outline"
                size={46}
                color={resolveColor('#A3B8AC', 'color')}
              />
              <Text style={styles.notifEmptyTitle}>
                {workflowLoading
                  ? 'Loading notifications...'
                  : notificationFilter === 'Unread'
                    ? 'No unread notifications'
                    : 'No notifications'}
              </Text>
              <Text style={styles.notifEmptySub}>
                {notificationFilter === 'Unread'
                  ? 'You are all caught up with your suyo updates.'
                  : 'Application decisions and task updates will appear here.'}
              </Text>
            </View>
          )}

          {/* Bottom Actions */}
          <View style={styles.notifModalBottomRow}>
            {notifications.length > 0 && (
              <TouchableOpacity
                style={styles.notifClearBtn}
                disabled={notificationBusy}
                accessibilityRole="button"
                accessibilityLabel="Clear all notifications"
                onPress={clearAllNotifications}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="trash-outline"
                  size={15}
                  color={resolveColor('#64748B', 'color')}
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
  );
}
