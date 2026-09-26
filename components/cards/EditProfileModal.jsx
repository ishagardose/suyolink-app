import React, { useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../theme/ThemeContext';
import ThemedView from '../themed/ThemedView';
import ThemedText from '../themed/ThemedText';
import ThemedTextInput from '../themed/ThemedTextInput';
import ThemedButton from '../themed/ThemedButton';

export default function EditProfileModal({ onClose }) {
  const { user, updateProfile } = useAuth();
  const { colors } = useTheme();
  const [draft, setDraft] = useState({ ...user });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const save = async () => {
    if (busy) return;
    if (!draft.name.trim()) { setError('Enter your full name.'); return; }
    setBusy(true);
    setError('');
    try { await updateProfile(draft); onClose(); }
    catch (err) { setError(err.message || 'Unable to save profile. Please try again.'); setBusy(false); }
  };
  return <Modal visible transparent animationType="slide" onRequestClose={() => { if (!busy) onClose(); }}>
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.backdrop, { backgroundColor: colors.backdrop }]}>
      <ThemedView tone="surface" style={styles.card}>
        <ScrollView keyboardShouldPersistTaps="handled">
          <ThemedText style={styles.title}>Edit Account Profile</ThemedText>
          {[
            { key: 'name', label: 'Full Name', autoCapitalize: 'words' },
            { key: 'email', label: 'Email Address', keyboardType: 'email-address', autoCapitalize: 'none' },
            { key: 'phone', label: 'Contact Number', keyboardType: 'phone-pad' },
            { key: 'address', label: 'Default Address' },
          ].map(({ key, label, ...props }) => <ThemedView key={key} style={styles.field}>
            <ThemedText style={styles.label}>{label}</ThemedText>
            <ThemedTextInput {...props} accessibilityLabel={label} value={draft[key]} placeholder={label}
              editable={!busy} onChangeText={(value) => setDraft((prev) => ({ ...prev, [key]: value }))}
              style={[styles.input, { backgroundColor: colors.input, borderColor: colors.border }]} />
          </ThemedView>)}
          {error ? <ThemedText tone="danger" accessibilityRole="alert">{error}</ThemedText> : null}
          <ThemedView style={styles.buttons}>
            <ThemedButton title="Cancel" variant="secondary" onPress={onClose} disabled={busy} style={styles.button} />
            <ThemedButton title="Save Changes" onPress={save} loading={busy} style={styles.button} />
          </ThemedView>
        </ScrollView>
      </ThemedView>
    </KeyboardAvoidingView>
  </Modal>;
}
const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  card: { width: '100%', maxWidth: 420, maxHeight: '90%', borderRadius: 20, padding: 20 },
  title: { fontSize: 18, fontWeight: '800', marginBottom: 12 },
  field: { marginBottom: 14 }, label: { fontSize: 13, fontWeight: '600', marginBottom: 6 },
  input: { borderWidth: 1, borderRadius: 10, minHeight: 46, paddingHorizontal: 12, fontSize: 14 },
  buttons: { flexDirection: 'row', gap: 10, marginTop: 12 }, button: { flex: 1, paddingHorizontal: 8 },
});
