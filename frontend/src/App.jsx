import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import { AuthProvider } from './contexts/AuthContext'
import { ThemeProvider } from './contexts/ThemeContext'
import ProtectedRoute from './components/ProtectedRoute'
import ErrorBoundary from './components/ErrorBoundary'
import Toast from './components/Toast'
import { setupGlobalErrorHandler } from './utils/errorHandler'

// Landing / Intro
import Intro from './pages/Intro'
import Welcome from './pages/Welcome'

// Auth Pages
import Login from './pages/Login'
import Signup from './pages/Signup'

// Admin Pages
import AdminDashboard from './pages/admin/Dashboard'
import AdminRealtimeDashboard from './pages/admin/RealtimeDashboard'
import AdminProducts from './pages/admin/Products'
import AdminFloors from './pages/admin/Floors'
import AdminTables from './pages/admin/Tables'
import AdminPayments from './pages/admin/Payments'
import AdminReports from './pages/admin/Reports'
import AdminSettings from './pages/admin/Settings'
import AdminFeedback from './pages/admin/Feedback'

// Cashier Pages
import CashierDashboard from './pages/cashier/Dashboard'
import CashierOrders from './pages/cashier/Orders'
import CashierFloor from './pages/cashier/Floor'
import CashierSession from './pages/cashier/Session'
import CashierRegister from './pages/cashier/Register'

// Customer Pages (Public — no login required)
import CustomerFloors from './pages/customer/Floors'
import CustomerMenu from './pages/customer/Menu'
import CustomerCart from './pages/customer/Cart'
import CustomerPaymentPage from './pages/customer/PaymentPage'
import CustomerOrderTrackingPage from './pages/customer/OrderTrackingPage'
import CustomerFeedback from './pages/customer/Feedback'

// Kitchen Pages
import KitchenDisplay from './pages/kitchen/Display'

function App() {
  useEffect(() => {
    setupGlobalErrorHandler()
  }, [])

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <Router>
          <AuthProvider>
            <Toast />
            <Routes>
              {/* ═══ Landing: Login Page ═══ */}
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />

              {/* ═══ Intro + Marketing Landing ═══ */}
              <Route path="/" element={<Intro />} />
              <Route path="/welcome" element={<Welcome />} />

              {/* ═══ Customer Routes ═══ (Public — no auth required) */}
              <Route path="/customer/select-floor" element={<CustomerFloors />} />
              <Route path="/customer/browse-menu" element={<CustomerMenu />} />
              <Route path="/customer/shopping-cart" element={<CustomerCart />} />
              <Route path="/customer/checkout" element={<CustomerPaymentPage />} />
              <Route path="/customer/order-tracking" element={<CustomerOrderTrackingPage />} />
              <Route path="/customer/feedback" element={<CustomerFeedback />} />

              {/* Legacy customer routes → redirect to new routes */}
              <Route path="/customer/floors" element={<Navigate to="/customer/select-floor" replace />} />
              <Route path="/customer/menu" element={<Navigate to="/customer/browse-menu" replace />} />
              <Route path="/customer/cart" element={<Navigate to="/customer/shopping-cart" replace />} />
              <Route path="/customer/payment" element={<Navigate to="/customer/checkout" replace />} />
              <Route path="/customer/orders" element={<Navigate to="/customer/order-tracking" replace />} />
              <Route path="/customer/tables" element={<Navigate to="/customer/select-floor" replace />} />

              {/* ═══ Admin Routes ═══ (Protected) */}
              <Route path="/admin/dashboard" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />
              <Route path="/admin/realtime" element={<ProtectedRoute allowedRoles={['admin']}><AdminRealtimeDashboard /></ProtectedRoute>} />
              <Route path="/admin/products" element={<ProtectedRoute allowedRoles={['admin']}><AdminProducts /></ProtectedRoute>} />
              <Route path="/admin/floors" element={<ProtectedRoute allowedRoles={['admin']}><AdminFloors /></ProtectedRoute>} />
              <Route path="/admin/tables" element={<ProtectedRoute allowedRoles={['admin']}><AdminTables /></ProtectedRoute>} />
              <Route path="/admin/payments" element={<ProtectedRoute allowedRoles={['admin']}><AdminPayments /></ProtectedRoute>} />
              <Route path="/admin/reports" element={<ProtectedRoute allowedRoles={['admin']}><AdminReports /></ProtectedRoute>} />
              <Route path="/admin/settings" element={<ProtectedRoute allowedRoles={['admin']}><AdminSettings /></ProtectedRoute>} />
              <Route path="/admin/feedback" element={<ProtectedRoute allowedRoles={['admin']}><AdminFeedback /></ProtectedRoute>} />

              {/* ═══ Cashier Routes ═══ (Protected) */}
              <Route path="/cashier/dashboard" element={<ProtectedRoute allowedRoles={['cashier']}><CashierDashboard /></ProtectedRoute>} />
              <Route path="/cashier/orders" element={<ProtectedRoute allowedRoles={['cashier']}><CashierOrders /></ProtectedRoute>} />
              <Route path="/cashier/floor" element={<ProtectedRoute allowedRoles={['cashier']}><CashierFloor /></ProtectedRoute>} />
              <Route path="/cashier/session" element={<ProtectedRoute allowedRoles={['cashier']}><CashierSession /></ProtectedRoute>} />
              <Route path="/cashier/register" element={<ProtectedRoute allowedRoles={['cashier']}><CashierRegister /></ProtectedRoute>} />

              {/* ═══ Kitchen Routes ═══ (Protected) */}
              <Route path="/kitchen/display" element={<ProtectedRoute allowedRoles={['kitchen']}><KitchenDisplay /></ProtectedRoute>} />

              {/* ═══ Default → Intro ═══ */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </AuthProvider>
        </Router>
      </ThemeProvider>
    </ErrorBoundary>
  )
}

export default App
