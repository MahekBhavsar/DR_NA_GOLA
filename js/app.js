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
        if (notif.type === 'order-completed' && !isNotificationForThisCustomer(notif)) {
          lastSeenNotif = notif.timestamp;
          localStorage.setItem('dr-gola-last-notif', lastSeenNotif);
          return;
        }
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
function isNotificationForThisCustomer(notif) {
  try {
    const orders = JSON.parse(localStorage.getItem('dng_orders') || '[]');
    const notifPhone = String(notif.phone || '').replace(/\D/g, '');
    return orders.some(order => {
      const orderPhone = String(order.phone || '').replace(/\D/g, '');
      return (notif.orderId && order.orderId === notif.orderId) ||
        (notifPhone && orderPhone && notifPhone === orderPhone);
    });
  } catch (e) {
    return false;
  }
}

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
        <img src="assets/logo.png" alt="Dr Na Gola Logo" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><rect fill=%22%231565C0%22 width=%22100%22 height=%22100%22 rx=%2250%22/><text x=%2250%25%22 y=%2255%25%22 text-anchor=%22middle%22 fill=%22white%22 font-size=%2240%22>&#127847;</text></svg>'">
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
        <a href="cart.html" class="nav-cart-btn">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
          <span class="cart-text" data-t="nav_cart">${t('nav_cart')}</span>
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
          <div class="social-icons-row" style="margin-top:1rem;">
            <a href="https://www.instagram.com/drnagola" target="_blank" class="social-icon-btn instagram" aria-label="Instagram">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
            </a>
            <a href="https://wa.me/919712211599" target="_blank" class="social-icon-btn whatsapp" aria-label="WhatsApp">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
            </a>
            <a href="tel:+919712211599" class="social-icon-btn phone" aria-label="Call Us">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.41 2 2 0 0 1 3.6 1.22h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.84a16 16 0 0 0 6.29 6.29l.95-.94a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
            </a>
          </div>
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
            <a href="tel:+919712211599">${t('brand_phone')}</a>
            <a href="https://wa.me/919712211599" target="_blank">WhatsApp</a>
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
