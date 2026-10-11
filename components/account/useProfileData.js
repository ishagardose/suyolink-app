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

          let reviewsList = profile.data.reviews || [];
          let userRating = profile.data.rating;

          try {
            const { data: directRatings, error: ratingsErr } = await supabase
              .from('ratings')
              .select('id, score, comment, created_at, reviewer_id, request_id')
              .eq('provider_id', targetId)
              .order('created_at', { ascending: false });

            if (!ratingsErr && Array.isArray(directRatings) && directRatings.length > 0) {
              const reviewerIds = [
                ...new Set(directRatings.map((r) => r.reviewer_id).filter(Boolean)),
              ];
              let namesMap = {};
              if (reviewerIds.length > 0) {
                try {
                  const { data: revProfiles } = await supabase
                    .from('profiles')
                    .select('id, full_name')
                    .in('id', reviewerIds);
                  if (revProfiles) {
                    namesMap = Object.fromEntries(
                      revProfiles.map((p) => [p.id, p.full_name]),
                    );
                  }
                } catch (_) {}
              }

              const mapped = directRatings.map((rt) => ({
                id: rt.id,
                score: Number(rt.score),
                comment: rt.comment,
                created_at: rt.created_at,
                reviewer_id: rt.reviewer_id,
                request_id: rt.request_id,
                reviewerName: namesMap[rt.reviewer_id] || 'Community Member',
              }));
              reviewsList = mapped;
              const sum = mapped.reduce((acc, curr) => acc + curr.score, 0);
              userRating = Number((sum / mapped.length).toFixed(1));
            }
          } catch (_) {}

          setProfileName(profile.data.full_name);
          setProfileHandle(profile.data.handle || '');
          setProfileBio(profile.data.bio || '');
          setProfilePhone(contacts.data?.phone || '');
          setReviews(reviewsList);
          setCompletedCount(profile.data.completed_count);
          setRating(userRating);
        } catch (e) {
          if (active) setError(e.message || 'Could not load profile details.');
        } finally {
          if (active) setLoading(false);
        }
      }
      load();

      let channel = null;
      if (supabase && targetId) {
        try {
          channel = supabase
            .channel(`profile_ratings_live_${targetId}`)
            .on(
              'postgres_changes',
              {
                event: '*',
                schema: 'public',
                table: 'ratings',
                filter: `provider_id=eq.${targetId}`,
              },
              () => {
                if (active) load();
              }
            )
            .subscribe();
        } catch (_) {}
      }

      return () => {
        active = false;
        if (channel && supabase) {
          try {
            supabase.removeChannel(channel);
          } catch (_) {}
        }
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
