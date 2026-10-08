import { useMemo } from 'react';
import { themeStyles, resolvePaletteColor } from '../../theme/paletteAdapter';
import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import TaskMap from '../maps/TaskMap';
import { useDeviceLocation } from '../../context/LocationContext';
import { useTheme } from '../../theme/ThemeContext';

export default function LocationPicker({ value, onChange, disabled }) {
  const { position, locate, loading, error } = useDeviceLocation();
  const { colors, isDark } = useTheme();
  const choice = useRef(0);
  const latest = useRef({ onChange, disabled });
  latest.current = { onChange, disabled };
  useEffect(
    () => () => {
      choice.current++;
    },
    [],
  );
  const styles = useMemo(
    () => StyleSheet.create(themeStyles(definitions, colors, isDark)),
    [colors, isDark],
  );
  const resolveColor = (value, property = 'color') =>
    resolvePaletteColor(value, property, colors, isDark);

  const handleUseCurrentLocation = async () => {
    const request = ++choice.current;
    const next = await locate();
    if (next && request === choice.current && !latest.current.disabled) {
      latest.current.onChange(next);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={styles.headerTitleBlock}>
          <Ionicons
            name="map-outline"
            size={16}
            color={resolveColor('#1E4D2B')}
          />
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Task Location Pin
          </Text>
        </View>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Use my location for task pin"
          style={[styles.locateButton, disabled && styles.disabledButton]}
          onPress={handleUseCurrentLocation}
          disabled={disabled || loading}
          activeOpacity={0.75}
        >
          {loading ? (
            <ActivityIndicator
              size="small"
              color={resolveColor('#1E4D2B')}
            />
          ) : (
            <>
              <Ionicons
                name="locate"
                size={14}
                color={resolveColor('#1E4D2B')}
              />
              <Text style={styles.locateButtonText}>My Location</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      <Text style={[styles.helperText, { color: colors.textMuted }]}>
        Tap anywhere on the map to place or adjust the exact pickup / drop-off
        pin.
      </Text>

      {/* Map Viewport Card */}
      <View style={[styles.mapCard, { borderColor: colors.border }]}>
        <View
          pointerEvents={disabled ? 'none' : 'auto'}
          style={styles.mapInner}
        >
          <TaskMap
            center={value || position}
            onPick={
              disabled
                ? undefined
                : (point) => {
                    choice.current++;
                    onChange(point);
                  }
            }
            markers={
              value ? [{ ...value, id: 'task', title: 'Task location' }] : []
            }
            height={220}
          />
        </View>

        {/* Pin Status Badge */}
        <View style={styles.pinStatusFooter}>
          <View style={styles.pinIndicator}>
            <View
              style={[
                styles.pinDot,
                { backgroundColor: value ? colors.success : colors.border },
              ]}
            />
            <Text style={styles.pinStatusText}>
              {value
                ? `Pin: ${value.latitude.toFixed(4)}, ${value.longitude.toFixed(4)}`
                : 'No pin chosen (tap map to place)'}
            </Text>
          </View>
          {value && (
            <View style={styles.verifiedPinPill}>
              <Ionicons
                name="checkmark-circle"
                size={12}
                color={resolveColor('#1E4D2B')}
              />
              <Text style={styles.verifiedPinText}>Pin Set</Text>
            </View>
          )}
        </View>
      </View>

      {error ? (
        <View style={styles.errorBanner}>
          <Ionicons
            name="alert-circle"
            size={14}
            color={resolveColor('#DC2626')}
          />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}
    </View>
  );
}

const definitions = {
  container: {
    gap: 8,
    marginTop: 4,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitleBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  locateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#EBF5EF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#D4E8DC',
  },
  disabledButton: {
    opacity: 0.6,
  },
  locateButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E4D2B',
  },
  helperText: {
    fontSize: 12,
    lineHeight: 16,
  },
  mapCard: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1.2,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  mapInner: {
    height: 220,
    width: '100%',
  },
  pinStatusFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#FAFDFB',
    borderTopWidth: 1,
    borderTopColor: '#EDF5F0',
  },
  pinIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  pinDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  pinStatusText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#4B6355',
  },
  verifiedPinPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#EBF5EF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  verifiedPinText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1E4D2B',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEF2F2',
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  errorText: {
    fontSize: 12,
    color: '#DC2626',
    fontWeight: '500',
  },
};
