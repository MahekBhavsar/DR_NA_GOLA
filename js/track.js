// ============================================
// Order Tracking Logic — customers only see THEIR OWN orders
// ============================================

let myOrders = [];

document.addEventListener('DOMContentLoaded', async () => {
  renderNavbar('track');
  renderFooter();

  const resultDiv = document.getElementById('trackResult');
  const loader = document.getElementById('trackLoader');
  loader.style.display = 'block';

  const user = await CustomerAuth.ready();
  const profile = CustomerAuth.getProfile();
  loader.style.display = 'none';

  if (!user || !profile) {
    showLoginRequired();
    return;
  }

  loader.style.display = 'block';
  try {
    await loadMyOrders(user);
  } catch (err) {
    console.error(err);
    loader.style.display = 'none';
    resultDiv.innerHTML = `<p style="color: red; text-align:center;">Error fetching orders. Please try again.</p>`;
    resultDiv.style.display = 'block';
    return;
  }
  loader.style.display = 'none';

  // Deep link from the order-success page: track.html?id=#12
  const oid = new URLSearchParams(window.location.search).get('id');
  if (oid) document.getElementById('trackInput').value = oid;
  searchOrder();
});

// Logging out on this page -> back to the login prompt
window.addEventListener('customer-auth-changed', () => {
  if (!CustomerAuth.getUser()) showLoginRequired();
});

function onLangChange() {
  // refresh if needed
}

function showLoginRequired() {
  const gu = typeof currentLang !== 'undefined' && currentLang === 'gu';
  const search = document.querySelector('.trk-search');
  if (search) search.style.display = 'none';
  const resultDiv = document.getElementById('trackResult');
  resultDiv.innerHTML = `
    <div class="trk-login-card">
      <div class="trk-login-icon">&#128274;</div>
      <h3>${gu ? 'તમારા ઓર્ડર જોવા લૉગિન કરો' : 'Log in to see your orders'}</h3>
      <p>${gu ? 'સુરક્ષા માટે, તમે ફક્ત તમારા પોતાના ઓર્ડર જ ટ્રેક કરી શકો છો.' : 'For your privacy, you can only track your own orders.'}</p>
      <a href="login.html?next=track.html" class="btn btn-primary">${gu ? 'લૉગિન / સાઇન અપ' : 'Log in / Sign up'}</a>
    </div>`;
  resultDiv.style.display = 'block';
}

// Only downloads orders that belong to this customer's account
async function loadMyOrders(user) {
  const snap = await db.ref('orders').orderByChild('uid').equalTo(user.uid).once('value');
  const orders = [];
  snap.forEach(child => { orders.push(child.val()); });
  myOrders = orders.sort((a, b) => b.timestamp - a.timestamp);
}

function searchOrder() {
  const resultDiv = document.getElementById('trackResult');
  const query = document.getElementById('trackInput').value.trim();

  let matched = myOrders;
  if (query) {
    // "1" and "#1" both match order "#1"
    const normalQuery = query.replace(/^#+/, '').toLowerCase();
    matched = myOrders.filter(o => String(o.orderId).replace(/^#+/, '').toLowerCase() === normalQuery);
  }

  if (matched.length === 0) {
    resultDiv.innerHTML = query
      ? `<div class="trk-empty"><div class="trk-empty-icon">&#128269;</div>
           <h3>No Orders Found</h3>
           <p>None of your orders match "${query.replace(/[<>&"]/g, '')}".</p></div>`
      : `<div class="trk-empty"><div class="trk-empty-icon">&#127847;</div>
           <h3>No orders yet</h3>
           <p>When you place an order it will show up here.</p>
           <a href="menu.html" class="btn btn-primary">Browse Menu</a></div>`;
  } else {
    resultDiv.innerHTML = matched.map(o => renderOrderCard(o)).join('');
  }
  resultDiv.style.display = 'block';
}

function renderOrderCard(order) {
  const steps = ['Pending', 'Processing', 'Ready', 'Completed'];
  let stepIndex = 0;
  let statusText = 'Pending';
  let tone = 'pending';

  if (order.status === 'processing') { stepIndex = 1; statusText = 'Processing'; tone = 'processing'; }
  else if (order.status === 'ready') { stepIndex = 2; statusText = 'Ready for Pickup'; tone = 'ready'; }
  else if (order.status === 'completed') { stepIndex = 3; statusText = 'Completed'; tone = 'completed'; }
  else if (order.status === 'paid') { stepIndex = 3; statusText = 'Payment Done'; tone = 'paid'; }

  const stepper = steps.map((label, idx) => `
    <div class="trk-step ${idx < stepIndex ? 'done' : ''} ${idx === stepIndex ? 'current' : ''}">
      <span class="trk-dot">${idx < stepIndex ? '&#10003;' : idx + 1}</span>
      <span class="trk-step-label">${label}</span>
    </div>`).join('');

  const itemsList = order.items.map(i => `
    <div class="trk-item">
      <span class="trk-item-name"><b>${i.qty}&times;</b> ${tObj(i.name)} ${i.category ? `<em>${tObj(i.category.name)}</em>` : ''}</span>
      <strong>${formatPrice(i.totalPrice * i.qty)}</strong>
    </div>
  `).join('');

  const typeTag = order.orderType
    ? `<span class="trk-tag ${order.orderType === 'parcel' ? 'parcel' : 'pickup'}">${order.orderType === 'parcel' ? '&#128230; Parcel' : '&#127978; Pickup'}</span>`
    : '';

  return `
    <div class="trk-card trk-${tone}">
      <div class="trk-top">
        <div>
          <h3 class="trk-id">Order #${String(order.orderId).replace(/^#+/, '')}</h3>
          ${order.customerName ? `<div class="trk-name">${order.customerName}</div>` : ''}
          <div class="trk-date">${new Date(order.timestamp).toLocaleString()}</div>
        </div>
        <div class="trk-right">
          <div class="trk-total">${formatPrice(order.total)}</div>
          <div class="trk-meta">
            ${order.paymentMethod ? `<span class="trk-pay">${order.paymentMethod.toUpperCase()}</span>` : ''}
            ${typeTag}
          </div>
        </div>
      </div>

      <div class="trk-status">
        <span class="trk-status-pill">${statusText}</span>
      </div>
      <div class="trk-stepper">${stepper}</div>

      <div class="trk-items">
        <div class="trk-items-title">Items</div>
        ${itemsList}
      </div>
    </div>
  `;
}
