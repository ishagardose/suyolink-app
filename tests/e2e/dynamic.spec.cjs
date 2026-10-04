const { test, expect } = require('@playwright/test');
const { mockSupabase } = require('./supabase-fixture.cjs');
const task={id:'live-task',requester_id:'another-user',provider_id:null,title:'A real database task',details:'Fetch groceries',category:'Groceries',offer_centavos:12500,deadline:'2099-12-31T12:00:00Z',location:'City market',notes:'Keep receipt',latitude:7.07,longitude:125.6,status:'open',created_at:'2026-10-04T12:00:00Z'};
test('dashboard uses database records and forwards filters',async({page})=>{
 const calls=await mockSupabase(page,{signedIn:true,requests:[task]});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/dashboard');await expect(page.getByText(task.title,{exact:true})).toBeVisible();
 await page.getByRole('button',{name:'Filters',exact:true}).click();
 await page.getByRole('button',{name:'Reward: high to low',exact:true}).click();
 await page.getByRole('button',{name:'Done',exact:true}).click();
 await expect.poll(()=>calls.some(c=>c.body?.p_sort==='reward_desc')).toBe(true);
 await page.getByRole('button',{name:'View details',exact:true}).click();
 await expect(page.getByRole('button',{name:'Accept task',exact:true})).toBeVisible();
 await expect(page.getByText('123 Private Street, Gate 2')).toHaveCount(0);
 expect(errors).toEqual([]);
});
test('location can be skipped without redirect loop',async({page})=>{
 await mockSupabase(page,{signedIn:true,locationSetup:false});await page.goto('/set-location');
 await page.getByRole('button',{name:'Not now',exact:true}).click();await expect(page).toHaveURL(/dashboard$/);
 await expect(page.getByText('Find a suyo',{exact:true})).toBeVisible();
});
test('posting keeps private fields out of public remarks and requires a chosen pin',async({page})=>{
 const calls=await mockSupabase(page,{signedIn:true});await page.goto('/post-suyo');
 await page.getByLabel('Title',{exact:true}).fill('Privacy test task');
 await page.getByRole('button',{name:'Groceries category',exact:true}).click();
 await page.getByLabel('Task details',{exact:true}).fill('Pick up groceries');
 await page.getByLabel('Reward amount',{exact:true}).fill('125');
 await page.getByLabel('Target date',{exact:true}).fill('2099-12-31');
 await page.getByLabel('Target time',{exact:true}).fill('12:30');
 await page.getByLabel('Public area',{exact:true}).fill('City market');
 await page.getByLabel('Exact address',{exact:true}).fill('123 Private Road');
 await page.getByLabel('Contact phone',{exact:true}).fill('09123456789');
 await page.getByLabel('Remarks',{exact:true}).fill('Keep receipt');
 await page.getByRole('button',{name:'Post request',exact:true}).click();
 await expect(page.getByText('Choose a location pin on the map',{exact:true})).toBeVisible();
 expect(calls.some(c=>c.path==='/rest/v1/rpc/create_suyo_request_v2')).toBe(false);
 await page.getByTestId('task-map').click({position:{x:100,y:100}});
 await page.getByRole('button',{name:'Post request',exact:true}).click();
 await expect(page.getByText('Suyo Posted Successfully!',{exact:true})).toBeVisible();
 const body=calls.find(c=>c.path==='/rest/v1/rpc/create_suyo_request_v2').body;
 expect(body.p_notes).toBe('Keep receipt');expect(body.p_public_location).toBe('City market');
 expect(body.p_exact_address).toBe('123 Private Road');expect(body.p_contact_phone).toBe('09123456789');
});
test('signed out users cannot open dashboard',async({page})=>{
 await mockSupabase(page);await page.goto('/dashboard');await expect(page).not.toHaveURL(/dashboard$/);
});

test('requester map displays live position and stop state from Supabase',async({page})=>{
 const me='11111111-1111-4111-8111-111111111111';
 const request={...task,requester_id:me,provider_id:'another-user',status:'in_progress'};
 await mockSupabase(page,{signedIn:true,requests:[request]});
 let stopped=false;
 await page.route('**/rest/v1/live_locations?**',route=>route.fulfill({json:stopped?null:{request_id:task.id,provider_id:'another-user',latitude:7.0701,longitude:125.6001,speed:2,accuracy:5,arrived:true,updated_at:new Date().toISOString()}}));
 await page.route('**/rest/v1/tracking_consents?**',route=>route.fulfill({json:{request_id:task.id,revoked_at:stopped?new Date().toISOString():null}}));
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/map?requestId=live-task');
 await expect(page.getByText('Doer is near the destination',{exact:true})).toBeVisible();
 await expect(page.getByTestId('task-map')).toBeVisible();
 stopped=true;
 await expect(page.getByText('Location sharing has stopped',{exact:true})).toBeVisible({timeout:12000});
 expect(errors).toEqual([]);
});
test('wallet alias shows real transaction totals and dashboard fits a phone',async({page})=>{
 await mockSupabase(page,{signedIn:true,requests:[task],workflow:{transactions:[{request_id:task.id,title:'Completed task',role:'provider',reward_centavos:12500,completed_at:new Date().toISOString()}]}});
 await page.goto('/wallet');await expect(page.getByLabel('Total earned \u20b1125.00',{exact:true})).toBeVisible();
 await page.goto('/dashboard');await expect(page.getByText(task.title,{exact:true})).toBeVisible();
 await page.screenshot({path:'.cache/dynamic-dashboard.png',fullPage:true});
 await page.setViewportSize({width:1440,height:1000});
 await page.screenshot({path:'.cache/dynamic-desktop.png',fullPage:true});
 expect(await page.evaluate(()=>document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test('posting layout supports dark mode without horizontal overflow', async ({page}) => {
 await mockSupabase(page,{signedIn:true});
 await page.addInitScript(()=>localStorage.setItem('@suyolink/theme','dark'));
 await page.goto('/post-suyo');
 await expect(page.getByText('What do you need?',{exact:true})).toBeVisible();
 await expect(page.getByLabel('Public area',{exact:true})).toBeAttached();
 await page.screenshot({path:'.cache/posting-dark.png',fullPage:true});
 await page.getByLabel('Public area',{exact:true}).scrollIntoViewIfNeeded();
 await page.screenshot({path:'.cache/posting-dark-location.png',fullPage:true});
 expect(await page.evaluate(()=>document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});
