// ============================================
// Admin Panel Logic — Fixed Login + Enhanced
// ============================================

let allOrders           = [];
let allReviews          = [];
let allNotifications    = [];
let revChartInstance    = null;
let flavChartInstance   = null;
let typeChartInstance   = null;
let initialLoadComplete = false;
let currentOrderFilter  = 'all';
let currentProductFilter = 'all';
let addFormOpen  = false;
let productManagerFilter = 'all';
let customCategoryMap = {};
let selectedEmoji = '🍧';

document.addEventListener('DOMContentLoaded', () => {
  checkLogin();
});

// ═══════════════════════════════════════════
// AUTH
// ═══════════════════════════════════════════

function showPanel() {
  document.getElementById('loginScreen').classList.add('hidden');
  document.getElementById('adminPanel').classList.add('visible');
}

function hidePanel() {
  document.getElementById('loginScreen').classList.remove('hidden');
  document.getElementById('adminPanel').classList.remove('visible');
}

function handleLogin(e) {
  e.preventDefault();

  const pwdEl = document.getElementById('adminPassword');
  const errEl = document.getElementById('loginError');
  const pwd   = pwdEl ? pwdEl.value : '';

  if (errEl) errEl.style.display = 'none';

  if (pwd === 'doctor2024') {
    sessionStorage.setItem('adminAuth', 'true');

    const saveBox = document.getElementById('savePassword');
    if (saveBox && saveBox.checked) {
      localStorage.setItem('adminSavedPwd', pwd);
    } else {
      localStorage.removeItem('adminSavedPwd');
    }

    showPanel();
    initAdmin();
  } else {
    if (errEl) errEl.style.display = 'block';
    if (pwdEl) { pwdEl.value = ''; pwdEl.focus(); }
  }
}

function checkLogin() {
  // Pre-fill saved password
  const saved = localStorage.getItem('adminSavedPwd');
  if (saved) {
    const pwdEl  = document.getElementById('adminPassword');
    const saveBox = document.getElementById('savePassword');
    if (pwdEl)   pwdEl.value     = saved;
    if (saveBox) saveBox.checked = true;
  }

  // Auto-login if session still active
  if (sessionStorage.getItem('adminAuth') === 'true') {
    showPanel();
    initAdmin();
  }
}

function toggleSavePassword() {
  const saveBox = document.getElementById('savePassword');
  if (saveBox && !saveBox.checked) {
    localStorage.removeItem('adminSavedPwd');
  }
}

function logout() {
  sessionStorage.removeItem('adminAuth');
  hidePanel();
  // Reset password field
  const pwdEl = document.getElementById('adminPassword');
  if (pwdEl) pwdEl.value = '';
}

// ═══════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════

function initAdmin() {
  if (typeof loadCustomProducts === 'function') loadCustomProducts();

  // Guard: DB must exist
  if (typeof DB === 'undefined') {
    console.warn('DB not defined — Firebase may not be loaded yet.');
    admToast('⚠️ Firebase not connected. Check console.', '#DC2626');
    return;
  }

  DB.listenOrders(function(orders) {
    const newCount = orders.length - allOrders.length;
    if (initialLoadComplete && newCount > 0) {
      const badge = document.getElementById('newOrderBadge');
      if (badge) badge.style.display = 'inline-block';
      playNotification();
      admToast('🛍️ ' + newCount + ' new order(s) received!');
    }
    allOrders = orders;
    renderOrders();
    updateDashboardStats();
    updateCharts();
    initialLoadComplete = true;
  });

  DB.listenReviews(function(reviews) {
    allReviews = reviews;
    const revEl = document.getElementById('statTotalReviews');
    if (revEl) revEl.textContent = reviews.length;
    renderReviews();
  });

  if (typeof DB.listenProducts === 'function') {
    DB.listenProducts(function(products) {
      window.allProducts = products;
      renderAdminProducts();
      renderAllProductTables();
    });
  } else {
    renderAllProductTables();
  }

  if (typeof DB.listenContacts === 'function') {
    DB.listenContacts(function(contacts) {
      renderContacts(contacts);
    });
  }

  if (typeof DB.listenAllNotifications === 'function') {
    DB.listenAllNotifications(function(notifications) {
      allNotifications = notifications || [];
      renderAdminNotifications();
    });
  }
}

// ═══════════════════════════════════════════
// TAB SWITCHING
// ═══════════════════════════════════════════

function switchTab(tabId) {
  document.querySelectorAll('.admin-sidebar-link').forEach(function(el) {
    el.classList.toggle('active', el.dataset.tab === tabId);
  });
  document.querySelectorAll('.admin-tab').forEach(function(el) {
    el.classList.toggle('active', el.id === 'tab-' + tabId);
  });
  const badge = document.getElementById('newOrderBadge');
  if (tabId === 'orders' && badge) badge.style.display = 'none';
}

// ═══════════════════════════════════════════
// NOTIFICATION
// ═══════════════════════════════════════════

function playNotification() {
  const audio = document.getElementById('notificationSound');
  if (audio) audio.play().catch(function() {});
}

// ═══════════════════════════════════════════
// TOAST
// ═══════════════════════════════════════════

function admToast(msg, color) {
  color = color || 'var(--adm-green)';
  const toast = document.createElement('div');
  toast.className = 'adm-toast';
  toast.style.borderLeftColor = color;
  toast.textContent = msg;
  document.body.appendChild(toast);
  setTimeout(function() { toast.remove(); }, 3500);
}

// ═══════════════════════════════════════════
// ORDERS
// ═══════════════════════════════════════════

function filterOrders(status, el) {
  currentOrderFilter = status;
  document.querySelectorAll('.filter-chip[data-status]').forEach(function(c) {
    c.classList.remove('active');
  });
  if (el) el.classList.add('active');
  renderOrders();
}

function renderOrders() {
  const container = document.getElementById('ordersCardsGrid');
  if (!container) return;

  let orders = allOrders.slice();
  if (currentOrderFilter !== 'all') {
    orders = orders.filter(o => o.status === currentOrderFilter);
  }

  if (orders.length === 0) {
    container.innerHTML = '<div style="text-align:center;padding:3rem;color:#888;font-size:1.1rem;">📭 No orders found</div>';
    return;
  }

  const payIcons = { cash: '💵', qr: '🤳', upi: '📲' };
  const statusColors = {
    pending: { bg: '#FFF9C4', border: '#F9A825', text: '#7A4B00', label: 'Pending' },
    processing: { bg: '#FFF3E0', border: '#FB8C00', text: '#7C2D12', label: 'Processing' },
    completed: { bg: '#E8F5E9', border: '#22C55E', text: '#166534', label: 'Done' },
    paid: { bg: '#F3E8FF', border: '#A855F7', text: '#581C87', label: 'Paid' },
  };

  const renderTable = (tableOrders, title, emptyMsg) => {
    if (tableOrders.length === 0) {
      return `<h3 style="margin: 1.5rem 0 0.5rem 0; font-size: 1.1rem; color: var(--primary-900);">${title}</h3>
              <div class="orders-table-wrapper" style="text-align:center;padding:2rem;color:#888;margin-bottom:2rem;">${emptyMsg}</div>`;
    }

    const tbody = tableOrders.map(order => {
      const time = new Date(order.timestamp).toLocaleString('en-IN', {
        day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
      });
      const pm = order.paymentMethod || 'cash';
      const sc = statusColors[order.status] || statusColors.pending;
      const typeIcon = order.orderType === 'parcel' ? 'Parcel (+Rs.10)' : 'Pickup';

      const itemsHTML = (order.items || []).map(i => {
        const name = i.name && i.name.en ? i.name.en : (i.name || 'Item');
        return `<tr style="border-bottom: 1px dashed #eee;">
          <td style="padding:0.3rem 0.6rem;font-size:0.88rem;border:none;">${i.emoji || '🍧'} ${name}</td>
          <td style="padding:0.3rem 0.6rem;font-size:0.88rem;text-align:center;font-weight:700;border:none;">×${i.qty}</td>
          <td style="padding:0.3rem 0.6rem;font-size:0.88rem;text-align:right;color:var(--adm-accent);font-weight:700;border:none;">₹${i.totalPrice}</td>
        </tr>`;
      }).join('');

      return `
      <tr style="background:${sc.bg};">
        <td style="border-left:5px solid ${sc.border};">
          <div style="font-family:monospace;font-weight:700;color:${sc.text};font-size:0.95rem;">${order.orderId}</div>
          <div style="font-size:0.78rem;color:#888;margin-top:2px;">${time}</div>
        </td>
        <td>
          <div style="font-weight:700;font-size:1.05rem;color:#1a1a1a;">${order.customerName}</div>
          <div style="font-size:0.85rem;color:#555;">📞 ${order.phone}</div>
        </td>
        <td>
          <div style="font-size:0.9rem;font-weight:600;">${typeIcon}</div>
          <div style="font-size:0.8rem;color:#888;">${payIcons[pm] || '💳'} ${pm.toUpperCase()}</div>
        </td>
        <td>
          <div style="font-size:1.4rem;font-weight:900;color:#1a1a1a;">₹${order.total}</div>
          <div>
            <table style="margin-top:0.5rem;background:rgba(255,255,255,0.7);border-radius:8px;width:100%;min-width:180px;border-collapse:collapse;">
              <tbody>${itemsHTML}</tbody>
            </table>
          </div>
        </td>
        <td>
          <div class="admin-status-actions" role="group" aria-label="Order status" style="display:flex; flex-wrap:wrap; gap:0.25rem;">
            <button class="status-action-btn ${order.status === 'pending' ? 'is-active' : ''}" 
              style="${order.status === 'pending' ? 'background:#F59E0B; color:white; border-color:#F59E0B;' : ''}"
              onclick="updateOrderStatus('${order.id}', 'pending', this)">Pending</button>
            <button class="status-action-btn ${order.status === 'processing' ? 'is-active' : ''}" 
              style="${order.status === 'processing' ? 'background:#3B82F6; color:white; border-color:#3B82F6;' : ''}"
              onclick="updateOrderStatus('${order.id}', 'processing', this)">Processing</button>
            <button class="status-action-btn ${order.status === 'completed' ? 'is-active' : ''}" 
              style="${order.status === 'completed' ? 'background:#10B981; color:white; border-color:#10B981;' : ''}"
              onclick="updateOrderStatus('${order.id}', 'completed', this)">Done</button>
            <button class="status-action-btn ${order.status === 'paid' ? 'is-active' : ''}" 
              style="${order.status === 'paid' ? 'background:#A855F7; color:white; border-color:#A855F7;' : ''}"
              onclick="updateOrderStatus('${order.id}', 'paid', this)">Payment Done</button>
          </div>
        </td>
        <td>
          <div style="display:flex;gap:0.5rem;flex-direction:column;">
            <button style="background:#25D366;color:white;border:none;border-radius:8px;padding:0.4rem 0.8rem;cursor:pointer;font-weight:600;font-size:0.85rem;" onclick="notifyAdmin('${order.id}')">Admin WA</button>
            <button style="background:#fee2e2;color:#dc2626;border:none;border-radius:8px;padding:0.4rem 0.8rem;cursor:pointer;font-weight:600;font-size:0.85rem;" onclick="deleteOrder('${order.id}')">🗑 Delete</button>
          </div>
        </td>
      </tr>
      `;
    }).join('');

    return `
      <h3 style="margin: 1.5rem 0 0.5rem 0; font-size: 1.1rem; color: var(--primary-900);">${title}</h3>
      <div class="orders-table-wrapper" style="margin-bottom:2rem;">
        <table class="orders-table">
          <thead>
            <tr>
              <th style="width:15%;">Order ID</th>
              <th style="width:20%;">Customer</th>
              <th style="width:15%;">Type</th>
              <th style="width:25%;">Items & Total</th>
              <th style="width:15%;">Status</th>
              <th style="width:10%;">Actions</th>
            </tr>
          </thead>
          <tbody>
            ${tbody}
          </tbody>
        </table>
      </div>
    `;
  };

  const pendingOrders = orders.filter(o => o.status === 'pending');
  const activeOrders = orders.filter(o => o.status === 'processing' || o.status === 'completed');
  const paidOrders = orders.filter(o => o.status === 'paid');

  container.innerHTML = 
    renderTable(pendingOrders, '🟡 Pending Orders', 'No pending orders.') +
    renderTable(activeOrders, '🔵 Processing & Done', 'No active orders.') +
    renderTable(paidOrders, '🟣 Payment Done', 'No paid orders.');
}

function updateOrderStatus(orderId, status, btn) {
  if (btn) {
    btn.dataset.originalText = btn.textContent;
    btn.textContent = '...';
  }
  if (typeof DB !== 'undefined' && typeof DB.updateOrderStatus === 'function') {
    DB.updateOrderStatus(orderId, status);
  }

  const order = allOrders.find(o => o.id === orderId);
  if (order) {
    let customerPhone = order.phone || '';
    if (customerPhone && !customerPhone.startsWith('91')) {
      customerPhone = '91' + customerPhone.replace(/\D/g, '');
    }

    if (status === 'completed') {
      notifyWebsiteOrderDone(orderId);
      // WhatsApp notification for "Done" (Pick up)
      if (customerPhone && customerPhone.length >= 10) {
        const msg = "Hi " + (order.customerName || "there") + ", your order (" + order.orderId + ") is ready! Please pick up your gola.";
        window.open('https://wa.me/' + customerPhone + '?text=' + encodeURIComponent(msg), '_blank');
      }
    } else if (status === 'paid') {
      // WhatsApp notification for "Payment Done" (Thank you & Feedback)
      if (customerPhone && customerPhone.length >= 10) {
        const feedbackUrl = window.location.origin + "/index.html#feedback";
        const msg = "Thank you for visiting Doctor Na Gola, " + (order.customerName || "there") + "! We hope you enjoyed your gola. Please leave your feedback here: " + feedbackUrl;
        window.open('https://wa.me/' + customerPhone + '?text=' + encodeURIComponent(msg), '_blank');
      }
    }
  }

  const statusName = status === 'completed' ? 'Done' : (status === 'paid' ? 'Payment Done' : status);
  admToast('Status updated: ' + statusName);
}

function deleteOrder(orderId) {
  if (confirm('Delete this order?')) {
    if (typeof DB !== 'undefined' && typeof DB.deleteOrder === 'function') {
      DB.deleteOrder(orderId);
    }
  }
}

function notifyAdmin(orderId, automatic) {
  const order = allOrders.find(o => o.id === orderId);
  if (!order) return;

  const phone = '919081947464';
  const items = (order.items || []).map(function(item) {
    const name = item.name && item.name.en ? item.name.en : (item.name || 'Item');
    return name + ' x' + item.qty;
  }).join(', ');
  const statusText = order.status === 'completed' || automatic ? 'DONE' : String(order.status || 'pending').toUpperCase();
  const msg = 'Doctor Na Gola order ' + order.orderId + ' marked ' + statusText +
    '. Customer: ' + (order.customerName || '-') +
    ', Phone: ' + (order.phone || '-') +
    ', Total: Rs.' + (order.total || 0) +
    (items ? ', Items: ' + items : '');

  window.open('https://wa.me/' + phone + '?text=' + encodeURIComponent(msg), '_blank');
}

// ═══════════════════════════════════════════
// DASHBOARD STATS
// ═══════════════════════════════════════════

function notifyWebsiteOrderDone(orderId) {
  const order = allOrders.find(o => o.id === orderId);
  if (!order) return;

  if (typeof DB === 'undefined' || typeof DB.pushNotification !== 'function') {
    admToast('Website notification could not be sent.', '#DC2626');
    return;
  }

  const name = order.customerName || 'there';
  DB.pushNotification({
    type: 'order-completed',
    title: 'Thank you for visiting Doctor Na Gola!',
    message: 'Hi ' + name + ', your order ' + (order.orderId || '') + ' is completed. We hope you enjoyed your gola. Please share your review on our website.',
    orderId: order.orderId || '',
    phone: order.phone || '',
    timestamp: Date.now()
  }).then(function() {
    admToast('Website notification sent to customer.');
  }).catch(function() {
    admToast('Website notification could not be sent.', '#DC2626');
  });
}

function updateDashboardStats() {
  const today = new Date().toISOString().split('T')[0];
  let todayO = 0, todayR = 0, pending = 0;

  allOrders.forEach(function(o) {
    if (o.status === 'pending') pending++;
    if (new Date(o.timestamp).toISOString().split('T')[0] === today) {
      todayO++;
      todayR += (o.total || 0);
    }
  });

  const s = function(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  };
  s('statTodayOrders', todayO);
  s('statTodayRevenue', '₹' + todayR);
  s('statPendingOrders', pending);
}

// ═══════════════════════════════════════════
// CHARTS
// ═══════════════════════════════════════════

function updateCharts() {
  if (typeof Chart === 'undefined') return;

  // Revenue Chart (Last 7 Days)
  const revCanvas = document.getElementById('revenueChart');
  if (revCanvas) {
    const days = [];
    const revData = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      days.push(d.toLocaleDateString('en-US', { weekday: 'short' }));
      
      const dayRev = allOrders.filter(o => new Date(o.timestamp).toISOString().split('T')[0] === dateStr)
                              .reduce((sum, o) => sum + (o.total || 0), 0);
      revData.push(dayRev);
    }

    if (window.revChart) window.revChart.destroy();
    window.revChart = new Chart(revCanvas, {
      type: 'bar',
      data: {
        labels: days,
        datasets: [{
          label: 'Revenue (₹)',
          data: revData,
          backgroundColor: '#1565C0',
          borderRadius: 4
        }]
      },
      options: { responsive: true, maintainAspectRatio: false, animation: false }
    });
  }

  // Category Chart
  const catCanvas = document.getElementById('categoryChart');
  if (catCanvas) {
    const categories = { 'Specials': 0, 'Milk': 0, 'Ice': 0, 'Stick': 0 };
    allOrders.forEach(o => {
      if (o.items) o.items.forEach(item => {
        if (item.isSpecial) categories['Specials']++;
        else if (item.category && item.category.id) {
          const cId = item.category.id;
          if (cId === 'milk') categories['Milk']++;
          else if (cId === 'ice') categories['Ice']++;
          else if (cId === 'stick') categories['Stick']++;
        }
      });
    });

    if (window.catChart) window.catChart.destroy();
    window.catChart = new Chart(catCanvas, {
      type: 'doughnut',
      data: {
        labels: Object.keys(categories),
        datasets: [{
          data: Object.values(categories),
          backgroundColor: ['#1565C0', '#42A5F5', '#FFCA28', '#FF7043']
        }]
      },
      options: { responsive: true, maintainAspectRatio: false, animation: false }
    });
  }
}

// ═══════════════════════════════════════════
// PRODUCTS CMS
// ═══════════════════════════════════════════

function renderAdminProducts() {
  const container = document.getElementById('adminProductsList');
  if (!container || !window.allProducts) return;

  if (window.allProducts.length === 0) {
    container.innerHTML = '<div class="empty-state" style="grid-column:1/-1;"><div class="big">🍡</div>No products found</div>';
    return;
  }

  // Use getManagedProducts to filter and format
  let products = typeof getManagedProducts === 'function' ? getManagedProducts() : window.allProducts.map(p => ({
    ...p, managerKey: 'firebase:' + p.dbId, managerType: p.isCategory ? 'category' : (p.isSpecial ? 'special' : 'flavor')
  }));

  if (typeof productManagerFilter !== 'undefined' && productManagerFilter !== 'all') {
    products = products.filter(p => p.managerType === productManagerFilter);
  }

  const typeColors = { flavor: '#2563EB', special: '#1E40AF', category: '#60A5FA' };
  const typeLabels = { flavor: 'Flavor', special: 'Dr. Special', category: 'Size' };

  container.innerHTML = products.map(p => {
    return `<div class="product-card" style="position:relative;">
      <div style="position:absolute; top:8px; right:8px; display:flex; gap:4px;">
        <button class="tbl-btn" style="background:#f3f4f6; color:#1f2937;" onclick="openProductEditor('${p.managerKey}')" title="Edit">✏️</button>
        <button class="tbl-btn danger" onclick="deleteProduct('${p.dbId}')" title="Delete">🗑</button>
      </div>
      <div class="product-emoji">${p.emoji || '🍧'}</div>
      <div class="product-name">${typeof tObj === 'function' && p.name ? tObj(p.name) : (p.name?.en || p.name)}</div>
      <div class="product-type" style="color:${typeColors[p.managerType] || '#2563EB'}">${typeLabels[p.managerType] || 'Regular'}</div>
      ${p.price ? `<div class="product-price">₹${p.price}</div>` : ''}
    </div>`;
  }).join('');
}

function deleteProduct(id) {
  if (confirm('Delete this product?')) {
    DB.deleteProduct(id);
    admToast('Product deleted');
  }
}

// ═══════════════════════════════════════════
// NOTIFICATIONS CMS
// ═══════════════════════════════════════════

function handleSendNotification(e) {
  e.preventDefault();
  const title = document.getElementById('notifTitle').value;
  const msg = document.getElementById('notifMsg').value;
  
  if (title && msg) {
    DB.pushNotification({ type: 'global', title, message: msg, timestamp: Date.now() });
    admToast('Global notification broadcasted! 📢');
    e.target.reset();
  }
}

// ═══════════════════════════════════════════
// TOP GOLA
// ═══════════════════════════════════════════

function renderAdminNotifications() {
  const container = document.getElementById('adminNotificationsList');
  if (!container) return;

  if (!allNotifications.length) {
    container.innerHTML = '<div style="text-align:center;padding:1.25rem;color:var(--adm-muted);">No website notifications yet.</div>';
    return;
  }

  container.innerHTML = allNotifications.map(function(notif) {
    const isOrder = notif.type === 'order-completed';
    const time = notif.timestamp ? new Date(notif.timestamp).toLocaleString('en-IN', {
      day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
    }) : '';
    const tag = isOrder ? 'Customer Order' : 'Global';
    const tagColor = isOrder ? '#16A34A' : '#2563EB';

    return `
      <div style="border:1px solid var(--adm-border);border-radius:10px;padding:0.85rem 1rem;background:#fff;display:grid;gap:0.35rem;">
        <div style="display:flex;justify-content:space-between;gap:0.75rem;align-items:flex-start;">
          <strong style="color:var(--text);font-size:0.95rem;">${safeText(notif.title || 'Website Notification')}</strong>
          <span style="background:${tagColor}14;color:${tagColor};border:1px solid ${tagColor}33;border-radius:999px;padding:0.15rem 0.5rem;font-size:0.72rem;font-weight:700;white-space:nowrap;">${tag}</span>
        </div>
        <div style="color:#4B5563;font-size:0.85rem;line-height:1.45;">${safeText(notif.message || '')}</div>
        <div style="color:var(--adm-muted);font-size:0.76rem;">${safeText(time)}</div>
      </div>
    `;
  }).join('');
}

function renderTopGola() {
  const container = document.getElementById('topGolaList');
  if (!container) return;

  const counts = {};
  allOrders.forEach(function(order) {
    (order.items || []).forEach(function(item) {
      const key = item.name.en || item.name;
      if (!counts[key]) counts[key] = { count: 0, emoji: item.emoji, name: item.name };
      counts[key].count += item.qty;
    });
  });

  const sorted = Object.values(counts)
    .sort(function(a, b) { return b.count - a.count; })
    .slice(0, 5);

  if (sorted.length === 0) {
    container.innerHTML = '<div class="empty-state"><div class="big">📊</div>No order data yet</div>';
    return;
  }

  const maxCount = sorted[0].count;
  const medals = ['🥇', '🥈', '🥉', '4', '5'];
  const rankClasses = ['rank-1', 'rank-2', 'rank-3', 'rank-4', 'rank-5'];

  container.innerHTML = sorted.map(function(item, i) {
    const barW = Math.round((item.count / maxCount) * 100);
    return '<div class="top-gola-item">' +
      '<div class="top-gola-rank ' + rankClasses[i] + '">' + medals[i] + '</div>' +
      '<div class="top-gola-emoji">' + item.emoji + '</div>' +
      '<div class="top-gola-info">' +
        '<div class="top-gola-name">' + (typeof tObj === 'function' ? tObj(item.name) : item.name) + '</div>' +
        '<div class="top-gola-bar-wrap"><div class="top-gola-bar" style="width:' + barW + '%"></div></div>' +
      '</div>' +
      '<div class="top-gola-count">' + item.count + '</div>' +
    '</div>';
  }).join('');
}

// ═══════════════════════════════════════════
// CHARTS
// ═══════════════════════════════════════════

function updateCharts() {
  if (!allOrders.length) return;

  const revData = {};
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    revData[d.toISOString().split('T')[0]] = 0;
  }
  const flavData = {};
  const typeData = { parcel: 0, pickup: 0 };

  allOrders.forEach(function(o) {
    const d = new Date(o.timestamp).toISOString().split('T')[0];
    if (revData[d] !== undefined) revData[d] += (o.total || 0);
    if (typeData[o.orderType] !== undefined) typeData[o.orderType]++;
    (o.items || []).forEach(function(item) {
      const n = item.name.en || item.name;
      flavData[n] = (flavData[n] || 0) + item.qty;
    });
  });

  const chartBase = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { labels: { color: '#8b91a8', font: { size: 11 } } } }
  };

  // Revenue bar chart
  const ctxRev = document.getElementById('revenueChart');
  if (ctxRev) {
    if (revChartInstance) revChartInstance.destroy();
    revChartInstance = new Chart(ctxRev, {
      type: 'bar',
      data: {
        labels: Object.keys(revData).map(function(d) { return d.substring(5); }),
        datasets: [{
          label: 'Revenue (₹)',
          data: Object.values(revData),
          backgroundColor: 'rgba(37,99,235,0.2)',
          borderColor: '#2563EB',
          borderWidth: 2,
          borderRadius: 6,
          borderSkipped: false
        }]
      },
      options: Object.assign({}, chartBase, {
        scales: {
          x: { ticks: { color: '#8b91a8' }, grid: { color: 'rgba(37,99,235,0.07)' } },
          y: { ticks: { color: '#8b91a8' }, grid: { color: 'rgba(37,99,235,0.07)' } }
        }
      })
    });
  }

  // Flavors doughnut chart
  const sortedFlavs = Object.entries(flavData)
    .sort(function(a, b) { return b[1] - a[1]; })
    .slice(0, 6);
  const ctxFlav = document.getElementById('flavorsChart');
  if (ctxFlav) {
    if (flavChartInstance) flavChartInstance.destroy();
    flavChartInstance = new Chart(ctxFlav, {
      type: 'doughnut',
      data: {
        labels: sortedFlavs.map(function(f) { return f[0]; }),
        datasets: [{
          data: sortedFlavs.map(function(f) { return f[1]; }),
          backgroundColor: ['#2563EB', '#60A5FA', '#1E40AF', '#93C5FD', '#1D4ED8', '#BFDBFE'],
          borderWidth: 0
        }]
      },
      options: Object.assign({}, chartBase, { cutout: '65%' })
    });
  }

  // Order type pie chart
  const ctxType = document.getElementById('orderTypeChart');
  if (ctxType) {
    if (typeChartInstance) typeChartInstance.destroy();
    typeChartInstance = new Chart(ctxType, {
      type: 'pie',
      data: {
        labels: ['Parcel 🛒', 'Pickup 🏪'],
        datasets: [{
          data: [typeData.parcel, typeData.pickup],
          backgroundColor: ['#2563EB', '#60A5FA'],
          borderWidth: 0
        }]
      },
      options: chartBase
    });
  }
}

// ═══════════════════════════════════════════
// PRODUCTS
// ═══════════════════════════════════════════

function filterProducts(type, el) {
  currentProductFilter = type;
  document.querySelectorAll('.filter-chip[data-ptype]').forEach(function(c) {
    c.classList.remove('active');
  });
  if (el) el.classList.add('active');
  renderProductsGrid();
}

function renderProductsGrid() {
  const grid = document.getElementById('productsGrid');
  if (!grid) return;

  let items = [];
  if (currentProductFilter === 'all' || currentProductFilter === 'flavor') {
    if (typeof FLAVORS !== 'undefined') {
      FLAVORS.forEach(function(f) { items.push(Object.assign({}, f, { _type: 'flavor' })); });
    }
  }
  if (currentProductFilter === 'all' || currentProductFilter === 'special') {
    if (typeof SPECIALS !== 'undefined') {
      SPECIALS.forEach(function(s) { items.push(Object.assign({}, s, { _type: 'special' })); });
    }
  }
  if (currentProductFilter === 'all' || currentProductFilter === 'category') {
    if (typeof CATEGORIES !== 'undefined') {
      CATEGORIES.forEach(function(c) { items.push(Object.assign({}, c, { _type: 'category' })); });
    }
  }

  if (items.length === 0) {
    grid.innerHTML = '<div class="empty-state" style="grid-column:1/-1;"><div class="big">🍡</div>No products</div>';
    return;
  }

  const typeColors  = { flavor: '#2563EB', special: '#1E40AF', category: '#60A5FA' };
  const typeLabels  = { flavor: 'Flavor',  special: 'Dr. Special', category: 'Size' };

  grid.innerHTML = items.map(function(item) {
    return '<div class="product-card">' +
      '<button class="del-badge" onclick="deleteProduct(\'' + item.id + '\',\'' + item._type + '\')" title="Delete">🗑</button>' +
      '<div class="product-emoji">' + item.emoji + '</div>' +
      '<div class="product-name">' + (typeof tObj === 'function' ? tObj(item.name) : (item.name.en || item.name)) + '</div>' +
      '<div class="product-type" style="color:' + typeColors[item._type] + '">' + typeLabels[item._type] + '</div>' +
      (item.price ? '<div class="product-price">₹' + item.price + '</div>' : '') +
      (item.desc  ? '<div style="font-size:0.75rem;color:var(--adm-muted);margin-top:0.4rem;">' + (typeof tObj === 'function' ? tObj(item.desc) : item.desc) + '</div>' : '') +
    '</div>';
  }).join('');
}

function toggleAddForm() {
  addFormOpen = !addFormOpen;
  const form = document.getElementById('addProductForm');
  if (form) {
    form.classList.toggle('open', addFormOpen);
    if (addFormOpen) form.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

function onProdTypeChange() {
  const type = document.getElementById('prodType').value;
  const colorRow = document.getElementById('prodColorRow');
  const descGroup = document.getElementById('prodDescGroup');
  if (colorRow) colorRow.style.display = (type === 'flavor') ? 'block' : 'none';
  if (descGroup) descGroup.style.display = (type === 'special' || type === 'category') ? 'block' : 'none';
}

function pickEmoji(emoji) {
  selectedEmoji = emoji;
  const emojiInput = document.getElementById('prodEmoji');
  if (emojiInput) emojiInput.value = emoji;
  document.querySelectorAll('.emoji-opt').forEach(function(el) {
    el.classList.toggle('selected', el.textContent.trim() === emoji);
  });
}

async function saveProduct() {
  const type   = document.getElementById('prodType').value;
  const emoji  = document.getElementById('prodEmoji').value || selectedEmoji || '🍧';
  const nameEn = document.getElementById('prodNameEn').value.trim();
  const nameGu = document.getElementById('prodNameGu').value.trim();
  const price  = parseInt(document.getElementById('prodPrice').value) || 0;
  const descEn = document.getElementById('prodDescEn').value.trim();
  const color  = document.getElementById('prodColor').value.trim() || '#2563EB';

  if (!nameEn) { admToast('⚠ Name (English) is required', '#DC2626'); return; }

  const id   = nameEn.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') + '-' + Date.now();
  const name = { en: nameEn, gu: nameGu || nameEn };
  const desc = { en: descEn, gu: descEn };

  let newItem;
  if (type === 'flavor') {
    newItem = { id, name, emoji, color, colorLight: color + '33' };
    if (typeof FLAVORS !== 'undefined') FLAVORS.push(newItem);
  } else if (type === 'special') {
    newItem = { id, name, emoji, price, desc };
    if (typeof SPECIALS !== 'undefined') SPECIALS.push(newItem);
  } else {
    newItem = { id, name, emoji, price, desc };
    if (typeof CATEGORIES !== 'undefined') CATEGORIES.push(newItem);
  }

  try {
    if (typeof db !== 'undefined') {
      await db.ref('customProducts/' + type + '/' + id).set(newItem);
    }
    admToast('✅ "' + nameEn + '" added successfully!');
  } catch (e) {
    admToast('✅ Added locally', '#60A5FA');
  }

  ['prodNameEn','prodNameGu','prodPrice','prodDescEn','prodEmoji'].forEach(function(id) {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  selectedEmoji = '🍧';
  document.querySelectorAll('.emoji-opt').forEach(function(el) { el.classList.remove('selected'); });

  toggleAddForm();
  renderProductsGrid();
}

async function deleteProduct(id, type) {
  if (!confirm('Delete this product?')) return;

  if (type === 'flavor' && typeof FLAVORS !== 'undefined') {
    const idx = FLAVORS.findIndex(function(f) { return f.id === id; });
    if (idx !== -1) FLAVORS.splice(idx, 1);
  } else if (type === 'special' && typeof SPECIALS !== 'undefined') {
    const idx = SPECIALS.findIndex(function(s) { return s.id === id; });
    if (idx !== -1) SPECIALS.splice(idx, 1);
  } else if (typeof CATEGORIES !== 'undefined') {
    const idx = CATEGORIES.findIndex(function(c) { return c.id === id; });
    if (idx !== -1) CATEGORIES.splice(idx, 1);
  }

  try {
    if (typeof db !== 'undefined') {
      await db.ref('customProducts/' + type + '/' + id).remove();
    }
  } catch (e) {}
  admToast('🗑 Product removed');
  renderProductsGrid();
}

// ═══════════════════════════════════════════
// REVIEWS
// ═══════════════════════════════════════════

function renderReviews() {
  const container = document.getElementById('reviewsListContainer');
  if (!container) return;

  if (!allReviews.length) {
    container.innerHTML = '<div class="empty-state"><div class="big">💬</div>No reviews yet</div>';
    return;
  }

  container.innerHTML = allReviews.map(function(r) {
    const name = r.nameEn || r.name || 'Anonymous';
    const initial = name.charAt(0).toUpperCase();
    const dateStr = new Date(r.timestamp).toLocaleDateString();
    const stars = '★'.repeat(r.rating) + '☆'.repeat(5 - r.rating);
    const comment = r.commentEn || r.comment || '';
    const badgeHtml = r.isDefault ? '<span class="review-badge">Default</span>' : '';

    return `
      <div class="review-card">
        <div>
          <div class="review-stars">${stars}</div>
          <div class="review-text">"${safeText(comment)}"</div>
        </div>
        <div class="review-footer">
          <div class="review-user-info">
            <div class="review-avatar">${safeText(initial)}</div>
            <div class="review-meta-text">
              <h4>${safeText(name)}</h4>
              <span>${dateStr}</span>
            </div>
          </div>
          <div style="display: flex; align-items: center; gap: 0.5rem;">
            ${badgeHtml}
            <button class="review-delete-btn" onclick="deleteReview('${r.id}')">🗑️</button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function deleteReview(id) {
  if (confirm('Delete this review?')) {
    if (typeof DB !== 'undefined' && typeof DB.deleteReview === 'function') {
      DB.deleteReview(id);
    }
  }
}

// ═══════════════════════════════════════════
// CONTACTS
// ═══════════════════════════════════════════

function renderContacts(contacts) {
  const tbody = document.getElementById('contactsTableBody');
  if (!tbody) return;

  if (!contacts || !contacts.length) {
    tbody.innerHTML = '<tr><td colspan="4"><div class="empty-state"><div class="big">📭</div>No messages</div></td></tr>';
    return;
  }

  tbody.innerHTML = contacts.map(function(c) {
    return '<tr>' +
      '<td style="white-space:nowrap;color:var(--adm-muted);font-size:0.8rem;">' +
        new Date(c.timestamp).toLocaleString('en-IN', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' }) +
      '</td>' +
      '<td style="font-weight:600;">' + c.name + '</td>' +
      '<td style="color:var(--adm-muted);">' + c.phone + '</td>' +
      '<td>' + c.message + '</td>' +
    '</tr>';
  }).join('');
}

// ═══════════════════════════════════════════
// LOAD CUSTOM PRODUCTS FROM FIREBASE
// ═══════════════════════════════════════════

function loadCustomProducts() {
  if (typeof db === 'undefined') { renderProductsGrid(); renderAdminProducts(); return; }

  db.ref('customProducts').once('value').then(function(snap) {
    const data = snap.val();
    if (!data) { renderProductsGrid(); renderAdminProducts(); return; }

    if (data.flavor && typeof FLAVORS !== 'undefined') {
      Object.values(data.flavor).forEach(function(p) {
        if (!FLAVORS.find(function(f) { return f.id === p.id; })) FLAVORS.push(p);
      });
    }
    if (data.special && typeof SPECIALS !== 'undefined') {
      Object.values(data.special).forEach(function(p) {
        if (!SPECIALS.find(function(s) { return s.id === p.id; })) SPECIALS.push(p);
      });
    }
    if (data.category && typeof CATEGORIES !== 'undefined') {
      Object.values(data.category).forEach(function(p) {
        customCategoryMap[p.id] = p;
        const idx = CATEGORIES.findIndex(function(c) { return c.id === p.id; });
        if (idx >= 0) CATEGORIES[idx] = Object.assign({}, CATEGORIES[idx], p);
        else CATEGORIES.push(p);
      });
    }
    renderProductsGrid();
    renderAdminProducts();
  }).catch(function() {
    renderProductsGrid();
    renderAdminProducts();
  });
}

// Modern Products CMS overrides
function renderAdminProducts() {
  const grid = document.getElementById('adminProductsList');
  if (!grid) return;

  const products = getManagedProducts();
  const filtered = productManagerFilter === 'all'
    ? products
    : products.filter(function(p) { return p.managerType === productManagerFilter; });

  renderProductStats(products);

  if (filtered.length === 0) {
    grid.innerHTML = '<div class="admin-empty-products">No products found</div>';
    return;
  }

  grid.innerHTML = filtered.map(function(p) {
    const price = Number.isFinite(Number(p.price)) ? 'Rs.' + Number(p.price) : 'Category price';
    const desc = p.desc ? safeText(tObj(p.desc)) : getProductSubtitle(p);
    return '<article class="admin-product-card ' + p.managerType + '">' +
      '<div class="admin-product-topline">' +
        '<span class="admin-product-icon">' + safeText(p.emoji || '🍧') + '</span>' +
        '<span class="admin-product-type">' + getProductTypeLabel(p.managerType) + '</span>' +
      '</div>' +
      '<h3>' + safeText(getProductName(p)) + '</h3>' +
      '<p>' + desc + '</p>' +
      '<div class="admin-product-meta"><span>' + price + '</span><span>' +
        (p.managerType === 'flavor' ? 'Flavour base' : 'Menu item') +
      '</span></div>' +
      '<div class="admin-product-actions">' +
        '<button class="admin-edit-btn" onclick="openProductEditor(\'' + p.managerKey + '\')">Edit</button>' +
        '<button class="admin-delete-btn" onclick="deleteManagedProduct(\'' + p.managerKey + '\')">Delete</button>' +
      '</div>' +
    '</article>';
  }).join('');
}

function getManagedProducts() {
  const firebaseProducts = (window.allProducts || []).map(function(p) {
    const managerType = p.isCategory ? 'category' : (p.isSpecial ? 'special' : 'flavor');
    return Object.assign({}, p, {
      managerType: managerType,
      managerSource: 'firebase',
      managerKey: 'firebase:' + p.dbId
    });
  });

  const hasFirebaseCategory = function(id) {
    return firebaseProducts.some(function(p) { return p.managerType === 'category' && p.id === id; });
  };
  const hasFirebaseProduct = function(id) {
    return firebaseProducts.some(function(p) { return p.id === id; });
  };

  const categoryProducts = (typeof CATEGORIES !== 'undefined' ? CATEGORIES : [])
    .filter(function(c) { return !hasFirebaseCategory(c.id); })
    .map(function(c) {
      return Object.assign({}, c, customCategoryMap[c.id] || {}, {
        managerType: 'category',
        managerSource: 'category',
        managerKey: 'category:' + c.id,
        isCategory: true
      });
    });

  const fallbackSpecials = (typeof SPECIALS !== 'undefined' ? SPECIALS : [])
    .filter(function(s) { return !hasFirebaseProduct(s.id); })
    .map(function(s) {
      return Object.assign({}, s, {
        managerType: 'special',
        managerSource: 'static-special',
        managerKey: 'static-special:' + s.id,
        isSpecial: true
      });
    });

  const fallbackFlavors = (typeof FLAVORS !== 'undefined' ? FLAVORS : [])
    .filter(function(f) { return !hasFirebaseProduct(f.id); })
    .map(function(f) {
      return Object.assign({}, f, {
        managerType: 'flavor',
        managerSource: 'static-flavor',
        managerKey: 'static-flavor:' + f.id,
        isSpecial: false
      });
    });

  return categoryProducts.concat(firebaseProducts, fallbackSpecials, fallbackFlavors)
    .sort(function(a, b) {
      const order = { category: 0, special: 1, flavor: 2 };
      return order[a.managerType] - order[b.managerType] || getProductName(a).localeCompare(getProductName(b));
    });
}

function renderProductStats(products) {
  const wrap = document.getElementById('adminProductStats');
  if (!wrap) return;
  const counts = products.reduce(function(acc, p) {
    acc[p.managerType] = (acc[p.managerType] || 0) + 1;
    return acc;
  }, {});
  wrap.innerHTML = [
    ['Categories', counts.category || 0],
    ['Specials', counts.special || 0],
    ['Flavours', counts.flavor || 0],
    ['Total Items', products.length]
  ].map(function(item) {
    return '<div class="admin-product-stat"><span>' + item[0] + '</span><strong>' + item[1] + '</strong></div>';
  }).join('');
}

function setProductManagerFilter(type, el) {
  productManagerFilter = type;
  document.querySelectorAll('.admin-filter-pill').forEach(function(btn) { btn.classList.remove('active'); });
  if (el) el.classList.add('active');
  renderAdminProducts();
}

function openProductEditor(managerKey) {
  const modal = document.getElementById('productEditorModal');
  if (!modal) return;

  const product = managerKey ? getManagedProducts().find(function(p) { return p.managerKey === managerKey; }) : null;
  document.getElementById('productEditorTitle').textContent = product ? 'Edit Product' : 'Add Product';
  document.getElementById('editProductKey').value = product ? product.managerKey : '';
  document.getElementById('editProductSource').value = product ? product.managerSource : '';
  document.getElementById('editProductType').value = product ? product.managerType : (productManagerFilter === 'all' ? 'category' : productManagerFilter);
  document.getElementById('editProductEmoji').value = product ? (product.emoji || '') : '🍧';
  document.getElementById('editProductName').value = product ? getProductName(product) : '';
  document.getElementById('editProductPrice').value = product && Number.isFinite(Number(product.price)) ? Number(product.price) : '';
  document.getElementById('editProductDesc').value = product && product.desc ? tObj(product.desc) : '';
  document.getElementById('editProductColor').value = product && product.color ? product.color : '#2563EB';
  onProductEditorTypeChange();
  modal.classList.add('open');
  modal.setAttribute('aria-hidden', 'false');
}

function closeProductEditor() {
  const modal = document.getElementById('productEditorModal');
  if (!modal) return;
  modal.classList.remove('open');
  modal.setAttribute('aria-hidden', 'true');
}

function onProductEditorTypeChange() {
  const type = document.getElementById('editProductType').value;
  const price = document.getElementById('editProductPrice');
  const descField = document.querySelector('.admin-desc-field');
  const colorField = document.querySelector('.admin-color-field');
  if (price) price.required = type !== 'flavor';
  if (descField) descField.style.display = type === 'flavor' ? 'none' : 'block';
  if (colorField) colorField.style.display = type === 'category' ? 'none' : 'block';
}

async function saveProductFromEditor(e) {
  e.preventDefault();
  const managerKey = document.getElementById('editProductKey').value;
  const type = document.getElementById('editProductType').value;
  const nameEn = document.getElementById('editProductName').value.trim();
  const emoji = document.getElementById('editProductEmoji').value.trim() || '🍧';
  const price = parseInt(document.getElementById('editProductPrice').value, 10);
  const descEn = document.getElementById('editProductDesc').value.trim();
  const color = document.getElementById('editProductColor').value || '#2563EB';

  if (!nameEn) { admToast('Name is required', '#DC2626'); return; }
  if (type !== 'flavor' && !Number.isFinite(price)) {
    admToast('Price is required for categories and specials', '#DC2626');
    return;
  }

  const existing = managerKey ? getManagedProducts().find(function(p) { return p.managerKey === managerKey; }) : null;
  const id = existing ? existing.id : makeProductId(nameEn);
  const payload = {
    id: id,
    emoji: emoji,
    name: { en: nameEn, gu: nameEn },
    price: Number.isFinite(price) ? price : null
  };

  if (type === 'category') {
    payload.isCategory = true;
    payload.isSpecial = false;
    payload.desc = { en: descEn || nameEn, gu: descEn || nameEn };
    await saveCategoryProduct(id, payload);
  } else {
    payload.isSpecial = type === 'special';
    payload.color = color;
    payload.colorLight = color + '33';
    if (type === 'special') payload.desc = { en: descEn || nameEn, gu: descEn || nameEn };
    await saveFirebaseProduct(existing, payload);
  }

  closeProductEditor();
  admToast('Product saved');
  renderAdminProducts();
}

async function saveCategoryProduct(id, payload) {
  customCategoryMap[id] = payload;
  const idx = CATEGORIES.findIndex(function(c) { return c.id === id; });
  if (idx >= 0) CATEGORIES[idx] = Object.assign({}, CATEGORIES[idx], payload);
  else CATEGORIES.push(payload);

  if (typeof db !== 'undefined') {
    await db.ref('customProducts/category/' + id).set(payload);
  }
}

async function saveFirebaseProduct(existing, payload) {
  if (existing && existing.managerSource === 'firebase' && existing.dbId && typeof DB.updateProduct === 'function') {
    await DB.updateProduct(existing.dbId, payload);
    return;
  }
  if (typeof DB !== 'undefined' && typeof DB.pushProduct === 'function') {
    await DB.pushProduct(payload);
  }
}

async function deleteManagedProduct(managerKey) {
  const product = getManagedProducts().find(function(p) { return p.managerKey === managerKey; });
  if (!product || !confirm('Delete this item?')) return;

  if (product.managerSource === 'firebase' && product.dbId && typeof DB.deleteProduct === 'function') {
    await DB.deleteProduct(product.dbId);
  } else if (product.managerType === 'category') {
    const idx = CATEGORIES.findIndex(function(c) { return c.id === product.id; });
    if (idx >= 0) CATEGORIES.splice(idx, 1);
    delete customCategoryMap[product.id];
    if (typeof db !== 'undefined') await db.ref('customProducts/category/' + product.id).remove();
  } else {
    admToast('Default items cannot be deleted until they are edited into Firebase.', '#DC2626');
    return;
  }

  admToast('Product deleted');
  renderAdminProducts();
}

function getProductName(product) {
  return product && product.name ? (product.name.en || product.name.gu || product.name) : 'Untitled';
}

function getProductSubtitle(product) {
  if (product.managerType === 'category') return 'Size category used during gola customization';
  if (product.managerType === 'special') return 'Premium Dr. Special item';
  return 'Regular flavour. Price is selected by category.';
}

function getProductTypeLabel(type) {
  return type === 'category' ? 'Category' : (type === 'special' ? 'Special' : 'Flavour');
}

function makeProductId(name) {
  return name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') + '-' + Date.now();
}

function safeText(value) {
  return String(value || '').replace(/[&<>"']/g, function(ch) {
    return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' })[ch];
  });
}

// ═══════════════════════════════════════════
// PRODUCT CMS — NEW TABLE-BASED SYSTEM
// ═══════════════════════════════════════════

function switchProductTab(tab) {
  ['flavours', 'specials', 'categories'].forEach(function(t) {
    const el = document.getElementById('ptab-' + t);
    const btn = document.getElementById('ptab-btn-' + t);
    if (el) el.style.display = (t === tab) ? 'block' : 'none';
    if (btn) btn.classList.toggle('active', t === tab);
  });
}

function renderAllProductTables() {
  renderFlavoursTable();
  renderSpecialsTable();
  renderCategoriesTable();
}

// ─── FLAVOURS TABLE ───────────────────────
function renderFlavoursTable() {
  const tbody = document.getElementById('flavoursTableBody');
  if (!tbody) return;

  // Merge static FLAVORS with any firebase-managed ones
  const flavours = typeof FLAVORS !== 'undefined' ? FLAVORS : [];

  if (flavours.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:2rem;color:#aaa;">No flavours found. Click + Add Flavour.</td></tr>';
    return;
  }

  // Category prices from CATEGORIES
  const cats = typeof CATEGORIES !== 'undefined' ? CATEGORIES : [];
  const stick   = cats.find(c => c.id === 'stick')   || { price: 60 };
  const superC  = cats.find(c => c.id === 'super')   || { price: 100 };
  const premium = cats.find(c => c.id === 'premium') || { price: 150 };
  const shahi   = cats.find(c => c.id === 'shahi')   || { price: 190 };

  tbody.innerHTML = flavours.map(function(f) {
    const name = f.name ? (f.name.en || f.name) : f.id;
    return `<tr>
      <td style="text-align:center; font-size:1.4rem;">${f.emoji || '🍧'}</td>
      <td style="font-weight:600;">${safeText(name)}</td>
      <td style="text-align:center; color:#2563EB; font-weight:700;">₹${stick.price}</td>
      <td style="text-align:center; color:#7C3AED; font-weight:700;">₹${superC.price}</td>
      <td style="text-align:center; color:#0891B2; font-weight:700;">₹${premium.price}</td>
      <td style="text-align:center; color:#B45309; font-weight:700;">₹${shahi.price}</td>
      <td style="text-align:center;">
        <button class="tbl-btn" style="background:#EFF6FF;color:#1E40AF;margin-right:4px;" onclick="openFlavourModal('${safeText(f.id)}')">✏️</button>
        <button class="tbl-btn danger" onclick="deleteFlavour('${safeText(f.id)}')">🗑</button>
      </td>
    </tr>`;
  }).join('');
}

function openFlavourModal(editId) {
  const modal = document.getElementById('flavourModal');
  if (!modal) return;
  document.getElementById('flavourEditId').value = editId || '';
  document.getElementById('flavourModalTitle').textContent = editId ? 'Edit Flavour' : 'Add Flavour';

  if (editId) {
    const flavours = typeof FLAVORS !== 'undefined' ? FLAVORS : [];
    const f = flavours.find(x => x.id === editId);
    if (f) {
      document.getElementById('flavourEmoji').value = f.emoji || '';
      document.getElementById('flavourName').value = f.name ? (f.name.en || f.name) : '';
    }
  } else {
    document.getElementById('flavourEmoji').value = '';
    document.getElementById('flavourName').value = '';
  }
  modal.classList.add('open');
  modal.setAttribute('aria-hidden', 'false');
}

function closeFlavourModal() {
  const modal = document.getElementById('flavourModal');
  if (modal) { modal.classList.remove('open'); modal.setAttribute('aria-hidden', 'true'); }
}

async function saveFlavour(e) {
  e.preventDefault();
  const editId  = document.getElementById('flavourEditId').value;
  const emoji   = document.getElementById('flavourEmoji').value.trim() || '🍧';
  const nameEn  = document.getElementById('flavourName').value.trim();
  if (!nameEn) { admToast('Name is required', '#DC2626'); return; }

  const id = editId || makeProductId(nameEn);
  const payload = { id, name: { en: nameEn, gu: nameEn }, emoji, color: '#2563EB', colorLight: '#DBEAFE' };

  if (typeof FLAVORS !== 'undefined') {
    const idx = FLAVORS.findIndex(f => f.id === id);
    if (idx >= 0) FLAVORS[idx] = Object.assign({}, FLAVORS[idx], payload);
    else FLAVORS.push(payload);
  }

  try {
    if (typeof DB !== 'undefined' && typeof DB.pushProduct === 'function') {
      if (editId && window.allProducts) {
        const existing = window.allProducts.find(p => p.id === editId);
        if (existing && existing.dbId) { await DB.updateProduct(existing.dbId, payload); }
        else await DB.pushProduct(payload);
      } else { await DB.pushProduct(payload); }
    }
  } catch(err) { console.warn(err); }

  admToast('✅ Flavour saved!');
  closeFlavourModal();
  renderFlavoursTable();
}

async function deleteFlavour(id) {
  if (!confirm('Delete this flavour?')) return;
  if (typeof FLAVORS !== 'undefined') {
    const idx = FLAVORS.findIndex(f => f.id === id);
    if (idx >= 0) FLAVORS.splice(idx, 1);
  }
  try {
    if (window.allProducts) {
      const p = window.allProducts.find(x => x.id === id);
      if (p && p.dbId && typeof DB.deleteProduct === 'function') await DB.deleteProduct(p.dbId);
    }
  } catch(err) {}
  admToast('🗑 Flavour deleted');
  renderFlavoursTable();
}

// ─── SPECIALS TABLE ───────────────────────
function renderSpecialsTable() {
  const tbody = document.getElementById('specialsTableBody');
  if (!tbody) return;

  const specials = typeof SPECIALS !== 'undefined' ? SPECIALS : [];

  if (specials.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:2rem;color:#aaa;">No specials found. Click + Add Special.</td></tr>';
    return;
  }

  tbody.innerHTML = specials.map(function(s) {
    const name = s.name ? (s.name.en || s.name) : s.id;
    const desc = s.desc ? (s.desc.en || s.desc) : '';
    const imgHtml = s.img
      ? `<img src="${s.img}" style="width:48px;height:48px;object-fit:cover;border-radius:8px;" onerror="this.style.display='none'">`
      : `<span style="font-size:1.8rem;">${s.emoji || '🍧'}</span>`;
    return `<tr>
      <td style="text-align:center;">${imgHtml}</td>
      <td style="font-weight:700;">${safeText(name)}</td>
      <td style="color:#666;font-size:0.88rem;">${safeText(desc)}</td>
      <td style="text-align:center; font-weight:800; color:#1E40AF; font-size:1.1rem;">₹${s.price}</td>
      <td style="text-align:center;">
        <button class="tbl-btn" style="background:#EFF6FF;color:#1E40AF;margin-right:4px;" onclick="openSpecialModal('${safeText(s.id)}')">✏️</button>
        <button class="tbl-btn danger" onclick="deleteSpecial('${safeText(s.id)}')">🗑</button>
      </td>
    </tr>`;
  }).join('');
}

function openSpecialModal(editId) {
  const modal = document.getElementById('specialModal');
  if (!modal) return;
  document.getElementById('specialEditId').value = editId || '';
  document.getElementById('specialModalTitle').textContent = editId ? 'Edit Dr. Special' : 'Add Dr. Special';

  if (editId) {
    const specials = typeof SPECIALS !== 'undefined' ? SPECIALS : [];
    const s = specials.find(x => x.id === editId);
    if (s) {
      document.getElementById('specialEmoji').value = s.emoji || '';
      document.getElementById('specialName').value  = s.name ? (s.name.en || s.name) : '';
      document.getElementById('specialPrice').value = s.price || '';
      document.getElementById('specialDesc').value  = s.desc ? (s.desc.en || s.desc) : '';
    }
  } else {
    ['specialEmoji','specialName','specialPrice','specialDesc'].forEach(function(id) {
      const el = document.getElementById(id); if (el) el.value = '';
    });
  }
  modal.classList.add('open');
  modal.setAttribute('aria-hidden', 'false');
}

function closeSpecialModal() {
  const modal = document.getElementById('specialModal');
  if (modal) { modal.classList.remove('open'); modal.setAttribute('aria-hidden', 'true'); }
}

async function saveSpecial(e) {
  e.preventDefault();
  const editId  = document.getElementById('specialEditId').value;
  const emoji   = document.getElementById('specialEmoji').value.trim() || '🍧';
  const nameEn  = document.getElementById('specialName').value.trim();
  const price   = parseInt(document.getElementById('specialPrice').value, 10);
  const descEn  = document.getElementById('specialDesc').value.trim();
  if (!nameEn || !price) { admToast('Name and Price are required', '#DC2626'); return; }

  const id = editId || makeProductId(nameEn);
  const payload = { id, name: { en: nameEn, gu: nameEn }, emoji, price, isSpecial: true,
    desc: { en: descEn, gu: descEn }, color: '#1E40AF' };

  if (typeof SPECIALS !== 'undefined') {
    const idx = SPECIALS.findIndex(s => s.id === id);
    if (idx >= 0) SPECIALS[idx] = Object.assign({}, SPECIALS[idx], payload);
    else SPECIALS.push(payload);
  }

  try {
    if (typeof DB !== 'undefined' && typeof DB.pushProduct === 'function') {
      if (editId && window.allProducts) {
        const existing = window.allProducts.find(p => p.id === editId);
        if (existing && existing.dbId) await DB.updateProduct(existing.dbId, payload);
        else await DB.pushProduct(payload);
      } else await DB.pushProduct(payload);
    }
  } catch(err) { console.warn(err); }

  admToast('✅ Special saved!');
  closeSpecialModal();
  renderSpecialsTable();
}

async function deleteSpecial(id) {
  if (!confirm('Delete this special?')) return;
  if (typeof SPECIALS !== 'undefined') {
    const idx = SPECIALS.findIndex(s => s.id === id);
    if (idx >= 0) SPECIALS.splice(idx, 1);
  }
  try {
    if (window.allProducts) {
      const p = window.allProducts.find(x => x.id === id);
      if (p && p.dbId && typeof DB.deleteProduct === 'function') await DB.deleteProduct(p.dbId);
    }
  } catch(err) {}
  admToast('🗑 Special deleted');
  renderSpecialsTable();
}

// ─── CATEGORIES TABLE ─────────────────────
function renderCategoriesTable() {
  const tbody = document.getElementById('categoriesTableBody');
  if (!tbody) return;

  const cats = typeof CATEGORIES !== 'undefined' ? CATEGORIES : [];

  if (cats.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:2rem;color:#aaa;">No categories found.</td></tr>';
    return;
  }

  tbody.innerHTML = cats.map(function(c) {
    const name = c.name ? (c.name.en || c.name) : c.id;
    const desc = c.desc ? (c.desc.en || c.desc) : '';
    return `<tr>
      <td style="text-align:center; font-size:1.4rem;">${c.emoji || '📐'}</td>
      <td style="font-weight:700;">${safeText(name)}</td>
      <td style="color:#666;font-size:0.88rem;">${safeText(desc)}</td>
      <td style="text-align:center; font-weight:800; color:#1E40AF; font-size:1.1rem;">₹${c.price}</td>
      <td style="text-align:center;">
        <button class="tbl-btn" style="background:#EFF6FF;color:#1E40AF;margin-right:4px;" onclick="openCategoryModal('${safeText(c.id)}')">✏️</button>
        <button class="tbl-btn danger" onclick="deleteCategory('${safeText(c.id)}')">🗑</button>
      </td>
    </tr>`;
  }).join('');
}

function openCategoryModal(editId) {
  const modal = document.getElementById('categoryModal');
  if (!modal) return;
  document.getElementById('categoryEditId').value = editId || '';
  document.getElementById('categoryModalTitle').textContent = editId ? 'Edit Category' : 'Add Category';

  if (editId) {
    const cats = typeof CATEGORIES !== 'undefined' ? CATEGORIES : [];
    const c = cats.find(x => x.id === editId);
    if (c) {
      document.getElementById('categoryEmoji').value = c.emoji || '';
      document.getElementById('categoryName').value  = c.name ? (c.name.en || c.name) : '';
      document.getElementById('categoryPrice').value = c.price || '';
      document.getElementById('categoryDesc').value  = c.desc ? (c.desc.en || c.desc) : '';
    }
  } else {
    ['categoryEmoji','categoryName','categoryPrice','categoryDesc'].forEach(function(id) {
      const el = document.getElementById(id); if (el) el.value = '';
    });
  }
  modal.classList.add('open');
  modal.setAttribute('aria-hidden', 'false');
}

function closeCategoryModal() {
  const modal = document.getElementById('categoryModal');
  if (modal) { modal.classList.remove('open'); modal.setAttribute('aria-hidden', 'true'); }
}

async function saveCategory(e) {
  e.preventDefault();
  const editId  = document.getElementById('categoryEditId').value;
  const emoji   = document.getElementById('categoryEmoji').value.trim() || '📐';
  const nameEn  = document.getElementById('categoryName').value.trim();
  const price   = parseInt(document.getElementById('categoryPrice').value, 10);
  const descEn  = document.getElementById('categoryDesc').value.trim();
  if (!nameEn || !price) { admToast('Name and Price are required', '#DC2626'); return; }

  const id = editId || makeProductId(nameEn);
  const payload = { id, name: { en: nameEn, gu: nameEn }, emoji, price, isCategory: true,
    desc: { en: descEn, gu: descEn } };

  if (typeof CATEGORIES !== 'undefined') {
    const idx = CATEGORIES.findIndex(c => c.id === id);
    if (idx >= 0) CATEGORIES[idx] = Object.assign({}, CATEGORIES[idx], payload);
    else CATEGORIES.push(payload);
  }

  try {
    if (typeof db !== 'undefined') {
      await db.ref('customProducts/category/' + id).set(payload);
    }
  } catch(err) { console.warn(err); }

  admToast('✅ Category saved!');
  closeCategoryModal();
  renderCategoriesTable();
  renderFlavoursTable(); // refresh prices
}

async function deleteCategory(id) {
  if (!confirm('Delete this category?')) return;
  if (typeof CATEGORIES !== 'undefined') {
    const idx = CATEGORIES.findIndex(c => c.id === id);
    if (idx >= 0) CATEGORIES.splice(idx, 1);
  }
  admToast('🗑 Category deleted');
  renderCategoriesTable();
  renderFlavoursTable();
}
