import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import WalkingProgressFooter from '../components/WalkingProgressFooter';

const ROLES = [
  {
    id: 'requestor',
    title: 'Requestor',
    subtitle: 'I want to post tasks and get help',
    iconName: 'clipboard-outline',
  },
  {
    id: 'doer',
    title: 'Doer',
    subtitle: 'I want to run errands & earn money',
    iconName: 'footsteps-outline',
  },
  {
    id: 'both',
    title: 'Both',
    subtitle: 'I want to post and run errands',
    iconName: 'swap-horizontal-outline',
  },
];

export default function RoleSelectionScreen() {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState('both'); // Default or pre-selected

  const handleContinue = () => {
    // Navigate to the Welcome Screen with the waving woman sticker
    router.push('/welcome');
  };

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.safeContainer}>
      <StatusBar style="dark" />
      <View style={styles.mainContainer}>
        {/* Top Header Bar */}
        <View style={styles.headerBar}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
            activeOpacity={0.7}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Ionicons name="arrow-back" size={24} color="#163523" />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.flexOne}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Title & Subtitle */}
          <View style={styles.titleSection}>
            <Text style={styles.screenTitle}>Select Role</Text>
            <Text style={styles.screenSubtitle}>
              How do you plan to use SUYOLINK?
            </Text>
          </View>

          {/* 3 Role Selection Cards */}
          <View style={styles.cardsContainer}>
            {ROLES.map((role) => {
              const isSelected = selectedRole === role.id;

              return (
                <TouchableOpacity
                  key={role.id}
                  style={[
                    styles.roleCard,
                    isSelected && styles.roleCardSelected,
                  ]}
                  activeOpacity={0.8}
                  onPress={() => setSelectedRole(role.id)}
                >
                  {/* Icon Box */}
                  <View
                    style={[
                      styles.iconContainer,
                      isSelected && styles.iconContainerSelected,
                    ]}
                  >
                    <Ionicons
                      name={role.iconName}
                      size={22}
                      color={isSelected ? '#1E4D2B' : '#658071'}
                    />
                  </View>

                  {/* Text Meta */}
                  <View style={styles.roleTextContainer}>
                    <Text
                      style={[
                        styles.roleTitle,
                        isSelected && styles.roleTitleSelected,
                      ]}
                    >
                      {role.title}
                    </Text>
                    <Text style={styles.roleSubtitle}>{role.subtitle}</Text>
                  </View>

                  {/* Radio / Selection Indicator */}
                  <View
                    style={[
                      styles.radioCircle,
                      isSelected && styles.radioCircleSelected,
                    ]}
                  >
                    {isSelected && (
                      <View style={styles.radioInnerDot} />
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Continue Button */}
          <TouchableOpacity
            style={styles.continueButton}
            activeOpacity={0.85}
            onPress={handleContinue}
          >
            <Text style={styles.continueButtonText}>Continue</Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Step 3 of 3 Walking Courier Progress Footer (Destination ~90%) */}
        <WalkingProgressFooter step={3} totalSteps={3} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  mainContainer: {
    flex: 1,
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
  },
  headerBar: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F2F7F4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  flexOne: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 24,
  },
  titleSection: {
    marginBottom: 32,
  },
  screenTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#163523',
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  screenSubtitle: {
    fontSize: 15,
    color: '#658071',
    lineHeight: 22,
  },
  cardsContainer: {
    marginBottom: 32,
    gap: 16,
  },
  roleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FBFA',
    borderWidth: 1.5,
    borderColor: '#D8E5DF',
    borderRadius: 18,
    paddingVertical: 18,
    paddingHorizontal: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  roleCardSelected: {
    borderColor: '#1E4D2B', // Signature Hunter Green
    borderWidth: 2,
    backgroundColor: '#F0F7F2',
    shadowColor: '#1E4D2B',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 2,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#EAF2ED',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  iconContainerSelected: {
    backgroundColor: '#D7EBE0',
  },
  roleTextContainer: {
    flex: 1,
  },
  roleTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#163523',
    marginBottom: 3,
  },
  roleTitleSelected: {
    color: '#1E4D2B',
  },
  roleSubtitle: {
    fontSize: 13,
    color: '#658071',
  },
  radioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#B9CFBF',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  radioCircleSelected: {
    borderColor: '#1E4D2B',
    backgroundColor: '#FFFFFF',
  },
  radioInnerDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#1E4D2B',
  },
  continueButton: {
    backgroundColor: '#1E4D2B', // Signature Hunter Green
    height: 54,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1E4D2B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
