import React from 'react';
import { View } from 'react-native';
import WalletScreen from '../../wallet/WalletScreen';

export default function WalletTab({ activeTab, setActiveTab }) {
  if (activeTab !== 'wallet' && activeTab !== 'activity') return null;
  return (
    <View style={{ flex: 1, backgroundColor: '#163925' }}>
      <WalletScreen
        embedded
        onBack={() => setActiveTab('home')}
      />
    </View>
  );
}
