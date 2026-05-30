// ============================================
// Admin Panel Logic — Fixed Login + Enhanced
// ============================================

let allOrders           = [];
let allReviews          = [];
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
    });
  }

  if (typeof DB.listenContacts === 'function') {
    DB.listenContacts(function(contacts) {
      renderContacts(contacts);
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
  };

  container.innerHTML = `
    <table style="width:100%;border-collapse:separate;border-spacing:0 10px;">
      <thead>
        <tr style="background:none;">
          <th style="text-align:left;padding:0.5rem 1rem;font-size:0.75rem;text-transform:uppercase;letter-spacing:1px;color:#888;">Order ID</th>
          <th style="text-align:left;padding:0.5rem 1rem;font-size:0.75rem;text-transform:uppercase;letter-spacing:1px;color:#888;">Customer</th>
          <th style="text-align:left;padding:0.5rem 1rem;font-size:0.75rem;text-transform:uppercase;letter-spacing:1px;color:#888;">Type</th>
          <th style="text-align:left;padding:0.5rem 1rem;font-size:0.75rem;text-transform:uppercase;letter-spacing:1px;color:#888;">Total</th>
          <th style="text-align:left;padding:0.5rem 1rem;font-size:0.75rem;text-transform:uppercase;letter-spacing:1px;color:#888;">Status</th>
          <th style="text-align:left;padding:0.5rem 1rem;font-size:0.75rem;text-transform:uppercase;letter-spacing:1px;color:#888;">Actions</th>
        </tr>
      </thead>
      <tbody>
        ${orders.map(order => {
          const time = new Date(order.timestamp).toLocaleString('en-IN', {
            day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
          });
          const pm = order.paymentMethod || 'cash';
          const sc = statusColors[order.status] || statusColors.pending;
          const typeIcon = order.orderType === 'parcel' ? 'Parcel (+Rs.10)' : 'Pickup';

          const itemsHTML = (order.items || []).map(i => {
            const name = i.name && i.name.en ? i.name.en : (i.name || 'Item');
            return `<tr style="border-bottom: 1px dashed #eee;">
              <td style="padding:0.3rem 0.6rem;font-size:0.88rem;">${i.emoji || '🍧'} ${name}</td>
              <td style="padding:0.3rem 0.6rem;font-size:0.88rem;text-align:center;font-weight:700;">×${i.qty}</td>
              <td style="padding:0.3rem 0.6rem;font-size:0.88rem;text-align:right;color:var(--accent);font-weight:700;">₹${i.totalPrice}</td>
            </tr>`;
          }).join('');

          return `
          <tr style="background:${sc.bg};border-radius:12px;">
            <td style="padding:1rem;border-radius:12px 0 0 0;border-left:5px solid ${sc.border};border-top:1px solid ${sc.border}20;border-bottom:1px solid ${sc.border}20;">
              <div style="font-family:monospace;font-weight:700;color:${sc.text};font-size:0.95rem;">${order.orderId}</div>
              <div style="font-size:0.78rem;color:#888;margin-top:2px;">${time}</div>
            </td>
            <td style="padding:1rem;border-top:1px solid ${sc.border}20;border-bottom:1px solid ${sc.border}20;">
              <div style="font-weight:700;font-size:1.05rem;color:#1a1a1a;">${order.customerName}</div>
              <div style="font-size:0.85rem;color:#555;">📞 ${order.phone}</div>
            </td>
            <td style="padding:1rem;border-top:1px solid ${sc.border}20;border-bottom:1px solid ${sc.border}20;">
              <div style="font-size:0.9rem;font-weight:600;">${typeIcon}</div>
              <div style="font-size:0.8rem;color:#888;">${payIcons[pm] || '💳'} ${pm.toUpperCase()}</div>
            </td>
            <td style="padding:1rem;border-top:1px solid ${sc.border}20;border-bottom:1px solid ${sc.border}20;">
              <div style="font-size:1.4rem;font-weight:900;color:#1a1a1a;">₹${order.total}</div>
              <div>
                <table style="margin-top:0.5rem;background:rgba(255,255,255,0.7);border-radius:8px;width:100%;min-width:180px;">
                  <tbody>${itemsHTML}</tbody>
                </table>
              </div>
            </td>
            <td style="padding:1rem;border-top:1px solid ${sc.border}20;border-bottom:1px solid ${sc.border}20;">
              <div class="admin-status-actions" role="group" aria-label="Order status">
                <button class="status-action-btn ${order.status === 'pending' ? 'is-active' : ''}" onclick="updateOrderStatus('${order.id}', 'pending')">Pending</button>
                <button class="status-action-btn ${order.status === 'processing' ? 'is-active' : ''}" onclick="updateOrderStatus('${order.id}', 'processing')">Processing</button>
                <button class="status-action-btn status-done ${order.status === 'completed' ? 'is-active' : ''}" onclick="updateOrderStatus('${order.id}', 'completed')">Done</button>
              </div>
            </td>
            <td style="padding:1rem;border-radius:0 12px 12px 0;border-top:1px solid ${sc.border}20;border-bottom:1px solid ${sc.border}20;border-right:1px solid ${sc.border}20;">
              <div style="display:flex;gap:0.5rem;flex-direction:column;">
                <button style="background:#25D366;color:white;border:none;border-radius:8px;padding:0.4rem 0.8rem;cursor:pointer;font-weight:600;font-size:0.85rem;" onclick="notifyAdmin('${order.id}')">WhatsApp</button>
                <button style="background:#fee2e2;color:#dc2626;border:none;border-radius:8px;padding:0.4rem 0.8rem;cursor:pointer;font-weight:600;font-size:0.85rem;" onclick="deleteOrder('${order.id}')">🗑 Delete</button>
              </div>
            </td>
          </tr>
          `;
        }).join('')}
      </tbody>
    </table>
  `;
}



function updateOrderStatus(orderId, status) {
  if (typeof DB !== 'undefined' && typeof DB.updateOrderStatus === 'function') {
    DB.updateOrderStatus(orderId, status);
  }

  const order = allOrders.find(o => o.id === orderId);
  if (status === 'completed' && order) {
    notifyAdmin(orderId, true);
  }

  admToast('Status updated: ' + (status === 'completed' ? 'Done' : status));
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
  const tbody = document.getElementById('adminProductsList');
  if (!tbody || !window.allProducts) return;

  if (window.allProducts.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding: 2rem;">No products found</td></tr>';
    return;
  }

  tbody.innerHTML = window.allProducts.map(p => `
    <tr>
      <td><div style="font-weight:bold;">${p.emoji || '🍧'} ${p.name.en || p.name}</div></td>
      <td>₹${p.price}</td>
      <td>${p.isSpecial ? 'Special' : 'Regular'}</td>
      <td>
        <button class="tbl-btn danger" onclick="deleteProduct('${p.dbId}')">🗑</button>
      </td>
    </tr>
  `).join('');
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
    DB.pushNotification({ title, message: msg, timestamp: Date.now() });
    admToast('Global notification broadcasted! 📢');
    e.target.reset();
  }
}

// ═══════════════════════════════════════════
// TOP GOLA
// ═══════════════════════════════════════════

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
    return '<div class="review-item">' +
      '<div style="flex:1;">' +
        '<div class="review-stars">' + '★'.repeat(r.rating) + '☆'.repeat(5 - r.rating) + '</div>' +
        '<div class="review-text-body">"' + (r.commentEn || r.comment) + '"</div>' +
        '<div class="review-meta">' + (r.nameEn || r.name) + ' · ' + new Date(r.timestamp).toLocaleDateString() +
          (r.isDefault ? '<span style="background:rgba(37,99,235,0.12);color:#2563EB;font-size:0.65rem;padding:1px 6px;border-radius:10px;margin-left:4px;">Default</span>' : '') +
        '</div>' +
      '</div>' +
      '<button class="adm-btn adm-btn-danger" style="font-size:0.75rem;padding:0.3rem 0.6rem;" onclick="deleteReview(\'' + r.id + '\')">🗑</button>' +
    '</div>';
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
