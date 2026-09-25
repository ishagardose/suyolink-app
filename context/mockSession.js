export function normalizeUser(profile) {
  const email = typeof profile?.email === 'string' ? profile.email.trim().toLowerCase() : '';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Enter a valid email address.');
  return {
    name: typeof profile.name === 'string' && profile.name.trim() ? profile.name.trim() : email.split('@')[0],
    email,
    phone: typeof profile.phone === 'string' ? profile.phone.trim() : '',
    address: typeof profile.address === 'string' ? profile.address.trim() : '',
  };
}
export function readStoredUser(stored) {
  try { return stored ? normalizeUser(JSON.parse(stored)) : null; }
  catch { return null; }
}
