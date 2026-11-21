// ============================================
// Login page logic (uses js/auth.js) — email + password
// ============================================

const AT = {
  en: {
    welcome: 'Welcome to Doctor Na Gola',
    welcome_sub: 'Log in to place your order and track it anytime.',
    tab_login: 'Log in', tab_signup: 'Sign up',
    email: 'Email', email_ph: 'you@example.com',
    phone: 'Mobile number', phone_ph: '10-digit mobile number',
    password: 'Password', password_ph: 'Your password',
    password_new_ph: 'At least 6 characters',
    password2: 'Confirm password', password2_ph: 'Type the password again',
    name: 'Full name', name_ph: 'First & Last name',
    btn_login: 'Log in', forgot: 'Forgot password?',
    btn_signup: 'Create account',
    signup_hint: "Use a real email, you'll need it if you forget your password.",
    reset_title: 'Reset your password',
    reset_sub: "Enter your email. We'll send you a link to set a new password.",
    btn_send_link: 'Send reset link', back_login: 'Back to log in',
    wait: 'Please wait…',
    err_email: 'Please enter a valid email address.',
    err_phone: 'Please enter a valid 10-digit mobile number.',
    err_name: 'Please enter your full name (First & Last).',
    err_pass_short: 'Password must be at least 6 characters.',
    err_pass_match: 'The two passwords do not match.',
    err_pass_empty: 'Please enter your password.',
    ok_signup: 'Account created! Redirecting…',
    ok_login: 'Logged in! Redirecting…',
    ok_reset: 'If an account exists for that email, a reset link is on its way. Please check your inbox (and spam).'
  },
  gu: {
    welcome: 'ડૉક્ટરના ગોળામાં આપનું સ્વાગત છે',
    welcome_sub: 'ઓર્ડર કરવા અને ટ્રેક કરવા માટે લૉગિન કરો.',
    tab_login: 'લૉગિન', tab_signup: 'સાઇન અપ',
    email: 'ઇમેઇલ', email_ph: 'you@example.com',
    phone: 'મોબાઇલ નંબર', phone_ph: '10 અંકનો મોબાઇલ નંબર',
    password: 'પાસવર્ડ', password_ph: 'તમારો પાસવર્ડ',
    password_new_ph: 'ઓછામાં ઓછા 6 અક્ષર',
    password2: 'પાસવર્ડ ફરી લખો', password2_ph: 'પાસવર્ડ ફરીથી લખો',
    name: 'પૂરું નામ', name_ph: 'પહેલું અને છેલ્લું નામ',
    btn_login: 'લૉગિન', forgot: 'પાસવર્ડ ભૂલી ગયા?',
    btn_signup: 'ખાતું બનાવો',
    signup_hint: 'સાચો ઇમેઇલ વાપરો, પાસવર્ડ ભૂલી જાઓ તો જરૂર પડશે.',
    reset_title: 'પાસવર્ડ રીસેટ કરો',
    reset_sub: 'તમારો ઇમેઇલ નાખો. નવો પાસવર્ડ સેટ કરવા અમે લિંક મોકલીશું.',
    btn_send_link: 'રીસેટ લિંક મોકલો', back_login: 'લૉગિન પર પાછા જાઓ',
    wait: 'થોભો…',
    err_email: 'કૃપા કરી સાચું ઇમેઇલ સરનામું નાખો.',
    err_phone: 'કૃપા કરી 10 અંકનો સાચો મોબાઇલ નંબર નાખો.',
    err_name: 'કૃપા કરી પૂરું નામ લખો (પહેલું અને છેલ્લું).',
    err_pass_short: 'પાસવર્ડ ઓછામાં ઓછો 6 અક્ષરનો હોવો જોઈએ.',
    err_pass_match: 'બંને પાસવર્ડ સરખા નથી.',
    err_pass_empty: 'કૃપા કરી પાસવર્ડ નાખો.',
    ok_signup: 'ખાતું બની ગયું! આગળ લઈ જઈએ છીએ…',
    ok_login: 'લૉગિન થઈ ગયું! આગળ લઈ જઈએ છીએ…',
    ok_reset: 'જો આ ઇમેઇલનું ખાતું હશે, તો રીસેટ લિંક મોકલી છે. ઇનબોક્સ (અને સ્પામ) તપાસો.'
  }
};

function at(key) {
  const lang = (typeof currentLang !== 'undefined' && currentLang === 'gu') ? 'gu' : 'en';
  return AT[lang][key] || AT.en[key] || key;
}

function applyAuthText() {
  document.querySelectorAll('[data-at]').forEach(el => { el.textContent = at(el.getAttribute('data-at')); });
  document.querySelectorAll('[data-at-ph]').forEach(el => { el.placeholder = at(el.getAttribute('data-at-ph')); });
}

// Re-render text when the language button is used
function onLangChange() { applyAuthText(); }

let nextPage = 'index.html';

document.addEventListener('DOMContentLoaded', async () => {
  renderNavbar('login');
  renderFooter();
  applyAuthText();

  const params = new URLSearchParams(window.location.search);
  nextPage = safeNext(params.get('next'));

  // Already logged in? Skip this page.
  const user = await CustomerAuth.ready();
  if (user && CustomerAuth.getProfile()) window.location.replace(nextPage);

  if (params.get('tab') === 'signup') showPanel('signup');
});

// ── Panels / messages ──
function showPanel(name) {
  clearMessage();
  document.querySelectorAll('.auth-panel').forEach(p => p.classList.toggle('active', p.id === 'panel-' + name));
  document.querySelectorAll('.auth-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === name));
  document.getElementById('authTabs').style.display = name === 'reset' ? 'none' : 'flex';
  const first = document.querySelector('#panel-' + name + ' input');
  if (first) setTimeout(() => first.focus(), 50);
}

function showMessage(text, type) {
  const box = document.getElementById('authMessage');
  box.textContent = text;
  box.className = 'auth-message ' + (type || 'error');
  box.style.display = 'block';
}
function clearMessage() { document.getElementById('authMessage').style.display = 'none'; }

function setBusy(btnId, busy) {
  const btn = document.getElementById(btnId);
  if (!btn) return;
  if (busy) { btn.dataset.label = btn.textContent; btn.textContent = at('wait'); btn.disabled = true; }
  else { btn.textContent = btn.dataset.label || btn.textContent; btn.disabled = false; }
}

function togglePass(btn) {
  const input = btn.parentElement.querySelector('input');
  input.type = input.type === 'password' ? 'text' : 'password';
}

function val(id) { return document.getElementById(id).value.trim(); }

function finish(messageKey) {
  showMessage(at(messageKey), 'success');
  setTimeout(() => { window.location.href = nextPage; }, 700);
}

// ── Log in ──
async function doLogin(e) {
  e.preventDefault();
  clearMessage();
  const email = val('loginEmail').toLowerCase();
  const password = document.getElementById('loginPassword').value;
  if (!isValidEmail(email)) return showMessage(at('err_email'));
  if (!password) return showMessage(at('err_pass_empty'));

  setBusy('loginBtn', true);
  try {
    await CustomerAuth.login(email, password);
    await CustomerAuth.ready();
    finish('ok_login');
  } catch (err) {
    showMessage(authErrorMessage(err));
    setBusy('loginBtn', false);
  }
}

// ── Sign up ──
async function doSignup(e) {
  e.preventDefault();
  clearMessage();
  const name = val('signupName');
  const email = val('signupEmail').toLowerCase();
  const phone = val('signupPhone').replace(/\D/g, '');
  const password = document.getElementById('signupPassword').value;
  const password2 = document.getElementById('signupPassword2').value;

  if (!isFullName(name)) return showMessage(at('err_name'));
  if (!isValidEmail(email)) return showMessage(at('err_email'));
  if (!isValidPhone(phone)) return showMessage(at('err_phone'));
  if (password.length < 6) return showMessage(at('err_pass_short'));
  if (password !== password2) return showMessage(at('err_pass_match'));

  setBusy('signupBtn', true);
  try {
    await CustomerAuth.signup(name, email, phone, password);
    finish('ok_signup');
  } catch (err) {
    showMessage(authErrorMessage(err));
    setBusy('signupBtn', false);
  }
}

// ── Forgot password ──
async function doReset(e) {
  e.preventDefault();
  clearMessage();
  const email = val('resetEmail').toLowerCase();
  if (!isValidEmail(email)) return showMessage(at('err_email'));

  setBusy('resetBtn', true);
  try {
    await CustomerAuth.sendReset(email);
    showMessage(at('ok_reset'), 'success');
  } catch (err) {
    // Don't reveal whether an account exists; only surface real problems
    if (err && (err.code === 'auth/user-not-found')) showMessage(at('ok_reset'), 'success');
    else showMessage(authErrorMessage(err));
  }
  setBusy('resetBtn', false);
}
