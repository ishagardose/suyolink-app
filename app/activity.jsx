import { styles } from '../components/wallet/activity.styles';
import React, { useState, useMemo } from 'react';
import {
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Platform,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
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
  const {
    transactions = [],
    transactionsLoading,
    reloadTransactions,
  } = useSuyos();
  const { user } = useAuth();
  const [activityFilter, setActivityFilter] = useState('earned'); // 'earned' | 'spent' | 'all'

  const providerTransactions = useMemo(
    () => (transactions || []).filter((t) => t.role === 'provider'),
    [transactions],
  );

  const spentTransactions = useMemo(
    () => (transactions || []).filter((t) => t.role === 'requester'),
    [transactions]
  );

  const hasLiveTransactions = providerTransactions.length > 0;
  const overallEarningsSum = useMemo(
    () =>
      providerTransactions.reduce(
        (sum, t) => sum + (t.rewardCentavos || 0),
        0,
      ) / 100,
    [providerTransactions],
  );
  const displayTotal = `₱${overallEarningsSum.toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

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
                : 'document-text',
        date: dateStr,
        requesterName: t.otherUserName || 'Requester',
        location: 'Direct Settlement',
        earnedAmount: (t.rewardCentavos || 0) / 100,
        status: 'Received',
        paymentMethod: 'Direct Payment (Cash/P2P)',
        refNo: `SYL-EARN-${String(t.requestId || idx)
          .slice(0, 6)
          .toUpperCase()}`,
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

  const todayEarnedList = dynamicEarnedList.filter((s) =>
    s.date?.startsWith('Today'),
  );
  const todayEarningsSum = todayEarnedList.reduce(
    (sum, s) => sum + (Number(s.earnedAmount) || 0),
    0,
  );
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
    <SafeAreaView
      edges={['top']}
      style={styles.safeContainer}
    >
      <StatusBar style="light" />

      {/* Top Navigation Header */}
      <View style={styles.headerBar}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons
            name="arrow-back"
            size={24}
            color="#FFFFFF"
          />
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
                <Ionicons
                  name="wallet"
                  size={17}
                  color="#1E4D2B"
                />
              </View>
              <Text style={styles.walletHeroSuper}>SUYOLINK WALLET</Text>
            </View>
            <View style={styles.walletVerifiedPill}>
              <Ionicons
                name="checkmark-circle"
                size={13}
                color="#059669"
              />
              <Text style={styles.walletVerifiedPillText}>Verified User</Text>
            </View>
          </View>

          <Text style={styles.walletBalanceLabel}>
            Today's Earnings - {todayDateFormatted}
          </Text>
          <Text style={styles.walletBalanceAmount}>
            ₱{todayEarningsSum.toFixed(2)}
          </Text>

          {/* 3 Fitted Summary Metric Tiles */}
          <View style={styles.walletSummaryRow}>
            <View style={styles.walletSummaryItem}>
              <Text style={styles.walletSummaryCount}>
                {todaySuyosCount} Suyos
              </Text>
              <Text style={styles.walletSummaryLabel}>Today's Suyos</Text>
            </View>
            <View style={styles.walletSummaryDivider} />
            <View style={styles.walletSummaryItem}>
              <Text style={styles.walletSummaryCount}>
                {monthlySuyosCount} Suyos
              </Text>
              <Text style={styles.walletSummaryLabel}>Monthly Suyos</Text>
            </View>
            <View style={styles.walletSummaryDivider} />
            <View style={styles.walletSummaryItem}>
              <Text style={styles.walletSummaryCount}>
                {overallSuyosCount} Suyos
              </Text>
              <Text style={styles.walletSummaryLabel}>Overall Completed</Text>
            </View>
          </View>

          {/* Informative Note: Direct Settlement Outside App */}
          <View style={styles.walletPaymentNoticeRow}>
            <Ionicons
              name="call"
              size={13}
              color="#059669"
            />
            <Text style={styles.walletPaymentNoticeText}>
              Payments are received directly via call & conversation with
              requesters outside the app.
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
          <View>
            <Text style={styles.walletSectionTitle}>
              Accepted Suyo Earnings
            </Text>
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
                <Ionicons
                  name="wallet-outline"
                  size={32}
                  color="#1E4D2B"
                />
              </View>
              <Text style={styles.walletEmptyTitle}>
                {activityFilter === 'earned'
                  ? 'No suyo earnings yet'
                  : activityFilter === 'spent'
                  ? 'No spending records yet'
                  : 'No transaction activity yet'}
              </Text>
              <Text style={styles.walletEmptySub}>
                When you accept and complete suyos for others, your settled
                earnings and receipts will be recorded here.
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
            dynamicEarnedList.map((item) => (
              <View
                key={item.id}
                style={styles.walletItemCard}
              >
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
                    <Text
                      style={styles.walletItemTitle}
                      numberOfLines={1}
                    >
                      {item.title}
                    </Text>

                    <View style={styles.walletItemMetaRow}>
                      <Ionicons
                        name="person-circle-outline"
                        size={13}
                        color="#557261"
                      />
                      <Text style={styles.walletItemRequesterText}>
                        From:{' '}
                        <Text style={{ fontWeight: '700', color: '#163523' }}>
                          {item.requesterName}
                        </Text>
                      </Text>
                    </View>

                    <View style={styles.walletItemDateRow}>
                      <Ionicons
                        name="time-outline"
                        size={12}
                        color="#8CA395"
                      />
                      <Text style={styles.walletItemDateText}>{item.date}</Text>
                      <Text style={styles.walletItemDot}>•</Text>
                      <Ionicons
                        name="location-outline"
                        size={12}
                        color="#8CA395"
                      />
                      <Text
                        style={styles.walletItemLocationText}
                        numberOfLines={1}
                      >
                        {item.location}
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={styles.walletItemRight}>
                  <Text style={styles.walletEarnedAmountText}>
                    +₱{Number(item.earnedAmount).toFixed(2)}
                  </Text>
                  <View style={styles.walletStatusChip}>
                    <Ionicons
                      name="checkmark-circle"
                      size={10}
                      color="#15803D"
                    />
                    <Text style={styles.walletStatusChipText}>
                      {item.status}
                    </Text>
                  </View>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
