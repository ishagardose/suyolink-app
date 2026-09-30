const { expect } = require('@playwright/test');
const host = 'suyolink-test.supabase.co';
const storageKey = `sb-${host.split('.')[0]}-auth-token`;
const user = { id: '11111111-1111-4111-8111-111111111111', email: 'requester@example.com', email_confirmed_at: '2026-09-26T00:00:00Z', aud: 'authenticated', role: 'authenticated', user_metadata: { full_name: 'Request Tester' } };
const session = { access_token: 'test-access-token', refresh_token: 'test-refresh-token', token_type: 'bearer', expires_in: 3600, expires_at: Math.floor(Date.now() / 1000) + 3600, user };
async function mockSupabase(page, { signedIn = false, confirmation = false, rejectLogin = false, requests = [], workflow = {}, locationSetup = true } = {}) {
  let profile = { full_name: user.user_metadata.full_name };
  let contacts = { phone: '', address: '' };
  const calls = [];
  if (locationSetup) await page.addInitScript(id => {
    const key = `@suyolink/location/${id}`;
    if (!localStorage.getItem(key)) localStorage.setItem(key, JSON.stringify({ position: { latitude: 7.07, longitude: 125.6 }, source: 'gps' }));
  }, user.id);
  calls.requests = requests;
  await page.route('https://tile.openstreetmap.org/**', route => route.fulfill({ contentType: 'image/png',
    body: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=', 'base64') }));
  await page.route(`https://${host}/**`, async (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    const body = request.postDataJSON();
    calls.push({ path, body, query: new URL(request.url()).searchParams.toString() });
    let json;
    if (path === '/auth/v1/token') {
      if (rejectLogin) return route.fulfill({ status: 400, json: { code: 'invalid_credentials', msg: 'Invalid login credentials' } });
      json = session;
    } else if (path === '/auth/v1/verify') {
      if (body.token !== '012345' || !['email', 'recovery'].includes(body.type) || body.email !== user.email) {
        return route.fulfill({ status: 403, headers: { 'x-supabase-api-version': '2024-01-01',
          'access-control-expose-headers': 'x-supabase-api-version' },
          json: { code: 'otp_expired', msg: 'Token has expired or is invalid' } });
      }
      json = session;
    } else if (path === '/auth/v1/recover') {
      json = {};
    } else if (path === '/auth/v1/signup') {
      const registered = { ...user, email: body.email, user_metadata: body.data };
      profile.full_name = body.data.full_name;
      json = confirmation ? registered : { ...session, user: registered };
    } else if (path === '/rest/v1/suyo_requests') {
      json = requests;
    } else if (['applications', 'proofs', 'ratings', 'notifications', 'request_events'].some(table => path === '/rest/v1/' + table)) {
      const table = path.split('/').pop();
      json = workflow[table] || [];
      if (request.method() === 'PATCH') {
        const id = new URL(request.url()).searchParams.get('id')?.replace('eq.', '');
        json.filter(item => item.id === id).forEach(item => Object.assign(item, body));
      }
    } else if (path === '/rest/v1/rpc/create_suyo_request_v2' || path === '/rest/v1/rpc/create_suyo_request_at_location') {
      json = requests.find(item => item.client_reference === body.p_client_reference);
      if (!json) {
        json = { id: `request-${requests.length + 1}`, requester_id: user.id, provider_id: null,
          title: body.p_title, details: body.p_details, category: body.p_category,
          offer_centavos: body.p_offer_centavos, deadline: body.p_deadline,
          location: body.p_public_location || body.p_location,
          notes: body.p_notes,
          latitude: body.p_latitude, longitude: body.p_longitude,
          client_reference: body.p_client_reference, status: 'open', created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(), requester: profile,
          exact_address: body.p_exact_address, contact_phone: body.p_contact_phone };
        requests.unshift(json);
      }
    } else if (path === '/rest/v1/rpc/save_last_location') {
      json = { user_id: user.id, latitude: body.p_latitude, longitude: body.p_longitude, source: body.p_source, updated_at: new Date().toISOString() };
    } else if (path === '/rest/v1/rpc/get_my_last_location') {
      json = null;
    } else if (path === '/auth/v1/resend') {
      json = {};
    } else if (path === '/auth/v1/logout') {
      return route.fulfill({ status: 204 });
    } else if (path === '/auth/v1/user') json = user;
    else if (path === '/rest/v1/profiles') {
      if (request.method() === 'PATCH') profile = { ...profile, ...body };
      json = profile;
    } else if (path === '/rest/v1/profile_contacts') {
      if (request.method() === 'PATCH') contacts = { ...contacts, ...body };
      json = contacts;
    } else return route.fulfill({ status: 500, json: { message: `Unhandled test endpoint ${path}` } });
    return route.fulfill({ json });
  });
  if (signedIn) await page.addInitScript(({ storageKey, session }) => {
    if (!localStorage.getItem(storageKey)) localStorage.setItem(storageKey, JSON.stringify(session));
  }, { storageKey, session });
  return calls;
}
async function login(page) {
  await page.goto('/login');
  await page.getByRole('textbox', { name: 'Email Address', exact: true }).fill(user.email);
  await page.getByLabel('Password', { exact: true }).fill('correct-test-password');
  await page.getByRole('button', { name: 'Log In', exact: true }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
}
module.exports = { mockSupabase, login, storageKey };
