import React from 'react';
import {
  CATEGORY_OPTIONS,
  URGENCY_OPTIONS,
  CATEGORY_CONFIG,
  URGENCY_CONFIG,
} from '../data/dashboardData';
import { Text, View, ScrollView, TouchableOpacity, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export default function DashboardFilterModal({
  currentDistanceKm,
  handleDecreaseDistance,
  handleIncreaseDistance,
  handleResetModalFilters,
  isFilterModalOpen,
  resolveColor,
  selectedCategory,
  selectedUrgency,
  setIsFilterModalOpen,
  setSelectedCategory,
  setSelectedUrgency,
  styles,
}) {
  return (
    <Modal
      visible={isFilterModalOpen}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setIsFilterModalOpen(false)}
    >
      <View style={styles.modalBackdrop}>
        <View style={styles.filterModalCard}>
          <View style={styles.modalHeaderRow}>
            <View
              style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}
            >
              <Ionicons
                name="options-outline"
                size={20}
                color={resolveColor('#163523', 'color')}
              />
              <Text style={styles.modalTitle}>Filter Suyos</Text>
            </View>
            <TouchableOpacity
              onPress={() => setIsFilterModalOpen(false)}
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
            style={{ maxHeight: 420 }}
          >
            {/* Category Pills */}
            <Text style={styles.filterSectionLabel}>Category</Text>
            <View style={styles.filterPillsWrap}>
              {CATEGORY_OPTIONS.map((cat) => {
                const isSelected = selectedCategory === cat;
                const config =
                  cat === 'All' ? CATEGORY_CONFIG.All : CATEGORY_CONFIG.default;

                if (isSelected) {
                  return (
                    <TouchableOpacity
                      key={cat}
                      activeOpacity={0.75}
                      onPress={() => setSelectedCategory(cat)}
                    >
                      <LinearGradient
                        colors={config.gradient.map((value) =>
                          resolveColor(value, 'backgroundColor'),
                        )}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={[
                          styles.filterPillGradient,
                          { borderColor: config.border },
                        ]}
                      >
                        <Text
                          style={[
                            styles.filterPillText,
                            { color: config.text, fontWeight: '700' },
                          ]}
                        >
                          {cat}
                        </Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  );
                }

                return (
                  <TouchableOpacity
                    key={cat}
                    style={styles.filterPill}
                    activeOpacity={0.75}
                    onPress={() => setSelectedCategory(cat)}
                  >
                    <Text style={styles.filterPillText}>{cat}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Urgency */}
            <Text style={styles.filterSectionLabel}>Urgency</Text>
            <View style={styles.filterPillsWrap}>
              {URGENCY_OPTIONS.map((urg) => {
                const isSelected = selectedUrgency === urg;
                const config = URGENCY_CONFIG[urg] || URGENCY_CONFIG.Normal;

                if (isSelected) {
                  return (
                    <TouchableOpacity
                      key={urg}
                      activeOpacity={0.75}
                      onPress={() => setSelectedUrgency(urg)}
                    >
                      <LinearGradient
                        colors={config.gradient.map((value) =>
                          resolveColor(value, 'backgroundColor'),
                        )}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={[
                          styles.filterPillGradient,
                          { borderColor: config.border },
                        ]}
                      >
                        <Text
                          style={[
                            styles.filterPillText,
                            { color: config.text, fontWeight: '700' },
                          ]}
                        >
                          {urg}
                        </Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  );
                }

                return (
                  <TouchableOpacity
                    key={urg}
                    style={styles.filterPill}
                    activeOpacity={0.75}
                    onPress={() => setSelectedUrgency(urg)}
                  >
                    <Text style={styles.filterPillText}>{urg}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Distance Radius */}
            <Text style={styles.filterSectionLabel}>Distance Radius</Text>
            <View style={styles.distanceStepperContainer}>
              <TouchableOpacity
                style={[
                  styles.distanceStepperArrowBtn,
                  currentDistanceKm === 'Any' &&
                    styles.distanceStepperArrowBtnDisabled,
                ]}
                activeOpacity={0.7}
                onPress={handleDecreaseDistance}
                disabled={currentDistanceKm === 'Any'}
              >
                <Ionicons
                  name="chevron-back"
                  size={16}
                  color={
                    currentDistanceKm === 'Any'
                      ? resolveColor('#B8CCC0', 'color')
                      : resolveColor('#1E4D2B', 'color')
                  }
                />
              </TouchableOpacity>

              <View style={styles.distanceStepperDisplay}>
                <Text style={styles.distanceStepperValueText}>
                  {currentDistanceKm === 'Any'
                    ? 'Any distance'
                    : `${currentDistanceKm} km`}
                </Text>
                <Text style={styles.distanceStepperSubText}>
                  {currentDistanceKm === 'Any'
                    ? 'All suyos'
                    : `0 - ${currentDistanceKm} km`}
                </Text>
              </View>

              <TouchableOpacity
                style={styles.distanceStepperArrowBtn}
                activeOpacity={0.7}
                onPress={handleIncreaseDistance}
              >
                <Ionicons
                  name="chevron-forward"
                  size={16}
                  color={resolveColor('#1E4D2B', 'color')}
                />
              </TouchableOpacity>
            </View>
          </ScrollView>

          <View style={styles.filterModalButtonsRow}>
            <TouchableOpacity
              style={styles.filterResetButton}
              onPress={handleResetModalFilters}
              activeOpacity={0.7}
            >
              <Text style={styles.filterResetButtonText}>Reset</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.filterApplyButton}
              onPress={() => setIsFilterModalOpen(false)}
              activeOpacity={0.8}
            >
              <Text style={styles.filterApplyButtonText}>Apply filters</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
