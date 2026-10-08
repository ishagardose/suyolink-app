import React from 'react';

export default function WalletWebChart({ current, resolveColor }) {
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
        React.createElement('stop', {
          offset: '0%',
          stopColor: resolveColor('#10B981', 'stopColor'),
          stopOpacity: '0.35',
        }),
        React.createElement('stop', {
          offset: '70%',
          stopColor: resolveColor('#10B981', 'stopColor'),
          stopOpacity: '0.08',
        }),
        React.createElement('stop', {
          offset: '100%',
          stopColor: resolveColor('#10B981', 'stopColor'),
          stopOpacity: '0.0',
        }),
      ),
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
          stroke:
            idx === 4
              ? resolveColor('#CBD5E1', 'borderColor')
              : resolveColor('#F1F5F9', 'borderColor'),
          strokeWidth: idx === 4 ? 1.5 : 1,
          strokeDasharray: idx === 4 ? undefined : '4,4',
        }),
        React.createElement(
          'text',
          {
            x: 46,
            y: yPos + 3.5,
            fill: resolveColor('#94A3B8', 'color'),
            fontSize: 10,
            fontWeight: '600',
            textAnchor: 'end',
            fontFamily: 'sans-serif',
          },
          lbl,
        ),
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
        stroke: resolveColor('#E2E8F0', 'borderColor'),
        strokeWidth: 1.2,
        strokeDasharray: '3,3',
      }),
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
      stroke: resolveColor('#059669', 'color'),
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
          fill: resolveColor('#10B981', 'backgroundColor'),
          opacity: 0.22,
        }),
        React.createElement('circle', {
          cx: pt.x,
          cy: pt.y,
          r: pt.isPeak ? 5 : 4,
          fill: resolveColor('#FFFFFF', 'backgroundColor'),
          stroke: resolveColor('#059669', 'color'),
          strokeWidth: pt.isPeak ? 2.8 : 2.2,
        }),
      ),
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
            fill: resolveColor('#064E3B', 'backgroundColor'),
          }),
          React.createElement(
            'text',
            {
              x: pt.x,
              y: pt.y - 12,
              fill: resolveColor('#FFFFFF', 'color'),
              fontSize: 9.5,
              fontWeight: '800',
              textAnchor: 'middle',
              fontFamily: 'sans-serif',
            },
            `${pt.val} Peak`,
          ),
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
          fill: resolveColor('#FFFFFF', 'backgroundColor'),
          stroke: resolveColor('#A7F3D0', 'borderColor'),
          strokeWidth: 1.2,
        }),
        React.createElement(
          'text',
          {
            x: pt.x,
            y: pt.y - 11.5,
            fill: resolveColor('#065F46', 'color'),
            fontSize: 9.5,
            fontWeight: '700',
            textAnchor: 'middle',
            fontFamily: 'sans-serif',
          },
          pt.val,
        ),
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
          fill: resolveColor('#64748B', 'color'),
          fontSize: 10,
          fontWeight: '600',
          textAnchor: 'middle',
          fontFamily: 'sans-serif',
        },
        pt.label,
      ),
    ),
  );
}
