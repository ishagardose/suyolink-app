import React from 'react';
import { Text, View } from 'react-native';

export default function WalletNativeChart({ current, styles }) {
  const maxVal = Math.max(...current.pts.map((p) => Number(p.amount) || 0), 10);
  return (
    <View style={styles.walletNativeChartContainer}>
      <View style={styles.walletNativeChartGrid}>
        {current.pts.map((pt, idx) => {
          const amt = Number(pt.amount) || 0;
          const barHeight = Math.max(
            16,
            Math.min(68, Math.round((amt / maxVal) * 68)),
          );
          const parts = pt.label ? pt.label.split(' ') : [pt.label];
          const mainLabel = parts[0] || pt.label;
          const subLabel = parts[1] ? parts[1].replace(/[()]/g, '') : null;
          return (
            <View
              key={`n-bar-${idx}`}
              style={styles.walletNativeBarCol}
            >
              <View
                style={[
                  styles.walletNativeValBadge,
                  pt.isPeak && styles.walletNativeValBadgePeak,
                ]}
              >
                <Text
                  style={[
                    styles.walletNativeValText,
                    pt.isPeak && styles.walletNativeValTextPeak,
                  ]}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                >
                  {pt.val}
                  {pt.isPeak ? ' ★' : ''}
                </Text>
              </View>
              <View
                style={[
                  styles.walletNativeNodeDot,
                  pt.isPeak && styles.walletNativeNodeDotPeak,
                ]}
              />
              <View
                style={[styles.walletNativeDropLine, { height: barHeight }]}
              />
              <Text
                style={styles.walletNativeLabelText}
                numberOfLines={1}
              >
                {mainLabel}
              </Text>
              {subLabel ? (
                <Text
                  style={styles.walletNativeSubLabelText}
                  numberOfLines={1}
                >
                  {subLabel}
                </Text>
              ) : null}
            </View>
          );
        })}
      </View>
    </View>
  );
}
