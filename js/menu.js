// ============================================
// Menu Page Logic — Clean, No Toppings
// ============================================

let currentFilter = 'all';
let searchQuery = '';

// Customization State
let currentItem = null;
let selectedCategories = new Set();
let currentQty = 1;

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
    items = window.allProducts.filter(p => p.isSpecial).map(p => ({ ...p, type: 'special' }));
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

  grid.innerHTML = items.map((item, index) => `
    <div class="flavor-card fade-in" style="transition-delay: ${(index % 10) * 0.05}s" onclick="openCustomizeModal('${item.id}', '${item.type}')">
      <div class="flavor-icon" style="background: ${item.colorLight || '#f0f0f0'}">${item.emoji}</div>
      <div class="flavor-name">${tObj(item.name)}</div>
      ${item.type === 'special' 
        ? `<div class="flavor-name-sub">${tObj(item.desc)}</div>
           <div class="flavor-price">${formatPrice(item.price)}</div>`
        : ``
      }
      <button class="btn btn-primary btn-sm btn-block" style="margin-top: 0.75rem;">${t('menu_customize')}</button>
    </div>
  `).join('');
  
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
    selectedCategories.clear();
    selectedCategories.add('super'); // default
  }
  
  currentQty = 1;
  updateModalUI();
  
  document.getElementById('customizeModal').classList.add('active');
  document.body.style.overflow = 'hidden';

  // Inject button in footer
  const footer = document.querySelector('.modal-footer');
  if (footer) {
    footer.innerHTML = `
      <div style="width: 100%; display: flex; justify-content: center;">
        <button class="btn btn-primary btn-block btn-pulse" id="modalBuyBtn" onclick="buyNowAndClose()" style="padding: 1rem; font-size: 1.1rem; width: 100%;">⚡ Buy Now</button>
      </div>
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
      <h4 style="margin-bottom: 0.75rem; color: var(--text);">${t('menu_select_size')} <small style="font-weight:400; color:var(--text-light);">(select multiple)</small></h4>
      <div class="category-options">
        ${CATEGORIES.map(cat => {
          const isSelected = selectedCategories.has(cat.id);
          return `
          <div class="category-option ${isSelected ? 'selected' : ''}" onclick="toggleCategory('${cat.id}')">
            <div class="cat-check">${isSelected ? '✅' : ''}</div>
            <span class="cat-emoji">${cat.emoji}</span>
            <div class="cat-name">${tObj(cat.name)}</div>
            <div class="cat-price">${formatPrice(cat.price)}</div>
          </div>`;
        }).join('')}
      </div>
    `;
  } else {
    // Special info
    html += `
      <div style="padding: 1rem; background: linear-gradient(135deg, #fff7d6, #fdfbf7); border: 1px solid rgba(212,175,55,0.3); border-radius: var(--radius-md); margin-bottom: 1rem;">
        <div style="font-weight: 700; color: #2b113b; margin-bottom: 0.3rem;">⭐ Dr. Special</div>
        <div style="color: var(--text-body); font-size: 0.9rem;">${tObj(currentItem.desc)}</div>
        <div style="font-weight: 800; color: var(--accent); font-size: 1.3rem; margin-top: 0.5rem;">${formatPrice(currentItem.price)}</div>
      </div>
    `;
  }

  // ── Custom note ──
  html += `
    <div class="form-group" style="margin-top: 1rem;">
      <label style="font-size: 0.85rem; color: var(--text-light);">📝 Special instructions (optional)</label>
      <input type="text" id="manualNote" class="form-input" placeholder="e.g. extra sweet, less ice, more syrup..." style="font-size: 0.85rem; margin-top: 0.4rem;">
    </div>
  `;

  // ── Quantity ──
  html += `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 1rem;">
      <h4 style="color: var(--text);">${t('menu_qty')}</h4>
      <div class="qty-selector">
        <button class="qty-btn" onclick="updateQty(-1)">−</button>
        <input type="text" class="qty-value" value="${currentQty}" readonly>
        <button class="qty-btn" onclick="updateQty(1)">+</button>
      </div>
    </div>
  `;

  document.getElementById('modalContent').innerHTML = html;
  updatePriceSummary();
}

function toggleCategory(catId) {
  if (selectedCategories.has(catId)) {
    selectedCategories.delete(catId);
  } else {
    selectedCategories.add(catId);
  }
  updateModalUI();
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
  
  let basePrice = 0;
  
  if (currentItem.isSpecial) {
    basePrice = currentItem.price;
  } else {
    selectedCategories.forEach(catId => {
      const c = CATEGORIES.find(x => x.id === catId);
      if (c) basePrice += c.price;
    });
  }
  
  const grandTotal = basePrice * currentQty;
  
  document.getElementById('summaryBasePrice').textContent = formatPrice(basePrice);
  document.getElementById('summaryToppingsPrice').textContent = '₹0';
  document.getElementById('summaryTotal').textContent = formatPrice(grandTotal);
  
  // Disable add button if nothing selected
  const buyBtn = document.getElementById('modalBuyBtn');
  const disabled = (!currentItem.isSpecial && selectedCategories.size === 0);
  
  if (buyBtn) {
    buyBtn.disabled = disabled;
    buyBtn.style.opacity = disabled ? '0.5' : '1';
    // Update button text to include price
    if (!disabled) {
      buyBtn.innerHTML = `⚡ Buy Now - ${formatPrice(grandTotal)}`;
    } else {
      buyBtn.innerHTML = `⚡ Buy Now`;
    }
  }
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
    // One cart item per selected size
    selectedCategories.forEach(catId => {
      const cat = CATEGORIES.find(c => c.id === catId);
      if (!cat) return;
      
      addToCart({
        id: currentItem.id + '-' + cat.id + '-' + Date.now(),
        name: currentItem.name,
        emoji: currentItem.emoji,
        isSpecial: false,
        category: cat,
        toppings: [],
        note: note,
        qty: currentQty,
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
