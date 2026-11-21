// ============================================
// Customer Auth — email + password (100% free on Firebase)
//
//  * Sign up  : name, email, phone, password  -> Firebase Auth user
//               profile saved in Realtime Database at users/{uid}
//  * Log in   : email + password
//  * Forgot   : Firebase sends a secure reset-password email (link)
//
// Console setup (free, one time):
//   Firebase > Authentication > Get started > Sign-in method > enable "Email/Password"
// ============================================

const fbAuth = firebase.auth();
const USER_CACHE_KEY = 'dr-gola-user';
const LOGIN_AT_KEY = 'dr-gola-login-at';
const ACTIVE_PING_KEY = 'dr-gola-active-ping';
const SESSION_MS = 30 * 24 * 60 * 60 * 1000;   // stay logged in for 30 days, then ask again
const AUTH_NEXT_PAGES = ['index.html', 'menu.html', 'cart.html', 'track.html', 'contact.html', 'profile.html'];

let currentProfile = null;
let _signingUp = false;
let _authReadyResolve;
const _authReady = new Promise(resolve => { _authReadyResolve = resolve; });

function isValidEmail(email) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email); }
function isValidPhone(phone) { return /^[6-9][0-9]{9}$/.test(phone); }
function isFullName(name) { return name.trim().split(/\s+/).length >= 2; }

// Only allow redirecting to our own pages (prevents open-redirect abuse)
function safeNext(next) {
  const page = String(next || '').split('?')[0].replace(/^\//, '');
  return AUTH_NEXT_PAGES.includes(page) ? String(next).replace(/^\//, '') : 'index.html';
}

function goLogin(nextPage) {
  window.location.href = 'login.html?next=' + encodeURIComponent(nextPage || 'index.html');
}

async function loadProfile(uid) {
  try {
    const snap = await db.ref('users/' + uid).once('value');
    return snap.val();
  } catch (e) {
    return null;
  }
}

// ── 30-day session: log in once, stay logged in until it expires ──
function markLogin() { localStorage.setItem(LOGIN_AT_KEY, String(Date.now())); }
function clearLoginMark() { localStorage.removeItem(LOGIN_AT_KEY); }
function sessionExpired() {
  const at = Number(localStorage.getItem(LOGIN_AT_KEY));
  return !at || Date.now() - at > SESSION_MS;
}

function cacheProfile(uid, profile) {
  if (profile) {
    localStorage.setItem(USER_CACHE_KEY, JSON.stringify({ uid, name: profile.name, email: profile.email, phone: profile.phone }));
  } else {
    localStorage.removeItem(USER_CACHE_KEY);
  }
}

fbAuth.onAuthStateChanged(async user => {
  if (_signingUp) { _authReadyResolve(); return; }   // signup() sets the profile itself
  if (user && sessionExpired()) {                     // 1-day session is over -> log out
    await fbAuth.signOut();
    return;                                           // listener runs again with user = null
  }
  if (!user) {
    currentProfile = null;
    cacheProfile(null, null);
  } else {
    currentProfile = await loadProfile(user.uid);
    cacheProfile(user.uid, currentProfile);
  }
  _authReadyResolve();
  window.dispatchEvent(new Event('customer-auth-changed'));

  // "Last active": touch the profile at most once an hour while a saved session is in use
  if (user && currentProfile) {
    const last = Number(localStorage.getItem(ACTIVE_PING_KEY)) || 0;
    if (Date.now() - last > 60 * 60 * 1000) {
      localStorage.setItem(ACTIVE_PING_KEY, String(Date.now()));
      db.ref('users/' + user.uid).update({ lastActiveAt: Date.now() }).catch(() => {});
    }
  }
});

const AUTH_ERRORS = {
  en: {
    'auth/requires-recent-login': 'For security, please log out, log in again, then retry.',
    'auth/invalid-credential': 'Wrong email or password.',
    'auth/invalid-login-credentials': 'Wrong email or password.',
    'auth/wrong-password': 'Wrong email or password.',
    'auth/user-not-found': 'Wrong email or password.',
    'auth/invalid-email': 'Please enter a valid email address.',
    'auth/email-already-in-use': 'This email is already registered. Please log in.',
    'auth/weak-password': 'Password must be at least 6 characters.',
    'auth/too-many-requests': 'Too many attempts. Please try again later.',
    'auth/network-request-failed': 'Network error. Please check your internet.',
    'auth/operation-not-allowed': 'Login is not switched on yet. (Owner: enable Email/Password in Firebase > Authentication.)',
    'auth/configuration-not-found': 'Login is not set up yet. (Owner: open Firebase > Authentication and click Get started.)'
  },
  gu: {
    'auth/requires-recent-login': 'સુરક્ષા માટે, કૃપા કરી લૉગ આઉટ કરી ફરી લૉગિન કરો અને પછી પ્રયત્ન કરો.',
    'auth/invalid-credential': 'ઇમેઇલ અથવા પાસવર્ડ ખોટો છે.',
    'auth/invalid-login-credentials': 'ઇમેઇલ અથવા પાસવર્ડ ખોટો છે.',
    'auth/wrong-password': 'ઇમેઇલ અથવા પાસવર્ડ ખોટો છે.',
    'auth/user-not-found': 'ઇમેઇલ અથવા પાસવર્ડ ખોટો છે.',
    'auth/invalid-email': 'કૃપા કરી સાચું ઇમેઇલ સરનામું નાખો.',
    'auth/email-already-in-use': 'આ ઇમેઇલ પહેલેથી નોંધાયેલ છે. કૃપા કરી લૉગિન કરો.',
    'auth/weak-password': 'પાસવર્ડ ઓછામાં ઓછો 6 અક્ષરનો હોવો જોઈએ.',
    'auth/too-many-requests': 'ઘણા પ્રયાસો થયા. કૃપા કરી પછી પ્રયત્ન કરો.',
    'auth/network-request-failed': 'નેટવર્ક સમસ્યા. ઇન્ટરનેટ તપાસો.',
    'auth/operation-not-allowed': 'લૉગિન હજી ચાલુ નથી.',
    'auth/configuration-not-found': 'લૉગિન હજી સેટ થયું નથી.'
  }
};

function authErrorMessage(err) {
  const lang = (typeof currentLang !== 'undefined' && currentLang === 'gu') ? 'gu' : 'en';
  const code = err && err.code;
  return (AUTH_ERRORS[lang][code]) || (lang === 'gu' ? 'કંઈક ખોટું થયું. ફરી પ્રયત્ન કરો.' : 'Something went wrong. Please try again.');
}

const CustomerAuth = {
  // Resolves after Firebase has restored any saved session
  async ready() {
    await _authReady;
    // Re-check on every use (e.g. at checkout) in case the tab stayed open past 30 days
    if (fbAuth.currentUser && sessionExpired()) await fbAuth.signOut();
    return fbAuth.currentUser;
  },
  getUser() { return fbAuth.currentUser; },
  getProfile() { return currentProfile; },

  async login(email, password) {
    markLogin();   // set before sign-in so the state listener sees a fresh session
    try {
      const cred = await fbAuth.signInWithEmailAndPassword(email, password);
      const now = Date.now();
      localStorage.setItem(ACTIVE_PING_KEY, String(now));
      db.ref('users/' + cred.user.uid).update({ lastLoginAt: now, lastActiveAt: now }).catch(() => {});
    } catch (err) {
      clearLoginMark();
      throw err;
    }
  },

  async signup(name, email, phone, password) {
    _signingUp = true;
    markLogin();
    try {
      const cred = await fbAuth.createUserWithEmailAndPassword(email, password);
      const now = Date.now();
      const profile = { name: name.trim(), email, phone, createdAt: now, lastLoginAt: now, lastActiveAt: now };
      localStorage.setItem(ACTIVE_PING_KEY, String(now));
      await db.ref('users/' + cred.user.uid).set(profile);
      currentProfile = profile;
      cacheProfile(cred.user.uid, profile);
    } catch (err) {
      clearLoginMark();
      throw err;
    } finally {
      _signingUp = false;
    }
    window.dispatchEvent(new Event('customer-auth-changed'));
  },

  // Firebase emails a secure link to set a new password
  async sendReset(email) {
    await fbAuth.sendPasswordResetEmail(email);
  },

  // Save name / phone to the database (users/{uid}) and refresh everything that shows them
  async updateProfile(name, phone) {
    const user = fbAuth.currentUser;
    if (!user) throw { code: 'auth/requires-recent-login' };
    const changes = { name: name.trim(), phone, updatedAt: Date.now() };
    await db.ref('users/' + user.uid).update(changes);
    currentProfile = Object.assign({}, currentProfile, changes);
    cacheProfile(user.uid, currentProfile);
    window.dispatchEvent(new Event('customer-auth-changed'));
  },

  // Change password: the CURRENT password must be confirmed first
  async changePassword(currentPassword, newPassword) {
    const user = fbAuth.currentUser;
    if (!user || !user.email) throw { code: 'auth/requires-recent-login' };
    const credential = firebase.auth.EmailAuthProvider.credential(user.email, currentPassword);
    await user.reauthenticateWithCredential(credential);   // fails if the current password is wrong
    await user.updatePassword(newPassword);
  },

  async logout() {
    clearLoginMark();
    await fbAuth.signOut();
  }
};
