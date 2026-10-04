import React, { useRef, useState } from 'react';
import { ScrollView, View, Image, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../context/AuthContext';
import { useSuyos } from '../../context/SuyoContext';
import { useTheme } from '../../theme/ThemeContext';
import { uploadProof } from '../../lib/proofUpload';
import ScreenHeader from '../ScreenHeader';
import ThemedText from '../themed/ThemedText';
import ThemedButton from '../themed/ThemedButton';
import ThemedTextInput from '../themed/ThemedTextInput';
import SuyoSummary from '../suyo/SuyoSummary';

export default function ProofScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const { colors } = useTheme();
  const { requests, detailsById, loadDetails, mutate, refresh } = useSuyos();

  const [asset, setAsset] = useState(null);
  const uploaded = useRef(null);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  React.useEffect(() => {
    if (id) loadDetails(id);
  }, [id, loadDetails]);

  const request = detailsById[id] || requests.find((item) => item.id === id);
  const isAcceptedProvider = request?.providerId === user?.id;
  const isInProgress = request?.status === 'in_progress';

  const pickImage = async () => {
    setError('');
    try {
      let result;
      if (Platform.OS !== 'web') {
        const cameraPerm = await ImagePicker.requestCameraPermissionsAsync();
        if (cameraPerm.granted) {
          result = await ImagePicker.launchCameraAsync({
            mediaTypes: ['images'],
            quality: 0.8,
          });
        }
      }
      if (!result || result.canceled) {
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          quality: 0.8,
        });
      }
      if (!result.canceled && result.assets?.[0]) {
        setAsset(result.assets[0]);
        uploaded.current = null;
      }
    } catch (err) {
      setError(err.message || 'Could not select photo.');
    }
  };

  const handleSubmit = async () => {
    if (!asset) return;
    setBusy(true);
    setError('');
    try {
      if (!uploaded.current) {
        uploaded.current = await uploadProof(asset, id, user.id);
      }
      await mutate('submit_suyo_proof', {
        p_request_id: id,
        p_storage_path: uploaded.current,
        p_note: note.trim(),
      });
      if (id) await loadDetails(id, { force: true });
      await refresh();
      router.replace({ pathname: '/suyo', params: { id } });
    } catch (err) {
      setError(err.message || 'Failed to submit proof. Please retry.');
    } finally {
      setBusy(false);
    }
  };

  if (request && (!isAcceptedProvider || !isInProgress)) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <ScreenHeader
          title="Submit proof"
          onBack={() =>
            router.canGoBack() ? router.back() : router.replace('/dashboard')
          }
        />
        <View style={{ padding: 20, gap: 16 }}>
          <ThemedText tone="danger">
            Completion proof can only be submitted by the assigned provider
            while the task is in progress.
          </ThemedText>
          <ThemedButton
            title="Return to task"
            onPress={() =>
              router.replace({ pathname: '/suyo', params: { id } })
            }
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScreenHeader
        title="Submit proof"
        onBack={() =>
          router.canGoBack() ? router.back() : router.replace('/dashboard')
        }
      />
      <ScrollView
        contentContainerStyle={{ padding: 20, gap: 16, paddingBottom: 60, width: '100%', maxWidth: 760, alignSelf: 'center' }}
      >
        {request ? <SuyoSummary details={request} /> : null}

        <ThemedText style={{ fontSize: 18, fontWeight: '700' }}>
          Completion proof photo
        </ThemedText>
        <ThemedText tone="textMuted">
          Take a clear photo of completed work or receipt to confirm task
          fulfillment.
        </ThemedText>

        {error ? (
          <ThemedText accessibilityRole="alert" tone="danger">
            {error}
          </ThemedText>
        ) : null}

        <ThemedButton
          title={asset ? 'Retake or change photo' : 'Choose proof photo'}
          variant={asset ? 'secondary' : 'primary'}
          disabled={busy}
          onPress={pickImage}
        />

        {asset ? (
          <View style={{ gap: 8 }}>
            <Image
              source={{ uri: asset.uri }}
              accessibilityLabel="Selected proof photo"
              style={{
                height: 220,
                width: '100%',
                borderRadius: 12,
                backgroundColor: colors.surfaceAlt,
              }}
              resizeMode="contain"
            />
          </View>
        ) : null}

        <ThemedTextInput
          accessibilityLabel="Proof note (optional)"
          placeholder="Proof note (optional)"
          value={note}
          onChangeText={setNote}
          editable={!busy}
          maxLength={1000}
          multiline
          style={{
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 12,
            padding: 12,
            minHeight: 70,
            backgroundColor: colors.card,
          }}
        />

        <ThemedButton
          title={busy ? 'Submitting proof…' : 'Submit proof'}
          disabled={busy || !asset}
          onPress={handleSubmit}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
