import { useState, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../../lib/supabase';

export const COMMUNITY_RATINGS_STORAGE_KEY = '@suyolink_community_ratings';

export default function useProfileData(targetId, own, targetName) {
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
          if (!targetId && !targetName) {
            if (active) setLoading(false);
            return;
          }

          let resolvedTargetId = targetId;
          let pFullName = targetName || '';
          let pHandle = '';
          let pBio = '';
          let pPhone = '';
          let pCompletedCount = 0;
          let pRating = null;
          let pReviews = [];

          const isUuid = Boolean(
            resolvedTargetId &&
              /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
                String(resolvedTargetId),
              ),
          );

          // 0. If resolvedTargetId is not a UUID but targetName exists, attempt to find profile by name
          if (!isUuid && targetName && supabase) {
            try {
              const { data: foundByName } = await supabase
                .from('profiles')
                .select('id, full_name, handle, bio')
                .ilike('full_name', targetName.trim())
                .limit(1)
                .maybeSingle();
              if (foundByName) {
                resolvedTargetId = foundByName.id;
                pFullName = foundByName.full_name || targetName;
                pHandle = foundByName.handle || '';
                pBio = foundByName.bio || '';
              }
            } catch (_) {}
          }

          const hasValidUuid = Boolean(
            resolvedTargetId &&
              /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
                String(resolvedTargetId),
              ),
          );

          // 1. Try get_suyo_profile RPC if UUID is valid
          if (hasValidUuid && supabase) {
            try {
              const { data: profileRpc, error: rpcErr } = await supabase.rpc(
                'get_suyo_profile',
                { p_user_id: resolvedTargetId },
              );
              if (!rpcErr && profileRpc) {
                pFullName = profileRpc.full_name || pFullName;
                pHandle = profileRpc.handle || '';
                pBio = profileRpc.bio || '';
                pCompletedCount = profileRpc.completed_count ?? 0;
                pRating = profileRpc.rating ?? null;
                pReviews = Array.isArray(profileRpc.reviews)
                  ? profileRpc.reviews
                  : [];
              }
            } catch (err) {
              console.warn('get_suyo_profile RPC warning:', err);
            }
          }

          // 2. Direct profiles table fallback if name not yet found and UUID is valid
          if ((!pFullName || !pBio) && hasValidUuid && supabase) {
            try {
              const { data: pRow } = await supabase
                .from('profiles')
                .select('id, full_name, handle, bio')
                .eq('id', resolvedTargetId)
                .maybeSingle();
              if (pRow) {
                pFullName = pRow.full_name || pFullName;
                pHandle = pRow.handle || pHandle;
                pBio = pRow.bio || pBio;
              }
            } catch (_) {}
          }

          // 3. Contact phone (only if viewing own profile, safe maybeSingle without throwing)
          if (own && hasValidUuid && supabase) {
            try {
              const { data: contacts } = await supabase
                .from('profile_contacts')
                .select('phone')
                .eq('user_id', resolvedTargetId)
                .maybeSingle();
              if (contacts?.phone) pPhone = contacts.phone;
            } catch (_) {}
          }

          // 4. Completed tasks count fallback
          if (pCompletedCount === 0 && hasValidUuid && supabase) {
            try {
              const { count } = await supabase
                .from('suyo_requests')
                .select('id', { count: 'exact', head: true })
                .eq('status', 'completed')
                .or(`provider_id.eq.${resolvedTargetId},requester_id.eq.${resolvedTargetId}`);
              if (count != null) pCompletedCount = count;
            } catch (_) {}
          }

          // 5. Gather and merge all reviews from RPC, direct DB ratings, and local cache
          const reviewsMap = new Map();

          // A) RPC reviews
          pReviews.forEach((r) => {
            if (r) {
              const key =
                r.id || `${r.reviewer_id || 'rev'}_${r.request_id || 'req'}`;
              reviewsMap.set(key, {
                id: r.id || key,
                score: Number(r.score || 5),
                comment: r.comment || '',
                tags: Array.isArray(r.tags) ? r.tags : [],
                created_at: r.created_at || new Date().toISOString(),
                reviewer_id: r.reviewer_id,
                request_id: r.request_id,
                reviewerName: r.reviewerName || 'Community Member',
              });
            }
          });

          // B) Direct DB ratings table query
          if (hasValidUuid && supabase) {
            try {
              const { data: directRatings, error: ratingsErr } = await supabase
                .from('ratings')
                .select('id, score, comment, created_at, reviewer_id, request_id')
                .eq('provider_id', resolvedTargetId)
                .order('created_at', { ascending: false });

              if (
                !ratingsErr &&
                Array.isArray(directRatings) &&
                directRatings.length > 0
              ) {
                const reviewerIds = [
                  ...new Set(
                    directRatings.map((r) => r.reviewer_id).filter(Boolean),
                  ),
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

                directRatings.forEach((rt) => {
                  const key = rt.id || `${rt.reviewer_id}_${rt.request_id}`;
                  reviewsMap.set(key, {
                    id: rt.id,
                    score: Number(rt.score),
                    comment: rt.comment,
                    tags: [],
                    created_at: rt.created_at,
                    reviewer_id: rt.reviewer_id,
                    request_id: rt.request_id,
                    reviewerName:
                      namesMap[rt.reviewer_id] ||
                      reviewsMap.get(key)?.reviewerName ||
                      'Community Member',
                  });
                });
              }
            } catch (_) {}
          }

          // C) Local AsyncStorage community ratings cache
          try {
            const rawLocal = await AsyncStorage.getItem(
              COMMUNITY_RATINGS_STORAGE_KEY,
            );
            if (rawLocal) {
              const localArr = JSON.parse(rawLocal);
              if (Array.isArray(localArr)) {
                const searchName = (pFullName || targetName || '').toLowerCase().trim();
                localArr
                  .filter((item) => {
                    if (!item) return false;
                    if (
                      resolvedTargetId &&
                      (item.provider_id === resolvedTargetId ||
                        item.recipient_id === resolvedTargetId)
                    ) {
                      return true;
                    }
                    if (
                      searchName &&
                      ((item.recipientName &&
                        item.recipientName.toLowerCase().trim() === searchName) ||
                        (item.provider_name &&
                          item.provider_name.toLowerCase().trim() === searchName))
                    ) {
                      return true;
                    }
                    return false;
                  })
                  .forEach((item) => {
                    const key =
                      item.id || `${item.reviewer_id}_${item.request_id}`;
                    if (!reviewsMap.has(key)) {
                      reviewsMap.set(key, {
                        id: item.id || key,
                        score: Number(item.score || 5),
                        comment: item.comment || '',
                        tags: Array.isArray(item.tags) ? item.tags : [],
                        created_at: item.created_at || new Date().toISOString(),
                        reviewer_id: item.reviewer_id,
                        request_id: item.request_id,
                        reviewerName: item.reviewerName || 'Community Member',
                      });
                    }
                  });
              }
            }
          } catch (_) {}

          if (!active) return;

          const mergedReviews = Array.from(reviewsMap.values()).sort(
            (a, b) => new Date(b.created_at) - new Date(a.created_at),
          );

          if (mergedReviews.length > 0) {
            const sum = mergedReviews.reduce((acc, curr) => acc + curr.score, 0);
            pRating = Number((sum / mergedReviews.length).toFixed(1));
            pCompletedCount = Math.max(pCompletedCount, mergedReviews.length);
          }

          setProfileName(pFullName);
          setProfileHandle(pHandle);
          setProfileBio(pBio);
          setProfilePhone(pPhone);
          setReviews(mergedReviews);
          setCompletedCount(pCompletedCount);
          setRating(pRating);
        } catch (e) {
          if (active) setError(e.message || 'Could not load profile details.');
        } finally {
          if (active) setLoading(false);
        }
      }
      load();

      let channel = null;
      let globalChannel = null;

      if (supabase) {
        try {
          if (targetId) {
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
                },
              )
              .on('broadcast', { event: 'new_rating' }, () => {
                if (active) load();
              })
              .subscribe();
          }

          globalChannel = supabase
            .channel('community_ratings_feed')
            .on('broadcast', { event: 'new_rating' }, () => {
              if (active) load();
            })
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
        if (globalChannel && supabase) {
          try {
            supabase.removeChannel(globalChannel);
          } catch (_) {}
        }
      };
    }, [targetId, own, targetName]),
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
