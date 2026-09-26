import React, { useEffect, useRef, useState } from 'react';
import { Animated, Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../theme/ThemeContext';
import ScreenHeader from './ScreenHeader';
import ThemedView from './themed/ThemedView';
import ThemedText from './themed/ThemedText';
import ThemedTextInput from './themed/ThemedTextInput';
import ThemedButton from './themed/ThemedButton';

export default function AuthSheet({ mode, visible, onClose, onSwitch, onSuccess }) {
  const signup = mode === 'signup';
  const { login, isLoggedIn } = useAuth();
  const { colors } = useTheme();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const submitting = useRef(false);
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.timing(opacity, { toValue: visible ? 1 : 0, duration: 220, useNativeDriver: true });
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
    if (signup && !name.trim()) { setError('Enter your full name.'); return; }
    if (!password.trim()) { setError('Enter a password to continue.'); return; }
    submitting.current = true;
    setBusy(true);
    setError('');
    try {
      await login({ email, ...(signup ? { name } : {}) });
      setPassword('');
      setSubmitted(true);
    } catch (err) {
      setError(err.message || 'Unable to save your session. Please try again.');
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  };

  if (!visible) return null;
  return (
    <Animated.View style={[styles.root, { backgroundColor: colors.brand, opacity }]}>
      <StatusBar style="light" />
      <SafeAreaView edges={['top']} style={styles.flex}>
        <ScreenHeader brand title={signup ? 'Sign Up' : 'Log In'} onBack={onClose} />
        <ThemedView tone="surface" style={styles.sheet}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
            <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
              <Image source={signup ? require('../assets/signup_illustration.png') : require('../assets/login_courier.png')}
                style={styles.illustration} resizeMode="contain" />
              <ThemedText style={styles.title}>{signup ? 'Getting Started' : 'Welcome Back!'}</ThemedText>
              <ThemedText tone="textSecondary" style={styles.subtitle}>
                {signup ? 'Create a local profile to explore SuyoLink.' : 'Sign in to explore your SuyoLink demo.'}
              </ThemedText>
              {signup && <Field label="Full Name" icon="person-outline" value={name} onChangeText={setName}
                placeholder="John Doe" autoCapitalize="words" editable={!busy} />}
              <Field label="Email Address" icon="mail-outline" value={email} onChangeText={setEmail}
                placeholder="your.email@example.com" keyboardType="email-address" autoCapitalize="none" autoCorrect={false} editable={!busy} />
              <Field label="Password" icon="lock-closed-outline" value={password} onChangeText={setPassword}
                placeholder="Enter a password" secureTextEntry={!showPassword} autoCapitalize="none" autoCorrect={false}
                editable={!busy} onSubmitEditing={submit} returnKeyType="go"
                accessory={<TouchableOpacity accessibilityRole="button" accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
                  onPress={() => setShowPassword(!showPassword)} hitSlop={10}>
                  <Ionicons name={showPassword ? 'eye-outline' : 'eye-off-outline'} size={20} color={colors.muted} />
                </TouchableOpacity>} />
              <ThemedText tone="textSecondary" style={styles.note}>Demo only. Your password is not verified or saved.</ThemedText>
              {error ? <ThemedText tone="danger" accessibilityRole="alert" style={styles.note}>{error}</ThemedText> : null}
              <ThemedButton title={signup ? 'Sign Up' : 'Log In'} onPress={submit} loading={busy} />
              <ThemedView style={styles.switchRow}>
                <ThemedText tone="textSecondary">{signup ? 'Already have an account? ' : "Don't have an account? "}</ThemedText>
                <TouchableOpacity accessibilityRole="button" onPress={onSwitch} disabled={busy}>
                  <ThemedText tone="link" style={styles.link}>{signup ? 'Log In' : 'Sign Up'}</ThemedText>
                </TouchableOpacity>
              </ThemedView>
            </ScrollView>
          </KeyboardAvoidingView>
        </ThemedView>
      </SafeAreaView>
    </Animated.View>
  );
}

function Field({ label, icon, accessory, ...props }) {
  const { colors } = useTheme();
  return <ThemedView style={styles.field}>
    <ThemedText style={styles.label}>{label}</ThemedText>
    <ThemedView tone="input" style={[styles.inputRow, { borderColor: colors.border }]}>
      <Ionicons name={icon} size={20} color={colors.muted} />
      <ThemedTextInput accessibilityLabel={label} {...props} style={styles.input} />
      {accessory}
    </ThemedView>
  </ThemedView>;
}
const styles = StyleSheet.create({
  root: { flex: 1 }, flex: { flex: 1 },
  sheet: { flex: 1, borderTopLeftRadius: 36, borderTopRightRadius: 36, overflow: 'hidden', marginTop: 8 },
  content: { padding: 24, paddingBottom: 40 },
  illustration: { width: 150, height: 145, alignSelf: 'center', marginBottom: 10 },
  title: { fontSize: 26, fontWeight: '800', textAlign: 'center', marginBottom: 6 },
  subtitle: { fontSize: 14, textAlign: 'center', lineHeight: 20, marginBottom: 22 },
  field: { marginBottom: 16 }, label: { fontSize: 13, fontWeight: '700', marginBottom: 6 },
  inputRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, minHeight: 50, gap: 10 },
  input: { flex: 1, minWidth: 0, paddingVertical: 12, fontSize: 15 },
  note: { fontSize: 12, lineHeight: 18, marginBottom: 12 },
  switchRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', marginTop: 18 }, link: { fontWeight: '700' },
});
