import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
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
import ThemedButton from '../themed/ThemedButton';
import ThemedTextInput from '../themed/ThemedTextInput';

export default function AccountScreen() {
  const { user, logout, updateProfile, isProfileReady } = useAuth();
  const params = useLocalSearchParams();
  const id = params.userId || user?.id;
  const own = id === user?.id;
  const router = useRouter();
  const { colors, themeMode, setThemeMode } = useTheme();
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
  const initials = (displayName || '?')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
  const average = reviews.length
    ? (reviews.reduce((sum, r) => sum + r.score, 0) / reviews.length).toFixed(1)
    : '—';
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
          <View
            style={[styles.hero, { backgroundColor: colors.heroBackground }]}
          >
            <View
              pointerEvents="none"
              style={[styles.orbit, { borderColor: colors.heroTextMuted }]}
            />
            <ThemedText
              style={{
                color: colors.heroTextMuted,
                fontSize: 10,
                fontWeight: '700',
                letterSpacing: 2,
              }}
            >
              YOUR COMMUNITY. YOUR CONNECTIONS.
            </ThemedText>
            <View style={styles.heroIdentity}>
              <View
                style={[
                  styles.avatar,
                  {
                    backgroundColor: colors.primary,
                    borderColor: colors.accent,
                  },
                ]}
              >
                <ThemedText
                  style={{
                    fontSize: 30,
                    fontWeight: '800',
                    color: colors.heroText,
                  }}
                >
                  {initials}
                </ThemedText>
              </View>
              <View style={{ flex: 1, gap: 7 }}>
                <ThemedText
                  style={{
                    color: colors.heroText,
                    fontSize: 25,
                    lineHeight: 31,
                    fontWeight: '800',
                    letterSpacing: -0.6,
                  }}
                >
                  {displayName ||
                    (loading ? 'Loading profile…' : 'Community member')}
                </ThemedText>
                <ThemedText
                  style={{ color: colors.heroTextMuted, fontSize: 13 }}
                >
                  SuyoLink community member
                </ThemedText>
                {own && user?.emailVerified ? (
                  <View style={styles.inline}>
                    <Ionicons
                      name="checkmark-circle"
                      size={14}
                      color={colors.heroTextMuted}
                    />
                    <ThemedText
                      style={{ color: colors.heroTextMuted, fontSize: 11 }}
                    >
                      Email verified
                    </ThemedText>
                  </View>
                ) : null}
              </View>
            </View>
            <View
              style={[styles.heroStats, { borderTopColor: colors.primary }]}
            >
              <View style={styles.stat}>
                <View style={styles.inline}>
                  <Ionicons
                    name="star"
                    size={15}
                    color={colors.heroTextMuted}
                  />
                  <ThemedText style={styles.statValue}>
                    {loading ? '…' : average}
                  </ThemedText>
                </View>
                <ThemedText
                  style={{ color: colors.heroTextMuted, fontSize: 11 }}
                >
                  Average rating
                </ThemedText>
              </View>
              <View
                style={[
                  styles.stat,
                  { borderLeftWidth: 1, borderLeftColor: colors.primary },
                ]}
              >
                <ThemedText style={styles.statValue}>
                  {loading ? '…' : reviews.length}
                </ThemedText>
                <ThemedText
                  style={{ color: colors.heroTextMuted, fontSize: 11 }}
                >
                  Reviews received
                </ThemedText>
              </View>
            </View>
          </View>
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
              <View style={card}>
                <View style={styles.sectionHeader}>
                  <ThemedText style={styles.sectionTitle}>
                    Personal details
                  </ThemedText>
                  {!editing ? (
                    <TouchableOpacity
                      accessibilityRole="button"
                      accessibilityLabel="Edit Profile"
                      disabled={!isProfileReady}
                      onPress={() => {
                        setDraft(displayName);
                        setEditing(true);
                        setSaved(false);
                      }}
                      style={[
                        styles.edit,
                        {
                          backgroundColor: colors.surfaceAlt,
                          opacity: isProfileReady ? 1 : 0.5,
                        },
                      ]}
                    >
                      <Ionicons
                        name="create-outline"
                        size={15}
                        color={colors.link}
                      />
                      <ThemedText
                        style={{
                          color: colors.link,
                          fontSize: 12,
                          fontWeight: '700',
                        }}
                      >
                        Edit
                      </ThemedText>
                    </TouchableOpacity>
                  ) : null}
                </View>
                <ThemedText
                  tone="textMuted"
                  style={styles.description}
                >
                  Keep your community profile up to date.
                </ThemedText>
                {editing ? (
                  <View style={{ gap: 12, marginTop: 18 }}>
                    <ThemedText
                      tone="textMuted"
                      style={styles.label}
                    >
                      Full name
                    </ThemedText>
                    <ThemedTextInput
                      accessibilityLabel="Name"
                      placeholder="Enter full name"
                      value={draft}
                      onChangeText={setDraft}
                      maxLength={100}
                      editable={!busy}
                      autoFocus
                      style={[
                        styles.input,
                        {
                          backgroundColor: colors.input,
                          borderColor: colors.border,
                        },
                      ]}
                    />
                    <View style={styles.inline}>
                      <ThemedButton
                        title="Cancel"
                        variant="secondary"
                        disabled={busy}
                        onPress={() => setEditing(false)}
                        style={{ flex: 1 }}
                      />
                      <ThemedButton
                        title="Save Changes"
                        loading={busy}
                        disabled={!draft.trim()}
                        onPress={save}
                        style={{ flex: 1 }}
                      />
                    </View>
                  </View>
                ) : (
                  <View style={styles.detailRow}>
                    <Ionicons
                      name="person-outline"
                      size={19}
                      color={colors.muted}
                    />
                    <View style={{ flex: 1, gap: 5 }}>
                      <ThemedText
                        tone="textMuted"
                        style={styles.label}
                      >
                        Full name
                      </ThemedText>
                      <ThemedText style={styles.detailValue}>
                        {displayName}
                      </ThemedText>
                    </View>
                  </View>
                )}
                <View style={styles.detailRow}>
                  <Ionicons
                    name="mail-outline"
                    size={19}
                    color={colors.muted}
                  />
                  <View style={{ flex: 1, gap: 5 }}>
                    <ThemedText
                      tone="textMuted"
                      style={styles.label}
                    >
                      Email address
                    </ThemedText>
                    <ThemedText style={styles.detailValue}>
                      {user?.email}
                    </ThemedText>
                  </View>
                </View>
              </View>
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
              <View style={card}>
                <ThemedText style={styles.sectionTitle}>
                  Make it feel like you
                </ThemedText>
                <ThemedText
                  tone="textMuted"
                  style={[
                    styles.description,
                    { marginTop: 6, marginBottom: 18 },
                  ]}
                >
                  Choose your preferred appearance.
                </ThemedText>
                <View
                  accessibilityRole="radiogroup"
                  accessibilityLabel="Appearance"
                  style={styles.inline}
                >
                  {[
                    ['light', 'sunny-outline'],
                    ['dark', 'moon-outline'],
                    ['system', 'phone-portrait-outline'],
                  ].map(([mode, icon]) => (
                    <TouchableOpacity
                      key={mode}
                      accessibilityRole="radio"
                      accessibilityLabel={
                        mode[0].toUpperCase() + mode.slice(1) + ' appearance'
                      }
                      aria-checked={themeMode === mode}
                      accessibilityState={{ checked: themeMode === mode }}
                      onPress={() =>
                        setThemeMode(mode).catch((e) => setError(e.message))
                      }
                      style={[
                        styles.appearance,
                        {
                          backgroundColor:
                            themeMode === mode
                              ? colors.surfaceAlt
                              : colors.surface,
                          borderColor:
                            themeMode === mode ? colors.link : colors.border,
                        },
                      ]}
                    >
                      <Ionicons
                        name={icon}
                        size={23}
                        color={themeMode === mode ? colors.link : colors.muted}
                      />
                      <ThemedText
                        style={{
                          fontSize: 12,
                          fontWeight: themeMode === mode ? '700' : '500',
                        }}
                      >
                        {mode[0].toUpperCase() + mode.slice(1)}
                      </ThemedText>
                      {themeMode === mode ? (
                        <Ionicons
                          name="checkmark-circle"
                          size={14}
                          color={colors.link}
                          style={{ position: 'absolute', top: 7, right: 7 }}
                        />
                      ) : null}
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </>
          ) : null}
          <View style={card}>
            <View style={styles.sectionHeader}>
              <ThemedText style={styles.sectionTitle}>
                Reviews received
              </ThemedText>
              <View
                style={[styles.count, { backgroundColor: colors.surfaceAlt }]}
              >
                <ThemedText
                  style={{
                    color: colors.link,
                    fontSize: 12,
                    fontWeight: '700',
                  }}
                >
                  {reviews.length}
                </ThemedText>
              </View>
            </View>
            {loading ? (
              <ActivityIndicator
                style={{ padding: 24 }}
                color={colors.link}
              />
            ) : reviews.length ? (
              reviews.map((r) => (
                <View
                  key={r.id}
                  style={[styles.review, { borderTopColor: colors.border }]}
                >
                  <View
                    style={[
                      styles.inline,
                      { justifyContent: 'space-between', flexWrap: 'wrap' },
                    ]}
                  >
                    <View
                      style={{ flexDirection: 'row', gap: 3 }}
                      accessibilityLabel={r.score + ' out of 5 stars'}
                    >
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Ionicons
                          key={star}
                          name={star <= r.score ? 'star' : 'star-outline'}
                          size={15}
                          color={colors.link}
                        />
                      ))}
                    </View>
                    <ThemedText
                      tone="textMuted"
                      style={{ fontSize: 11 }}
                    >
                      {new Date(r.created_at).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </ThemedText>
                  </View>
                  <ThemedText style={{ fontSize: 14, lineHeight: 22 }}>
                    {r.comment || 'No written review'}
                  </ThemedText>
                </View>
              ))
            ) : (
              <View style={styles.empty}>
                <View
                  style={[
                    styles.emptyIcon,
                    { backgroundColor: colors.surfaceAlt },
                  ]}
                >
                  <Ionicons
                    name="chatbubbles-outline"
                    size={25}
                    color={colors.link}
                  />
                </View>
                <ThemedText style={{ fontSize: 15, fontWeight: '700' }}>
                  No reviews yet
                </ThemedText>
                <ThemedText
                  tone="textMuted"
                  style={{ textAlign: 'center', fontSize: 13, lineHeight: 20 }}
                >
                  Feedback from completed suyos will appear here.
                </ThemedText>
              </View>
            )}
          </View>
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
const styles = StyleSheet.create({
  content: {
    padding: 20,
    paddingBottom: 36,
    gap: 18,
    width: '100%',
    maxWidth: 760,
    alignSelf: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 15,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hero: { padding: 24, borderRadius: 26, gap: 24, overflow: 'hidden' },
  orbit: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderWidth: 1,
    borderRadius: 120,
    top: -110,
    right: -130,
    opacity: 0.15,
  },
  heroIdentity: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  avatar: {
    width: 76,
    height: 76,
    borderRadius: 25,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroStats: { flexDirection: 'row', borderTopWidth: 1, paddingTop: 20 },
  stat: { flex: 1, alignItems: 'center', gap: 5 },
  statValue: { color: '#FFFFFF', fontSize: 21, fontWeight: '700' },
  card: { padding: 20, borderRadius: 22, borderWidth: 1 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  sectionTitle: { fontSize: 17, fontWeight: '700', flexShrink: 1 },
  description: { fontSize: 12, lineHeight: 18 },
  edit: {
    minHeight: 40,
    paddingHorizontal: 12,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingTop: 20,
  },
  label: { fontSize: 11, fontWeight: '500' },
  detailValue: { fontSize: 14, lineHeight: 21 },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    minHeight: 50,
  },
  inline: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  shortcut: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  shortcutIcon: {
    width: 46,
    height: 46,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appearance: {
    flex: 1,
    paddingVertical: 18,
    borderRadius: 15,
    borderWidth: 1,
    alignItems: 'center',
    gap: 8,
  },
  count: { minWidth: 28, padding: 6, borderRadius: 9, alignItems: 'center' },
  review: { borderTopWidth: 1, paddingTop: 18, marginTop: 18, gap: 12 },
  empty: { paddingTop: 26, paddingBottom: 12, alignItems: 'center', gap: 10 },
  emptyIcon: {
    width: 54,
    height: 54,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  notice: {
    padding: 16,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  signout: {
    minHeight: 52,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  footer: { textAlign: 'center', fontSize: 11, marginTop: 4 },
});
