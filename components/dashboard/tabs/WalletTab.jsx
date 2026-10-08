import React from 'react';
import WalletScreen from '../../wallet/WalletScreen';
export default function WalletTab({ activeTab, setActiveTab }) {
  if (activeTab !== 'wallet' && activeTab !== 'activity') return null;
  return (
    <WalletScreen
      embedded
      onBack={() => setActiveTab('home')}
    />
  );
}
