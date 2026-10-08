import React from 'react';
import { Text, View, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function CompletedSuyosList({
  doerCompletedSuyos,
  doerNavTab,
  resolveColor,
  setSelectedDoerSuyo,
  styles,
}) {
  return (
    doerNavTab === 'completed' && (
      <View style={styles.doerListContainer}>
        {doerCompletedSuyos.length === 0 ? (
          <View style={styles.doerEmptyCard}>
            <View style={styles.doerEmptyIconCircle}>
              <Ionicons
                name="checkmark-done"
                size={28}
                color={resolveColor('#059669', 'color')}
              />
            </View>
            <Text style={styles.doerEmptyTitle}>No Completed Suyos Yet</Text>
            <Text style={styles.doerEmptySub}>
              Fulfill suyos as a doer to see your completed history and earned
              rewards.
            </Text>
          </View>
        ) : (
          doerCompletedSuyos.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.doerCompletedCard}
              activeOpacity={0.88}
              onPress={() => setSelectedDoerSuyo(item)}
            >
              <View style={styles.doerCompletedLeft}>
                <View style={styles.doerCompletedIconCircle}>
                  <Ionicons
                    name={item.icon || 'checkmark-done'}
                    size={18}
                    color={resolveColor('#059669', 'color')}
                  />
                </View>
                <View style={styles.doerCompletedTextCol}>
                  <Text
                    style={styles.doerCompletedTitle}
                    numberOfLines={1}
                  >
                    {item.title}
                  </Text>
                  <Text style={styles.doerCompletedRequester}>
                    From: {item.requesterName}
                  </Text>
                  <View style={styles.doerCompletedMetaRow}>
                    <Ionicons
                      name="time-outline"
                      size={12}
                      color={resolveColor('#8CA395', 'color')}
                    />
                    <Text style={styles.doerCompletedDate}>{item.date}</Text>
                    <Text style={styles.doerDot}>•</Text>
                    <Text
                      style={styles.doerCompletedLocation}
                      numberOfLines={1}
                    >
                      {item.location}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.doerCompletedRight}>
                <Text style={styles.doerCompletedEarned}>
                  +₱{Number(item.earnedAmount).toFixed(2)}
                </Text>
                <View style={styles.doerCompletedRatingBadge}>
                  <Ionicons
                    name="star"
                    size={10}
                    color={resolveColor('#F59E0B', 'color')}
                  />
                  <Text style={styles.doerCompletedRatingText}>5.0★</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}
      </View>
    )
  );
}
