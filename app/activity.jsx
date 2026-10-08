import React, { useState, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Platform,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSuyos } from '../context/SuyoContext';
import { useAuth } from '../context/AuthContext';
import WalletIncomeLineGraph from '../components/wallet/WalletIncomeLineGraph';

export default function WalletScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, 16);
  const { transactions = [], transactionsLoading, reloadTransactions } = useSuyos();
  const { user } = useAuth();
  const [activityFilter, setActivityFilter] = useState('earned'); // 'earned' | 'spent' | 'all'

  const providerTransactions = useMemo(
    () => (transactions || []).filter((t) => t.role === 'provider'),
    [transactions]
  );

  const spentTransactions = useMemo(
    () => (transactions || []).filter((t) => t.role === 'requester'),
    [transactions]
  );

  const hasLiveTransactions = providerTransactions.length > 0;
  const overallEarningsSum = useMemo(
    () => providerTransactions.reduce((sum, t) => sum + (t.rewardCentavos || 0), 0) / 100,
    [providerTransactions]
  );
  const overallSpentSum = useMemo(
    () => spentTransactions.reduce((sum, t) => sum + (t.rewardCentavos || 0), 0) / 100,
    [spentTransactions]
  );
  const displayTotal = `₱${overallEarningsSum.toFixed(2)}`;

  // Normalized dynamic list from live user transactions
  const dynamicList = useMemo(() => {
    return (transactions || []).map((t, idx) => {
      const isProvider = t.role === 'provider';
      const d = t.completedAt ? new Date(t.completedAt) : new Date();
      const isToday = !isNaN(d.getTime()) && d.toDateString() === new Date().toDateString();
      const dateStr = !isNaN(d.getTime())
        ? isToday
          ? `Today · ${d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`
          : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        : 'Recently';

      return {
        id: t.requestId ? `${t.requestId}_${t.role || 'tx'}` : `TX-${idx}`,
        requestId: t.requestId,
        role: t.role || 'provider',
        title: t.title || (isProvider ? 'Completed Suyo Task' : 'Requested Suyo Errand'),
        category: t.category || (isProvider ? 'Delivery' : 'General'),
        icon:
          t.category === 'Groceries'
            ? 'cart'
            : t.category === 'Medicine'
            ? 'medkit'
            : t.category === 'Delivery'
            ? 'bicycle'
            : t.category === 'Queuing & Bills'
            ? 'time'
            : 'document-text',
        date: dateStr,
        isToday,
        otherUserName: t.otherUserName || (isProvider ? 'Requester' : 'Courier'),
        location: t.location || 'Direct Settlement',
        amount: (t.rewardCentavos || 0) / 100,
        status: isProvider ? 'Received' : 'Paid',
        paymentMethod: 'Direct Settlement (Cash/P2P)',
        refNo: `SYL-${isProvider ? 'EARN' : 'PAID'}-${String(t.requestId || idx).slice(0, 6).toUpperCase()}`,
      };
    });
  }, [transactions]);

  const displayedList = useMemo(() => {
    if (activityFilter === 'earned') {
      return dynamicList.filter((item) => item.role === 'provider');
    }
    if (activityFilter === 'spent') {
      return dynamicList.filter((item) => item.role === 'requester');
    }
    return dynamicList;
  }, [dynamicList, activityFilter]);

  const todayEarnedList = dynamicList.filter((s) => s.role === 'provider' && s.isToday);
  const todayEarningsSum = todayEarnedList.reduce((sum, s) => sum + (Number(s.amount) || 0), 0);
  const todaySuyosCount = todayEarnedList.length;
  const overallSuyosCount = providerTransactions.length;

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const todayDateFormatted = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${currentYear}`;

  const monthlySuyosCount = useMemo(() => {
    return providerTransactions.filter((t) => {
      const dateStr = t.completedAt || t.created_at || t.createdAt;
      const d = dateStr ? new Date(dateStr) : null;
      return (
        d &&
        !isNaN(d.getTime()) &&
        d.getFullYear() === currentYear &&
        d.getMonth() === currentMonth
      );
    }).length;
  }, [providerTransactions, currentYear, currentMonth]);

  return (
    <SafeAreaView edges={['top']} style={styles.safeContainer}>
      <StatusBar style="light" />

      {/* Top Navigation Header */}
      <View style={styles.headerBar}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Wallet</Text>

        <TouchableOpacity
          onPress={() => router.push('/transactions')}
          style={styles.headerReceiptButton}
          activeOpacity={0.75}
          accessibilityLabel="Transaction History"
        >
          <Ionicons name="receipt-outline" size={22} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.contentScroll}
        contentContainerStyle={[
          styles.contentContainer,
          { paddingBottom: bottomInset + 30 },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={Boolean(transactionsLoading)}
            onRefresh={reloadTransactions}
            tintColor="#059669"
            colors={['#059669']}
          />
        }
      >
        {/* 1. Wallet Balance Hero Card */}
        <View style={styles.walletHeroCard}>
          <View style={styles.walletHeroTopRow}>
            <View style={styles.walletBadgeRow}>
              <View style={styles.walletIconCircle}>
                <Ionicons name="wallet" size={17} color="#1E4D2B" />
              </View>
              <Text style={styles.walletHeroSuper}>SUYOLINK WALLET</Text>
            </View>
            <View style={styles.walletVerifiedPill}>
              <Ionicons name="checkmark-circle" size={13} color="#059669" />
              <Text style={styles.walletVerifiedPillText}>Verified User</Text>
            </View>
          </View>

          <Text style={styles.walletBalanceLabel}>Today's Earnings - {todayDateFormatted}</Text>
          <Text style={styles.walletBalanceAmount}>₱{todayEarningsSum.toFixed(2)}</Text>

          {/* 3 Fitted Summary Metric Tiles */}
          <View style={styles.walletSummaryRow}>
            <View style={styles.walletSummaryTile}>
              <Text style={styles.walletSummaryCount} numberOfLines={1} adjustsFontSizeToFit>
                {todaySuyosCount}
              </Text>
              <Text style={styles.walletSummaryLabel} numberOfLines={1} adjustsFontSizeToFit>
                Today's Suyos
              </Text>
            </View>
            <View style={styles.walletSummaryTile}>
              <Text style={styles.walletSummaryCount} numberOfLines={1} adjustsFontSizeToFit>
                {monthlySuyosCount}
              </Text>
              <Text style={styles.walletSummaryLabel} numberOfLines={1} adjustsFontSizeToFit>
                Monthly Suyos
              </Text>
            </View>
            <View style={styles.walletSummaryTile}>
              <Text style={styles.walletSummaryCount} numberOfLines={1} adjustsFontSizeToFit>
                {overallSuyosCount}
              </Text>
              <Text style={styles.walletSummaryLabel} numberOfLines={1} adjustsFontSizeToFit>
                Overall Done
              </Text>
            </View>
          </View>

          {/* Informative Note: Direct Settlement Outside App */}
          <View style={styles.walletPaymentNoticeRow}>
            <Ionicons name="call" size={13} color="#059669" />
            <Text style={styles.walletPaymentNoticeText}>
              Payments are settled directly cash-on-hand or P2P between requesters and doers.
            </Text>
          </View>
        </View>

        {/* Literal Modern Graphical Line Graph - Full Width Standalone Tile */}
        <WalletIncomeLineGraph
          transactions={providerTransactions}
          totalOverride={displayTotal}
          hasTransactions={hasLiveTransactions}
        />

        {/* 2. Section Header with Link to History */}
        <View style={styles.walletSectionHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.walletSectionTitle}>Suyo Activity & Settlements</Text>
            <Text style={styles.walletSectionSub}>
              Tracked rewards and records from what you completed in the app
            </Text>
          </View>
          <TouchableOpacity
            style={styles.viewHistoryButton}
            onPress={() => router.push('/transactions')}
            activeOpacity={0.75}
          >
            <Text style={styles.viewHistoryButtonText}>Full History</Text>
            <Ionicons name="chevron-forward" size={13} color="#059669" />
          </TouchableOpacity>
        </View>

        {/* Filter Pills: Earned / Spent / All */}
        <View style={styles.filterPillsRow}>
          <TouchableOpacity
            style={[
              styles.filterPill,
              activityFilter === 'earned' && styles.filterPillActive,
            ]}
            onPress={() => setActivityFilter('earned')}
            activeOpacity={0.75}
          >
            <Ionicons
              name="arrow-down-circle"
              size={13}
              color={activityFilter === 'earned' ? '#FFFFFF' : '#15803D'}
            />
            <Text
              style={[
                styles.filterPillText,
                activityFilter === 'earned' && styles.filterPillTextActive,
              ]}
            >
              Earned ({providerTransactions.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterPill,
              activityFilter === 'spent' && styles.filterPillActive,
            ]}
            onPress={() => setActivityFilter('spent')}
            activeOpacity={0.75}
          >
            <Ionicons
              name="arrow-up-circle"
              size={13}
              color={activityFilter === 'spent' ? '#FFFFFF' : '#DC2626'}
            />
            <Text
              style={[
                styles.filterPillText,
                activityFilter === 'spent' && styles.filterPillTextActive,
              ]}
            >
              Spent ({spentTransactions.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterPill,
              activityFilter === 'all' && styles.filterPillActive,
            ]}
            onPress={() => setActivityFilter('all')}
            activeOpacity={0.75}
          >
            <Text
              style={[
                styles.filterPillText,
                activityFilter === 'all' && styles.filterPillTextActive,
              ]}
            >
              All ({dynamicList.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* 3. The Clean List of Dynamic Transactions */}
        <View style={styles.walletListWrapper}>
          {displayedList.length === 0 ? (
            <View style={styles.walletEmptyCard}>
              <View style={styles.walletEmptyIconCircle}>
                <Ionicons name="wallet-outline" size={32} color="#1E4D2B" />
              </View>
              <Text style={styles.walletEmptyTitle}>
                {activityFilter === 'earned'
                  ? 'No suyo earnings yet'
                  : activityFilter === 'spent'
                  ? 'No spending records yet'
                  : 'No transaction activity yet'}
              </Text>
              <Text style={styles.walletEmptySub}>
                {activityFilter === 'earned'
                  ? 'When you fulfill and complete suyos for others, your settled earnings and receipts will appear here dynamically.'
                  : activityFilter === 'spent'
                  ? 'When couriers complete the suyos you posted, your settled rewards and proof of payments will appear here.'
                  : 'Complete suyo tasks or have your posted tasks fulfilled to track live transactions in your wallet.'}
              </Text>
              <TouchableOpacity
                style={styles.emptyActionBtn}
                activeOpacity={0.8}
                onPress={() => router.push('/dashboard')}
              >
                <Ionicons name="compass-outline" size={15} color="#FFFFFF" />
                <Text style={styles.emptyActionBtnText}>Browse Available Suyos</Text>
              </TouchableOpacity>
            </View>
          ) : (
            displayedList.map((item) => {
              const isProvider = item.role === 'provider';
              return (
                <View key={item.id} style={styles.walletItemCard}>
                  <View style={styles.walletItemLeft}>
                    <View
                      style={[
                        styles.walletCategoryIconCircle,
                        item.category === 'Groceries'
                          ? { backgroundColor: '#DCFCE7' }
                          : item.category === 'Medicine'
                          ? { backgroundColor: '#F3E8FF' }
                          : item.category === 'Documents'
                          ? { backgroundColor: '#E0F2FE' }
                          : item.category === 'Queuing & Bills'
                          ? { backgroundColor: '#FEF3C7' }
                          : { backgroundColor: '#EAF4EF' },
                      ]}
                    >
                      <Ionicons
                        name={item.icon || 'receipt'}
                        size={18}
                        color={
                          item.category === 'Groceries'
                            ? '#15803D'
                            : item.category === 'Medicine'
                            ? '#7E22CE'
                            : item.category === 'Documents'
                            ? '#0369A1'
                            : item.category === 'Queuing & Bills'
                            ? '#B45309'
                            : '#1E4D2B'
                        }
                      />
                    </View>

                    <View style={styles.walletItemInfoCol}>
                      <Text style={styles.walletItemTitle} numberOfLines={1}>
                        {item.title}
                      </Text>

                      <View style={styles.walletItemMetaRow}>
                        <Ionicons name="person-circle-outline" size={13} color="#557261" />
                        <Text style={styles.walletItemRequesterText}>
                          {isProvider ? 'From: ' : 'Paid to: '}
                          <Text style={{ fontWeight: '700', color: '#163523' }}>
                            {item.otherUserName}
                          </Text>
                        </Text>
                      </View>

                      <View style={styles.walletItemDateRow}>
                        <Ionicons name="time-outline" size={12} color="#8CA395" />
                        <Text style={styles.walletItemDateText}>{item.date}</Text>
                        <Text style={styles.walletItemDot}>•</Text>
                        <Ionicons name="location-outline" size={12} color="#8CA395" />
                        <Text style={styles.walletItemLocationText} numberOfLines={1}>
                          {item.location}
                        </Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.walletItemRight}>
                    <Text
                      style={[
                        styles.walletEarnedAmountText,
                        !isProvider && { color: '#DC2626' },
                      ]}
                    >
                      {isProvider ? '+' : '−'}₱{Number(item.amount).toFixed(2)}
                    </Text>
                    <View
                      style={[
                        styles.walletStatusChip,
                        !isProvider && { backgroundColor: '#FEE2E2' },
                      ]}
                    >
                      <Ionicons
                        name={isProvider ? 'checkmark-circle' : 'cash-outline'}
                        size={10}
                        color={isProvider ? '#15803D' : '#DC2626'}
                      />
                      <Text
                        style={[
                          styles.walletStatusChipText,
                          !isProvider && { color: '#DC2626' },
                        ]}
                      >
                        {item.status}
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: '#1E4D2B',
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#1E4D2B',
  },
  backButton: {
    padding: 6,
    borderRadius: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  headerRightPlaceholder: {
    width: 36,
  },
  contentScroll: {
    flex: 1,
    backgroundColor: '#F4F7F5',
  },
  contentContainer: {
    padding: 16,
  },
  walletHeroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
    shadowColor: '#1E4D2B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E6EFE9',
  },
  walletHeroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  walletBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  walletIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EAF4EF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  walletHeroSuper: {
    fontSize: 11,
    fontWeight: '800',
    color: '#1E4D2B',
    letterSpacing: 0.8,
  },
  walletVerifiedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  walletVerifiedPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
  },
  walletBalanceLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#557261',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  walletBalanceAmount: {
    fontSize: 32,
    fontWeight: '900',
    color: '#163523',
    letterSpacing: -0.5,
    marginBottom: 16,
  },
  walletSummaryRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 8,
    marginBottom: 4,
  },
  walletSummaryTile: {
    flex: 1,
    backgroundColor: '#F8FAF9',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#EDF5F0',
  },
  walletSummaryItem: {
    alignItems: 'center',
    flex: 1,
    paddingHorizontal: 4,
  },
  walletSummaryCount: {
    fontSize: 16,
    fontWeight: '800',
    color: '#163523',
    marginBottom: 2,
    textAlign: 'center',
  },
  walletSummaryLabel: {
    fontSize: 10.5,
    color: '#557261',
    fontWeight: '700',
    textAlign: 'center',
  },
  walletSummaryDivider: {
    width: 1,
    height: 28,
    backgroundColor: '#D7EBE0',
  },
  // Line Chart Styles
  walletLineGraphCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E6F0EB',
    marginTop: 14,
    marginBottom: 8,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  walletLineHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  walletLineTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  walletLineIconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  walletLineTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#064E3B',
  },
  walletLineSub: {
    fontSize: 10.5,
    color: '#059669',
    fontWeight: '500',
  },
  walletGrowthBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  walletGrowthBadgeText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#065F46',
  },
  walletLineAmountRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0FDF4',
  },
  walletLineBigAmount: {
    fontSize: 22,
    fontWeight: '900',
    color: '#064E3B',
    letterSpacing: -0.5,
  },
  walletLineTotalNote: {
    fontSize: 11,
    color: '#059669',
    fontWeight: '600',
    marginTop: 2,
  },
  walletTimeFilterRow: {
    flexDirection: 'row',
    gap: 4,
    backgroundColor: '#F3F4F6',
    padding: 3,
    borderRadius: 9,
  },
  walletTimeFilterBtn: {
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 6,
  },
  walletTimeFilterBtnActive: {
    backgroundColor: '#059669',
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 1,
  },
  walletTimeFilterText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#6B7280',
  },
  walletTimeFilterTextActive: {
    color: '#FFFFFF',
  },
  walletSvgChartContainer: {
    width: '100%',
    height: 185,
    marginVertical: 4,
  },
  walletNativeChartContainer: {
    width: '100%',
    height: 165,
    marginVertical: 6,
    justifyContent: 'flex-end',
  },
  walletNativeChartGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 125,
    borderBottomWidth: 1,
    borderBottomColor: '#CBD5E1',
    paddingBottom: 4,
  },
  walletNativeBarCol: {
    alignItems: 'center',
  },
  walletNativeValBadge: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginBottom: 4,
  },
  walletNativeValBadgePeak: {
    backgroundColor: '#064E3B',
    borderColor: '#064E3B',
  },
  walletNativeValText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#065F46',
  },
  walletNativeValTextPeak: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  walletNativeNodeDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#059669',
    marginBottom: 4,
  },
  walletNativeNodeDotPeak: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#047857',
    borderWidth: 2,
    borderColor: '#A7F3D0',
  },
  walletNativeDropLine: {
    width: 1,
    height: 35,
    backgroundColor: '#E2E8F0',
  },
  walletNativeLabelText: {
    fontSize: 9.5,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 4,
  },
  walletChartFooterMetrics: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAF9',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginTop: 6,
    borderWidth: 1,
    borderColor: '#EDF5F1',
  },
  walletFooterMetricItem: {
    alignItems: 'center',
    flex: 1,
  },
  walletFooterMetricDivider: {
    width: 1,
    height: 20,
    backgroundColor: '#E2E8F0',
  },
  walletFooterMetricValue: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A',
  },
  walletFooterMetricLabel: {
    fontSize: 9.5,
    color: '#64748B',
    fontWeight: '600',
    marginTop: 1,
  },
  walletPaymentNoticeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#DCFCE7',
  },
  walletPaymentNoticeText: {
    fontSize: 11,
    color: '#15803D',
    fontWeight: '600',
    flex: 1,
    lineHeight: 15,
  },
  walletSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingHorizontal: 2,
  },
  walletSectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#163523',
    letterSpacing: -0.2,
  },
  walletSectionSub: {
    fontSize: 12,
    color: '#557261',
    fontWeight: '500',
    marginTop: 1,
  },
  walletCountChip: {
    backgroundColor: '#EAF4EF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  walletCountChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1E4D2B',
  },
  walletListWrapper: {
    gap: 10,
  },
  walletItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    shadowColor: '#1E4D2B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
    borderWidth: 1,
    borderColor: '#EDF5F0',
  },
  walletItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    marginRight: 10,
  },
  walletCategoryIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  walletItemInfoCol: {
    flex: 1,
  },
  walletItemTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#163523',
    marginBottom: 3,
  },
  walletItemMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 3,
  },
  walletItemRequesterText: {
    fontSize: 11.5,
    color: '#557261',
    fontWeight: '500',
  },
  walletItemDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  walletItemDateText: {
    fontSize: 11,
    color: '#8CA395',
  },
  walletItemDot: {
    fontSize: 10,
    color: '#CBD5E1',
    marginHorizontal: 2,
  },
  walletItemLocationText: {
    fontSize: 11,
    color: '#8CA395',
    flex: 1,
  },
  walletItemRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  walletEarnedAmountText: {
    fontSize: 15,
    fontWeight: '900',
    color: '#15803D',
  },
  walletStatusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    gap: 3,
  },
  walletStatusChipText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#15803D',
  },
  walletEmptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginVertical: 12,
  },
  walletEmptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#EAF4EF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  walletEmptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#163523',
    marginBottom: 6,
  },
  walletEmptySub: {
    fontSize: 13,
    color: '#557261',
    textAlign: 'center',
    lineHeight: 19,
    maxWidth: 290,
    marginBottom: 14,
  },
  headerReceiptButton: {
    padding: 6,
    borderRadius: 8,
  },
  viewHistoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#EAF4EF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  viewHistoryButtonText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#059669',
  },
  filterPillsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.2,
    borderColor: '#DFECE5',
  },
  filterPillActive: {
    backgroundColor: '#1E4D2B',
    borderColor: '#1E4D2B',
  },
  filterPillText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#334155',
  },
  filterPillTextActive: {
    color: '#FFFFFF',
  },
  emptyActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#1E4D2B',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  emptyActionBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
