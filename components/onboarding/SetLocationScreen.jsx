import React, { useRef, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useDeviceLocation } from '../../context/LocationContext';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../theme/ThemeContext';
import TaskMap from '../maps/TaskMap';
import ThemedText from '../themed/ThemedText';
import ThemedButton from '../themed/ThemedButton';
import LocationAcknowledgment from './LocationAcknowledgment';

export default function SetLocationScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { logout } = useAuth();
  const {
    position,
    locate,
    loading,
    error,
    saveLocation,
    hasSavedLocation,
    isReady,
    permissionState,
    openSettings,
  } = useDeviceLocation();

  const [selected, setSelected] = useState(null);
  const [source, setSource] = useState('manual');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [acknowledged, setAcknowledged] = useState(false);
  const lock = useRef(false);
  const choice = useRef(0);
  const pin = selected || (hasSavedLocation ? position : null);

  const save = async () => {
    if (lock.current || !pin || !acknowledged) return;
    lock.current = true;
    setSaving(true);
    setSaveError('');
    try {
      if (await saveLocation(pin, source)) router.replace('/dashboard');
    } catch {
      setSaveError('Could not save your location. Please try again.');
    } finally {
      lock.current = false;
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[styles.icon, { backgroundColor: colors.surfaceAlt }]}>
          <Ionicons
            name="location-outline"
            size={32}
            color={colors.link}
          />
        </View>
        <ThemedText
          style={styles.eyebrow}
          tone="textMuted"
        >
          FIND YOUR NEXT SUYO
        </ThemedText>
        <ThemedText
          accessibilityRole="header"
          style={styles.title}
        >
          Set your location
        </ThemedText>
        <ThemedText
          tone="textMuted"
          style={styles.body}
        >
          Choose your area to continue to SuyoLink. Your saved location helps
          you find nearby suyos. You can use GPS or choose a map pin.
        </ThemedText>

        {/* GPS is optional; selecting an area is required. */}
        <View style={{ gap: 8 }}>
          <ThemedButton
            title="Use my current location"
            loading={loading}
            disabled={saving || !isReady}
            onPress={async () => {
              const request = ++choice.current;
              const next = await locate();
              if (next && request === choice.current) {
                setSelected(next);
                setSource('device');
                setAcknowledged(false);
              }
            }}
          />
        </View>

        {/* Permission warning & settings link if denied */}
        {permissionState === 'denied' ||
        (error && error.includes('Location permission is off')) ? (
          <View
            style={[
              styles.deniedBanner,
              { borderColor: colors.border, backgroundColor: colors.card },
            ]}
          >
            <ThemedText
              tone="danger"
              style={{ fontWeight: '600' }}
            >
              Location access is disabled.
            </ThemedText>
            <ThemedText
              tone="textMuted"
              style={{ fontSize: 13 }}
            >
              You can still manually drop a pin on the map below, or open
              settings to enable permission.
            </ThemedText>
            <ThemedButton
              title="Open settings"
              variant="secondary"
              onPress={openSettings}
              style={{ marginTop: 4 }}
            />
          </View>
        ) : null}

        <ThemedText style={{ fontWeight: '600' }}>
          Or tap the map to choose your area
        </ThemedText>
        <View
          style={{ borderRadius: 20, overflow: 'hidden' }}
          pointerEvents={saving ? 'none' : 'auto'}
        >
          <TaskMap
            height={280}
            center={pin}
            markers={
              pin ? [{ ...pin, id: 'area', title: 'Your selected area' }] : []
            }
            onPick={(point) => {
              choice.current++;
              setSelected(point);
              setSource('manual');
              setSaveError('');
              setAcknowledged(false);
            }}
          />
        </View>

        {pin ? (
          <ThemedText
            accessibilityLabel="Selected area coordinates"
            tone="textMuted"
          >
            Selected area: {pin.latitude.toFixed(5)}, {pin.longitude.toFixed(5)}
          </ThemedText>
        ) : null}

        {error ? (
          <ThemedText
            accessibilityRole="alert"
            tone="danger"
          >
            {error}
          </ThemedText>
        ) : null}
        {saveError ? (
          <ThemedText
            accessibilityRole="alert"
            tone="danger"
          >
            {saveError}
          </ThemedText>
        ) : null}

        <ThemedText
          tone="textMuted"
          style={{ fontSize: 12, lineHeight: 18 }}
        >
          Your browsing area is saved to your account and on this device. You
          can change it anytime from the dashboard.
        </ThemedText>

        <LocationAcknowledgment
          checked={acknowledged}
          onChange={setAcknowledged}
          disabled={saving}
        />
        <ThemedButton
          title="Find nearby suyos"
          onPress={save}
          loading={saving}
          disabled={!pin || !isReady || !acknowledged}
        />

        {hasSavedLocation ? (
          <ThemedButton
            title="Cancel"
            variant="secondary"
            disabled={saving}
            onPress={() => router.replace('/dashboard')}
          />
        ) : (
          <ThemedButton
            title="Sign out"
            variant="secondary"
            disabled={saving || loading}
            onPress={async () => {
              if (lock.current) return;
              lock.current = true;
              setSaving(true);
              setSaveError('');
              try {
                await logout();
                router.replace('/');
              } catch {
                setSaveError('Could not sign out. Please try again.');
              } finally {
                lock.current = false;
                setSaving(false);
              }
            }}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 24,
    gap: 16,
    paddingBottom: 40,
    width: '100%',
    maxWidth: 600,
    alignSelf: 'center',
  },
  icon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eyebrow: { fontSize: 10, fontWeight: '700', letterSpacing: 1.5 },
  title: { fontSize: 30, fontWeight: '800', letterSpacing: -0.6 },
  body: { fontSize: 15, lineHeight: 23 },
  deniedBanner: { padding: 14, borderRadius: 12, borderWidth: 1, gap: 6 },
});
