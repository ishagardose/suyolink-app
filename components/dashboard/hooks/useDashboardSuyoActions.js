import { useRef, useState } from 'react';
import { useRouter } from 'expo-router';
import { useSuyos } from '../../../context/SuyoContext';
import { fromPublicRow } from '../../../data/supabaseRequests';

export default function useDashboardSuyoActions({
  selectedSuyoContext,
  setSelectedSuyo,
  triggerToast,
}) {
  const { mutate } = useSuyos();
  const router = useRouter();
  const lock = useRef(false);
  const [actionBusy, setActionBusy] = useState(false);
  const [actionError, setActionError] = useState('');
  const [archivedSuyos, setArchivedSuyos] = useState([]);
  const [isEditingSuyoModalOpen, setIsEditingSuyoModalOpen] = useState(false);
  const [editingSuyoData, setEditingSuyoData] = useState({
    id: '',
    title: '',
    details: '',
    notes: '',
    rewardAmount: '',
    context: 'posted',
  });

  const runAction = async (operation) => {
    if (lock.current) return;
    lock.current = true;
    setActionBusy(true);
    setActionError('');
    try {
      await operation();
      return true;
    } catch (error) {
      const message =
        error.message || 'Could not save this change. Please retry.';
      setActionError(message);
      triggerToast(message, 'alert-circle');
      return false;
    } finally {
      lock.current = false;
      setActionBusy(false);
    }
  };

  const syncSelected = (row) => {
    const request = fromPublicRow(row);
    setSelectedSuyo((previous) =>
      previous?.id === request.id
        ? {
            ...previous,
            title: request.title,
            details: request.details,
            notes: request.notes,
            rewardAmount: request.offerCentavos / 100,
            reward: '\u20b1' + request.offerCentavos / 100,
            currentBoost: request.rewardBoostCentavos / 100,
            baseRewardAmount:
              (request.offerCentavos - request.rewardBoostCentavos) / 100,
            rawRequest: { ...previous.rawRequest, ...request },
          }
        : previous,
    );
  };

  const handleBoostReward = (id, amount) =>
    runAction(async () => {
      const row = await mutate('set_suyo_reward_boost', {
        p_request_id: id,
        p_boost_centavos: amount * 100,
      });
      syncSelected(row);
      triggerToast(
        amount === 0 ? 'Reward boost reset' : 'Reward boost saved',
        'sparkles',
      );
    });

  const handleCancelSuyo = (id) =>
    runAction(async () => {
      await mutate('change_suyo_status', {
        p_request_id: id,
        p_status: 'cancelled',
      });
      setSelectedSuyo((previous) => (previous?.id === id ? null : previous));
      triggerToast('Suyo cancelled', 'close-circle');
    });

  const handleOpenEditSuyo = (suyo) => {
    if (lock.current) return;
    setActionError('');
    setEditingSuyoData({
      id: suyo.id,
      title: suyo.title || '',
      details: suyo.details || '',
      notes: suyo.notes || '',
      rewardAmount: suyo.baseRewardAmount ?? suyo.rewardAmount ?? '',
      context: selectedSuyoContext,
    });
    setIsEditingSuyoModalOpen(true);
  };

  const handleSaveEditedSuyo = () =>
    runAction(async () => {
      const title = editingSuyoData.title.trim();
      const details = editingSuyoData.details.trim();
      const notes = editingSuyoData.notes.trim();
      const amount = Number(editingSuyoData.rewardAmount);
      const offerCentavos = Math.round(amount * 100);
      if (!title || title.length > 100)
        throw new Error('Title must contain 1 to 100 characters.');
      if (!details || details.length > 2000)
        throw new Error('Description must contain 1 to 2000 characters.');
      if (notes.length > 1000)
        throw new Error('Notes must contain at most 1000 characters.');
      if (
        !Number.isFinite(amount) ||
        offerCentavos < 1 ||
        offerCentavos > 100000000
      )
        throw new Error('Enter a reward between 0.01 and 1,000,000 pesos.');

      if (editingSuyoData.context === 'archived') {
        // Saved templates are local drafts, not published task records.
        const changes = {
          title,
          details,
          notes,
          rewardAmount: amount,
          reward: '\u20b1' + amount,
        };
        setArchivedSuyos((previous) =>
          previous.map((item) =>
            item.id === editingSuyoData.id ? { ...item, ...changes } : item,
          ),
        );
        setSelectedSuyo((previous) =>
          previous?.id === editingSuyoData.id
            ? { ...previous, ...changes }
            : previous,
        );
        triggerToast('Local template updated', 'checkmark-circle');
      } else {
        const row = await mutate('edit_suyo_request', {
          p_request_id: editingSuyoData.id,
          p_title: title,
          p_details: details,
          p_notes: notes,
          p_offer_centavos: offerCentavos,
        });
        syncSelected(row);
        triggerToast('Suyo details saved', 'checkmark-circle');
      }
      setIsEditingSuyoModalOpen(false);
    });

  const handleSaveToArchive = (suyo) => {
    if (!suyo) return;
    setArchivedSuyos((previous) =>
      previous.some((item) => item.sourceRequestId === suyo.id)
        ? previous
        : [
            {
              ...suyo,
              sourceRequestId: suyo.rawRequest?.id || suyo.id,
              id: 'ARCH-' + suyo.id,
              status: 'Archived Template',
              tag: 'Archived Template',
              formattedDate: 'Saved template',
            },
            ...previous,
          ],
    );
    triggerToast('Template saved on this session', 'bookmark');
  };

  const handleRepeatRequest = (suyo) => {
    if (lock.current) return;
    const id = suyo.sourceRequestId || suyo.rawRequest?.id || suyo.id;
    if (!id) return;
    setSelectedSuyo(null);
    router.push({ pathname: '/post-suyo', params: { repost: id } });
  };

  return {
    actionBusy,
    actionError,
    setActionError,
    archivedSuyos,
    editingSuyoData,
    handleBoostReward,
    handleCancelSuyo,
    handleOpenEditSuyo,
    handleRepeatRequest,
    handleSaveEditedSuyo,
    handleSaveToArchive,
    isEditingSuyoModalOpen,
    setArchivedSuyos,
    setEditingSuyoData,
    setIsEditingSuyoModalOpen,
  };
}
