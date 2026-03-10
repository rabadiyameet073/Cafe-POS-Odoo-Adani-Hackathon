import { api } from '../utils/api'

// Auth Services
export const authService = {
  login: (credentials) => api.post('/auth/login', credentials),
  signup: (userData) => api.post('/auth/signup', userData),
  logout: () => api.post('/auth/logout'),
  getCurrentUser: () => api.get('/auth/me'),
  refreshToken: () => api.post('/auth/refresh')
}

// User Services
export const userService = {
  getAllUsers: () => api.get('/users'),
  getUserById: (id) => api.get(`/users/${id}`),
  createUser: (userData) => api.post('/users', userData),
  updateUser: (id, userData) => api.put(`/users/${id}`, userData),
  deleteUser: (id) => api.delete(`/users/${id}`),
  updatePassword: (id, passwordData) => api.patch(`/users/${id}/password`, passwordData)
}

// Floor Services
export const floorService = {
  getAllFloors: () => api.get('/floors'),
  getFloorById: (id) => api.get(`/floors/${id}`),
  createFloor: (floorData) => api.post('/floors', floorData),
  updateFloor: (id, floorData) => api.put(`/floors/${id}`, floorData),
  deleteFloor: (id) => api.delete(`/floors/${id}`)
}

// Table Services
export const tableService = {
  getAllTables: () => api.get('/tables'),
  getAvailableTables: () => api.get('/tables/available'),
  getTablesByFloor: (floorId) => api.get(`/tables/floor/${floorId}`),
  getTableById: (id) => api.get(`/tables/${id}`),
  createTable: (tableData) => api.post('/tables', tableData),
  updateTable: (id, tableData) => api.put(`/tables/${id}`, tableData),
  updateTableStatus: (id, status) => api.patch(`/tables/${id}/status`, { status }),
  deleteTable: (id) => api.delete(`/tables/${id}`)
}

// Category Services
export const categoryService = {
  getAllCategories: () => api.get('/categories'),
  getCategoryById: (id) => api.get(`/categories/${id}`),
  createCategory: (categoryData) => api.post('/categories', categoryData),
  updateCategory: (id, categoryData) => api.put(`/categories/${id}`, categoryData),
  deleteCategory: (id) => api.delete(`/categories/${id}`)
}

// Product Services
export const productService = {
  getAllProducts: () => api.get('/products'),
  getProductsByCategory: (categoryId) => api.get(`/products/category/${categoryId}`),
  getProductById: (id) => api.get(`/products/${id}`),
  createProduct: (productData) => api.post('/products', productData),
  updateProduct: (id, productData) => api.put(`/products/${id}`, productData),
  toggleAvailability: (id) => api.patch(`/products/${id}/availability`),
  deleteProduct: (id) => api.delete(`/products/${id}`),
  getProductVariants: (id) => api.get(`/products/${id}/variants`),
  createVariant: (id, variantData) => api.post(`/products/${id}/variants`, variantData),
  updateVariant: (id, variantId, variantData) => api.put(`/products/${id}/variants/${variantId}`, variantData),
  deleteVariant: (id, variantId) => api.delete(`/products/${id}/variants/${variantId}`)
}

// Cart Services (table-token based, backed by Supabase)
export const cartService = {
  addToCart: (payload) => api.post('/cart/add', payload),
  getCartByToken: (tableToken) => api.get(`/cart/${tableToken}`),
  removeItem: (tableToken, itemId) => api.delete(`/cart/${tableToken}/item/${itemId}`),
  clearCart: (tableToken) => api.delete(`/cart/${tableToken}`)
}

// Order Services
export const orderService = {
  getAllOrders: () => api.get('/orders'),
  getCustomerOrders: (customerId) => api.get(`/orders/customer/${customerId}`),
  getSessionOrders: (sessionId) => api.get(`/orders/session/${sessionId}`),
  getOrderById: (id) => api.get(`/orders/${id}`),
  createOrder: (orderData) => api.post('/orders', orderData),
  // Token-based order creation from backend cart (new real-time flow)
  createOrderFromCart: (payload) => api.post('/orders/create', payload),
  updateOrder: (id, orderData) => api.put(`/orders/${id}`, orderData),
  addOrderItem: (id, itemData) => api.post(`/orders/${id}/items`, itemData),
  removeOrderItem: (id, itemId) => api.delete(`/orders/${id}/items/${itemId}`),
  sendToKitchen: (id) => api.post(`/orders/${id}/send-to-kitchen`),
  updateOrderStatus: (id, status) => api.patch(`/orders/${id}/status`, { status }),
  cancelOrder: (id) => api.post(`/orders/${id}/cancel`)
}

// Payment Services
export const paymentService = {
  getAllPayments: () => api.get('/payments'),
  getPaymentById: (id) => api.get(`/payments/${id}`),
  getOrderPayments: (orderId) => api.get(`/payments/order/${orderId}`),
  createPayment: (paymentData) => api.post('/payments', paymentData),
  updatePaymentStatus: (id, status) => api.patch(`/payments/${id}/status`, { status }),
  getPaymentMethods: () => api.get('/payments/methods'),
  createPaymentMethod: (methodData) => api.post('/payments/methods', methodData),
  updatePaymentMethod: (id, methodData) => api.put(`/payments/methods/${id}`, methodData),
  createRazorpayOrder: (orderData) => api.post('/payments/create-razorpay-order', orderData),
  verifyRazorpay: (verifyData) => api.post('/payments/verify-razorpay', verifyData),
  createCashRequest: (data) => api.post('/payments/cash/request', data)
}

// Session Services
export const sessionService = {
  getAllSessions: () => api.get('/sessions'),
  getActiveSession: () => api.get('/sessions/active'),
  getSessionById: (id) => api.get(`/sessions/${id}`),
  openSession: (sessionData) => api.post('/sessions/open', sessionData),
  closeSession: (id, closingData) => api.post(`/sessions/${id}/close`, closingData),
  getSessionSummary: (id) => api.get(`/sessions/${id}/summary`)
}

// Kitchen Services
export const kitchenService = {
  getKitchenOrders: () => api.get('/kitchen/orders'),
  getKitchenOrderById: (id) => api.get(`/kitchen/orders/${id}`),
  updateKitchenStage: (id, stage) => api.patch(`/kitchen/orders/${id}/stage`, { stage }),
  markItemPrepared: (orderId, itemId) => api.patch(`/kitchen/orders/${orderId}/items/${itemId}/prepared`)
}

// Feedback Services
export const feedbackService = {
  getAllFeedback: () => api.get('/feedback'),
  getFeedbackById: (id) => api.get(`/feedback/${id}`),
  createFeedback: (feedbackData) => api.post('/feedback', feedbackData),
  getOrderFeedback: (orderId) => api.get(`/feedback/order/${orderId}`)
}

// Report Services
export const reportService = {
  getSalesReport: (params) => api.get('/reports/sales', { params }),
  getProductReport: (params) => api.get('/reports/products', { params }),
  getPaymentReport: (params) => api.get('/reports/payments', { params }),
  getCashierReport: (params) => api.get('/reports/cashier', { params }),
  exportReport: (type, params) => api.get(`/reports/export/${type}`, { params, responseType: 'blob' })
}
