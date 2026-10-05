import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeContext';
import ThemedText from '../themed/ThemedText';
import styles from './account.styles';
import ThemedButton from '../themed/ThemedButton';
import ThemedTextInput from '../themed/ThemedTextInput';

export default function ProfileDetails({
  displayName,
  email,
  isProfileReady,
  editing,
  draft,
  setDraft,
  busy,
  onEdit,
  onCancel,
  onSave,
}) {
  const { colors } = useTheme();
  const card = [
    styles.card,
    { backgroundColor: colors.card, borderColor: colors.border },
  ];

  return (
    <View style={card}>
      <View style={styles.sectionHeader}>
        <ThemedText style={styles.sectionTitle}>Personal details</ThemedText>
        {!editing ? (
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Edit Profile"
            disabled={!isProfileReady}
            onPress={onEdit}
            style={[
              styles.edit,
              {
                backgroundColor: colors.surfaceAlt,
                opacity: isProfileReady ? 1 : 0.5,
              },
            ]}
          >
            <Ionicons
              name="create-outline"
              size={15}
              color={colors.link}
            />
            <ThemedText
              style={{
                color: colors.link,
                fontSize: 12,
                fontWeight: '700',
              }}
            >
              Edit
            </ThemedText>
          </TouchableOpacity>
        ) : null}
      </View>
      <ThemedText
        tone="textMuted"
        style={styles.description}
      >
        Keep your community profile up to date.
      </ThemedText>
      {editing ? (
        <View style={{ gap: 12, marginTop: 18 }}>
          <ThemedText
            tone="textMuted"
            style={styles.label}
          >
            Full name
          </ThemedText>
          <ThemedTextInput
            accessibilityLabel="Name"
            placeholder="Enter full name"
            value={draft}
            onChangeText={setDraft}
            maxLength={100}
            editable={!busy}
            autoFocus
            style={[
              styles.input,
              {
                backgroundColor: colors.input,
                borderColor: colors.border,
              },
            ]}
          />
          <View style={styles.inline}>
            <ThemedButton
              title="Cancel"
              variant="secondary"
              disabled={busy}
              onPress={onCancel}
              style={{ flex: 1 }}
            />
            <ThemedButton
              title="Save Changes"
              loading={busy}
              disabled={!draft.trim()}
              onPress={onSave}
              style={{ flex: 1 }}
            />
          </View>
        </View>
      ) : (
        <View style={styles.detailRow}>
          <Ionicons
            name="person-outline"
            size={19}
            color={colors.muted}
          />
          <View style={{ flex: 1, gap: 5 }}>
            <ThemedText
              tone="textMuted"
              style={styles.label}
            >
              Full name
            </ThemedText>
            <ThemedText style={styles.detailValue}>{displayName}</ThemedText>
          </View>
        </View>
      )}
      <View style={styles.detailRow}>
        <Ionicons
          name="mail-outline"
          size={19}
          color={colors.muted}
        />
        <View style={{ flex: 1, gap: 5 }}>
          <ThemedText
            tone="textMuted"
            style={styles.label}
          >
            Email address
          </ThemedText>
          <ThemedText style={styles.detailValue}>{email}</ThemedText>
        </View>
      </View>
    </View>
  );
}
