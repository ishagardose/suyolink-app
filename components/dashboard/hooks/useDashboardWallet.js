import { useMemo } from 'react';

export default function useDashboardWallet({ transactions }) {
  const providerTransactions = useMemo(
    () => (transactions || []).filter((t) => t.role === 'provider'),
    [transactions],
  );

  const overallEarningsSum = useMemo(
    () =>
      providerTransactions.reduce(
        (sum, t) => sum + (t.rewardCentavos || 0),
        0,
      ) / 100,
    [providerTransactions],
  );

  const dynamicWalletList = useMemo(() => {
    return providerTransactions.map((t, idx) => {
      const d = t.completedAt ? new Date(t.completedAt) : new Date();
      const isToday = d.toDateString() === new Date().toDateString();
      const dateStr = isToday
        ? `Today · ${d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`
        : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      return {
        id: t.requestId || `WAL-${idx}`,
        title: t.title || 'Completed Suyo',
        category: t.category || 'Documents',
        icon:
          t.category === 'Groceries'
            ? 'cart'
            : t.category === 'Medicine'
              ? 'medkit'
              : t.category === 'Delivery'
                ? 'bicycle'
                : 'document-text',
        date: dateStr,
        requesterName: t.otherUserName || 'Requester',
        location: 'Direct Settlement',
        earnedAmount: (t.rewardCentavos || 0) / 100,
        status: 'Received',
      };
    });
  }, [providerTransactions]);

  const todayWalletList = dynamicWalletList.filter((s) =>
    s.date?.startsWith('Today'),
  );

  const todayEarningsSum = todayWalletList.reduce(
    (sum, s) => sum + (Number(s.earnedAmount) || 0),
    0,
  );

  const todaySuyosCount = todayWalletList.length;

  const overallSuyosCount = providerTransactions.length;

  const displayWalletTotal = `₱${overallEarningsSum.toFixed(2)}`;

  const now = new Date();

  const currentYear = now.getFullYear();

  const currentMonth = now.getMonth();

  const todayDateFormatted = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${currentYear}`;

  const monthlySuyosCount = useMemo(() => {
    return providerTransactions.filter((t) => {
      const dateStr = t.completedAt || t.created_at || t.createdAt;
      const d = dateStr ? new Date(dateStr) : null;
      return (
        d &&
        !isNaN(d.getTime()) &&
        d.getFullYear() === currentYear &&
        d.getMonth() === currentMonth
      );
    }).length;
  }, [providerTransactions, currentYear, currentMonth]);
  return {
    displayWalletTotal,
    dynamicWalletList,
    monthlySuyosCount,
    now,
    overallSuyosCount,
    providerTransactions,
    todayDateFormatted,
    todayEarningsSum,
    todaySuyosCount,
  };
}
