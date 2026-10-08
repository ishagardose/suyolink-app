const { expect } = require('@playwright/test');
const host = 'suyolink-test.supabase.co';
const storageKey = `sb-${host.split('.')[0]}-auth-token`;
const user = {
  id: '11111111-1111-4111-8111-111111111111',
  email: 'requester@example.com',
  email_confirmed_at: '2026-09-26T00:00:00Z',
  aud: 'authenticated',
  role: 'authenticated',
  user_metadata: { full_name: 'Request Tester' },
};
const session = {
  access_token: 'test-access-token',
  refresh_token: 'test-refresh-token',
  token_type: 'bearer',
  expires_in: 3600,
  expires_at: Math.floor(Date.now() / 1000) + 3600,
  user,
};
async function mockSupabase(
  page,
  {
    signedIn = false,
    confirmation = false,
    rejectLogin = false,
    requests = [],
    workflow = {},
    locationSetup = true,
  } = {},
) {
  let profile = { full_name: user.user_metadata.full_name };
  let contacts = { phone: '', address: '' };
  const calls = [];
  if (locationSetup)
    await page.addInitScript((id) => {
      const key = `@suyolink/location/${id}`;
      if (!localStorage.getItem(key))
        localStorage.setItem(
          key,
          JSON.stringify({
            position: { latitude: 7.07, longitude: 125.6 },
            source: 'gps',
          }),
        );
    }, user.id);
  calls.requests = requests;
  await page.route('https://tile.openstreetmap.org/**', (route) =>
    route.fulfill({
      contentType: 'image/png',
      body: Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=',
        'base64',
      ),
    }),
  );
  await page.route(`https://${host}/**`, async (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    const body = request.postDataJSON();
    calls.push({
      path,
      body,
      query: new URL(request.url()).searchParams.toString(),
    });
    let json;
    if (path === '/auth/v1/token') {
      if (rejectLogin)
        return route.fulfill({
          status: 400,
          json: {
            code: 'invalid_credentials',
            msg: 'Invalid login credentials',
          },
        });
      json = session;
    } else if (path === '/auth/v1/verify') {
      if (
        body.token !== '012345' ||
        !['email', 'recovery'].includes(body.type) ||
        body.email !== user.email
      ) {
        return route.fulfill({
          status: 403,
          headers: {
            'x-supabase-api-version': '2024-01-01',
            'access-control-expose-headers': 'x-supabase-api-version',
          },
          json: { code: 'otp_expired', msg: 'Token has expired or is invalid' },
        });
      }
      json = session;
    } else if (path === '/auth/v1/recover') {
      json = {};
    } else if (path === '/auth/v1/signup') {
      const registered = {
        ...user,
        email: body.email,
        user_metadata: body.data,
      };
      profile.full_name = body.data.full_name;
      json = confirmation ? registered : { ...session, user: registered };
    } else if (path === '/rest/v1/suyo_requests') {
      json = requests;
    } else if (
      [
        'applications',
        'proofs',
        'ratings',
        'notifications',
        'request_events',
      ].some((table) => path === '/rest/v1/' + table)
    ) {
      const table = path.split('/').pop();
      json = workflow[table] || [];
      if (request.method() === 'PATCH' || request.method() === 'DELETE') {
        if (workflow.notificationWriteError && table === 'notifications') {
          return route.fulfill({
            status: 403,
            json: { message: 'Notification update denied' },
          });
        }
        const params = new URL(request.url()).searchParams;
        const idFilter = params.get('id');
        const selected = json.filter((item) => {
          const idMatches =
            !idFilter ||
            (idFilter.startsWith('in.')
              ? idFilter.slice(4, -1).split(',').includes(item.id)
              : item.id === idFilter.replace('eq.', ''));
          return (
            idMatches &&
            (params.get('read_at') !== 'is.null' || item.read_at == null)
          );
        });
        if (request.method() === 'PATCH')
          selected.forEach((item) => Object.assign(item, body));
        else workflow[table] = json.filter((item) => !selected.includes(item));
        json = selected;
      }
    } else if (
      path === '/rest/v1/rpc/create_suyo_request_v2' ||
      path === '/rest/v1/rpc/create_suyo_request_at_location'
    ) {
      json = requests.find(
        (item) => item.client_reference === body.p_client_reference,
      );
      if (!json) {
        json = {
          id: `request-${requests.length + 1}`,
          requester_id: user.id,
          provider_id: null,
          title: body.p_title,
          details: body.p_details,
          category: body.p_category,
          offer_centavos: body.p_offer_centavos,
          deadline: body.p_deadline,
          location: body.p_public_location || body.p_location,
          notes: body.p_notes,
          latitude: body.p_latitude,
          longitude: body.p_longitude,
          client_reference: body.p_client_reference,
          status: 'open',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          requester: profile,
          exact_address: body.p_exact_address,
          contact_phone: body.p_contact_phone,
        };
        requests.unshift(json);
      }
    } else if (
      path === '/rest/v1/rpc/edit_suyo_request' ||
      path === '/rest/v1/rpc/set_suyo_reward_boost'
    ) {
      const r = requests.find((item) => item.id === body.p_request_id);
      if (!r)
        return route.fulfill({
          status: 404,
          json: { message: 'Task unavailable.' },
        });
      if (path.endsWith('/edit_suyo_request')) {
        Object.assign(r, {
          title: body.p_title,
          details: body.p_details,
          notes: body.p_notes,
          offer_centavos: body.p_offer_centavos,
          reward_boost_centavos: 0,
        });
      } else {
        r.offer_centavos =
          r.offer_centavos -
          (r.reward_boost_centavos || 0) +
          body.p_boost_centavos;
        r.reward_boost_centavos = body.p_boost_centavos;
      }
      json = r;
    } else if (
      path === '/rest/v1/live_locations' ||
      path === '/rest/v1/tracking_consents'
    ) {
      json = null;
    } else if (path === '/rest/v1/rpc/accept_suyo') {
      const request = requests.find((item) => item.id === body.p_request_id);
      if (
        !request ||
        request.status !== 'open' ||
        request.requester_id === user.id ||
        Date.parse(request.deadline) <= Date.now()
      ) {
        return route.fulfill({
          status: 409,
          json: { message: 'Task cannot be accepted.' },
        });
      }
      request.provider_id = user.id;
      request.status = 'assigned';
      json = request;
    } else if (path === '/rest/v1/rpc/list_suyo_requests') {
      const now = Date.now();
      let filtered = [...requests];
      if (body.p_scope === 'browse') {
        filtered = filtered.filter(
          (r) => r.status === 'open' && Date.parse(r.deadline) > now,
        );
      } else if (body.p_scope === 'posted') {
        filtered = filtered.filter((r) => r.requester_id === user.id);
      } else if (body.p_scope === 'assigned') {
        filtered = filtered.filter((r) => r.provider_id === user.id);
      }
      if (body.p_category)
        filtered = filtered.filter((r) => r.category === body.p_category);
      if (body.p_query) {
        const q = body.p_query.toLowerCase();
        filtered = filtered.filter((r) =>
          (r.title + ' ' + r.details + ' ' + r.location)
            .toLowerCase()
            .includes(q),
        );
      }
      json = filtered.map((r) => ({
        id: r.id,
        requester_id: r.requester_id,
        provider_id: r.provider_id,
        requester_name: r.requester?.full_name || 'Requester',
        title: r.title,
        details: r.details,
        category: r.category,
        offer_centavos: r.offer_centavos,
        reward_boost_centavos: r.reward_boost_centavos || 0,
        deadline: r.deadline,
        location: r.location,
        notes: r.notes,
        status: r.status,
        latitude: r.latitude,
        longitude: r.longitude,
        created_at: r.created_at,
        updated_at: r.updated_at,
        distance_km: null,
      }));
    } else if (path === '/rest/v1/rpc/get_suyo_details') {
      const r = requests.find((item) => item.id === body.p_request_id);
      if (!r) json = null;
      else {
        const isReq = r.requester_id === user.id;
        const isProv = r.provider_id === user.id;
        const role = isReq ? 'requester' : isProv ? 'provider' : 'unrelated';
        json = {
          id: r.id,
          requester_id: r.requester_id,
          provider_id: r.provider_id,
          requester_name: r.requester?.full_name || 'Requester',
          title: r.title,
          details: r.details,
          category: r.category,
          offer_centavos: r.offer_centavos,
          reward_boost_centavos: r.reward_boost_centavos || 0,
          currency: 'PHP',
          deadline: r.deadline,
          location: r.location,
          notes: r.notes,
          status: r.status,
          latitude: r.latitude,
          longitude: r.longitude,
          created_at: r.created_at,
          updated_at: r.updated_at,
          viewer_role: role,
          exact_address:
            isReq || isProv
              ? r.exact_address || '123 Private Street, Gate 2'
              : null,
          exact_latitude: isReq || isProv ? r.latitude : null,
          exact_longitude: isReq || isProv ? r.longitude : null,
          contact_phone:
            isReq || isProv ? r.contact_phone || '+639171234567' : null,
        };
      }
    } else if (path === '/rest/v1/rpc/save_last_location') {
      json = {
        user_id: user.id,
        latitude: body.p_latitude,
        longitude: body.p_longitude,
        source: body.p_source,
        updated_at: new Date().toISOString(),
      };
    } else if (path === '/rest/v1/rpc/get_my_last_location') {
      json = null;
    } else if (path === '/auth/v1/resend') {
      json = {};
    } else if (path === '/rest/v1/rpc/change_suyo_status') {
      const r = requests.find((item) => item.id === body.p_request_id);
      if (r) {
        const fromStatus = r.status;
        r.status = body.p_status;
        if (!workflow.request_events) workflow.request_events = [];
        workflow.request_events.push({
          id: `event-${workflow.request_events.length + 1}`,
          request_id: r.id,
          actor_id: user.id,
          from_status: fromStatus,
          to_status: r.status,
          created_at: new Date().toISOString(),
        });
      }
      json = r;
    } else if (path === '/rest/v1/rpc/submit_suyo_proof') {
      const r = requests.find((item) => item.id === body.p_request_id);
      if (r) {
        const fromStatus = r.status;
        r.status = 'awaiting_confirmation';
        if (!workflow.request_events) workflow.request_events = [];
        workflow.request_events.push({
          id: `event-${workflow.request_events.length + 1}`,
          request_id: r.id,
          actor_id: user.id,
          from_status: fromStatus,
          to_status: r.status,
          created_at: new Date().toISOString(),
        });
      }
      const proof = {
        id: `proof-${(workflow.proofs || []).length + 1}`,
        request_id: body.p_request_id,
        provider_id: user.id,
        storage_path: body.p_storage_path,
        note: body.p_note || '',
        status: 'submitted',
        created_at: new Date().toISOString(),
      };
      if (!workflow.proofs) workflow.proofs = [];
      workflow.proofs.push(proof);
      json = proof;
    } else if (path === '/rest/v1/rpc/get_suyo_profile') {
      const targetId = body.p_user_id;
      const identity =
        targetId === user.id
          ? profile
          : workflow.profiles?.[targetId] || {
              full_name: 'Other Neighbor',
              handle: '',
              bio: '',
            };
      const reviews = (workflow.ratings || []).filter(
        (r) => !r.provider_id || r.provider_id === targetId,
      );
      json = {
        id: targetId,
        handle: '',
        bio: '',
        ...identity,
        completed_count: requests.filter(
          (r) =>
            r.status === 'completed' &&
            (r.provider_id === targetId || r.requester_id === targetId),
        ).length,
        rating: reviews.length
          ? reviews.reduce((sum, r) => sum + r.score, 0) / reviews.length
          : null,
        reviews,
      };
    } else if (path === '/rest/v1/rpc/get_my_transactions') {
      json = (workflow.transactions || []).map((t) => ({
        request_id: t.request_id,
        title: t.title,
        role: t.role,
        other_user_id: t.other_user_id || user.id,
        other_user_name: t.other_user_name || 'SuyoLink user',
        reward_centavos: t.reward_centavos,
        currency: t.currency || 'PHP',
        completed_at: t.completed_at,
        rating_score: t.rating_score ?? null,
        rating_comment: t.rating_comment ?? null,
      }));
    } else if (path === '/auth/v1/logout') {
      return route.fulfill({ status: 204 });
    } else if (path === '/auth/v1/user') json = user;
    else if (path === '/rest/v1/profiles') {
      if (request.method() === 'PATCH') profile = { ...profile, ...body };
      json = profile;
    } else if (path === '/rest/v1/profile_contacts') {
      if (request.method() === 'PATCH') contacts = { ...contacts, ...body };
      json = contacts;
    } else
      return route.fulfill({
        status: 500,
        json: { message: `Unhandled test endpoint ${path}` },
      });
    return route.fulfill({ json });
  });
  if (signedIn)
    await page.addInitScript(
      ({ storageKey, session }) => {
        if (!localStorage.getItem(storageKey))
          localStorage.setItem(storageKey, JSON.stringify(session));
      },
      { storageKey, session },
    );
  return calls;
}
async function login(page) {
  await page.goto('/login');
  await page
    .getByRole('textbox', { name: 'Email Address', exact: true })
    .fill(user.email);
  await page
    .getByLabel('Password', { exact: true })
    .fill('correct-test-password');
  await page.getByRole('button', { name: 'Log In', exact: true }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
}
module.exports = { mockSupabase, login, storageKey };
