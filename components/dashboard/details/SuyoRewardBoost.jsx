import React from 'react';
import { Text, View, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function SuyoRewardBoost({
  handleBoostReward,
  resolveColor,
  selectedSuyo,
  selectedSuyoContext,
  styles,
}) {
  return (
    selectedSuyoContext === 'posted' &&
    selectedSuyo.status !== 'Cancelled' && (
      <View style={styles.detailBoostCard}>
        <View style={styles.detailBoostHeader}>
          <View style={styles.detailBoostIconBox}>
            <Ionicons
              name="sparkles"
              size={15}
              color={resolveColor('#059669', 'color')}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.detailBoostTitle}>No one accepting yet?</Text>
            <Text style={styles.detailBoostSubtitle}>
              Boost your reward to get accepted faster by nearby doers:
            </Text>
          </View>
        </View>
        <View style={styles.detailBoostButtonsRow}>
          <TouchableOpacity
            style={[
              styles.detailBoostChip,
              selectedSuyo.currentBoost === 0 && styles.detailBoostChipGreen,
            ]}
            activeOpacity={0.75}
            accessibilityRole="button"
            accessibilityLabel="Reset reward boost"
            accessibilityState={{ selected: selectedSuyo.currentBoost === 0 }}
            aria-pressed={selectedSuyo.currentBoost === 0}
            onPress={() => handleBoostReward(selectedSuyo.id, 0)}
          >
            <Text
              style={[
                styles.detailBoostChipText,
                selectedSuyo.currentBoost === 0 && {
                  color: resolveColor('#FFFFFF', 'color'),
                },
              ]}
            >
              +₱0
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.detailBoostChip,
              selectedSuyo.currentBoost === 20 && styles.detailBoostChipGreen,
            ]}
            activeOpacity={0.75}
            accessibilityRole="button"
            accessibilityLabel="Boost reward by 20 pesos"
            accessibilityState={{ selected: selectedSuyo.currentBoost === 20 }}
            aria-pressed={selectedSuyo.currentBoost === 20}
            onPress={() => handleBoostReward(selectedSuyo.id, 20)}
          >
            <Text
              style={[
                styles.detailBoostChipText,
                selectedSuyo.currentBoost === 20 && {
                  color: resolveColor('#FFFFFF', 'color'),
                },
              ]}
            >
              +₱20
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.detailBoostChip,
              selectedSuyo.currentBoost === 50 && styles.detailBoostChipGreen,
            ]}
            activeOpacity={0.75}
            accessibilityRole="button"
            accessibilityLabel="Boost reward by 50 pesos"
            accessibilityState={{ selected: selectedSuyo.currentBoost === 50 }}
            aria-pressed={selectedSuyo.currentBoost === 50}
            onPress={() => handleBoostReward(selectedSuyo.id, 50)}
          >
            <Text
              style={[
                styles.detailBoostChipText,
                selectedSuyo.currentBoost === 50 && {
                  color: resolveColor('#FFFFFF', 'color'),
                },
              ]}
            >
              +₱50
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.detailBoostChip,
              selectedSuyo.currentBoost === 100 && styles.detailBoostChipGreen,
            ]}
            activeOpacity={0.75}
            accessibilityRole="button"
            accessibilityLabel="Boost reward by 100 pesos"
            accessibilityState={{ selected: selectedSuyo.currentBoost === 100 }}
            aria-pressed={selectedSuyo.currentBoost === 100}
            onPress={() => handleBoostReward(selectedSuyo.id, 100)}
          >
            <Text
              style={[
                styles.detailBoostChipText,
                selectedSuyo.currentBoost === 100 && {
                  color: resolveColor('#FFFFFF', 'color'),
                },
              ]}
            >
              +₱100
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    )
  );
}
