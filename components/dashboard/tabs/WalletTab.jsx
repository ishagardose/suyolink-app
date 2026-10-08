import React from 'react';
import { Text, View, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import WalletIncomeLineGraph from '../../wallet/WalletIncomeLineGraph';

export default function WalletTab({
  activeTab,
  displayWalletTotal,
  dynamicWalletList,
  monthlySuyosCount,
  overallSuyosCount,
  providerTransactions,
  resolveColor,
  setActiveTab,
  styles,
  todayDateFormatted,
  todayEarningsSum,
  todaySuyosCount,
}) {
  return (
    (activeTab === 'wallet' || activeTab === 'activity') && (
      <View style={styles.walletMainWrapper}>
        {/* Top Back Nav when opened from Sidebar */}
        <TouchableOpacity
          style={styles.walletReturnHeaderBtn}
          activeOpacity={0.75}
          onPress={() => setActiveTab('home')}
        >
          <Ionicons
            name="arrow-back"
            size={16}
            color={resolveColor('#1E4D2B', 'color')}
          />
          <Text style={styles.walletReturnHeaderText}>Back to Dashboard</Text>
        </TouchableOpacity>

        {/* 1. Wallet Balance Hero Header */}
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
                name="checkmark-circle"
                size={13}
                color={resolveColor('#059669', 'color')}
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
            totalOverride={displayWalletTotal}
            hasTransactions={providerTransactions.length > 0}
          />

          {/* Informative Note: Direct Settlement Outside App */}
          <View style={styles.walletPaymentNoticeRow}>
            <Ionicons
              name="call"
              size={13}
              color={resolveColor('#059669', 'color')}
            />
            <Text style={styles.walletPaymentNoticeText}>
              Payments are received directly via call & conversation with
              requesters outside the app.
            </Text>
          </View>
        </View>

        {/* 2. Section Header: Just the Lists */}
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
              {dynamicWalletList.length} earned ({displayWalletTotal})
            </Text>
          </View>
        </View>

        {/* 3. The Clean List of Earned Accepted Suyo Requests */}
        <View style={styles.walletListWrapper}>
          {dynamicWalletList.length === 0 ? (
            <View style={styles.doerEmptyCard}>
              <View style={styles.doerEmptyIconCircle}>
                <Ionicons
                  name="wallet-outline"
                  size={28}
                  color={resolveColor('#1E4D2B', 'color')}
                />
              </View>
              <Text style={styles.doerEmptyTitle}>No Suyo Earnings Yet</Text>
              <Text style={styles.doerEmptySub}>
                When you accept and complete suyos for others, your settled
                earnings and receipts will appear here.
              </Text>
            </View>
          ) : (
            dynamicWalletList.map((item) => (
              <View
                key={item.id}
                style={styles.walletItemCard}
              >
                <View style={styles.walletItemLeft}>
                  <View
                    style={[
                      styles.walletCategoryIconCircle,
                      item.category === 'Groceries'
                        ? {
                            backgroundColor: resolveColor(
                              '#DCFCE7',
                              'backgroundColor',
                            ),
                          }
                        : item.category === 'Medicine'
                          ? {
                              backgroundColor: resolveColor(
                                '#F3E8FF',
                                'backgroundColor',
                              ),
                            }
                          : item.category === 'Documents'
                            ? {
                                backgroundColor: resolveColor(
                                  '#E0F2FE',
                                  'backgroundColor',
                                ),
                              }
                            : item.category === 'Queuing & Bills'
                              ? {
                                  backgroundColor: resolveColor(
                                    '#FEF3C7',
                                    'backgroundColor',
                                  ),
                                }
                              : {
                                  backgroundColor: resolveColor(
                                    '#EAF4EF',
                                    'backgroundColor',
                                  ),
                                },
                    ]}
                  >
                    <Ionicons
                      name={item.icon || 'receipt'}
                      size={18}
                      color={
                        item.category === 'Groceries'
                          ? resolveColor('#15803D', 'color')
                          : item.category === 'Medicine'
                            ? resolveColor('#7E22CE', 'color')
                            : item.category === 'Documents'
                              ? resolveColor('#0369A1', 'color')
                              : item.category === 'Queuing & Bills'
                                ? resolveColor('#B45309', 'color')
                                : resolveColor('#1E4D2B', 'color')
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
                        From:{' '}
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
                  <Text style={styles.walletEarnedAmountText}>
                    +₱{Number(item.earnedAmount).toFixed(2)}
                  </Text>
                  <View style={styles.walletStatusChip}>
                    <Ionicons
                      name="checkmark-circle"
                      size={10}
                      color={resolveColor('#15803D', 'color')}
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
      </View>
    )
  );
}
