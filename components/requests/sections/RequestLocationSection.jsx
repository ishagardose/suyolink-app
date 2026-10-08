import { Platform, View, Text, TextInput } from 'react-native';
import useRequestFormAppearance from '../hooks/useRequestFormAppearance';
import { Ionicons } from '@expo/vector-icons';
import LocationPicker from '../LocationPicker';
import React, { useEffect, useRef, useState } from 'react';
import PhilippineAreaPicker from '../PhilippineAreaPicker';
import { reverseTaskArea } from '../../../lib/reverseTaskArea';

export default function RequestLocationSection({
  fieldErrors,
  draft,
  setDraft,
  setFieldErrors,
  busy,
}) {
  const { styles, colors, resolveColor } = useRequestFormAppearance();
  const [lookingUp, setLookingUp] = useState(false);
  const autoArea = useRef('');

  useEffect(() => {
    if (!draft.coordinates || busy || Platform.OS === 'web') return;
    let active = true;
    setLookingUp(true);
    // Debounce pin adjustments and ignore results from older selections.
    const timer = setTimeout(async () => {
      let area = '';
      try {
        area = await reverseTaskArea(draft.coordinates);
      } catch {
        // The area picker and manual field remain available without geocoding.
      }
      if (!active) return;
      if (area) {
        const previousAutoArea = autoArea.current;
        autoArea.current = area;
        setDraft((previous) => {
          if (
            previous.publicLocation &&
            previous.publicLocation !== previousAutoArea
          )
            return previous;
          return { ...previous, publicLocation: area };
        });
        setFieldErrors((previous) => ({
          ...previous,
          publicLocation: undefined,
        }));
      }
      setLookingUp(false);
    }, 700);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [
    draft.coordinates?.latitude,
    draft.coordinates?.longitude,
    busy,
    setDraft,
    setFieldErrors,
  ]);

  const updatePublicArea = (publicLocation) => {
    autoArea.current = '';
    setDraft((previous) => ({ ...previous, publicLocation }));
    setFieldErrors((previous) => ({ ...previous, publicLocation: undefined }));
  };

  return (
    <View style={styles.card}>
      <View style={styles.cardHeaderRow}>
        <Ionicons
          name="location-outline"
          size={18}
          color={colors.link}
        />
        <Text style={styles.cardTitle}>Location & Map Pin</Text>
      </View>

      <Text style={styles.cardSubText}>
        Pin the pickup or drop-off first, then confirm the public area below.
        Only the accepted doer can see the exact pin, private directions and
        phone.
      </Text>
      <LocationPicker
        value={draft.coordinates}
        disabled={busy}
        onChange={(coordinates) => {
          setDraft((previous) => ({ ...previous, coordinates }));
          setFieldErrors((previous) => ({
            ...previous,
            coordinates: undefined,
          }));
        }}
      />
      {fieldErrors.coordinates ? (
        <Text style={styles.fieldErrorText}>{fieldErrors.coordinates}</Text>
      ) : null}
      {lookingUp ? (
        <Text style={styles.cardSubText}>Checking the area for this pin…</Text>
      ) : null}

      <View style={styles.fieldBlock}>
        <PhilippineAreaPicker
          disabled={busy}
          onSelect={updatePublicArea}
        />
        <Text style={styles.fieldLabel}>Public area / landmark *</Text>
        <TextInput
          accessibilityLabel="Public area"
          style={[
            styles.inputWithIcon,
            styles.textareaInput,
            { padding: 12, minHeight: 50 },
          ]}
          placeholder="Neighborhood or nearby landmark"
          placeholderTextColor={colors.muted}
          value={draft.publicLocation}
          editable={!busy}
          maxLength={250}
          onChangeText={updatePublicArea}
        />
        {fieldErrors.publicLocation ? (
          <Text style={styles.fieldErrorText}>
            {fieldErrors.publicLocation}
          </Text>
        ) : null}
        <Text style={styles.cardSubText}>
          Confirm the area matches your pin. Keep house numbers and personal
          details out of this public field.
        </Text>
      </View>
      <View style={styles.fieldBlock}>
        <View style={styles.fieldLabelRow}>
          <Text
            style={[
              styles.fieldLabel,
              fieldErrors.location && styles.fieldLabelError,
            ]}
          >
            Extra directions (private, optional)
          </Text>
          <Text style={styles.counterText}>{draft.location.length}/250</Text>
        </View>
        <View
          style={[
            styles.inputWithIcon,
            fieldErrors.location && styles.inputErrorBorder,
          ]}
        >
          <Ionicons
            name="location-sharp"
            size={18}
            color={fieldErrors.location ? colors.danger : colors.link}
            style={styles.leadingIcon}
          />
          <TextInput
            style={styles.textInputInner}
            placeholder="Unit, gate, or pickup instructions (optional)"
            placeholderTextColor={colors.muted}
            accessibilityLabel="Exact address"
            value={draft.location}
            onChangeText={(val) => {
              setDraft((p) => ({ ...p, location: val }));
              if (fieldErrors.location)
                setFieldErrors((p) => ({ ...p, location: undefined }));
            }}
            maxLength={250}
            editable={!busy}
          />
        </View>
        {fieldErrors.location && (
          <Text style={styles.fieldErrorText}>{fieldErrors.location}</Text>
        )}
        <Text style={styles.cardSubText}>
          Your map pin is the exact location. Add details only if they help the
          doer find you.
        </Text>
      </View>
    </View>
  );
}
