import useLocationPickerStyles from './LocationPicker.styles';
import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import TaskMap from '../maps/TaskMap';
import { useDeviceLocation } from '../../context/LocationContext';
import { useTheme } from '../../theme/ThemeContext';

export default function LocationPicker({ value, onChange, disabled }) {
  const styles = useLocationPickerStyles();
  const { position, locate, loading, error } = useDeviceLocation();
  const { colors } = useTheme();

  const handleUseCurrentLocation = async () => {
    const next = await locate();
    if (next) {
      onChange(next);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={styles.headerTitleBlock}>
          <Ionicons
            name="map-outline"
            size={16}
            color={colors.link}
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
              color={colors.link}
            />
          ) : (
            <>
              <Ionicons
                name="locate"
                size={14}
                color={colors.link}
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
            onPick={disabled ? undefined : onChange}
            markers={
              value ? [{ ...value, id: 'task', title: 'Task location' }] : []
            }
            height={220}
          />
        </View>

        {/* Pin Status Badge */}
        <View
          style={[
            styles.pinStatusFooter,
            { backgroundColor: colors.surface, borderTopColor: colors.border },
          ]}
        >
          <View style={styles.pinIndicator}>
            <View
              style={[
                styles.pinDot,
                { backgroundColor: value ? colors.success : colors.border },
              ]}
            />
            <Text style={[styles.pinStatusText, { color: colors.textMuted }]}>
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
                color={colors.link}
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
            color={colors.danger}
          />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}
    </View>
  );
}
