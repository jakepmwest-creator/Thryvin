const BASE = 'https://183e52f2-9a92-4f73-838c-9f40699f15a8-00-x6ttfb9ai68e.janeway.replit.dev'; // your URL
const email = 'test@example.com';
const password = 'password123';
// 🔁 CHANGE THIS TO TODAY (YYYY-MM-DD)
const date = '2025-09-24';

async function login() {
  // Most projects use /api/auth/login (WITHOUT v1). If yours differs, change it here:
  const url = BASE + '/api/auth/login';
  const r = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const setCookie = r.headers.get('set-cookie') || '';
  const text = await r.text();
  let token = null;
  try { token = JSON.parse(text).token || null; } catch {}
  return { status: r.status, cookie: setCookie, token, raw: text };
}

function authHeaders(auth) {
  const h = {};
  if (auth.token) h['Authorization'] = 'Bearer ' + auth.token;
  if (auth.cookie) h['Cookie'] = auth.cookie;
  return h;
}

async function genDay(auth) {
  const r = await fetch(BASE + '/api/v1/workouts/generate-day', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders(auth) },
    body: JSON.stringify({ date })
  });
  return await r.text();
}

async function getDay(auth) {
  const r = await fetch(BASE + '/api/v1/workouts/day?date=' + date, {
    headers: authHeaders(auth)
  });
  return await r.text();
}

(async () => {
  console.log('== LOGIN ==');
  const auth = await login();
  console.log('login status:', auth.status);
  console.log('token?', !!auth.token, 'cookie?', !!auth.cookie);
  if (auth.status !== 200) { console.log('login body:', auth.raw.slice(0,200)); return; }

  console.log('\n== GENERATE TODAY ==');
  console.log(await genDay(auth));

  console.log('\n== FETCH TODAY ==');
  console.log(await getDay(auth));
})();
