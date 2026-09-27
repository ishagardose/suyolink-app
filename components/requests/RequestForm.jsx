import React, { useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
  TouchableOpacity,
} from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { useSuyos } from '../../context/SuyoContext';
import { CATEGORIES } from '../../data/suyoRequests';
import ThemedText from '../themed/ThemedText';
import ThemedTextInput from '../themed/ThemedTextInput';
import ThemedButton from '../themed/ThemedButton';
import LocationPicker from './LocationPicker';
import DeadlinePicker from './DeadlinePicker';
import { localDeadline } from '../../lib/deadline';

const EMPTY = {
  title: '',
  details: '',
  category: '',
  offerAmount: '',
  deadline: '',
  location: '',
  coordinates: null,
  notes: '',
};

export default function RequestForm({ onPosted }) {
  const { colors } = useTheme();
  const { postRequest, isLoading, error: loadError, reload } = useSuyos();
  const [draft, setDraft] = useState(() => ({ ...EMPTY,
    clientReference: 'post-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2),
  }));
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const submitting = useRef(false);
  const submit = async () => {
    if (submitting.current) return;
    submitting.current = true;
    setBusy(true);
    setError('');
    try {
      await postRequest(draft);
      onPosted();
    } catch (err) {
      setError(err.message);
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  };
  const field = (key, label, props = {}) => (
    <View style={styles.field}>
      <ThemedText style={styles.label}>{label}</ThemedText>
      <ThemedTextInput
        accessibilityLabel={label}
        value={draft[key]}
        editable={!busy}
        onChangeText={(value) =>
          setDraft((previous) => ({ ...previous, [key]: value }))
        }
        placeholderTextColor={colors.textMuted}
        {...props}
        style={[
          styles.input,
          props.multiline && styles.multiline,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      />
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <ThemedText style={{ color: colors.textMuted }}>
          Describe your task, choose a deadline, and set an offered amount. New
          requests start as Open.
        </ThemedText>
        {field('title', 'Title', {
          placeholder: 'Pick up groceries',
          maxLength: 100,
        })}
        {field('details', 'Task details', {
          placeholder: 'Describe what needs to be done',
          multiline: true,
          maxLength: 2000,
        })}
        <View style={styles.field}>
          <ThemedText style={styles.label}>Category</ThemedText>
          <View style={styles.categories}>
            {CATEGORIES.map((category) => (
              <TouchableOpacity
                key={category}
                accessibilityRole="button"
                accessibilityLabel={category + ' category'}
                accessibilityState={{ selected: draft.category === category }}
                disabled={busy}
                onPress={() => setDraft((prev) => ({ ...prev, category }))}
                style={[
                  styles.chip,
                  {
                    borderColor: colors.border,
                    backgroundColor:
                      draft.category === category
                        ? colors.primary
                        : colors.card,
                  },
                ]}
              >
                <ThemedText
                  style={{
                    color:
                      draft.category === category ? colors.white : colors.text,
                  }}
                >
                  {category}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        {field('offerAmount', 'Offer amount (PHP)', {
          placeholder: '150.00',
          keyboardType: 'decimal-pad',
          maxLength: 12,
        })}
        <ThemedText style={styles.label}>Deadline</ThemedText>
        <View style={styles.categories}>
          {[['In 1 hour', 1], ['In 3 hours', 3], ['Tomorrow', 24]].map(([title, hours]) =>
            <ThemedButton key={title} title={title} variant="secondary" disabled={busy}
              onPress={() => setDraft(prev => ({ ...prev, deadline: localDeadline(new Date(Date.now() + hours * 3600000)) }))} />)}
        </View>
        <DeadlinePicker value={draft.deadline} disabled={busy} onChange={deadline => setDraft(prev => ({ ...prev, deadline }))} />
        <ThemedText tone="textMuted">Choose when the task needs to be finished, in your local time.</ThemedText>
        {field('location', 'Location', {
          placeholder: 'Address or meeting point',
          maxLength: 250,
        })}
        <LocationPicker value={draft.coordinates} disabled={busy}
          onChange={(coordinates) => setDraft(previous => ({ ...previous, coordinates }))} />
        {field('notes', 'Additional notes (optional)', {
          placeholder: 'Extra instructions',
          multiline: true,
          maxLength: 1000,
        })}
        {loadError ? (
          <View>
            <ThemedText
              accessibilityRole="alert"
              style={{ color: colors.danger }}
            >
              {loadError}
            </ThemedText>
            <ThemedButton title="Retry loading requests" onPress={reload} />
          </View>
        ) : null}
        {error ? (
          <ThemedText
            accessibilityRole="alert"
            style={{ color: colors.danger }}
          >
            {error}
          </ThemedText>
        ) : null}
        <ThemedButton
          title="Post request"
          onPress={submit}
          loading={busy}
          disabled={isLoading || !!loadError}
          textStyle={{ color: colors.white }}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: 20, gap: 14, paddingBottom: 40 },
  field: { gap: 6 },
  label: { fontSize: 14, fontWeight: '700' },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    minHeight: 48,
    fontSize: 15,
  },
  multiline: { minHeight: 90, textAlignVertical: 'top' },
  categories: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    borderWidth: 1,
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
});
