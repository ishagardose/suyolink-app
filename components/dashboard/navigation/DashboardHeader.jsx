import React from 'react';
import { Text, View, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function DashboardHeader({
  favoriteSuyoIds,
  openSidebar,
  resolveColor,
  setIsFavoritesModalOpen,
  setIsNotificationsModalOpen,
  styles,
  unreadNotificationsCount,
}) {
  return (
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
          color={resolveColor('#FFFFFF', 'color')}
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
            color={resolveColor('#FFFFFF', 'color')}
          />
          {favoriteSuyoIds.length > 0 && <View style={styles.unreadBadgeDot} />}
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
            color={resolveColor('#FFFFFF', 'color')}
          />
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
  );
}
