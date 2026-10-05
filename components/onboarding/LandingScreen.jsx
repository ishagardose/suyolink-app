import createLandingStyles from './landing.styles';
import ThemedText from '../themed/ThemedText';
import { useTheme } from '../../theme/ThemeContext';
import React, { useState, useRef, useEffect } from 'react';
import {
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
import { StatusBar } from 'expo-status-bar';

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
  const { colors } = useTheme();
  const styles = createLandingStyles(colors, SCREEN_WIDTH);
  const [activeIndex, setActiveIndex] = useState(0); // Show 1st slide ('Need a Favor? Get It Done.') first after splash
  const [isOnboardingActive, setIsOnboardingActive] = useState(false);

  // Animation values
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const initialFadeAnim = useRef(new Animated.Value(0)).current;
  const initialScaleAnim = useRef(new Animated.Value(0.92)).current;
  const bounceButtonAnim = useRef(new Animated.Value(0)).current;
  const slideFadeAnim = useRef(new Animated.Value(1)).current;

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
    const pulse = Animated.loop(
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
      ]),
    );
    pulse.start();

    // Auto-transition to 2nd screen after 2.2 seconds
    const timer = setTimeout(() => {
      openOnboarding();
    }, 2200);

    return () => {
      clearTimeout(timer);
      pulse.stop();
    };
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

  const switchSlide = (targetIndex) => {
    Animated.sequence([
      Animated.timing(slideFadeAnim, {
        toValue: 0.15,
        duration: 90,
        useNativeDriver: true,
      }),
      Animated.timing(slideFadeAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
    setActiveIndex(targetIndex);
  };

  const goToNextSlide = () => {
    setActiveIndex((prev) => {
      const next = (prev + 1) % SLIDES.length;
      Animated.sequence([
        Animated.timing(slideFadeAnim, {
          toValue: 0.15,
          duration: 90,
          useNativeDriver: true,
        }),
        Animated.timing(slideFadeAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
      return next;
    });
  };

  const goToPrevSlide = () => {
    setActiveIndex((prev) => {
      const next = (prev - 1 + SLIDES.length) % SLIDES.length;
      Animated.sequence([
        Animated.timing(slideFadeAnim, {
          toValue: 0.15,
          duration: 90,
          useNativeDriver: true,
        }),
        Animated.timing(slideFadeAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
      return next;
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
      goToNextSlide();
    } else if (deltaX > 35) {
      // Swiped right -> prev slide
      goToPrevSlide();
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
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
                  source={require('../../assets/suyolink_logo.png')}
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
              <Ionicons
                name="chevron-down"
                size={24}
                color={colors.text}
              />
            </TouchableOpacity>
          </Animated.View>
        </SafeAreaView>
      </TouchableOpacity>

      <Animated.View
        style={[
          styles.secondScreenOverlay,
          {
            transform: [{ translateY: slideAnim }],
          },
        ]}
        pointerEvents={isOnboardingActive ? 'auto' : 'none'}
      >
        <SafeAreaView
          edges={['top']}
          style={styles.secondScreenHeaderSafeArea}
        >
          {/* Top Hunter Green Navigation Bar */}
          <View style={styles.topNavBar}>
            <TouchableOpacity
              onPress={closeOnboarding}
              activeOpacity={0.7}
              style={styles.backButton}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Ionicons
                name="chevron-back"
                size={24}
                color={colors.onPrimary}
              />
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              style={styles.helpButton}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <ThemedText style={styles.helpButtonText}>
                Need some help?
              </ThemedText>
            </TouchableOpacity>
          </View>

          {/* Curved White Sheet with Parcel Tracking Sticker */}
          <View
            style={styles.whiteSheet}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            {/* Sticker / Logo Area (Clickable to advance to next slide) */}
            <TouchableOpacity
              activeOpacity={0.92}
              onPress={goToNextSlide}
              style={styles.stickerWrapper}
            >
              <Animated.View
                style={[
                  styles.stickerAnimatedWrapper,
                  { opacity: slideFadeAnim },
                ]}
              >
                <Image
                  source={require('../../assets/hunter_green_tracking.png')}
                  style={styles.stickerImage}
                  resizeMode="contain"
                />
              </Animated.View>
            </TouchableOpacity>

            {/* Content & Typography (Clickable to advance to next slide) */}
            <View style={styles.sheetContent}>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={goToNextSlide}
                style={styles.textClickableWrapper}
              >
                <Animated.View
                  style={[
                    styles.textAnimatedWrapper,
                    { opacity: slideFadeAnim },
                  ]}
                >
                  <ThemedText style={styles.titleText}>
                    {SLIDES[activeIndex].title}
                  </ThemedText>
                  <ThemedText style={styles.descriptionText}>
                    {SLIDES[activeIndex].description}
                  </ThemedText>
                </Animated.View>
              </TouchableOpacity>

              {/* Indicator Pills */}
              <View style={styles.paginationContainer}>
                {SLIDES.map((slide, index) => {
                  const isActive = index === activeIndex;
                  return (
                    <TouchableOpacity
                      key={slide.id}
                      onPress={() => switchSlide(index)}
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
            <SafeAreaView
              edges={['bottom']}
              style={styles.bottomButtonsWrapper}
            >
              <TouchableOpacity
                style={styles.primaryButton}
                activeOpacity={0.85}
                onPress={() => router.push('/login')}
              >
                <ThemedText style={styles.primaryButtonText}>Log In</ThemedText>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryButton}
                activeOpacity={0.75}
                onPress={() => router.push('/signup')}
              >
                <ThemedText style={styles.secondaryButtonText}>
                  Sign Up
                </ThemedText>
              </TouchableOpacity>
            </SafeAreaView>
          </View>
        </SafeAreaView>
      </Animated.View>
    </View>
  );
}
