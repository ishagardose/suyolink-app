// Supabase sends implicit-flow tokens in the fragment, or a PKCE code in the query.
// Never treat a URL flag or email address as evidence of verification.
export function readVerificationLink(url) {
  if (!url) return null;
  const parsed = new URL(url);
  const path = `${parsed.hostname}/${parsed.pathname}`.replace(/\/+/g, '/').replace(/\/$/, '');
  if (!path.endsWith('/verify-email') && path !== 'verify-email') return null;
  const params = new URLSearchParams(parsed.search);
  new URLSearchParams(parsed.hash.slice(1)).forEach((value, key) => params.set(key, value));
  if (params.has('error') || params.has('error_code')) {
    throw new Error('This verification link has expired or is no longer valid. Request a new email below.');
  }
  if (params.has('type') && !['signup', 'email'].includes(params.get('type'))) {
    throw new Error('This is not an email signup confirmation link.');
  }
  if (params.get('code')) return { code: params.get('code') };
  if (params.has('access_token') || params.has('refresh_token')) {
    if (!params.get('access_token') || !params.get('refresh_token')) {
      throw new Error('This verification link is incomplete. Request a new email below.');
    }
    return { access_token: params.get('access_token'), refresh_token: params.get('refresh_token') };
  }
  return null;
}

export async function finishEmailVerification(client, link) {
  const { data, error } = link.code
    ? await client.auth.exchangeCodeForSession(link.code)
    : await client.auth.setSession(link);
  if (error) throw new Error('We could not sign you in from this link. Try a new verification email, or log in if you already confirmed your email.');
  if (!data.session || !data.user?.email_confirmed_at) {
    throw new Error('Your email is not confirmed yet. Open the latest verification email.');
  }
}
