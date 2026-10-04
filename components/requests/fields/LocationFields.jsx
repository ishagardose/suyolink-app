import { useTheme } from '../../../theme/ThemeContext';
import { PLACEHOLDER_COLOR } from '../requestFormConfig';
import { View, Text, TextInput } from 'react-native';
import useRequestFormStyles from '../requestForm.styles';
import { Ionicons } from '@expo/vector-icons';
import LocationPicker from '../LocationPicker';
import React from 'react';

export default function LocationFields({
  fieldErrors,
  draft,
  setDraft,
  setFieldErrors,
  busy,
}) {
  const styles = useRequestFormStyles();
  const { colors } = useTheme();
  return (
    <View style={styles.card}>
      <View style={styles.cardHeaderRow}>
        <Ionicons name="location-outline" size={18} color={colors.link} />
        <Text style={styles.cardTitle}>Location & Map Pin</Text>
      </View>

      <View style={styles.fieldBlock}>
        <Text style={styles.fieldLabel}>Public area / landmark *</Text>
        <TextInput accessibilityLabel="Public area" style={[styles.inputWithIcon, styles.textareaInput, { padding: 12, minHeight: 50 }]}
          placeholder="Neighborhood or nearby landmark" placeholderTextColor={colors.muted}
          value={draft.publicLocation} editable={!busy} maxLength={250}
          onChangeText={publicLocation => setDraft(p => ({ ...p, publicLocation }))} />
        {fieldErrors.publicLocation ? <Text style={styles.fieldErrorText}>{fieldErrors.publicLocation}</Text> : null}
        <Text style={styles.cardSubText}>Only the accepted doer can see your exact address and phone. Keep personal details out of public remarks.</Text>
      </View>
      <View style={styles.fieldBlock}>
        <View style={styles.fieldLabelRow}>
          <Text
            style={[
              styles.fieldLabel,
              fieldErrors.location && styles.fieldLabelError,
            ]}
          >
            Exact address (private) *
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
            placeholder="Address, landmark, or drop-off..."
            placeholderTextColor={colors.muted}
            accessibilityLabel="Exact address" value={draft.location}
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
      </View>

<Text style={styles.fieldErrorText}>{fieldErrors.coordinates}</Text>
      <LocationPicker
        value={draft.coordinates}
        disabled={busy}
        onChange={(coordinates) => {
          setDraft((previous) => ({ ...previous, coordinates }));
        }}
      />
    </View>
  );
}
