import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { supabase, authConfigError } from '../../lib/supabase';
import {
  readVerificationLink,
  finishEmailVerification,
} from '../../lib/emailVerification';
import ThemedView from '../themed/ThemedView';
import ThemedText from '../themed/ThemedText';
import ThemedTextInput from '../themed/ThemedTextInput';
import ThemedButton from '../themed/ThemedButton';

export default function VerifyEmailScreen() {
  const { colors } = useTheme();
  const { user, isLoggedIn, resendVerification, verifyEmailCode } = useAuth();
  const router = useRouter();
  const params = useLocalSearchParams();
  // Router params update for both cold-start and already-open native deep links.
  // Unlike getInitialURL(), they also clear when the callback route is replaced.
  const callbackParams = new URLSearchParams();
  for (const key of [
    'code',
    'access_token',
    'refresh_token',
    'error',
    'error_code',
    'type',
  ]) {
    if (typeof params[key] === 'string' && params[key])
      callbackParams.set(key, params[key]);
  }
  const callbackURL =
    Platform.OS === 'web'
      ? window.location.href
      : `suyolink-app://verify-email?${callbackParams}#${typeof params['#'] === 'string' ? params['#'] : ''}`;
  const [email, setEmail] = useState(
    typeof params.email === 'string' ? params.email : ''
  );
  const [checking, setChecking] = useState(false);
  const [code, setCode] = useState('');
  const verifyBusy = useRef(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [sending, setSending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const processed = useRef(new Set());
  const resendBusy = useRef(false);
  const verified = isLoggedIn && user?.emailVerified && !checking && !error;

  useEffect(() => {
    // Web reads the current fragment; native handles both cold and warm deep links.
    const url = callbackURL;
    if (!url || processed.current.has(url)) return;
    processed.current.add(url);
    let link;
    try {
      link = readVerificationLink(url);
    } catch (err) {
      setError(err.message);
      cleanCallbackURL(router);
      return;
    }
    if (!link) return;
    setChecking(true);
    setError('');
    cleanCallbackURL(router);
    // Do not cancel when the auth event rerenders this screen during setSession.
    (async () => {
      try {
        if (!supabase) throw new Error(authConfigError);
        await finishEmailVerification(supabase, link);
        // Replace the callback route after AuthProvider commits the new session.
        // React Navigation can otherwise retain the original route.path fragment.
        router.replace('/verify-email');
      } catch (err) {
        setError(err.message);
      } finally {
        setChecking(false);
      }
    })();
  }, [callbackURL, router]);

  useEffect(() => {
    if (!cooldown) return;
    const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const resend = async () => {
    if (resendBusy.current || verifyBusy.current || checking || cooldown)
      return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Enter a valid email address.');
      return;
    }
    resendBusy.current = true;
    setSending(true);
    setNotice('');
    setError('');
    try {
      await resendVerification(email);
      setCode('');
      setNotice(
        'If this account still needs verification, a new code is on its way. Check your inbox and spam folder.'
      );
      setCooldown(60);
    } catch (err) {
      setError(err.message || 'Unable to send the email. Please try again.');
    } finally {
      resendBusy.current = false;
      setSending(false);
    }
  };

  const verify = async () => {
    if (verifyBusy.current || resendBusy.current || checking) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Enter a valid email address.');
      return;
    }
    if (!/^\d{6,10}$/.test(code.trim())) {
      setError('Enter the complete numeric code from your email.');
      return;
    }
    verifyBusy.current = true;
    setChecking(true);
    setError('');
    setNotice('');
    try {
      await verifyEmailCode({ email, token: code });
      setCode('');
    } catch (err) {
      setError(
        err.code === 'otp_expired'
          ? 'This code is invalid or has expired. Try the latest code or request a new one.'
          : err.message || 'Unable to verify your email. Please try again.'
      );
    } finally {
      verifyBusy.current = false;
      setChecking(false);
    }
  };

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <ThemedText style={styles.brand}>SUYOLINK</ThemedText>
        <ThemedView
          tone="surface"
          style={[styles.card, { borderColor: colors.border }]}
        >
          <ThemedView
            style={[styles.icon, { backgroundColor: colors.primary }]}
          >
            <Ionicons
              name={verified ? 'checkmark-circle-outline' : 'mail-outline'}
              size={52}
              color={colors.white}
            />
          </ThemedView>
          <ThemedText accessibilityRole="header" style={styles.title}>
            {checking
              ? 'Verifying your email...'
              : verified
                ? "You're all set!"
                : error
                  ? "Let's try that again"
                  : 'Check your email'}
          </ThemedText>
          <ThemedText tone="textMuted" style={styles.body}>
            {checking
              ? 'Finishing verification and signing you in.'
              : verified
                ? 'Your email is verified and you are now signed in. Welcome to SuyoLink!'
                : 'Enter the verification code from your email below to confirm your account and sign in.'}
          </ThemedText>
          {checking ? (
            <ActivityIndicator
              accessibilityLabel="Verifying email"
              color={colors.primary}
            />
          ) : null}
          {verified ? (
            <ThemedButton
              title="Continue to dashboard"
              textStyle={{ color: colors.white }}
              onPress={() => router.replace('/dashboard')}
            />
          ) : !checking ? (
            <>
              <ThemedText style={styles.label}>Email address</ThemedText>
              <ThemedTextInput
                accessibilityLabel="Verification email address"
                value={email}
                onChangeText={setEmail}
                placeholder="your.email@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!sending}
                style={[styles.input, { borderColor: colors.border }]}
              />
              <ThemedText style={styles.label}>Verification code</ThemedText>
              <ThemedTextInput
                accessibilityLabel="Verification code"
                value={code}
                onChangeText={(value) => setCode(value.replace(/\s/g, ''))}
                placeholder="Enter your code"
                keyboardType="number-pad"
                autoCapitalize="none"
                autoCorrect={false}
                textContentType="oneTimeCode"
                autoComplete="one-time-code"
                maxLength={10}
                editable={!sending}
                onSubmitEditing={verify}
                returnKeyType="done"
                style={[styles.input, { borderColor: colors.border }]}
              />
              {error ? (
                <ThemedText tone="danger" accessibilityRole="alert">
                  {error}
                </ThemedText>
              ) : null}
              {notice ? (
                <ThemedText accessibilityRole="alert">{notice}</ThemedText>
              ) : null}
              <ThemedButton
                title="Verify email"
                textStyle={{ color: colors.white }}
                onPress={verify}
                disabled={sending}
              />
              <ThemedButton
                title={
                  cooldown
                    ? `Resend in ${cooldown}s`
                    : 'Resend verification email'
                }
                textStyle={{ color: colors.white }}
                onPress={resend}
                loading={sending}
                disabled={!!cooldown}
              />
              <ThemedButton
                title="Back to login"
                variant="secondary"
                textStyle={{ color: colors.text }}
                disabled={sending}
                onPress={() => router.replace('/login')}
              />
            </>
          ) : null}
        </ThemedView>
      </ScrollView>
    </SafeAreaView>
  );
}

function cleanCallbackURL(router) {
  // Clear Router state too: otherwise it can restore the secret fragment on rerender.
  router.setParams({
    '#': '',
    code: undefined,
    access_token: undefined,
    refresh_token: undefined,
    error: undefined,
    error_code: undefined,
    error_description: undefined,
    type: undefined,
  });
  if (Platform.OS === 'web')
    window.history.replaceState(window.history.state, '', '/verify-email');
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    gap: 24,
  },
  brand: { fontSize: 18, fontWeight: '900', letterSpacing: 3 },
  card: {
    width: '100%',
    maxWidth: 440,
    padding: 24,
    borderRadius: 24,
    borderWidth: 1,
    gap: 18,
  },
  icon: {
    width: 88,
    height: 88,
    borderRadius: 44,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
  },
  title: { fontSize: 28, fontWeight: '800', textAlign: 'center' },
  body: { fontSize: 15, lineHeight: 23, textAlign: 'center' },
  label: { fontSize: 13, fontWeight: '700' },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    minHeight: 48,
    paddingHorizontal: 14,
    fontSize: 15,
  },
});
