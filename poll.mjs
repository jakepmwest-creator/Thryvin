const BASE = 'https://183e52f2-9a92-4f73-838c-9f40699f15a8-00-x6ttfb9ai68e.janeway.replit.dev'; // your URL
const email = 'test@example.com';
const password = 'password123';
// 👇 change to today's date (YYYY-MM-DD) if needed
const date = '2025-09-24';

async function login() {
  const r = await fetch(BASE + '/api/auth/login', {
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body: JSON.stringify({ email, password })
  });
  const cookie = r.headers.get('set-cookie') || '';
  const raw = await r.text();
  return { ok: r.ok, cookie, raw };
}
function headers(cookie){ return cookie ? { Cookie: cookie } : {}; }
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function poll() {
  const auth = await login();
  if (!auth.ok) { console.log('Login failed:', auth.raw.slice(0,200)); return; }
  console.log('Logged in (cookie session). Polling…');

  // kick generation (safe to call again)
  await fetch(BASE + '/api/v1/workouts/generate-day', {
    method:'POST',
    headers:{'Content-Type':'application/json', ...headers(auth.cookie)},
    body: JSON.stringify({ date })
  });

  // poll up to ~40s
  for (let i=0;i<20;i++){
    const r = await fetch(${BASE}/api/v1/workouts/day?date=${date}, { headers: headers(auth.cookie) });
    const txt = await r.text();
    try {
      const json = JSON.parse(txt);
      console.log(Try #${i+1}:, json.status);
      if (json.status === 'ready' || json.status === 'error' || json.status === 'not_found') {
        console.log('FINAL:', JSON.stringify(json, null, 2));
        return;
      }
    } catch {
      console.log(Try #${i+1}: not JSON, txt.slice


cat > poll.mjs <<'JS'
const BASE = 'https://183e52f2-9a92-4f73-838c-9f40699f15a8-00-x6ttfb9ai68e.janeway.replit.dev'; // your URL
const email = 'test@example.com';
const password = 'password123';
// 👇 change to today's date (YYYY-MM-DD) if needed
const date = '2025-09-24';

async function login() {
  const r = await fetch(BASE + '/api/auth/login', {
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body: JSON.stringify({ email, password })
  });
  const cookie = r.headers.get('set-cookie') || '';
  const raw = await r.text();
  return { ok: r.ok, cookie, raw };
}
function headers(cookie){ return cookie ? { Cookie: cookie } : {}; }
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function poll() {
  const auth = await login();
  if (!auth.ok) { console.log('Login failed:', auth.raw.slice(0,200)); return; }
  console.log('Logged in (cookie session). Polling…');

  // kick generation (safe to call again)
  await fetch(BASE + '/api/v1/workouts/generate-day', {
    method:'POST',
    headers:{'Content-Type':'application/json', ...headers(auth.cookie)},
    body: JSON.stringify({ date })
  });

  // poll up to ~40s
  for (let i=0;i<20;i++){
    const r = await fetch(${BASE}/api/v1/workouts/day?date=${date}, { headers: headers(auth.cookie) });
    const txt = await r.text();
    try {
      const json = JSON.parse(txt);
      console.log(Try #${i+1}:, json.status);
      if (json.status === 'ready' || json.status === 'error' || json.status === 'not_found') {
        console.log('FINAL:', JSON.stringify(json, null, 2));
        return;
      }
    } catch {
      console.log(Try #${i+1}: not JSON, txt.slice(0,120));
    }
    await sleep(2000);
  }
  console.log('Timeout: still generating after 40s.');
}
poll().catch(console.error);
