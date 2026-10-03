import React, { useState } from 'react';
import { StyleSheet, View, Linking, TouchableOpacity } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeContext';
import ThemedText from '../themed/ThemedText';
import ThemedButton from '../themed/ThemedButton';

export default function PrivateTaskDetails({ details }) {
  const { colors } = useTheme();
  const [copied, setCopied] = useState(false);

  // Private fields only exist if backend returned them
  const hasExactAddress = details?.exactAddress !== null && details?.exactAddress !== undefined;
  const hasContactPhone = details?.contactPhone !== null && details?.contactPhone !== undefined;

  if (!hasExactAddress && !hasContactPhone) {
    return null;
  }

  const callPhone = () => {
    if (details.contactPhone) {
      Linking.openURL(`tel:${details.contactPhone}`);
    }
  };

  const copyPhone = async () => {
    if (details.contactPhone) {
      await Clipboard.setStringAsync(details.contactPhone);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
      <View style={styles.headerRow}>
        <Ionicons name="lock-open-outline" size={16} color={colors.primary} />
        <ThemedText style={[styles.headerTitle, { color: colors.primary }]}>
          Private Task Information
        </ThemedText>
      </View>

      {hasExactAddress ? (
        <View style={styles.row}>
          <ThemedText style={styles.label}>Exact Address:</ThemedText>
          <ThemedText style={styles.value}>{details.exactAddress}</ThemedText>
        </View>
      ) : null}

      {hasContactPhone ? (
        <View style={styles.phoneSection}>
          <View style={styles.row}>
            <ThemedText style={styles.label}>Contact Phone:</ThemedText>
            <ThemedText style={styles.value}>{details.contactPhone}</ThemedText>
          </View>
          <View style={styles.actionButtons}>
            <ThemedButton
              title="Call"
              variant="secondary"
              onPress={callPhone}
              style={styles.actionBtn}
            />
            <ThemedButton
              title={copied ? "Copied!" : "Copy"}
              variant="secondary"
              onPress={copyPhone}
              style={styles.actionBtn}
            />
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerTitle: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  row: {
    gap: 4,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
  },
  value: {
    fontSize: 15,
  },
  phoneSection: {
    gap: 8,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  actionBtn: {
    flex: 1,
    minHeight: 38,
    paddingVertical: 6,
  },
});
