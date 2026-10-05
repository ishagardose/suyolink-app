import styles from './account.styles';
import ProfileHero from './ProfileHero';
import ProfileDetails from './ProfileDetails';
import ProfileAppearance from './ProfileAppearance';
import ProfileReviews from './ProfileReviews';
import React, { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../theme/ThemeContext';
import { supabase } from '../../lib/supabase';
import AppMenu from '../navigation/AppMenu';
import ThemedText from '../themed/ThemedText';

export default function AccountScreen() {
  const { user, logout, updateProfile, isProfileReady } = useAuth();
  const params = useLocalSearchParams();
  const id = params.userId || user?.id;
  const own = id === user?.id;
  const router = useRouter();
  const { colors } = useTheme();
  const [name, setName] = useState('');
  const [draft, setDraft] = useState('');
  const [editing, setEditing] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  useEffect(() => {
    let active = true;
    setName('');
    setReviews([]);
    setError('');
    setLoading(true);
    setEditing(false);
    setSaved(false);
    if (!id || !supabase) {
      setLoading(false);
      return;
    }
    Promise.all([
      supabase.from('profiles').select('full_name').eq('id', id).single(),
      supabase
        .from('ratings')
        .select('id,score,comment,created_at')
        .eq('provider_id', id)
        .order('created_at', { ascending: false }),
    ])
      .then(([profile, ratings]) => {
        if (!active) return;
        if (profile.data) setName(profile.data.full_name);
        if (ratings.data) setReviews(ratings.data);
        if (profile.error || ratings.error)
          throw profile.error || ratings.error;
      })
      .catch((e) => {
        if (active) setError(e.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id]);
  const displayName = own ? user?.name || name : name;
  const card = [
    styles.card,
    { backgroundColor: colors.card, borderColor: colors.border },
  ];
  const save = async () => {
    setBusy(true);
    setError('');
    setSaved(false);
    try {
      await updateProfile({
        name: draft.trim(),
        phone: user.phone || '',
        address: user.address || '',
      });
      setName(draft.trim());
      setEditing(false);
      setSaved(true);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };
  const iconButton = (icon, label, action) => (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={action}
      style={[
        styles.iconButton,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
    >
      <Ionicons
        name={icon}
        size={22}
        color={colors.text}
      />
    </TouchableOpacity>
  );
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.content}
        >
          <View style={styles.header}>
            {iconButton('arrow-back', 'Go back', () =>
              router.canGoBack() ? router.back() : router.replace('/dashboard'),
            )}
            <ThemedText style={{ fontSize: 18, fontWeight: '700' }}>
              {own ? 'My Profile' : 'Profile'}
            </ThemedText>
            {own ? (
              iconButton('menu-outline', 'Open sidebar', () =>
                setMenuOpen(true),
              )
            ) : (
              <View style={{ width: 44 }} />
            )}
          </View>
          <ProfileHero
            displayName={displayName}
            loading={loading}
            reviews={reviews}
            emailVerified={own && user?.emailVerified}
          />
          {error ? (
            <View
              style={[styles.notice, { backgroundColor: colors.dangerSurface }]}
            >
              <Ionicons
                name="alert-circle-outline"
                size={19}
                color={colors.danger}
              />
              <ThemedText
                tone="danger"
                accessibilityRole="alert"
                style={{ flex: 1 }}
              >
                {error}
              </ThemedText>
            </View>
          ) : null}
          {saved ? (
            <View
              style={[styles.notice, { backgroundColor: colors.surfaceAlt }]}
            >
              <Ionicons
                name="checkmark-circle-outline"
                size={19}
                color={colors.link}
              />
              <ThemedText accessibilityRole="alert">
                Your profile has been updated.
              </ThemedText>
            </View>
          ) : null}
          {own ? (
            <>
              <ProfileDetails
                displayName={displayName}
                email={user?.email}
                isProfileReady={isProfileReady}
                editing={editing}
                draft={draft}
                setDraft={setDraft}
                busy={busy}
                onEdit={() => {
                  setDraft(displayName);
                  setEditing(true);
                  setSaved(false);
                }}
                onCancel={() => setEditing(false)}
                onSave={save}
              />
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Transaction history"
                onPress={() => router.push('/transactions')}
                style={[...card, styles.shortcut]}
              >
                <View
                  style={[
                    styles.shortcutIcon,
                    { backgroundColor: colors.surfaceAlt },
                  ]}
                >
                  <Ionicons
                    name="receipt-outline"
                    size={22}
                    color={colors.link}
                  />
                </View>
                <View style={{ flex: 1, gap: 4 }}>
                  <ThemedText style={{ fontSize: 15, fontWeight: '700' }}>
                    Transaction history
                  </ThemedText>
                  <ThemedText
                    tone="textMuted"
                    style={styles.description}
                  >
                    Your completed suyos and rewards
                  </ThemedText>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color={colors.muted}
                />
              </TouchableOpacity>
              <ProfileAppearance onError={setError} />
            </>
          ) : null}
          <ProfileReviews
            reviews={reviews}
            loading={loading}
          />
          {own ? (
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Sign out"
              disabled={busy}
              onPress={async () => {
                setBusy(true);
                setError('');
                try {
                  await logout();
                  router.replace('/');
                } catch (e) {
                  setError(e.message);
                } finally {
                  setBusy(false);
                }
              }}
              style={[
                styles.signout,
                { borderColor: colors.border, opacity: busy ? 0.5 : 1 },
              ]}
            >
              <Ionicons
                name="log-out-outline"
                size={20}
                color={colors.danger}
              />
              <ThemedText style={{ color: colors.danger, fontWeight: '600' }}>
                {busy ? 'Please wait…' : 'Sign out'}
              </ThemedText>
            </TouchableOpacity>
          ) : null}
          <ThemedText
            tone="textMuted"
            style={styles.footer}
          >
            SuyoLink · A little help goes a long way.
          </ThemedText>
        </ScrollView>
      </KeyboardAvoidingView>
      <AppMenu
        visible={menuOpen}
        onClose={() => setMenuOpen(false)}
        active="account"
      />
    </SafeAreaView>
  );
}
