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

const WALLET_INCOME_CHART_PRESETS = {
  monthly: {
    id: 'monthly',
    tabLabel: 'Monthly',
    title: 'Monthly Income Trend',
    subtitle: 'Weekly breakdown for October 2026',
    total: '₱1,280.00',
    totalNote: 'Total October Income (7 Suyos)',
    growth: '+18.4% vs Sep',
    pts: [
      { x: 95, y: 102, val: '₱220', label: 'W1 (Oct 1–7)' },
      { x: 205, y: 66, val: '₱340', label: 'W2 (Oct 8–14)' },
      { x: 315, y: 69, val: '₱330', label: 'W3 (Oct 15–21)' },
      { x: 425, y: 51, val: '₱390', label: 'W4 (Oct 22–28)', isPeak: true },
    ],
    pathD:
      'M 95,102 C 150,102 150,66 205,66 C 260,66 260,69 315,69 C 370,69 370,51 425,51',
    areaD:
      'M 95,102 C 150,102 150,66 205,66 C 260,66 260,69 315,69 C 370,69 370,51 425,51 L 425,168 L 95,168 Z',
    yLabels: ['₱400', '₱300', '₱200', '₱100', '₱0'],
    metrics: [
      { label: 'Peak Week (W4)', value: '₱390.00' },
      { label: 'Weekly Average', value: '₱320.00' },
      { label: 'Month Completed', value: '7 Suyos' },
    ],
  },
  yearly: {
    id: 'yearly',
    tabLabel: 'Yearly',
    title: 'Yearly Income Trend',
    subtitle: 'Quarterly breakdown for 2026 YTD',
    total: '₱15,360.00',
    totalNote: 'Total 2026 Annual Income (84 Suyos)',
    growth: '+34.2% vs 2025',
    pts: [
      { x: 95, y: 89, val: '₱3.3k', label: 'Q1 (Jan–Mar)' },
      { x: 205, y: 65, val: '₱4.3k', label: 'Q2 (Apr–Jun)' },
      { x: 315, y: 60, val: '₱4.5k', label: 'Q3 (Jul–Sep)', isPeak: true },
      { x: 425, y: 90, val: '₱3.3k', label: 'Q4 (Oct YTD)' },
    ],
    pathD:
      'M 95,89 C 150,89 150,65 205,65 C 260,65 260,60 315,60 C 370,60 370,90 425,90',
    areaD:
      'M 95,89 C 150,89 150,65 205,65 C 260,65 260,60 315,60 C 370,60 370,90 425,90 L 425,168 L 95,168 Z',
    yLabels: ['₱5.0k', '₱3.7k', '₱2.5k', '₱1.2k', '₱0'],
    metrics: [
      { label: 'Peak Quarter (Q3)', value: '₱4,500.00' },
      { label: 'Monthly Average', value: '₱1,536.00' },
      { label: 'Overall Completed', value: '84 Suyos' },
    ],
  },
};

function WalletIncomeLineGraph({ totalOverride, hasTransactions }) {
  const [activeRange, setActiveRange] = useState('monthly');
  const base = WALLET_INCOME_CHART_PRESETS[activeRange] || WALLET_INCOME_CHART_PRESETS.monthly;
  const isZero = !hasTransactions || totalOverride === '₱0.00';
  const current = useMemo(() => {
    if (isZero) {
      return {
        ...base,
        total: '₱0.00',
        totalNote: 'No completed suyo earnings recorded yet',
        growth: '0.0%',
        pts: [
          { x: 95, y: 168, val: '₱0', label: 'Start' },
          { x: 205, y: 168, val: '₱0', label: 'Mid' },
          { x: 315, y: 168, val: '₱0', label: 'Recent' },
          { x: 425, y: 168, val: '₱0', label: 'Now' },
        ],
        pathD: 'M 95,168 L 425,168',
        areaD: 'M 95,168 L 425,168 L 425,168 L 95,168 Z',
        yLabels: ['₱500', '₱350', '₱200', '₱100', '₱0'],
        metrics: [
          { label: 'Completed Suyos', value: '0 Suyos' },
          { label: 'Average Earnings', value: '₱0.00' },
          { label: 'Peak Earning', value: '₱0.00' },
        ],
      };
    }
    return {
      ...base,
      total: totalOverride || base.total,
    };
  }, [base, totalOverride, isZero]);

  const renderWebSvg = () => {
    return React.createElement(
      'svg',
      {
        viewBox: '0 0 500 200',
        width: '100%',
        height: '185',
        style: { width: '100%', height: 185, overflow: 'visible' },
      },
      React.createElement(
        'defs',
        null,
        React.createElement(
          'linearGradient',
          { id: 'walletIncomeGradAct', x1: '0', y1: '0', x2: '0', y2: '1' },
          React.createElement('stop', { offset: '0%', stopColor: '#10B981', stopOpacity: '0.35' }),
          React.createElement('stop', { offset: '70%', stopColor: '#10B981', stopOpacity: '0.08' }),
          React.createElement('stop', { offset: '100%', stopColor: '#10B981', stopOpacity: '0.0' })
        )
      ),
      // Y Grid Lines & Labels
      current.yLabels.map((lbl, idx) => {
        const yPos = 48 + idx * 30;
        return React.createElement(
          'g',
          { key: `y-grid-${idx}` },
          React.createElement('line', {
            x1: 52,
            y1: yPos,
            x2: 468,
            y2: yPos,
            stroke: idx === 4 ? '#CBD5E1' : '#F1F5F9',
            strokeWidth: idx === 4 ? 1.5 : 1,
            strokeDasharray: idx === 4 ? undefined : '4,4',
          }),
          React.createElement(
            'text',
            {
              x: 46,
              y: yPos + 3.5,
              fill: '#94A3B8',
              fontSize: 10,
              fontWeight: '600',
              textAnchor: 'end',
              fontFamily: 'sans-serif',
            },
            lbl
          )
        );
      }),
      // Vertical Drop Lines
      current.pts.map((pt, idx) =>
        React.createElement('line', {
          key: `drop-${idx}`,
          x1: pt.x,
          y1: pt.y,
          x2: pt.x,
          y2: 168,
          stroke: '#E2E8F0',
          strokeWidth: 1.2,
          strokeDasharray: '3,3',
        })
      ),
      // Gradient Fill Area Under Curve
      React.createElement('path', {
        d: current.areaD,
        fill: 'url(#walletIncomeGradAct)',
      }),
      // Solid Modern Line
      React.createElement('path', {
        d: current.pathD,
        fill: 'none',
        stroke: '#059669',
        strokeWidth: 3.5,
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
      }),
      // Point Circles
      current.pts.map((pt, idx) =>
        React.createElement(
          'g',
          { key: `node-${idx}` },
          React.createElement('circle', {
            cx: pt.x,
            cy: pt.y,
            r: 7.5,
            fill: '#10B981',
            opacity: 0.22,
          }),
          React.createElement('circle', {
            cx: pt.x,
            cy: pt.y,
            r: pt.isPeak ? 5 : 4,
            fill: '#FFFFFF',
            stroke: '#059669',
            strokeWidth: pt.isPeak ? 2.8 : 2.2,
          })
        )
      ),
      // Point Value Badges (Every node displays exact amount)
      current.pts.map((pt, idx) => {
        if (pt.isPeak) {
          return React.createElement(
            'g',
            { key: `val-badge-${idx}` },
            React.createElement('rect', {
              x: pt.x - 44,
              y: pt.y - 25,
              width: 88,
              height: 19,
              rx: 9.5,
              fill: '#064E3B',
            }),
            React.createElement(
              'text',
              {
                x: pt.x,
                y: pt.y - 12,
                fill: '#FFFFFF',
                fontSize: 9.5,
                fontWeight: '800',
                textAnchor: 'middle',
                fontFamily: 'sans-serif',
              },
              `${pt.val} Peak`
            )
          );
        }
        return React.createElement(
          'g',
          { key: `val-badge-${idx}` },
          React.createElement('rect', {
            x: pt.x - 24,
            y: pt.y - 23,
            width: 48,
            height: 16,
            rx: 8,
            fill: '#FFFFFF',
            stroke: '#A7F3D0',
            strokeWidth: 1.2,
          }),
          React.createElement(
            'text',
            {
              x: pt.x,
              y: pt.y - 11.5,
              fill: '#065F46',
              fontSize: 9.5,
              fontWeight: '700',
              textAnchor: 'middle',
              fontFamily: 'sans-serif',
            },
            pt.val
          )
        );
      }),
      // X-Axis Labels
      current.pts.map((pt, idx) =>
        React.createElement(
          'text',
          {
            key: `xlbl-${idx}`,
            x: pt.x,
            y: 188,
            fill: '#64748B',
            fontSize: 9.5,
            fontWeight: '600',
            textAnchor: 'middle',
            fontFamily: 'sans-serif',
          },
          pt.label
        )
      )
    );
  };

  const renderNativeFallback = () => {
    return (
      <View style={styles.walletNativeChartContainer}>
        <View style={styles.walletNativeChartGrid}>
          {current.pts.map((pt, idx) => (
            <View key={`n-bar-${idx}`} style={styles.walletNativeBarCol}>
              <View style={[styles.walletNativeValBadge, pt.isPeak && styles.walletNativeValBadgePeak]}>
                <Text style={[styles.walletNativeValText, pt.isPeak && styles.walletNativeValTextPeak]}>
                  {pt.val}{pt.isPeak ? ' Peak' : ''}
                </Text>
              </View>
              <View style={[styles.walletNativeNodeDot, pt.isPeak && styles.walletNativeNodeDotPeak]} />
              <View style={styles.walletNativeDropLine} />
              <Text style={styles.walletNativeLabelText}>{pt.label}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.walletLineGraphCard}>
      {/* 1. Header Group */}
      <View style={styles.walletLineHeaderRow}>
        <View style={styles.walletLineTitleGroup}>
          <View style={styles.walletLineIconBox}>
            <Ionicons name="trending-up" size={17} color="#059669" />
          </View>
          <View>
            <Text style={styles.walletLineTitle}>{current.title}</Text>
            <Text style={styles.walletLineSub}>{current.subtitle}</Text>
          </View>
        </View>

        <View style={styles.walletGrowthBadge}>
          <Ionicons name="arrow-up" size={12} color="#065F46" />
          <Text style={styles.walletGrowthBadgeText}>{current.growth}</Text>
        </View>
      </View>

      {/* 2. Value and Timeframe Controls (Monthly / Yearly) */}
      <View style={styles.walletLineAmountRow}>
        <View>
          <Text style={styles.walletLineBigAmount}>{current.total}</Text>
          <Text style={styles.walletLineTotalNote}>{current.totalNote}</Text>
        </View>

        <View style={styles.walletTimeFilterRow}>
          {[
            { id: 'monthly', label: 'Monthly' },
            { id: 'yearly', label: 'Yearly' },
          ].map((tab) => {
            const isActive = activeRange === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                onPress={() => setActiveRange(tab.id)}
                style={[
                  styles.walletTimeFilterBtn,
                  isActive && styles.walletTimeFilterBtnActive,
                ]}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.walletTimeFilterText,
                    isActive && styles.walletTimeFilterTextActive,
                  ]}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* 3. The Literal Modern Graphical Line Graph */}
      <View style={styles.walletSvgChartContainer}>
        {Platform.OS === 'web' ? renderWebSvg() : renderNativeFallback()}
      </View>

      {/* 4. Bottom Metrics Highlights Correlating with Graph */}
      <View style={styles.walletChartFooterMetrics}>
        <View style={styles.walletFooterMetricItem}>
          <Text style={styles.walletFooterMetricValue}>{current.metrics[0].value}</Text>
          <Text style={styles.walletFooterMetricLabel}>{current.metrics[0].label}</Text>
        </View>
        <View style={styles.walletFooterMetricDivider} />
        <View style={styles.walletFooterMetricItem}>
          <Text style={styles.walletFooterMetricValue}>{current.metrics[1].value}</Text>
          <Text style={styles.walletFooterMetricLabel}>{current.metrics[1].label}</Text>
        </View>
        <View style={styles.walletFooterMetricDivider} />
        <View style={styles.walletFooterMetricItem}>
          <Text style={styles.walletFooterMetricValue}>{current.metrics[2].value}</Text>
          <Text style={styles.walletFooterMetricLabel}>{current.metrics[2].label}</Text>
        </View>
      </View>
    </View>
  );
}

export default function WalletScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, 16);
  const { transactions = [], transactionsLoading, reloadTransactions } = useSuyos();
  const { user } = useAuth();

  const providerTransactions = useMemo(
    () => (transactions || []).filter((t) => t.role === 'provider'),
    [transactions]
  );

  const hasLiveTransactions = providerTransactions.length > 0;
  const overallEarningsSum = useMemo(
    () => providerTransactions.reduce((sum, t) => sum + (t.rewardCentavos || 0), 0) / 100,
    [providerTransactions]
  );

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
        refNo: `SYL-EARN-${String(t.requestId || idx).slice(0, 6).toUpperCase()}`,
      };
    });
  }, [providerTransactions, hasLiveTransactions]);

  const todayEarnedList = dynamicEarnedList.filter((s) => s.date?.startsWith('Today'));
  const todayEarningsSum = todayEarnedList.reduce((sum, s) => sum + (Number(s.earnedAmount) || 0), 0);
  const todaySuyosCount = todayEarnedList.length;
  const overallSuyosCount = providerTransactions.length;
  const displayTotal = `₱${overallEarningsSum.toFixed(2)}`;

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
                <Ionicons name="wallet" size={17} color="#1E4D2B" />
              </View>
              <Text style={styles.walletHeroSuper}>SUYOLINK WALLET</Text>
            </View>
            <View style={styles.walletVerifiedPill}>
              <Ionicons name="checkmark-circle" size={13} color="#059669" />
              <Text style={styles.walletVerifiedPillText}>Verified User</Text>
            </View>
          </View>

          <Text style={styles.walletBalanceLabel}>Total Overall Earnings (2026)</Text>
          <Text style={styles.walletBalanceAmount}>{displayTotal}</Text>

          {/* 3 Interconnected Summary Items: Today Earnings, Today Suyos, Overall Suyos */}
          <View style={styles.walletSummaryRow}>
            <View style={styles.walletSummaryItem}>
              <Text style={styles.walletSummaryCount}>₱{todayEarningsSum.toFixed(2)}</Text>
              <Text style={styles.walletSummaryLabel}>Today Earnings</Text>
            </View>
            <View style={styles.walletSummaryDivider} />
            <View style={styles.walletSummaryItem}>
              <Text style={styles.walletSummaryCount}>{todaySuyosCount} Suyos</Text>
              <Text style={styles.walletSummaryLabel}>Today Suyos</Text>
            </View>
            <View style={styles.walletSummaryDivider} />
            <View style={styles.walletSummaryItem}>
              <Text style={styles.walletSummaryCount}>{overallSuyosCount} Suyos</Text>
              <Text style={styles.walletSummaryLabel}>Overall Suyos</Text>
            </View>
          </View>

          {/* Literal Modern Graphical Line Graph */}
          <WalletIncomeLineGraph totalOverride={displayTotal} hasTransactions={hasLiveTransactions} />

          {/* Informative Note: Direct Settlement Outside App */}
          <View style={styles.walletPaymentNoticeRow}>
            <Ionicons name="call" size={13} color="#059669" />
            <Text style={styles.walletPaymentNoticeText}>
              Payments are received directly via call & conversation with requesters outside the app.
            </Text>
          </View>
        </View>

        {/* 2. Section Header */}
        <View style={styles.walletSectionHeader}>
          <View>
            <Text style={styles.walletSectionTitle}>Accepted Suyo Earnings</Text>
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
                <Ionicons name="wallet-outline" size={32} color="#1E4D2B" />
              </View>
              <Text style={styles.walletEmptyTitle}>No suyo earnings yet</Text>
              <Text style={styles.walletEmptySub}>
                When you accept and complete suyos for others, your settled earnings and receipts will be recorded here.
              </Text>
            </View>
          ) : (
            dynamicEarnedList.map((item) => (
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
                      From:{' '}
                      <Text style={{ fontWeight: '700', color: '#163523' }}>
                        {item.requesterName}
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
                <Text style={styles.walletEarnedAmountText}>
                  +₱{Number(item.earnedAmount).toFixed(2)}
                </Text>
                <View style={styles.walletStatusChip}>
                  <Ionicons name="checkmark-circle" size={10} color="#15803D" />
                  <Text style={styles.walletStatusChipText}>{item.status}</Text>
                </View>
              </View>
            </View>
          )))}
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
    padding: 20,
    marginBottom: 16,
    shadowColor: '#1E4D2B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
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
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAF9',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 12,
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
    marginBottom: 3,
    textAlign: 'center',
  },
  walletSummaryLabel: {
    fontSize: 11,
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
  },
});
