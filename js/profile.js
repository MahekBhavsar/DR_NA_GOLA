// ============================================
// Profile page: edit name/phone (saved live to the database) and change password
// (current password must be confirmed first). Uses js/auth.js.
// ============================================

const PT = {
  en: {
    title: 'My Profile', subtitle: 'Update your details and keep your account secure.',
    details_title: 'Personal details', details_sub: 'These are used for your orders.',
    name: 'Full name', email: 'Email', email_note: "Your email is your login and can't be changed here.",
    phone: 'Mobile number', save: 'Save changes',
    pw_title: 'Change password', pw_sub: 'Confirm your current password first.',
    pw_current: 'Current password', pw_new: 'New password', pw_new_ph: 'At least 6 characters',
    pw_confirm: 'Confirm new password', pw_confirm_ph: 'Type the new password again',
    pw_save: 'Update password', wait: 'Please wait…',
    err_name: 'Please enter your full name (First & Last).',
    err_phone: 'Please enter a valid 10-digit mobile number.',
    err_nochange: 'Nothing has changed.',
    ok_details: 'Saved! Your details are updated.',
    err_current: 'Please enter your current password.',
    err_current_wrong: 'Your current password is not correct.',
    err_new_short: 'New password must be at least 6 characters.',
    err_new_same: 'New password must be different from the current one.',
    err_new_match: 'The two new passwords do not match.',
    ok_password: 'Password updated! Use it next time you log in.'
  },
  gu: {
    title: 'મારી પ્રોફાઇલ', subtitle: 'તમારી વિગતો અપડેટ કરો અને ખાતું સુરક્ષિત રાખો.',
    details_title: 'વ્યક્તિગત વિગતો', details_sub: 'આ વિગતો તમારા ઓર્ડર માટે વપરાય છે.',
    name: 'પૂરું નામ', email: 'ઇમેઇલ', email_note: 'ઇમેઇલ તમારું લૉગિન છે, અહીં બદલી શકાતું નથી.',
    phone: 'મોબાઇલ નંબર', save: 'ફેરફાર સાચવો',
    pw_title: 'પાસવર્ડ બદલો', pw_sub: 'પહેલા તમારો હાલનો પાસવર્ડ કન્ફર્મ કરો.',
    pw_current: 'હાલનો પાસવર્ડ', pw_new: 'નવો પાસવર્ડ', pw_new_ph: 'ઓછામાં ઓછા 6 અક્ષર',
    pw_confirm: 'નવો પાસવર્ડ ફરી લખો', pw_confirm_ph: 'નવો પાસવર્ડ ફરીથી લખો',
    pw_save: 'પાસવર્ડ અપડેટ કરો', wait: 'થોભો…',
    err_name: 'કૃપા કરી પૂરું નામ લખો (પહેલું અને છેલ્લું).',
    err_phone: 'કૃપા કરી 10 અંકનો સાચો મોબાઇલ નંબર નાખો.',
    err_nochange: 'કોઈ ફેરફાર થયો નથી.',
    ok_details: 'સાચવ્યું! તમારી વિગતો અપડેટ થઈ ગઈ.',
    err_current: 'કૃપા કરી હાલનો પાસવર્ડ નાખો.',
    err_current_wrong: 'તમારો હાલનો પાસવર્ડ સાચો નથી.',
    err_new_short: 'નવો પાસવર્ડ ઓછામાં ઓછો 6 અક્ષરનો હોવો જોઈએ.',
    err_new_same: 'નવો પાસવર્ડ હાલના પાસવર્ડથી અલગ હોવો જોઈએ.',
    err_new_match: 'બંને નવા પાસવર્ડ સરખા નથી.',
    ok_password: 'પાસવર્ડ અપડેટ થઈ ગયો! આગલી વખતે તેનો ઉપયોગ કરો.'
  }
};

function pt(key) {
  const lang = (typeof currentLang !== 'undefined' && currentLang === 'gu') ? 'gu' : 'en';
  return PT[lang][key] || PT.en[key] || key;
}

function applyProfileText() {
  document.querySelectorAll('[data-pt]').forEach(el => { el.textContent = pt(el.getAttribute('data-pt')); });
  document.querySelectorAll('[data-pt-ph]').forEach(el => { el.placeholder = pt(el.getAttribute('data-pt-ph')); });
}

function onLangChange() { applyProfileText(); }

let profileRef = null;

document.addEventListener('DOMContentLoaded', async () => {
  renderNavbar('profile');
  renderFooter();
  applyProfileText();

  const user = await CustomerAuth.ready();
  if (!user || !CustomerAuth.getProfile()) {
    goLogin('profile.html');
    return;
  }

  document.getElementById('profileGrid').style.display = 'grid';
  fillForm(CustomerAuth.getProfile());

  // Live: if the profile changes in the database (another tab/device), the form follows
  profileRef = db.ref('users/' + user.uid);
  profileRef.on('value', snap => {
    const live = snap.val();
    if (!live) return;
    const typing = document.activeElement && ['pfName', 'pfPhone'].includes(document.activeElement.id);
    if (!typing) fillForm(live);
    document.getElementById('profileAvatar').textContent = (live.name || '?').charAt(0).toUpperCase();
  });
});

// Logged out in another tab -> go to login
window.addEventListener('customer-auth-changed', () => {
  if (!CustomerAuth.getUser()) goLogin('profile.html');
});

function fillForm(p) {
  document.getElementById('pfName').value = p.name || '';
  document.getElementById('pfEmail').value = p.email || '';
  document.getElementById('pfPhone').value = p.phone || '';
  document.getElementById('profileAvatar').textContent = (p.name || '?').charAt(0).toUpperCase();
}

// ── helpers ──
function msg(id, text, type) {
  const box = document.getElementById(id);
  box.textContent = text;
  box.className = 'auth-message ' + (type || 'error');
  box.style.display = 'block';
}
function clearMsg(id) { document.getElementById(id).style.display = 'none'; }

function busy(btnId, on) {
  const btn = document.getElementById(btnId);
  if (on) { btn.dataset.label = btn.textContent; btn.textContent = pt('wait'); btn.disabled = true; }
  else { btn.textContent = btn.dataset.label || btn.textContent; btn.disabled = false; }
}

function togglePass(btn) {
  const input = btn.parentElement.querySelector('input');
  input.type = input.type === 'password' ? 'text' : 'password';
}

// ── Save personal details ──
async function saveDetails(e) {
  e.preventDefault();
  clearMsg('detailsMsg');
  const name = document.getElementById('pfName').value.trim();
  const phone = document.getElementById('pfPhone').value.replace(/\D/g, '');
  const current = CustomerAuth.getProfile() || {};

  if (!isFullName(name)) return msg('detailsMsg', pt('err_name'));
  if (!isValidPhone(phone)) return msg('detailsMsg', pt('err_phone'));
  if (name === current.name && phone === current.phone) return msg('detailsMsg', pt('err_nochange'), 'success');

  busy('detailsBtn', true);
  try {
    await CustomerAuth.updateProfile(name, phone);
    msg('detailsMsg', pt('ok_details'), 'success');
  } catch (err) {
    msg('detailsMsg', authErrorMessage(err));
  }
  busy('detailsBtn', false);
}

// ── Change password (current password confirmed first) ──
async function savePassword(e) {
  e.preventDefault();
  clearMsg('passwordMsg');
  const current = document.getElementById('pfCurrent').value;
  const next = document.getElementById('pfNew').value;
  const confirm = document.getElementById('pfConfirm').value;

  if (!current) return msg('passwordMsg', pt('err_current'));
  if (next.length < 6) return msg('passwordMsg', pt('err_new_short'));
  if (next === current) return msg('passwordMsg', pt('err_new_same'));
  if (next !== confirm) return msg('passwordMsg', pt('err_new_match'));

  busy('passwordBtn', true);
  try {
    await CustomerAuth.changePassword(current, next);
    document.getElementById('pfCurrent').value = '';
    document.getElementById('pfNew').value = '';
    document.getElementById('pfConfirm').value = '';
    msg('passwordMsg', pt('ok_password'), 'success');
  } catch (err) {
    const wrong = err && ['auth/invalid-credential', 'auth/wrong-password', 'auth/invalid-login-credentials'].includes(err.code);
    msg('passwordMsg', wrong ? pt('err_current_wrong') : authErrorMessage(err));
  }
  busy('passwordBtn', false);
}
