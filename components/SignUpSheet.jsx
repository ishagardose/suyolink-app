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
  Platform,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function SignUpSheet({ visible, onClose, onSwitchToLogin, onSignUpSuccess }) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const slideAnim = useRef(new Animated.Value(visible ? 0 : SCREEN_HEIGHT)).current;
  const [rendered, setRendered] = useState(visible);

  const handleSignUpSubmit = () => {
    // Unconditional navigation to OTP verification without credential check
    router.push('/otp-verification');
    if (onSignUpSuccess) {
      onSignUpSuccess();
    }
  };

  useEffect(() => {
    if (visible) {
      setRendered(true);
      Animated.spring(slideAnim, {
        toValue: 0,
        damping: 22,
        mass: 1,
        stiffness: 110,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: SCREEN_HEIGHT,
        duration: 320,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: true,
      }).start(() => {
        setRendered(false);
      });
    }
  }, [visible]);

  if (!rendered) return null;

  return (
    <Animated.View
      style={[
        styles.sheetOverlay,
        {
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <SafeAreaView edges={['top']} style={styles.headerSafeArea}>
        {/* Hunter Green Top Bar */}
        <View style={styles.topNavBar}>
          <TouchableOpacity
            onPress={onClose}
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

        {/* Curved White Sheet */}
        <View style={styles.whiteSheet}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.keyboardContainer}
          >
            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.scrollContent}
            >
              {/* 2nd Image: High-res Phone Man in Hunter Green */}
              <View style={styles.illustrationWrapper}>
                <Image
                  source={require('../assets/signup_illustration.png')}
                  style={styles.signupImage}
                  resizeMode="contain"
                />
              </View>

              {/* Title & Subtitle */}
              <Text style={styles.headingTitle}>Getting Started</Text>
              <Text style={styles.subheadingText}>
                Create an account to begin booking & tracking
              </Text>

              {/* Input: Full Name */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Full Name</Text>
                <View style={styles.inputFieldContainer}>
                  <Ionicons
                    name="person-outline"
                    size={20}
                    color="#7A8D82"
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.textInput}
                    placeholder="John Doe"
                    placeholderTextColor="#9EB0A5"
                    autoCapitalize="words"
                    value={name}
                    onChangeText={setName}
                  />
                </View>
              </View>

              {/* Input: Email */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Email Address</Text>
                <View style={styles.inputFieldContainer}>
                  <Ionicons
                    name="mail-outline"
                    size={20}
                    color="#7A8D82"
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.textInput}
                    placeholder="your.email@example.com"
                    placeholderTextColor="#9EB0A5"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={email}
                    onChangeText={setEmail}
                  />
                </View>
              </View>

              {/* Input: Password */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Password</Text>
                <View style={styles.inputFieldContainer}>
                  <Ionicons
                    name="lock-closed-outline"
                    size={20}
                    color="#7A8D82"
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.textInput}
                    placeholder="Create a secure password"
                    placeholderTextColor="#9EB0A5"
                    secureTextEntry={!showPassword}
                    value={password}
                    onChangeText={setPassword}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Ionicons
                      name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                      size={20}
                      color="#7A8D82"
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Primary Button: Sign Up */}
              <TouchableOpacity
                style={styles.primaryButton}
                activeOpacity={0.85}
                onPress={handleSignUpSubmit}
              >
                <Text style={styles.primaryButtonText}>Sign Up</Text>
              </TouchableOpacity>

              {/* Switch to Log In */}
              <View style={styles.switchRow}>
                <Text style={styles.switchText}>Already have an account? </Text>
                <TouchableOpacity onPress={onSwitchToLogin} activeOpacity={0.7}>
                  <Text style={styles.switchLink}>Log In</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </SafeAreaView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  sheetOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#163523',
    zIndex: 20,
  },
  headerSafeArea: {
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
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.16,
    shadowRadius: 12,
    elevation: 8,
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 36,
  },
  illustrationWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 148,
    marginBottom: 10,
  },
  signupImage: {
    width: 150,
    height: 145,
  },
  headingTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#12261B',
    textAlign: 'center',
    letterSpacing: -0.3,
    marginBottom: 6,
  },
  subheadingText: {
    fontSize: 14,
    color: '#5A7364',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 22,
    paddingHorizontal: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#284635',
    marginBottom: 6,
    letterSpacing: 0.1,
  },
  inputFieldContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5FAF7',
    borderWidth: 1.2,
    borderColor: '#D2E3D8',
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 50,
  },
  inputIcon: {
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    color: '#163523',
    fontWeight: '500',
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
    marginTop: 8,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
  },
  switchText: {
    fontSize: 14,
    color: '#5A7364',
  },
  switchLink: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E4D2B',
  },
});
