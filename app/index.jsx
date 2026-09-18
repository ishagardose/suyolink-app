import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Image,
  TouchableOpacity,
  Dimensions,
  Animated,
  Easing,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

// Modular Login and Sign Up components
import LoginSheet from '../components/LoginSheet';
import SignUpSheet from '../components/SignUpSheet';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const SLIDES = [
  {
    id: '1',
    title: 'Need a Favor? Get It Done.',
    description:
      'Post your suyo request and connect with someone who can help you get it done.',
  },
  {
    id: '2',
    title: 'Track Your Suyo',
    description:
      'See the progress of your Suyo and know when your request is accepted, in progress, and completed.',
  },
];

export default function App() {
  const router = useRouter();
  const [activeIndex, setActiveIndex] = useState(0); // Show 1st slide ('Need a Favor? Get It Done.') first after splash
  const [isOnboardingActive, setIsOnboardingActive] = useState(false);
  const [authModal, setAuthModal] = useState(null); // 'login' | 'signup' | null

  // Animation values
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const initialFadeAnim = useRef(new Animated.Value(0)).current;
  const initialScaleAnim = useRef(new Animated.Value(0.92)).current;
  const bounceButtonAnim = useRef(new Animated.Value(0)).current;

  // Animate initial splash screen appearance on mount
  useEffect(() => {
    Animated.parallel([
      Animated.timing(initialFadeAnim, {
        toValue: 1,
        duration: 800,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(initialScaleAnim, {
        toValue: 1,
        tension: 40,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();

    // Subtle breathing pulse for bottom chevron button
    Animated.loop(
      Animated.sequence([
        Animated.timing(bounceButtonAnim, {
          toValue: 6,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(bounceButtonAnim, {
          toValue: 0,
          duration: 900,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Auto-transition to 2nd screen after 2.2 seconds
    const timer = setTimeout(() => {
      openOnboarding();
    }, 2200);

    return () => clearTimeout(timer);
  }, []);

  const openOnboarding = () => {
    setIsOnboardingActive(true);
    Animated.spring(slideAnim, {
      toValue: 0,
      damping: 22,
      mass: 1,
      stiffness: 110,
      useNativeDriver: true,
    }).start();
  };

  const closeOnboarding = () => {
    Animated.timing(slideAnim, {
      toValue: SCREEN_HEIGHT,
      duration: 350,
      easing: Easing.inOut(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      setIsOnboardingActive(false);
    });
  };

  const touchStartX = useRef(0);

  const handleTouchStart = (e) => {
    touchStartX.current = e.nativeEvent.pageX;
  };

  const handleTouchEnd = (e) => {
    const deltaX = e.nativeEvent.pageX - touchStartX.current;
    if (deltaX < -35) {
      // Swiped left -> next slide
      setActiveIndex((prev) => Math.min(prev + 1, SLIDES.length - 1));
    } else if (deltaX > 35) {
      // Swiped right -> prev slide
      setActiveIndex((prev) => Math.max(prev - 1, 0));
    }
  };

  // Open Login or Sign Up sheet: slide down onboarding, show auth modal
  const handleOpenAuth = (mode) => {
    Animated.timing(slideAnim, {
      toValue: SCREEN_HEIGHT,
      duration: 320,
      easing: Easing.inOut(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      setIsOnboardingActive(false);
      setAuthModal(mode);
    });
  };

  // Close Login or Sign Up sheet: slide up onboarding
  const handleCloseAuth = () => {
    setAuthModal(null);
    setIsOnboardingActive(true);
    Animated.spring(slideAnim, {
      toValue: 0,
      damping: 22,
      mass: 1,
      stiffness: 110,
      useNativeDriver: true,
    }).start();
  };

  return (
    <View style={styles.root}>
      {/* ======================================================== */}
      {/* 1. INITIAL SPLASH SCREEN (Hunter Green + Centered Logo)  */}
      {/* ======================================================== */}
      <TouchableOpacity
        activeOpacity={1}
        onPress={openOnboarding}
        style={styles.initialScreenContainer}
      >
        <SafeAreaView style={styles.initialSafeArea}>
          <View style={styles.centerLogoWrapper}>
            <Animated.View
              style={[
                styles.logoColumn,
                {
                  opacity: initialFadeAnim,
                  transform: [{ scale: initialScaleAnim }],
                },
              ]}
            >
              {/* High-Quality SuyoLink Courier Logo */}
              <View style={styles.logoImageContainer}>
                <Image
                  source={require('../assets/suyolink_logo.png')}
                  style={styles.logoImage}
                  resizeMode="contain"
                />
              </View>
            </Animated.View>
          </View>

          {/* Bottom Down Chevron Button */}
          <Animated.View
            style={[
              styles.bottomChevronContainer,
              { transform: [{ translateY: bounceButtonAnim }] },
            ]}
          >
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={openOnboarding}
              style={styles.chevronButton}
            >
              <Ionicons name="chevron-down" size={24} color="#163523" />
            </TouchableOpacity>
          </Animated.View>
        </SafeAreaView>
      </TouchableOpacity>

      {/* ======================================================== */}
      {/* 2. ONBOARDING SCREEN (Enters from below + parcel sticker) */}
      {/* ======================================================== */}
      <Animated.View
        style={[
          styles.secondScreenOverlay,
          {
            transform: [{ translateY: slideAnim }],
          },
        ]}
        pointerEvents={isOnboardingActive ? 'auto' : 'none'}
      >
        <SafeAreaView edges={['top']} style={styles.secondScreenHeaderSafeArea}>
          {/* Top Hunter Green Navigation Bar */}
          <View style={styles.topNavBar}>
            <TouchableOpacity
              onPress={closeOnboarding}
              activeOpacity={0.7}
              style={styles.backButton}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              style={styles.helpButton}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Text style={styles.helpButtonText}>Need some help?</Text>
            </TouchableOpacity>
          </View>

          {/* Curved White Sheet with Parcel Tracking Sticker */}
          <View
            style={styles.whiteSheet}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            {/* Sticker Area */}
            <View style={styles.stickerWrapper}>
              <Image
                source={require('../assets/hunter_green_tracking.jpg')}
                style={styles.stickerImage}
                resizeMode="contain"
              />
            </View>

            {/* Content & Typography */}
            <View style={styles.sheetContent}>
              <Text style={styles.titleText}>{SLIDES[activeIndex].title}</Text>
              <Text style={styles.descriptionText}>
                {SLIDES[activeIndex].description}
              </Text>

              {/* Indicator Pills */}
              <View style={styles.paginationContainer}>
                {SLIDES.map((slide, index) => {
                  const isActive = index === activeIndex;
                  return (
                    <TouchableOpacity
                      key={slide.id}
                      onPress={() => setActiveIndex(index)}
                      activeOpacity={0.7}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      style={[
                        styles.paginationDot,
                        isActive
                          ? styles.paginationDotActive
                          : styles.paginationDotInactive,
                      ]}
                    />
                  );
                })}
              </View>
            </View>

            {/* Bottom Buttons: Open Login or Sign Up sliding pages */}
            <SafeAreaView edges={['bottom']} style={styles.bottomButtonsWrapper}>
              <TouchableOpacity
                style={styles.primaryButton}
                activeOpacity={0.85}
                onPress={() => router.push('/login')}
              >
                <Text style={styles.primaryButtonText}>Log In</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryButton}
                activeOpacity={0.75}
                onPress={() => router.push('/signup')}
              >
                <Text style={styles.secondaryButtonText}>Sign Up</Text>
              </TouchableOpacity>
            </SafeAreaView>
          </View>
        </SafeAreaView>
      </Animated.View>

      {/* ======================================================== */}
      {/* 3. SEPARATE MODULAR LOGIN & SIGN UP COMPONENTS           */}
      {/* ======================================================== */}
      <LoginSheet
        visible={authModal === 'login'}
        onClose={handleCloseAuth}
        onLoginSuccess={() => setAuthModal(null)}
        onSwitchToSignUp={() => setAuthModal('signup')}
      />

      <SignUpSheet
        visible={authModal === 'signup'}
        onClose={handleCloseAuth}
        onSignUpSuccess={() => setAuthModal(null)}
        onSwitchToLogin={() => setAuthModal('login')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#163523', // Signature deep Hunter Green
  },

  /* ------------------------------------------- */
  /* 1. Initial Splash Screen Styles             */
  /* ------------------------------------------- */
  initialScreenContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#163523',
  },
  initialSafeArea: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 24,
  },
  centerLogoWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoColumn: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  logoImageContainer: {
    width: 210,
    height: 210,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 14,
    elevation: 8,
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  bottomChevronContainer: {
    paddingBottom: 24,
  },
  chevronButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#8ABFA0',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 5,
  },

  /* ------------------------------------------- */
  /* 2. Onboarding Screen Styles                 */
  /* ------------------------------------------- */
  secondScreenOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#163523',
    zIndex: 10,
  },
  secondScreenHeaderSafeArea: {
    flex: 1,
    backgroundColor: '#163523',
  },
  topNavBar: {
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    backgroundColor: '#163523',
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  helpButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  helpButtonText: {
    color: '#D4E8DC',
    fontSize: 14,
    fontWeight: '600',
  },
  whiteSheet: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    overflow: 'hidden',
    marginTop: 8,
    justifyContent: 'space-between',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  stickerWrapper: {
    flex: 1.15,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 12,
    paddingHorizontal: 20,
  },
  stickerImage: {
    width: SCREEN_WIDTH * 0.84,
    height: '100%',
    maxHeight: 310,
  },
  sheetContent: {
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 8,
  },
  titleText: {
    fontSize: 27,
    fontWeight: '800',
    color: '#12261B',
    textAlign: 'center',
    letterSpacing: -0.3,
    marginBottom: 10,
  },
  descriptionText: {
    fontSize: 15,
    color: '#52695C',
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 300,
  },
  paginationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    gap: 8,
  },
  paginationDot: {
    height: 4,
    borderRadius: 3,
  },
  paginationDotInactive: {
    width: 14,
    backgroundColor: '#C8D8CF',
  },
  paginationDotActive: {
    width: 24,
    backgroundColor: '#1E4D2B',
  },
  bottomButtonsWrapper: {
    paddingHorizontal: 24,
    paddingBottom: 16,
    gap: 12,
  },
  primaryButton: {
    backgroundColor: '#1E4D2B', // Signature Hunter Green
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1E4D2B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  secondaryButton: {
    backgroundColor: '#FFFFFF',
    height: 52,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#1E4D2B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    color: '#1E4D2B',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});