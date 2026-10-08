import { useState, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import { supabase } from '../../lib/supabase';

export default function useProfileData(targetId, own) {
  const [profileName, setProfileName] = useState('');
  const [profilePhone, setProfilePhone] = useState('');
  const [profileHandle, setProfileHandle] = useState('');
  const [profileBio, setProfileBio] = useState('');
  const [reviews, setReviews] = useState([]);
  const [completedCount, setCompletedCount] = useState(null);
  const [rating, setRating] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useFocusEffect(
    useCallback(() => {
      let active = true;
      setLoading(true);
      setError('');
      setProfileName('');
      setProfilePhone('');
      setProfileHandle('');
      setProfileBio('');
      setReviews([]);
      setCompletedCount(null);
      setRating(null);

      async function load() {
        try {
          if (!targetId || !supabase) throw new Error('Profile unavailable.');
          const [profile, contacts] = await Promise.all([
            supabase.rpc('get_suyo_profile', { p_user_id: targetId }),
            own
              ? supabase
                  .from('profile_contacts')
                  .select('phone')
                  .eq('user_id', targetId)
                  .single()
              : Promise.resolve({ data: null, error: null }),
          ]);
          if (profile.error) throw profile.error;
          if (contacts.error) throw contacts.error;
          if (!profile.data) throw new Error('Profile not found.');
          if (!active) return;
          setProfileName(profile.data.full_name);
          setProfileHandle(profile.data.handle || '');
          setProfileBio(profile.data.bio || '');
          setProfilePhone(contacts.data?.phone || '');
          setReviews(profile.data.reviews || []);
          setCompletedCount(profile.data.completed_count);
          setRating(profile.data.rating);
        } catch (e) {
          if (active) setError(e.message || 'Could not load profile details.');
        } finally {
          if (active) setLoading(false);
        }
      }
      load();
      return () => {
        active = false;
      };
    }, [targetId, own]),
  );

  return {
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
  };
}
