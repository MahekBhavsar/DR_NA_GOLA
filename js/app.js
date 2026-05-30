// ============================================
// App.js — Shared Logic (Navbar, Footer, Cart)
// ============================================

// ── Cart (localStorage) ──
const CART_KEY = 'dr-gola-cart';

function getCart() {
  try { return JSON.parse(localStorage.getItem(CART_KEY)) || []; }
  catch { return []; }
}

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  updateCartBadge();
}

function addToCart(item) {
  const cart = getCart();
  cart.push({ ...item, cartId: Date.now() + Math.random() });
  saveCart(cart);
  showToast(currentLang === 'gu' ? '✅ કાર્ટમાં ઉમેર્યું!' : '✅ Added to cart!');
}

function removeFromCart(cartId) {
  let cart = getCart();
  cart = cart.filter(i => i.cartId !== cartId);
  saveCart(cart);
}

function clearCart() {
  localStorage.removeItem(CART_KEY);
  updateCartBadge();
}

function getCartTotal() {
  return getCart().reduce((sum, item) => sum + (item.totalPrice * item.qty), 0);
}

function getCartCount() {
  return getCart().reduce((sum, item) => sum + item.qty, 0);
}

function updateCartBadge() {
  const badge = document.getElementById('cartBadge');
  if (badge) {
    const count = getCartCount();
    badge.textContent = count;
    badge.setAttribute('data-count', count);
    badge.style.display = count > 0 ? 'flex' : 'none';
  }
}

// ── Toast Notifications ──
function showToast(message, type = '', duration = 3000) {
  const existing = document.querySelectorAll('.toast');
  existing.forEach(t => t.remove());

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), duration);
}

// ── Global Notifications ──
let lastSeenNotif = localStorage.getItem('dr-gola-last-notif') || 0;

function initNotifications() {
  // Welcome Toast (First time visitor)
  if (!localStorage.getItem('dr-gola-visited')) {
    setTimeout(() => {
      showToast('🎉 Welcome to Doctor Na Gola! Try our Top 5 Specials.', 'welcome-toast', 5000);
      localStorage.setItem('dr-gola-visited', 'true');
    }, 2000);
  }

  // Listen for Admin Broadcasts
  if (typeof DB !== 'undefined' && DB.listenNotifications) {
    DB.listenNotifications((notif) => {
      if (notif && notif.timestamp > lastSeenNotif) {
        showToast(`<strong>📢 ${notif.title}</strong><br>${notif.message}`, 'broadcast-toast', 8000);
        lastSeenNotif = notif.timestamp;
        localStorage.setItem('dr-gola-last-notif', lastSeenNotif);
        
        // Jiggle bell
        const bell = document.getElementById('navBell');
        if (bell) {
          bell.style.animation = 'popIn 0.5s ease';
          setTimeout(() => bell.style.animation = '', 500);
        }
      }
    });
  }
}

// ── Navbar ──
function renderNavbar(activePage) {
  const nav = document.getElementById('navbar');
  if (!nav) return;

  const pages = [
    { key: 'nav_home', href: 'index.html', id: 'home' },
    { key: 'nav_menu', href: 'menu.html', id: 'menu' },
    { key: 'nav_track', href: 'track.html', id: 'track' },
    { key: 'nav_contact', href: 'contact.html', id: 'contact' },
  ];

  nav.className = 'navbar';
  nav.innerHTML = `
    <div class="nav-container">
      <a href="index.html" class="nav-logo">
        <img src="assets/logo.png" alt="Dr Na Gola Logo" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><rect fill=%22%231565C0%22 width=%22100%22 height=%22100%22 rx=%2250%22/><text x=%2250%25%22 y=%2255%25%22 text-anchor=%22middle%22 fill=%22white%22 font-size=%2240%22>🍧</text></svg>'">
        <span class="nav-logo-text" data-t="brand_name">${t('brand_name')}</span>
      </a>
      <div class="nav-links" id="navLinks">
        ${pages.map(p => `
          <a href="${p.href}" class="nav-link ${activePage === p.id ? 'active' : ''}" data-t="${p.key}">${t(p.key)}</a>
        `).join('')}
      </div>
      <div class="nav-actions">
        <button class="nav-lang-btn" id="langToggleBtn" onclick="toggleLang(); renderNavbar('${activePage}'); if(typeof onLangChange==='function') onLangChange();">
          ${currentLang === 'en' ? '🇮🇳 ગુજરાતી' : '🇬🇧 English'}
        </button>
        <div class="nav-bell-btn" id="navBell" style="cursor:pointer; font-size: 1.3rem; margin: 0 0.5rem;" onclick="showToast('No new notifications', '', 2000)">
          🔔
        </div>
        <a href="cart.html" class="nav-cart-btn">
          🛒 <span class="cart-text" data-t="nav_cart">${t('nav_cart')}</span>
          <span class="cart-badge" id="cartBadge">0</span>
        </a>
        <div class="nav-hamburger" id="navHamburger" onclick="toggleMobileNav()">
          <span></span><span></span><span></span>
        </div>
      </div>
    </div>
    <div class="nav-overlay" id="navOverlay" onclick="toggleMobileNav()"></div>
  `;

  updateCartBadge();
  initNotifications();

  // Scroll effect
  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 50);
  });
}

function toggleMobileNav() {
  const links = document.getElementById('navLinks');
  const burger = document.getElementById('navHamburger');
  const overlay = document.getElementById('navOverlay');
  links.classList.toggle('open');
  burger.classList.toggle('active');
  overlay.classList.toggle('active');
}

// ── Footer ──
function renderFooter() {
  const footer = document.getElementById('footer');
  if (!footer) return;

  footer.className = 'footer';
  footer.innerHTML = `
    <div class="container">
      <div class="footer-content">
        <div class="footer-brand">
          <div class="footer-logo">
            <img src="assets/logo.png" alt="Logo" onerror="this.style.display='none'">
            <span data-t="brand_name">${t('brand_name')}</span>
          </div>
          <p data-t="brand_tagline">${t('brand_tagline')}</p>
        </div>
        <div>
          <h4 data-t="nav_menu">${t('nav_menu')}</h4>
          <div class="footer-links">
            <a href="index.html" data-t="nav_home">${t('nav_home')}</a>
            <a href="menu.html" data-t="nav_menu">${t('nav_menu')}</a>
            <a href="track.html">Track Order</a>
            <a href="cart.html" data-t="nav_cart">${t('nav_cart')}</a>
            <a href="contact.html" data-t="nav_contact">${t('nav_contact')}</a>
          </div>
        </div>
        <div>
          <h4 data-t="contact_title">${t('contact_title')}</h4>
          <div class="footer-links">
            <a href="tel:+919712211599">📞 ${t('brand_phone')}</a>
            <a href="https://wa.me/919712211599" target="_blank">💬 WhatsApp</a>
            <a data-t="brand_address">${t('brand_address')}</a>
          </div>
        </div>
      </div>
      <div class="footer-bottom">
        <p data-t="footer_rights">${t('footer_rights')}</p>
        <p data-t="footer_made">${t('footer_made')}</p>
      </div>
    </div>
  `;
}

// ── Scroll Animations ──
function initScrollAnimations() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));
}

// ── Generate Order ID ──
function generateOrderId() {
  const date = new Date();
  const d = date.toISOString().split('T')[0].replace(/-/g, '');
  const rand = Math.floor(Math.random() * 9000 + 1000);
  return `DRG-${d}-${rand}`;
}

// ── Format price ──
function formatPrice(amount) {
  return `₹${amount}`;
}

// ── Initialize ──
document.addEventListener('DOMContentLoaded', () => {
  document.documentElement.setAttribute('lang', currentLang === 'gu' ? 'gu' : 'en');
  initScrollAnimations();
});
