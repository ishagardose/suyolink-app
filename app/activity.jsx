import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const WALLET_EARNED_SUYOS = [
  {
    id: 'WAL-001',
    title: 'Drop off documents - Unit 402',
    category: 'Documents',
    icon: 'document-text',
    date: 'Today · 4:00 PM',
    requesterName: 'Atty. Rafael Cruz',
    location: 'Makati CBD, Tower 1',
    earnedAmount: 300,
    status: 'Credited',
    paymentMethod: 'Direct Wallet Credit',
    refNo: 'SYL-EARN-9842',
  },
  {
    id: 'WAL-002',
    title: 'Buy groceries - SM Tagum',
    category: 'Groceries',
    icon: 'cart',
    date: 'Sep 28 · 12:15 PM',
    requesterName: 'Maria Clarissa',
    location: 'SM Tagum Supermarket',
    earnedAmount: 150,
    status: 'Credited',
    paymentMethod: 'Direct Wallet Credit',
    refNo: 'SYL-EARN-9801',
  },
  {
    id: 'WAL-003',
    title: 'Prescription pickup at Mercury Drug',
    category: 'Medicine',
    icon: 'medkit',
    date: 'Sep 26 · 3:45 PM',
    requesterName: 'Lola Remedios',
    location: 'Mercury Drug Legaspi',
    earnedAmount: 180,
    status: 'Credited',
    paymentMethod: 'Direct Wallet Credit',
    refNo: 'SYL-EARN-9755',
  },
  {
    id: 'WAL-004',
    title: 'Queue for Meralco bills payment',
    category: 'Queuing & Bills',
    icon: 'time',
    date: 'Sep 18 · 11:30 AM',
    requesterName: 'Kenneth Gomez',
    location: 'Bayad Center Ayala',
    earnedAmount: 250,
    status: 'Credited',
    paymentMethod: 'Direct Wallet Credit',
    refNo: 'SYL-EARN-9510',
  },
  {
    id: 'WAL-005',
    title: 'Pick up medical supplies & vitamins',
    category: 'Delivery',
    icon: 'bag-check-outline',
    date: 'Sep 12 · 2:30 PM',
    requesterName: 'Mrs. Angela Santos',
    location: 'Generika Drugstore',
    earnedAmount: 180,
    status: 'Credited',
    paymentMethod: 'Direct Wallet Credit',
    refNo: 'SYL-EARN-9321',
  },
  {
    id: 'WAL-006',
    title: 'Print school project & binding',
    category: 'Documents',
    icon: 'print',
    date: 'Sep 05 · 4:15 PM',
    requesterName: 'Dave B. (Student)',
    location: 'Davao Printing Hub',
    earnedAmount: 120,
    status: 'Credited',
    paymentMethod: 'Direct Wallet Credit',
    refNo: 'SYL-EARN-9120',
  },
  {
    id: 'WAL-007',
    title: 'Express parcel delivery to Greenbelt',
    category: 'Delivery',
    icon: 'bicycle',
    date: 'Aug 29 · 10:00 AM',
    requesterName: 'Patricia Mendoza',
    location: 'Greenbelt 5 Concierge',
    earnedAmount: 100,
    status: 'Credited',
    paymentMethod: 'Direct Wallet Credit',
    refNo: 'SYL-EARN-8940',
  },
];

export default function WalletScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, 16);

  const totalEarned = WALLET_EARNED_SUYOS.reduce((sum, item) => sum + item.earnedAmount, 0);

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
              <Text style={styles.walletVerifiedPillText}>Verified Doer</Text>
            </View>
          </View>

          <Text style={styles.walletBalanceLabel}>Total Earned Balance</Text>
          <Text style={styles.walletBalanceAmount}>₱{totalEarned.toFixed(2)}</Text>

          <View style={styles.walletSummaryRow}>
            <View style={styles.walletSummaryItem}>
              <Text style={styles.walletSummaryCount}>{WALLET_EARNED_SUYOS.length}</Text>
              <Text style={styles.walletSummaryLabel}>Accepted Suyos</Text>
            </View>
            <View style={styles.walletSummaryDivider} />
            <View style={styles.walletSummaryItem}>
              <Text style={styles.walletSummaryCount}>100%</Text>
              <Text style={styles.walletSummaryLabel}>Payout Rate</Text>
            </View>
            <View style={styles.walletSummaryDivider} />
            <View style={styles.walletSummaryItem}>
              <Text style={styles.walletSummaryCount}>₱0</Text>
              <Text style={styles.walletSummaryLabel}>Deductions</Text>
            </View>
          </View>
        </View>

        {/* 2. Section Header: Just the Lists */}
        <View style={styles.walletSectionHeader}>
          <View>
            <Text style={styles.walletSectionTitle}>Accepted Suyo Earnings</Text>
            <Text style={styles.walletSectionSub}>
              Rewards earned from each accepted suyo request
            </Text>
          </View>
          <View style={styles.walletCountChip}>
            <Text style={styles.walletCountChipText}>
              {WALLET_EARNED_SUYOS.length} earned
            </Text>
          </View>
        </View>

        {/* 3. The Clean List of Earned Accepted Suyo Requests */}
        <View style={styles.walletListWrapper}>
          {WALLET_EARNED_SUYOS.map((item) => (
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
          ))}
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
    height: 54,
    backgroundColor: '#1E4D2B',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  headerRightPlaceholder: {
    width: 38,
  },
  contentScroll: {
    flex: 1,
    backgroundColor: '#F8FAF9',
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  walletHeroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E2ECE5',
    elevation: 2,
    shadowColor: '#163523',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },
  walletHeroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  walletBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  walletIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#EAF4EF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  walletHeroSuper: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1E4D2B',
    letterSpacing: 0.8,
  },
  walletVerifiedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    borderRadius: 12,
    paddingHorizontal: 9,
    paddingVertical: 4,
    gap: 4,
  },
  walletVerifiedPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
  },
  walletBalanceLabel: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#557261',
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
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#EDF5F0',
  },
  walletSummaryItem: {
    alignItems: 'center',
    flex: 1,
  },
  walletSummaryCount: {
    fontSize: 15,
    fontWeight: '800',
    color: '#163523',
    marginBottom: 2,
  },
  walletSummaryLabel: {
    fontSize: 11,
    color: '#557261',
    fontWeight: '600',
  },
  walletSummaryDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#D7EBE0',
  },
  walletSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    paddingHorizontal: 2,
  },
  walletSectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#163523',
    marginBottom: 2,
  },
  walletSectionSub: {
    fontSize: 11.5,
    color: '#557261',
  },
  walletCountChip: {
    backgroundColor: '#EAF4EF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#CDE5D7',
  },
  walletCountChipText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#1E4D2B',
  },
  walletListWrapper: {
    gap: 10,
  },
  walletItemCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2ECE5',
    elevation: 1,
    shadowColor: '#163523',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
  },
  walletItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: 10,
    gap: 12,
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
    gap: 3,
  },
  walletItemTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#163523',
  },
  walletItemMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  walletItemRequesterText: {
    fontSize: 12,
    color: '#557261',
  },
  walletItemDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
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
});
