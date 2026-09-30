import React, { useState, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const INITIAL_ACTIVITY_RECORDS = [
  {
    id: 'ACT-001',
    refNo: 'SYL-REC-9842',
    title: 'Drop off documents - Unit 402',
    category: 'Documents',
    icon: 'document-text',
    date: 'Today · 4:00 PM',
    timestamp: Date.now() - 30 * 60 * 1000,
    role: 'requester',
    status: 'In Progress',
    amount: 300,
    platformFee: 20,
    totalAmount: 320,
    paymentMethod: 'GCash',
    paymentRef: 'GC-9842109841',
    doer: {
      name: 'Alex Morales',
      rating: '4.95★',
      phone: '+63 917 842 1983',
      vehicle: 'Honda Beat 125cc (Motorcycle)',
    },
    location: 'Makati CBD',
    hasProof: false,
    notes: 'Urgent contract document hand-off. Courier currently en route.',
  },
  {
    id: 'ACT-002',
    refNo: 'SYL-REC-9801',
    title: 'Buy groceries - SM Tagum',
    category: 'Groceries',
    icon: 'cart',
    date: 'Sep 28, 2026 · 12:15 PM',
    timestamp: Date.now() - 2 * 24 * 60 * 60 * 1000,
    role: 'requester',
    status: 'Completed',
    amount: 150,
    platformFee: 15,
    totalAmount: 165,
    paymentMethod: 'GCash',
    paymentRef: 'GC-8812903412',
    doer: {
      name: 'Alex Morales',
      rating: '4.95★',
      phone: '+63 917 842 1983',
      vehicle: 'Honda Beat 125cc (Motorcycle)',
    },
    location: 'SM Tagum',
    hasProof: true,
    proofDetails: 'Official supermarket register receipt & packed grocery bags verified.',
    notes: '2 cartons milk, wheat bread, and eggs delivered fresh.',
  },
  {
    id: 'ACT-003',
    refNo: 'SYL-REC-9755',
    title: 'Prescription pickup at Mercury Drug',
    category: 'Medicine',
    icon: 'medkit',
    date: 'Sep 26, 2026 · 3:45 PM',
    timestamp: Date.now() - 4 * 24 * 60 * 60 * 1000,
    role: 'doer',
    status: 'Completed',
    amount: 180,
    platformFee: 0,
    totalAmount: 180,
    paymentMethod: 'SuyoLink Wallet',
    paymentRef: 'SW-771920391',
    requesterName: 'Lola Remedios',
    requesterRating: '4.9★',
    location: 'Mercury Drug Legaspi',
    hasProof: true,
    proofDetails: 'Official pharmacy receipt & sealed prescription bag verified.',
    notes: 'Delivered maintenance cardiac medicine safely to senior citizen.',
  },
  {
    id: 'ACT-004',
    refNo: 'SYL-REC-9620',
    title: 'Print school project & binding',
    category: 'Documents',
    icon: 'print',
    date: 'Sep 20, 2026 · 3:15 PM',
    timestamp: Date.now() - 10 * 24 * 60 * 60 * 1000,
    role: 'requester',
    status: 'Completed',
    amount: 80,
    platformFee: 10,
    totalAmount: 90,
    paymentMethod: 'Cash on Delivery',
    paymentRef: 'COD-66210984',
    doer: {
      name: 'Carlos Dalisay',
      rating: '4.9★',
      phone: '+63 919 720 9144',
      vehicle: 'Yamaha Mio',
    },
    location: 'Davao Printing Hub',
    hasProof: true,
    proofDetails: 'Photo of bound 45-page thesis document verified.',
    notes: 'Delivered ahead of deadline, cleanly bound with cover sleeve.',
  },
  {
    id: 'ACT-005',
    refNo: 'SYL-REC-9510',
    title: 'Queue for Meralco bills payment',
    category: 'Queuing & Bills',
    icon: 'time',
    date: 'Sep 18, 2026 · 11:30 AM',
    timestamp: Date.now() - 12 * 24 * 60 * 60 * 1000,
    role: 'doer',
    status: 'Completed',
    amount: 250,
    platformFee: 0,
    totalAmount: 250,
    paymentMethod: 'SuyoLink Wallet',
    paymentRef: 'SW-651098231',
    requesterName: 'Kenneth Gomez',
    requesterRating: '4.8★',
    location: 'Bayad Center Ayala',
    hasProof: true,
    proofDetails: 'Machine-validated payment stamp slip photographed.',
    notes: 'Queued for 35 minutes, validated slip handed to client lobby desk.',
  },
  {
    id: 'ACT-006',
    refNo: 'SYL-REC-9402',
    title: 'Pick up notarized contract copy',
    category: 'Documents',
    icon: 'close-circle',
    date: 'Sep 15, 2026 · 2:10 PM',
    timestamp: Date.now() - 15 * 24 * 60 * 60 * 1000,
    role: 'requester',
    status: 'Refunded',
    amount: 200,
    platformFee: 0,
    totalAmount: 200,
    paymentMethod: 'GCash (Refunded)',
    paymentRef: 'REF-55102948',
    location: 'Makati CBD',
    hasProof: false,
    notes: 'Cancelled due to lawyer rescheduling. 100% refund credited back to GCash.',
  },
];

export default function ActivityScreen() {
  const router = useRouter();
  const [activityRecords] = useState(() => INITIAL_ACTIVITY_RECORDS);
  const [activityFilter, setActivityFilter] = useState('All');
  const [activitySearchQuery, setActivitySearchQuery] = useState('');
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [statementToast, setStatementToast] = useState(false);

  const filteredActivityRecords = useMemo(() => {
    let list = [...activityRecords];

    if (activityFilter === 'InProgress') {
      list = list.filter((item) => item.status === 'In Progress');
    } else if (activityFilter === 'Spending') {
      list = list.filter((item) => item.role === 'requester');
    } else if (activityFilter === 'Earnings') {
      list = list.filter((item) => item.role === 'doer');
    } else if (activityFilter === 'Completed') {
      list = list.filter((item) => item.status === 'Completed');
    }

    if (activitySearchQuery.trim()) {
      const q = activitySearchQuery.toLowerCase();
      list = list.filter(
        (item) =>
          item.title.toLowerCase().includes(q) ||
          item.refNo.toLowerCase().includes(q) ||
          (item.doer?.name && item.doer.name.toLowerCase().includes(q)) ||
          (item.requesterName && item.requesterName.toLowerCase().includes(q)) ||
          item.category.toLowerCase().includes(q)
      );
    }

    return list;
  }, [activityRecords, activityFilter, activitySearchQuery]);

  const activityStats = useMemo(() => {
    const totalSpent = activityRecords
      .filter((r) => r.role === 'requester' && r.status === 'Completed')
      .reduce((sum, r) => sum + r.totalAmount, 0);

    const totalEarned = activityRecords
      .filter((r) => r.role === 'doer' && r.status === 'Completed')
      .reduce((sum, r) => sum + r.totalAmount, 0);

    const inProgressCount = activityRecords.filter((r) => r.status === 'In Progress').length;
    const completedCount = activityRecords.filter((r) => r.status === 'Completed').length;

    return {
      totalSpent: `₱${totalSpent.toLocaleString()}`,
      totalEarned: `₱${totalEarned.toLocaleString()}`,
      inProgressCount,
      completedCount,
      timeSaved: '18.5 hrs',
    };
  }, [activityRecords]);

  const handleExportStatement = () => {
    setStatementToast(true);
    setTimeout(() => setStatementToast(false), 2500);
  };

  return (
    <SafeAreaView style={styles.safeContainer} edges={['top', 'left', 'right']}>
      <StatusBar style="dark" />

      {/* Top Navigation Bar */}
      <View style={styles.navBar}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/dashboard'))}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={22} color="#163523" />
        </TouchableOpacity>
        <Text style={styles.navBarTitle}>Activity & Ledger</Text>
        <TouchableOpacity
          style={styles.statementNavBtn}
          onPress={handleExportStatement}
          activeOpacity={0.75}
        >
          <Ionicons name="document-text-outline" size={17} color="#1E4D2B" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.contentScroll}
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section */}
        <View style={styles.heroCard}>
          <Text style={styles.heroSuper}>FINANCIAL LEDGER & AUDIT</Text>
          <Text style={styles.heroTitle}>Errand Activity & Receipts</Text>
          <Text style={styles.heroSub}>
            Transparent, permanent record of your errand spending, courier earnings, and verified digital receipts.
          </Text>
        </View>

        {/* Metrics Row */}
        <View style={styles.metricsRow}>
          <View style={styles.metricCard}>
            <View style={[styles.metricIconBox, { backgroundColor: '#FEE2E2' }]}>
              <Ionicons name="arrow-down-circle" size={17} color="#DC2626" />
            </View>
            <Text style={styles.metricValue}>{activityStats.totalSpent}</Text>
            <Text style={styles.metricLabel}>Total Spent</Text>
            <Text style={styles.metricSub}>Requested suyos</Text>
          </View>

          <View style={styles.metricCard}>
            <View style={[styles.metricIconBox, { backgroundColor: '#DCFCE7' }]}>
              <Ionicons name="arrow-up-circle" size={17} color="#15803D" />
            </View>
            <Text style={styles.metricValue}>{activityStats.totalEarned}</Text>
            <Text style={styles.metricLabel}>Total Earned</Text>
            <Text style={styles.metricSub}>Courier earnings</Text>
          </View>

          <View style={styles.metricCard}>
            <View style={[styles.metricIconBox, { backgroundColor: '#E0F2FE' }]}>
              <Ionicons name="time" size={17} color="#0284C7" />
            </View>
            <Text style={styles.metricValue}>{activityStats.timeSaved}</Text>
            <Text style={styles.metricLabel}>Time Saved</Text>
            <Text style={styles.metricSub}>Community run</Text>
          </View>
        </View>

        {/* Monthly Breakdown Card */}
        <View style={styles.breakdownCard}>
          <View style={styles.breakdownHeader}>
            <View>
              <Text style={styles.breakdownTitle}>Monthly Errand Breakdown</Text>
              <Text style={styles.breakdownSub}>Where your community errands were fulfilled</Text>
            </View>
            <View style={styles.trustPill}>
              <Ionicons name="shield-checkmark" size={12} color="#059669" />
              <Text style={styles.trustPillText}>100% Verified</Text>
            </View>
          </View>

          {/* Segmented Bar */}
          <View style={styles.segmentBar}>
            <View style={[styles.barSegment, { width: '45%', backgroundColor: '#059669' }]} />
            <View style={[styles.barSegment, { width: '30%', backgroundColor: '#0284C7' }]} />
            <View style={[styles.barSegment, { width: '15%', backgroundColor: '#D97706' }]} />
            <View style={[styles.barSegment, { width: '10%', backgroundColor: '#7C3AED' }]} />
          </View>

          {/* Legend */}
          <View style={styles.legendGrid}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#059669' }]} />
              <Text style={styles.legendText}>Groceries 45% (₱650)</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#0284C7' }]} />
              <Text style={styles.legendText}>Delivery 30% (₱430)</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#D97706' }]} />
              <Text style={styles.legendText}>Documents 15% (₱220)</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#7C3AED' }]} />
              <Text style={styles.legendText}>Queuing 10% (₱150)</Text>
            </View>
          </View>
        </View>

        {/* Filter Scroll */}
        <View style={styles.filterScrollBox}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
            {[
              { key: 'All', label: `All Activity (${activityRecords.length})` },
              { key: 'InProgress', label: `In Progress (${activityStats.inProgressCount})` },
              { key: 'Spending', label: 'Spent (Requester)' },
              { key: 'Earnings', label: 'Earned (Courier)' },
              { key: 'Completed', label: `Completed (${activityStats.completedCount})` },
            ].map((tab) => (
              <TouchableOpacity
                key={tab.key}
                style={[styles.filterChip, activityFilter === tab.key && styles.filterChipActive]}
                onPress={() => setActivityFilter(tab.key)}
                activeOpacity={0.75}
              >
                <Text style={[styles.filterChipText, activityFilter === tab.key && styles.filterChipTextActive]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Search Bar */}
        <View style={styles.searchBar}>
          <Ionicons name="search" size={16} color="#688676" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search reference #, errand, or courier..."
            placeholderTextColor="#8CA395"
            value={activitySearchQuery}
            onChangeText={setActivitySearchQuery}
          />
          {activitySearchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setActivitySearchQuery('')}>
              <Ionicons name="close-circle" size={16} color="#8FA497" />
            </TouchableOpacity>
          )}
        </View>

        {/* Records List */}
        <View style={styles.recordsList}>
          {filteredActivityRecords.length > 0 ? (
            filteredActivityRecords.map((item) => {
              const isInProgress = item.status === 'In Progress';
              const isCompleted = item.status === 'Completed';
              const isRefunded = item.status === 'Refunded';

              return (
                <View key={item.id} style={styles.activityCard}>
                  {/* Top Row */}
                  <View style={styles.cardTopRow}>
                    <View style={styles.cardCategoryBox}>
                      <View
                        style={[
                          styles.categoryIconWrap,
                          item.category === 'Groceries'
                            ? { backgroundColor: '#DCFCE7' }
                            : item.category === 'Medicine'
                            ? { backgroundColor: '#F3E8FF' }
                            : item.category === 'Documents'
                            ? { backgroundColor: '#E0F2FE' }
                            : { backgroundColor: '#FEF3C7' },
                        ]}
                      >
                        <Ionicons
                          name={item.icon || 'receipt'}
                          size={15}
                          color={
                            item.category === 'Groceries'
                              ? '#15803D'
                              : item.category === 'Medicine'
                              ? '#7E22CE'
                              : item.category === 'Documents'
                              ? '#0369A1'
                              : '#B45309'
                          }
                        />
                      </View>
                      <View>
                        <Text style={styles.categoryName}>{item.category}</Text>
                        <Text style={styles.recordDate}>{item.date}</Text>
                      </View>
                    </View>

                    {/* Status Pill */}
                    <View
                      style={[
                        styles.statusPill,
                        isInProgress
                          ? { backgroundColor: '#E0F2FE' }
                          : isCompleted
                          ? { backgroundColor: '#DCFCE7' }
                          : { backgroundColor: '#FEE2E2' },
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusPillText,
                          isInProgress
                            ? { color: '#0369A1' }
                            : isCompleted
                            ? { color: '#15803D' }
                            : { color: '#DC2626' },
                        ]}
                      >
                        {item.status}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.cardTitle}>{item.title}</Text>

                  {/* Metadata */}
                  <View style={styles.cardMetaCol}>
                    {item.doer && (
                      <View style={styles.metaRow}>
                        <Ionicons name="person-circle-outline" size={13} color="#163523" />
                        <Text style={styles.metaText}>
                          Courier:{' '}
                          <Text style={{ fontWeight: '700', color: '#163523' }}>{item.doer.name}</Text>{' '}
                          ({item.doer.rating}) · {item.doer.vehicle || 'Courier'}
                        </Text>
                      </View>
                    )}
                    {item.requesterName && (
                      <View style={styles.metaRow}>
                        <Ionicons name="person-circle-outline" size={13} color="#163523" />
                        <Text style={styles.metaText}>
                          Requester:{' '}
                          <Text style={{ fontWeight: '700', color: '#163523' }}>{item.requesterName}</Text>{' '}
                          ({item.requesterRating})
                        </Text>
                      </View>
                    )}
                    <View style={styles.metaRow}>
                      <Ionicons name="location-sharp" size={12} color="#0D9488" />
                      <Text style={styles.metaText}>{item.location}</Text>
                    </View>
                  </View>

                  {/* Financial Strip */}
                  <View style={styles.financialStrip}>
                    <View>
                      <Text style={styles.refText}>{item.refNo}</Text>
                      <Text style={styles.paymentMethod}>{item.paymentMethod}</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text
                        style={[
                          styles.amountText,
                          item.role === 'doer'
                            ? { color: '#15803D' }
                            : isRefunded
                            ? { color: '#64748B' }
                            : { color: '#163523' },
                        ]}
                      >
                        {item.role === 'doer' ? `+₱${item.totalAmount.toFixed(2)}` : `-₱${item.totalAmount.toFixed(2)}`}
                      </Text>
                      <Text style={styles.feeNote}>
                        {item.platformFee > 0 ? `Incl. ₱${item.platformFee} platform fee` : 'Direct Wallet Credit'}
                      </Text>
                    </View>
                  </View>

                  {/* Action Buttons */}
                  <View style={styles.cardActionsRow}>
                    <TouchableOpacity
                      style={styles.viewReceiptBtn}
                      onPress={() => setSelectedReceipt(item)}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="receipt-outline" size={14} color="#163523" />
                      <Text style={styles.viewReceiptBtnText}>View E-Receipt</Text>
                    </TouchableOpacity>

                    {isInProgress && (
                      <TouchableOpacity
                        style={styles.trackBtn}
                        onPress={() => router.push('/requester-fulfill')}
                        activeOpacity={0.8}
                      >
                        <Ionicons name="navigate" size={13} color="#FFFFFF" />
                        <Text style={styles.trackBtnText}>Track</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              );
            })
          ) : (
            <View style={styles.emptyCard}>
              <Ionicons name="receipt-outline" size={44} color="#A3B8AC" />
              <Text style={styles.emptyTitle}>No records found</Text>
              <Text style={styles.emptySub}>Transactions and digital receipts will appear here as errands are fulfilled.</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Digital Receipt Modal */}
      <Modal
        visible={Boolean(selectedReceipt)}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedReceipt(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.receiptCard}>
            <View style={styles.receiptHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="checkmark-done-circle" size={20} color="#15803D" />
                <Text style={styles.receiptHeaderTitle}>Official E-Receipt</Text>
              </View>
              <TouchableOpacity
                onPress={() => setSelectedReceipt(null)}
                style={styles.closeBtn}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={18} color="#163523" />
              </TouchableOpacity>
            </View>

            {selectedReceipt && (
              <ScrollView style={{ padding: 16 }} showsVerticalScrollIndicator={false}>
                <View style={styles.ticketBox}>
                  <Text style={styles.receiptBrand}>SUYOLINK PHILIPPINES</Text>
                  <Text style={styles.receiptBrandSub}>Community Errand & Courier Platform</Text>
                  <Text style={styles.receiptRefCode}>{selectedReceipt.refNo}</Text>

                  <View style={styles.dashedDivider} />

                  <View style={styles.receiptRow}>
                    <Text style={styles.rLabel}>Transaction Date:</Text>
                    <Text style={styles.rVal}>{selectedReceipt.date}</Text>
                  </View>
                  <View style={styles.receiptRow}>
                    <Text style={styles.rLabel}>Status:</Text>
                    <Text style={[styles.rVal, { color: '#15803D', fontWeight: '700' }]}>
                      {selectedReceipt.status} · Verified
                    </Text>
                  </View>
                  <View style={styles.receiptRow}>
                    <Text style={styles.rLabel}>Category:</Text>
                    <Text style={styles.rVal}>{selectedReceipt.category}</Text>
                  </View>
                  <View style={styles.receiptRow}>
                    <Text style={styles.rLabel}>Errand / Task:</Text>
                    <Text style={[styles.rVal, { flex: 1, textAlign: 'right' }]}>{selectedReceipt.title}</Text>
                  </View>
                  <View style={styles.receiptRow}>
                    <Text style={styles.rLabel}>Location:</Text>
                    <Text style={styles.rVal}>{selectedReceipt.location}</Text>
                  </View>

                  <View style={styles.dashedDivider} />

                  {selectedReceipt.doer && (
                    <View style={styles.receiptRow}>
                      <Text style={styles.rLabel}>Assigned Courier:</Text>
                      <Text style={styles.rVal}>{selectedReceipt.doer.name}</Text>
                    </View>
                  )}
                  {selectedReceipt.requesterName && (
                    <View style={styles.receiptRow}>
                      <Text style={styles.rLabel}>Requester:</Text>
                      <Text style={styles.rVal}>{selectedReceipt.requesterName}</Text>
                    </View>
                  )}
                  <View style={styles.receiptRow}>
                    <Text style={styles.rLabel}>Payment Method:</Text>
                    <Text style={styles.rVal}>{selectedReceipt.paymentMethod}</Text>
                  </View>
                  <View style={styles.receiptRow}>
                    <Text style={styles.rLabel}>Payment Ref #:</Text>
                    <Text style={styles.rVal}>{selectedReceipt.paymentRef}</Text>
                  </View>

                  <View style={styles.dashedDivider} />

                  <View style={styles.receiptRow}>
                    <Text style={styles.rLabel}>Base Errand Reward:</Text>
                    <Text style={styles.rVal}>₱{selectedReceipt.amount.toFixed(2)}</Text>
                  </View>
                  {selectedReceipt.platformFee > 0 && (
                    <View style={styles.receiptRow}>
                      <Text style={styles.rLabel}>Platform Convenience Fee:</Text>
                      <Text style={styles.rVal}>₱{selectedReceipt.platformFee.toFixed(2)}</Text>
                    </View>
                  )}

                  <View style={styles.totalStrip}>
                    <Text style={styles.totalStripLabel}>Total Amount:</Text>
                    <Text style={styles.totalStripVal}>₱{selectedReceipt.totalAmount.toFixed(2)}</Text>
                  </View>

                  <View style={styles.proofBadge}>
                    <Ionicons name="shield-checkmark" size={17} color="#059669" />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.proofTitle}>Proof of Delivery Verified</Text>
                      <Text style={styles.proofSub}>
                        {selectedReceipt.proofDetails || 'Cryptographically stamped photo & GPS handover verified.'}
                      </Text>
                    </View>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.doneBtn}
                  onPress={() => setSelectedReceipt(null)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.doneBtnText}>Done</Text>
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* Floating Statement Toast */}
      {statementToast && (
        <View style={styles.toastBox}>
          <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" />
          <Text style={styles.toastText}>Monthly activity statement downloaded</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: '#F8FAF8',
  },
  navBar: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E8EFEA',
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navBarTitle: {
    fontSize: 16.5,
    fontWeight: '800',
    color: '#163523',
  },
  statementNavBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#E8F5EE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentScroll: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  heroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2ECE5',
  },
  heroSuper: {
    fontSize: 11,
    fontWeight: '800',
    color: '#059669',
    letterSpacing: 0.8,
    marginBottom: 3,
  },
  heroTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#163523',
    marginBottom: 4,
  },
  heroSub: {
    fontSize: 12.5,
    color: '#557261',
    lineHeight: 17,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2ECE5',
  },
  metricIconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  metricValue: {
    fontSize: 15,
    fontWeight: '800',
    color: '#163523',
    marginBottom: 2,
  },
  metricLabel: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#2D4F38',
  },
  metricSub: {
    fontSize: 10.5,
    color: '#64748B',
    marginTop: 2,
  },
  breakdownCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 15,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2ECE5',
  },
  breakdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  breakdownTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#163523',
  },
  breakdownSub: {
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 2,
  },
  trustPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
  },
  trustPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
  },
  segmentBar: {
    height: 10,
    borderRadius: 5,
    flexDirection: 'row',
    overflow: 'hidden',
    marginBottom: 12,
    backgroundColor: '#F1F5F9',
  },
  barSegment: {
    height: '100%',
  },
  legendGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 11.5,
    color: '#334155',
    fontWeight: '600',
  },
  filterScrollBox: {
    marginBottom: 12,
  },
  filterScroll: {
    gap: 8,
    paddingRight: 10,
  },
  filterChip: {
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
  },
  filterChipActive: {
    backgroundColor: '#1E4D2B',
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#557261',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: '#D7EBE0',
    marginBottom: 16,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#163523',
    padding: 0,
  },
  recordsList: {
    gap: 12,
  },
  activityCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2ECE5',
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardCategoryBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  categoryIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#163523',
  },
  recordDate: {
    fontSize: 11,
    color: '#64748B',
  },
  statusPill: {
    paddingHorizontal: 9,
    paddingVertical: 3.5,
    borderRadius: 8,
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  cardTitle: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#163523',
    marginBottom: 8,
  },
  cardMetaCol: {
    gap: 4,
    marginBottom: 10,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  metaText: {
    fontSize: 12,
    color: '#557261',
  },
  financialStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8FAF9',
    borderRadius: 12,
    padding: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#EDF5F0',
  },
  refText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  paymentMethod: {
    fontSize: 11,
    color: '#163523',
    fontWeight: '600',
    marginTop: 2,
  },
  amountText: {
    fontSize: 14,
    fontWeight: '800',
  },
  feeNote: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 2,
  },
  cardActionsRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  viewReceiptBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E8F5EE',
    borderRadius: 10,
    paddingVertical: 9,
    gap: 5,
    borderWidth: 1,
    borderColor: '#CDE5D7',
  },
  viewReceiptBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#163523',
  },
  trackBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#059669',
    borderRadius: 10,
    paddingVertical: 9,
    gap: 5,
  },
  trackBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  emptyCard: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 32,
    borderWidth: 1,
    borderColor: '#E2ECE5',
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#163523',
    marginTop: 10,
    marginBottom: 4,
  },
  emptySub: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 17,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  receiptCard: {
    width: '100%',
    maxWidth: 420,
    maxHeight: '85%',
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    overflow: 'hidden',
  },
  receiptHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E2ECE5',
    backgroundColor: '#F8FAF9',
  },
  receiptHeaderTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#163523',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E8F5EE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ticketBox: {
    backgroundColor: '#FAFCFA',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#D7EBE0',
    marginBottom: 16,
  },
  receiptBrand: {
    fontSize: 13,
    fontWeight: '900',
    color: '#163523',
    letterSpacing: 1,
    textAlign: 'center',
  },
  receiptBrandSub: {
    fontSize: 11,
    color: '#059669',
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 4,
  },
  receiptRefCode: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginBottom: 12,
  },
  dashedDivider: {
    borderBottomWidth: 1,
    borderBottomColor: '#CBD5E1',
    borderStyle: 'dashed',
    marginVertical: 10,
  },
  receiptRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  rLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  rVal: {
    fontSize: 12.5,
    color: '#163523',
    fontWeight: '600',
  },
  totalStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#E8F5EE',
    borderRadius: 10,
    padding: 10,
    marginTop: 6,
    marginBottom: 10,
  },
  totalStripLabel: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#163523',
  },
  totalStripVal: {
    fontSize: 16,
    fontWeight: '900',
    color: '#15803D',
  },
  proofBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderRadius: 10,
    padding: 10,
    gap: 8,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  proofTitle: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#15803D',
  },
  proofSub: {
    fontSize: 10.5,
    color: '#557261',
    lineHeight: 14,
  },
  doneBtn: {
    backgroundColor: '#1E4D2B',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneBtnText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  toastBox: {
    position: 'absolute',
    bottom: 24,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E4D2B',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    gap: 8,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  toastText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
