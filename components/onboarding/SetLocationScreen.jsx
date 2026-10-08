import { useMemo } from 'react';
import { themeStyles, resolvePaletteColor } from '../../theme/paletteAdapter';
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
  const { colors, isDark } = useTheme();
  const styles = useMemo(
    () => StyleSheet.create(themeStyles(definitions, colors, isDark)),
    [colors, isDark],
  );
  const resolveColor = (value, property = 'color') =>
    resolvePaletteColor(value, property, colors, isDark);
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
    const activePin = pin || position;
    if (!activePin) {
      setSaveError(
        'Please tap the map to choose your area or tap "Use my current location".',
      );
      return;
    }
    if (!acknowledged) {
      setSaveError('Please acknowledge the location notice to continue.');
      return;
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
        err?.message || 'Could not save your location. Please try again.',
      );
    } finally {
      lock.current = false;
      setSaving(false);
    }
  };

  const handleLocatePress = async () => {
    const request = ++choice.current;
    const next = await locate();
    if (next && request === choice.current) {
      setSelected(next);
      setSource('device');
      setSaveError('');
    }
  };

  const isGpsActive = source === 'device' && !!selected;
  const isSubmitDisabled = saving || !pin || !acknowledged;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header Section */}
        <View style={styles.headerBlock}>
          <View
            style={[
              styles.headerIconCircle,
              { backgroundColor: resolveColor('#EAF4EF', 'backgroundColor') },
            ]}
          >
            <Ionicons
              name="location-sharp"
              size={24}
              color={resolveColor('#1E4D2B')}
            />
          </View>
          <View style={styles.headerTextBlock}>
            <ThemedText
              accessibilityRole="header"
              style={styles.title}
            >
              Share your location
            </ThemedText>
            <ThemedText
              tone="textMuted"
              style={styles.subtitle}
            >
              Set your area to connect with nearby community suyos and couriers.
            </ThemedText>
          </View>
        </View>

        {/* Permission Denied Banner */}
        {permissionState === 'denied' ||
        (error && error.includes('Location permission is off')) ? (
          <View
            style={[
              styles.deniedBanner,
              {
                borderColor: resolveColor('#FCA5A5', 'borderColor'),
                backgroundColor: resolveColor('#FEF2F2', 'backgroundColor'),
              },
            ]}
          >
            <View
              style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}
            >
              <Ionicons
                name="warning-outline"
                size={18}
                color={resolveColor('#DC2626')}
              />
              <ThemedText
                style={{
                  fontWeight: '700',
                  color: resolveColor('#991B1B', 'color'),
                  fontSize: 14,
                }}
              >
                Location access is disabled
              </ThemedText>
            </View>
            <ThemedText
              style={{
                fontSize: 13,
                color: resolveColor('#7F1D1D', 'color'),
                lineHeight: 18,
              }}
            >
              You can still manually pick an area on the map below, or open
              settings to enable GPS.
            </ThemedText>
            <ThemedButton
              title="Open settings"
              variant="secondary"
              onPress={openSettings}
              style={{ marginTop: 4 }}
            />
          </View>
        ) : null}

        {/* GPS Quick Action Card */}
        <TouchableOpacity
          activeOpacity={0.82}
          accessibilityRole="button"
          accessibilityLabel="Use my current location"
          disabled={saving || !isReady || loading}
          onPress={handleLocatePress}
          style={[styles.gpsCard, isGpsActive && styles.gpsCardActive]}
        >
          <View
            style={[
              styles.gpsIconCircle,
              isGpsActive && styles.gpsIconCircleActive,
            ]}
          >
            {loading ? (
              <ActivityIndicator
                size="small"
                color={resolveColor('#1E4D2B')}
              />
            ) : (
              <Ionicons
                name="navigate"
                size={20}
                color={
                  isGpsActive
                    ? resolveColor('#FFFFFF')
                    : resolveColor('#1E4D2B')
                }
              />
            )}
          </View>
          <View style={styles.gpsTextContainer}>
            <ThemedText
              style={[styles.gpsTitle, isGpsActive && styles.gpsTitleActive]}
            >
              Use my current location
            </ThemedText>
            <ThemedText
              tone="textMuted"
              style={styles.gpsSubtitle}
            >
              {loading
                ? 'Detecting GPS coordinates...'
                : isGpsActive
                  ? 'GPS location active'
                  : 'Automatically detect device location'}
            </ThemedText>
          </View>
          {isGpsActive && !loading ? (
            <Ionicons
              name="checkmark-circle"
              size={22}
              color={resolveColor('#1E4D2B')}
            />
          ) : (
            <Ionicons
              name="chevron-forward"
              size={18}
              color={resolveColor('#94A3B8')}
            />
          )}
        </TouchableOpacity>

        {/* Map Section */}
        <View style={styles.sectionHeaderRow}>
          <ThemedText style={styles.sectionHeaderTitle}>
            Or pick an area on the map
          </ThemedText>
          <ThemedText
            tone="textMuted"
            style={styles.sectionHeaderHint}
          >
            Tap map to move pin
          </ThemedText>
        </View>

        <View
          style={styles.mapCard}
          pointerEvents={saving ? 'none' : 'auto'}
        >
          <TaskMap
            height={240}
            center={pin}
            markers={
              pin ? [{ ...pin, id: 'area', title: 'Your selected area' }] : []
            }
            onPick={(point) => {
              choice.current++;
              setSelected(point);
              setSource('manual');
              setSaveError('');
            }}
          />
        </View>

        {/* Selected Coordinates Chip */}
        {pin ? (
          <View style={styles.coordsBadgeContainer}>
            <Ionicons
              name="location"
              size={16}
              color={resolveColor('#1E4D2B')}
            />
            <ThemedText
              accessibilityLabel="Selected area coordinates"
              style={styles.coordsText}
            >
              Selected area: {pin.latitude.toFixed(5)},{' '}
              {pin.longitude.toFixed(5)}
            </ThemedText>
          </View>
        ) : null}

        {/* Error Banners */}
        {error ? (
          <View style={styles.errorBanner}>
            <Ionicons
              name="alert-circle-outline"
              size={16}
              color={resolveColor('#DC2626')}
            />
            <ThemedText
              accessibilityRole="alert"
              style={styles.errorText}
            >
              {error}
            </ThemedText>
          </View>
        ) : null}

        {saveError ? (
          <View style={styles.errorBanner}>
            <Ionicons
              name="alert-circle-outline"
              size={16}
              color={resolveColor('#DC2626')}
            />
            <ThemedText
              accessibilityRole="alert"
              style={styles.errorText}
            >
              {saveError}
            </ThemedText>
          </View>
        ) : null}

        {/* Acknowledgment & Consent Box */}
        <View style={styles.acknowledgmentWrapper}>
          <LocationAcknowledgment
            checked={acknowledged}
            onChange={(val) => {
              setAcknowledged(val);
              if (saveError) setSaveError('');
            }}
            disabled={saving}
          />
        </View>

        {/* Main CTA: Find nearby suyos */}
        <TouchableOpacity
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="Find nearby suyos"
          disabled={isSubmitDisabled}
          onPress={save}
          style={[
            styles.primarySubmitBtn,
            isSubmitDisabled && styles.primaryBtnDisabled,
          ]}
        >
          {saving ? (
            <ActivityIndicator color={resolveColor('#FFFFFF')} />
          ) : (
            <View style={styles.primaryBtnInner}>
              <ThemedText style={styles.primaryBtnText}>
                Find nearby suyos
              </ThemedText>
              <Ionicons
                name="arrow-forward"
                size={18}
                color={resolveColor('#FFFFFF')}
              />
            </View>
          )}
        </TouchableOpacity>

        {/* Cancel / Sign Out Escape Link */}
        <View style={styles.footerRow}>
          {hasSavedLocation ? (
            <TouchableOpacity
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Cancel"
              disabled={saving}
              onPress={() => router.replace('/dashboard')}
              style={styles.escapeBtn}
            >
              <ThemedText style={styles.escapeBtnText}>
                Cancel and return to dashboard
              </ThemedText>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Sign out"
              disabled={saving || loading}
              onPress={async () => {
                if (lock.current) return;
                lock.current = true;
                setSaving(true);
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
              style={styles.escapeBtn}
            >
              <Ionicons
                name="log-out-outline"
                size={16}
                color={resolveColor('#64748B')}
              />
              <ThemedText style={styles.escapeBtnText}>Sign out</ThemedText>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const definitions = {
  content: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
    gap: 14,
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
  },
  headerBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 4,
  },
  headerIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#D4E8DC',
  },
  headerTextBlock: {
    flex: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#163523',
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: 13.5,
    lineHeight: 19,
    marginTop: 2,
  },
  deniedBanner: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 6,
  },
  gpsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: '#F8FAF9',
    borderWidth: 1.5,
    borderColor: '#E2ECE6',
    gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  gpsCardActive: {
    backgroundColor: '#EAF4EF',
    borderColor: '#1E4D2B',
  },
  gpsIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#E2EFE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gpsIconCircleActive: {
    backgroundColor: '#1E4D2B',
  },
  gpsTextContainer: {
    flex: 1,
  },
  gpsTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
  },
  gpsTitleActive: {
    color: '#1E4D2B',
    fontWeight: '800',
  },
  gpsSubtitle: {
    fontSize: 12,
    marginTop: 1,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
  },
  sectionHeaderTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#334155',
  },
  sectionHeaderHint: {
    fontSize: 12,
  },
  mapCard: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: '#E2ECE6',
  },
  coordsBadgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#EAF4EF',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#D4E8DC',
  },
  coordsText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#1E4D2B',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 12,
    padding: 10,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 12.5,
    fontWeight: '600',
    flex: 1,
  },
  acknowledgmentWrapper: {
    backgroundColor: '#F8FAF9',
    borderRadius: 14,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#E2ECE6',
  },
  primarySubmitBtn: {
    minHeight: 52,
    backgroundColor: '#1E4D2B',
    borderRadius: 14,
    paddingHorizontal: 20,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1E4D2B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
    marginTop: 4,
  },
  primaryBtnDisabled: {
    opacity: 0.55,
    shadowOpacity: 0.05,
    elevation: 0,
  },
  primaryBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryBtnText: {
    fontSize: 15.5,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  footerRow: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  escapeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  escapeBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
};
