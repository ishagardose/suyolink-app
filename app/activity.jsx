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

const WALLET_EARNED_SUYOS = [
  {
    id: 'WAL-001',
    title: 'Drop off documents - Unit 402',
    category: 'Documents',
    icon: 'document-text',
    date: 'Today (W4) · 4:00 PM',
    requesterName: 'Atty. Rafael Cruz',
    location: 'Makati CBD, Tower 1',
    earnedAmount: 300,
    status: 'Received',
    paymentMethod: 'Direct Payment (Cash/P2P)',
    refNo: 'SYL-EARN-9842',
  },
  {
    id: 'WAL-002',
    title: 'Express parcel delivery to Greenbelt',
    category: 'Delivery',
    icon: 'bicycle',
    date: 'Today (W4) · 10:00 AM',
    requesterName: 'Patricia Mendoza',
    location: 'Greenbelt 5 Concierge',
    earnedAmount: 90,
    status: 'Received',
    paymentMethod: 'Direct Payment (Cash/P2P)',
    refNo: 'SYL-EARN-9801',
  },
  {
    id: 'WAL-003',
    title: 'Buy groceries - SM Tagum',
    category: 'Groceries',
    icon: 'cart',
    date: 'Oct 20 (W3) · 12:15 PM',
    requesterName: 'Maria Clarissa',
    location: 'SM Tagum Supermarket',
    earnedAmount: 150,
    status: 'Received',
    paymentMethod: 'Direct Payment (Cash/P2P)',
    refNo: 'SYL-EARN-9755',
  },
  {
    id: 'WAL-004',
    title: 'Queue for Meralco bills payment',
    category: 'Queuing & Bills',
    icon: 'time',
    date: 'Oct 17 (W3) · 11:30 AM',
    requesterName: 'Kenneth Gomez',
    location: 'Bayad Center Ayala',
    earnedAmount: 180,
    status: 'Received',
    paymentMethod: 'Direct Payment (Cash/P2P)',
    refNo: 'SYL-EARN-9510',
  },
  {
    id: 'WAL-005',
    title: 'Print school project & binding',
    category: 'Documents',
    icon: 'print',
    date: 'Oct 13 (W2) · 4:15 PM',
    requesterName: 'Dave B. (Student)',
    location: 'Davao Printing Hub',
    earnedAmount: 160,
    status: 'Received',
    paymentMethod: 'Direct Payment (Cash/P2P)',
    refNo: 'SYL-EARN-9321',
  },
  {
    id: 'WAL-006',
    title: 'Prescription pickup at Mercury Drug',
    category: 'Medicine',
    icon: 'medkit',
    date: 'Oct 10 (W2) · 3:45 PM',
    requesterName: 'Lola Remedios',
    location: 'Mercury Drug Legaspi',
    earnedAmount: 180,
    status: 'Received',
    paymentMethod: 'Direct Payment (Cash/P2P)',
    refNo: 'SYL-EARN-9120',
  },
  {
    id: 'WAL-007',
    title: 'Pick up medical supplies & vitamins',
    category: 'Delivery',
    icon: 'bag-check-outline',
    date: 'Oct 04 (W1) · 10:00 AM',
    requesterName: 'Mrs. Angela Santos',
    location: 'Generika Drugstore',
    earnedAmount: 220,
    status: 'Received',
    paymentMethod: 'Direct Payment (Cash/P2P)',
    refNo: 'SYL-EARN-8940',
  },
];

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

  const providerTransactions = useMemo(
    () => (transactions || []).filter((t) => t.role === 'provider'),
    [transactions],
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

  const dynamicEarnedList = useMemo(() => {
    if (!hasLiveTransactions) return [];
    return providerTransactions.map((t, idx) => {
      const d = t.completedAt ? new Date(t.completedAt) : new Date();
      const isToday = d.toDateString() === new Date().toDateString();
      const dateStr = isToday
        ? `Today · ${d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`
        : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      return {
        id: t.requestId || `WAL-${idx}`,
        title: t.title || 'Completed Suyo',
        category: t.category || 'Documents',
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
  }, [providerTransactions, hasLiveTransactions]);

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

        <View style={styles.headerRightPlaceholder} />
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

          {/* 3 Summary Items: Today's Suyos, Monthly Suyos, Overall Completed */}
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

          {/* Literal Modern Graphical Line Graph */}
          <WalletIncomeLineGraph
            transactions={providerTransactions}
            totalOverride={displayTotal}
            hasTransactions={hasLiveTransactions}
          />

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

        {/* 2. Section Header */}
        <View style={styles.walletSectionHeader}>
          <View>
            <Text style={styles.walletSectionTitle}>
              Accepted Suyo Earnings
            </Text>
            <Text style={styles.walletSectionSub}>
              Tracked rewards earned from every accepted suyo request
            </Text>
          </View>
          <View style={styles.walletCountChip}>
            <Text style={styles.walletCountChipText}>
              {dynamicEarnedList.length} earned ({displayTotal})
            </Text>
          </View>
        </View>

        {/* 3. The Clean List of Earned Accepted Suyo Requests */}
        <View style={styles.walletListWrapper}>
          {dynamicEarnedList.length === 0 ? (
            <View style={styles.walletEmptyCard}>
              <View style={styles.walletEmptyIconCircle}>
                <Ionicons
                  name="wallet-outline"
                  size={32}
                  color="#1E4D2B"
                />
              </View>
              <Text style={styles.walletEmptyTitle}>No suyo earnings yet</Text>
              <Text style={styles.walletEmptySub}>
                When you accept and complete suyos for others, your settled
                earnings and receipts will be recorded here.
              </Text>
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
