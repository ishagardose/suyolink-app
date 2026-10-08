import React from 'react';
import { Text, View, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function DashboardBottomNav({
  activeTab,
  bottomInset,
  resolveColor,
  router,
  setActiveTab,
  styles,
}) {
  return (
    <View
      style={[
        styles.bottomNavContainer,
        {
          height: 60 + bottomInset,
          paddingBottom: bottomInset,
        },
      ]}
    >
      <TouchableOpacity
        style={styles.navItem}
        activeOpacity={0.7}
        onPress={() => setActiveTab('home')}
      >
        <Ionicons
          name={activeTab === 'home' ? 'home' : 'home-outline'}
          size={22}
          color={
            activeTab === 'home'
              ? resolveColor('#1E4D2B', 'color')
              : resolveColor('#8FA497', 'color')
          }
        />
        <Text
          style={[
            styles.navItemText,
            activeTab === 'home' && styles.navItemTextActive,
          ]}
        >
          Home
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.navItem}
        activeOpacity={0.7}
        onPress={() => setActiveTab('mysuyo')}
      >
        <Ionicons
          name={activeTab === 'mysuyo' ? 'receipt' : 'receipt-outline'}
          size={22}
          color={
            activeTab === 'mysuyo'
              ? resolveColor('#1E4D2B', 'color')
              : resolveColor('#8FA497', 'color')
          }
        />
        <Text
          style={[
            styles.navItemText,
            activeTab === 'mysuyo' && styles.navItemTextActive,
          ]}
        >
          MySuyo
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.navItem}
        activeOpacity={0.7}
        onPress={() => router.push('/post-suyo')}
      >
        <Ionicons
          name="add-circle"
          size={24}
          color={resolveColor('#1E4D2B', 'color')}
        />
        <Text
          style={[
            styles.navItemText,
            { color: resolveColor('#1E4D2B', 'color'), fontWeight: '700' },
          ]}
        >
          Post
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.navItem}
        activeOpacity={0.7}
        onPress={() => setActiveTab('doer')}
      >
        <Ionicons
          name={activeTab === 'doer' ? 'bicycle' : 'bicycle-outline'}
          size={22}
          color={
            activeTab === 'doer'
              ? resolveColor('#1E4D2B', 'color')
              : resolveColor('#8FA497', 'color')
          }
        />
        <Text
          style={[
            styles.navItemText,
            activeTab === 'doer' && styles.navItemTextActive,
          ]}
        >
          Doer Suyo
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.navItem}
        activeOpacity={0.7}
        onPress={() => {
          router.push('/account');
        }}
      >
        <Ionicons
          name={activeTab === 'account' ? 'person' : 'person-outline'}
          size={22}
          color={
            activeTab === 'account'
              ? resolveColor('#1E4D2B', 'color')
              : resolveColor('#8FA497', 'color')
          }
        />
        <Text
          style={[
            styles.navItemText,
            activeTab === 'account' && styles.navItemTextActive,
          ]}
        >
          Account
        </Text>
      </TouchableOpacity>
    </View>
  );
}
