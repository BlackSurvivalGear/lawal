const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const source = fs.readFileSync(process.env.AUTH_SOURCE || 'app.js', 'utf8');

function harness({ provider = 'google.com', verified = true, failure = null } = {}) {
  const handlers = {};
  const user = { uid: 'existing-member', emailVerified: verified, providerData: [{ providerId: provider }] };
  const member = { uid: user.uid, role: 'owner', status: 'approved' };
  const state = { activations: 0, gate: null, message: '', logs: 0 };
  let releaseLog;
  const logWait = new Promise(resolve => { releaseLog = resolve; });
  const dialog = { open: true, close() { this.open = false; }, showModal() { this.open = true; } };
  const elements = new Map();
  const context = {
    console: { error() {} }, auth: { currentUser: user }, google: {}, mode: 'signin', dialog,
    document: { querySelector(selector) {
      if (!elements.has(selector)) elements.set(selector, { value: 'test', textContent: '', addEventListener(type, fn) { handlers[selector] = fn; } });
      return elements.get(selector);
    } },
    form: { addEventListener(type, fn) { handlers.email = fn; } },
    signInWithPopup: async () => ({ user }), signInWithEmailAndPassword: async () => ({ user }),
    ensureMember: async () => { if (failure) throw failure; return member; },
    logSignIn: async () => { state.logs++; await logWait; },
    activateMember: async m => { state.activations++; dialog.close(); state.gate = m.status; },
    showGate: status => { state.gate = status; },
    setMessage: text => { state.message = text; }, setMode() {}, authError: e => e.message,
    sendEmailVerification: async () => {},
    onAuthStateChanged(auth, fn) { handlers.session = fn; },
    endLocationWatch() {}, stopLocationFeed() {}, stopCirclePins() {}, stopCircleDrawings() {},
    hideGate() { state.gate = null; }
  };
  vm.createContext(context);
  for (const prefix of ["form.addEventListener('submit'", "document.querySelector('#google-auth').addEventListener", 'onAuthStateChanged(auth,']) {
    const line = source.split('\n').find(line => line.startsWith(prefix));
    assert.ok(line, prefix);
    vm.runInContext(line, context);
  }
  return { handlers, user, context, state, dialog, releaseLog };
}

for (const method of ['email', '#google-auth']) {
  test(`${method}: slow audit log cannot reopen access after entering groups`, async () => {
    const h = harness({ provider: method === 'email' ? 'password' : 'google.com' });
    const pending = h.handlers[method]({ preventDefault() {} });
    await h.handlers.session(h.user);
    assert.equal(h.state.activations, 1);
    assert.equal(h.dialog.open, false);
    h.state.gate = 'groups'; // user enters while the sign-in audit write is outstanding
    h.releaseLog();
    await pending;
    assert.equal(h.state.gate, 'groups');
    assert.equal(h.state.activations, 1);
  });
}
test('membership load failure is visible instead of silently returning to sign-in', async () => {
  const h = harness({ failure: new Error('Missing or insufficient permissions [permission-denied]') });
  h.dialog.close();
  await h.handlers.session(h.user);
  assert.equal(h.dialog.open, true);
  assert.match(h.state.message, /permission-denied/);
  assert.equal(h.state.activations, 0);
});
test('unverified password session closes sign-in and shows verification gate', async () => {
  const h = harness({ provider: 'password', verified: false });
  await h.handlers.session(h.user);
  assert.equal(h.dialog.open, false);
  assert.equal(h.state.gate, 'pending');
  assert.equal(h.state.activations, 0);
});
test('membership read finishing after sign-out cannot reopen access', async () => {
  const h = harness();
  h.context.auth.currentUser = null;
  await h.handlers.session(h.user);
  assert.equal(h.state.activations, 0);
});
