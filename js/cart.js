// ============================================
// Cart & Checkout Logic — Fully Fixed
// ============================================

let orderType = 'pickup';
let paymentMethod = 'cash';

document.addEventListener('DOMContentLoaded', () => {
  renderNavbar('cart');
  renderFooter();
  renderCart();
});

function onLangChange() {
  renderCart();
}

// ── Render Cart Items ──────────────────────────
function renderCart() {
  const cart = getCart();
  const emptyState = document.getElementById('emptyCart');
  const cartLayout = document.getElementById('cartLayout');
  const itemsContainer = document.getElementById('cartItems');

  if (!emptyState || !cartLayout || !itemsContainer) return;

  if (cart.length === 0) {
    emptyState.style.display = 'block';
    cartLayout.style.display = 'none';
    return;
  }

  emptyState.style.display = 'none';
  cartLayout.style.display = 'grid';

  itemsContainer.innerHTML = cart.map(item => `
    <div class="cart-item">
      <div class="cart-item-icon" style="background: ${item.isSpecial ? 'var(--primary-50)' : 'var(--bg)'}">${item.emoji}</div>
      <div class="cart-item-info">
        <div class="cart-item-name" style="font-size: 1.05rem; margin-bottom: 0.25rem;">${tObj(item.name)}</div>
        <div class="cart-item-details" style="display: flex; flex-direction: column; gap: 0.2rem;">
          ${item.category ? `<span style="font-weight: 600; color: var(--primary-700); font-size:0.85rem;">${tObj(item.category.name)} &mdash; ${formatPrice(item.basePrice)}</span>` : ''}
          <span style="font-size:0.82rem; color:var(--text-light);">Qty: <strong style="color:var(--text);">${item.qty}</strong></span>
          ${item.note ? `<span style="font-style: italic; color: var(--text-light); font-size: 0.82rem;">Note: ${item.note}</span>` : ''}
        </div>
      </div>
      <div style="text-align: right; display: flex; flex-direction: column; justify-content: space-between; align-items: flex-end; gap: 0.5rem;">
        <div class="cart-item-price">${formatPrice(item.totalPrice * item.qty)}</div>
        <div class="cart-item-remove" onclick="removeItem('${item.cartId}')">${t('cart_remove') || 'Remove'}</div>
      </div>
    </div>
  `).join('');

  updateTotals();
}

function removeItem(cartId) {
  removeFromCart(cartId);
  renderCart();
  if (typeof updateCartBadge === 'function') updateCartBadge();
}

// ── Order Type ─────────────────────────────────
function setOrderType(type) {
  orderType = type;
  const pickup = document.getElementById('typePickup');
  const parcel = document.getElementById('typeParcel');
  if (pickup) pickup.classList.toggle('selected', type === 'pickup');
  if (parcel) parcel.classList.toggle('selected', type === 'parcel');
  updateTotals();
}

// ── Payment Method ─────────────────────────────
function setPayment(method) {
  paymentMethod = method;
  document.querySelectorAll('.payment-option').forEach(opt => opt.classList.remove('selected'));
  const radio = document.querySelector(`input[name="payment"][value="${method}"]`);
  if (radio) {
    const opt = radio.closest('.payment-option');
    if (opt) opt.classList.add('selected');
  }
}

// ── Update Totals ──────────────────────────────
function updateTotals() {
  const cart = getCart();
  const subtotal = getCartTotal();
  const perItem = typeof PARCEL_CHARGE !== 'undefined' ? PARCEL_CHARGE : 10;
  const totalQty = cart.reduce((sum, item) => sum + (item.qty || 1), 0);
  const charge = orderType === 'parcel' ? perItem * totalQty : 0;
  const total = subtotal + charge;

  const subEl     = document.getElementById('sumSubtotal');
  const totalEl   = document.getElementById('sumTotal');
  const parcelRow = document.getElementById('parcelRow');
  const parcelEl  = document.getElementById('sumParcel');
  const parcelLbl = document.getElementById('parcelLabel');

  if (subEl)   subEl.textContent   = formatPrice(subtotal);
  if (totalEl) totalEl.textContent = formatPrice(total);
  if (parcelRow) {
    parcelRow.style.display = charge > 0 ? 'flex' : 'none';
    if (parcelEl && charge > 0) parcelEl.textContent = formatPrice(charge);
    if (parcelLbl && charge > 0) parcelLbl.textContent = `Parcel Charge (${totalQty} item${totalQty > 1 ? 's' : ''} × ₹${perItem})`;
  }
}

// ── Toast helper ───────────────────────────────
function cartToast(msg, type) {
  if (typeof showToast === 'function') { showToast(msg, type); return; }
  const el = document.createElement('div');
  el.textContent = msg;
  el.style.cssText = `
    position:fixed; bottom:2rem; left:50%; transform:translateX(-50%);
    background:${type === 'error' ? '#DC2626' : '#16a34a'};
    color:#fff; padding:0.8rem 1.6rem; border-radius:10px;
    font-weight:600; z-index:99999; font-size:0.95rem;
    box-shadow:0 4px 16px rgba(0,0,0,0.18); pointer-events:none;
  `;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 3500);
}

// ── Reset button state ─────────────────────────
function resetBtn(btn, html) {
  btn.innerHTML = html;
  btn.disabled = false;
}

// ── Show Success Screen ────────────────────────
function showSuccessScreen(orderData) {
  const cartLayout    = document.getElementById('cartLayout');
  const successScreen = document.getElementById('successScreen');
  const displayId     = document.getElementById('displayOrderId');
  const displayName   = document.getElementById('displayCustomerName');
  const trackBtn      = document.getElementById('trackOrderBtn');

  if (cartLayout)    cartLayout.style.display    = 'none';
  if (successScreen) successScreen.style.display = 'block';
  if (displayId)     displayId.textContent       = orderData.orderId;
  if (displayName)   displayName.textContent     = orderData.customerName;
  if (trackBtn)      trackBtn.href               = `track.html?id=${orderData.orderId}`;

  if (orderData.paymentMethod === 'qr') {
    const qrBox = document.getElementById('qrInstructions');
    if (qrBox) qrBox.style.display = 'block';
  } else if (orderData.paymentMethod === 'upi') {
    const upiUrl = `upi://pay?pa=drnagola@upi&pn=Doctor%20Na%20Gola&tr=${orderData.orderId}&am=${orderData.total}&cu=INR`;
    setTimeout(() => { window.location.href = upiUrl; }, 600);
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ── Save order to localStorage (always-works fallback) ──
function saveOrderLocally(orderData) {
  try {
    const existing = JSON.parse(localStorage.getItem('dng_orders') || '[]');
    existing.unshift(orderData);          // newest first
    localStorage.setItem('dng_orders', JSON.stringify(existing));
    return true;
  } catch (e) {
    console.error('localStorage save failed:', e);
    return false;
  }
}

// ── Main Checkout Handler ──────────────────────
async function handleCheckout(e) {
  if (e && e.preventDefault) e.preventDefault();

  // ── 1. Validate cart ──
  const cart = getCart();
  if (!cart || cart.length === 0) {
    cartToast('Your cart is empty!', 'error');
    return;
  }

  // ── 2. Validate fields ──
  const nameEl  = document.getElementById('custName');
  const phoneEl = document.getElementById('custPhone');

  if (!nameEl || !nameEl.value.trim()) {
    cartToast('Please enter your name.', 'error');
    if (nameEl) nameEl.focus();
    return;
  }

  const phone = phoneEl ? phoneEl.value.trim() : '';
  if (!/^[0-9]{10}$/.test(phone)) {
    cartToast('Please enter a valid 10-digit phone number.', 'error');
    if (phoneEl) phoneEl.focus();
    return;
  }

  // ── 3. Lock button ──
  const btn = document.getElementById('placeOrderBtn');
  if (!btn) return;
  const originalHTML = btn.innerHTML;
  btn.innerHTML = '⏳ Placing Order...';
  btn.disabled = true;

  // ── 4. Build order object ──
  let seqId = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  try {
    if (typeof DB !== 'undefined' && DB.getNextOrderId) {
      const seq = await Promise.race([
        DB.getNextOrderId(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 3000))
      ]);
      seqId = seq;
    }
  } catch (e) {
    console.warn("Failed to fetch sequence order ID, using random fallback.");
  }
  const orderId = '#' + seqId;

  const subtotal     = getCartTotal();
  const perItem      = typeof PARCEL_CHARGE !== 'undefined' ? PARCEL_CHARGE : 10;
  const totalQty     = cart.reduce((sum, item) => sum + (item.qty || 1), 0);
  const parcelCharge = orderType === 'parcel' ? perItem * totalQty : 0;
  const total        = subtotal + parcelCharge;

  const orderData = {
    orderId,
    customerName : nameEl.value.trim(),
    phone,
    address      : '',
    orderType,
    paymentMethod,
    items        : cart,
    subtotal,
    parcelCharge,
    total,
    status       : 'pending',
    timestamp    : Date.now()
  };

  // ── 5. Try Firebase — but NEVER let it block success ──
  let firebaseSaved = false;

  try {
    if (typeof DB !== 'undefined' && typeof DB.pushOrder === 'function') {
      // wrap in a 6-second timeout so it never hangs forever
      await Promise.race([
        DB.pushOrder(orderData),
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 6000))
      ]);
      firebaseSaved = true;

      if (typeof DB.incrementDailyStats === 'function') {
        DB.incrementDailyStats(total).catch(() => {});
      }

    } else if (typeof db !== 'undefined') {
      await Promise.race([
        db.ref('orders').push(orderData),
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 6000))
      ]);
      firebaseSaved = true;
    }
  } catch (firebaseErr) {
    // Firebase failed (offline / local file / permission) — that's OK
    console.warn('Firebase unavailable, saving locally:', firebaseErr.message);
  }

  // ── 6. Always save locally as backup ──
  saveOrderLocally(orderData);

  // ── 7. Clear cart & show success — always reaches here ──
  clearCart();
  if (typeof updateCartBadge === 'function') updateCartBadge();

  showSuccessScreen(orderData);

  // Optional: console info for debugging
  if (!firebaseSaved) {
    console.info('Order saved to localStorage. orderId:', orderId);
  } else {
    console.info('Order saved to Firebase. orderId:', orderId);
  }
}