// ============================================
// Menu Data & Translations - Doctor Na Gola
// ============================================

// 20 Flavors
const FLAVORS = [
  { id: 'orange', name: { en: 'Orange', gu: 'ઓરેન્જ' }, emoji: '🍊', color: '#FF6D00', colorLight: '#FFE0B2' },
  { id: 'pineapple', name: { en: 'Pineapple', gu: 'પાઈનેપલ' }, emoji: '🍍', color: '#F9A825', colorLight: '#FFF9C4' },
  { id: 'kachikeri', name: { en: 'Kachikeri', gu: 'કાચીકેરી' }, emoji: '🥭', color: '#7CB342', colorLight: '#DCEDC8' },
  { id: 'kalakhatta', name: { en: 'Kalakhatta', gu: 'કાલાખટ્ટા' }, emoji: '🍇', color: '#6A1B9A', colorLight: '#E1BEE7' },
  { id: 'strawberry', name: { en: 'Strawberry', gu: 'સ્ટ્રોબેરી' }, emoji: '🍓', color: '#E91E63', colorLight: '#F8BBD0' },
  { id: 'rose', name: { en: 'Rose (Gulab)', gu: 'ગુલાબ' }, emoji: '🌹', color: '#EC407A', colorLight: '#FCE4EC' },
  { id: 'cadbury', name: { en: 'Cadbury', gu: 'કેડબરી' }, emoji: '🍫', color: '#5D4037', colorLight: '#D7CCC8' },
  { id: 'butterscotch', name: { en: 'Butterscotch', gu: 'બટરસ્કોચ' }, emoji: '🍬', color: '#FF8F00', colorLight: '#FFECB3' },
  { id: 'rajbhog', name: { en: 'Rajbhog', gu: 'રાજભોગ' }, emoji: '👑', color: '#EF6C00', colorLight: '#FFE0B2' },
  { id: 'blueberry', name: { en: 'Blueberry', gu: 'બ્લુબેરી' }, emoji: '🫐', color: '#283593', colorLight: '#C5CAE9' },
  { id: 'mangocream', name: { en: 'Mango Cream', gu: 'મેંગોક્રીમ' }, emoji: '🥭', color: '#FF9800', colorLight: '#FFE0B2' },
  { id: 'rasmalai', name: { en: 'Rasmalai', gu: 'રસમલાઈ' }, emoji: '🍨', color: '#FDD835', colorLight: '#FFF9C4' },
  { id: 'falsa', name: { en: 'Falsa', gu: 'ફાલસા' }, emoji: '🍇', color: '#7B1FA2', colorLight: '#E1BEE7' },
  { id: 'blackcurrent', name: { en: 'Black Current', gu: 'બ્લેક કરન્ટ' }, emoji: '⚫', color: '#37474F', colorLight: '#CFD8DC' },
  { id: 'malamalai', name: { en: 'Mala Malai', gu: 'માલા મલાઈ' }, emoji: '🥛', color: '#8D6E63', colorLight: '#EFEBE9' },
  { id: 'mixflavour', name: { en: 'Mix Flavour', gu: 'મિક્સ ફ્લેવર' }, emoji: '🌈', color: '#E91E63', colorLight: '#FCE4EC' },
  { id: 'americandryfruit', name: { en: 'American Dry Fruit', gu: 'અમેરિકન ડ્રાય ફ્રુટ' }, emoji: '🥜', color: '#795548', colorLight: '#D7CCC8' },
  { id: 'jamun', name: { en: 'Jamun', gu: 'જામુન' }, emoji: '🫐', color: '#4A148C', colorLight: '#CE93D8' },
  { id: 'gulkand', name: { en: 'Gulkand', gu: 'ગુલકંદ' }, emoji: '🌸', color: '#AD1457', colorLight: '#F48FB1' },
  { id: 'pista', name: { en: 'Pista', gu: 'પિસ્તા' }, emoji: '🟢', color: '#2E7D32', colorLight: '#C8E6C9' },
];

// Categories / Sizes
const CATEGORIES = [
  { id: 'stick', name: { en: 'Stick Gola', gu: 'સ્ટીક ગોળા' }, price: 60, emoji: '🍡', desc: { en: 'Classic stick gola – any flavor', gu: 'ક્લાસિક સ્ટીક ગોળા – કોઈ પણ ફ્લેવર' } },
  { id: 'super', name: { en: 'Super', gu: 'સુપર' }, price: 100, emoji: '⭐', desc: { en: 'Cup gola – Super size', gu: 'કપ ગોળા – સુપર સાઇઝ' } },
  { id: 'premium', name: { en: 'Premium', gu: 'પ્રીમિયમ' }, price: 150, emoji: '💎', desc: { en: 'Cup gola with extras', gu: 'કપ ગોળા એક્સ્ટ્રા સાથે' } },
  { id: 'shahi', name: { en: 'Shahi', gu: 'શાહી' }, price: 190, emoji: '👑', desc: { en: 'Royal cup gola – fully loaded', gu: 'શાહી કપ ગોળા – ફૂલ લોડેડ' } },
];

// Top 5 Dr. Specials (₹250 each)
const SPECIALS = [
  { id: 'sp-shredded-dryfruit', name: { en: 'Shredded Dryfruit', gu: 'શ્રેડેડ ડ્રાઈફ્રૂટ' }, price: 250, emoji: '🌰', img: 'assets/DrSpecial.png', color: '#A1887F', desc: { en: 'Fine shredded dryfruit mix', gu: 'ફાઇન શ્રેડેડ ડ્રાઈફ્રૂટ મિક્સ' } },
  { id: 'sp-double-dryfruit', name: { en: 'Double Dryfruit', gu: 'ડબલ ડ્રાઈફ્રૂટ' }, price: 250, emoji: '🥜', img: 'assets/RoastedDryfruits.png', color: '#8D6E63', desc: { en: 'Loaded with double dryfruit toppings', gu: 'ડબલ ડ્રાઈફ્રૂટ ટોપિંગ સાથે' } },
  { id: 'sp-kaju-gulkand', name: { en: 'Kaju Gulkand', gu: 'કાજુ ગુલકંદ' }, price: 250, emoji: '🌹', img: 'assets/Kaju-gulkand.png', color: '#E91E63', desc: { en: 'Premium kaju with rose gulkand', gu: 'પ્રીમિયમ કાજુ ગુલકંદ સાથે' } },
  { id: 'sp-double-double', name: { en: 'Double Double', gu: 'ડબલ ડબલ' }, price: 250, emoji: '✨', img: 'assets/Double-Trouble.png', color: '#FFD600', desc: { en: 'Double everything – double fun!', gu: 'ડબલ બધું – ડબલ મજા!' } },
  { id: 'sp-mix-masala', name: { en: 'Mix Masala', gu: 'મિક્સ મસાલા' }, price: 250, emoji: '🌶️', img: 'assets/MixMasala.png', color: '#FF5722', desc: { en: 'Special masala blend topping', gu: 'સ્પેશિયલ મસાલા બ્લેન્ડ ટોપિંગ' } },
];

const PARCEL_CHARGE = 10;

// =============================================
// Complete Translation Dictionary
// =============================================
const T = {
  // Brand
  brand_name: { en: 'Dr Na Gola', gu: 'ડૉક્ટરના ગોળા' },
  brand_tagline: { en: 'ઘરની ધોરાજીના ઘર જેવા ગોળા', gu: 'ઘરની ધોરાજીના ઘર જેવા ગોળા' },
  brand_address: { en: 'Tithal Road, Opp. Sardar Heights, Valsad', gu: 'તીથલ રોડ, સરદાર હાઇટ્સ સામે, વલસાડ' },
  brand_owner: { en: 'Mohit Vachhani', gu: 'મોહિત વછ્છાણી' },
  brand_phone: { en: '97122 11599', gu: '૯૭૧૨૨ ૧૧૫૯૯' },

  // Navbar
  nav_home: { en: 'Home', gu: 'હોમ' },
  nav_menu: { en: 'Menu', gu: 'મેનુ' },
  nav_track: { en: 'Track Order', gu: 'ટ્રેક ઓર્ડર' },
  nav_contact: { en: 'Contact', gu: 'સંપર્ક' },
  nav_reviews: { en: 'Reviews', gu: 'રિવ્યુ' },
  nav_cart: { en: 'Cart', gu: 'કાર્ટ' },
  nav_admin: { en: 'Admin', gu: 'એડમિન' },

  // Hero
  hero_title: { en: "Doctor's Gola", gu: 'ડૉક્ટરના ગોળા' },
  hero_subtitle: { en: 'Experience 20+ flavors of pure refreshment', gu: '20+ ફ્લેવરનો ઠંડક ભર્યો આનંદ માણો' },
  hero_cta: { en: 'Explore Menu', gu: 'મેનુ જુઓ' },
  hero_order: { en: 'Order Now', gu: 'ઓર્ડર કરો' },

  // Sections
  sec_specials: { en: '⭐ Dr. Special Collection', gu: '⭐ ડૉ. સ્પેશિયલ કલેક્શન' },
  sec_specials_sub: { en: 'Our signature premium golas — ₹250 each', gu: 'અમારા સિગ્નેચર પ્રીમિયમ ગોળા — ₹250 દરેક' },
  sec_flavors: { en: '🍧 Our Flavors', gu: '🍧 અમારા ફ્લેવર્સ' },
  sec_flavors_sub: { en: 'Choose from 20 amazing flavors', gu: '20 અમેઝિંગ ફ્લેવર્સમાંથી પસંદ કરો' },
  sec_why: { en: 'Why Choose Us?', gu: 'અમને કેમ પસંદ કરો?' },
  sec_reviews: { en: '💬 Customer Reviews', gu: '💬 ગ્રાહક રિવ્યુ' },
  sec_reviews_sub: { en: 'What our customers say', gu: 'અમારા ગ્રાહકો શું કહે છે' },

  // Why us features
  why_water: { en: 'Pure & Fresh Mineral Water', gu: 'શુદ્ધ અને ફ્રેશ મિનરલ વોટર' },
  why_syrup: { en: 'Khada Sakar Syrup', gu: 'ખડી સાકરની ચાસણી' },
  why_flavours: { en: 'Natural Flavours', gu: 'નેચરલ ફ્લેવર્સ' },
  why_hygiene: { en: 'Hygienic & Fast', gu: 'હાઈજેનિક અને ફાસ્ટ' },
  why_mood: { en: 'Mood Booster', gu: 'મૂડ બૂસ્ટર' },
  why_color: { en: 'No Added Colour', gu: 'કોઈ કૃત્રિમ કલર નહિ' },
  why_preservative: { en: 'No Preservatives', gu: 'કોઈ પ્રિઝર્વેટિવ્સ નહિ' },

  // Menu page
  menu_title: { en: 'Our Menu', gu: 'અમારું મેનુ' },
  menu_all: { en: 'All Flavors', gu: 'બધા ફ્લેવર' },
  menu_specials: { en: 'Dr. Special', gu: 'ડૉ. સ્પેશિયલ' },
  menu_stick: { en: 'Stick Gola', gu: 'સ્ટીક ગોળા' },
  menu_search: { en: 'Search flavors...', gu: 'ફ્લેવર શોધો...' },
  menu_customize: { en: 'Customize & Add', gu: 'કસ્ટમાઈઝ કરો' },
  menu_add_cart: { en: 'Add to Cart', gu: 'કાર્ટમાં ઉમેરો' },
  menu_select_size: { en: 'Select Size', gu: 'સાઈઝ પસંદ કરો' },
  menu_select_toppings: { en: 'Add Toppings (Optional)', gu: 'ટોપિંગ ઉમેરો (ઐચ્છિક)' },
  menu_skip_toppings: { en: 'Skip – No Toppings', gu: 'સ્કિપ – ટોપિંગ વગર' },
  menu_qty: { en: 'Quantity', gu: 'જથ્થો' },
  menu_total: { en: 'Total', gu: 'કુલ' },
  menu_each: { en: 'each', gu: 'દરેક' },
  menu_parcel_note: { en: 'Parcel charge ₹10 extra', gu: 'પાર્સલ ચાર્જ ₹10 એક્સ્ટ્રા' },

  // Cart
  cart_title: { en: 'Your Cart', gu: 'તમારી કાર્ટ' },
  cart_empty: { en: 'Your cart is empty', gu: 'તમારી કાર્ટ ખાલી છે' },
  cart_empty_sub: { en: 'Add some delicious golas from our menu!', gu: 'અમારા મેનુમાંથી સ્વાદિષ્ટ ગોળા ઉમેરો!' },
  cart_browse: { en: 'Browse Menu', gu: 'મેનુ જુઓ' },
  cart_subtotal: { en: 'Subtotal', gu: 'સબટોટલ' },
  cart_parcel: { en: 'Parcel Charge', gu: 'પાર્સલ ચાર્જ' },
  cart_total: { en: 'Total', gu: 'કુલ' },
  cart_remove: { en: 'Remove', gu: 'દૂર કરો' },

  // Checkout
  checkout_title: { en: 'Checkout', gu: 'ચેકઆઉટ' },
  checkout_name: { en: 'Your Name', gu: 'તમારું નામ' },
  checkout_phone: { en: 'Phone Number', gu: 'ફોન નંબર' },
  checkout_type: { en: 'Order Type', gu: 'ઓર્ડર પ્રકાર' },
  checkout_pickup: { en: 'Pickup from Shop', gu: 'દુકાનથી પિકઅપ' },
  checkout_delivery: { en: 'Delivery (₹10 extra)', gu: 'ડિલિવરી (₹10 એક્સ્ટ્રા)' },
  checkout_address: { en: 'Delivery Address', gu: 'ડિલિવરી એડ્રેસ' },
  checkout_payment: { en: 'Payment Method', gu: 'પેમેન્ટ પદ્ધતિ' },
  checkout_cash: { en: 'Cash on Pickup/Delivery', gu: 'કૅશ ઓન પિકઅપ/ડિલિવરી' },
  checkout_qr: { en: 'QR Code (Scan at Shop)', gu: 'QR કોડ (દુકાને સ્કેન કરો)' },
  checkout_upi: { en: 'UPI / Google Pay', gu: 'UPI / ગૂગલ પે' },
  checkout_place: { en: 'Place Order', gu: 'ઓર્ડર આપો' },
  checkout_success: { en: 'Order Placed Successfully!', gu: 'ઓર્ડર સફળતાપૂર્વક થયો!' },
  checkout_order_id: { en: 'Order ID', gu: 'ઓર્ડર ID' },

  // Contact
  contact_title: { en: 'Contact Us', gu: 'સંપર્ક કરો' },
  contact_visit: { en: 'Visit Our Shop', gu: 'અમારી દુકાનની મુલાકાત લો' },
  contact_call: { en: 'Call Us', gu: 'અમને કૉલ કરો' },
  contact_hours: { en: 'Opening Hours', gu: 'ખુલ્લાનો સમય' },
  contact_hours_val: { en: '10:00 AM – 10:00 PM (Daily)', gu: '10:00 AM – 10:00 PM (દરરોજ)' },
  contact_form_title: { en: 'Send us a Message', gu: 'અમને મેસેજ મોકલો' },
  // Form Placeholders
  form_name: { en: 'Your Name', gu: 'તમારું નામ' },
  form_phone: { en: 'Phone Number (10 digits)', gu: 'ફોન નંબર (૧૦ આંકડા)' },
  contact_form_msg: { en: 'Your Message', gu: 'તમારો મેસેજ' },
  contact_form_send: { en: 'Send Message', gu: 'મેસેજ મોકલો' },
  contact_whatsapp: { en: 'Chat on WhatsApp', gu: 'WhatsApp પર ચેટ કરો' },

  // Reviews
  review_add: { en: 'Write a Review', gu: 'રિવ્યુ લખો' },
  review_name: { en: 'Your Name', gu: 'તમારું નામ' },
  review_comment: { en: 'Your Review', gu: 'તમારો રિવ્યુ' },
  review_submit: { en: 'Submit Review', gu: 'રિવ્યુ મોકલો' },
  review_rating: { en: 'Rating', gu: 'રેટિંગ' },

  // Admin
  admin_title: { en: 'Admin Panel', gu: 'એડમિન પેનલ' },
  admin_login: { en: 'Admin Login', gu: 'એડમિન લૉગિન' },
  admin_password: { en: 'Enter Password', gu: 'પાસવર્ડ દાખલ કરો' },
  admin_enter: { en: 'Login', gu: 'લૉગિન' },
  admin_logout: { en: 'Logout', gu: 'લૉગઆઉટ' },
  admin_dashboard: { en: 'Dashboard', gu: 'ડેશબોર્ડ' },
  admin_orders: { en: 'Orders', gu: 'ઓર્ડર્સ' },
  admin_reviews: { en: 'Reviews', gu: 'રિવ્યુ' },
  admin_contacts: { en: 'Messages', gu: 'મેસેજ' },
  admin_today_orders: { en: "Today's Orders", gu: 'આજના ઓર્ડર્સ' },
  admin_today_revenue: { en: "Today's Revenue", gu: 'આજની આવક' },
  admin_total_orders: { en: 'Total Orders', gu: 'કુલ ઓર્ડર્સ' },
  admin_total_revenue: { en: 'Total Revenue', gu: 'કુલ આવક' },
  admin_top_flavors: { en: 'Top Flavors', gu: 'ટોપ ફ્લેવર્સ' },
  admin_status_pending: { en: 'Pending', gu: 'પેન્ડિંગ' },
  admin_status_processing: { en: 'Processing', gu: 'પ્રોસેસિંગ' },
  admin_status_ready: { en: 'Ready', gu: 'તૈયાર' },
  admin_status_completed: { en: 'Completed', gu: 'પૂર્ણ' },
  admin_delete: { en: 'Delete', gu: 'ડિલીટ' },
  admin_wrong_pass: { en: 'Wrong password!', gu: 'ખોટો પાસવર્ડ!' },

  // Footer
  footer_rights: { en: '© 2026 Dr Na Gola. All rights reserved.', gu: '© 2026 ડૉક્ટરના ગોળા. સર્વાધિકાર સુરક્ષિત.' },
  footer_made: { en: 'Made with ❤️ in Valsad', gu: 'વલસાડમાં ❤️ થી બનાવેલ' },

  // Common
  common_close: { en: 'Close', gu: 'બંધ' },
  common_loading: { en: 'Loading...', gu: 'લોડ થઈ રહ્યું છે...' },
  common_rupee: { en: '₹', gu: '₹' },
  common_order_now: { en: 'Order Now', gu: 'ઓર્ડર કરો' },
  common_view_menu: { en: 'View Full Menu', gu: 'પૂરું મેનુ જુઓ' },
  common_back_home: { en: 'Back to Home', gu: 'હોમ પર પાછા જાઓ' },
};

// Language state
let currentLang = localStorage.getItem('dr-gola-lang') || 'gu';

function t(key) {
  return T[key] ? (T[key][currentLang] || T[key]['en']) : key;
}

function tObj(obj) {
  return obj[currentLang] || obj['en'];
}

function setLang(lang) {
  currentLang = lang;
  localStorage.setItem('dr-gola-lang', lang);
  document.documentElement.setAttribute('lang', lang === 'gu' ? 'gu' : 'en');
  updateAllText();
}

function toggleLang() {
  setLang(currentLang === 'en' ? 'gu' : 'en');
}

function updateAllText() {
  document.querySelectorAll('[data-t]').forEach(el => {
    const key = el.getAttribute('data-t');
    if (T[key]) {
      if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
        el.placeholder = T[key][currentLang] || T[key]['en'];
      } else {
        el.textContent = T[key][currentLang] || T[key]['en'];
      }
    }
  });
  // Update lang button
  const langBtn = document.getElementById('langToggleBtn');
  if (langBtn) {
    langBtn.innerHTML = currentLang === 'en'
      ? '🇮🇳 ગુજરાતી'
      : '🇬🇧 English';
  }
}

// =============================================
// Premium Default Reviews (Social Proof)
// =============================================
const DEFAULT_REVIEWS = [
  {
    name: "Mohit Vachhani",
    nameEn: "Mohit Vachhani",
    rating: 5,
    comment: "The absolute best gola in Valsad! The Rajbhog and Double Dryfruit are perfectly sweet, loaded with nuts, and the ice is so soft. A premium experience.",
    commentEn: "The absolute best gola in Valsad! The Rajbhog and Double Dryfruit are perfectly sweet, loaded with nuts, and the ice is so soft. A premium experience.",
    timestamp: Date.now() - 86400000 * 2,
    isDefault: true
  }
];
