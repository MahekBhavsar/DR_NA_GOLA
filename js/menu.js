// ============================================
// Menu Page Logic — Clean, No Toppings
// ============================================

let currentFilter = 'all';
let searchQuery = '';

// Customization State
let currentItem = null;
let selectedCategories = new Map(); // catId -> qty
let currentQty = 1; // used only for specials

document.addEventListener('DOMContentLoaded', () => {
  renderNavbar('menu');
  renderFooter();
  
  // Check URL params for highlight
  const urlParams = new URLSearchParams(window.location.search);
  const highlightId = urlParams.get('highlight');
  if (highlightId && highlightId.startsWith('sp-')) {
    currentFilter = 'special';
    document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
    const spTab = document.querySelector('[data-filter="special"]');
    if (spTab) spTab.classList.add('active');
  }

  loadMenuCustomCategories().then(() => {
    if (typeof DB !== 'undefined' && DB.listenProducts) {
      DB.listenProducts((products) => {
        window.allProducts = products.filter(p => !p.isCategory);
        renderMenu();
      });
    } else {
      // Fallback if Firebase fails
      window.allProducts = [
        ...FLAVORS.map(f => ({...f, isSpecial: false})),
        ...SPECIALS.map(s => ({...s, isSpecial: true}))
      ];
      renderMenu();
    }
  });
});

function onLangChange() {
  renderMenu();
  if (currentItem) updateModalUI();
}

// ── Render Grid ──
function renderMenu() {
  const grid = document.getElementById('menuGrid');
  if (!grid || !window.allProducts) return;

  let items = [];
  
  if (currentFilter === 'special') {
    items = window.allProducts.filter(p => p.isSpecial).map(p => {
      let sp = { ...p, type: 'special' };
      // Merge img from static SPECIALS if missing
      if (!sp.img) {
        const staticSp = (typeof SPECIALS !== 'undefined' ? SPECIALS : []).find(s => s.id === sp.id);
        if (staticSp && staticSp.img) sp.img = staticSp.img;
      }
      return sp;
    });
  } else {
    items = window.allProducts.filter(p => !p.isSpecial).map(p => ({ ...p, type: 'flavor' }));
  }

  // Apply search
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    items = items.filter(item => 
      item.name.en.toLowerCase().includes(q) || 
      item.name.gu.includes(q)
    );
  }

  if (items.length === 0) {
    grid.innerHTML = '';
    document.getElementById('noResults').style.display = 'block';
    return;
  }
  
  document.getElementById('noResults').style.display = 'none';

  grid.innerHTML = items.map((item, index) => {
    const iconHtml = item.img 
      ? `<div class="flavor-icon" style="background: transparent; overflow: hidden; padding: 0;"><img src="${item.img}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.parentElement.innerHTML='${item.emoji}'"></div>`
      : `<div class="flavor-icon" style="background: ${item.colorLight || '#f0f0f0'}">${item.emoji}</div>`;

    return `
    <div class="flavor-card fade-in" style="transition-delay: ${(index % 10) * 0.05}s" onclick="openCustomizeModal('${item.id}', '${item.type}')">
      ${iconHtml}
      <div class="flavor-name">${tObj(item.name)}</div>
      ${item.type === 'special' 
        ? `<div class="flavor-name-sub">${tObj(item.desc)}</div>
           <div class="flavor-price">${formatPrice(item.price)}</div>`
        : ``
      }
      <button class="btn btn-primary btn-sm btn-block" style="margin-top: 0.75rem;">${t('menu_customize')}</button>
    </div>
  `}).join('');
  
  setTimeout(initScrollAnimations, 50);
}

// ── Filtering & Search ──
function setFilter(filter) {
  currentFilter = filter;
  document.querySelectorAll('.filter-tab').forEach(t => {
    t.classList.toggle('active', t.getAttribute('data-filter') === filter);
  });
  renderMenu();
}

function filterMenu() {
  searchQuery = document.getElementById('searchInput').value;
  renderMenu();
}

// ── Modal Footer Update ──
function openCustomizeModal(itemId, type) {
  if (type === 'special') {
    const dbSpecial = window.allProducts && window.allProducts.find(p => p.id === itemId && p.isSpecial);
    currentItem = { ...(dbSpecial || SPECIALS.find(s => s.id === itemId)), isSpecial: true };
  } else {
    const dbFlavor = window.allProducts && window.allProducts.find(p => p.id === itemId && !p.isSpecial);
    currentItem = { ...(dbFlavor || FLAVORS.find(f => f.id === itemId)), isSpecial: false };
    selectedCategories = new Map(); // reset per-category quantities
    selectedCategories.set('super', 1); // default: 1 Super
  }
  
  currentQty = 1;
  updateModalUI();
  
  document.getElementById('customizeModal').classList.add('active');
  document.body.style.overflow = 'hidden';

  // Inject button in footer
  const footer = document.querySelector('.modal-footer');
  if (footer) {
    footer.innerHTML = `
      <div class="modal-price-strip">
        <span class="strip-label">Total</span>
        <span class="strip-amount" id="modalStripTotal">₹0</span>
      </div>
      <button class="btn btn-primary btn-block" id="modalBuyBtn" onclick="buyNowAndClose()" style="font-size:1.05rem; padding: 0.9rem;">Buy Now</button>
    `;
  }
}

function closeModal() {
  document.getElementById('customizeModal').classList.remove('active');
  document.body.style.overflow = '';
  currentItem = null;
}

function updateModalUI() {
  if (!currentItem) return;
  
  document.getElementById('modalTitle').innerHTML = `${currentItem.emoji} ${tObj(currentItem.name)}`;

  let html = '';

  // ── Size Selection (regular flavors only) ──
  if (!currentItem.isSpecial) {
    html += `
      <h4 style="margin-bottom: 0.85rem; color: var(--text); font-size:0.95rem;">Select Size &amp; Quantity</h4>
      <div class="category-options">
        ${CATEGORIES.map(cat => {
          const qty = selectedCategories.get(cat.id) || 0;
          const isSelected = qty > 0;
          return `
          <div class="category-option ${isSelected ? 'selected' : ''}">
            <div class="cat-info">
              <div class="cat-name">${tObj(cat.name)}</div>
              <div class="cat-price">${formatPrice(cat.price)}</div>
            </div>
            <div class="cat-qty-control">
              <button class="cat-qty-btn" onclick="changeCatQty('${cat.id}', -1)">−</button>
              <span class="cat-qty-val">${qty}</span>
              <button class="cat-qty-btn" onclick="changeCatQty('${cat.id}', 1)">+</button>
            </div>
          </div>`;
        }).join('')}
      </div>
    `;
  } else {
    // Special info
    html += `
      <div style="padding: 1rem; background: linear-gradient(135deg, var(--primary-50), #EBF5FF); border: 1px solid var(--primary-100); border-radius: var(--radius-md); margin-bottom: 1rem;">
        <div style="font-weight: 700; color: var(--primary-900); margin-bottom: 0.3rem;">⭐ Dr. Special</div>
        <div style="color: var(--text-body); font-size: 0.9rem;">${tObj(currentItem.desc)}</div>
        <div style="font-weight: 800; color: var(--primary-700); font-size: 1.3rem; margin-top: 0.5rem;">${formatPrice(currentItem.price)}</div>
      </div>
    `;
    // Qty for specials
    html += `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
        <h4 style="color: var(--text); font-size:0.95rem;">${t('menu_qty')}</h4>
        <div class="qty-selector">
          <button class="qty-btn" onclick="updateQty(-1)">−</button>
          <input type="text" class="qty-value" value="${currentQty}" readonly>
          <button class="qty-btn" onclick="updateQty(1)">+</button>
        </div>
      </div>
    `;
  }

  // ── Custom note ──
  html += `
    <div class="form-group" style="margin-top: 0.75rem;">
      <label style="font-size: 0.85rem; color: var(--text-light);">📝 Special instructions (optional)</label>
      <input type="text" id="manualNote" class="form-input" placeholder="e.g. extra sweet, less ice..." style="font-size: 0.85rem; margin-top: 0.4rem;">
    </div>
  `;

  document.getElementById('modalContent').innerHTML = html;
  updatePriceSummary();
}

function changeCatQty(catId, delta) {
  const current = selectedCategories.get(catId) || 0;
  const newQty = current + delta;
  if (newQty <= 0) {
    selectedCategories.delete(catId);
  } else if (newQty <= 20) {
    selectedCategories.set(catId, newQty);
  }
  updateModalUI();
}

function toggleCategory(catId) {
  // Legacy alias — not used for regular items any more, but kept for safety
  changeCatQty(catId, selectedCategories.has(catId) ? -selectedCategories.get(catId) : 1);
}

function updateQty(change) {
  const newQty = currentQty + change;
  if (newQty >= 1 && newQty <= 20) {
    currentQty = newQty;
    updateModalUI();
  }
}

function updatePriceSummary() {
  if (!currentItem) return;
  
  let grandTotal = 0;
  
  if (currentItem.isSpecial) {
    grandTotal = currentItem.price * currentQty;
  } else {
    selectedCategories.forEach((qty, catId) => {
      const c = CATEGORIES.find(x => x.id === catId);
      if (c && qty > 0) grandTotal += c.price * qty;
    });
  }
  
  // Update the price strip in footer
  const strip = document.getElementById('modalStripTotal');
  if (strip) strip.textContent = formatPrice(grandTotal);
  
  // Update buy button
  const buyBtn = document.getElementById('modalBuyBtn');
  const hasSelection = currentItem.isSpecial ? true : selectedCategories.size > 0;
  
  if (buyBtn) {
    buyBtn.disabled = !hasSelection;
    buyBtn.style.opacity = !hasSelection ? '0.5' : '1';
    buyBtn.textContent = grandTotal > 0 ? `Buy Now — ${formatPrice(grandTotal)}` : 'Buy Now';
  }
  
  // Legacy elements (still in HTML before footer replacement)
  const bpEl = document.getElementById('summaryBasePrice');
  const totEl = document.getElementById('summaryTotal');
  if (bpEl) bpEl.textContent = formatPrice(grandTotal);
  if (totEl) totEl.textContent = formatPrice(grandTotal);
}

function addToCartAndClose() {
  if (!currentItem) return;

  const manualInput = document.getElementById('manualNote');
  const note = manualInput ? manualInput.value.trim() : '';

  if (currentItem.isSpecial) {
    addToCart({
      id: currentItem.id + '-' + Date.now(),
      name: currentItem.name,
      emoji: currentItem.emoji,
      isSpecial: true,
      category: null,
      toppings: [],
      note: note,
      qty: currentQty,
      basePrice: currentItem.price,
      toppingsPrice: 0,
      unitPrice: currentItem.price,
      totalPrice: currentItem.price
    });
  } else {
    // One cart item per selected category, with its own qty from the Map
    if (selectedCategories.size === 0) return;
    selectedCategories.forEach((qty, catId) => {
      const cat = CATEGORIES.find(c => c.id === catId);
      if (!cat || qty === 0) return;
      addToCart({
        id: currentItem.id + '-' + cat.id + '-' + Date.now(),
        name: currentItem.name,
        emoji: currentItem.emoji,
        isSpecial: false,
        category: cat,
        toppings: [],
        note: note,
        qty: qty,
        basePrice: cat.price,
        toppingsPrice: 0,
        unitPrice: cat.price,
        totalPrice: cat.price
      });
    });
  }

  closeModal();
}

function buyNowAndClose() {
  addToCartAndClose();
  window.location.href = 'cart.html';
}

// Close modal on outside click
document.getElementById('customizeModal').addEventListener('click', (e) => {
  if (e.target === e.currentTarget) closeModal();
});

function loadMenuCustomCategories() {
  if (typeof db === 'undefined') return Promise.resolve();

  return db.ref('customProducts/category').once('value').then(function(snap) {
    const data = snap.val();
    if (!data || typeof CATEGORIES === 'undefined') return;

    Object.values(data).forEach(function(cat) {
      const idx = CATEGORIES.findIndex(function(c) { return c.id === cat.id; });
      if (idx >= 0) CATEGORIES[idx] = Object.assign({}, CATEGORIES[idx], cat);
      else CATEGORIES.push(cat);
    });
  }).catch(function() {});
}
