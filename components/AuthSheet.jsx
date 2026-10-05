import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../theme/ThemeContext';
import ScreenHeader from './ScreenHeader';
import ThemedView from './themed/ThemedView';
import ThemedText from './themed/ThemedText';
import ThemedTextInput from './themed/ThemedTextInput';
import ThemedButton from './themed/ThemedButton';

export default function AuthSheet({
  mode,
  visible,
  onClose,
  onSwitch,
  onSuccess,
}) {
  const signup = mode === 'signup';
  const router = useRouter();
  const { login, signup: register, isLoggedIn } = useAuth();
  const { colors } = useTheme();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const submitting = useRef(false);
  const opacity = useRef(new Animated.Value(0)).current;
  const scrollRef = useRef(null);
  const nameInputRef = useRef(null);
  const emailInputRef = useRef(null);
  const passwordInputRef = useRef(null);
  const confirmPasswordInputRef = useRef(null);

  const scrollToField = (y) => {
    setTimeout(() => {
      scrollRef.current?.scrollTo({ y, animated: true });
    }, 100);
  };

  const scrollToBottom = () => {
    const doScroll = () => {
      if (scrollRef.current) {
        scrollRef.current.scrollToEnd({ animated: true });
      }
    };
    doScroll();
    setTimeout(doScroll, 80);
    setTimeout(doScroll, 250);
  };

  useEffect(() => {
    const animation = Animated.timing(opacity, {
      toValue: visible ? 1 : 0,
      duration: 220,
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [visible, opacity]);

  // Navigate after React has committed the session and opened protected routes.
  useEffect(() => {
    if (submitted && isLoggedIn) {
      setSubmitted(false);
      onSuccess();
    }
  }, [submitted, isLoggedIn, onSuccess]);

  const submit = async () => {
    if (submitting.current) return;
    if (signup && !name.trim()) {
      setError('Enter your full name.');
      return;
    }
    if (!password.trim()) {
      setError('Enter a password to continue.');
      return;
    }
    if (signup && password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Enter a valid email address.');
      return;
    }
    submitting.current = true;
    setBusy(true);
    setError('');
    try {
      const result = signup
        ? await register({
            email,
            password,
            name,
          })
        : await login({ email, password });
      setPassword('');
      setConfirmPassword('');
      if (result?.needsConfirmation) {
        router.replace({
          pathname: '/verify-email',
          params: { email: email.trim().toLowerCase() },
        });
      } else setSubmitted(true);
    } catch (err) {
      if (err.code === 'email_not_confirmed') {
        setPassword('');
        router.push({
          pathname: '/verify-email',
          params: { email: email.trim().toLowerCase() },
        });
        return;
      }
      setError(err.message || 'Unable to sign in. Please try again.');
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  };

  if (!visible) return null;
  return (
    <Animated.View
      style={[styles.root, { backgroundColor: colors.brand, opacity }]}
    >
      <StatusBar style="light" />
      <SafeAreaView
        edges={['top', 'bottom']}
        style={styles.flex}
      >
        <ScreenHeader
          brand
          hideBorder
          title={signup ? 'Sign Up' : 'Log In'}
          onBack={onClose}
        />
        <ThemedView
          tone="surface"
          style={styles.sheet}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.flex}
          >
            <ScrollView
              ref={scrollRef}
              contentContainerStyle={[styles.content, { paddingBottom: 260 }]}
              keyboardShouldPersistTaps="handled"
              automaticallyAdjustKeyboardInsets={true}
              showsVerticalScrollIndicator={false}
            >
              <Image
                source={
                  signup
                    ? require('../assets/signup_illustration.png')
                    : require('../assets/login_courier.png')
                }
                style={styles.illustration}
                resizeMode="contain"
              />
              <ThemedText style={styles.title}>
                {signup ? 'Getting Started' : 'Welcome Back!'}
              </ThemedText>
              <ThemedText
                tone="textSecondary"
                style={styles.subtitle}
              >
                {signup
                  ? 'Create your SuyoLink account to get started.'
                  : 'Sign in to your SuyoLink account.'}
              </ThemedText>
              {signup && (
                <Field
                  ref={nameInputRef}
                  label="Full Name"
                  icon="person-outline"
                  value={name}
                  onChangeText={setName}
                  placeholder="John Doe"
                  autoCapitalize="words"
                  editable={!busy}
                  returnKeyType="next"
                  onFocus={() => scrollToField(0)}
                  onSubmitEditing={() => {
                    emailInputRef.current?.focus();
                    scrollToField(signup ? 90 : 40);
                  }}
                />
              )}
              <Field
                ref={emailInputRef}
                label="Email Address"
                icon="mail-outline"
                value={email}
                onChangeText={setEmail}
                placeholder="your.email@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!busy}
                returnKeyType="next"
                onFocus={() => scrollToField(signup ? 90 : 40)}
                onSubmitEditing={() => {
                  passwordInputRef.current?.focus();
                  scrollToField(signup ? 180 : 120);
                }}
              />
              <Field
                ref={passwordInputRef}
                label="Password"
                icon="lock-closed-outline"
                value={password}
                onChangeText={setPassword}
                placeholder="Enter a password"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!busy}
                returnKeyType={signup ? 'next' : 'go'}
                onFocus={() => scrollToField(signup ? 180 : 120)}
                onSubmitEditing={() => {
                  if (signup) {
                    confirmPasswordInputRef.current?.focus();
                    scrollToBottom();
                  } else {
                    submit();
                  }
                }}
                accessory={
                  <TouchableOpacity
                    accessibilityRole="button"
                    accessibilityLabel={
                      showPassword ? 'Hide password' : 'Show password'
                    }
                    onPress={() => setShowPassword(!showPassword)}
                    hitSlop={10}
                  >
                    <Ionicons
                      name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                      size={20}
                      color={colors.muted}
                    />
                  </TouchableOpacity>
                }
              />
              {signup ? (
                <Field
                  ref={confirmPasswordInputRef}
                  label="Confirm Password"
                  icon="lock-closed-outline"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Enter your password again"
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!busy}
                  returnKeyType="go"
                  onFocus={scrollToBottom}
                  onSubmitEditing={submit}
                />
              ) : null}
              {error ? (
                <ThemedText
                  tone="danger"
                  accessibilityRole="alert"
                  style={styles.note}
                >
                  {error}
                </ThemedText>
              ) : null}
              <ThemedButton
                title={signup ? 'Sign Up' : 'Log In'}
                onPress={submit}
                loading={busy}
                disabled={busy}
              />
              {!signup ? (
                <ThemedView style={{ gap: 10, marginTop: 12 }}>
                  <ThemedButton
                    title="Forgot password?"
                    variant="secondary"
                    disabled={busy}
                    onPress={() =>
                      router.push({
                        pathname: '/forgot-password',
                        params: { email: email.trim().toLowerCase() },
                      })
                    }
                  />
                </ThemedView>
              ) : null}
              <ThemedView style={styles.switchRow}>
                <ThemedText tone="textSecondary">
                  {signup
                    ? 'Already have an account? '
                    : "Don't have an account? "}
                </ThemedText>
                <TouchableOpacity
                  accessibilityRole="button"
                  onPress={onSwitch}
                  disabled={busy}
                >
                  <ThemedText
                    tone="link"
                    style={styles.link}
                  >
                    {signup ? 'Log In' : 'Sign Up'}
                  </ThemedText>
                </TouchableOpacity>
              </ThemedView>
            </ScrollView>
          </KeyboardAvoidingView>
        </ThemedView>
      </SafeAreaView>
    </Animated.View>
  );
}

const Field = React.forwardRef(function Field(
  { label, icon, accessory, ...props },
  ref,
) {
  const { colors } = useTheme();
  return (
    <ThemedView style={styles.field}>
      <ThemedText style={styles.label}>{label}</ThemedText>
      <ThemedView
        tone="input"
        style={[styles.inputRow, { borderColor: colors.border }]}
      >
        <Ionicons
          name={icon}
          size={20}
          color={colors.muted}
        />
        <ThemedTextInput
          ref={ref}
          accessibilityLabel={label}
          {...props}
          style={styles.input}
        />
        {accessory}
      </ThemedView>
    </ThemedView>
  );
});
const styles = StyleSheet.create({
  root: { flex: 1, width: '100%', maxWidth: 760, alignSelf: 'center' },
  flex: { flex: 1 },
  sheet: {
    flex: 1,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
    marginTop: 8,
  },
  content: {
    padding: 24,
    paddingTop: 32,
    paddingBottom: 40,
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
  },
  illustration: {
    width: 96,
    height: 92,
    alignSelf: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.8,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 22,
  },
  field: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '700', marginBottom: 6 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    minHeight: 52,
    gap: 10,
  },
  input: { flex: 1, minWidth: 0, paddingVertical: 12, fontSize: 15 },
  note: { fontSize: 12, lineHeight: 18, marginBottom: 12 },
  switchRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: 18,
  },
  link: { fontWeight: '700' },
});
