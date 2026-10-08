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
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'earned' | 'spent'
  const {
    transactions,
    transactionsLoading,
    transactionsError,
    reloadTransactions,
  } = useSuyos();

  const earnedList = useMemo(
    () => (transactions || []).filter((t) => t.role === 'provider'),
    [transactions],
  );
  const spentList = useMemo(
    () => (transactions || []).filter((t) => t.role === 'requester'),
    [transactions],
  );

  const earnedCentavos = useMemo(
    () => earnedList.reduce((sum, t) => sum + (t.rewardCentavos || 0), 0),
    [earnedList],
  );
  const spentCentavos = useMemo(
    () => spentList.reduce((sum, t) => sum + (t.rewardCentavos || 0), 0),
    [spentList],
  );

  const filteredTransactions = useMemo(() => {
    if (activeTab === 'earned') return earnedList;
    if (activeTab === 'spent') return spentList;
    return transactions || [];
  }, [activeTab, earnedList, spentList, transactions]);

  const renderItem = useCallback(
    ({ item }) => <TransactionCard transaction={item} />,
    [],
  );
  const keyExtractor = useCallback(
    (item, index) => item.id || `${item.requestId}_${item.role || 'tx'}_${index}`,
    [],
  );

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
        <TouchableOpacity
          style={[
            styles.totalCard,
            activeTab === 'earned' && { borderColor: colors.success, borderWidth: 2 },
          ]}
          onPress={() => setActiveTab((prev) => (prev === 'earned' ? 'all' : 'earned'))}
          activeOpacity={0.8}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <Ionicons name="arrow-down-circle" size={14} color={colors.success} />
            <ThemedText style={styles.totalLabel}>Earned ({earnedList.length})</ThemedText>
          </View>
          <ThemedText
            style={[styles.totalValue, { color: colors.success }]}
            accessibilityLabel={`Total earned ${formatCentavos(earnedCentavos)}`}
          >
            {formatCentavos(earnedCentavos)}
          </ThemedText>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.totalCard,
            activeTab === 'spent' && { borderColor: colors.danger, borderWidth: 2 },
          ]}
          onPress={() => setActiveTab((prev) => (prev === 'spent' ? 'all' : 'spent'))}
          activeOpacity={0.8}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <Ionicons name="arrow-up-circle" size={14} color={colors.danger} />
            <ThemedText style={styles.totalLabel}>Spent ({spentList.length})</ThemedText>
          </View>
          <ThemedText
            style={[styles.totalValue, { color: colors.danger }]}
            accessibilityLabel={`Total spent ${formatCentavos(spentCentavos)}`}
          >
            {formatCentavos(spentCentavos)}
          </ThemedText>
        </TouchableOpacity>
      </View>

      {/* Filter Tabs */}
      <View style={styles.tabsRow}>
        <TouchableOpacity
          style={[styles.tabChip, activeTab === 'all' && styles.tabChipActive]}
          onPress={() => setActiveTab('all')}
          activeOpacity={0.75}
        >
          <ThemedText
            style={[styles.tabChipText, activeTab === 'all' && styles.tabChipTextActive]}
          >
            All ({(transactions || []).length})
          </ThemedText>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabChip, activeTab === 'earned' && styles.tabChipActive]}
          onPress={() => setActiveTab('earned')}
          activeOpacity={0.75}
        >
          <ThemedText
            style={[styles.tabChipText, activeTab === 'earned' && styles.tabChipTextActive]}
          >
            Earned ({earnedList.length})
          </ThemedText>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabChip, activeTab === 'spent' && styles.tabChipActive]}
          onPress={() => setActiveTab('spent')}
          activeOpacity={0.75}
        >
          <ThemedText
            style={[styles.tabChipText, activeTab === 'spent' && styles.tabChipTextActive]}
          >
            Spent ({spentList.length})
          </ThemedText>
        </TouchableOpacity>
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
      ) : filteredTransactions.length === 0 ? (
        <View style={styles.center}>
          <Ionicons
            name="receipt-outline"
            size={48}
            color={colors.muted}
          />
          <ThemedText style={styles.emptyText}>
            {activeTab === 'earned'
              ? 'No earned transactions yet'
              : activeTab === 'spent'
              ? 'No spent transactions yet'
              : 'No completed transactions yet'}
          </ThemedText>
          <ThemedText style={styles.emptySubText}>
            When you complete tasks as a doer or have your posted suyos completed, your digital transactions will be tracked here in real-time.
          </ThemedText>
          <TouchableOpacity
            style={styles.browseBtn}
            onPress={() => router.replace('/dashboard')}
            activeOpacity={0.8}
          >
            <ThemedText style={styles.browseBtnText}>Explore Suyos</ThemedText>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredTransactions}
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
    tabsRow: {
      flexDirection: 'row',
      paddingHorizontal: 16,
      marginBottom: 12,
      gap: 8,
    },
    tabChip: {
      paddingHorizontal: 14,
      paddingVertical: 7,
      borderRadius: 16,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
    },
    tabChipActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    tabChipText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.text,
    },
    tabChipTextActive: {
      color: colors.onPrimary,
    },
    emptySubText: {
      marginTop: 8,
      fontSize: 13,
      color: colors.muted,
      textAlign: 'center',
      maxWidth: 280,
      lineHeight: 18,
    },
    browseBtn: {
      marginTop: 16,
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 10,
      backgroundColor: colors.primary,
    },
    browseBtnText: {
      color: colors.onPrimary,
      fontWeight: '700',
      fontSize: 13,
    },
  });

