// ============================================
// Order Tracking Logic
// ============================================

document.addEventListener('DOMContentLoaded', () => {
  renderNavbar('track');
  renderFooter();

  // If URL has orderId, search automatically
  const urlParams = new URLSearchParams(window.location.search);
  const oid = urlParams.get('id');
  if (oid) {
    document.getElementById('trackInput').value = oid;
    searchOrder();
  }
});

function onLangChange() {
  // refresh if needed
}

function searchOrder() {
  const query = document.getElementById('trackInput').value.trim();
  if (!query) return;

  const resultDiv = document.getElementById('trackResult');
  const loader = document.getElementById('trackLoader');

  resultDiv.style.display = 'none';
  loader.style.display = 'block';

  // Read orders from Firebase
  const ref = firebase.database().ref('orders');
  ref.once('value')
    .then(snapshot => {
      loader.style.display = 'none';
      const orders = [];
      snapshot.forEach(child => {
        orders.push(child.val());
      });

      // Normalise query: strip leading # so "1" and "#1" both match order "#1"
      const normalQuery = query.replace(/^#+/, '').toLowerCase();

      // Filter by phone or orderId (with or without # prefix)
      const matched = orders.filter(o => {
        const normId = String(o.orderId).replace(/^#+/, '').toLowerCase();
        return normId === normalQuery || o.phone === query;
      });

      if (matched.length === 0) {
        resultDiv.innerHTML = `
          <div style="text-align: center; padding: 2rem; background: var(--white); border-radius: var(--radius-md); border: 2px dashed #ccc;">
            <div style="font-size: 3rem; margin-bottom: 1rem;">🔍</div>
            <h3 style="margin-bottom: 0.5rem;">No Orders Found</h3>
            <p style="color: var(--text-light);">We couldn't find any orders matching "${query}".</p>
          </div>
        `;
      } else {
        // Sort newest first
        matched.sort((a, b) => b.timestamp - a.timestamp);

        resultDiv.innerHTML = matched.map(o => renderOrderCard(o)).join('');
      }

      resultDiv.style.display = 'block';
    })
    .catch(err => {
      console.error(err);
      loader.style.display = 'none';
      resultDiv.innerHTML = `<p style="color: red;">Error fetching orders. Please try again.</p>`;
      resultDiv.style.display = 'block';
    });
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
