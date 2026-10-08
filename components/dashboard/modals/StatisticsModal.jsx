import React from 'react';
import { Text, View, ScrollView, TouchableOpacity, Modal } from 'react-native';
import { useSuyos } from '../../../context/SuyoContext';
export default function StatisticsModal({
  isStatisticsModalOpen,
  setIsStatisticsModalOpen,
  styles,
  profileData,
}) {
  const { transactions, transactionsLoading, transactionsError } = useSuyos();
  const { rating, completedCount, reviews, loading, error } = profileData;
  const earned =
    transactions
      .filter((item) => item.role === 'provider')
      .reduce((sum, item) => sum + item.rewardCentavos, 0) / 100;
  return (
    <Modal
      visible={isStatisticsModalOpen}
      animationType="slide"
      transparent
      onRequestClose={() => setIsStatisticsModalOpen(false)}
    >
      <View style={styles.modalBackdrop}>
        <View style={styles.statsModalCard}>
          <View style={styles.modalHeaderRow}>
            <Text style={styles.modalTitle}>Suyo Statistics</Text>
          </View>
          <ScrollView
            style={styles.statsScrollView}
            contentContainerStyle={{ gap: 16, paddingBottom: 16 }}
          >
            {error || transactionsError ? (
              <Text
                accessibilityRole="alert"
                style={styles.statsTileSub}
              >
                {error || transactionsError}
              </Text>
            ) : null}
            <View style={styles.statsMetricsGrid}>
              <View style={styles.statsMetricTile}>
                <Text style={styles.statsTileValue}>
                  {transactionsLoading || transactionsError
                    ? '—'
                    : '₱' + earned.toFixed(2)}
                </Text>
                <Text style={styles.statsTileLabel}>
                  Confirmed task rewards
                </Text>
              </View>
              <View style={styles.statsMetricTile}>
                <Text style={styles.statsTileValue}>
                  {loading || error ? '—' : (completedCount ?? '—')}
                </Text>
                <Text style={styles.statsTileLabel}>Completed Suyos</Text>
              </View>
            </View>
            <View style={styles.statsCategoryCard}>
              <Text style={styles.statsSectionHeading}>
                {rating == null
                  ? 'No ratings yet'
                  : Number(rating).toFixed(2) + ' / 5'}
              </Text>
              <Text style={styles.statsSectionSubheading}>
                {loading || error
                  ? 'Reviews unavailable'
                  : reviews.length + ' reviews'}
              </Text>
              {[5, 4, 3, 2, 1].map((score) => {
                const count = reviews.filter(
                  (review) => Number(review.score) === score,
                ).length;
                const percent = reviews.length
                  ? Math.round((count / reviews.length) * 100)
                  : 0;
                return (
                  <View
                    key={score}
                    style={styles.csatBarRow}
                  >
                    <Text style={styles.csatStarText}>{score} ★</Text>
                    <View style={styles.csatTrack}>
                      <View
                        style={[styles.csatFill, { width: percent + '%' }]}
                      />
                    </View>
                    <Text style={styles.csatPctText}>
                      {percent}% ({count})
                    </Text>
                  </View>
                );
              })}
            </View>
            <Text style={styles.statsInfoNoticeText}>
              Payments are arranged outside SuyoLink. Reward records do not
              confirm payment receipt.
            </Text>
          </ScrollView>
          <TouchableOpacity
            accessibilityRole="button"
            style={styles.statsDoneButton}
            onPress={() => setIsStatisticsModalOpen(false)}
          >
            <Text style={styles.statsDoneButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
