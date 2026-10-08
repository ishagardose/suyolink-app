import { unregisterPush } from '../lib/pushNotifications';
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { AppState, Platform } from 'react-native';
import { supabase, authConfigError } from '../lib/supabase';
import { hasCoordinates } from '../lib/geo';
import { stageSignupLocation } from '../lib/signupLocation';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [profileError, setProfileError] = useState('');

  useEffect(() => {
    if (!supabase) {
      setIsLoading(false);
      return;
    }
    // Keep this callback synchronous: queries inside it can block the auth lock.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setIsLoading(false);
    });
    const refresh = (state) => {
      if (state === 'active') supabase.auth.startAutoRefresh();
      else supabase.auth.stopAutoRefresh();
    };
    const listener =
      Platform.OS !== 'web'
        ? AppState.addEventListener('change', refresh)
        : null;
    if (Platform.OS !== 'web') refresh(AppState.currentState);
    return () => {
      subscription.unsubscribe();
      listener?.remove();
      if (Platform.OS !== 'web') supabase.auth.stopAutoRefresh();
    };
  }, []);

  const account = session?.user;
  useEffect(() => {
    let active = true;
    setProfile(null);
    setProfileError('');
    if (account?.id) {
      Promise.all([
        supabase
          .from('profiles')
          .select('full_name')
          .eq('id', account.id)
          .single(),
        supabase
          .from('profile_contacts')
          .select('phone,address')
          .eq('user_id', account.id)
          .single(),
      ])
        .then(([details, contacts]) => {
          if (!active) return;
          if (details.error || contacts.error) {
            setProfileError(
              'Could not load your profile. Reopen the app to retry.',
            );
            return;
          }
          setProfile({
            id: account.id,
            name: details.data.full_name,
            ...contacts.data,
          });
        })
        .catch(() => {
          if (active)
            setProfileError(
              'Could not load your profile. Reopen the app to retry.',
            );
        });
    }
    return () => {
      active = false;
    };
  }, [account?.id]);

  const value = useMemo(() => {
    const user = account
      ? {
          id: account.id,
          name:
            account.user_metadata?.full_name ||
            account.email?.split('@')[0] ||
            'SuyoLink user',
          phone: '',
          address: '',
          ...(profile?.id === account.id ? profile : {}),
          email: account.email || '',
          emailVerified: !!account.email_confirmed_at,
        }
      : null;
    return {
      user,
      isLoggedIn: !!account,
      isLoading,
      profileError,
      isProfileReady: profile?.id === account?.id && !!profile,
      login: async ({ email, password }) => {
        if (!supabase) throw new Error(authConfigError);
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim().toLowerCase(),
          password,
        });
        if (error) throw error;
      },
      signup: async ({ email, password, name, location, acknowledged }) => {
        if (!supabase) throw new Error(authConfigError);
        if (
          location &&
          hasCoordinates(location?.position) &&
          acknowledged === true
        ) {
          await stageSignupLocation(email, location.position, location.source);
        }
        const { data, error } = await supabase.auth.signUp({
          email: email.trim().toLowerCase(),
          password,
          options: { data: { full_name: name.trim() } },
        });
        if (error) throw error;
        return { needsConfirmation: !data.session };
      },
      resendVerification: async (email) => {
        if (!supabase) throw new Error(authConfigError);
        const { error } = await supabase.auth.resend({
          type: 'signup',
          email: email.trim().toLowerCase(),
        });
        if (error) throw error;
      },
      verifyEmailCode: async ({ email, token }) => {
        if (!supabase) throw new Error(authConfigError);
        const { data, error } = await supabase.auth.verifyOtp({
          email: email.trim().toLowerCase(),
          token: token.trim(),
          type: 'email',
        });
        if (error) throw error;
        if (!data.session || !data.user?.email_confirmed_at) {
          throw new Error(
            'Your email is not confirmed yet. Request a new code and try again.',
          );
        }
      },
      logout: async () => {
        await unregisterPush();
        const { error } = await supabase.auth.signOut({ scope: 'local' });
        if (error) throw error;
      },
      updateProfile: async (draft) => {
        if (!user) throw new Error('Please log in first.');
        if (profileError || !profile)
          throw new Error(
            'Your profile has not loaded. Reopen the app before editing.',
          );
        const name = draft.name.trim();
        const phone = draft.phone.trim();
        const address = draft.address.trim();
        if (
          !name ||
          name.length > 100 ||
          phone.length > 40 ||
          address.length > 250
        ) {
          throw new Error(
            'Use a name up to 100 characters, phone up to 40, and address up to 250.',
          );
        }
        const publicDetails = { full_name: name };
        if (draft.handle !== undefined)
          publicDetails.handle = draft.handle.trim();
        if (draft.bio !== undefined) publicDetails.bio = draft.bio.trim();
        if (
          (publicDetails.handle?.length || 0) > 40 ||
          (publicDetails.bio?.length || 0) > 1000
        ) {
          throw new Error(
            'Use a handle up to 40 characters and a bio up to 1000.',
          );
        }
        const details = await supabase
          .from('profiles')
          .update(publicDetails)
          .eq('id', user.id)
          .select('full_name')
          .single();
        if (details.error) throw details.error;
        setProfile((current) =>
          current?.id === user.id ? { ...current, name } : current,
        );
        const contacts = await supabase
          .from('profile_contacts')
          .update({ phone, address })
          .eq('user_id', user.id)
          .select('phone,address')
          .single();
        if (contacts.error)
          throw new Error(
            'Profile saved, but contact details could not be saved. Please retry.',
          );
        setProfile((current) =>
          current?.id === user.id ? { ...current, phone, address } : current,
        );
      },
    };
  }, [account, profile, profileError, isLoading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside AuthProvider');
  return value;
}
