import React from 'react';
import { styles } from '../RequestForm.styles';
import { View, Text, TouchableOpacity, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function RequestRewardSection({
  PLACEHOLDER_COLOR,
  REWARD_PRESETS,
  busy,
  draft,
  fieldErrors,
  setDraft,
  setFieldErrors,
}) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeaderRow}>
        <Ionicons
          name="cash-outline"
          size={18}
          color="#1E4D2B"
        />
        <Text style={styles.cardTitle}>Reward Offer (PHP)</Text>
      </View>

      <View style={styles.fieldBlock}>
        <Text
          style={[
            styles.fieldLabel,
            fieldErrors.offerAmount && styles.fieldLabelError,
          ]}
        >
          Offer Amount *
        </Text>
        <View
          style={[
            styles.currencyInputRow,
            fieldErrors.offerAmount && styles.inputErrorBorder,
          ]}
        >
          <View
            style={[
              styles.currencySymbolBadge,
              fieldErrors.offerAmount && styles.currencySymbolBadgeError,
            ]}
          >
            <Text
              style={[
                styles.currencySymbolText,
                fieldErrors.offerAmount && { color: '#DC2626' },
              ]}
            >
              ₱
            </Text>
          </View>
          <TextInput
            style={styles.currencyInput}
            placeholder="150.00"
            placeholderTextColor={PLACEHOLDER_COLOR}
            value={draft.offerAmount}
            onChangeText={(val) => {
              setDraft((p) => ({
                ...p,
                offerAmount: val.replace(/[^0-9.]/g, ''),
              }));
              if (fieldErrors.offerAmount)
                setFieldErrors((p) => ({ ...p, offerAmount: undefined }));
            }}
            keyboardType="decimal-pad"
            maxLength={10}
            editable={!busy}
          />
        </View>
        {fieldErrors.offerAmount && (
          <Text style={styles.fieldErrorText}>{fieldErrors.offerAmount}</Text>
        )}
      </View>

      {/* Reward Presets */}
      <View style={styles.presetsRow}>
        <Text style={styles.presetsLabel}>Presets:</Text>
        {REWARD_PRESETS.map((amt) => (
          <TouchableOpacity
            key={amt}
            style={[
              styles.presetPill,
              draft.offerAmount === amt && styles.presetPillActive,
            ]}
            onPress={() => {
              setDraft((p) => ({ ...p, offerAmount: amt }));
              if (fieldErrors.offerAmount)
                setFieldErrors((p) => ({ ...p, offerAmount: undefined }));
            }}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.presetPillText,
                draft.offerAmount === amt && styles.presetPillTextActive,
              ]}
            >
              ₱{parseInt(amt, 10)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}
