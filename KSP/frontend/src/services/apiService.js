import api from './api';

export const authService = {
  register: (userData) => api.post('/auth/register', userData),
  login: (email, password) => api.post('/auth/login', { email, password }),
  logout: () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
  },
  getCurrentUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },
  setAuthToken: (token, user) => {
    localStorage.setItem('authToken', token);
    localStorage.setItem('user', JSON.stringify(user));
  },
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (profileData) => api.put('/auth/profile', profileData),
  changePassword: (currentPassword, newPassword) => api.put('/auth/change-password', { currentPassword, newPassword }),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  verifyResetCode: (email, code) => api.post('/auth/verify-reset-code', { email, code }),
  resetPassword: (email, code, newPassword) => api.post('/auth/reset-password', { email, code, newPassword }),
};

export const productService = {
  getAllProducts: (params) => api.get('/products', { params }),
  getProductById: (id) => api.get(`/products/${id}`),
  searchProducts: (query) => api.get('/products/search', { params: { q: query } }),
};

export const cartService = {
  getCart: () => api.get('/cart'),
  addToCart: (productId, quantity) => api.post('/cart', { productId, quantity }),
  updateCartItem: (productId, quantity) => api.put(`/cart/${productId}`, { quantity }),
  removeFromCart: (productId) => api.delete(`/cart/${productId}`),
  clearCart: () => api.delete('/cart'),
};

export const orderService = {
  getOrders: () => api.get('/orders'),
  getOrderById: (orderId) => api.get(`/orders/${orderId}`),
  createOrder: (orderData) => api.post('/orders', orderData),
  createDirectOrder: (orderData) => api.post('/orders/direct', orderData),
  cancelOrder: (orderId) => api.put(`/orders/${orderId}/cancel`),
};

export const paymentService = {
  getPaymentStatus: (orderId) => api.get(`/payments/${orderId}`),
};

export const subscriptionService = {
  subscribe: () => api.post('/subscriptions/subscribe'),
};

export const subscriberBroadcastService = {
  sendBroadcast: (payload) => api.post('/admin/subscriptions/broadcast', payload),
};

export const subscriberListService = {
  getSubscribers: () => api.get('/admin/subscriptions/subscribers'),
};

export const adminService = {
  // Products
  createProduct: (productData) => api.post('/admin/products', productData),
  updateProduct: (id, productData) => api.put(`/admin/products/${id}`, productData),
  deleteProduct: (id) => api.delete(`/admin/products/${id}`),
  getInventory: () => api.get('/admin/products/inventory'),
  
  // Orders
  getAllOrders: (params) => api.get('/admin/orders', { params }),
  updateOrderStatus: (orderId, status) => api.put(`/admin/orders/${orderId}/status`, { status }),
  deleteOrder: (orderId) => api.delete(`/admin/orders/${orderId}`),
  updateTracking: (orderId, trackingData) => api.put(`/admin/orders/${orderId}/tracking`, trackingData),
  verifyPayment: (orderId, action, reason) => api.put(`/admin/orders/${orderId}/verify-payment`, { action, reason }),
  getPendingVerificationOrders: () => api.get('/admin/orders/pending-verification'),
  
  // Users
  getAllUsers: (params) => api.get('/admin/users', { params }),
  updateUserRole: (userId, role) => api.put(`/admin/users/${userId}/role`, { role }),
  updateUserStatus: (userId, isActive) => api.put(`/admin/users/${userId}/status`, { isActive }),
  
  // Reports
  getSalesReport: (params) => api.get('/admin/reports/sales', { params }),
  getRevenueReport: (params) => api.get('/admin/reports/revenue', { params }),
  getCustomersReport: (params) => api.get('/admin/reports/customers', { params }),
  getInventoryReport: (params) => api.get('/admin/reports/inventory', { params }),
};

export const reviewService = {
  getProductReviews: (productId, params) => api.get(`/reviews/product/${productId}`, { params }),
  submitReview: (reviewData) => api.post('/reviews', reviewData),
  updateReview: (reviewId, reviewData) => api.put(`/reviews/${reviewId}`, reviewData),
  deleteReview: (reviewId) => api.delete(`/reviews/${reviewId}`),
  getMyReviews: (params) => api.get('/reviews/user/my-reviews', { params }),
  getLatestReviews: (limit = 5) => api.get('/reviews/latest', { params: { limit } }),
};
