import React, { useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { createRecoveryClient } from '../lib/supabase';
import { useTheme } from '../theme/ThemeContext';
import ThemedText from '../components/themed/ThemedText';
import ThemedTextInput from '../components/themed/ThemedTextInput';
import ThemedButton from '../components/themed/ThemedButton';

export default function ForgotPasswordScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const { colors } = useTheme();
  const [email, setEmail] = useState(typeof params.email === 'string' ? params.email : '');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [step, setStep] = useState('email');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const lock = useRef(false);
  const client = useRef(null);
  useEffect(() => {
    if (!cooldown) return;
    const timer = setTimeout(() => setCooldown(value => Math.max(0, value - 1)), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);
  useEffect(() => () => {
    const current = client.current;
    client.current = null;
    if (current) current.auth.signOut({ scope: 'local' }).catch(() => {});
  }, []);

  const run = async (action) => {
    if (lock.current) return;
    lock.current = true; setBusy(true); setError(''); setNotice('');
    try {
      if (!client.current) client.current = createRecoveryClient();
      await action(client.current);
    } catch (err) {
      setError(err.code === 'otp_expired' ? 'This code is invalid or expired. Request a new code and try again.'
        : err.message || 'Please try again.');
    } finally { lock.current = false; setBusy(false); }
  };
  const send = () => {
    if (cooldown) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { setError('Enter a valid email address.'); return; }
    run(async (recovery) => {
      const { error } = await recovery.auth.resetPasswordForEmail(email.trim().toLowerCase());
      if (error) throw error;
      setCode(''); setStep('code'); setCooldown(60);
      setNotice('If this email has an account, a reset code is on its way. Check your inbox and spam folder.');
    });
  };
  const verify = () => {
    if (!/^\d{6,10}$/.test(code.trim())) { setError('Enter the complete numeric code from your email.'); return; }
    run(async (recovery) => {
      const { data, error } = await recovery.auth.verifyOtp({ email: email.trim().toLowerCase(), token: code.trim(), type: 'recovery' });
      if (error) throw error;
      if (!data.session) throw new Error('Unable to verify this code. Request a new one.');
      setCode(''); setStep('password');
    });
  };
  const save = () => {
    if (password.length < 6 || !password.trim()) { setError('Use a password with at least 6 characters.'); return; }
    if (password !== confirm) { setError('Passwords do not match.'); return; }
    run(async (recovery) => {
      const { error } = await recovery.auth.updateUser({ password });
      if (error) throw error;
      setPassword(''); setConfirm(''); setStep('done');
      // Password update is complete even if session cleanup fails.
      await recovery.auth.signOut({ scope: 'local' }).catch(() => {});
    });
  };
  const field = (label, value, setter, props = {}) => <>
    <ThemedText>{label}</ThemedText>
    <ThemedTextInput accessibilityLabel={label} value={value} onChangeText={setter}
      autoCapitalize="none" autoCorrect={false} editable={!busy}
      style={[styles.input, { borderColor: colors.border }]} {...props} />
  </>;
  return <SafeAreaView style={[styles.root, { backgroundColor: colors.background }]}>
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <ThemedText accessibilityRole="header" style={styles.title}>
          {step === 'done' ? 'Password updated' : step === 'password' ? 'Choose a new password' : 'Reset your password'}
        </ThemedText>
        {step === 'done' ? <ThemedText>You can now log in with your new password.</ThemedText> : <>
          <ThemedText>{step === 'email' ? 'We will email you a code to reset your password in the app.'
            : step === 'code' ? `Enter the reset code sent to ${email.trim()}.` : 'Enter your new password twice.'}</ThemedText>
          {step === 'email' ? <>
            {field('Email address', email, setEmail, { keyboardType: 'email-address' })}
            <ThemedButton title={cooldown ? `Resend in ${cooldown}s` : 'Send reset code'} onPress={send} loading={busy} disabled={!!cooldown} />
          </> : step === 'code' ? <>
            {field('Reset code', code, value => setCode(value.replace(/\s/g, '')), {
              keyboardType: 'number-pad', textContentType: 'oneTimeCode', autoComplete: 'one-time-code', maxLength: 10,
            })}
            <ThemedButton title="Verify reset code" onPress={verify} loading={busy} />
            <ThemedButton title={cooldown ? `Resend in ${cooldown}s` : 'Resend reset code'} onPress={send} disabled={busy || !!cooldown} variant="secondary" />
            <ThemedButton title="Use another email" variant="secondary" disabled={busy}
              onPress={() => { setStep('email'); setCode(''); setError(''); setNotice(''); }} />
          </> : <>
            {field('New password', password, setPassword, { secureTextEntry: true, autoComplete: 'new-password' })}
            {field('Confirm new password', confirm, setConfirm, { secureTextEntry: true, autoComplete: 'new-password' })}
            <ThemedButton title="Save new password" onPress={save} loading={busy} />
            <ThemedButton title="Start over" variant="secondary" disabled={busy} onPress={() => {
              setPassword(''); setConfirm(''); setStep('email'); setError('');
            }} />
          </>}
        </>}
        {error ? <ThemedText tone="danger" accessibilityRole="alert">{error}</ThemedText> : null}
        {notice ? <ThemedText accessibilityRole="alert">{notice}</ThemedText> : null}
        <ThemedButton title="Back to login" variant="secondary" disabled={busy} onPress={() => router.replace('/login')} />
      </ScrollView>
    </KeyboardAvoidingView>
  </SafeAreaView>;
}
const styles = StyleSheet.create({
  root: { flex: 1 }, content: { flexGrow: 1, justifyContent: 'center', padding: 24, gap: 16, width: '100%', maxWidth: 480, alignSelf: 'center' },
  title: { fontSize: 26, fontWeight: '800' }, input: { borderWidth: 1, borderRadius: 12, minHeight: 48, paddingHorizontal: 14 },
});
