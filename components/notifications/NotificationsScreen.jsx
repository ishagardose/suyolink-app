import React, { useState } from 'react';
import { registerPush, unregisterPush } from '../../lib/pushNotifications';
import ThemedButton from '../themed/ThemedButton';
import ThemedText from '../themed/ThemedText';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '../../theme/ThemeContext';
import ScreenHeader from '../ScreenHeader';
import Notifications from '../dashboard/Notifications';

export default function NotificationsScreen() {
  const router = useRouter();
  const [pushMessage, setPushMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const pushAction = async (enable) => { setBusy(true); try { await (enable ? registerPush() : unregisterPush()); setPushMessage(enable ? 'Device notifications enabled.' : 'Device notifications disabled.'); } catch(e) { setPushMessage(e.message); } finally { setBusy(false); } };
  const { colors } = useTheme();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScreenHeader
        title="Notifications"
        onBack={() =>
          router.canGoBack() ? router.back() : router.replace('/dashboard')
        }
      />
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 60, gap: 20, width: '100%', maxWidth: 760, alignSelf: 'center' }}>
        <ThemedButton title={showSettings ? 'Hide notification settings' : 'Device notification settings'} variant="secondary" onPress={() => setShowSettings(value => !value)} />
        {showSettings ? <View style={{ padding: 20, gap: 12, backgroundColor: colors.card, borderRadius: 20, borderWidth: 1, borderColor: colors.border }}>
          <ThemedText style={{ fontWeight: '700' }}>Stay in the loop</ThemedText>
          <ThemedText tone="textMuted">Choose whether this device receives task alerts.</ThemedText>
          <ThemedButton title="Enable device notifications" disabled={busy} onPress={() => pushAction(true)} />
          <ThemedButton title="Disable device notifications" variant="secondary" disabled={busy} onPress={() => pushAction(false)} />
          {pushMessage ? <ThemedText accessibilityRole="status">{pushMessage}</ThemedText> : null}
        </View> : null}
        <Notifications />
      </ScrollView>
    </SafeAreaView>
  );
}
