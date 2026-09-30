import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeContext';
import ThemedText from '../themed/ThemedText';

function formatCentavos(centavos, currency = 'PHP') {
  const amount = (centavos / 100).toFixed(2);
  return currency === 'PHP' ? `₱${amount}` : `${currency} ${amount}`;
}

function formatDate(isoString) {
  if (!isoString) return '';
  const d = new Date(isoString);
  return d.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function TransactionCard({ transaction }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  if (!transaction) return null;

  const isProvider = transaction.role === 'provider';
  const label = isProvider ? 'Earned' : 'Spent';
  const amountColor = isProvider ? colors.success : colors.danger;
  const prefix = isProvider ? '+' : '−';
  const iconName = isProvider ? 'arrow-down-circle' : 'arrow-up-circle';

  return (
    <View style={styles.card} accessibilityRole="summary" accessibilityLabel={`Transaction: ${transaction.title}`}>
      <View style={styles.iconCol}>
        <Ionicons name={iconName} size={28} color={amountColor} />
      </View>
      <View style={styles.details}>
        <ThemedText style={styles.title} numberOfLines={1}>{transaction.title}</ThemedText>
        <ThemedText style={styles.meta}>
          {label} · {transaction.otherUserName} · {formatDate(transaction.completedAt)}
        </ThemedText>
        {transaction.ratingScore != null && (
          <ThemedText style={styles.rating}>
            {'★'.repeat(transaction.ratingScore)}{'☆'.repeat(5 - transaction.ratingScore)}
            {transaction.ratingComment ? ` "${transaction.ratingComment}"` : ''}
          </ThemedText>
        )}
      </View>
      <ThemedText style={[styles.amount, { color: amountColor }]}>
        {prefix}{formatCentavos(transaction.rewardCentavos, transaction.currency)}
      </ThemedText>
    </View>
  );
}

const createStyles = (colors) => StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  iconCol: {
    marginRight: 12,
  },
  details: {
    flex: 1,
    marginRight: 8,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  meta: {
    fontSize: 12,
    color: colors.muted,
    marginTop: 2,
  },
  rating: {
    fontSize: 12,
    color: colors.warning,
    marginTop: 2,
  },
  amount: {
    fontSize: 15,
    fontWeight: '700',
  },
});
