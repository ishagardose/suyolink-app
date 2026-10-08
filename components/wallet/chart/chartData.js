export function formatMoneyLabel(amount) {
  if (amount >= 1000) {
    const k = amount / 1000;
    return `₱${k % 1 === 0 ? k.toFixed(0) : k.toFixed(1)}k`;
  }
  return `₱${Math.round(amount)}`;
}

export function formatMoneyBadge(amount) {
  if (amount >= 1000) {
    const k = amount / 1000;
    return `₱${k.toFixed(1)}k`;
  }
  return `₱${Math.round(amount)}`;
}

export function calculateWalletChartData(
  transactions = [],
  activeRange = 'monthly',
) {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
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
    const peakWeekVal =
      peakIdx >= 0 ? `₱${weekTotals[peakIdx].toFixed(2)}` : '₱0.00';

    return {
      title: 'Monthly Income Trend',
      subtitle: `Weekly breakdown for ${currentMonthName} ${currentYear}`,
      total: `₱${total.toFixed(2)}`,
      totalNote:
        totalSuyos > 0
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

    const quarterLabels = [
      'Q1 (Jan–Mar)',
      'Q2 (Apr–Jun)',
      'Q3 (Jul–Sep)',
      'Q4 (Oct–Dec)',
    ];

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
    const peakQVal =
      peakIdx >= 0 ? `₱${quarterTotals[peakIdx].toFixed(2)}` : '₱0.00';

    return {
      title: 'Yearly Income Trend',
      subtitle: `Quarterly breakdown for ${currentYear}`,
      total: `₱${total.toFixed(2)}`,
      totalNote:
        totalSuyos > 0
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
