import React from 'react';
import { Text, View, ScrollView, TouchableOpacity, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function StatisticsModal({
  isStatisticsModalOpen,
  resolveColor,
  setIsStatisticsModalOpen,
  styles,
}) {
  return (
    <Modal
      visible={isStatisticsModalOpen}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setIsStatisticsModalOpen(false)}
    >
      <View style={styles.modalBackdrop}>
        <View style={styles.statsModalCard}>
          <View style={styles.modalHeaderRow}>
            <View
              style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}
            >
              <View style={styles.statsIconBadge}>
                <Ionicons
                  name="stats-chart"
                  size={17}
                  color={resolveColor('#0284C7', 'color')}
                />
              </View>
              <Text style={styles.modalTitle}>Suyo Statistics</Text>
            </View>
            <TouchableOpacity
              onPress={() => setIsStatisticsModalOpen(false)}
              style={styles.modalCloseButton}
              activeOpacity={0.7}
            >
              <Ionicons
                name="close"
                size={20}
                color={resolveColor('#163523', 'color')}
              />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            style={styles.statsScrollView}
            contentContainerStyle={{ paddingBottom: 4 }}
          >
            {/* Top Overview Cards: 2x2 Grid */}
            <View style={styles.statsMetricsGrid}>
              <View style={styles.statsMetricTile}>
                <Text style={styles.statsTileValue}>₱1,280.00</Text>
                <Text style={styles.statsTileLabel}>Total Tracked</Text>
                <Text style={styles.statsTileSub}>7 Accepted Suyos</Text>
              </View>
              <View style={styles.statsMetricTile}>
                <Text
                  style={[
                    styles.statsTileValue,
                    { color: resolveColor('#059669', 'color') },
                  ]}
                >
                  100%
                </Text>
                <Text style={styles.statsTileLabel}>Completion</Text>
                <Text style={styles.statsTileSub}>0 Cancellations</Text>
              </View>
            </View>

            <View style={[styles.statsMetricsGrid, { marginTop: 8 }]}>
              <View style={styles.statsMetricTile}>
                <Text style={styles.statsTileValue}>4.95★</Text>
                <Text style={styles.statsTileLabel}>Customer Rating</Text>
                <Text style={styles.statsTileSub}>142 Reviews</Text>
              </View>
              <View style={styles.statsMetricTile}>
                <Text
                  style={[
                    styles.statsTileValue,
                    { color: resolveColor('#059669', 'color') },
                  ]}
                >
                  99.4%
                </Text>
                <Text style={styles.statsTileLabel}>Satisfaction</Text>
                <Text style={styles.statsTileSub}>Positive Feedback</Text>
              </View>
            </View>

            {/* Customer Satisfaction Breakdown Graph */}
            <View style={styles.statsCategoryCard}>
              <View style={styles.statsCategoryHeaderRow}>
                <View style={{ flex: 1, paddingRight: 6 }}>
                  <Text style={styles.statsSectionHeading}>
                    Customer Satisfaction
                  </Text>
                  <Text style={styles.statsSectionSubheading}>
                    Community ratings (142 reviews)
                  </Text>
                </View>
                <View style={styles.statsSatisfactionScoreBadge}>
                  <Ionicons
                    name="star"
                    size={12}
                    color={resolveColor('#F59E0B', 'color')}
                  />
                  <Text style={styles.statsSatisfactionScoreText}>
                    4.95 / 5.0
                  </Text>
                </View>
              </View>

              {/* Rating Distribution Bar Graph */}
              <View style={styles.csatBarsContainer}>
                {/* 5 Stars */}
                <View style={styles.csatBarRow}>
                  <View style={styles.csatStarLabelRow}>
                    <Text style={styles.csatStarText}>5</Text>
                    <Ionicons
                      name="star"
                      size={10}
                      color={resolveColor('#F59E0B', 'color')}
                    />
                  </View>
                  <View style={styles.csatTrack}>
                    <View
                      style={[
                        styles.csatFill,
                        {
                          width: '94%',
                          backgroundColor: resolveColor(
                            '#059669',
                            'backgroundColor',
                          ),
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.csatPctText}>94% (134)</Text>
                </View>

                {/* 4 Stars */}
                <View style={styles.csatBarRow}>
                  <View style={styles.csatStarLabelRow}>
                    <Text style={styles.csatStarText}>4</Text>
                    <Ionicons
                      name="star"
                      size={10}
                      color={resolveColor('#F59E0B', 'color')}
                    />
                  </View>
                  <View style={styles.csatTrack}>
                    <View
                      style={[
                        styles.csatFill,
                        {
                          width: '5%',
                          backgroundColor: resolveColor(
                            '#0284C7',
                            'backgroundColor',
                          ),
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.csatPctText}>5% (7)</Text>
                </View>

                {/* 3 Stars */}
                <View style={styles.csatBarRow}>
                  <View style={styles.csatStarLabelRow}>
                    <Text style={styles.csatStarText}>3</Text>
                    <Ionicons
                      name="star"
                      size={10}
                      color={resolveColor('#F59E0B', 'color')}
                    />
                  </View>
                  <View style={styles.csatTrack}>
                    <View
                      style={[
                        styles.csatFill,
                        {
                          width: '1%',
                          backgroundColor: resolveColor(
                            '#D97706',
                            'backgroundColor',
                          ),
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.csatPctText}>1% (1)</Text>
                </View>

                {/* 2 Stars */}
                <View style={styles.csatBarRow}>
                  <View style={styles.csatStarLabelRow}>
                    <Text style={styles.csatStarText}>2</Text>
                    <Ionicons
                      name="star"
                      size={10}
                      color={resolveColor('#CBD5E1', 'color')}
                    />
                  </View>
                  <View style={styles.csatTrack}>
                    <View
                      style={[
                        styles.csatFill,
                        {
                          width: '0%',
                          backgroundColor: resolveColor(
                            '#94A3B8',
                            'backgroundColor',
                          ),
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.csatPctText}>0% (0)</Text>
                </View>

                {/* 1 Star */}
                <View style={styles.csatBarRow}>
                  <View style={styles.csatStarLabelRow}>
                    <Text style={styles.csatStarText}>1</Text>
                    <Ionicons
                      name="star"
                      size={10}
                      color={resolveColor('#CBD5E1', 'color')}
                    />
                  </View>
                  <View style={styles.csatTrack}>
                    <View
                      style={[
                        styles.csatFill,
                        {
                          width: '0%',
                          backgroundColor: resolveColor(
                            '#94A3B8',
                            'backgroundColor',
                          ),
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.csatPctText}>0% (0)</Text>
                </View>
              </View>

              {/* Key Satisfaction Metric Badges */}
              <View style={styles.csatHighlightsRow}>
                <View style={styles.csatHighlightChip}>
                  <Ionicons
                    name="checkmark-circle"
                    size={12}
                    color={resolveColor('#059669', 'color')}
                  />
                  <Text
                    style={styles.csatHighlightText}
                    numberOfLines={1}
                  >
                    Punctual (98%)
                  </Text>
                </View>
                <View style={styles.csatHighlightChip}>
                  <Ionicons
                    name="shield-checkmark"
                    size={12}
                    color={resolveColor('#0284C7', 'color')}
                  />
                  <Text
                    style={styles.csatHighlightText}
                    numberOfLines={1}
                  >
                    Careful (99%)
                  </Text>
                </View>
              </View>
            </View>

            {/* Payment & Settlement Note */}
            <View style={styles.statsInfoNotice}>
              <Ionicons
                name="call-outline"
                size={14}
                color={resolveColor('#1E4D2B', 'color')}
              />
              <Text style={styles.statsInfoNoticeText}>
                All payment settlements are arranged directly between requesters
                and doers via call or conversation outside the app.
              </Text>
            </View>
          </ScrollView>

          <TouchableOpacity
            style={styles.statsDoneButton}
            onPress={() => setIsStatisticsModalOpen(false)}
            activeOpacity={0.8}
          >
            <Text style={styles.statsDoneButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
