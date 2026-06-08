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
  let statusText = "Pending";
  let statusColor = "var(--warning)";
  let progress = 25;
  let statusIcon = "🕒";

  if (order.status === 'processing') {
    statusText = "Processing";
    statusColor = "var(--info)";
    progress = 50;
    statusIcon = "🔄";
  } else if (order.status === 'ready') {
    statusText = "Ready for Pickup";
    statusColor = "#2E7D32";
    progress = 75;
    statusIcon = "✅";
  } else if (order.status === 'completed') {
    statusText = "Completed";
    statusColor = "var(--success)";
    progress = 90;
    statusIcon = "🎉";
  } else if (order.status === 'paid') {
    statusText = "Payment Done";
    statusColor = "#7C3AED";
    progress = 100;
    statusIcon = "💜";
  }

  const itemsList = order.items.map(i => `
    <div style="display: flex; justify-content: space-between; font-size: 0.9rem; margin-bottom: 0.3rem;">
      <span>${i.qty}x ${tObj(i.name)} ${i.category ? `(${tObj(i.category.name)})` : ''}</span>
      <strong>${formatPrice(i.totalPrice * i.qty)}</strong>
    </div>
  `).join('');

  return `
    <div style="background: var(--white); border-radius: var(--radius-lg); padding: 1.5rem; box-shadow: var(--shadow-sm); margin-bottom: 1.5rem; border-top: 4px solid ${statusColor};">
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem;">
        <div>
          <h3 style="margin-bottom: 0.2rem;">Order #${String(order.orderId).replace(/^#+/, '')}</h3>
          ${order.customerName ? `<div style="font-weight: 600; font-size: 0.95rem; color: var(--primary-800); margin-bottom: 0.15rem;">👤 ${order.customerName}</div>` : ''}
          <div style="color: var(--text-light); font-size: 0.85rem;">${new Date(order.timestamp).toLocaleString()}</div>
        </div>
        <div style="text-align: right;">
          <div style="font-weight: 800; font-size: 1.2rem; color: var(--accent);">${formatPrice(order.total)}</div>
          <div style="font-size: 0.8rem; color: var(--text-light); margin-bottom: 0.3rem;">${order.paymentMethod ? order.paymentMethod.toUpperCase() : ''}</div>
          ${order.orderType ? `<div style="display:inline-block; font-size: 0.75rem; font-weight: 700; padding: 0.2rem 0.6rem; border-radius: 20px; background: ${order.orderType === 'parcel' ? '#FFF3E0' : '#E8F5E9'}; color: ${order.orderType === 'parcel' ? '#E65100' : '#2E7D32'}; border: 1px solid ${order.orderType === 'parcel' ? '#FFCC80' : '#A5D6A7'};">${order.orderType === 'parcel' ? '📦 Parcel' : '🏪 Pickup'}</div>` : ''}
        </div>
      </div>
      
      <div style="margin: 1.5rem 0;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem; font-weight: 700;">
          <span style="color: ${statusColor};">${statusIcon} ${statusText}</span>
        </div>
        <div style="width: 100%; height: 8px; background: #eee; border-radius: 4px; overflow: hidden;">
          <div style="width: ${progress}%; height: 100%; background: ${statusColor}; transition: width 1s ease;"></div>
        </div>
      </div>

      <div style="border-top: 1px dashed #ddd; padding-top: 1rem;">
        <div style="font-weight: 700; margin-bottom: 0.5rem;">Items:</div>
        ${itemsList}
      </div>
    </div>
  `;
}
