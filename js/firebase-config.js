// ============================================
// Firebase Configuration - Doctor Na Gola
// ============================================

const firebaseConfig = {
  apiKey: "AIzaSyAkV15rkVY0ZhxF2NgWXrv7nr6L3f34UGM",
  authDomain: "drnagola-3983c.firebaseapp.com",
  databaseURL: "https://drnagola-3983c-default-rtdb.firebaseio.com",
  projectId: "drnagola-3983c",
  storageBucket: "drnagola-3983c.firebasestorage.app",
  messagingSenderId: "259679573098",
  appId: "1:259679573098:web:0e064386732ef5a43be613",
  measurementId: "G-TZT6EBNBKH"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// Helper functions for Firebase operations
const DB = {
  // Orders
  pushOrder(order) {
    return db.ref('orders').push(order);
  },
  listenOrders(callback) {
    db.ref('orders').orderByChild('timestamp').on('value', snap => {
      const orders = [];
      snap.forEach(child => {
        orders.push({ id: child.key, ...child.val() });
      });
      callback(orders.reverse());
    });
  },
  updateOrderStatus(orderId, status) {
    return db.ref(`orders/${orderId}`).update({ status });
  },
  deleteOrder(orderId) {
    return db.ref(`orders/${orderId}`).remove();
  },

  // Reviews
  pushReview(review) {
    return db.ref('reviews').push(review);
  },
  listenReviews(callback) {
    db.ref('reviews').orderByChild('timestamp').on('value', snap => {
      const reviews = [];
      snap.forEach(child => {
        reviews.push({ id: child.key, ...child.val() });
      });
      callback(reviews.reverse());
    });
  },
  deleteReview(reviewId) {
    return db.ref(`reviews/${reviewId}`).remove();
  },

  // Analytics
  async incrementDailyStats(total) {
    const today = new Date().toISOString().split('T')[0];
    const orderRef = db.ref(`analytics/dailyOrders/${today}`);
    const revenueRef = db.ref(`analytics/dailyRevenue/${today}`);
    
    const orderSnap = await orderRef.once('value');
    await orderRef.set((orderSnap.val() || 0) + 1);
    
    const revenueSnap = await revenueRef.once('value');
    await revenueRef.set((revenueSnap.val() || 0) + total);
  },
  listenAnalytics(callback) {
    db.ref('analytics').on('value', snap => {
      callback(snap.val() || {});
    });
  },

  // Contact messages
  pushContact(msg) {
    return db.ref('contacts').push(msg);
  },
  listenContacts(callback) {
    db.ref('contacts').on('value', snap => {
      const msgs = [];
      snap.forEach(child => {
        msgs.push({ id: child.key, ...child.val() });
      });
      callback(msgs.reverse());
    });
  },

  // Initialize default reviews if none exist
  async initDefaults() {
    const snap = await db.ref('reviews').once('value');
    if (!snap.exists()) {
      const defaults = [
        { name: 'રાહુલ પટેલ', nameEn: 'Rahul Patel', rating: 5, comment: 'વલસાડનો બેસ્ટ ગોળા! ડૉ. સ્પેશિયલ ટ્રાય કરો!', commentEn: 'Best gola in Valsad! Must try Dr. Special!', timestamp: Date.now() - 86400000 * 5, isDefault: true },
        { name: 'પ્રિયા શાહ', nameEn: 'Priya Shah', rating: 5, comment: 'રસમલાઈ ફ્લેવર એકદમ ફેવરિટ! ફ્રેશ અને ટેસ્ટી!', commentEn: 'Rasmalai flavor is my absolute favorite! Fresh and tasty!', timestamp: Date.now() - 86400000 * 4, isDefault: true },
        { name: 'અમિત જોશી', nameEn: 'Amit Joshi', rating: 4, comment: 'પ્રીમિયમ ગોળા ખરેખર પ્રીમિયમ છે! ગુલકંદ ટોપિંગ અમેઝિંગ!', commentEn: 'Premium gola is truly premium! Gulkand topping is amazing!', timestamp: Date.now() - 86400000 * 3, isDefault: true },
        { name: 'નેહા દેસાઈ', nameEn: 'Neha Desai', rating: 5, comment: 'બાળકો માટે સ્ટીક ગોળા પરફેક્ટ! બધા ફ્લેવર સરસ!', commentEn: 'Stick gola is perfect for kids! All flavors are great!', timestamp: Date.now() - 86400000 * 2, isDefault: true },
        { name: 'વિકાસ મહેતા', nameEn: 'Vikas Mehta', rating: 5, comment: 'ડબલ ડ્રાઈફ્રૂટ સ્પેશિયલ ₹250 માં પૂરા પૈસા વસૂલ!', commentEn: 'Double Dryfruit Special is total value for money at ₹250!', timestamp: Date.now() - 86400000, isDefault: true },
      ];
      defaults.forEach(r => db.ref('reviews').push(r));
    }
    
    // Seed Products if none exist
    const prodSnap = await db.ref('products').once('value');
    if (!prodSnap.exists()) {
      if (typeof FLAVORS !== 'undefined') {
        FLAVORS.forEach(f => db.ref('products').push({ ...f, isSpecial: false }));
      }
      if (typeof SPECIALS !== 'undefined') {
        SPECIALS.forEach(s => db.ref('products').push({ ...s, isSpecial: true }));
      }
    }
  },

  // Products (CMS)
  pushProduct(product) {
    return db.ref('products').push(product);
  },
  updateProduct(productId, product) {
    return db.ref(`products/${productId}`).update(product);
  },
  listenProducts(callback) {
    db.ref('products').on('value', snap => {
      const products = [];
      snap.forEach(child => {
        products.push({ dbId: child.key, ...child.val() });
      });
      callback(products);
    });
  },
  deleteProduct(productId) {
    return db.ref(`products/${productId}`).remove();
  },

  // Global Notifications (CMS)
  pushNotification(notif) {
    return db.ref('notifications').push(notif);
  },
  listenNotifications(callback) {
    db.ref('notifications').orderByChild('timestamp').limitToLast(1).on('value', snap => {
      let notif = null;
      snap.forEach(child => {
        notif = { id: child.key, ...child.val() };
      });
      callback(notif);
    });
  }
};
