import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  Image,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function WelcomeScreen() {
  const router = useRouter();

  const handleGetStarted = () => {
    // Proceed to Dashboard
    router.replace('/dashboard');
  };

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.safeContainer}>
      <StatusBar style="dark" />
      <View style={styles.mainContainer}>
        {/* Top Header / Brand Logo */}
        <View style={styles.brandRow}>
          <Text style={styles.brandText}>SUYOLINK</Text>
        </View>

        {/* High-Quality Waving Woman Sticker with Hunter Green, Yellow, Blue, Red */}
        <View style={styles.illustrationWrapper}>
          <Image
            source={require('../assets/welcome_waving_woman.png')}
            style={styles.welcomeImage}
            resizeMode="contain"
          />
        </View>

        {/* Welcome Typography matching the sticker reference */}
        <View style={styles.textSection}>
          <Text style={styles.welcomeTitle}>Welcome</Text>
          <Text style={styles.welcomeSubtitle}>
            We are happy to see you here!
          </Text>
          <Text style={styles.welcomeBody}>
            Your SUYOLINK account has been successfully verified and configured.
            Enjoy prompt delivery and seamless errand assistance.
          </Text>
        </View>

        {/* Primary Action Button */}
        <View style={styles.bottomSection}>
          <TouchableOpacity
            style={styles.getStartedButton}
            activeOpacity={0.85}
            onPress={handleGetStarted}
          >
            <Text style={styles.getStartedButtonText}>Get Started</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF', // Pure solid white background as requested
  },
  mainContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'space-between',
    paddingHorizontal: 28,
    paddingTop: 16,
    paddingBottom: 24,
  },
  brandRow: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  brandText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#163523', // Hunter Green
    letterSpacing: 2,
  },
  illustrationWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    height: SCREEN_WIDTH * 0.95,
    marginVertical: 10,
  },
  welcomeImage: {
    width: '100%',
    height: '100%',
  },
  textSection: {
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  welcomeTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#163523',
    letterSpacing: -0.5,
    marginBottom: 6,
    textAlign: 'center',
  },
  welcomeSubtitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#345E45',
    textAlign: 'center',
    marginBottom: 12,
  },
  welcomeBody: {
    fontSize: 13.5,
    color: '#658071',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 10,
  },
  bottomSection: {
    marginTop: 18,
  },
  getStartedButton: {
    backgroundColor: '#1E4D2B', // Signature Hunter Green
    height: 54,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1E4D2B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 8,
    elevation: 4,
  },
  getStartedButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
