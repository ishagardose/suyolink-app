import React from 'react';
import { styles } from '../RequestForm.styles';
import { View, Text, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function RequestContactSection({
  PLACEHOLDER_COLOR,
  busy,
  contactInputRef,
  draft,
  fieldErrors,
  setDraft,
  setFieldErrors,
}) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeaderRow}>
        <Ionicons
          name="call-outline"
          size={18}
          color="#1E4D2B"
        />
        <Text style={styles.cardTitle}>Contact Info & Extra Instructions</Text>
      </View>

      {/* Contact Phone (Mandatory) */}
      <View style={styles.fieldBlock}>
        <View style={styles.fieldLabelRow}>
          <Text
            style={[
              styles.fieldLabel,
              fieldErrors.contactPhone && styles.fieldLabelError,
            ]}
          >
            Requester Contact Phone *
          </Text>
          <Text style={styles.requiredBadge}>Required</Text>
        </View>
        <View
          style={[
            styles.inputWithIcon,
            fieldErrors.contactPhone && styles.inputErrorBorder,
          ]}
        >
          <Ionicons
            name="call"
            size={18}
            color={fieldErrors.contactPhone ? '#DC2626' : '#1E4D2B'}
            style={styles.leadingIcon}
          />
          <TextInput
            ref={contactInputRef}
            style={styles.textInputInner}
            placeholder="e.g. 0917 842 1983"
            placeholderTextColor={PLACEHOLDER_COLOR}
            value={draft.contactPhone}
            onChangeText={(val) => {
              setDraft((p) => ({ ...p, contactPhone: val }));
              if (fieldErrors.contactPhone)
                setFieldErrors((p) => ({
                  ...p,
                  contactPhone: undefined,
                }));
            }}
            keyboardType="phone-pad"
            maxLength={20}
            editable={!busy}
          />
        </View>
        {fieldErrors.contactPhone && (
          <Text style={styles.fieldErrorText}>{fieldErrors.contactPhone}</Text>
        )}
      </View>

      {/* Extra Notes */}
      <View style={styles.fieldBlock}>
        <View style={styles.fieldLabelRow}>
          <Text style={styles.fieldLabel}>Additional Notes (Optional)</Text>
          <Text style={styles.counterText}>{draft.notes.length}/1000</Text>
        </View>
        <View style={styles.textareaWrapper}>
          <TextInput
            style={styles.textareaInput}
            placeholder="Call upon arrival at lobby guard, receipt required..."
            placeholderTextColor={PLACEHOLDER_COLOR}
            value={draft.notes}
            onChangeText={(val) => setDraft((p) => ({ ...p, notes: val }))}
            multiline
            numberOfLines={3}
            maxLength={1000}
            textAlignVertical="top"
            editable={!busy}
          />
        </View>
      </View>
    </View>
  );
}
