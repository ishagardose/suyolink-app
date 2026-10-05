import React, { useState } from 'react';
import { registerPush, unregisterPush } from '../../lib/pushNotifications';
import ThemedButton from '../themed/ThemedButton';
import ThemedText from '../themed/ThemedText';
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeContext';
import Notifications from '../dashboard/Notifications';

export default function NotificationsModal({ onClose }) {
  const insets = useSafeAreaInsets();
  const [pushMessage, setPushMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const pushAction = async (enable) => {
    setBusy(true);
    try {
      await (enable ? registerPush() : unregisterPush());
      setPushMessage(
        enable
          ? 'Device notifications enabled.'
          : 'Device notifications disabled.',
      );
    } catch (e) {
      setPushMessage(e.message);
    } finally {
      setBusy(false);
    }
  };
  const { colors } = useTheme();

  return (
    <Modal
      visible
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          paddingHorizontal: 16,
          paddingTop: Math.max(insets.top, 16),
          paddingBottom: Math.max(insets.bottom, 16),
        }}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close notifications backdrop"
          onPress={onClose}
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: colors.backdrop,
          }}
        />
        <View
          accessibilityViewIsModal
          accessibilityRole={Platform.OS === 'web' ? 'dialog' : undefined}
          aria-modal={true}
          accessibilityLabel="Notifications"
          style={{
            width: '100%',
            maxWidth: 560,
            maxHeight: '90%',
            alignSelf: 'center',
            backgroundColor: colors.card,
            borderRadius: 26,
            borderWidth: 1,
            borderColor: colors.border,
            overflow: 'hidden',
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: 20,
              borderBottomWidth: 1,
              borderBottomColor: colors.border,
            }}
          >
            <View
              style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}
            >
              <Ionicons
                name="notifications-outline"
                size={23}
                color={colors.link}
              />
              <ThemedText
                accessibilityRole="header"
                style={{ fontSize: 22, fontWeight: '800' }}
              >
                Notifications
              </ThemedText>
            </View>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Close notifications"
              onPress={onClose}
              style={{
                width: 40,
                height: 40,
                borderRadius: 13,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: colors.surfaceAlt,
              }}
            >
              <Ionicons
                name="close"
                size={22}
                color={colors.text}
              />
            </TouchableOpacity>
          </View>
          <ScrollView
            contentContainerStyle={{ padding: 20, paddingBottom: 28, gap: 20 }}
          >
            <ThemedButton
              title={
                showSettings
                  ? 'Hide notification settings'
                  : 'Device notification settings'
              }
              variant="secondary"
              onPress={() => setShowSettings((value) => !value)}
            />
            {showSettings ? (
              <View
                style={{
                  padding: 20,
                  gap: 12,
                  backgroundColor: colors.card,
                  borderRadius: 20,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <ThemedText style={{ fontWeight: '700' }}>
                  Stay in the loop
                </ThemedText>
                <ThemedText tone="textMuted">
                  Choose whether this device receives task alerts.
                </ThemedText>
                <ThemedButton
                  title="Enable device notifications"
                  disabled={busy}
                  onPress={() => pushAction(true)}
                />
                <ThemedButton
                  title="Disable device notifications"
                  variant="secondary"
                  disabled={busy}
                  onPress={() => pushAction(false)}
                />
                {pushMessage ? (
                  <ThemedText accessibilityRole="status">
                    {pushMessage}
                  </ThemedText>
                ) : null}
              </View>
            ) : null}
            <Notifications
              showHeading={false}
              onOpenRequest={onClose}
            />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
