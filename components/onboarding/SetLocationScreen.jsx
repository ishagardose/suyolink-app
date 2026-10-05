import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
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
  const [selectedActionButton, setSelectedActionButton] = useState(null);
  const [hoveredBtn, setHoveredBtn] = useState(null);
  const lock = useRef(false);
  const choice = useRef(0);
  const pin = selected || (hasSavedLocation ? position : null);

  const save = async () => {
    const activePin = pin || position;
    if (!activePin) {
      setSaveError(
        'Please tap the map to choose your area or tap "Use my current location".'
      );
      return;
    }
    if (!acknowledged) {
      setAcknowledged(true);
    }
    if (lock.current) return;
    lock.current = true;
    setSaving(true);
    setSaveError('');
    try {
      await saveLocation(activePin, source);
      router.replace('/dashboard');
    } catch (err) {
      setSaveError(
        err?.message || 'Could not save your location. Please try again.'
      );
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
        <View style={styles.headerRow}>
          <View
            style={[
              styles.headerIconCircle,
              { backgroundColor: colors.surfaceAlt },
            ]}
          >
            <Ionicons
              name="location-outline"
              size={24}
              color={colors.link}
            />
          </View>
          <ThemedText
            accessibilityRole="header"
            style={styles.title}
          >
            Set your location
          </ThemedText>
        </View>

        <ThemedText
          tone="textMuted"
          style={styles.body}
        >
          Choose your area to continue to SuyoLink. Your saved location helps
          you find nearby suyos. You can use GPS or choose a map pin.
        </ThemedText>

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

        {/* Action Buttons Row: Sign out / Cancel (Left) & Use my current location (Right) */}
        <View style={styles.buttonRow}>
          {hasSavedLocation ? (
            <TouchableOpacity
              activeOpacity={0.75}
              accessibilityRole="button"
              accessibilityLabel="Cancel"
              disabled={saving}
              onMouseEnter={() => setHoveredBtn('cancel')}
              onMouseLeave={() => setHoveredBtn(null)}
              onPress={() => {
                setSelectedActionButton('cancel');
                router.replace('/dashboard');
              }}
              style={[
                styles.modernSecondaryBtn,
                (hoveredBtn === 'cancel' || selectedActionButton === 'cancel') &&
                  styles.modernSecondaryBtnHovered,
              ]}
            >
              <Ionicons
                name="close-circle-outline"
                size={17}
                color={
                  hoveredBtn === 'cancel' || selectedActionButton === 'cancel'
                    ? colors.link
                    : '#64748B'
                }
              />
              <ThemedText
                style={[
                  styles.modernBtnText,
                  (hoveredBtn === 'cancel' || selectedActionButton === 'cancel') &&
                    styles.modernBtnTextActive,
                ]}
              >
                Cancel
              </ThemedText>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              activeOpacity={0.75}
              accessibilityRole="button"
              accessibilityLabel="Sign out"
              disabled={saving || loading}
              onMouseEnter={() => setHoveredBtn('signout')}
              onMouseLeave={() => setHoveredBtn(null)}
              onPress={async () => {
                setSelectedActionButton('signout');
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
              style={[
                styles.modernSecondaryBtn,
                (hoveredBtn === 'signout' || selectedActionButton === 'signout') &&
                  styles.modernSignoutBtnHovered,
              ]}
            >
              <Ionicons
                name="log-out-outline"
                size={17}
                color={
                  hoveredBtn === 'signout' || selectedActionButton === 'signout'
                    ? '#DC2626'
                    : '#64748B'
                }
              />
              <ThemedText
                style={[
                  styles.modernBtnText,
                  (hoveredBtn === 'signout' || selectedActionButton === 'signout') &&
                    styles.modernSignoutTextActive,
                ]}
              >
                Sign out
              </ThemedText>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            activeOpacity={0.75}
            accessibilityRole="button"
            accessibilityLabel="Use my current location"
            disabled={saving || !isReady}
            onMouseEnter={() => setHoveredBtn('location')}
            onMouseLeave={() => setHoveredBtn(null)}
            onPress={async () => {
              setSelectedActionButton('location');
              const request = ++choice.current;
              const next = await locate();
              if (next && request === choice.current) {
                setSelected(next);
                setSource('device');
                setAcknowledged(false);
              }
            }}
            style={[
              styles.modernSecondaryBtn,
              (hoveredBtn === 'location' || selectedActionButton === 'location') &&
                styles.modernLocationBtnHovered,
            ]}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#1E4D2B" />
            ) : (
              <>
                <Ionicons
                  name="navigate-circle-outline"
                  size={18}
                  color={
                    hoveredBtn === 'location' || selectedActionButton === 'location'
                      ? '#1E4D2B'
                      : '#335C44'
                  }
                />
                <ThemedText
                  style={[
                    styles.modernBtnText,
                    (hoveredBtn === 'location' || selectedActionButton === 'location') &&
                      styles.modernLocationTextActive,
                  ]}
                  numberOfLines={1}
                >
                  Use my current location
                </ThemedText>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Main Action Button for both Doers and Requesters */}
        <TouchableOpacity
          activeOpacity={0.82}
          accessibilityRole="button"
          accessibilityLabel="Explore & Request Suyos"
          disabled={saving}
          onMouseEnter={() => setHoveredBtn('primary')}
          onMouseLeave={() => setHoveredBtn(null)}
          onPress={save}
          style={[
            styles.modernPrimaryBtn,
            hoveredBtn === 'primary' && styles.modernPrimaryBtnHovered,
            saving && { opacity: 0.7 },
          ]}
        >
          {saving ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <View style={styles.primaryBtnInner}>
              <ThemedText style={styles.modernPrimaryBtnText}>
                Explore & Request Suyos
              </ThemedText>
              <Ionicons name="arrow-forward" size={17} color="#FFFFFF" />
            </View>
          )}
        </TouchableOpacity>
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.6,
    flexShrink: 1,
  },
  body: {
    fontSize: 15,
    lineHeight: 23,
  },
  deniedBanner: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'stretch',
    marginTop: 4,
  },
  modernSecondaryBtn: {
    flex: 1,
    minHeight: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: '#F8FAF9',
    borderWidth: 1.5,
    borderColor: '#E2ECE6',
    cursor: 'pointer',
  },
  modernSecondaryBtnHovered: {
    backgroundColor: '#F1F6F3',
    borderColor: '#CBDED4',
    transform: [{ translateY: -1 }],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  modernLocationBtnHovered: {
    backgroundColor: '#EAF4EF',
    borderColor: '#1E4D2B',
    transform: [{ translateY: -1 }],
    shadowColor: '#1E4D2B',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  modernLocationTextActive: {
    color: '#1E4D2B',
    fontWeight: '800',
  },
  modernSignoutBtnHovered: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FCA5A5',
    transform: [{ translateY: -1 }],
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 5,
    elevation: 3,
  },
  modernSignoutTextActive: {
    color: '#DC2626',
    fontWeight: '800',
  },
  modernBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#334155',
    textAlign: 'center',
  },
  modernBtnTextActive: {
    color: '#1E4D2B',
    fontWeight: '800',
  },
  modernPrimaryBtn: {
    minHeight: 52,
    backgroundColor: '#1E4D2B',
    borderRadius: 14,
    paddingHorizontal: 20,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    shadowColor: '#1E4D2B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 8,
    elevation: 4,
  },
  modernPrimaryBtnHovered: {
    backgroundColor: '#163E22',
    transform: [{ translateY: -1 }, { scale: 1.01 }],
    shadowOpacity: 0.32,
    shadowRadius: 10,
    elevation: 6,
  },
  primaryBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  modernPrimaryBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
});
