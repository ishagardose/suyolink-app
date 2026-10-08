import React, { useState, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

function formatMoneyLabel(amount) {
  if (amount >= 1000) {
    const k = amount / 1000;
    return `₱${k % 1 === 0 ? k.toFixed(0) : k.toFixed(1)}k`;
  }
  return `₱${Math.round(amount)}`;
}

function formatMoneyBadge(amount) {
  if (amount >= 1000) {
    const k = amount / 1000;
    return `₱${k.toFixed(1)}k`;
  }
  return `₱${Math.round(amount)}`;
}

export function calculateWalletChartData(transactions = [], activeRange = 'monthly') {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];
  const currentMonthName = monthNames[currentMonth];

  const Y_TOP = 52;
  const Y_BOTTOM = 168;
  const X_COORDS = [95, 205, 315, 425];

  if (activeRange === 'monthly') {
    // 4 weeks of the current month
    const weekTotals = [0, 0, 0, 0];
    const weekCounts = [0, 0, 0, 0];

    (transactions || []).forEach((t) => {
      const dateStr = t.completedAt || t.created_at || t.createdAt;
      const d = dateStr ? new Date(dateStr) : null;
      if (!d || isNaN(d.getTime())) return;
      if (d.getFullYear() === currentYear && d.getMonth() === currentMonth) {
        const day = d.getDate();
        const amt = (Number(t.rewardCentavos) || 0) / 100;
        let wIdx = 0;
        if (day <= 7) wIdx = 0;
        else if (day <= 14) wIdx = 1;
        else if (day <= 21) wIdx = 2;
        else wIdx = 3;

        weekTotals[wIdx] += amt;
        weekCounts[wIdx] += 1;
      }
    });

    const total = weekTotals.reduce((a, b) => a + b, 0);
    const totalSuyos = weekCounts.reduce((a, b) => a + b, 0);
    const maxVal = Math.max(...weekTotals);
    const avg = total / 4;

    let peakIdx = -1;
    if (maxVal > 0) {
      peakIdx = weekTotals.indexOf(maxVal);
    }

    let yMax = 400;
    if (maxVal > 0) {
      if (maxVal <= 100) yMax = 100;
      else if (maxVal <= 200) yMax = 200;
      else if (maxVal <= 400) yMax = 400;
      else if (maxVal <= 600) yMax = 600;
      else if (maxVal <= 1000) yMax = 1000;
      else yMax = Math.ceil(maxVal / 500) * 500;
    }

    const weekLabels = ['W1 (1–7)', 'W2 (8–14)', 'W3 (15–21)', 'W4 (22+)'];

    const pts = weekTotals.map((val, idx) => {
      const ratio = yMax > 0 && maxVal > 0 ? Math.min(val / yMax, 1) : 0;
      const y = Y_BOTTOM - ratio * (Y_BOTTOM - Y_TOP);
      return {
        x: X_COORDS[idx],
        y: Math.round(y),
        val: `₱${val.toFixed(0)}`,
        label: weekLabels[idx],
        isPeak: idx === peakIdx && maxVal > 0,
        amount: val,
      };
    });

    // Smooth Bezier Curve Path
    let pathD = `M ${pts[0].x},${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const xc = (pts[i].x + pts[i + 1].x) / 2;
      pathD += ` C ${xc},${pts[i].y} ${xc},${pts[i + 1].y} ${pts[i + 1].x},${pts[i + 1].y}`;
    }
    const areaD = `${pathD} L ${pts[pts.length - 1].x},${Y_BOTTOM} L ${pts[0].x},${Y_BOTTOM} Z`;

    const yStep = yMax / 4;
    const yLabels = [
      formatMoneyLabel(yMax),
      formatMoneyLabel(yStep * 3),
      formatMoneyLabel(yStep * 2),
      formatMoneyLabel(yStep),
      '₱0',
    ];

    const peakWeekName = peakIdx >= 0 ? `W${peakIdx + 1}` : 'None';
    const peakWeekVal = peakIdx >= 0 ? `₱${weekTotals[peakIdx].toFixed(2)}` : '₱0.00';

    return {
      title: 'Monthly Income Trend',
      subtitle: `Weekly breakdown for ${currentMonthName} ${currentYear}`,
      total: `₱${total.toFixed(2)}`,
      totalNote: totalSuyos > 0
        ? `Total ${currentMonthName} Income (${totalSuyos} ${totalSuyos === 1 ? 'Suyo' : 'Suyos'})`
        : `No earnings recorded in ${currentMonthName} yet`,
      growth: total > 0 ? '+ Active' : '0.0%',
      pts,
      pathD,
      areaD,
      yLabels,
      metrics: [
        { label: `Peak (${peakWeekName})`, value: peakWeekVal },
        { label: 'Weekly Average', value: `₱${avg.toFixed(2)}` },
      ],
    };
  } else {
    // Yearly view: 4 quarters of current year
    const quarterTotals = [0, 0, 0, 0];
    const quarterCounts = [0, 0, 0, 0];

    (transactions || []).forEach((t) => {
      const dateStr = t.completedAt || t.created_at || t.createdAt;
      const d = dateStr ? new Date(dateStr) : null;
      if (!d || isNaN(d.getTime())) return;
      if (d.getFullYear() === currentYear) {
        const month = d.getMonth();
        const amt = (Number(t.rewardCentavos) || 0) / 100;
        let qIdx = 0;
        if (month <= 2) qIdx = 0;
        else if (month <= 5) qIdx = 1;
        else if (month <= 8) qIdx = 2;
        else qIdx = 3;

        quarterTotals[qIdx] += amt;
        quarterCounts[qIdx] += 1;
      }
    });

    const total = quarterTotals.reduce((a, b) => a + b, 0);
    const totalSuyos = quarterCounts.reduce((a, b) => a + b, 0);
    const maxVal = Math.max(...quarterTotals);
    const avg = total / 4;

    let peakIdx = -1;
    if (maxVal > 0) {
      peakIdx = quarterTotals.indexOf(maxVal);
    }

    let yMax = 1000;
    if (maxVal > 0) {
      if (maxVal <= 500) yMax = 500;
      else if (maxVal <= 1000) yMax = 1000;
      else if (maxVal <= 2000) yMax = 2000;
      else if (maxVal <= 5000) yMax = 5000;
      else yMax = Math.ceil(maxVal / 1000) * 1000;
    }

    const quarterLabels = ['Q1 (Jan–Mar)', 'Q2 (Apr–Jun)', 'Q3 (Jul–Sep)', 'Q4 (Oct–Dec)'];

    const pts = quarterTotals.map((val, idx) => {
      const ratio = yMax > 0 && maxVal > 0 ? Math.min(val / yMax, 1) : 0;
      const y = Y_BOTTOM - ratio * (Y_BOTTOM - Y_TOP);
      return {
        x: X_COORDS[idx],
        y: Math.round(y),
        val: formatMoneyBadge(val),
        label: quarterLabels[idx],
        isPeak: idx === peakIdx && maxVal > 0,
        amount: val,
      };
    });

    let pathD = `M ${pts[0].x},${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const xc = (pts[i].x + pts[i + 1].x) / 2;
      pathD += ` C ${xc},${pts[i].y} ${xc},${pts[i + 1].y} ${pts[i + 1].x},${pts[i + 1].y}`;
    }
    const areaD = `${pathD} L ${pts[pts.length - 1].x},${Y_BOTTOM} L ${pts[0].x},${Y_BOTTOM} Z`;

    const yStep = yMax / 4;
    const yLabels = [
      formatMoneyLabel(yMax),
      formatMoneyLabel(yStep * 3),
      formatMoneyLabel(yStep * 2),
      formatMoneyLabel(yStep),
      '₱0',
    ];

    const peakQName = peakIdx >= 0 ? `Q${peakIdx + 1}` : 'None';
    const peakQVal = peakIdx >= 0 ? `₱${quarterTotals[peakIdx].toFixed(2)}` : '₱0.00';

    return {
      title: 'Yearly Income Trend',
      subtitle: `Quarterly breakdown for ${currentYear}`,
      total: `₱${total.toFixed(2)}`,
      totalNote: totalSuyos > 0
        ? `Total ${currentYear} Annual Income (${totalSuyos} ${totalSuyos === 1 ? 'Suyo' : 'Suyos'})`
        : `No earnings recorded in ${currentYear} yet`,
      growth: total > 0 ? '+ Active' : '0.0%',
      pts,
      pathD,
      areaD,
      yLabels,
      metrics: [
        { label: `Peak (${peakQName})`, value: peakQVal },
        { label: 'Quarterly Avg', value: `₱${avg.toFixed(2)}` },
      ],
    };
  }
}

export default function WalletIncomeLineGraph({
  transactions = [],
  totalOverride,
  hasTransactions,
}) {
  const [activeRange, setActiveRange] = useState('monthly');

  const current = useMemo(() => {
    return calculateWalletChartData(transactions, activeRange);
  }, [transactions, activeRange]);

  const renderWebSvg = () => {
    return React.createElement(
      'svg',
      {
        viewBox: '0 0 500 200',
        width: '100%',
        height: '185',
        style: { width: '100%', height: 185, overflow: 'visible' },
      },
      React.createElement(
        'defs',
        null,
        React.createElement(
          'linearGradient',
          { id: 'walletIncomeGradShared', x1: '0', y1: '0', x2: '0', y2: '1' },
          React.createElement('stop', { offset: '0%', stopColor: '#10B981', stopOpacity: '0.35' }),
          React.createElement('stop', { offset: '70%', stopColor: '#10B981', stopOpacity: '0.08' }),
          React.createElement('stop', { offset: '100%', stopColor: '#10B981', stopOpacity: '0.0' })
        )
      ),
      // Y Grid Lines & Labels
      current.yLabels.map((lbl, idx) => {
        const yPos = 48 + idx * 30;
        return React.createElement(
          'g',
          { key: `y-grid-${idx}` },
          React.createElement('line', {
            x1: 52,
            y1: yPos,
            x2: 468,
            y2: yPos,
            stroke: idx === 4 ? '#CBD5E1' : '#F1F5F9',
            strokeWidth: idx === 4 ? 1.5 : 1,
            strokeDasharray: idx === 4 ? undefined : '4,4',
          }),
          React.createElement(
            'text',
            {
              x: 46,
              y: yPos + 3.5,
              fill: '#94A3B8',
              fontSize: 10,
              fontWeight: '600',
              textAnchor: 'end',
              fontFamily: 'sans-serif',
            },
            lbl
          )
        );
      }),
      // Vertical Drop Lines
      current.pts.map((pt, idx) =>
        React.createElement('line', {
          key: `drop-${idx}`,
          x1: pt.x,
          y1: pt.y,
          x2: pt.x,
          y2: 168,
          stroke: '#E2E8F0',
          strokeWidth: 1.2,
          strokeDasharray: '3,3',
        })
      ),
      // Gradient Fill Area Under Curve
      React.createElement('path', {
        d: current.areaD,
        fill: 'url(#walletIncomeGradShared)',
      }),
      // Solid Modern Line
      React.createElement('path', {
        d: current.pathD,
        fill: 'none',
        stroke: '#059669',
        strokeWidth: 3.5,
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
      }),
      // Point Circles
      current.pts.map((pt, idx) =>
        React.createElement(
          'g',
          { key: `node-${idx}` },
          React.createElement('circle', {
            cx: pt.x,
            cy: pt.y,
            r: 7.5,
            fill: '#10B981',
            opacity: 0.22,
          }),
          React.createElement('circle', {
            cx: pt.x,
            cy: pt.y,
            r: pt.isPeak ? 5 : 4,
            fill: '#FFFFFF',
            stroke: '#059669',
            strokeWidth: pt.isPeak ? 2.8 : 2.2,
          })
        )
      ),
      // Point Value Badges
      current.pts.map((pt, idx) => {
        if (pt.isPeak) {
          return React.createElement(
            'g',
            { key: `val-badge-${idx}` },
            React.createElement('rect', {
              x: pt.x - 44,
              y: pt.y - 25,
              width: 88,
              height: 19,
              rx: 9.5,
              fill: '#064E3B',
            }),
            React.createElement(
              'text',
              {
                x: pt.x,
                y: pt.y - 12,
                fill: '#FFFFFF',
                fontSize: 9.5,
                fontWeight: '800',
                textAnchor: 'middle',
                fontFamily: 'sans-serif',
              },
              `${pt.val} Peak`
            )
          );
        }
        return React.createElement(
          'g',
          { key: `val-badge-${idx}` },
          React.createElement('rect', {
            x: pt.x - 24,
            y: pt.y - 23,
            width: 48,
            height: 16,
            rx: 8,
            fill: '#FFFFFF',
            stroke: '#A7F3D0',
            strokeWidth: 1.2,
          }),
          React.createElement(
            'text',
            {
              x: pt.x,
              y: pt.y - 11.5,
              fill: '#065F46',
              fontSize: 9.5,
              fontWeight: '700',
              textAnchor: 'middle',
              fontFamily: 'sans-serif',
            },
            pt.val
          )
        );
      }),
      // X-Axis Labels
      current.pts.map((pt, idx) =>
        React.createElement(
          'text',
          {
            key: `x-lbl-${idx}`,
            x: pt.x,
            y: 188,
            fill: '#64748B',
            fontSize: 10,
            fontWeight: '600',
            textAnchor: 'middle',
            fontFamily: 'sans-serif',
          },
          pt.label
        )
      )
    );
  };

  const renderNativeFallback = () => {
    const maxVal = Math.max(...current.pts.map((p) => Number(p.amount) || 0), 10);
    return (
      <View style={styles.walletNativeChartContainer}>
        <View style={styles.walletNativeChartGrid}>
          {current.pts.map((pt, idx) => {
            const amt = Number(pt.amount) || 0;
            const barHeight = Math.max(16, Math.min(68, Math.round((amt / maxVal) * 68)));
            const parts = pt.label ? pt.label.split(' ') : [pt.label];
            const mainLabel = parts[0] || pt.label;
            const subLabel = parts[1] ? parts[1].replace(/[()]/g, '') : null;
            return (
              <View key={`n-bar-${idx}`} style={styles.walletNativeBarCol}>
                <View style={[styles.walletNativeValBadge, pt.isPeak && styles.walletNativeValBadgePeak]}>
                  <Text
                    style={[styles.walletNativeValText, pt.isPeak && styles.walletNativeValTextPeak]}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                  >
                    {pt.val}{pt.isPeak ? ' ★' : ''}
                  </Text>
                </View>
                <View style={[styles.walletNativeNodeDot, pt.isPeak && styles.walletNativeNodeDotPeak]} />
                <View style={[styles.walletNativeDropLine, { height: barHeight }]} />
                <Text style={styles.walletNativeLabelText} numberOfLines={1}>{mainLabel}</Text>
                {subLabel ? (
                  <Text style={styles.walletNativeSubLabelText} numberOfLines={1}>{subLabel}</Text>
                ) : null}
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.walletLineGraphCard}>
      {/* 1. Header Group */}
      <View style={styles.walletLineHeaderRow}>
        <View style={styles.walletLineTitleGroup}>
          <View style={styles.walletLineIconBox}>
            <Ionicons name="trending-up" size={17} color="#059669" />
          </View>
          <View style={styles.walletLineTitleTextCol}>
            <Text style={styles.walletLineTitle} numberOfLines={1}>{current.title}</Text>
            <Text style={styles.walletLineSub} numberOfLines={1}>{current.subtitle}</Text>
          </View>
        </View>

        <View style={styles.walletGrowthBadge}>
          <Ionicons name="arrow-up" size={12} color="#065F46" />
          <Text style={styles.walletGrowthBadgeText}>{current.growth}</Text>
        </View>
      </View>

      {/* 2. Value and Timeframe Controls (Monthly / Yearly) */}
      <View style={styles.walletLineAmountRow}>
        <View style={styles.walletLineAmountCol}>
          <Text style={styles.walletLineBigAmount} numberOfLines={1} adjustsFontSizeToFit>
            {current.total}
          </Text>
          <Text style={styles.walletLineTotalNote} numberOfLines={1}>
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
        {Platform.OS === 'web' ? renderWebSvg() : renderNativeFallback()}
      </View>

      {/* 4. Bottom Metrics Highlights */}
      <View style={styles.walletChartFooterMetrics}>
        {current.metrics.map((m, idx) => (
          <React.Fragment key={m.label || idx}>
            {idx > 0 && <View style={styles.walletFooterMetricDivider} />}
            <View style={styles.walletFooterMetricItem}>
              <Text style={styles.walletFooterMetricValue} numberOfLines={1} adjustsFontSizeToFit>
                {m.value}
              </Text>
              <Text style={styles.walletFooterMetricLabel} numberOfLines={1}>
                {m.label}
              </Text>
            </View>
          </React.Fragment>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  walletLineGraphCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E2EBE5',
    padding: 14,
    marginBottom: 16,
    shadowColor: '#163523',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  walletLineHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  walletLineTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    marginRight: 6,
  },
  walletLineTitleTextCol: {
    flex: 1,
  },
  walletLineIconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  walletLineTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#064E3B',
  },
  walletLineSub: {
    fontSize: 10.5,
    color: '#059669',
    fontWeight: '500',
  },
  walletGrowthBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  walletGrowthBadgeText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#065F46',
  },
  walletLineAmountRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0FDF4',
  },
  walletLineAmountCol: {
    flex: 1,
    marginRight: 8,
  },
  walletLineBigAmount: {
    fontSize: 22,
    fontWeight: '900',
    color: '#064E3B',
    letterSpacing: -0.5,
  },
  walletLineTotalNote: {
    fontSize: 11,
    color: '#059669',
    fontWeight: '600',
    marginTop: 2,
  },
  walletTimeFilterRow: {
    flexDirection: 'row',
    gap: 4,
    backgroundColor: '#F3F4F6',
    padding: 3,
    borderRadius: 9,
  },
  walletTimeFilterBtn: {
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 6,
  },
  walletTimeFilterBtnActive: {
    backgroundColor: '#059669',
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 1,
  },
  walletTimeFilterText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#6B7280',
  },
  walletTimeFilterTextActive: {
    color: '#FFFFFF',
  },
  walletSvgChartContainer: {
    width: '100%',
    height: 185,
    marginVertical: 4,
  },
  walletNativeChartContainer: {
    width: '100%',
    height: 165,
    marginVertical: 6,
    justifyContent: 'flex-end',
  },
  walletNativeChartGrid: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    height: 125,
    borderBottomWidth: 1,
    borderBottomColor: '#CBD5E1',
    paddingBottom: 4,
    paddingHorizontal: 2,
  },
  walletNativeBarCol: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 1,
  },
  walletNativeValBadge: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 7,
    marginBottom: 4,
    maxWidth: '100%',
  },
  walletNativeValBadgePeak: {
    backgroundColor: '#064E3B',
    borderColor: '#064E3B',
  },
  walletNativeValText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#065F46',
    textAlign: 'center',
  },
  walletNativeValTextPeak: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  walletNativeNodeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#059669',
    marginBottom: 3,
  },
  walletNativeNodeDotPeak: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#047857',
    borderWidth: 2,
    borderColor: '#A7F3D0',
  },
  walletNativeDropLine: {
    width: 1.5,
    backgroundColor: '#E2E8F0',
  },
  walletNativeLabelText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#475569',
    marginTop: 4,
    textAlign: 'center',
  },
  walletNativeSubLabelText: {
    fontSize: 8.5,
    fontWeight: '500',
    color: '#94A3B8',
    marginTop: 1,
    textAlign: 'center',
  },
  walletChartFooterMetrics: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAF9',
    borderRadius: 12,
    paddingVertical: 9,
    paddingHorizontal: 10,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#EDF5F1',
    gap: 8,
  },
  walletFooterMetricItem: {
    alignItems: 'center',
    flex: 1,
    paddingHorizontal: 2,
  },
  walletFooterMetricDivider: {
    width: 1,
    height: 22,
    backgroundColor: '#E2E8F0',
  },
  walletFooterMetricValue: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
  },
  walletFooterMetricLabel: {
    fontSize: 9.5,
    color: '#64748B',
    fontWeight: '600',
    marginTop: 2,
    textAlign: 'center',
  },
});
