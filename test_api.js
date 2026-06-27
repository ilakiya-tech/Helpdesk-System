// test_api.js - Full API test
const BASE = 'http://localhost:3000/api';

async function post(path, body, tok) {
  const r = await fetch(BASE + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(tok ? { Authorization: 'Bearer ' + tok } : {}) },
    body: JSON.stringify(body)
  });
  return r.json();
}

async function get(path, tok) {
  const r = await fetch(BASE + path, { headers: tok ? { Authorization: 'Bearer ' + tok } : {} });
  return r.json();
}

async function put(path, body, tok) {
  const r = await fetch(BASE + path, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + tok },
    body: JSON.stringify(body)
  });
  return r.json();
}

let pass = 0, fail = 0;
function check(label, condition, got) {
  if (condition) { console.log('  ✅ PASS  ' + label); pass++; }
  else { console.log('  ❌ FAIL  ' + label + ' → ' + JSON.stringify(got).slice(0, 80)); fail++; }
}

async function run() {
  let r;

  console.log('\n=== AUTH ===');
  r = await post('/auth', { username: 'admin', password: 'admin123' });
  check('admin login', r.success && r.user.role === 'admin', r);
  const adminTok = r.token;

  r = await post('/auth', { username: 'staff', password: 'staff123' });
  check('staff login', r.success && r.user.role === 'staff', r);
  const staffTok = r.token;

  r = await post('/auth', { username: 'client', password: 'client123' });
  check('client login', r.success && r.user.role === 'client', r);
  const clientTok = r.token;

  r = await post('/auth', { username: 'ravi', password: 'staff123' });
  check('ravi (network staff) login', r.success && r.user.role === 'staff', r);

  r = await post('/auth', { username: 'admin', password: 'wrongpass' });
  check('bad password rejected', !r.success, r);

  console.log('\n=== TICKETS ===');
  r = await get('/tickets', adminTok);
  check('get all tickets (admin)', r.success && Array.isArray(r.tickets), r);
  check('seeded tickets exist', r.tickets.length >= 4, r);

  // Create ticket - should auto-assign to Ravi (Network category)
  r = await post('/tickets', { title: 'WiFi Down in Office', description: 'Cannot connect to WiFi on 2nd floor', priority: 'High', category: 'Network', customerName: 'Test User', email: 'test@test.com', mobile: '9876543210' }, clientTok);
  check('create ticket', r.success, r);
  check('ticket created unassigned by default', !r.ticket?.assignedToName, r);
  const newId = r.ticket?._id;

  r = await get('/tickets/' + newId, adminTok);
  check('get ticket by id', r.success && r.ticket._id === newId, r);

  r = await put('/tickets/' + newId + '/status', { status: 'In Progress' }, adminTok);
  check('update status', r.success, r);

  r = await post('/tickets/' + newId + '/comment', { text: 'Checked the router, working on it' }, staffTok);
  check('add comment', r.success, r);

  r = await get('/mytickets', clientTok);
  check('my tickets (client)', r.success && Array.isArray(r.tickets), r);

  r = await get('/assigned', staffTok);
  check('assigned tickets (staff)', r.success && Array.isArray(r.tickets), r);

  console.log('\n=== ADMIN ===');
  r = await get('/stats', adminTok);
  check('stats endpoint', r.success && r.stats.total > 0, r);

  r = await get('/admin/staff', adminTok);
  check('staff list with load', r.success && r.staff.length >= 5, r);
  check('staff has category', r.staff[0]?.category !== undefined, r);

  r = await get('/admin/workload', adminTok);
  check('staff workload', r.success, r);

  r = await get('/admin/holidays', adminTok);
  check('holidays list', r.success && r.holidays.length >= 10, r);

  r = await post('/admin/holidays', { date: '2099-12-31', name: 'Test Holiday', type: 'optional' }, adminTok);
  check('add holiday', r.success, r);

  r = await get('/admin/staff/available?category=Network', adminTok);
  check('available staff by category', r.success, r);

  const uniq = Date.now();
  r = await post('/admin/staff', { username: 'newtech' + uniq, name: 'New Tech', password: 'staff123', category: 'Hardware' }, adminTok);
  check('add new staff', r.success, r);

  // Assign ticket
  r = await put('/tickets/' + newId + '/assign', { staffUsername: 'ravi' }, adminTok);
  check('assign ticket', r.success, r);

  console.log('\n=== REGISTER / OTP ===');
  r = await post('/register', { username: 'newclient' + uniq, password: 'client123', role: 'client', name: 'New Client' }, adminTok);
  check('register new client', r.success, r);

  r = await post('/forgot-password', { username: 'admin', newPassword: 'admin123' });
  check('forgot password by username', r.success, r);

  r = await get('/users', adminTok);
  check('get users (new route)', r.success && Array.isArray(r.users), r);

  r = await get('/staff', adminTok);
  check('get staff (new route)', r.success && Array.isArray(r.staff), r);

  r = await get('/holidays', adminTok);
  check('get holidays (new route)', r.success, r);

  r = await get('/dashboard/summary', adminTok);
  check('dashboard summary', r.success && r.summary, r);

  r = await get('/tickets/' + newId + '/history', adminTok);
  check('ticket history', r.success, r);

  r = await get('/tickets/' + newId + '/comments', adminTok);
  check('ticket comments', r.success, r);

  console.log('\n==========================================');
  console.log(`  RESULTS: ${pass} passed, ${fail} failed`);
  console.log('==========================================\n');
}

run().catch(console.error);
