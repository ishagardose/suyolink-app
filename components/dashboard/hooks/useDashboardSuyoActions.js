import { getTodayFormatted } from '../utils/dashboardHelpers';
import { useState } from 'react';

export default function useDashboardSuyoActions({
  postedSuyos,
  selectedSuyo,
  selectedSuyoContext,
  setCancelledSuyos,
  setMySuyoNavTab,
  setPostedSuyos,
  setSelectedSuyo,
  triggerToast,
}) {
  const [archivedSuyos, setArchivedSuyos] = useState([]);

  const [isEditingSuyoModalOpen, setIsEditingSuyoModalOpen] = useState(false);

  const [editingSuyoData, setEditingSuyoData] = useState({
    id: '',
    title: '',
    details: '',
    notes: '',
    rewardAmount: 150,
    context: 'posted',
  });

  const handleBoostReward = (suyoId, addAmount) => {
    setPostedSuyos((prev) =>
      prev.map((s) => {
        if (s.id === suyoId) {
          const baseAmt = Number(s.baseRewardAmount ?? s.rewardAmount ?? 150);
          const newAmt = addAmount === 0 ? baseAmt : baseAmt + addAmount;
          return {
            ...s,
            baseRewardAmount: baseAmt,
            currentBoost: addAmount,
            rewardAmount: newAmt,
            reward: `₱${newAmt}`,
            needsBoost: false,
          };
        }
        return s;
      }),
    );
    if (selectedSuyo && selectedSuyo.id === suyoId) {
      const baseAmt = Number(
        selectedSuyo.baseRewardAmount ?? selectedSuyo.rewardAmount ?? 150,
      );
      const newAmt = addAmount === 0 ? baseAmt : baseAmt + addAmount;
      setSelectedSuyo((prev) => ({
        ...prev,
        baseRewardAmount: baseAmt,
        currentBoost: addAmount,
        rewardAmount: newAmt,
        reward: `₱${newAmt}`,
        needsBoost: false,
      }));
    }
    if (addAmount === 0) {
      triggerToast('Reward boost reset to original amount', 'refresh');
    } else {
      triggerToast(
        `Reward increased by +₱${addAmount}! Couriers notified.`,
        'sparkles',
      );
    }
  };

  const handleCancelSuyo = (suyoId) => {
    const target = postedSuyos.find((s) => s.id === suyoId) || selectedSuyo;
    if (target) {
      const cancelledItem = {
        ...target,
        status: 'Cancelled',
        tag: 'Cancelled',
        needsBoost: false,
        cancelledAt: 'Today',
      };
      setCancelledSuyos((prev) => [
        cancelledItem,
        ...prev.filter((s) => s.id !== suyoId),
      ]);
      setPostedSuyos((prev) => prev.filter((s) => s.id !== suyoId));
    }
    if (selectedSuyo && selectedSuyo.id === suyoId) {
      setSelectedSuyo(null);
    }
    triggerToast('suyo is successfully cancelled', 'close-circle');
  };

  const handleOpenEditSuyo = (suyo) => {
    setEditingSuyoData({
      id: suyo.id,
      title: suyo.title || '',
      details: suyo.details || '',
      notes: suyo.notes || '',
      rewardAmount: suyo.rewardAmount || 150,
      context: selectedSuyoContext,
    });
    setIsEditingSuyoModalOpen(true);
  };

  const handleSaveEditedSuyo = () => {
    if (!editingSuyoData.title.trim()) {
      triggerToast('Title cannot be empty', 'alert-circle');
      return;
    }
    const updatedReward = `₱${Number(editingSuyoData.rewardAmount) || 150}`;
    const updateInList = (list) =>
      list.map((item) =>
        item.id === editingSuyoData.id
          ? {
              ...item,
              title: editingSuyoData.title.trim(),
              details: editingSuyoData.details.trim(),
              notes: editingSuyoData.notes.trim(),
              rewardAmount: Number(editingSuyoData.rewardAmount) || 150,
              reward: updatedReward,
            }
          : item,
      );

    if (editingSuyoData.context === 'posted') {
      setPostedSuyos(updateInList);
    } else if (editingSuyoData.context === 'archived') {
      setArchivedSuyos(updateInList);
    }

    if (selectedSuyo && selectedSuyo.id === editingSuyoData.id) {
      setSelectedSuyo((prev) => ({
        ...prev,
        title: editingSuyoData.title.trim(),
        details: editingSuyoData.details.trim(),
        notes: editingSuyoData.notes.trim(),
        rewardAmount: Number(editingSuyoData.rewardAmount) || 150,
        reward: updatedReward,
      }));
    }

    setIsEditingSuyoModalOpen(false);
    triggerToast('Suyo details updated successfully', 'checkmark-circle');
  };

  const handleSaveToArchive = (suyo) => {
    if (!suyo) return;
    const isAlreadyArchived = archivedSuyos.some(
      (a) => a.id === suyo.id || a.title === suyo.title,
    );
    if (!isAlreadyArchived) {
      const template = {
        ...suyo,
        id: `ARCH-${Date.now().toString().slice(-4)}`,
        status: 'Archived Template',
        tag: 'Archived Template',
        formattedDate: 'Saved template',
      };
      setArchivedSuyos((prev) => [template, ...prev]);
    }
    triggerToast('suyo is successfully archive', 'bookmark');
  };

  const handleRepeatRequest = (suyo) => {
    const newPostedSuyo = {
      ...suyo,
      id: `POST-${Date.now().toString().slice(-4)}`,
      status: 'Open - waiting for a doer',
      tag: 'Waiting for doer',
      urgency:
        suyo.urgency ||
        (suyo.due?.toLowerCase().includes('tomorrow')
          ? 'Due tomorrow'
          : 'Due today'),
      due: suyo.due || 'Due today',
      dueDate: suyo.dueDate || getTodayFormatted(),
      formattedDate: 'Just now',
      waitTime: 'Just posted',
      needsBoost: false,
      createdAt: Date.now(),
      doer: undefined,
    };
    setPostedSuyos((prev) => [newPostedSuyo, ...prev]);
    setSelectedSuyo(null);
    setMySuyoNavTab('posted');
    triggerToast('suyo is successfully posted', 'paper-plane');
  };
  return {
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
