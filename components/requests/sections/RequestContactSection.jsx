import { View, Text, TextInput } from 'react-native';
import useRequestFormAppearance from '../hooks/useRequestFormAppearance';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';

export default function RequestContactSection({
  fieldErrors,
  contactInputRef,
  draft,
  setDraft,
  setFieldErrors,
  busy,
}) {
  const { styles, colors, resolveColor } = useRequestFormAppearance();
  return (
    <View style={styles.card}>
      <View style={styles.cardHeaderRow}>
        <Ionicons
          name="call-outline"
          size={18}
          color={colors.link}
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
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
              marginRight: 10,
              paddingRight: 10,
              borderRightWidth: 1,
              borderRightColor: colors.border,
            }}
          >
            <PhilippineFlag />
            <Text
              style={{ color: colors.text, fontWeight: '700', fontSize: 14 }}
            >
              +63
            </Text>
          </View>
          <TextInput
            ref={contactInputRef}
            style={styles.textInputInner}
            placeholder="9178421983"
            placeholderTextColor={colors.muted}
            accessibilityLabel="Contact phone"
            accessibilityHint="Enter 10 digits after the Philippine country code +63, without the leading zero."
            value={draft.contactPhone}
            onChangeText={(val) => {
              const digits = val.replace(/\D/g, '').slice(0, 10);
              setDraft((p) => ({ ...p, contactPhone: digits }));
              if (fieldErrors.contactPhone)
                setFieldErrors((p) => ({ ...p, contactPhone: undefined }));
            }}
            keyboardType="phone-pad"
            inputMode="numeric"
            maxLength={10}
            editable={!busy}
          />
        </View>
        <Text style={styles.cardSubText}>
          Enter 10 digits without the leading 0.
        </Text>
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
            placeholderTextColor={colors.muted}
            accessibilityLabel="Remarks"
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

function PhilippineFlag() {
  return (
    <View
      accessible
      accessibilityLabel="Philippines"
      style={{ width: 26, height: 18, overflow: 'hidden', borderRadius: 2 }}
    >
      <View style={{ height: 9, backgroundColor: '#0038A8' }} />
      <View style={{ height: 9, backgroundColor: '#CE1126' }} />
      <View
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          borderLeftWidth: 15,
          borderTopWidth: 9,
          borderBottomWidth: 9,
          borderLeftColor: '#FFFFFF',
          borderTopColor: 'transparent',
          borderBottomColor: 'transparent',
        }}
      />
      <Text
        style={{
          position: 'absolute',
          left: 3,
          top: 3,
          fontSize: 9,
          lineHeight: 12,
          color: '#FCD116',
        }}
      >
        ☀
      </Text>
      {[
        [0, 0],
        [0, 11],
        [10, 5],
      ].map(([left, top]) => (
        <Text
          key={`${left}-${top}`}
          style={{
            position: 'absolute',
            left,
            top,
            fontSize: 5,
            lineHeight: 7,
            color: '#FCD116',
          }}
        >
          ★
        </Text>
      ))}
    </View>
  );
}
