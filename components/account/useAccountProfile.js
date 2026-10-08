import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import useProfileData from './useProfileData';
import useProfileSummary from './useProfileSummary';

export default function useAccountProfile(params) {
  const { user, updateProfile, isProfileReady } = useAuth();
  const userId = Array.isArray(params.userId)
    ? params.userId[0]
    : params.userId;
  const own = userId ? userId === user?.id : params.isOtherUser !== 'true';
  const targetId = userId || (own ? user?.id : null);
  const isOtherUser = !own;

  const {
    profileName,
    setProfileName,
    profilePhone,
    setProfilePhone,
    profileHandle,
    setProfileHandle,
    profileBio,
    setProfileBio,
    reviews,
    completedCount,
    rating,
    loading,
    error,
    setError,
  } = useProfileData(targetId, own);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  useEffect(() => setSaved(false), [targetId, own]);
  // Edit Profile Modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [tempProfile, setTempProfile] = useState({
    name: '',
    handle: '',
    phone: '',
    bio: '',
  });

  const displayName =
    profileName || (loading ? 'Loading profile...' : 'Profile unavailable');
  const displayHandle = profileHandle;
  const displayPhone = own ? profilePhone : '';
  const displayBio = profileBio;
  const { completedSuyosCount, dynamicFeedbacks, displayRating } =
    useProfileSummary({ reviews, completedCount, rating });

  const handleOpenEdit = () => {
    setTempProfile({
      name: displayName,
      handle: displayHandle,
      phone: displayPhone,
      bio: displayBio,
    });
    setIsEditModalOpen(true);
  };

  const handleSaveProfile = async () => {
    setBusy(true);
    setError('');
    setSaved(false);
    try {
      const trimmedName = tempProfile.name.trim();
      const trimmedPhone = tempProfile.phone.trim();
      const trimmedHandle = tempProfile.handle.trim();
      const trimmedBio = tempProfile.bio.trim();

      await updateProfile({
        name: trimmedName,
        handle: trimmedHandle,
        bio: trimmedBio,
        phone: trimmedPhone,
        address: user?.address || '',
      });

      setProfileName(trimmedName);
      setProfilePhone(trimmedPhone);
      setProfileHandle(trimmedHandle);
      setProfileBio(trimmedBio);
      setSaved(true);
      setIsEditModalOpen(false);
    } catch (e) {
      setError(e.message || 'Could not save profile changes.');
    } finally {
      setBusy(false);
    }
  };

  return {
    own,
    isOtherUser,
    isProfileReady: isProfileReady && !!profileName,
    loading,
    error,
    saved,
    busy,
    displayName,
    displayHandle,
    displayPhone,
    displayBio,
    completedSuyosCount,
    dynamicFeedbacks,
    displayRating,
    isEditModalOpen,
    setIsEditModalOpen,
    tempProfile,
    setTempProfile,
    handleOpenEdit,
    handleSaveProfile,
  };
}
