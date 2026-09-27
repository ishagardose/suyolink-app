import React, { useRef, useState } from 'react';
import { ScrollView, View, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../context/AuthContext';
import { useSuyos } from '../context/SuyoContext';
import { useTheme } from '../theme/ThemeContext';
import { formatOffer, STATUS_LABELS } from '../data/suyoRequests';
import { uploadProof } from '../lib/proofUpload';
import ScreenHeader from '../components/ScreenHeader';
import ThemedText from '../components/themed/ThemedText';
import ThemedButton from '../components/themed/ThemedButton';
import ThemedTextInput from '../components/themed/ThemedTextInput';
import ProofImage from '../components/requests/ProofImage';

export default function SuyoScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const { colors } = useTheme();
  const { requests, applications, proofs, ratings, events, isLoading, error: loadError, workflowError, workflowLoading, refresh, mutate } = useSuyos();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const [asset, setAsset] = useState(null);
  const uploaded = useRef(null);
  const [note, setNote] = useState('');
  const [reason, setReason] = useState('');
  const [score, setScore] = useState(0);
  const [comment, setComment] = useState('');
  const [confirmCancel, setConfirmCancel] = useState(false);
  const request = requests.find(item => item.id === id);
  const act = async action => {
    if (lock.current) return;
    lock.current = true; setBusy(true); setError('');
    try { await action(); } catch (err) { setError(err.message || 'Something went wrong. Please retry.'); }
    finally { lock.current = false; setBusy(false); }
  };
  const button = (title, action, disabled = false) => <ThemedButton title={title} disabled={busy || disabled || workflowLoading || !!workflowError || !!loadError} onPress={() => act(action)} />;
  const input = (label, value, setter) => <ThemedTextInput accessibilityLabel={label} placeholder={label} value={value} onChangeText={setter}
    editable={!busy} maxLength={1000} multiline style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 12, minHeight: 60 }} />;
  const own = request?.requesterId === user?.id;
  const assigned = request?.providerId === user?.id;
  const requestApplications = applications.filter(item => item.request_id === id);
  const mine = requestApplications.find(item => item.applicant_id === user?.id);
  const requestProofs = proofs.filter(item => item.request_id === id);
  const rating = ratings.find(item => item.request_id === id);
  const eligible = request?.status === 'open' && Date.parse(request.deadline) > Date.now();
  const providerRatings = ratings.filter(item => item.provider_id === request?.providerId);
  return <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
    <ScreenHeader title="Suyo details" onBack={() => router.canGoBack() ? router.back() : router.replace('/dashboard')} />
    <ScrollView contentContainerStyle={{ padding: 20, gap: 16, paddingBottom: 50 }}>
      <ThemedButton title="Refresh task" variant="secondary" disabled={busy} onPress={() => act(refresh)} />
      {loadError || workflowError || error ? <ThemedText accessibilityRole="alert" tone="danger">{error || loadError || workflowError}</ThemedText> : null}
      {!request ? <ThemedText>{isLoading ? 'Loading task…' : 'This task is unavailable or you no longer have access.'}</ThemedText> : <>
        <ThemedText style={{ fontSize: 24, fontWeight: '800' }}>{request.title}</ThemedText>
        <ThemedText>{STATUS_LABELS[request.status]} · {formatOffer(request.offerCentavos)}</ThemedText>
        <ThemedText>{request.details}</ThemedText>
        <ThemedText>{request.category} · {request.location}</ThemedText>
        <ThemedText>Deadline: {new Date(request.deadline).toLocaleString()}</ThemedText>
        <ThemedText>Requested by {request.requesterName}</ThemedText>
        {request.notes ? <ThemedText>Instructions: {request.notes}</ThemedText> : null}
        {request.providerId ? <ThemedText>Provider rating: {providerRatings.length ? `${(providerRatings.reduce((total, item) => total + item.score, 0) / providerRatings.length).toFixed(1)} / 5 (${providerRatings.length} reviews)` : 'No ratings yet'}</ThemedText> : null}
        {request.latitude != null ? <ThemedButton title="View task location" variant="secondary" onPress={() => router.push({ pathname: '/map', params: { requestId: id } })} /> : null}
        {request.status === 'open' && !eligible ? <ThemedText tone="danger">Deadline passed. This task is no longer accepting applications.</ThemedText> : null}
        {!own && mine ? <>
          <ThemedText>Your application: {mine.status}</ThemedText>
          {mine.status === 'pending' ? button('Withdraw application', () => mutate('withdraw_application', { p_application_id: mine.id })) : null}
        </> : null}
        {!own && !mine && eligible ? button('Apply to this Suyo', () => mutate('apply_to_suyo', { p_request_id: id })) : null}
        {own ? <>
          <ThemedText style={{ fontSize: 18, fontWeight: '700' }}>Applicants</ThemedText>
          {!requestApplications.length ? <ThemedText>No applications yet.</ThemedText> : requestApplications.map(application => {
            const reviews = ratings.filter(item => item.provider_id === application.applicant_id);
            return <View key={application.id} style={{ padding: 14, gap: 10, backgroundColor: colors.card, borderRadius: 12 }}>
              <ThemedText>{application.applicant?.full_name || 'Provider'} · {application.status}</ThemedText>
              <ThemedText>{reviews.length ? `${(reviews.reduce((sum, item) => sum + item.score, 0) / reviews.length).toFixed(1)} / 5 (${reviews.length} reviews)` : 'No ratings yet'}</ThemedText>
              {application.status === 'pending' && eligible ? <>
                {button('Accept ' + (application.applicant?.full_name || 'provider'), () => mutate('decide_application', { p_application_id: application.id, p_accept: true }))}
                {button('Reject ' + (application.applicant?.full_name || 'provider'), () => mutate('decide_application', { p_application_id: application.id, p_accept: false }))}
              </> : null}
            </View>;
          })}
          {request.status === 'open' ? confirmCancel ? <>
            <ThemedText>Cancel this request? Pending applications will close.</ThemedText>
            {button('Confirm cancellation', () => mutate('change_suyo_status', { p_request_id: id, p_status: 'cancelled' }))}
            <ThemedButton title="Keep request" variant="secondary" disabled={busy} onPress={() => setConfirmCancel(false)} />
          </> : <ThemedButton title="Cancel request" variant="secondary" onPress={() => setConfirmCancel(true)} /> : null}
        </> : null}
        {assigned && request.status === 'assigned' ? button('Start task', () => mutate('change_suyo_status', { p_request_id: id, p_status: 'in_progress' })) : null}
        {assigned && request.status === 'in_progress' ? <>
          <ThemedText style={{ fontSize: 18, fontWeight: '700' }}>Completion proof</ThemedText>
          {button('Choose proof photo', async () => {
            const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 });
            if (!result.canceled) { setAsset(result.assets[0]); uploaded.current = null; }
          })}
          {asset ? <Image source={{ uri: asset.uri }} accessibilityLabel="Selected proof photo" style={{ height: 200, width: '100%' }} resizeMode="contain" /> : null}
          {input('Proof note (optional)', note, setNote)}
          {button('Submit proof', async () => {
            if (!uploaded.current) uploaded.current = await uploadProof(asset, id, user.id);
            await mutate('submit_suyo_proof', { p_request_id: id, p_storage_path: uploaded.current, p_note: note });
            setAsset(null); uploaded.current = null; setNote('');
          }, !asset)}
        </> : null}
        {requestProofs.map(proof => <View key={proof.id} style={{ padding: 14, gap: 12, backgroundColor: colors.card, borderRadius: 12 }}>
          <ThemedText style={{ fontWeight: '700' }}>Proof · {proof.status}</ThemedText>
          <ProofImage path={proof.storage_path} />
          {proof.note ? <ThemedText>{proof.note}</ThemedText> : null}
          {proof.rejection_reason ? <ThemedText>Requested changes: {proof.rejection_reason}</ThemedText> : null}
          {own && proof.status === 'submitted' && request.status === 'awaiting_confirmation' ? <>
            {button('Approve completion', () => mutate('review_suyo_proof', { p_proof_id: proof.id, p_accept: true }))}
            {input('Reason for requesting changes', reason, setReason)}
            {button('Request changes', () => mutate('review_suyo_proof', { p_proof_id: proof.id, p_accept: false, p_reason: reason.trim() }), !reason.trim())}
          </> : null}
        </View>)}
        {request.status === 'completed' ? rating ? <>
          <ThemedText style={{ fontWeight: '700' }}>Rating: {rating.score} / 5</ThemedText><ThemedText>{rating.comment}</ThemedText>
        </> : own ? <>
          <ThemedText style={{ fontSize: 18, fontWeight: '700' }}>Rate your provider</ThemedText>
          <View style={{ flexDirection: 'row', gap: 8 }}>{[1, 2, 3, 4, 5].map(value => <ThemedButton key={value} title={String(value)} accessibilityLabel={`${value} stars`}
            accessibilityState={{ selected: score === value }} variant={score === value ? 'primary' : 'secondary'} disabled={busy} onPress={() => setScore(value)} />)}</View>
          {input('Review (optional)', comment, setComment)}
          {button('Submit rating', () => mutate('rate_suyo_provider', { p_request_id: id, p_score: score, p_comment: comment }), !score)}
        </> : null : null}
        {own || assigned ? <>
          <ThemedText style={{ fontSize: 18, fontWeight: '700' }}>Task history</ThemedText>
          {events.filter(event => event.request_id === id).map(event => <ThemedText key={event.id}>{STATUS_LABELS[event.to_status] || event.to_status} · {new Date(event.created_at).toLocaleString()}</ThemedText>)}
        </> : null}
        {busy ? <ThemedText accessibilityRole="status">Saving…</ThemedText> : null}
      </>}
    </ScrollView>
  </SafeAreaView>;
}
