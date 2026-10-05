import React, { useCallback, useMemo } from 'react';
import {
  StyleSheet,
  View,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeContext';
import { useSuyos } from '../../context/SuyoContext';
import ThemedText from '../themed/ThemedText';
import ScreenHeader from '../ScreenHeader';
import TransactionCard from './TransactionCard';

function formatCentavos(centavos, currency = 'PHP') {
  const amount = (centavos / 100).toFixed(2);
  return currency === 'PHP' ? `₱${amount}` : `${currency} ${amount}`;
}

export default function TransactionsScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const router = useRouter();
  const {
    transactions,
    transactionsLoading,
    transactionsError,
    reloadTransactions,
  } = useSuyos();

  const earnedCentavos = useMemo(
    () =>
      (transactions || [])
        .filter((t) => t.role === 'provider')
        .reduce((sum, t) => sum + (t.rewardCentavos || 0), 0),
    [transactions],
  );
  const spentCentavos = useMemo(
    () =>
      (transactions || [])
        .filter((t) => t.role === 'requester')
        .reduce((sum, t) => sum + (t.rewardCentavos || 0), 0),
    [transactions],
  );

  const renderItem = useCallback(
    ({ item }) => <TransactionCard transaction={item} />,
    [],
  );
  const keyExtractor = useCallback((item) => item.requestId, []);

  return (
    <SafeAreaView
      edges={['top']}
      style={styles.container}
    >
      <ScreenHeader
        title="Transaction history"
        onBack={() =>
          router.canGoBack() ? router.back() : router.replace('/dashboard')
        }
      />

      <View style={styles.totalsRow}>
        <View style={styles.totalCard}>
          <ThemedText style={styles.totalLabel}>Earned</ThemedText>
          <ThemedText
            style={[styles.totalValue, { color: colors.success }]}
            accessibilityLabel={`Total earned ${formatCentavos(earnedCentavos)}`}
          >
            {formatCentavos(earnedCentavos)}
          </ThemedText>
        </View>
        <View style={styles.totalCard}>
          <ThemedText style={styles.totalLabel}>Spent</ThemedText>
          <ThemedText
            style={[styles.totalValue, { color: colors.danger }]}
            accessibilityLabel={`Total spent ${formatCentavos(spentCentavos)}`}
          >
            {formatCentavos(spentCentavos)}
          </ThemedText>
        </View>
      </View>

      {transactionsError ? (
        <View style={styles.center}>
          <ThemedText
            tone="danger"
            accessibilityRole="alert"
          >
            {transactionsError}
          </ThemedText>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Retry loading transactions"
            onPress={reloadTransactions}
            style={styles.retryBtn}
          >
            <ThemedText style={styles.retryText}>Retry</ThemedText>
          </TouchableOpacity>
        </View>
      ) : transactionsLoading ? (
        <View style={styles.center}>
          <ActivityIndicator
            size="large"
            color={colors.primary}
          />
        </View>
      ) : (transactions || []).length === 0 ? (
        <View style={styles.center}>
          <Ionicons
            name="receipt-outline"
            size={48}
            color={colors.muted}
          />
          <ThemedText style={styles.emptyText}>
            No completed transactions yet
          </ThemedText>
        </View>
      ) : (
        <FlatList
          data={transactions}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const createStyles = (colors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      width: '100%',
      maxWidth: 900,
      alignSelf: 'center',
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    backBtn: {
      marginRight: 12,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.text,
    },
    totalsRow: {
      flexDirection: 'row',
      paddingHorizontal: 16,
      paddingTop: 16,
      paddingBottom: 8,
      gap: 12,
    },
    totalCard: {
      flex: 1,
      backgroundColor: colors.card,
      borderRadius: 20,
      padding: 20,
      alignItems: 'flex-start',
      borderWidth: 1,
      borderColor: colors.border,
    },
    totalLabel: {
      fontSize: 12,
      color: colors.muted,
      marginBottom: 4,
    },
    totalValue: {
      fontSize: 20,
      fontWeight: '800',
    },
    center: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 24,
    },
    emptyText: {
      marginTop: 12,
      fontSize: 15,
      color: colors.muted,
      textAlign: 'center',
    },
    retryBtn: {
      marginTop: 12,
      paddingHorizontal: 20,
      paddingVertical: 8,
      borderRadius: 8,
      backgroundColor: colors.primary,
    },
    retryText: {
      color: colors.onPrimary,
      fontWeight: '600',
      fontSize: 14,
    },
    listContent: {
      padding: 16,
    },
  });
