import WalletWebChart from './chart/WalletWebChart';
import WalletNativeChart from './chart/WalletNativeChart';
import { definitions } from './chart/chart.styles.js';
import { calculateWalletChartData } from './chart/chartData.js';
import { useTheme } from '../../theme/ThemeContext';
import { resolvePaletteColor, themeStyles } from '../../theme/paletteAdapter';
import React, { useState, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function WalletIncomeLineGraph({
  transactions = [],
  totalOverride,
  hasTransactions,
}) {
  const { colors, isDark } = useTheme();
  const styles = useMemo(
    () => StyleSheet.create(themeStyles(definitions, colors, isDark)),
    [colors, isDark],
  );
  const resolveColor = (value, property = 'color') =>
    resolvePaletteColor(value, property, colors, isDark);
  const [activeRange, setActiveRange] = useState('monthly');

  const current = useMemo(() => {
    return calculateWalletChartData(transactions, activeRange);
  }, [transactions, activeRange]);

  return (
    <View style={styles.walletLineGraphCard}>
      {/* 1. Header Group */}
      <View style={styles.walletLineHeaderRow}>
        <View style={styles.walletLineTitleGroup}>
          <View style={styles.walletLineIconBox}>
            <Ionicons
              name="trending-up"
              size={17}
              color={resolveColor('#059669', 'color')}
            />
          </View>
          <View style={styles.walletLineTitleTextCol}>
            <Text
              style={styles.walletLineTitle}
              numberOfLines={1}
            >
              {current.title}
            </Text>
            <Text
              style={styles.walletLineSub}
              numberOfLines={1}
            >
              {current.subtitle}
            </Text>
          </View>
        </View>

        <View style={styles.walletGrowthBadge}>
          <Ionicons
            name="arrow-up"
            size={12}
            color={resolveColor('#065F46', 'color')}
          />
          <Text style={styles.walletGrowthBadgeText}>{current.growth}</Text>
        </View>
      </View>

      {/* 2. Value and Timeframe Controls (Monthly / Yearly) */}
      <View style={styles.walletLineAmountRow}>
        <View style={styles.walletLineAmountCol}>
          <Text
            style={styles.walletLineBigAmount}
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            {current.total}
          </Text>
          <Text
            style={styles.walletLineTotalNote}
            numberOfLines={1}
          >
            {current.totalNote}
          </Text>
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

      {/* 3. The Modern Graphical Line Graph */}
      <View style={styles.walletSvgChartContainer}>
        {Platform.OS === 'web' ? (
          <WalletWebChart
            current={current}
            resolveColor={resolveColor}
          />
        ) : (
          <WalletNativeChart
            current={current}
            styles={styles}
          />
        )}
      </View>

      {/* 4. Bottom Metrics Highlights */}
      <View style={styles.walletChartFooterMetrics}>
        {current.metrics.map((m, idx) => (
          <React.Fragment key={m.label || idx}>
            {idx > 0 && <View style={styles.walletFooterMetricDivider} />}
            <View style={styles.walletFooterMetricItem}>
              <Text
                style={styles.walletFooterMetricValue}
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                {m.value}
              </Text>
              <Text
                style={styles.walletFooterMetricLabel}
                numberOfLines={1}
              >
                {m.label}
              </Text>
            </View>
          </React.Fragment>
        ))}
      </View>
    </View>
  );
}

export { calculateWalletChartData } from './chart/chartData';
