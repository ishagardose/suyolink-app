import { createActivityStyles } from './activity.styles';
import { useTheme } from '../../theme/ThemeContext';
import { resolvePaletteColor } from '../../theme/paletteAdapter';
import React, { useState, useMemo } from 'react';
import {
  Text,
  View,
  ScrollView,
  TouchableOpacity,
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
import { useSuyos } from '../../context/SuyoContext';
import { useAuth } from '../../context/AuthContext';
import WalletIncomeLineGraph from './WalletIncomeLineGraph';

export default function WalletScreen({ embedded = false, onBack } = {}) {
  const { colors, isDark } = useTheme();
  const styles = useMemo(
    () => createActivityStyles(colors, isDark),
    [colors, isDark],
  );
  const resolveColor = (value, property = 'color') =>
    resolvePaletteColor(value, property, colors, isDark);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, 16);
  const {
    transactions = [],
    transactionsLoading,
    transactionsError,
    reloadTransactions,
    completedSuyos = [],
    doerCompletedSuyos = [],
    requests = [],
  } = useSuyos();
  const { user } = useAuth();

  // Authoritative provider (earnings) transactions from backend + completed doer suyos
  const allProviderTransactions = useMemo(() => {
    const list = [...(transactions || []).filter((t) => t.role === 'provider')];
    (doerCompletedSuyos || []).forEach((ds) => {
      if (!list.some((t) => t.requestId === ds.id)) {
        list.push({
          requestId: ds.id,
          title: ds.title,
          role: 'provider',
          otherUserId: ds.requesterId,
          otherUserName: ds.requesterName || 'Requester',
          rewardCentavos: Math.round((Number(ds.reward) || 0) * 100),
          currency: 'PHP',
          completedAt: ds.completedAt || ds.updatedAt || ds.createdAt,
          category: ds.category || 'General',
          location: ds.barangay
            ? `${ds.barangay}${ds.city ? `, ${ds.city}` : ''}`
            : (ds.location || 'Local Suyo'),
        });
      }
    });
    return list;
  }, [transactions, doerCompletedSuyos]);

  // Authoritative requester (spent) transactions from backend + completed posted suyos
  const allSpentTransactions = useMemo(() => {
    const list = [...(transactions || []).filter((t) => t.role === 'requester')];
    (completedSuyos || []).forEach((cs) => {
      if (!list.some((t) => t.requestId === cs.id)) {
        list.push({
          requestId: cs.id,
          title: cs.title,
          role: 'requester',
          otherUserId: cs.providerId,
          otherUserName: cs.providerName || 'Doer',
          rewardCentavos: Math.round((Number(cs.reward) || 0) * 100),
          currency: 'PHP',
          completedAt: cs.completedAt || cs.updatedAt || cs.createdAt,
          category: cs.category || 'General',
          location: cs.barangay
            ? `${cs.barangay}${cs.city ? `, ${cs.city}` : ''}`
            : (cs.location || 'Local Suyo'),
        });
      }
    });
    return list;
  }, [transactions, completedSuyos]);

  // Normalized dynamic list from live user transactions and behaviour
  const dynamicList = useMemo(() => {
    const all = [...allProviderTransactions, ...allSpentTransactions];
    // Sort descending by completion timestamp
    all.sort((a, b) => {
      const da = new Date(a.completedAt || 0).getTime();
      const db = new Date(b.completedAt || 0).getTime();
      return db - da;
    });

    return all.map((t, idx) => {
      const isProvider = t.role === 'provider';
      const d = t.completedAt ? new Date(t.completedAt) : null;
      const isToday =
        d &&
        !isNaN(d.getTime()) &&
        d.toDateString() === new Date().toDateString();
      const dateStr =
        d && !isNaN(d.getTime())
          ? isToday
            ? `Today · ${d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`
            : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
          : 'Recently';

      // Look up matching live request details from backend
      const req = (requests || []).find((r) => r.id === t.requestId);
      const category = req?.category || t.category || 'General';
      const location = req?.barangay
        ? `${req.barangay}${req.city ? `, ${req.city}` : ''}`
        : (req?.location || t.location || 'Direct Handshake');

      return {
        id: t.requestId ? `${t.requestId}_${t.role || 'tx'}` : `TX-${idx}`,
        requestId: t.requestId,
        role: t.role || 'provider',
        title:
          req?.title ||
          t.title ||
          (isProvider ? 'Completed Suyo Task' : 'Requested Suyo Errand'),
        category,
        icon:
          category === 'Groceries'
            ? 'cart'
            : category === 'Medicine'
              ? 'medkit'
              : category === 'Delivery'
                ? 'bicycle'
                : 'document-text',
        date: dateStr,
        isToday: Boolean(isToday),
        requesterName:
          req?.requesterName ||
          t.otherUserName ||
          (isProvider ? 'Requester' : 'Doer'),
        location,
        earnedAmount: (Number(t.rewardCentavos) || 0) / 100,
        status: req?.status === 'completed' ? 'Completed' : 'Task completed',
      };
    });
  }, [allProviderTransactions, allSpentTransactions, requests]);

  const displayedList = dynamicList;

  const todayEarnedList = allProviderTransactions.filter((s) => {
    const d = s.completedAt ? new Date(s.completedAt) : null;
    return (
      d &&
      !isNaN(d.getTime()) &&
      d.toDateString() === new Date().toDateString()
    );
  });
  const todayEarningsSum = todayEarnedList.reduce(
    (sum, s) => sum + (Number(s.rewardCentavos) || 0) / 100,
    0,
  );
  const todaySuyosCount = todayEarnedList.length;
  const overallSuyosCount = allProviderTransactions.length;

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const todayDateFormatted = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${currentYear}`;

  const monthlySuyosCount = useMemo(() => {
    return allProviderTransactions.filter((t) => {
      const dateStr = t.completedAt || t.created_at || t.createdAt;
      const d = dateStr ? new Date(dateStr) : null;
      return (
        d &&
        !isNaN(d.getTime()) &&
        d.getFullYear() === currentYear &&
        d.getMonth() === currentMonth
      );
    }).length;
  }, [allProviderTransactions, currentYear, currentMonth]);

  const Container = embedded ? View : SafeAreaView;
  const Content = embedded ? View : ScrollView;
  return (
    <Container
      {...(!embedded ? { edges: ['top'] } : {})}
      style={styles.safeContainer}
    >
      <StatusBar style="light" />

      {/* Top Navigation Header */}
      <View style={styles.headerBar}>
        <TouchableOpacity
          onPress={() =>
            onBack
              ? onBack()
              : router.canGoBack()
                ? router.back()
                : router.replace('/dashboard')
          }
          style={styles.backButton}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons
            name="arrow-back"
            size={24}
            color={resolveColor('#FFFFFF', 'color')}
          />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Wallet</Text>

        <TouchableOpacity
          onPress={() => router.push('/transactions')}
          style={styles.headerReceiptButton}
          activeOpacity={0.75}
          accessibilityLabel="Transaction History"
        >
          <Ionicons
            name="receipt-outline"
            size={22}
            color={resolveColor('#FFFFFF', 'color')}
          />
        </TouchableOpacity>
      </View>

      <Content
        style={
          embedded
            ? [styles.contentContainer, { paddingBottom: bottomInset + 30 }]
            : styles.contentScroll
        }
        contentContainerStyle={[
          styles.contentContainer,
          { paddingBottom: bottomInset + 30 },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={Boolean(transactionsLoading)}
            onRefresh={reloadTransactions}
            tintColor={resolveColor('#059669', 'tintColor')}
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
                  color={resolveColor('#1E4D2B', 'color')}
                />
              </View>
              <Text style={styles.walletHeroSuper}>SUYOLINK WALLET</Text>
            </View>
            <View style={styles.walletVerifiedPill}>
              <Ionicons
                name={user?.emailVerified ? 'checkmark-circle' : 'mail-outline'}
                size={13}
                color={resolveColor('#059669', 'color')}
              />
              <Text style={styles.walletVerifiedPillText}>
                {user?.emailVerified ? 'Email verified' : 'Email unverified'}
              </Text>
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
              name="checkmark-circle-outline"
              size={13}
              color={resolveColor('#059669', 'color')}
            />
            <Text style={styles.walletPaymentNoticeText}>
              Authoritative rewards recorded for confirmed completed tasks.
              Settled directly between requester and doer.
            </Text>
          </View>
        </View>

        {/* Literal Modern Graphical Line Graph & Statistics Table - Full Width Standalone Tile */}
        <WalletIncomeLineGraph transactions={allProviderTransactions} />

        {/* 2. Unified Transactions Tile (Earnings & Spending in One Tile) */}
        <View style={styles.walletUnifiedTile}>
          <View style={styles.walletTileHeader}>
            <View style={styles.walletTileTitleRow}>
              <View style={styles.walletTileIconBox}>
                <Ionicons
                  name="swap-horizontal"
                  size={16}
                  color={resolveColor('#1E4D2B', 'color')}
                />
              </View>
              <View>
                <Text style={styles.walletTileTitle}>Transactions</Text>
                <Text style={styles.walletTileSub}>
                  Earnings & errand spending ({dynamicList.length})
                </Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={() => router.push('/transactions')}
              style={styles.walletTileHistoryLink}
              activeOpacity={0.75}
            >
              <Text style={styles.walletTileHistoryText}>Full History</Text>
              <Ionicons
                name="chevron-forward"
                size={12}
                color={resolveColor('#059669', 'color')}
              />
            </TouchableOpacity>
          </View>

          {transactionsLoading && dynamicList.length === 0 ? (
            <View style={styles.walletEmptyInsideTile}>
              <ActivityIndicator color={resolveColor('#1E4D2B', 'color')} />
            </View>
          ) : transactionsError && dynamicList.length === 0 ? (
            <View style={styles.walletEmptyInsideTile}>
              <Text style={styles.walletEmptyTitle}>
                Could not load wallet
              </Text>
              <Text
                accessibilityRole="alert"
                style={styles.walletEmptySub}
              >
                {transactionsError}
              </Text>
              <TouchableOpacity
                accessibilityRole="button"
                style={styles.emptyActionBtn}
                onPress={reloadTransactions}
              >
                <Text style={styles.emptyActionBtnText}>Retry wallet</Text>
              </TouchableOpacity>
            </View>
          ) : dynamicList.length === 0 ? (
            <View style={styles.walletEmptyInsideTile}>
              <View style={styles.walletEmptyIconCircle}>
                <Ionicons
                  name="wallet-outline"
                  size={32}
                  color={resolveColor('#1E4D2B', 'color')}
                />
              </View>
              <Text style={styles.walletEmptyTitle}>
                No suyo earnings yet
              </Text>
              <Text style={styles.walletEmptySub}>
                Your earnings from completed suyos and spending from posted requests will appear here.
              </Text>
              <TouchableOpacity
                style={styles.emptyActionBtn}
                activeOpacity={0.8}
                onPress={() => router.push('/dashboard')}
              >
                <Ionicons
                  name="compass-outline"
                  size={15}
                  color={resolveColor('#FFFFFF', 'color')}
                />
                <Text style={styles.emptyActionBtnText}>
                  Browse Available Suyos
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.walletTileList}>
              {dynamicList.map((item, index) => {
                const isEarning = item.role === 'provider';
                const isLast = index === dynamicList.length - 1;
                return (
                  <View
                    key={item.id}
                    style={[
                      styles.walletTileRow,
                      !isLast && styles.walletTileRowBorder,
                    ]}
                  >
                    <View style={styles.walletItemLeft}>
                      <View
                        style={[
                          styles.walletCategoryIconCircle,
                          {
                            backgroundColor: isEarning
                              ? resolveColor('#EAF4EF', 'backgroundColor')
                              : resolveColor('#FEE2E2', 'backgroundColor'),
                          },
                        ]}
                      >
                        <Ionicons
                          name={isEarning ? 'arrow-down-circle' : 'arrow-up-circle'}
                          size={20}
                          color={
                            isEarning
                              ? resolveColor('#15803D', 'color')
                              : resolveColor('#DC2626', 'color')
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
                            color={resolveColor('#557261', 'color')}
                          />
                          <Text style={styles.walletItemRequesterText}>
                            {isEarning ? 'From:' : 'To:'}{' '}
                            <Text
                              style={{
                                fontWeight: '700',
                                color: resolveColor('#163523', 'color'),
                              }}
                            >
                              {item.requesterName}
                            </Text>
                          </Text>
                        </View>

                        <View style={styles.walletItemDateRow}>
                          <Ionicons
                            name="time-outline"
                            size={12}
                            color={resolveColor('#8CA395', 'color')}
                          />
                          <Text style={styles.walletItemDateText}>{item.date}</Text>
                          <Text style={styles.walletItemDot}>•</Text>
                          <Ionicons
                            name="location-outline"
                            size={12}
                            color={resolveColor('#8CA395', 'color')}
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
                      <Text
                        style={[
                          styles.walletEarnedAmountText,
                          !isEarning && { color: resolveColor('#DC2626', 'color') },
                        ]}
                      >
                        {isEarning ? '+' : '−'}₱
                        {Number(item.earnedAmount).toFixed(2)}
                      </Text>
                      <View
                        style={[
                          styles.walletStatusChip,
                          !isEarning && {
                            backgroundColor: resolveColor('#FEE2E2', 'backgroundColor'),
                          },
                        ]}
                      >
                        <Ionicons
                          name={isEarning ? 'checkmark-circle' : 'arrow-up'}
                          size={10}
                          color={
                            isEarning
                              ? resolveColor('#15803D', 'color')
                              : resolveColor('#DC2626', 'color')
                          }
                        />
                        <Text
                          style={[
                            styles.walletStatusChipText,
                            !isEarning && {
                              color: resolveColor('#DC2626', 'color'),
                            },
                          ]}
                        >
                          {isEarning ? 'Earned' : 'Spent'}
                        </Text>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </Content>
    </Container>
  );
}
