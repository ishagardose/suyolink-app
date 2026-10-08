import React from 'react';
import { Text, View, ScrollView, TouchableOpacity } from 'react-native';

export default function MySuyoStatusNav({
  acceptedSuyos,
  archivedSuyos,
  cancelledSuyos,
  completedSuyos,
  mySuyoNavTab,
  postedSuyos,
  setIsMySuyoEditMode,
  setMySuyoNavTab,
  setSelectedMySuyoIdsToDelete,
  styles,
}) {
  return (
    <View style={styles.mySuyoTextNavWrapper}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.mySuyoTextNavRow}
      >
        {/* 1. Posted Tab */}
        <TouchableOpacity
          style={styles.mySuyoTextNavItem}
          activeOpacity={0.7}
          onPress={() => {
            setMySuyoNavTab('posted');
            setIsMySuyoEditMode(false);
            setSelectedMySuyoIdsToDelete([]);
          }}
        >
          <Text
            style={[
              styles.mySuyoTextNavTitle,
              mySuyoNavTab === 'posted' && styles.mySuyoTextNavTitleActive,
            ]}
          >
            Posted
          </Text>
          <Text
            style={[
              styles.mySuyoTextNavCount,
              mySuyoNavTab === 'posted' && styles.mySuyoTextNavCountActive,
            ]}
          >
            ({postedSuyos.length})
          </Text>
          {mySuyoNavTab === 'posted' && (
            <View style={styles.mySuyoTextNavUnderline} />
          )}
        </TouchableOpacity>

        {/* 2. Accepted Tab */}
        <TouchableOpacity
          style={styles.mySuyoTextNavItem}
          activeOpacity={0.7}
          onPress={() => {
            setMySuyoNavTab('accepted');
            setIsMySuyoEditMode(false);
            setSelectedMySuyoIdsToDelete([]);
          }}
        >
          <Text
            style={[
              styles.mySuyoTextNavTitle,
              mySuyoNavTab === 'accepted' && styles.mySuyoTextNavTitleActive,
            ]}
          >
            Accepted
          </Text>
          <Text
            style={[
              styles.mySuyoTextNavCount,
              mySuyoNavTab === 'accepted' && styles.mySuyoTextNavCountActive,
            ]}
          >
            ({acceptedSuyos.length})
          </Text>
          {mySuyoNavTab === 'accepted' && (
            <View style={styles.mySuyoTextNavUnderline} />
          )}
        </TouchableOpacity>

        {/* 3. Completed Tab */}
        <TouchableOpacity
          style={styles.mySuyoTextNavItem}
          activeOpacity={0.7}
          onPress={() => {
            setMySuyoNavTab('completed');
            setIsMySuyoEditMode(false);
            setSelectedMySuyoIdsToDelete([]);
          }}
        >
          <Text
            style={[
              styles.mySuyoTextNavTitle,
              mySuyoNavTab === 'completed' && styles.mySuyoTextNavTitleActive,
            ]}
          >
            Completed
          </Text>
          <Text
            style={[
              styles.mySuyoTextNavCount,
              mySuyoNavTab === 'completed' && styles.mySuyoTextNavCountActive,
            ]}
          >
            ({completedSuyos.length})
          </Text>
          {mySuyoNavTab === 'completed' && (
            <View style={styles.mySuyoTextNavUnderline} />
          )}
        </TouchableOpacity>

        {/* 4. Cancelled Tab */}
        <TouchableOpacity
          style={styles.mySuyoTextNavItem}
          activeOpacity={0.7}
          onPress={() => {
            setMySuyoNavTab('cancelled');
            setIsMySuyoEditMode(false);
            setSelectedMySuyoIdsToDelete([]);
          }}
        >
          <Text
            style={[
              styles.mySuyoTextNavTitle,
              mySuyoNavTab === 'cancelled' && styles.mySuyoTextNavTitleActive,
            ]}
          >
            Cancelled
          </Text>
          <Text
            style={[
              styles.mySuyoTextNavCount,
              mySuyoNavTab === 'cancelled' && styles.mySuyoTextNavCountActive,
            ]}
          >
            ({cancelledSuyos.length})
          </Text>
          {mySuyoNavTab === 'cancelled' && (
            <View style={styles.mySuyoTextNavUnderline} />
          )}
        </TouchableOpacity>

        {/* 5. Archived Tab */}
        <TouchableOpacity
          style={styles.mySuyoTextNavItem}
          activeOpacity={0.7}
          onPress={() => {
            setMySuyoNavTab('archived');
            setIsMySuyoEditMode(false);
            setSelectedMySuyoIdsToDelete([]);
          }}
        >
          <Text
            style={[
              styles.mySuyoTextNavTitle,
              mySuyoNavTab === 'archived' && styles.mySuyoTextNavTitleActive,
            ]}
          >
            Archived
          </Text>
          <Text
            style={[
              styles.mySuyoTextNavCount,
              mySuyoNavTab === 'archived' && styles.mySuyoTextNavCountActive,
            ]}
          >
            ({archivedSuyos.length})
          </Text>
          {mySuyoNavTab === 'archived' && (
            <View style={styles.mySuyoTextNavUnderline} />
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
