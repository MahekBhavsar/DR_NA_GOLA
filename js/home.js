// ============================================
// Home Page Logic
// ============================================

const HOME_STATIC_REVIEWS = [
  {
    name: 'Rahul Desai',
    nameEn: 'Rahul Desai',
    rating: 5,
    comment: 'Perfect premium gola. The syrup tastes rich, the ice is soft, and the dry fruit special is worth it.',
    commentEn: 'Perfect premium gola. The syrup tastes rich, the ice is soft, and the dry fruit special is worth it.',
    timestamp: Date.now() - 86400000 * 2,
    isDefault: true
  },
  {
    name: 'Sneha Patel',
    nameEn: 'Sneha Patel',
    rating: 5,
    comment: 'Very clean service and fresh taste. My family loved the Rajbhog and Kaju Gulkand.',
    commentEn: 'Very clean service and fresh taste. My family loved the Rajbhog and Kaju Gulkand.',
    timestamp: Date.now() - 86400000 * 4,
    isDefault: true
  },
  {
    name: 'Amit Shah',
    nameEn: 'Amit Shah',
    rating: 5,
    comment: 'Best gola place in Valsad. The flavour balance is classic and the presentation feels premium.',
    commentEn: 'Best gola place in Valsad. The flavour balance is classic and the presentation feels premium.',
    timestamp: Date.now() - 86400000 * 7,
    isDefault: true
  }
];

document.addEventListener('DOMContentLoaded', () => {
  renderNavbar('home');
  renderFooter();
  setupStarRating();

  if (typeof DB !== 'undefined' && DB.listenProducts) {
    DB.listenProducts(products => {
      window.allProducts = products;
      renderSpecials();
    });
  } else {
    renderSpecials();
  }

  if (typeof DB !== 'undefined' && typeof DB.initDefaults === 'function') {
    DB.initDefaults().then(() => {
      loadReviews();
    }).catch(() => loadReviews());
  } else {
    loadReviews();
  }

  // Setup Feature Cards Flip
  document.querySelectorAll('.feature-card').forEach(card => {
    card.addEventListener('click', () => {
      card.classList.toggle('flip-animate');
    });
  });
});

function renderSpecials() {
  const grid = document.getElementById('specialsGrid');
  if (!grid) return;

  let specialsToRender = [];
  if (window.allProducts) {
    specialsToRender = window.allProducts.filter(p => p.isSpecial).slice(0, 5).map(sp => {
      // Merge img from static SPECIALS if missing
      if (!sp.img) {
        const staticSp = (typeof SPECIALS !== 'undefined' ? SPECIALS : []).find(s => s.id === sp.id);
        if (staticSp && staticSp.img) sp.img = staticSp.img;
      }
      return sp;
    });
  } else if (typeof SPECIALS !== 'undefined') {
    specialsToRender = SPECIALS.slice(0, 5);
  }

  grid.innerHTML = specialsToRender.map((sp, index) => {
    const isTop1 = index === 0;
    const badgeText = isTop1 ? '🏆 Best Seller' : `Top ${index + 1}`;
    const extraClass = isTop1 ? 'top-selling-badge' : '';
    
    // Check if item is already in cart
    const cartItem = typeof cart !== 'undefined' ? cart.find(c => c.id === sp.id) : null;
    const qtyInCart = cartItem ? cartItem.qty : 0;

    // Use real image if available, else fall back to emoji
    const imgHtml = sp.img
      ? `<div class="special-card-img-wrap"><img src="${sp.img}" alt="${tObj(sp.name)}" class="special-card-img" onerror="this.parentElement.innerHTML='<span class=\\'emoji\\'>${sp.emoji || '🍧'}</span>'"></div>`
      : `<span class="emoji" style="font-size:3.5rem; display:block; margin: 0.5rem 0;">${sp.emoji || '🍧'}</span>`;

    return `
      <div class="special-card pop-in" style="animation-delay: ${index * 0.1}s" onclick="window.location.href='menu.html?highlight=${sp.id}'">
        <div class="special-badge ${extraClass}">${badgeText}</div>
        ${imgHtml}
        <div class="name">${tObj(sp.name)}</div>
        <div class="name-sub">${sp.desc ? tObj(sp.desc) : ''}</div>
        <div class="price-container">
          <div class="price" style="color: var(--primary-800);">${formatPrice(sp.price)}</div>
        </div>
        <div class="special-card-btns">
          ${qtyInCart > 0 ? `
            <div class="qty-selector" style="display:flex; justify-content:center; align-items:center; background:var(--primary-50); border-radius:8px; border:2px solid var(--primary-100); height: 38px;">
              <button class="qty-btn" style="flex:1; border:none; background:none; font-weight:900; color:var(--primary-800); cursor:pointer;" onclick="event.stopPropagation(); updateSpecialQty('${sp.id}', -1)">−</button>
              <span style="flex:1; text-align:center; font-weight:900; color:var(--primary-800);">${qtyInCart}</span>
              <button class="qty-btn" style="flex:1; border:none; background:none; font-weight:900; color:var(--primary-800); cursor:pointer;" onclick="event.stopPropagation(); updateSpecialQty('${sp.id}', 1)">+</button>
            </div>
          ` : `
            <button class="btn btn-sm" style="background:var(--primary-50);color:var(--primary-800);border-radius:8px;font-weight:800;border:2px solid var(--primary-100);" onclick="event.stopPropagation(); quickAddSpecial('${sp.id}', false)">Add</button>
          `}
          <button class="btn btn-primary btn-sm" style="border-radius:8px;" onclick="event.stopPropagation(); quickAddSpecial('${sp.id}', true)">Buy Now</button>
        </div>
      </div>
    `;
  }).join('');

  setTimeout(initScrollAnimations, 50);
}

function quickAddSpecial(id, buyNow) {
  const existingItemIndex = typeof cart !== 'undefined' ? cart.findIndex(c => c.id === id) : -1;
  
  if (existingItemIndex > -1) {
    cart[existingItemIndex].qty += 1;
    cart[existingItemIndex].totalPrice = cart[existingItemIndex].qty * cart[existingItemIndex].unitPrice;
    if (typeof saveCart === 'function') saveCart();
    if (typeof updateCartBadge === 'function') updateCartBadge();
    if (typeof showToast === 'function') showToast(t('cart_added') || 'Item added');
  } else {
    const dbSpecial = window.allProducts && window.allProducts.find(s => s.id === id);
    const sp = dbSpecial || SPECIALS.find(s => s.id === id);
    if (!sp) return;

    const cartItem = {
      id: sp.id, // Use strict ID to allow grouping
      name: sp.name,
      emoji: sp.emoji,
      isSpecial: true,
      category: null,
      toppings: [],
      note: '',
      qty: 1,
      basePrice: sp.price,
      toppingsPrice: 0,
      unitPrice: sp.price,
      totalPrice: sp.price
    };

    if (typeof addToCart === 'function') addToCart(cartItem);
  }
  
  renderSpecials();
  if (buyNow) window.location.href = 'cart.html';
}

function updateSpecialQty(id, delta) {
  const existingItemIndex = typeof cart !== 'undefined' ? cart.findIndex(c => c.id === id) : -1;
  if (existingItemIndex > -1) {
    cart[existingItemIndex].qty += delta;
    if (cart[existingItemIndex].qty <= 0) {
      cart.splice(existingItemIndex, 1);
      if (typeof showToast === 'function') showToast('Item removed from cart');
    } else {
      cart[existingItemIndex].totalPrice = cart[existingItemIndex].qty * cart[existingItemIndex].unitPrice;
    }
    if (typeof saveCart === 'function') saveCart();
    if (typeof updateCartBadge === 'function') updateCartBadge();
    renderSpecials();
  }
}

function setupStarRating() {
  const stars = document.querySelectorAll('#starRating span');
  const input = document.getElementById('reviewRating');
  if (!stars.length || !input) return;

  stars.forEach(star => {
    star.addEventListener('click', () => {
      const val = parseInt(star.getAttribute('data-value'));
      input.value = val;

      stars.forEach(s => {
        const active = parseInt(s.getAttribute('data-value')) <= val;
        s.classList.toggle('active', active);
        s.style.color = active ? 'var(--gold)' : 'var(--primary-100)';
      });
    });
  });
}

function loadReviews() {
  const container = document.getElementById('reviewsContainer');
  if (!container) return;

  renderReviewCards([]);

  if (typeof DB !== 'undefined' && typeof DB.listenReviews === 'function') {
    DB.listenReviews((fetchedReviews) => {
      renderReviewCards(fetchedReviews || []);
    });
  }
}

function renderReviewCards(fetchedReviews) {
  const container = document.getElementById('reviewsContainer');
  if (!container) return;

  const submittedReviews = (fetchedReviews || []).filter(r => !r.isDefault);
  const defaultReviews = typeof DEFAULT_REVIEWS !== 'undefined' ? DEFAULT_REVIEWS : [];
  const allReviews = [...submittedReviews, ...HOME_STATIC_REVIEWS, ...defaultReviews];
  const seen = new Set();

  const displayReviews = allReviews
    .filter(r => {
      const key = (r.nameEn || r.name || '') + '|' + (r.commentEn || r.comment || '');
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
    .slice(0, 6);

  // Duplicate for seamless infinite marquee scroll
  const scrollReviews = [...displayReviews, ...displayReviews];

  container.innerHTML = scrollReviews.map(r => {
    const name = r.nameEn && currentLang === 'en' ? r.nameEn : (r.name || 'Customer');
    const comment = r.commentEn && currentLang === 'en' ? r.commentEn : r.comment;
    const initial = name.charAt(0).toUpperCase();
    const rating = Math.max(1, Math.min(5, parseInt(r.rating) || 5));

    return `
      <div class="review-card">
        <div class="review-header">
          <div class="review-avatar">${initial}</div>
          <div class="review-meta">
            <div class="review-name">${name}</div>
            <div class="review-stars">${'★'.repeat(rating)}${'☆'.repeat(5 - rating)}</div>
          </div>
        </div>
        <div class="review-comment">"${comment}"</div>
        ${r.videoUrl ? `<video src="${r.videoUrl}" controls class="review-video"></video>` : ''}
      </div>
    `;
  }).join('');
}

async function submitReview(e) {
  e.preventDefault();
  const btn = document.getElementById('submitReviewBtn');
  const nameEl = document.getElementById('reviewName');
  const commentEl = document.getElementById('reviewComment');
  const ratingEl = document.getElementById('reviewRating');
  const videoEl = document.getElementById('reviewVideo');

  const name = nameEl.value.trim();
  const comment = commentEl.value.trim();
  const rating = parseInt(ratingEl.value);
  if (!name || !comment) return;

  const originalText = btn.innerHTML;
  btn.innerHTML = 'Submitting...';
  btn.disabled = true;

  try {
    let videoUrl = null;
    if (videoEl && videoEl.files && videoEl.files.length > 0) {
      btn.innerHTML = 'Uploading video...';
      const file = videoEl.files[0];
      if (typeof DB.uploadVideo === 'function') {
        videoUrl = await DB.uploadVideo(file);
      }
    }

    const review = {
      name,
      nameEn: name,
      comment,
      commentEn: comment,
      rating,
      timestamp: Date.now(),
      isDefault: false
    };
    if (videoUrl) review.videoUrl = videoUrl;

    if (typeof DB !== 'undefined' && typeof DB.pushReview === 'function') {
      await DB.pushReview(review);
    } else {
      renderReviewCards([review]);
    }

    showToast(currentLang === 'gu' ? 'Review added. Thank you!' : 'Review added. Thank you!');
    nameEl.value = '';
    commentEl.value = '';
    if (videoEl) videoEl.value = '';
  } catch (error) {
    showToast('Error submitting review', 'error');
    console.error(error);
  } finally {
    btn.innerHTML = originalText;
    btn.disabled = false;
  }
}

function onLangChange() {
  renderSpecials();
  loadReviews();
}
