import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import WalkingProgressFooter from '../components/WalkingProgressFooter';

export default function OtpVerificationScreen() {
  const router = useRouter();

  // Initial code set to '74' as shown in the wireframe sample: [ 7 ] [ 4 ] [ | ] [   ]
  const [code, setCode] = useState('74');
  const [isFocused, setIsFocused] = useState(true);
  const [resendCountdown, setResendCountdown] = useState(45);
  const [canResend, setCanResend] = useState(false);

  const inputRef = useRef(null);

  // Blinking red cursor animation
  const cursorOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Focus the hidden text input on mount
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 200);

    // Blinking cursor loop
    const blinkAnim = Animated.loop(
      Animated.sequence([
        Animated.timing(cursorOpacity, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(cursorOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ])
    );
    blinkAnim.start();

    return () => {
      clearTimeout(timer);
      blinkAnim.stop();
    };
  }, []);

  // Countdown timer for resend
  useEffect(() => {
    if (resendCountdown > 0) {
      const timer = setTimeout(() => {
        setResendCountdown((prev) => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [resendCountdown]);

  const handleCodeChange = (text) => {
    const cleaned = text.replace(/[^0-9]/g, '').slice(0, 4);
    setCode(cleaned);
  };

  const handleResend = () => {
    if (!canResend) return;
    setCode('74'); // Reset to sample
    setResendCountdown(60);
    setCanResend(false);
    inputRef.current?.focus();
  };

  const handleVerify = () => {
    // Direct progression to Step 2: ID Verification (no blocking checks)
    router.push('/id-verification');
  };

  const focusInput = () => {
    inputRef.current?.focus();
    setIsFocused(true);
  };

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.safeContainer}>
      <StatusBar style="dark" />
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.mainContainer}>
          {/* Top Back Navigation */}
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

          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.contentContainer}
          >
            {/* Title & Subtitle */}
            <View style={styles.titleSection}>
              <Text style={styles.screenTitle}>Verification</Text>
              <Text style={styles.screenSubtitle}>
                Enter the 4-digit code sent to your phone.
              </Text>
            </View>

            {/* OTP Input Boxes Area */}
            <TouchableOpacity
              activeOpacity={1}
              onPress={focusInput}
              style={styles.otpBoxesWrapper}
            >
              {/* Invisible Full-coverage TextInput that captures all keystrokes */}
              <TextInput
                ref={inputRef}
                style={styles.hiddenInput}
                keyboardType="number-pad"
                maxLength={4}
                value={code}
                onChangeText={handleCodeChange}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                autoFocus={true}
                caretHidden={true}
              />

              {/* 4 Visual Digit Boxes matching wireframe sample */}
              <View style={styles.otpBoxesRow} pointerEvents="none">
                {[0, 1, 2, 3].map((index) => {
                  const digit = code[index] || '';
                  const hasValue = digit.length > 0;
                  // The active cursor box is the one where the next digit goes (e.g. index 2 when code has 2 digits)
                  const isActiveCursor = isFocused && index === code.length && code.length < 4;

                  return (
                    <View
                      key={index}
                      style={[
                        styles.otpBox,
                        hasValue && styles.otpBoxFilled,
                        isActiveCursor && styles.otpBoxActiveCursor,
                      ]}
                    >
                      {hasValue ? (
                        <Text style={styles.digitText}>{digit}</Text>
                      ) : isActiveCursor ? (
                        <Animated.View
                          style={[
                            styles.blinkingCursor,
                            { opacity: cursorOpacity },
                          ]}
                        />
                      ) : null}
                    </View>
                  );
                })}
              </View>
            </TouchableOpacity>

            {/* Verify Button */}
            <TouchableOpacity
              style={styles.verifyButton}
              activeOpacity={0.85}
              onPress={handleVerify}
            >
              <Text style={styles.verifyButtonText}>Verify</Text>
            </TouchableOpacity>

            {/* Resend Code Link */}
            <View style={styles.resendContainer}>
              <TouchableOpacity
                onPress={handleResend}
                disabled={!canResend}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.resendText,
                    !canResend && styles.resendTextDisabled,
                  ]}
                >
                  {canResend
                    ? 'Resend Code'
                    : `Resend Code in ${resendCountdown}s`}
                </Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>

          {/* Walking Courier Progress Footer (Step 1 of 3: ~18% distance) */}
          <WalkingProgressFooter step={1} totalSteps={3} />
        </View>
      </TouchableWithoutFeedback>
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
  contentContainer: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
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
  otpBoxesWrapper: {
    position: 'relative',
    marginBottom: 36,
    height: 72,
    justifyContent: 'center',
  },
  hiddenInput: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.01, // Invisible but clickable to maintain keyboard focus
    fontSize: 1,
    color: 'transparent',
  },
  otpBoxesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  otpBox: {
    width: 68,
    height: 68,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#D4E2D9',
    backgroundColor: '#FBFDFB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  otpBoxFilled: {
    borderColor: '#8ABFA0',
    backgroundColor: '#F5FAF7',
  },
  otpBoxActiveCursor: {
    borderColor: '#E05A47', // Wireframe red border active cursor box
    borderWidth: 1.8,
    backgroundColor: '#FFFFFF',
    shadowColor: '#E05A47',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 2,
  },
  digitText: {
    fontSize: 28,
    fontWeight: '800',
    color: '#163523',
    textAlign: 'center',
  },
  blinkingCursor: {
    width: 2.5,
    height: 28,
    backgroundColor: '#E05A47',
    borderRadius: 1,
  },
  verifyButton: {
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
    marginBottom: 20,
  },
  verifyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  resendContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  resendText: {
    color: '#1E4D2B',
    fontSize: 14,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  resendTextDisabled: {
    color: '#9BB2A4',
    textDecorationLine: 'none',
  },
});
